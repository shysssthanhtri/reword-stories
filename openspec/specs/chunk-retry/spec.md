# Chunk Retry

Per-chunk retry API and queue kickoff for failed translation segments.

## Requirements

### Requirement: Chunk retry validation schema

The application SHALL define `retryChunkInputSchema` in `src/lib/validations/translation.ts` with:

- `translationId` — required string (cuid)
- `chunkId` — required string (cuid)

The schema SHALL be used by `translations.retryChunk`.

#### Scenario: Valid chunk retry input accepted

- **WHEN** retry input includes a valid `translationId` and `chunkId`
- **THEN** validation passes

#### Scenario: Missing chunk id rejected

- **WHEN** retry input omits `chunkId`
- **THEN** validation fails before any database write

### Requirement: Retry chunk tRPC procedure

The `translations` router SHALL expose `retryChunk` — mutation accepting `{ translationId, chunkId }` that:

- Returns NOT_FOUND if the translation or chunk is missing
- Returns BAD_REQUEST if the chunk does not belong to the translation
- Returns BAD_REQUEST if the chunk status is not `FAILED`
- Resets the chunk to `PENDING`, clears the chunk `errorMessage`, sets translation `status` to `QUEUED`, clears translation `errorMessage`, and publishes a queue kickoff message for the translation
- Returns `{ translationId, chunkId, status: "QUEUED" }`

The queue consumer SHALL process the retried chunk when it is the next pending or failed chunk in index order.

#### Scenario: Retry single failed chunk

- **WHEN** `translations.retryChunk` is called for a translation with one `FAILED` chunk among otherwise `COMPLETED` chunks
- **THEN** only that chunk is reset to `PENDING`, the translation is re-queued, and a queue message is published

#### Scenario: Retry rejected for non-failed chunk

- **WHEN** `translations.retryChunk` is called for a chunk with status `COMPLETED`
- **THEN** the procedure returns a BAD_REQUEST error and no queue message is published

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
