## MODIFIED Requirements

### Requirement: Retry chunk tRPC procedure

The `translations` router SHALL expose `retryChunk` — mutation accepting `{ translationId, chunkId }` that:

- Returns NOT_FOUND if the translation or chunk is missing
- Returns BAD_REQUEST if the chunk does not belong to the translation
- Accepts chunks with status `PENDING`, `COMPLETED`, or `FAILED` (any chunk status)
- Resets the chunk to `PENDING`, clears the chunk `errorMessage`, clears `polishedSlice` and `tokenCount`, sets translation `status` to `QUEUED`, clears translation `errorMessage`, clears translation `polishedContent` when previously completed, and publishes a queue kickoff message for the translation
- Returns `{ translationId, chunkId, status: "QUEUED" }`

The queue consumer SHALL process the retried chunk when it is the next pending or failed chunk in index order.

#### Scenario: Retry single failed chunk

- **WHEN** `translations.retryChunk` is called for a translation with one `FAILED` chunk among otherwise `COMPLETED` chunks
- **THEN** only that chunk is reset to `PENDING`, the translation is re-queued, and a queue message is published

#### Scenario: Retry completed chunk

- **WHEN** `translations.retryChunk` is called for a chunk with status `COMPLETED`
- **THEN** that chunk is reset to `PENDING` with cleared polished output, the translation is re-queued with cleared `polishedContent`, and a queue message is published

#### Scenario: Retry pending chunk

- **WHEN** `translations.retryChunk` is called for a chunk with status `PENDING`
- **THEN** the chunk remains or is reset to `PENDING`, the translation is re-queued, and a queue message is published

#### Scenario: Retry rejected for foreign chunk

- **WHEN** `translations.retryChunk` is called with a `chunkId` that belongs to a different translation
- **THEN** the procedure returns a BAD_REQUEST error

## REMOVED Requirements

### Requirement: Retry rejected for non-failed chunk

**Reason**: Users may re-run completed or pending chunks intentionally; FAILED-only guard removed.

**Migration**: Call `retryChunk` for any chunk status; no client workaround needed.
