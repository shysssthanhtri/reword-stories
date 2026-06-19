# Novel CRUD

Delta spec for paginated chapters data table on novel detail page.

## MODIFIED Requirements

### Requirement: Novels tRPC router procedures

The `novels` router SHALL expose:

- `list` — query accepting optional input `{ page?: number; pageSize?: number; q?: string; sortBy?: "createdAt" | "chapterCount"; sortDir?: "asc" | "desc" }` and returning `{ items, totalCount, page, pageSize }` where each item includes `id`, `title`, `sourceLanguage`, `createdAt`, and chapter count. Defaults: `page = 1`, `pageSize = 10`, `sortBy = createdAt`, `sortDir = desc`. `page` SHALL be a positive integer; `pageSize` SHALL be between 1 and 50 inclusive. When `q` is a non-empty trimmed string, results SHALL be filtered to novels whose title contains `q` case-insensitively. Results SHALL be ordered by the requested `sortBy` and `sortDir`.
- `getById` — query accepting `{ id: string }` returning novel metadata (`id`, `title`, `sourceLanguage`, `createdAt`, `updatedAt`) without embedded chapters
- `create` — mutation accepting `{ title: string; sourceLanguage: string }` returning the created novel

Title SHALL be required, trimmed, and between 1 and 200 characters.

#### Scenario: List returns paginated novels newest first by default

- **WHEN** `novels.list` is called with `{ page: 1, pageSize: 10 }` and 25 novels exist in the database
- **THEN** the response includes 10 items ordered by `createdAt` descending, `totalCount` of 25, `page` of 1, and `pageSize` of 10

#### Scenario: List defaults to first page

- **WHEN** `novels.list` is called with no input
- **THEN** the response uses `page = 1`, `pageSize = 10`, `sortBy = createdAt`, and `sortDir = desc`

#### Scenario: List page beyond range returns empty items

- **WHEN** `novels.list` is called with `{ page: 99, pageSize: 10 }` and only 3 novels exist
- **THEN** `items` is an empty array and `totalCount` is 3

#### Scenario: List filters by title search

- **WHEN** `novels.list` is called with `{ q: "solo" }` and novels titled "Solo Leveling" and "Tower of God" exist
- **THEN** only "Solo Leveling" appears in `items` and `totalCount` reflects the filtered count

#### Scenario: List sorts by chapter count ascending

- **WHEN** `novels.list` is called with `{ sortBy: "chapterCount", sortDir: "asc" }`
- **THEN** items are ordered by chapter count from lowest to highest

#### Scenario: List sorts by created date descending

- **WHEN** `novels.list` is called with `{ sortBy: "createdAt", sortDir: "desc" }`
- **THEN** items are ordered by `createdAt` from newest to oldest

#### Scenario: Get by id returns metadata only

- **WHEN** `novels.getById` is called for a novel with two chapters
- **THEN** the response includes novel metadata and does not include a `chapters` array

#### Scenario: Get by id not found

- **WHEN** `novels.getById` is called with a non-existent id
- **THEN** the procedure returns a NOT_FOUND tRPC error

#### Scenario: Create persists novel

- **WHEN** `novels.create` is called with `{ title: "Solo Leveling", sourceLanguage: "ko" }`
- **THEN** a `Novel` row is inserted and returned with a generated `id`

### Requirement: Novel detail page at /novels/[novelId]

The route `src/app/(app)/novels/(novel)/[novelId]/page.tsx` SHALL be a React Server Component that server-fetches novel metadata via `novels.getById` and a paginated chapter list via `chapters.list` using URL search params (`page`, optional `pageSize`, optional `q`, optional `sortBy`, optional `sortDir`). It SHALL display the novel title, source language label, and a **Chapters** section with an **Add Chapter** button linking to `/novels/[novelId]/chapters/new`.

