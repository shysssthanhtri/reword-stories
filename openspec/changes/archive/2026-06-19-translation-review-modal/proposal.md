## Why

The chapter detail translations list shows job metadata (provider, model, status, progress) but no way to read the polished output. Content managers need to review translation quality before shipping to readers; the immersive reader view is for end-user consumption, not editorial review. A quick in-context preview closes that gap without leaving the chapter management flow.

## What Changes

- Make each translation list item clickable; clicking opens a modal with the translation result
- Add a `TranslationReviewModal` Client Component using shadcn `Dialog` to display polished text in a scrollable, readable layout
- Lazy-load translation content via existing `translations.getById` when the modal opens (avoids sending large `polishedContent` payloads in the list query)
- Slim `translations.listByChapter` to exclude `polishedContent` from its Prisma select (list stays lightweight)
- Extend `translations.getById` response contract to explicitly include `polishedContent` for review
- Show status-appropriate modal states: full polished text when `COMPLETED`, progress message when `QUEUED`/`PROCESSING`, error details when `FAILED`
- Preserve existing retry action on failed items (retry button remains; does not trigger modal open)

**Out of scope:** side-by-side raw MT comparison (deferred v1.5), inline editing, reader themes/font controls, opening modal from other pages.

## Capabilities

### New Capabilities

_(none)_

### Modified Capabilities

- `translation-crud`: Translation list items open a review modal; `listByChapter` excludes heavy content fields; `getById` serves review content on demand

## Impact

- **Modified files:** `src/components/translations/translation-list.tsx`, `src/server/routers/translations.ts`, `openspec/specs/translation-crud/spec.md` (via delta)
- **New files:** `src/components/translations/translation-review-modal.tsx`
- **Dependencies:** shadcn `Dialog` (already installed)
- **Database:** No schema changes; query `select` adjustments only
