## Context

The novels library at `/novels` currently fetches all novels via `novels.list` and renders them as a vertical stack of shadcn `Card` components. The project already ships shadcn `Table` and `Pagination` primitives but no data-table pattern or TanStack Table integration yet. The app is SSR-first: the library page is a React Server Component that calls tRPC on the server.

## Goals / Non-Goals

**Goals:**

- Replace the card list with a scannable data table showing title, source language, chapter count, and created date
- Add server-side pagination, title search, and column sorting so the library scales as novel count grows
- Keep all list state SSR-friendly via URL search params (`?page=2&q=solo&sortBy=chapterCount&sortDir=desc`)
- Preserve the existing empty state and page header (**New Novel** button)

**Non-Goals:**

- Sorting by title or source language
- Full-text search beyond title
- Bulk selection, inline edit/delete
- Client-side-only filtering of a full dataset
- Changing novel detail, create, or chapter flows

## Decisions

### 1. List state via URL search params

**Choice:** `/novels?page=2&pageSize=10&q=solo&sortBy=createdAt&sortDir=desc` — the RSC page reads `searchParams`, passes them to `novels.list`, and renders the matching slice.

| Param | Values | Default |
|-------|--------|---------|
| `page` | positive integer | `1` |
| `pageSize` | 1–50 | `10` |
| `q` | string (trimmed) | _(empty — no filter)_ |
| `sortBy` | `createdAt` \| `chapterCount` | `createdAt` |
| `sortDir` | `asc` \| `desc` | `desc` |

**Alternatives considered:**

- *Client-side search/sort* — simpler UX for instant feedback but loads all novels; poor fit as library grows.
- *Separate tRPC mutations for search* — unnecessary; query params on a read operation are sufficient.

**Rationale:** Matches SSR-first architecture. Every filter change triggers a server re-fetch and is bookmarkable/shareable.

### 2. Extend `novels.list` with paginated, searchable, sortable response

**Choice:** Add optional Zod input `{ page?, pageSize?, q?, sortBy?, sortDir? }` and return `{ items, totalCount, page, pageSize }`.

**Query behavior:**

- **Search:** When `q` is non-empty, filter with Prisma `title: { contains: q, mode: 'insensitive' }`
- **Sort by created:** `orderBy: { createdAt: sortDir }`
- **Sort by chapters:** `orderBy: { chapters: { _count: sortDir } }`
- **Count + slice:** Parallel `count({ where })` and `findMany({ where, orderBy, skip, take })`

**Defaults:** `page = 1`, `pageSize = 10`, `sortBy = createdAt`, `sortDir = desc`.

### 3. TanStack Table + shadcn Table for the UI

**Choice:** Add `@tanstack/react-table` and a Client Component `NovelListTable` that receives pre-fetched `items` and current sort state as props. Column definitions in `novel-list-columns.tsx`. **Chapters** and **Created** headers render sort affordances (arrow icon) and link to the toggled sort URL.

**Sort toggle:** Clicking a sortable header flips `sortDir` when already active on that column, otherwise sets `sortBy` to that column with `sortDir = desc`. Implemented via `<Link>` preserving other params (`q`, `pageSize`); resets to `page=1` on sort change.

**Rationale:** Standard shadcn data-table pattern with server-side sorting — TanStack Table handles column layout; navigation stays link-based (no client fetch).

**Server/client boundary:**

| Piece | Type |
|-------|------|
| `novels/page.tsx` | Server Component — reads searchParams, calls tRPC |
| `NovelListSearch` | Client Component — controlled input; submits via `router.push` or native GET form preserving params |
| `NovelListTable` | Client Component — TanStack Table rendering + sort header links |
| `NovelListPagination` | Server Component — `<Link href="?...">` prev/next preserving `q`, `sortBy`, `sortDir` |
| `NovelLibraryHeader`, empty state | Server Component (unchanged) |

### 4. Title search input

**Choice:** Search bar above the table using shadcn `Input`. On submit (Enter or search button), navigate to `/novels?q={value}&page=1` preserving current `sortBy`, `sortDir`, and `pageSize`. Empty submit clears `q`.

**Alternatives considered:**

- *Debounced live search* — nicer UX but requires client-side navigation on every keystroke; acceptable as a follow-up.
- *Server-only GET form* — works without JS but loses controlled input for clearing; hybrid (client form + URL navigation) is fine.

**Rationale:** Explicit submit keeps server round-trips predictable and avoids query spam.

### 5. Pagination controls

**Choice:** shadcn `Pagination` with prev/next plus "Page X of Y". Disable prev on page 1 and next on last page. Optional page-size `<Select>` (10 / 20 / 50) that resets to page 1. All links preserve `q`, `sortBy`, and `sortDir`.

### 6. Created date formatting

**Choice:** Display locale-formatted date (e.g. `Jun 19, 2026`) using `Intl.DateTimeFormat`.

### 7. Empty vs no-results states

**Choice:**

- **Empty library** (`totalCount === 0` and no `q`): existing empty state with "Create novel" CTA
- **No search results** (`totalCount === 0` and `q` present): table shell with "No novels match your search" message; search input retains the query

## Risks / Trade-offs

- **[Breaking API shape]** → `novels.list` return type changes from array to paginated object. Mitigated: only one caller; updated in same PR.
- **[Chapter count sort performance]** → `_count` orderBy requires join. Mitigated: personal library scale is small; no index change needed for v1.
- **[Search partial match]** → `contains` may be slow at very large scale. Mitigated: acceptable for single-user side project; can add trigram index later.
- **[Client bundle size]** → TanStack Table adds JS. Mitigated: isolated to library page components.

## Migration Plan

1. Add `@tanstack/react-table` dependency
2. Update `novels.list` procedure and Zod input schema (pagination + search + sort)
3. Build search, table, and pagination components
4. Update `/novels` page, skeleton, and remove card rendering from `NovelList`
5. Manual QA: empty state, search match/miss, sort both columns asc/desc, pagination with filters applied

No database migration. Rollback: revert UI and restore flat `list` response.

## Open Questions

- None blocking.