When chapters exist or a search query is applied, the page SHALL render a title search input and a data table (not a link list) with columns for **Title**, **#**, and **Created**. Each title cell SHALL link to `/novels/[novelId]/chapters/[chapterId]` and display the chapter title or fallback `Chapter {sortOrder + 1}`. The **#** column SHALL display `sortOrder + 1`. The **#** and **Created** column headers SHALL be sortable and update URL search params on click. Pagination controls SHALL appear below the table and navigate via URL search params so page changes are server-rendered. When a search query matches no chapters, a no-results message SHALL be shown while preserving the search input value.

When no chapters exist and no search query is applied, an empty state SHALL prompt the user to add a chapter with a link/button to `/novels/[novelId]/chapters/new`.

Unknown `novelId` SHALL render a not-found response (`notFound()`).

#### Scenario: Detail shows novel metadata

- **WHEN** user navigates to `/novels/[validId]`
- **THEN** the page shows the novel title and human-readable source language

#### Scenario: Detail shows add chapter button

- **WHEN** user navigates to a valid novel detail page
- **THEN** an **Add Chapter** button links to `/novels/[novelId]/chapters/new`

#### Scenario: Detail lists chapters in a table

- **WHEN** user navigates to a novel with chapters
- **THEN** chapters appear in a table with title, chapter number, and created date; each title links to its chapter detail page

#### Scenario: Pagination via URL

- **WHEN** user navigates to `/novels/[novelId]?page=2`
- **THEN** the server fetches page 2 of chapters and the table shows the second page with pagination controls reflecting the current page

#### Scenario: Search by title via URL

- **WHEN** user navigates to `/novels/[novelId]?q=prologue`
- **THEN** the server fetches chapters whose titles match "prologue" case-insensitively and the search input shows the query

#### Scenario: Sort by chapter order via URL

- **WHEN** user navigates to `/novels/[novelId]?sortBy=sortOrder&sortDir=desc`
- **THEN** the table rows are ordered by `sortOrder` descending and the **#** header reflects the active sort

#### Scenario: No search results

- **WHEN** user searches for a chapter title that matches no chapters
- **THEN** a no-results message is shown and the search input retains the query

#### Scenario: Detail shows actionable empty chapters state

- **WHEN** user navigates to a novel with zero chapters and no search query
- **THEN** the chapters section shows an empty state with a link to add a chapter

#### Scenario: Invalid novel id returns 404

- **WHEN** user navigates to `/novels/nonexistent-id`
- **THEN** Next.js renders the not-found page

### Requirement: Shared loading skeleton for new and detail routes

The routes `/novels/new` and `/novels/[novelId]` SHALL share a single loading boundary via a `(novel)` route group at `src/app/(app)/novels/(novel)/loading.tsx`. That file SHALL render a shared `NovelPageSkeleton` component that mimics the single-column page layout: back-link/header placeholder, title block, and content card placeholders. The detail skeleton SHALL include a chapters section with search input placeholder, table header row, multiple table row placeholders, and pagination control placeholders.

#### Scenario: New and detail share one loading file

- **WHEN** inspecting the novels route tree
- **THEN** `new/page.tsx` and `[novelId]/page.tsx` live under `novels/(novel)/` and both inherit `novels/(novel)/loading.tsx`

#### Scenario: Shared skeleton component exists

- **WHEN** inspecting `src/components/novels/skeletons/novel-page-skeleton.tsx`
- **THEN** it is imported by `novels/(novel)/loading.tsx` and uses shadcn `Skeleton` primitives

#### Scenario: Detail skeleton mimics chapter table layout

- **WHEN** inspecting `NovelPageSkeleton` with `showChaptersSection` enabled
- **THEN** the chapters section includes placeholders for search input, table headers, table rows, and pagination controls

#### Scenario: List skeleton is not shown for new or detail navigation

- **WHEN** user navigates to `/novels/new` or `/novels/[novelId]`
- **THEN** `NovelPageSkeleton` is shown (not `NovelListSkeleton`) while the page loads
