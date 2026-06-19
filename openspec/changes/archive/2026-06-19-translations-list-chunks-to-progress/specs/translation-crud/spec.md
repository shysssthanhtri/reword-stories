# Translation CRUD

## MODIFIED Requirements

### Requirement: Translations tRPC router procedures

The `translations` router SHALL expose the following procedures (see `translation-workflow` and `chunk-retry` specs for job and retry semantics):

- `listProviders` — query returning registered providers with `{ id, label, models: [{ id, label, isFree? }] }`
- `estimateChunks` — query accepting `{ chapterId }` returning `{ chunkCount }` by running chunking on the chapter's raw content (NOT_FOUND if chapter missing)
- `create` — mutation accepting `{ chapterId, provider, modelName }` creating Translation + chunks (`PENDING`), starting a translation workflow job, returning `{ id, status, progressPct }`
- `getById` — query accepting `{ id }` returning translation fields including `polishedContent` and an ordered `chunks` array for review (NOT_FOUND if missing)
- `listByChapter` — query accepting `{ chapterId }` returning translations for the chapter ordered by `createdAt` desc, excluding `polishedContent` and excluding chunk summaries from the response
- `retry` — mutation accepting `{ id }` resetting all failed chunks to `PENDING` and starting a translation workflow job (BAD_REQUEST if not `FAILED`, NOT_FOUND if missing)
- `retryChunk` — mutation accepting `{ translationId, chunkId }` resetting a single chunk to `PENDING` and starting a translation workflow job regardless of chunk status (see chunk-retry spec)
- `delete` — mutation accepting `{ id }` deleting the translation and its translation chunks via database cascade; returning `{ id: string }` on success

Chunk summaries in `getById` responses SHALL include: `id`, `chunkIndex`, `status`, and `errorMessage` (when failed). Chunk summaries SHALL NOT include `rawSlice` or `polishedSlice`.

The router SHALL be registered on the root `AppRouter`.

On `delete`, if the translation does not exist, the procedure SHALL return a NOT_FOUND tRPC error. If the translation status is `QUEUED` or `PROCESSING`, the procedure SHALL return a BAD_REQUEST tRPC error with a message that in-flight translations cannot be deleted.

#### Scenario: Create returns queued translation

- **WHEN** `translations.create` is called with valid input
- **THEN** a Translation row is inserted with `status = QUEUED`, chunk rows exist with `status = PENDING`, and a translation workflow job is started

#### Scenario: List providers returns gateway

- **WHEN** `translations.listProviders` is called
- **THEN** the response includes the gateway provider with its model catalog

#### Scenario: Estimate chunks for chapter

- **WHEN** `translations.estimateChunks` is called for a chapter with 10,000 characters of raw content
- **THEN** the response includes a positive `chunkCount`

#### Scenario: Retry only when failed

- **WHEN** `translations.retry` is called for a translation with status `COMPLETED`
- **THEN** the procedure returns a BAD_REQUEST error

#### Scenario: Get by id includes polished content

- **WHEN** `translations.getById` is called for a completed translation
- **THEN** the response includes `polishedContent` with the assembled chapter text

#### Scenario: List by chapter excludes polished content

- **WHEN** `translations.listByChapter` is called for a chapter with completed translations
- **THEN** each item omits `polishedContent` from the response

#### Scenario: List by chapter excludes chunk summaries

- **WHEN** `translations.listByChapter` is called for a chapter with an in-flight translation
- **THEN** each translation item omits a `chunks` array from the response

#### Scenario: Delete removes translation and chunks

- **WHEN** `translations.delete` is called for a translation with status `COMPLETED` or `FAILED`
- **THEN** the translation row and all related translation chunk rows are removed from the database

#### Scenario: Delete blocked while in flight

- **WHEN** `translations.delete` is called for a translation with status `QUEUED` or `PROCESSING`
- **THEN** the procedure returns a BAD_REQUEST error and no rows are deleted

#### Scenario: Delete not found

- **WHEN** `translations.delete` is called with a non-existent id
- **THEN** the procedure returns a NOT_FOUND tRPC error

