## 1. API — relax chunk retry

- [x] 1.1 Remove `FAILED`-only guard in `translations.retryChunk` (`src/server/routers/translations.ts`)
- [x] 1.2 On retry, reset chunk to `PENDING` and clear `errorMessage`, `polishedSlice`, and `tokenCount`
- [x] 1.3 On retry, set translation to `QUEUED`, clear `errorMessage`, clear `polishedContent` when previously `COMPLETED`, and recompute `progressPct` from completed chunk count
- [x] 1.4 Keep `kickoffTranslation` call after transaction

## 2. UI — collapsible chunk list

- [x] 2.1 Wrap chunk rows in shadcn `Collapsible` inside `TranslationChunkList` or `TranslationList` (default collapsed)
- [x] 2.2 Add expand/collapse trigger showing chunk count (e.g. "Show chunks (N)" / "Hide chunks") with `stopPropagation` on click
- [x] 2.3 Ensure collapsible toggle does not open the review modal

## 3. UI — modal open and retry visibility

- [x] 3.1 Gate translation row `onClick` to `COMPLETED` status only; remove pointer/hover styling for non-completed rows
- [x] 3.2 Show per-chunk **Retry** for all chunk statuses in `TranslationChunkList` (remove `FAILED`-only condition)
- [x] 3.3 Align `TranslationReviewModal` chunk retry with list behavior (retry on all statuses)

## 4. Verify

- [x] 4.1 Run lint and typecheck
- [x] 4.2 Manually verify: chunk list collapses/expands, non-completed rows don't open modal, completed row opens modal, retry works on completed/failed/pending chunks
