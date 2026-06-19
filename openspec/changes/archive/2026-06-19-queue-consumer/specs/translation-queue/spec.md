# Translation Queue

Async chunking pipeline, Vercel Queue kickoff/chaining, and the `/api/queues/process-chunk` consumer.

## ADDED Requirements

### Requirement: Chapter text chunking on translation create

The application SHALL provide a chunking function in `src/lib/chunking/split-chapter.ts` that splits chapter raw text into slices suitable for LLM post-editing.

Chunking rules:
- Target maximum ~1800 tokens per chunk, counted via `gpt-tokenizer`
- Split primarily on `\n\n` paragraph boundaries
- When a single paragraph exceeds the token limit, split on `. ` sentence boundaries
- Never split mid-word; if a single sentence still exceeds the limit, hard-split at a token boundary as a last resort

The function SHALL return an ordered array of raw text slices (0-based index order).

#### Scenario: Multi-paragraph chapter produces multiple chunks

- **WHEN** a 5,000-word chapter with many `\n\n`-separated paragraphs is chunked
- **THEN** the function returns two or more slices, each at most ~1800 tokens

#### Scenario: Oversized paragraph splits on sentences

- **WHEN** a chapter contains one paragraph exceeding 1800 tokens
- **THEN** the function splits that paragraph on sentence boundaries into multiple slices

### Requirement: Translation chunks persisted on create

When a translation is created, the application SHALL run chunking on the chapter's `rawContent`, create one `TranslationChunk` row per slice with `chunkIndex` (0-based), `rawSlice`, and `status = PENDING`, and set the parent `Translation.status = QUEUED`.

#### Scenario: Chunks created before queue kickoff

- **WHEN** `translations.create` succeeds for a chapter with raw content
- **THEN** `TranslationChunk` rows exist for every slice and the translation status is `QUEUED`

### Requirement: Vercel Queue kickoff and chaining

The application SHALL publish messages to topic `translation-chunk` with payload `{ translationId: string }`.

- On translation create: publish one kickoff message
- After a chunk completes successfully: publish one chain message if pending chunks remain
- Chain messages SHALL use `idempotencyKey` of `${translationId}-${chunkIndex}`

Queue helpers SHALL live in `src/lib/queue/translation-queue.ts`.

#### Scenario: Kickoff on create

- **WHEN** a translation is created successfully
- **THEN** a message is sent to topic `translation-chunk` with the new translation id

#### Scenario: Chain after chunk completion

- **WHEN** the consumer completes chunk index 2 and chunk index 3 is still `PENDING`
- **THEN** a chain message is sent with idempotency key `${translationId}-3`

### Requirement: Queue consumer processes one chunk per invocation

The Route Handler at `src/app/api/queues/process-chunk/route.ts` SHALL use `handleCallback` from `@vercel/queue` with `visibilityTimeoutSeconds: 300` and `maxDuration = 300` on the route segment.

For each message, the consumer SHALL:

1. Load the translation with chapter, novel (`sourceLanguage`), and chunks
2. Select the next chunk with `status` in (`PENDING`, `FAILED`) ordered by `chunkIndex` ascending
3. If no pending chunk exists and all chunks are `COMPLETED`, assemble `polishedContent` and set translation `status = COMPLETED` (idempotent finish)
4. If no pending chunk and not all complete, return without error (idempotent no-op)
5. Set translation `status = PROCESSING`
6. Build overlap context from the last paragraph of the previous completed chunk's `polishedSlice` (truncate to ~500 tokens)
7. Call `getProvider(translation.provider).polish()` with `rawSlice`, `sourceLanguage`, overlap, and `modelId: translation.modelName`
8. Persist `polishedSlice`, `tokenCount`, mark chunk `COMPLETED`, accumulate `tokenUsage`, update `progressPct`
9. Chain next message or assemble and mark `COMPLETED` when all chunks done

#### Scenario: Single chunk processed per message

- **WHEN** the consumer handles a message for a translation with 5 pending chunks
- **THEN** exactly one chunk is polished and marked `COMPLETED` before the handler returns

#### Scenario: Overlap from previous chunk

- **WHEN** processing chunk index 1 and chunk index 0 is completed
- **THEN** `polish()` receives `contextOverlap` from the trailing paragraph of chunk 0's polished text

#### Scenario: Progress percentage updated

- **WHEN** 2 of 4 chunks are completed
- **THEN** `progressPct` equals 50

#### Scenario: Idempotent skip of completed chunks

- **WHEN** the consumer receives a duplicate message and chunk index 0 is already `COMPLETED`
- **THEN** it processes chunk index 1 (next pending), not chunk 0 again

### Requirement: Polished content assembly

When all chunks are `COMPLETED`, the application SHALL concatenate `polishedSlice` values in `chunkIndex` order separated by `\n\n` into `Translation.polishedContent`.

Assembly logic SHALL live in `src/lib/chunking/assemble-chunks.ts`.

#### Scenario: Full chapter assembled on completion

- **WHEN** the last chunk completes for a 3-chunk translation
- **THEN** `polishedContent` contains all three polished slices in order with paragraph breaks between them

### Requirement: Consumer failure handling

On LLM or unrecoverable processing error, the consumer SHALL mark the current chunk `FAILED`, set translation `status = FAILED` with `errorMessage`, and acknowledge the message (no infinite retry) for content-policy and client errors (HTTP 400 class).

Transient errors (429, 5xx) SHALL propagate to trigger Vercel Queue automatic retry.

#### Scenario: Failed chunk marks translation failed

- **WHEN** `polish()` throws an error classified as non-retryable
- **THEN** the chunk status is `FAILED`, translation status is `FAILED`, and `errorMessage` is populated

### Requirement: Retry resets failed chunks

The `translations.retry` mutation SHALL reset all `FAILED` chunks to `PENDING`, clear `errorMessage`, set translation `status = QUEUED`, and publish a kickoff message. Completed chunks SHALL remain `COMPLETED`.

#### Scenario: Retry preserves completed work

- **WHEN** a translation failed on chunk 3 of 5 and chunks 0–2 are completed
- **THEN** retry resets only chunk 3 (and any other failed chunks) and re-kickoffs the queue without reprocessing chunks 0–2