### Requirement: Translation status polling on chapter detail

The chapter detail translations section SHALL include a Client Component that polls `translations.listByChapter` every 3 seconds while any translation has status `QUEUED` or `PROCESSING`, and stops polling when all translations are `COMPLETED` or `FAILED`.

Initial translation list data SHALL be server-fetched via `translations.listByChapter` in the RSC page.

#### Scenario: Progress updates while processing

- **WHEN** a translation is processing and the user views the chapter detail page
- **THEN** the translation's `progressPct` and progress bar update without a full page reload as chunks complete

#### Scenario: Polling stops on completion

- **WHEN** all translations on the page reach status `COMPLETED` or `FAILED` with no chunks in a re-queued state
- **THEN** polling stops

### Requirement: Translation list UI on chapter detail

The chapter detail page translations section SHALL display each translation with provider label, model label, overall status badge, and a progress indicator for translations with status `QUEUED`, `PROCESSING`, or `FAILED`.

The progress indicator SHALL use the shadcn `Progress` component bound to `progressPct`. For `QUEUED` translations the bar SHALL show 0%; for `COMPLETED` translations the progress indicator SHALL be hidden (status badge alone is sufficient).

When status is `FAILED`, the translation row SHALL display the translation-level `errorMessage` below the progress bar when present.

Each translation row SHALL open the translation review modal when translation status is `COMPLETED` or `FAILED`. Rows with status `QUEUED` or `PROCESSING` SHALL NOT be clickable for modal open and SHALL NOT use pointer/hover affordances that imply clickability.

When no translations exist, the empty state SHALL include a link or button to the translate page. When translations exist, a **New Translation** action SHALL link to the translate page.

Failed translations SHALL expose a **Retry all** action calling `translations.retry`. Per-chunk retry actions SHALL NOT appear in the list row.

Completed and failed translations SHALL expose a **Delete** action calling `translations.delete` after confirmation in a shadcn `AlertDialog`. Translations with status `QUEUED` or `PROCESSING` SHALL NOT show a delete action.

The Delete button click event SHALL NOT propagate to the row handler (same pattern as Retry).

#### Scenario: Empty state links to translate

- **WHEN** a chapter has no translations
- **THEN** the user can navigate to the translate page from the empty state

#### Scenario: In-flight translation shows progress bar

- **WHEN** a translation with status `QUEUED` or `PROCESSING` is displayed on the chapter detail page
- **THEN** a progress bar reflecting `progressPct` is visible and no chunk table is shown

#### Scenario: Completed translation hides progress bar

- **WHEN** a translation with status `COMPLETED` is displayed on the chapter detail page
- **THEN** no progress bar is shown and the status badge reads Completed

#### Scenario: Failed translation shows error and retry all

- **WHEN** a translation has status `FAILED`
- **THEN** the user sees the progress bar at its last value, translation-level error message when present, and a Retry all action; no per-chunk rows are shown in the list

#### Scenario: Completed translation row opens review modal

- **WHEN** user clicks a translation row with status `COMPLETED` (outside action buttons)
- **THEN** the translation review modal opens for that translation

#### Scenario: Failed translation row opens review modal

- **WHEN** user clicks a translation row with status `FAILED` (outside action buttons)
- **THEN** the translation review modal opens showing chunk-level errors and per-chunk retry actions

#### Scenario: In-flight translation row does not open modal

- **WHEN** user clicks a translation row with status `QUEUED` or `PROCESSING` (outside action buttons)
- **THEN** the review modal does not open

#### Scenario: Completed translation can be deleted

- **WHEN** user clicks **Delete** on a completed translation, confirms in the dialog, and the mutation succeeds
- **THEN** the translation is removed from the list without a full page reload

#### Scenario: In-flight translation has no delete action

- **WHEN** a translation has status `QUEUED` or `PROCESSING`
- **THEN** no delete button is shown for that translation row

#### Scenario: Delete does not open modal

- **WHEN** user clicks the Delete button on a deletable translation
- **THEN** the delete confirmation dialog opens and the review modal does not open
