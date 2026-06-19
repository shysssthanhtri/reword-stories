# Translation CRUD

tRPC procedures, validation, provider+model selection UI, and status polling for translation jobs.

## Requirements

### Requirement: Translation validation schema

The application SHALL define `createTranslationSchema` in `src/lib/validations/translation.ts` with:

- `chapterId` — required string (cuid)
- `provider` — required string matching a registered provider id from `listProviders()`
- `modelName` — required string matching a model id in the selected provider's `models` list

The schema SHALL be used by `translations.create` and the create-translation React Hook Form.

#### Scenario: Valid provider and model accepted

- **WHEN** create input uses `provider: "gateway"` and `modelName: "openai/gpt-4o"`
- **THEN** validation passes

#### Scenario: Unknown provider rejected

- **WHEN** create input uses `provider: "unknown"`
- **THEN** validation fails before any database write

#### Scenario: Model not in provider catalog rejected

- **WHEN** create input uses a model id not listed in the selected provider's models
- **THEN** validation fails before any database write

### Requirement: Translations tRPC router procedures

The `translations` router SHALL expose the following procedures (see `translation-workflow` and `chunk-retry` specs for job and retry semantics):

- `listProviders` — query returning registered providers with `{ id, label, models: [{ id, label, isFree? }] }`
- `estimateChunks` — query accepting `{ chapterId }` returning `{ chunkCount }` by running chunking on the chapter's raw content (NOT_FOUND if chapter missing)
- `create` — mutation accepting `{ chapterId, provider, modelName }` creating Translation + chunks (`PENDING`), starting a translation workflow job, returning `{ id, status, progressPct }`
- `getById` — query accepting `{ id }` returning translation fields including `polishedContent` and an ordered `chunks` array for review (NOT_FOUND if missing)
- `listByChapter` — query accepting `{ chapterId }` returning translations for the chapter ordered by `createdAt` desc, each including an ordered `chunks` summary array and excluding `polishedContent` from the response
- `retry` — mutation accepting `{ id }` resetting all failed chunks to `PENDING` and starting a translation workflow job (BAD_REQUEST if not `FAILED`, NOT_FOUND if missing)
- `retryChunk` — mutation accepting `{ translationId, chunkId }` resetting a single chunk to `PENDING` and starting a translation workflow job regardless of chunk status (see chunk-retry spec)
- `delete` — mutation accepting `{ id }` deleting the translation and its translation chunks via database cascade; returning `{ id: string }` on success

Each chunk summary in list and detail responses SHALL include: `id`, `chunkIndex`, `status`, and `errorMessage` (when failed). Chunk summaries SHALL NOT include `rawSlice` or `polishedSlice` in list responses.

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

#### Scenario: List by chapter includes chunk summaries

- **WHEN** `translations.listByChapter` is called for a chapter with an in-flight translation
- **THEN** each translation item includes a `chunks` array ordered by `chunkIndex` with status per chunk

#### Scenario: Delete removes translation and chunks

- **WHEN** `translations.delete` is called for a translation with status `COMPLETED` or `FAILED`
- **THEN** the translation row and all related translation chunk rows are removed from the database

#### Scenario: Delete blocked while in flight

- **WHEN** `translations.delete` is called for a translation with status `QUEUED` or `PROCESSING`
- **THEN** the procedure returns a BAD_REQUEST error and no rows are deleted

#### Scenario: Delete not found

- **WHEN** `translations.delete` is called with a non-existent id
- **THEN** the procedure returns a NOT_FOUND tRPC error

### Requirement: Translate page at /novels/[novelId]/chapters/[chapterId]/translate

The route `src/app/(app)/novels/(novel)/[novelId]/chapters/[chapterId]/translate/page.tsx` SHALL be a React Server Component that verifies the chapter exists and belongs to the route novel, then renders a client create-translation form.

The form SHALL be a Client Component with React Hook Form, shadcn `Field` primitives, and Zod validation. Fields:

- **Provider** — required select populated from `translations.listProviders`
- **Model** — required select populated from the selected provider's `models`; options SHALL update when provider changes; model selection SHALL reset to a valid default when provider changes

The form SHALL display a pre-flight estimate ("~N chunks") from `translations.estimateChunks`.

On successful submit, the client SHALL call `translations.create` and navigate to the chapter detail page.

#### Scenario: Provider and model selection

- **WHEN** user opens the translate page
- **THEN** provider and model dropdowns are visible and model options reflect the selected provider

#### Scenario: Successful start redirects to chapter detail

- **WHEN** user selects provider and model and submits
- **THEN** a translation job is created and the browser navigates to the chapter detail page

#### Scenario: Invalid chapter returns 404

- **WHEN** user navigates to translate URL with a non-existent chapter id
- **THEN** Next.js renders the not-found page

### Requirement: Translation status polling on chapter detail

The chapter detail translations section SHALL include a Client Component that polls `translations.listByChapter` every 3 seconds while any translation has status `QUEUED` or `PROCESSING`, and stops polling when all translations are `COMPLETED` or `FAILED`.

Initial translation list data SHALL be server-fetched via `translations.listByChapter` in the RSC page.

#### Scenario: Chunk progress updates while processing

- **WHEN** a translation is processing and the user views the chapter detail page
- **THEN** per-chunk status rows update without a full page reload as chunks complete

#### Scenario: Polling stops on completion

- **WHEN** all translations on the page reach status `COMPLETED` or `FAILED` with no chunks in a re-queued state
- **THEN** polling stops

### Requirement: Translation list UI on chapter detail

