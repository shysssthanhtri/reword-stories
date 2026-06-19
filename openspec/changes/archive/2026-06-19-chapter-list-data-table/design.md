## Context

The novel detail page at `/novels/[novelId]` currently fetches the novel via `novels.getById`, which embeds all chapters ordered by `sortOrder`, and renders them as a vertical stack of bordered links. The novels library at `/novels` was recently upgraded to a paginated TanStack Table with URL-driven search and sort (`2026-06-19-novel-list-data-table`). The project already has `@tanstack/react-table`, shadcn `Table`/`Pagination` primitives, and reusable patterns in `novel-list-*` components and `buildNovelListUrl`.

The novel detail page is SSR-first: a React Server Component calls tRPC on the server. List state should remain bookmarkable via URL search params on the same route.

## Goals / Non-Goals

**Goals:**

- Replace the chapter link list with a scannable data table showing title (with fallback), chapter number, and created date
- Add server-side pagination, title search, and column sorting scoped to a single novel
- Keep all list state SSR-friendly via URL search params on `/novels/[novelId]`
- Preserve the existing empty state, novel header, and **Add Chapter** button
- Mirror the novels library component structure for consistency and maintainability

**Non-Goals:**

- Sorting by title text (only `sortOrder` and `createdAt`)
- Searching untitled chapters by display label (`Chapter N`)
- Bulk selection, inline edit/delete, drag-and-drop reorder
- Client-side-only filtering of a full dataset
- Changing chapter create or detail flows

## Decisions

### 1. List state via URL search params on novel detail route

**Choice:** `/novels/[novelId]?page=2&pageSize=10&q=prologue&sortBy=sortOrder&sortDir=asc` — the RSC page reads `searchParams`, passes them to `chapters.list`, and renders the matching slice.

| Param | Values | Default |
|-------|--------|---------|
| `page` | positive integer | `1` |
| `pageSize` | 1–50 | `10` |
| `q` | string (trimmed) | _(empty — no filter)_ |
| `sortBy` | `sortOrder` \| `createdAt` | `sortOrder` |
| `sortDir` | `asc` \| `desc` | `asc` |

**Alternatives considered:**

- *Dedicated `/novels/[novelId]/chapters` route* — cleaner URL separation but adds a route and breaks the current detail-page layout; unnecessary for v1.
- *Client-side search/sort* — loads all chapters; poor fit as chapter count grows.

**Rationale:** Matches SSR-first architecture and the novels library pattern. Filter changes trigger server re-fetch and are bookmarkable.

### 2. New `chapters.list` procedure; slim `novels.getById`

**Choice:** Add `chapters.list` with required `novelId` and optional `{ page?, pageSize?, q?, sortBy?, sortDir? }`, returning `{ items, totalCount, page, pageSize }`. Each item includes `id`, `title`, `sortOrder`, `createdAt` (no `rawContent`).

Remove the embedded `chapters` array from `novels.getById` — return novel metadata only (`id`, `title`, `sourceLanguage`, `createdAt`, `updatedAt`).

**Query behavior:**

- **Scope:** `where: { novelId }` always applied
- **Search:** When `q` is non-empty, add `title: { contains: q, mode: 'insensitive' }` (chapters with `title: null` are excluded from search results)
- **Sort by order:** `orderBy: { sortOrder: sortDir }`
- **Sort by created:** `orderBy: { createdAt: sortDir }`
- **Count + slice:** Parallel `count({ where })` and `findMany({ where, orderBy, skip, take, select: { id, title, sortOrder, createdAt } })`
- **Parent check:** Verify novel exists before querying; NOT_FOUND if missing

**Defaults:** `page = 1`, `pageSize = 10`, `sortBy = sortOrder`, `sortDir = asc`.

**Rationale:** Separates metadata fetch from paginated list, matching how `/novels` uses `novels.list` instead of loading everything. `getById` callers that only need existence (create chapter page) are unaffected.

