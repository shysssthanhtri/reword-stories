## Why

> **Superseded:** This change is superseded by `vercel-workflow-translation-jobs`, which replaces the queue consumer with a Vercel Workflow job per translation. Do not implement further work here.

The current translation pipeline uses a single kickoff message and chains one chunk at a time, with the consumer picking the next pending chunk by index. This is harder to reason about (kickoff vs chain, shared idempotency keys on retry), prevents parallel chunk processing, and couples translation-level status updates to every chunk step. Publishing one queue message per chunk at create time makes the flow explicit: each message targets exactly one chunk, and the translation is finalized only after all chunks reach a terminal state.

## What Changes

- **BREAKING**: Replace sequential kickoff/chain queue model with one message per chunk at translation create
- Queue message payload becomes `{ translationId, chunkId }` instead of `{ translationId }` only
- On create: persist translation `QUEUED`, all chunks `PENDING`, publish N messages (one per chunk)
- Consumer: load the specific chunk from the message, polish, update only that chunk (`COMPLETED` or `FAILED`), then evaluate whether the translation should be updated
- Remove `kickoffTranslation` and `chainNextChunk`; replace with `enqueueChunk` (or batch publish on create/retry)
- Update `retry` and `retryChunk` to publish a message for each reset chunk (not a single kickoff)
- Translation status derived after each chunk save: `PROCESSING` while any chunk is `PENDING`, `COMPLETED` when all chunks succeed, `FAILED` when all chunks are terminal and at least one failed
- **No schema change** — keep existing `ChunkStatus` enum (`PENDING`, `COMPLETED`, `FAILED`)

## Capabilities

### New Capabilities

_None — this refactors existing queue behavior rather than introducing a new domain capability._

### Modified Capabilities

- `translation-queue`: Per-chunk message publishing, consumer targets explicit chunk, no chaining; translation finalization after terminal chunk states
- `chunk-retry`: Retry publishes per-chunk messages instead of kickoff
- `translation-crud`: Create and retry flows publish one message per chunk; progress/status semantics updated

## Impact

- `src/lib/queue/translation-queue.ts` — new publish helpers, remove kickoff/chain
- `src/lib/queue/process-translation-chunk.ts` — consumer rewritten for explicit chunk targeting and translation rollup
- `src/app/api/queues/process-chunk/route.ts` — updated message type
- `src/server/routers/translations.ts` — create, retry, retryChunk publish per-chunk messages
- `README.md` — pipeline documentation
- Overlap context: chunk N may arrive before chunk N−1 completes; consumer must wait or defer (see design.md)
