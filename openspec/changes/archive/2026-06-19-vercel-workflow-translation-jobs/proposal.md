## Why

The translation pipeline currently uses raw Vercel Queues with hand-rolled orchestration: per-chunk messages, a predecessor gate for overlap ordering, queue retries, and `rollupTranslation` to derive parent status. That duplicates what Vercel Workflows provides natively — durable steps, sequential execution, and `sleep()` for pacing — while leaving awkward coupling between parallel enqueue and sequential processing.

Replacing the queue consumer with a **translation job** (one Workflow run per translation) simplifies the mental model: one job starts on create/retry, processes chunks in order, rate-limits LLM calls within that job, stops on first chunk failure, and finalizes the translation when all chunks succeed.

This change **supersedes** the in-progress `per-chunk-queue-messages` change, which solved orchestration problems at the queue layer that Workflows eliminates.

## What Changes

- **BREAKING**: Remove Vercel Queue topic `translation-chunk`, `translation-queue.ts`, and `/api/queues/process-chunk` consumer
- Add Vercel Workflow SDK (`workflow` package) and `withWorkflow()` in `next.config.ts`
- Add `translationJob` workflow — one durable run per translation
- Job steps: set translation `PROCESSING` → polish chunks sequentially by `chunkIndex` → finalize or fail translation
- **Global concurrency**: at most **one active translation job** system-wide at a time; additional jobs wait until the current job finishes
- **In-job rate limit**: at most 3 chunk polish steps per minute per job (not shared across jobs); use workflow-level `sleep()` between batches
- **Fail-fast**: first chunk failure stops the job, marks chunk `FAILED` and translation `FAILED`; remaining chunks stay `PENDING`
- **No automatic LLM retry**: chunk polish steps throw `FatalError` on LLM failure so Workflow does not auto-retry; users retry manually from UI
- `translations.create`, `retry`, and `retryChunk` start a workflow job via `start()` instead of publishing queue messages
- Overlap context preserved: each chunk step reads the previous chunk's `polishedSlice` from DB (natural with sequential steps)
- Update README pipeline docs and `vercel.json` (remove queue trigger; workflow routes use `maxDuration: 300`)

## Capabilities

### New Capabilities

- `translation-workflow`: Workflow job definition, steps, in-job rate limiting, fail-fast semantics, and observability

### Modified Capabilities

- `translation-queue`: **Replaced** by `translation-workflow` — requirements move from queue publish/consume to workflow job orchestration (delta documents removal + replacement)
- `chunk-retry`: Retry mutations start a workflow job instead of enqueueing messages
- `translation-crud`: Create/retry flows start jobs; status semantics updated for fail-fast (translation `FAILED` on first chunk error)
- `app-scaffold`: `next.config.ts` wrapped with `withWorkflow()`; queue consumer route removed from scaffold expectations

## Impact

- `package.json` — add `workflow` dependency; `@vercel/queue` removable after migration
- `next.config.ts` — `withWorkflow()` wrapper
- `vercel.json` — remove queue trigger; configure workflow step routes `maxDuration: 300`
- New: `src/workflows/translation-job.ts` (workflow + steps)
- New: `src/lib/workflow/start-translation-job.ts` — helper wrapping `start()` from `workflow/api`
- Remove: `src/lib/queue/translation-queue.ts`, `src/lib/queue/predecessor-not-ready-error.ts`, `src/app/api/queues/process-chunk/route.ts`
- Refactor: `src/lib/queue/process-translation-chunk.ts` → step functions (or merge into workflow module)
- `src/server/routers/translations.ts` — start job on create/retry/retryChunk
- `README.md` — new pipeline diagram and debugging guide
- UI polling unchanged (still polls translation/chunk status from DB)
