## Why

The expandable chunk list on the chapter detail page lacks basic interactive affordances: the Show/Hide chunks toggle does not show a pointer cursor or hover feedback, making it unclear that it is clickable. Chunk rows are rendered as a flat list, which is harder to scan when a chapter has many chunks — a table layout aligns better with the status/number/retry columns already present.

## What Changes

- Add `cursor-pointer` and hover styling (e.g. muted background or text color shift) to the Show chunks / Hide chunks collapsible trigger
- Replace the chunk row `<ul>` layout with a shadcn `Table` (columns: chunk number, status, error message, retry action)
- Apply the table layout in both the collapsible chapter-detail chunk list and the non-collapsible chunk list inside the review modal
- Preserve existing behavior: collapsed by default, `stopPropagation` on toggle/retry, per-chunk retry for all statuses

## Capabilities

### New Capabilities

_(none)_

### Modified Capabilities

- `translation-crud`: Update chunk list UI requirements — table layout for chunk rows; pointer cursor and hover affordance on expand/collapse toggle

## Impact

- `src/components/translations/translation-chunk-list.tsx` — primary UI change (table + hover on trigger)
- `src/components/ui/table.tsx` — already present; no new dependency
- `openspec/specs/translation-crud/spec.md` — delta spec for updated UI requirements
- No API, database, or queue changes
