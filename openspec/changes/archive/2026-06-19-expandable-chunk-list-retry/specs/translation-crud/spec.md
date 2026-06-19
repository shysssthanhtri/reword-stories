## MODIFIED Requirements

### Requirement: Translation list UI on chapter detail

The chapter detail page translations section SHALL display each translation with provider label, model label, overall status badge, and a **collapsible** list of chunks. The chunk list SHALL be **collapsed by default**. A toggle control (e.g. "Show chunks (N)" / "Hide chunks") SHALL expand or collapse the chunk rows. Each chunk row SHALL show chunk number (1-based label derived from `chunkIndex`), chunk status badge, and chunk `errorMessage` when failed.

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
