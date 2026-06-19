## Context

`TranslationChunkList` (`src/components/translations/translation-chunk-list.tsx`) renders chunk progress under each translation on the chapter detail page and inside the review modal (non-collapsible). The component was recently made collapsible with a Show/Hide chunks trigger, but the trigger lacks pointer cursor and hover styling. Chunk rows use a flat `<ul>` layout even though the data is columnar (number, status, error, retry).

The project already ships shadcn `Table` at `src/components/ui/table.tsx`. No API or data model changes are needed — this is a Client Component presentation update only.

## Goals / Non-Goals

**Goals:**

- Make the Show/Hide chunks toggle clearly interactive via `cursor-pointer` and hover styling
- Render chunk rows as a table for easier scanning on long chapters
- Reuse the same table layout in both collapsible (chapter detail) and non-collapsible (review modal) modes
- Preserve all existing interaction rules: `stopPropagation`, collapsed-by-default, per-chunk retry

**Non-Goals:**

- Sorting, filtering, or pagination of chunk rows
- Changing translation row click behavior or modal logic
- Adding new columns (e.g. token count, raw slice preview)
- Server-side rendering changes — `TranslationChunkList` remains a Client Component

## Decisions

### 1. Refactor chunk rows into shadcn `Table` inside `TranslationChunkList`

**Choice:** Replace the `<ul>` of chunk rows with `Table`, `TableHeader`, `TableBody`, `TableRow`, `TableCell`. Columns: **Chunk** (1-based index), **Status** (`ChunkStatusBadge`), **Error** (failed chunks only; empty cell otherwise), **Actions** (Retry button when `showRetry`).

**Rationale:** Single component owns both list and modal rendering via the existing `collapsible` prop. Avoids duplicating table markup in `TranslationReviewModal`.

**Alternatives considered:**
- Keep `<ul>` with CSS grid — works but diverges from shadcn patterns already in the repo
- Extract a separate `TranslationChunkTable` — unnecessary for ~70 lines of markup

### 2. Hover affordance on `CollapsibleTrigger`

**Choice:** Add `cursor-pointer`, `rounded-sm`, and `hover:bg-muted/50 hover:text-foreground` (or equivalent) to the trigger. Match the hover pattern used on clickable completed translation rows in `TranslationList`.

**Rationale:** Consistent with existing interactive affordances in the translations section. Minimal Tailwind change.

**Alternatives considered:**
- Underline on hover — less consistent with card/row hover patterns elsewhere
- Button variant for trigger — heavier visual weight than needed for a secondary expand control

### 3. Table header visibility

**Choice:** Show a compact header row (Chunk, Status, Error, Actions) above chunk data when the list is visible (both expanded collapsible and non-collapsible modal).

**Rationale:** Clarifies column meaning when many chunks are present; shadcn table headers are lightweight.

**Alternative:** Headerless table — rejected because error/retry columns are ambiguous without labels on wide layouts.

### 4. Server vs client boundary

**Choice:** No boundary change. `TranslationList` and `TranslationReviewModal` remain Client Components; chunk table is purely presentational within `TranslationChunkList`.

## Risks / Trade-offs

- **[Long error messages in table cells]** → Use `text-xs text-destructive` with word-break; error column can wrap. No truncation in v1.
- **[Table width on mobile]** → Table is inside a bordered translation card with horizontal scroll if needed (`overflow-x-auto` wrapper). Acceptable for personal-use v1.
- **[Modal vs list visual drift]** → Single shared component mitigates divergence.

## Migration Plan

No migration. Deploy as a frontend-only change. Rollback by reverting `translation-chunk-list.tsx`.

## Open Questions

None — requirements are straightforward UI polish.
