## Context

Reword Stories polishes machine-translated chapters via async jobs. The current implementation (including the in-flight `per-chunk-queue-messages` refactor) uses `@vercel/queue` with a push consumer, per-chunk messages, predecessor deferral, and manual rollup logic.

The user wants **Vercel Workflows** instead: each workflow run is called a **job**, and each **translation** gets one job that:

1. Sets translation to in-progress (`PROCESSING`)
2. Processes chunks **sequentially** by `chunkIndex`
3. Rate-limits to **3 polish operations per minute within the job only**
4. **Stops immediately** on first chunk failure and updates translation status
5. Finalizes translation after the last chunk succeeds

Existing pieces to reuse: Prisma models, `splitIntoChunks`, `assemblePolishedContent`, `extractOverlapContext`, `getProvider().polish()`, tRPC router, UI polling.

## Goals / Non-Goals

**Goals:**

- One `translationJob(translationId)` workflow per translation run
- **Global limit: one active job at a time** across all translations; other jobs wait (workflow `sleep` loop) until the slot is free
- Sequential chunk processing with overlap from previous chunk's DB row
- In-job rate limit: max 3 chunk polish steps per 60-second window
- Fail-fast: no further chunks after first failure
- Manual retry only (`FatalError` on LLM errors — no Workflow step auto-retry)
- Start job from `create`, `retry`, and `retryChunk`
- Observable runs in Vercel dashboard (Observability → Workflows)

**Non-Goals:**

- Workflow hooks / human approval
- Storing `workflowRunId` on Translation row in v1 (optional follow-up)
- Automated tests
- Bulk translate-all

## Decisions

### 1. Workflow SDK setup

**Decision:** Install `workflow` package and wrap `next.config.ts`:

```typescript
import { withWorkflow } from "workflow/next"
export default withWorkflow(nextConfig)
```

Start jobs from server code (tRPC mutations) via:

```typescript
import { start } from "workflow/api"
import { translationJob } from "@/workflows/translation-job"

await start(translationJob, [translationId])
```

**Rationale:** Official Next.js integration; `start()` is non-blocking like queue publish.

### 2. Job structure

**Decision:** Single workflow function `translationJob(translationId: string)` with discrete steps:

| Step | Responsibility |
|------|----------------|
| `markTranslationProcessing` | Translation → `PROCESSING`, clear `errorMessage` |
| `loadChunksForJob` | Return ordered chunk ids + metadata for workflow loop |
| `polishChunkStep` | One LLM call + DB update for a single chunk (per chunk invocation) |
| `finalizeTranslationStep` | Assemble `polishedContent`, translation → `COMPLETED` |
| `failTranslationStep` | Translation → `FAILED` with aggregate message |

Workflow orchestration (in `"use workflow"` function):

```
// Wait until no other translation is PROCESSING
while (!(await isGlobalJobSlotAvailable(translationId))):
  await sleep("10s")

markTranslationProcessing
chunks = loadChunksForJob
processedInWindow = 0
for each chunk in chunks (by chunkIndex):
  if chunk.status === COMPLETED: continue  // skip on retry with preserved work
  if processedInWindow >= 3:
    await sleep("60s")   // workflow-level only
    processedInWindow = 0
  try:
    await polishChunkStep(translationId, chunkId)
    processedInWindow++
  catch FatalError:
    await failTranslationStep(translationId, error)
    return
await finalizeTranslationStep(translationId)
```

**Rationale:** Sequential loop in workflow replaces queue chaining and predecessor gate. `sleep()` must be in workflow function body (not inside a step) per Workflow SDK rules.

**Alternative:** Child workflow per chunk — rejected; unnecessary complexity for a linear pipeline.

### 3. Global job concurrency (1 at a time)

**Decision:** At most one translation may have `status = PROCESSING` at any time system-wide.

Before `markTranslationProcessing`, the workflow polls via step `isGlobalJobSlotAvailable(translationId)`:

- Returns `true` when no translation has `status = PROCESSING`, OR only this `translationId` is `PROCESSING` (re-entrant edge case)
- Returns `false` when a **different** translation is `PROCESSING`

When `false`, the workflow `await sleep("10s")` and polls again. The waiting translation stays `QUEUED` until it acquires the slot.

`tRPC` mutations always call `start()` — no API rejection when another job is active. Jobs queue naturally via the wait loop.

**Rationale:** User requested one workflow at a time. Waiting avoids failed creates when a chapter is already polishing. DB `PROCESSING` is the lock signal.

**Alternative:** Reject `create` when busy — harsher UX; deferred.

### 4. In-job rate limit (3 per minute)

**Decision:** Track `processedInWindow` counter in the workflow function. After every 3 successful `polishChunkStep` calls, `await sleep("60s")` before the next polish.

