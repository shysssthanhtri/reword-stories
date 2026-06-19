## Why

The novels library at `/novels` currently renders a vertical stack of cards with no structure for scanning or managing many projects. As Steven adds more translation novels, a tabular layout with pagination, title search, and sortable columns will make it easier to find and compare projects without endless scrolling.

## What Changes

- Replace the card-based `NovelList` with a shadcn data table (TanStack Table + existing `Table` primitives)
- Add server-side pagination to the novels library page via URL search params (`page`, optional `pageSize`)
- Add server-side title search via URL search param `q` (case-insensitive partial match)
- Add server-side sorting via URL search params `sortBy` (`createdAt` | `chapterCount`) and `sortDir` (`asc` | `desc`); **Chapters** and **Created** column headers are sortable
- Extend `novels.list` tRPC procedure to accept pagination, search, and sort input; return `{ items, totalCount, page, pageSize }` instead of a flat array
- Display table columns: **Title** (link to detail), **Source language**, **Chapters**, **Created** (formatted date)
- Add a search input above the table and pagination controls below (previous/next, page indicator, optional page-size selector)
- Update `NovelListSkeleton` to mimic the search bar, table, and pagination layout during loading
- Preserve the existing empty state when the user has zero novels (no search/filter applied)

**Out of scope:** sorting by title or source language, bulk actions, row selection, delete/edit from the list.

## Capabilities

### New Capabilities

_(none)_

### Modified Capabilities

- `novel-crud`: Novels library page switches from card list to paginated data table with title search and sortable **Chapters** / **Created** columns; `novels.list` gains pagination, search, and sort contract; loading skeleton updated to match table layout

## Impact

- **Modified files:** `src/server/routers/novels.ts`, `src/app/(app)/novels/page.tsx`, `src/components/novels/novel-list.tsx`, `src/components/novels/skeletons/novel-list-skeleton.tsx`
- **New files:** `src/components/novels/novel-list-table.tsx`, `src/components/novels/novel-list-columns.tsx`, `src/components/novels/novel-list-search.tsx`, `src/components/novels/novel-list-pagination.tsx`
- **Dependencies:** `@tanstack/react-table` (new)
- **Database:** No schema changes; Prisma `where` (title filter), `orderBy` (createdAt or `_count.chapters`), `skip`/`take`
