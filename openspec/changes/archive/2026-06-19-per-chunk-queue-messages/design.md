## Context

The translation pipeline today uses a sequential kickoff/chain model:

1. `translations.create` persists chunks as `PENDING` and sends **one** kickoff message
2. The consumer picks the lowest-index `PENDING`/`FAILED` chunk, processes it, then chains the next message
3. Translation `status` flips to `PROCESSING` on every consumer invocation; a single chunk failure immediately marks the translation `FAILED`

This works but is opaque (kickoff vs chain logs, shared kickoff idempotency key on retry) and serializes chunk work. The desired model publishes **one message per chunk at create time**, with the consumer targeting an explicit chunk and rolling up translation status only after evaluating all chunk states.

Existing pieces unchanged: Prisma schema (`ChunkStatus`: `PENDING`, `COMPLETED`, `FAILED`), `splitIntoChunks`, `assemblePolishedContent`, `getProvider().polish()`, Vercel Queue topic `translation-chunk` wired in `vercel.json` (`maxConcurrency: 5`).

## Goals / Non-Goals

**Goals:**

- One queue message per chunk at create, retry, and retryChunk
- Message payload `{ translationId, chunkId }` with idempotency key `${translationId}-${chunkId}`
- Chunk lifecycle unchanged: `PENDING` → `COMPLETED` | `FAILED`
- Consumer updates only the targeted chunk; translation status updated via rollup after each chunk save
- Preserve overlap context from the previous chunk's polished output
- Update retry flows to publish per-chunk messages (fixes kickoff idempotency collision on retry)

**Non-Goals:**

- Changing `ChunkStatus` enum or Prisma schema
- Changing chunking algorithm or assembly logic
- Parallel LLM calls without predecessor ordering (overlap requires sequential dependency per index)
- UI redesign (chunk badges already handle `PENDING`)
- Automated tests
- Bulk translate-all

## Decisions

### 1. Keep existing ChunkStatus enum

**Decision:** No schema migration. Chunks continue using `PENDING`, `COMPLETED`, `FAILED`. A chunk remains `PENDING` while the LLM call is in flight; translation-level `PROCESSING` indicates in-flight work.

**Rationale:** User confirmed `PENDING` is acceptable; avoids migration risk and UI churn.

**Alternative:** Add chunk-level `PROCESSING` or rename `PENDING` → `QUEUED` — deferred.

### 2. Queue message shape

**Decision:**

```typescript
type TranslationChunkMessage = {
  translationId: string
  chunkId: string
}

await send(TRANSLATION_CHUNK_TOPIC, { translationId, chunkId }, {
  idempotencyKey: `${translationId}-${chunkId}`,
})
```

**Rationale:** Stable idempotency per chunk (safe on retry); consumer loads exact row, no index guessing.

### 3. Queue helpers

**Decision:** Replace `kickoffTranslation` and `chainNextChunk` with:

- `enqueueChunk(translationId: string, chunkId: string)` — single publish
- `enqueueAllChunks(translationId: string, chunkIds: string[])` — batch publish on create (loops `enqueueChunk`)

Remove chain publishing from the consumer entirely.

### 4. Consumer flow

**Decision:** Rewrite `processTranslationChunk(translationId, chunkId)`:

```
1. Load chunk + translation + chapter + novel
2. Guard: missing → no-op
3. Guard: chunk status ∉ {PENDING, FAILED} → no-op (idempotent)
4. Predecessor gate: if chunkIndex > 0 and chunk[N-1] not COMPLETED → defer (see §5)
5. Clear chunk errorMessage; set translation → PROCESSING
6. Build overlap from chunk[N-1].polishedSlice
7. Call polish() (chunk stays PENDING during call)
8. On success: chunk → COMPLETED, update progressPct + tokenUsage
9. On failure: chunk → FAILED + errorMessage (translation not failed yet)
10. rollupTranslation(translationId) — see §6
```

### 5. Predecessor gate (overlap ordering)

**Decision:** Messages for chunk N (N > 0) are published at create time but the consumer **defers** if chunk N−1 is not `COMPLETED`. Defer by throwing a retriable error (let Vercel Queue retry with backoff).

**Rationale:** All messages fire at create while preserving overlap quality. Chunk 0 runs immediately; chunk 1+ wait until predecessor completes.

### 6. Translation rollup

**Decision:** New `rollupTranslation(translationId)` called after every chunk terminal save:

| Chunk states | Translation status | Other updates |
|---|---|---|
| Any `PENDING` | `PROCESSING` | Update `progressPct` |
| All `COMPLETED` | `COMPLETED` | Assemble `polishedContent`, `progressPct = 100`, clear `errorMessage` |
| All terminal, ≥1 `FAILED` | `FAILED` | Set aggregate `errorMessage`, keep completed `polishedSlice` values |

**Rationale:** Translation updated only after evaluating all chunk states; partial failures don't block other chunks.

### 7. Create and retry mutations

**Decision:**

- **create:** After transaction creating translation + chunks (`PENDING`), call `enqueueAllChunks` with all chunk ids
- **retry:** Reset `FAILED` → `PENDING`, translation → `QUEUED`, publish one message per reset chunk
- **retryChunk:** Reset target chunk → `PENDING`, translation → `QUEUED`, publish one message for that chunk

### 8. Server vs client boundaries

| Surface | Type | Change |
|---|---|---|
| Queue consumer route | Route Handler | New message type, rewritten processor |
| Queue helpers | Server module | New publish API |
| translations router | Server (tRPC) | Create/retry publish per chunk |
| Translation list polling | Client | No change |
| Chapter detail UI | Client island | No change (already shows `PENDING`) |

## Risks / Trade-offs

- **[Predecessor gate causes retry storms]** → Vercel Queue backoff handles spacing; chunk 0 completes quickly, unblocking chunk 1.
- **[Chunk stays PENDING during LLM call]** → Duplicate message delivery during in-flight processing could double-call LLM; mitigated by idempotency key and post-completion status guard on redelivery.
- **[In-flight translations during deploy]** → Old messages have `{ translationId }` only; consumer should no-op gracefully on missing `chunkId`. In-flight jobs may stall; manual retry after deploy.
- **[Higher queue volume at create]** → N messages front-loaded instead of chained; same total count over job lifetime.

## Migration Plan

1. Deploy application code (queue helpers, consumer, router) — no database migration
2. Verify on Vercel preview: create 3-chunk translation, confirm parallel dispatch with ordered completion
3. Rollback: revert app code only

## Open Questions

1. **Defer strategy:** Throw for queue retry vs explicit re-publish — default to throw (simpler).
2. **Aggregate error message format** — e.g. `"2 of 5 chunks failed"` vs first failed chunk's message. Default: count-based summary.
