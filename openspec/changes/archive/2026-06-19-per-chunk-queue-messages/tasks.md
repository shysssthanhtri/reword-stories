## 1. Queue publishing

- [x] 1.1 Update `TranslationChunkMessage` type to `{ translationId, chunkId }` in `translation-queue.ts`
- [x] 1.2 Implement `enqueueChunk(translationId, chunkId)` with idempotency key `${translationId}-${chunkId}`
- [x] 1.3 Implement `enqueueAllChunks(translationId, chunkIds[])` for batch publish on create
- [x] 1.4 Remove `kickoffTranslation` and `chainNextChunk`; update all call sites

## 2. Queue consumer

- [x] 2.1 Update `process-chunk/route.ts` to pass `chunkId` from message to processor
- [x] 2.2 Rewrite `processTranslationChunk` to load chunk by `chunkId` (not lowest pending)
- [x] 2.3 Add idempotent guards (missing chunk, status not `PENDING`/`FAILED`)
- [x] 2.4 Implement predecessor gate: defer if `chunkIndex > 0` and previous chunk not `COMPLETED`
- [x] 2.5 Update only the targeted chunk on success/failure; set translation `PROCESSING` while work runs
- [x] 2.6 Extract `rollupTranslation(translationId)` — set translation `PROCESSING`/`COMPLETED`/`FAILED` based on all chunk states
- [x] 2.7 Remove `chainNextChunk` call from consumer; call `rollupTranslation` after each chunk save
- [x] 2.8 Update log messages to reflect per-chunk processing (remove kickoff/chain log labels)

## 3. tRPC mutations

- [x] 3.1 Update `translations.create` to call `enqueueAllChunks` after creating chunks (`PENDING`)
- [x] 3.2 Update `translations.retry` to reset failed chunks to `PENDING` and publish one message per reset chunk
- [x] 3.3 Update `translations.retryChunk` to reset chunk to `PENDING` and publish one message for that chunk
- [x] 3.4 Update progressPct computation to use `COMPLETED` count against total

## 4. Documentation and verification

- [x] 4.1 Update `README.md` pipeline section to describe per-chunk message model
- [x] 4.2 Run `pnpm lint` and `pnpm build` to verify types and compilation
- [ ] 4.3 Manual verify on Vercel preview: create translation with 3+ chunks, confirm all chunks dispatch, complete in order, translation rolls up to `COMPLETED`
