## MODIFIED Requirements

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
