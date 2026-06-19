## MODIFIED Requirements

### Requirement: Translation chunks persisted on create

When a translation is created, the application SHALL run chunking on the chapter's `rawContent`, create one `TranslationChunk` row per slice with `chunkIndex` (0-based), `rawSlice`, and `status = PENDING`, and set the parent `Translation.status = QUEUED`.

#### Scenario: Chunks created before queue publish

- **WHEN** `translations.create` succeeds for a chapter with raw content
- **THEN** `TranslationChunk` rows exist for every slice with `status = PENDING` and the translation status is `QUEUED`

### Requirement: Vercel Queue per-chunk publishing

The application SHALL publish messages to topic `translation-chunk` with payload `{ translationId: string, chunkId: string }`.

- On translation create: publish one message per chunk immediately after persistence
- On `translations.retry`: publish one message per chunk reset to `PENDING`
- On `translations.retryChunk`: publish one message for the reset chunk
- Each message SHALL use `idempotencyKey` of `${translationId}-${chunkId}`

Queue helpers SHALL live in `src/lib/queue/translation-queue.ts`.

#### Scenario: One message per chunk on create

- **WHEN** a translation is created with 4 chunks
- **THEN** 4 messages are sent to topic `translation-chunk`, each with a distinct `chunkId` and idempotency key `${translationId}-${chunkId}`

#### Scenario: Retry publishes per reset chunk

- **WHEN** `translations.retryChunk` resets chunk index 2 to `PENDING`
- **THEN** one message is sent with that chunk's `chunkId` and idempotency key `${translationId}-${chunkId}`

## REMOVED Requirements

### Requirement: Vercel Queue kickoff and chaining

**Reason**: Replaced by per-chunk message publishing at create and retry time; consumer no longer chains messages after each chunk.

**Migration**: Remove `kickoffTranslation` and `chainNextChunk`; use `enqueueChunk(translationId, chunkId)` instead.

### Requirement: Queue consumer processes one chunk per invocation

**Reason**: Superseded by explicit chunk-targeted consumer requirement below.

**Migration**: Consumer loads chunk by `chunkId` from message payload instead of selecting the next pending chunk by index.

## ADDED Requirements

### Requirement: Queue consumer processes the message's chunk

The Route Handler at `src/app/api/queues/process-chunk/route.ts` SHALL use `handleCallback` from `@vercel/queue` with `visibilityTimeoutSeconds: 300` and `maxDuration = 300` on the route segment.

For each message `{ translationId, chunkId }`, the consumer SHALL:

1. Load the chunk with its translation, chapter, and novel (`sourceLanguage`)
2. If the chunk or translation is missing, return without error (idempotent no-op)
3. If the chunk status is not `PENDING` or `FAILED`, return without error (idempotent no-op — already processed)
4. If `chunkIndex > 0` and the previous chunk (`chunkIndex - 1`) is not `COMPLETED`, defer processing (see predecessor gate requirement)
5. Clear the chunk `errorMessage` and set translation `status = PROCESSING`
6. Build overlap context from the previous completed chunk's `polishedSlice` (truncate to ~500 tokens)
7. Call `getProvider(translation.provider).polish()` with `rawSlice`, `sourceLanguage`, overlap, and `modelId: translation.modelName`
8. On success: persist `polishedSlice`, `tokenCount`, mark chunk `COMPLETED`, accumulate `tokenUsage`, update `progressPct`
9. On failure: mark only the current chunk `FAILED` with `errorMessage`; do not fail the translation until rollup (step 10)
10. After saving the chunk, evaluate translation rollup (see translation rollup requirement)

#### Scenario: Explicit chunk processed per message

- **WHEN** the consumer handles a message for `chunkId` X
- **THEN** only chunk X is polished and updated; no other chunk rows are modified in that invocation

#### Scenario: Overlap from previous chunk

- **WHEN** processing chunk index 1 and chunk index 0 is `COMPLETED`
- **THEN** `polish()` receives `contextOverlap` from the trailing paragraph of chunk 0's polished text

#### Scenario: Progress percentage updated

- **WHEN** 2 of 4 chunks are `COMPLETED`
- **THEN** `progressPct` equals 50

#### Scenario: Idempotent skip of completed chunk

- **WHEN** the consumer receives a duplicate message for a chunk already `COMPLETED`
- **THEN** it returns without re-processing that chunk

### Requirement: Predecessor gate for overlap ordering

When a message targets chunk index N where N > 0, the consumer SHALL NOT call the LLM until chunk index N − 1 has `status = COMPLETED`. If the predecessor is not yet complete, the consumer SHALL defer by returning a retriable error so Vercel Queue retries later.

#### Scenario: Chunk waits for predecessor

- **WHEN** a message for chunk index 2 arrives while chunk index 1 is still `PENDING`
- **THEN** chunk 2 is not polished in that invocation and the message is deferred for later delivery

#### Scenario: Chunk zero processes immediately

- **WHEN** a message for chunk index 0 arrives with status `PENDING`
- **THEN** the consumer proceeds without waiting for a predecessor

### Requirement: Translation rollup after each chunk save

After each chunk reaches a terminal state (`COMPLETED` or `FAILED`), the consumer SHALL evaluate all chunks for the parent translation:

- If any chunk is `PENDING`, set translation `status = PROCESSING` and update `progressPct`
- If all chunks are `COMPLETED`, assemble `polishedContent`, set translation `status = COMPLETED`, `progressPct = 100`, clear `errorMessage`
- If all chunks are terminal (`COMPLETED` or `FAILED`) and at least one is `FAILED`, set translation `status = FAILED` with an aggregate `errorMessage` (e.g. count of failed chunks)

#### Scenario: Translation completes when last chunk finishes

- **WHEN** the final chunk (by index) completes successfully and all other chunks are `COMPLETED`
- **THEN** `polishedContent` is assembled and translation `status = COMPLETED`

#### Scenario: Translation fails when all chunks terminal with failures

- **WHEN** all chunks are `COMPLETED` or `FAILED` and at least one chunk is `FAILED`
- **THEN** translation `status = FAILED` and completed chunks retain their `polishedSlice`

### Requirement: Consumer failure handling

On LLM or unrecoverable processing error, the consumer SHALL mark only the current chunk `FAILED` with `errorMessage`, then run translation rollup. It SHALL acknowledge the message (no infinite retry) for content-policy and client errors (HTTP 400 class).

Transient errors (429, 5xx) SHALL propagate to trigger Vercel Queue automatic retry before the chunk is marked `FAILED`.

#### Scenario: Failed chunk does not immediately fail translation

- **WHEN** chunk 2 of 5 fails with a non-retryable error and chunks 3–4 are still `PENDING`
- **THEN** chunk 2 is `FAILED`, translation remains `PROCESSING`, and other chunks continue processing

#### Scenario: Failed chunk contributes to translation failure at rollup

- **WHEN** all 5 chunks are terminal and chunk 2 is `FAILED`
- **THEN** translation `status = FAILED` and `errorMessage` is populated

### Requirement: Retry resets failed chunks

The `translations.retry` mutation SHALL reset all `FAILED` chunks to `PENDING`, clear `errorMessage`, set translation `status = QUEUED`, clear translation `errorMessage`, and publish one queue message per reset chunk. Completed chunks SHALL remain `COMPLETED`.

#### Scenario: Retry preserves completed work

- **WHEN** a translation failed on chunk 3 of 5 and chunks 0–2 are completed
- **THEN** retry resets only chunk 3 (and any other failed chunks) to `PENDING`, publishes one message per reset chunk, and does not reprocess chunks 0–2
