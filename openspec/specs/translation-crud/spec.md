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

The `translations` router SHALL expose:

- `listProviders` — query returning registered providers with `{ id, label, models: [{ id, label, isFree? }] }`
- `estimateChunks` — query accepting `{ chapterId }` returning `{ chunkCount }` by running chunking on the chapter's raw content (NOT_FOUND if chapter missing)
- `create` — mutation accepting `{ chapterId, provider, modelName }` creating Translation + chunks, kicking off queue, returning `{ id, status, progressPct }`
- `getById` — query accepting `{ id }` returning translation fields including `polishedContent` for review (NOT_FOUND if missing)
- `listByChapter` — query accepting `{ chapterId }` returning translations for the chapter ordered by `createdAt` desc, excluding `polishedContent` from the response
- `retry` — mutation accepting `{ id }` resetting failed chunks and re-kickoff (BAD_REQUEST if not `FAILED`, NOT_FOUND if missing)

The router SHALL be registered on the root `AppRouter`.

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

The chapter detail translations section SHALL include a Client Component that polls `translations.getById` every 3 seconds for any translation with status `QUEUED` or `PROCESSING`, and stops polling when status becomes `COMPLETED` or `FAILED`.

Initial translation list data SHALL be server-fetched via `translations.listByChapter` in the RSC page.

#### Scenario: Progress updates while processing

- **WHEN** a translation is processing and the user views the chapter detail page
- **THEN** the status badge and progress percentage update without a full page reload

#### Scenario: Polling stops on completion

- **WHEN** a polled translation reaches status `COMPLETED`
- **THEN** polling for that translation stops

### Requirement: Translation list UI on chapter detail

The chapter detail page translations section SHALL display each translation with provider label, model label, status badge, progress percentage (when processing), and error message (when failed). Each translation row SHALL be clickable to open the translation review modal.

When no translations exist, the empty state SHALL include a link or button to the translate page. When translations exist, a **New Translation** action SHALL link to the translate page.

Failed translations SHALL expose a **Retry** action calling `translations.retry`.

#### Scenario: Empty state links to translate

- **WHEN** a chapter has no translations
- **THEN** the user can navigate to the translate page from the empty state

#### Scenario: Failed translation shows retry

- **WHEN** a translation has status `FAILED` and an error message
- **THEN** the user can trigger retry from the chapter detail page

#### Scenario: Translation row opens review modal

- **WHEN** user clicks a translation row on the chapter detail page
- **THEN** the translation review modal opens for that translation

### Requirement: Translation review modal on chapter detail

The chapter detail translations section SHALL open a review modal when the user clicks a translation list item. The modal SHALL be a Client Component using shadcn `Dialog`.

When opened, the modal SHALL fetch translation details via `translations.getById` for the selected translation id. The modal header SHALL display provider label, model label, status badge, and started timestamp.

The modal body SHALL be scrollable and display status-appropriate content:

- When status is `COMPLETED`, display the full `polishedContent` text with preserved paragraph breaks (`whitespace-pre-wrap`)
- When status is `QUEUED`, display a message that the translation has not started
- When status is `PROCESSING`, display a message with the current `progressPct`
- When status is `FAILED`, display the `errorMessage` and note that retry is available on the list

The Retry button on failed translation rows SHALL NOT open the modal (click event SHALL NOT propagate to the row handler).

#### Scenario: Completed translation shows polished text

- **WHEN** user clicks a translation list item with status `COMPLETED` and non-null `polishedContent`
- **THEN** a modal opens displaying the full polished text in a scrollable area

#### Scenario: Processing translation shows progress message

- **WHEN** user clicks a translation list item with status `PROCESSING`
- **THEN** a modal opens showing an in-progress message with the current progress percentage

#### Scenario: Failed translation shows error in modal

- **WHEN** user clicks a translation list item with status `FAILED`
- **THEN** a modal opens displaying the error message

#### Scenario: Retry does not open modal

- **WHEN** user clicks the Retry button on a failed translation
- **THEN** the retry mutation runs and the review modal does not open

#### Scenario: Modal closes on dismiss

- **WHEN** user closes the modal via the close button or overlay click
- **THEN** the modal closes and the translation list remains visible

### Requirement: Route config translate helper

`src/configs/routes/index.ts` SHALL export:

- `chapterTranslate: (novelId: string, chapterId: string) => string` → `/novels/${novelId}/chapters/${chapterId}/translate`

#### Scenario: Route helper produces correct path

- **WHEN** `routes.chapterTranslate("abc", "xyz")` is called
- **THEN** it returns `/novels/abc/chapters/xyz/translate`
