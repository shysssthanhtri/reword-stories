## Why

The novel detail page at `/novels/[novelId]` currently renders chapters as a vertical stack of bordered links with no pagination, search, or sort. After the novels library gained a data table (`2026-06-19-novel-list-data-table`), long-running translation projects with dozens of pasted chapters will hit the same scanning problem on the detail page. A tabular layout with title search, sortable columns, and server-side pagination keeps chapter management consistent with the library and scales as chapter count grows.

## What Changes

- Replace the chapter link list on the novel detail page with a shadcn data table (TanStack Table + existing `Table` primitives), mirroring the novels library pattern
- Add server-side pagination via URL search params (`page`, optional `pageSize`) on `/novels/[novelId]`
- Add server-side title search via URL search param `q` (case-insensitive partial match on chapter `title`)
- Add server-side sorting via URL search params `sortBy` (`sortOrder` | `createdAt`) and `sortDir` (`asc` | `desc`); **#** (chapter order) and **Created** column headers are sortable
- Add `chapters.list` tRPC procedure accepting `{ novelId, page?, pageSize?, q?, sortBy?, sortDir? }` and returning `{ items, totalCount, page, pageSize }`
- Slim `novels.getById` to return novel metadata only (no embedded chapters array); chapter data comes from `chapters.list`
- Display table columns: **Title** (link to chapter detail, fallback `Chapter {sortOrder + 1}`), **#** (display `sortOrder + 1`), **Created** (formatted date)
- Add search input above the table and pagination controls below (previous/next, page indicator, optional page-size selector)
- Update `NovelPageSkeleton` chapters section to mimic search bar, table, and pagination layout during loading
- Preserve the existing empty state when the novel has zero chapters (no search/filter applied)

**Out of scope:** sorting by title text, bulk actions, row selection, inline edit/delete, reordering chapters.

## Capabilities

### New Capabilities

_(none)_

### Modified Capabilities

- `chapter-crud`: Add paginated, searchable, sortable `chapters.list` procedure scoped to a novel
- `novel-crud`: Novel detail page chapters section switches from link list to paginated data table with title search and sortable **#** / **Created** columns; `novels.getById` returns metadata only; `NovelPageSkeleton` updated to match table layout

## Impact

- **Modified files:** `src/server/routers/chapters.ts`, `src/server/routers/novels.ts`, `src/app/(app)/novels/(novel)/[novelId]/page.tsx`, `src/components/novels/skeletons/novel-page-skeleton.tsx`, `src/lib/validations/chapter.ts`
- **New files:** `src/components/chapters/chapter-list-table.tsx`, `src/components/chapters/chapter-list-columns.tsx`, `src/components/chapters/chapter-list-search.tsx`, `src/components/chapters/chapter-list-pagination.tsx`, `src/lib/chapter-list-url.ts`
- **Dependencies:** `@tanstack/react-table` (already installed from novel list change)
- **Database:** No schema changes; Prisma `where` (novelId + optional title filter), `orderBy` (sortOrder or createdAt), `skip`/`take`