### 3. TanStack Table + shadcn Table for the UI

**Choice:** Client Component `ChapterListTable` receives pre-fetched `items`, `novelId`, and current sort state as props. Column definitions in `chapter-list-columns.tsx`. **#** and **Created** headers render sort affordances and link to toggled sort URLs via `buildChapterListUrl`.

**Sort toggle:** Clicking a sortable header flips `sortDir` when already active on that column, otherwise sets `sortBy` to that column with `sortDir = desc` for `createdAt` and `asc` for `sortOrder`. Implemented via `<Link>` preserving other params; resets to `page=1` on sort change.

**Server/client boundary:**

| Piece | Type |
|-------|------|
| `[novelId]/page.tsx` | Server Component — reads searchParams, calls `novels.getById` + `chapters.list` |
| `ChapterListSearch` | Client Component — controlled input; navigates via `router.push` preserving params |
| `ChapterListTable` | Client Component — TanStack Table rendering + sort header links |
| `ChapterListPagination` | Server Component — `<Link href="?...">` prev/next preserving `q`, `sortBy`, `sortDir` |
| `NovelDetailHeader`, empty state | Server Component (unchanged) |

### 4. Title search input

**Choice:** Search bar above the table using shadcn `Input`. On submit, navigate to `/novels/[novelId]?q={value}&page=1` preserving current `sortBy`, `sortDir`, and `pageSize`. Empty submit clears `q`.

**Rationale:** Explicit submit matches novels library behavior and keeps server round-trips predictable.

### 5. Pagination controls

**Choice:** Reuse the novels library pagination pattern: shadcn `Pagination` with prev/next plus "Page X of Y". Disable prev on page 1 and next on last page. Optional page-size `<Select>` (10 / 20 / 50) that resets to page 1. All links preserve `q`, `sortBy`, and `sortDir`.

### 6. Created date formatting

**Choice:** Display locale-formatted date (e.g. `Jun 19, 2026`) using `Intl.DateTimeFormat`, same as novels library.

### 7. Empty vs no-results states

**Choice:**

- **Empty chapters** (`totalCount === 0` and no `q`): existing `NovelChaptersEmptyState` with "Add chapter" CTA
- **No search results** (`totalCount === 0` and `q` present): table shell with "No chapters match your search" message; search input retains the query

### 8. URL helper scoped to novel

**Choice:** `buildChapterListUrl(novelId, params)` and `getChapterListSortUrl(column, novelId, current)` in `src/lib/chapter-list-url.ts`, mirroring `novel-list-url.ts`.

## Risks / Trade-offs

- **[Breaking `novels.getById` shape]** → Removes embedded `chapters` array. Mitigated: only two callers (`[novelId]/page.tsx` and `chapters/new/page.tsx`); both updated in same change; `chapters/new` only checks existence.
- **[Search excludes untitled chapters]** → `title: null` chapters won't match `q`. Mitigated: acceptable for v1; users can search after adding titles or browse by sort order.
- **[Two server calls on detail page]** → `getById` + `chapters.list`. Mitigated: metadata fetch is lightweight; parallel `Promise.all` keeps latency low.
- **[Client bundle duplication]** → New chapter-list components add JS similar to novel-list. Mitigated: TanStack Table already in bundle; patterns are copy-adapt not new dependencies.

## Migration Plan

1. Add Zod schema for `chapters.list` input in `src/lib/validations/chapter.ts`
2. Add `chapters.list` procedure; slim `novels.getById` to metadata only
3. Build `chapter-list-*` components and `buildChapterListUrl` helper
4. Update `[novelId]/page.tsx` to read searchParams and render table/search/pagination
5. Update `NovelPageSkeleton` chapters section to mimic table layout
6. Manual QA: empty state, search match/miss, sort both columns asc/desc, pagination with filters applied

No database migration. Rollback: revert UI and restore embedded chapters on `getById`.

## Open Questions

- None blocking.