This is a **fixed batch window** (not a rolling clock) to stay deterministic on workflow replay. Effective rate: ≤3 polishes per 60 seconds of wall time per job.

**Rationale:** Avoids `Date.now()` in workflow body (replay determinism). Simple and meets "3 per minute within a job."

**Alternative:** Rolling window with step-returned timestamps — more accurate but heavier; defer unless batch window is too coarse.

### 5. Fail-fast semantics

**Decision:**

- `polishChunkStep` catches LLM errors, marks chunk `FAILED` + `errorMessage`, then throws `FatalError` (from `workflow`) to halt the job without step auto-retry
- Workflow catches failure path, calls `failTranslationStep` to set translation `FAILED`
- Remaining chunks stay `PENDING` (not processed)

**Rationale:** User requested stop on first failure and manual retry. `FatalError` disables Workflow's default step retry.

### 6. Retry behavior

**Decision:**

| Mutation | DB reset | Job behavior |
|----------|----------|--------------|
| `create` | New translation + chunks `PENDING` | Full job |
| `retry` | `FAILED` chunks → `PENDING`, translation `QUEUED` | New job; skips `COMPLETED` chunks |
| `retryChunk` | Target chunk → `PENDING`, clears output; translation `QUEUED` | New job; skips `COMPLETED` chunks, re-processes from first non-completed |

Starting a new job for the **same** translation while it is `PROCESSING`: reject `retryChunk` with `BAD_REQUEST`. Other translations may call `start()` but their jobs wait for the global slot.

**Rationale:** One job per translation at a time; completed work preserved on partial retry. Global slot serializes across translations.

### 7. Remove queue infrastructure

**Decision:** Delete:

- `src/lib/queue/translation-queue.ts`
- `src/lib/queue/predecessor-not-ready-error.ts`
- `src/app/api/queues/process-chunk/route.ts`
- Queue trigger from `vercel.json`

Keep `src/lib/queue/log-prefix.ts` or rename to `workflow-log-prefix.ts` for consistent logging.

Refactor polish/rollup logic from `process-translation-chunk.ts` into step modules under `src/workflows/` or `src/lib/translation-job/`.

**Rationale:** Queue is fully replaced; Workflows uses Queues under the hood for step delivery.

### 8. Chunk polish step (reuse existing logic)

**Decision:** `polishChunkStep` encapsulates current consumer logic for one chunk:

1. Load chunk + translation + chapter + novel
2. Build overlap from previous chunk's `polishedSlice` (DB read — always available since sequential)
3. Call `getProvider().polish()`
4. Update chunk → `COMPLETED`, accumulate `tokenUsage`, update `progressPct`

No predecessor gate needed.

### 9. Server vs client boundaries

| Surface | Type | Change |
|---------|------|--------|
| `translationJob` workflow | Server (compiled to routes by WDK) | New |
| tRPC mutations | Server | `start()` instead of queue publish |
| Translation list polling | Client | Unchanged |
| Chapter detail UI | Client island | Unchanged |

### 10. Local development

**Decision:** Document `vercel dev` or preview deploy for workflow execution. Workflow SDK supports local discovery via `withWorkflow` local config. Add README note; optional `npx workflow web` for inspecting runs.

## Risks / Trade-offs

- **[Workflow SDK maturity]** → GA on Vercel; pin `workflow` version; test on preview before prod
- **[Step auto-retry on transient infra errors]** → Use `FatalError` for LLM failures; allow default retry only for infra (or wrap all polish errors as fatal per user preference)
- **[Waiting jobs accumulate]** → Only one runs; others sleep in workflow until slot free. UI shows them as `QUEUED` until their job acquires `PROCESSING`.
- **[Stuck PROCESSING blocks queue]** → Workflow durability should prevent orphan `PROCESSING`; manual DB fix if needed
- **[In-flight queue jobs during deploy]** → One-time migration; stale queue messages no-op after consumer removed
- **[Workflow event cost]** → ~3 events per step; monitor in Vercel Observability
- **[Supersedes per-chunk-queue-messages]** → Archive or cancel that change after this ships

## Migration Plan

1. Add `workflow` dependency and `withWorkflow()` config
2. Implement `translationJob` workflow + steps
3. Switch tRPC mutations to `start(translationJob, [translationId])`
4. Remove queue consumer, helpers, `vercel.json` queue trigger
5. Update README
6. Deploy to Vercel preview; run 3+ chunk translation end-to-end
7. Archive `per-chunk-queue-messages` change as superseded

Rollback: revert to queue consumer branch; in-flight workflow jobs may need manual translation retry.

## Open Questions

1. **Reject new job while `PROCESSING`?** → Only for `retryChunk` on the **same** translation. Other translations wait in the global slot loop.
2. **`retryChunk` on completed translation:** reset one chunk and restart job for remaining work — matches current behavior.
