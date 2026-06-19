## 1. Chunk list table layout

- [x] 1.1 In `translation-chunk-list.tsx`, replace the chunk `<ul>` with shadcn `Table` (columns: Chunk, Status, Error, Actions)
- [x] 1.2 Render chunk number (1-based from `chunkIndex`), `ChunkStatusBadge`, error message for failed chunks, and Retry button per row
- [x] 1.3 Allow error column text to wrap (`whitespace-normal` / word-break) for long messages
- [x] 1.4 Keep `stopPropagation` on Retry button clicks unchanged

## 2. Collapsible trigger hover affordance

- [x] 2.1 Add `cursor-pointer` and hover styles (`hover:bg-muted/50`, `hover:text-foreground`, `rounded-sm`) to `CollapsibleTrigger`
- [x] 2.2 Preserve existing chevron rotation and Show/Hide chunks label toggle behavior

## 3. Verify both surfaces

- [x] 3.1 Confirm table renders correctly when chunk list is expanded on chapter detail (`TranslationList`)
- [x] 3.2 Confirm table renders correctly in review modal non-collapsible mode (`TranslationReviewModal`)
- [x] 3.3 Manually verify: toggle shows pointer + hover, expand/collapse works, retry does not open modal, completed row still opens modal

## 4. Quality checks

- [x] 4.1 Run lint and typecheck; fix any issues introduced
