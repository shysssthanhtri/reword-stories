## MODIFIED Requirements

### Requirement: Translations tRPC router procedures

The `translations` router SHALL expose:

- `listProviders` — query returning registered providers with `{ id, label, models: [{ id, label, isFree? }] }`
- `estimateChunks` — query accepting `{ chapterId }` returning `{ chunkCount }` by running chunking on the chapter's raw content (NOT_FOUND if chapter missing)
- `create` — mutation accepting `{ chapterId, provider, modelName }` creating Translation + chunks, kicking off queue, returning `{ id, status, progressPct }`
- `getById` — query accepting `{ id }` returning translation fields including `polishedContent` for review (NOT_FOUND if missing)
- `listByChapter` — query accepting `{ chapterId }` returning translations for the chapter ordered by `createdAt` desc, excluding `polishedContent` from the response
- `retry` — mutation accepting `{ id }` resetting failed chunks and re-kickoff (BAD_REQUEST if not `FAILED`, NOT_FOUND if missing)
- `delete` — mutation accepting `{ id }` deleting the translation and its translation chunks via database cascade; returning `{ id: string }` on success

The router SHALL be registered on the root `AppRouter`.

On `delete`, if the translation does not exist, the procedure SHALL return a NOT_FOUND tRPC error. If the translation status is `QUEUED` or `PROCESSING`, the procedure SHALL return a BAD_REQUEST tRPC error with a message that in-flight translations cannot be deleted.

#### Scenario: Create returns queued translation

- **WHEN** `translations.create` is called with valid chapter, provider, and model
- **THEN** a Translation row is inserted with `status = QUEUED` and chunk rows exist

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

#### Scenario: Delete removes translation and chunks

- **WHEN** `translations.delete` is called for a translation with status `COMPLETED` or `FAILED`
- **THEN** the translation row and all related translation chunk rows are removed from the database

#### Scenario: Delete blocked while in flight

- **WHEN** `translations.delete` is called for a translation with status `QUEUED` or `PROCESSING`
- **THEN** the procedure returns a BAD_REQUEST error and no rows are deleted

#### Scenario: Delete not found

- **WHEN** `translations.delete` is called with a non-existent id
- **THEN** the procedure returns a NOT_FOUND tRPC error

### Requirement: Translation list UI on chapter detail

The chapter detail page translations section SHALL display each translation with provider label, model label, status badge, progress percentage (when processing), and error message (when failed). Each translation row SHALL be clickable to open the translation review modal.

When no translations exist, the empty state SHALL include a link or button to the translate page. When translations exist, a **New Translation** action SHALL link to the translate page.

Failed translations SHALL expose a **Retry** action calling `translations.retry`.

Completed and failed translations SHALL expose a **Delete** action calling `translations.delete` after confirmation in a shadcn `AlertDialog`. Translations with status `QUEUED` or `PROCESSING` SHALL NOT show a delete action.

The Delete button click event SHALL NOT propagate to the row handler (same pattern as Retry).

#### Scenario: Empty state links to translate

- **WHEN** a chapter has no translations
- **THEN** the user can navigate to the translate page from the empty state

#### Scenario: Failed translation shows retry

- **WHEN** a translation has status `FAILED` and an error message
- **THEN** the user can trigger retry from the chapter detail page

#### Scenario: Translation row opens review modal

- **WHEN** user clicks a translation row on the chapter detail page
- **THEN** the translation review modal opens for that translation

#### Scenario: Completed translation can be deleted

- **WHEN** user clicks **Delete** on a completed translation, confirms in the dialog, and the mutation succeeds
- **THEN** the translation is removed from the list without a full page reload

#### Scenario: In-flight translation has no delete action

- **WHEN** a translation has status `QUEUED` or `PROCESSING`
- **THEN** no delete button is shown for that translation row

#### Scenario: Delete does not open modal

- **WHEN** user clicks the Delete button on a deletable translation
- **THEN** the delete confirmation dialog opens and the review modal does not open
