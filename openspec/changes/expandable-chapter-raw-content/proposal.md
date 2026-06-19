## Why

After a chapter is created, the chapter detail page is primarily used to manage translations and read polished output — not to re-read the pasted machine-translated source. Today the full `rawContent` block is always visible and can dominate the page (up to 100k characters), pushing the more important translations section below the fold. Collapsing raw content by default keeps the page focused while still allowing users to expand it when they need to verify what was pasted.

## What Changes

- Make the raw content section on the chapter detail page collapsible/expandable
- Default to **collapsed** so translations and actions are immediately visible
- Show a compact summary in the collapsed state (section label + character count) so users know content is there without reading it
- Preserve full raw text display when expanded (same pre-wrapped, scrollable formatting as today)
- No API, data model, or routing changes

## Capabilities

### New Capabilities

_(none)_

### Modified Capabilities

- `chapter-crud`: Update the chapter detail page requirement — raw content is shown in a collapsible section (collapsed by default) instead of always fully visible.

## Impact

- `src/components/chapters/chapter-raw-content.tsx` — primary UI change (likely becomes a Client Component using shadcn `Collapsible`)
- `src/app/(app)/novels/(novel)/[novelId]/chapters/[chapterId]/page.tsx` — may pass character count to the raw content component; no data-fetching changes
- Existing shadcn `Collapsible` component (`src/components/ui/collapsible.tsx`) — reused, no new dependencies
