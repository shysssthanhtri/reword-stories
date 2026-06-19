## Why

The chapter detail page now shows per-chunk progress under each translation, but the list is always expanded and noisy for long chapters. Clicking any translation opens the review modal even when there is nothing useful to read yet, and chunk retry is limited to failed chunks even though users may want to re-run a completed segment for better output.

## What Changes

- Make the chunk list under each translation **collapsible** (expand/collapse toggle) so the default view stays compact.
- **Restrict translation row clicks** so the review modal opens only when translation status is `COMPLETED` (finished). In-flight and failed translations remain non-clickable for modal open; action buttons (retry, delete) stay available.
- **Allow per-chunk retry for any chunk status** (`PENDING`, `COMPLETED`, `FAILED`), not only failed chunks — including re-processing already-done chunks.
- Update `translations.retryChunk` API validation and reset semantics to support re-queuing non-failed chunks.

## Capabilities

### New Capabilities

_(none — behavior extends existing translation list and chunk retry capabilities)_

### Modified Capabilities

- `translation-crud`: Expandable chunk list UI; translation row opens review modal only when completed; per-chunk retry shown for all statuses.
- `chunk-retry`: `retryChunk` accepts any chunk status and re-queues that chunk for processing.

## Impact

- **UI**: `TranslationList`, `TranslationChunkList`, possibly `TranslationReviewModal` (align retry visibility with list).
- **API**: `src/server/routers/translations.ts` — relax `retryChunk` status guard; reset `polishedSlice` when re-queuing completed chunks.
- **Specs**: Delta updates to `translation-crud` and `chunk-retry`.
- **Queue**: Existing consumer already processes next `PENDING | FAILED` chunk; retried completed chunks become `PENDING` and re-enter the pipeline.