The chapter detail page translations section SHALL display each translation with provider label, model label, overall status badge, and a **collapsible** list of chunks. The chunk list SHALL be **collapsed by default**. A toggle control (e.g. "Show chunks (N)" / "Hide chunks") SHALL expand or collapse the chunk rows. The toggle control SHALL use a pointer cursor and a visible hover affordance (e.g. background or text color change) to indicate it is interactive.

When expanded, chunk rows SHALL be rendered as a **table** with columns for chunk number (1-based label derived from `chunkIndex`), status badge, error message (when failed), and retry action. Each chunk row SHALL show chunk `errorMessage` when failed.

Each translation row SHALL open the translation review modal **only when translation status is `COMPLETED`**. Rows with status `QUEUED`, `PROCESSING`, or `FAILED` SHALL NOT be clickable for modal open and SHALL NOT use pointer/hover affordances that imply clickability. Chunk expand/collapse toggles and chunk retry buttons SHALL NOT open the modal (click event SHALL NOT propagate to the row handler).

When no translations exist, the empty state SHALL include a link or button to the translate page. When translations exist, a **New Translation** action SHALL link to the translate page.

Failed translations SHALL expose a **Retry all** action calling `translations.retry`. **Every chunk row** SHALL expose a **Retry** action calling `translations.retryChunk`, regardless of chunk status (`PENDING`, `COMPLETED`, or `FAILED`).

Completed and failed translations SHALL expose a **Delete** action calling `translations.delete` after confirmation in a shadcn `AlertDialog`. Translations with status `QUEUED` or `PROCESSING` SHALL NOT show a delete action.

The Delete button click event SHALL NOT propagate to the row handler (same pattern as Retry).

#### Scenario: Empty state links to translate

- **WHEN** a chapter has no translations
- **THEN** the user can navigate to the translate page from the empty state

#### Scenario: Chunk list collapsed by default

- **WHEN** a translation with chunks is displayed on the chapter detail page
- **THEN** chunk rows are hidden until the user expands the chunk list

#### Scenario: User expands chunk list

- **WHEN** user clicks the chunk list toggle on a translation row
- **THEN** per-chunk status rows are visible without opening the review modal

#### Scenario: Chunk toggle shows hover affordance

- **WHEN** user hovers over the Show chunks / Hide chunks toggle
- **THEN** the cursor changes to pointer and a visible hover style is applied

#### Scenario: Chunk rows render as table

- **WHEN** the chunk list is expanded on the chapter detail page or shown in the review modal
- **THEN** chunks are displayed in a table with columns for number, status, error (when failed), and retry action

#### Scenario: Any chunk shows per-chunk retry

- **WHEN** a translation has chunks with any status (`PENDING`, `COMPLETED`, or `FAILED`)
- **THEN** each chunk row includes a Retry action that calls `translations.retryChunk`

#### Scenario: Failed translation shows retry all

- **WHEN** a translation has status `FAILED` and one or more failed chunks
- **THEN** the user can trigger retry-all from the translation row

#### Scenario: Completed translation row opens review modal

- **WHEN** user clicks a translation row with status `COMPLETED` (outside action buttons and chunk toggle)
- **THEN** the translation review modal opens for that translation

#### Scenario: Non-completed translation row does not open modal

- **WHEN** user clicks a translation row with status `QUEUED`, `PROCESSING`, or `FAILED` (outside action buttons and chunk toggle)
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

### Requirement: Translation review modal on chapter detail

The chapter detail translations section SHALL open a review modal when the user clicks a **completed** translation list item. The modal SHALL be a Client Component using shadcn `Dialog`.

When opened, the modal SHALL fetch translation details via `translations.getById` for the selected translation id. The modal header SHALL display provider label, model label, status badge, and started timestamp.

The modal body SHALL be scrollable and display status-appropriate content:

- When status is `COMPLETED`, display the full `polishedContent` text with preserved paragraph breaks (`whitespace-pre-wrap`)
- When status is `QUEUED`, display a message that the translation has not started and list chunks as pending
- When status is `PROCESSING` or `FAILED`, display a per-chunk status list with chunk number, status badge, and error message for failed chunks
- **Every chunk row** in the modal SHALL include a per-chunk Retry action regardless of chunk status

Retry buttons in the modal and list SHALL NOT open the modal when clicked from the list (click event SHALL NOT propagate to the row handler).

#### Scenario: Completed translation shows polished text

- **WHEN** user clicks a completed translation list item with non-null `polishedContent`
- **THEN** a modal opens displaying the full polished text in a scrollable area

#### Scenario: Non-completed translation does not open modal from list

- **WHEN** user clicks a translation list item with status other than `COMPLETED`
- **THEN** the review modal does not open

#### Scenario: Modal chunk list shows retry for all statuses

- **WHEN** the review modal is open and displays chunk rows
- **THEN** each chunk row includes a Retry action regardless of chunk status

#### Scenario: Retry does not open modal

- **WHEN** user clicks a Retry or Retry all button on a failed translation or chunk
- **THEN** the retry mutation runs and the review modal does not open

#### Scenario: Modal closes on dismiss

- **WHEN** user closes the review modal
- **THEN** the selected translation id is cleared and the modal unmounts or hides

### Requirement: Route config translate helper

`src/configs/routes/index.ts` SHALL export:

- `chapterTranslate: (novelId: string, chapterId: string) => string` → `/novels/${novelId}/chapters/${chapterId}/translate`

#### Scenario: Route helper produces correct path

- **WHEN** `routes.chapterTranslate("abc", "xyz")` is called
- **THEN** it returns `/novels/abc/chapters/xyz/translate`
