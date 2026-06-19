## MODIFIED Requirements

### Requirement: Translations tRPC router procedures

The `translations` router SHALL expose the following procedures (see `translation-queue` and `chunk-retry` specs for queue and retry semantics):

- `listProviders` — query returning registered providers with models
- `estimateChunks` — query accepting `{ chapterId }` returning `{ chunkCount }` by running chunking on the chapter's raw content (NOT_FOUND if chapter missing)
- `create` — mutation accepting `{ chapterId, provider, modelName }` creating Translation + chunks (`PENDING`), publishing one queue message per chunk, returning `{ id, status, progressPct }`
- `getById` — query accepting `{ id }` returning translation fields including `polishedContent` and an ordered `chunks` array for review (NOT_FOUND if missing)
- `listByChapter` — query accepting `{ chapterId }` returning translations for the chapter ordered by `createdAt` desc, each including an ordered `chunks` summary array and excluding `polishedContent` from the response
- `retry` — mutation accepting `{ id }` resetting all failed chunks to `PENDING` and publishing one message per reset chunk (BAD_REQUEST if not `FAILED`, NOT_FOUND if missing)
- `retryChunk` — mutation accepting `{ translationId, chunkId }` resetting a single chunk to `PENDING` and publishing one message for that chunk regardless of chunk status (see chunk-retry spec)
- `delete` — mutation accepting `{ id }` deleting the translation and its translation chunks via database cascade; returning `{ id: string }` on success

Each chunk summary in list and detail responses SHALL include: `id`, `chunkIndex`, `status`, and `errorMessage` (when failed). Chunk summaries SHALL NOT include `rawSlice` or `polishedSlice` in list responses.

#### Scenario: Create returns queued translation

- **WHEN** `translations.create` is called with valid input
- **THEN** a Translation row is inserted with `status = QUEUED`, chunk rows exist with `status = PENDING`, and one queue message is published per chunk

#### Scenario: Estimate chunks for chapter

- **WHEN** `translations.estimateChunks` is called for a chapter with raw content
- **THEN** the response includes a positive `chunkCount`

#### Scenario: Retry rejects non-failed translation

- **WHEN** `translations.retry` is called for a translation with status `COMPLETED`
- **THEN** the procedure returns a BAD_REQUEST error

#### Scenario: List by chapter includes chunk summaries

- **WHEN** `translations.listByChapter` is called for a chapter with translations
- **THEN** each translation item includes a `chunks` array ordered by `chunkIndex` with status per chunk

#### Scenario: Delete removes translation and chunks

- **WHEN** `translations.delete` succeeds for a translation
- **THEN** the translation row and all related translation chunk rows are removed from the database
