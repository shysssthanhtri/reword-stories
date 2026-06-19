## MODIFIED Requirements

### Requirement: Retry chunk tRPC procedure

The `translations` router SHALL expose `retryChunk` — mutation accepting `{ translationId, chunkId }` that:

- Returns NOT_FOUND if the translation or chunk is missing
- Returns BAD_REQUEST if the chunk does not belong to the translation
- Returns BAD_REQUEST if translation `status = PROCESSING` for the **same** translation (job already in flight for this row)
- Accepts chunks with status `PENDING`, `COMPLETED`, or `FAILED` (any chunk status)
- Resets the chunk to `PENDING`, clears the chunk `errorMessage`, clears `polishedSlice` and `tokenCount`, sets translation `status` to `QUEUED`, clears translation `errorMessage`, clears translation `polishedContent` when previously completed, recomputes `progressPct` from completed chunk count, and starts a translation workflow job
- Returns `{ translationId, chunkId, status: "QUEUED" }`

The translation job SHALL skip `COMPLETED` chunks and process remaining chunks in order, stopping on first failure.

#### Scenario: Retry single failed chunk

- **WHEN** `translations.retryChunk` is called for a translation with one `FAILED` chunk among otherwise `COMPLETED` chunks
- **THEN** only that chunk is reset to `PENDING`, the translation is re-queued, and a new translation job is started

#### Scenario: Retry completed chunk

- **WHEN** `translations.retryChunk` is called for a chunk with status `COMPLETED`
- **THEN** that chunk is reset to `PENDING` with cleared polished output, the translation is re-queued with cleared `polishedContent`, and a new translation job is started

#### Scenario: Retry pending chunk

- **WHEN** `translations.retryChunk` is called for a chunk with status `PENDING`
- **THEN** the chunk remains or is reset to `PENDING`, the translation is re-queued, and a new translation job is started

#### Scenario: Retry rejected for foreign chunk

- **WHEN** `translations.retryChunk` is called with a `chunkId` that belongs to a different translation
- **THEN** the procedure returns a BAD_REQUEST error

#### Scenario: Retry rejected while same translation job in flight

- **WHEN** `translations.retryChunk` is called while that translation's `status = PROCESSING`
- **THEN** the procedure returns a BAD_REQUEST error

#### Scenario: Retry allowed while another translation is processing

- **WHEN** `translations.retryChunk` is called for translation B while translation A is `PROCESSING`
- **THEN** the procedure succeeds, translation B is re-queued, and a job starts that waits for the global slot

### Requirement: Chunk failure persists error on chunk row

When a translation job marks a chunk `FAILED`, it SHALL persist the error text on the chunk's `errorMessage` field. When a chunk begins processing or is reset for retry, the job or retry mutation SHALL clear that chunk's `errorMessage`.

#### Scenario: Failed chunk stores error message

- **WHEN** a chunk polish step catches an error while polishing a chunk
- **THEN** the chunk row is updated with `status = FAILED` and a non-null `errorMessage`

#### Scenario: Retry clears chunk error

- **WHEN** `translations.retryChunk` succeeds for a failed chunk
- **THEN** that chunk's `errorMessage` is null and `status` is `PENDING`
