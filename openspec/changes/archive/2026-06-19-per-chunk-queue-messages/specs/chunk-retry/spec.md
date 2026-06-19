## MODIFIED Requirements

### Requirement: Retry chunk tRPC procedure

The `translations` router SHALL expose `retryChunk` — mutation accepting `{ translationId, chunkId }` that:

- Returns NOT_FOUND if the translation or chunk is missing
- Returns BAD_REQUEST if the chunk does not belong to the translation
- Accepts chunks with status `PENDING`, `COMPLETED`, or `FAILED` (any chunk status)
- Resets the chunk to `PENDING`, clears the chunk `errorMessage`, clears `polishedSlice` and `tokenCount`, sets translation `status` to `QUEUED`, clears translation `errorMessage`, clears translation `polishedContent` when previously completed, recomputes `progressPct` from completed chunk count, and publishes one queue message for that chunk
- Returns `{ translationId, chunkId, status: "QUEUED" }`

The queue consumer SHALL process the retried chunk when its message is delivered and predecessor gate conditions are satisfied.

#### Scenario: Retry single failed chunk

- **WHEN** `translations.retryChunk` is called for a translation with one `FAILED` chunk among otherwise `COMPLETED` chunks
- **THEN** only that chunk is reset to `PENDING`, the translation is re-queued, and one queue message is published for that chunk

#### Scenario: Retry completed chunk

- **WHEN** `translations.retryChunk` is called for a chunk with status `COMPLETED`
- **THEN** that chunk is reset to `PENDING` with cleared polished output, the translation is re-queued with cleared `polishedContent`, and one queue message is published

#### Scenario: Retry pending chunk

- **WHEN** `translations.retryChunk` is called for a chunk with status `PENDING`
- **THEN** the chunk remains or is reset to `PENDING`, the translation is re-queued, and one queue message is published

#### Scenario: Retry rejected for foreign chunk

- **WHEN** `translations.retryChunk` is called with a `chunkId` that belongs to a different translation
- **THEN** the procedure returns a BAD_REQUEST error

### Requirement: Chunk failure persists error on chunk row

When the queue consumer marks a chunk `FAILED`, it SHALL persist the error text on the chunk's `errorMessage` field. When a chunk begins processing or is reset for retry, the consumer or retry mutation SHALL clear that chunk's `errorMessage`.

#### Scenario: Failed chunk stores error message

- **WHEN** the queue consumer catches an error while polishing a chunk
- **THEN** the chunk row is updated with `status = FAILED` and a non-null `errorMessage`

#### Scenario: Retry clears chunk error

- **WHEN** `translations.retryChunk` succeeds for a failed chunk
- **THEN** that chunk's `errorMessage` is null and `status` is `PENDING`
