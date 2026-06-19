# Novel CRUD

Delta spec for paginated novels library data table with search and sort.

## MODIFIED Requirements

### Requirement: Novels tRPC router procedures

The `novels` router SHALL expose:

- `list` — query accepting optional input `{ page?: number; pageSize?: number; q?: string; sortBy?: "createdAt" | "chapterCount"; sortDir?: "asc" | "desc" }` and returning `{ items, totalCount, page, pageSize }` where each item includes `id`, `title`, `sourceLanguage`, `createdAt`, and chapter count. Defaults: `page = 1`, `pageSize = 10`, `sortBy = createdAt`, `sortDir = desc`. `page` SHALL be a positive integer; `pageSize` SHALL be between 1 and 50 inclusive. When `q` is a non-empty trimmed string, results SHALL be filtered to novels whose title contains `q` case-insensitively. Results SHALL be ordered by the requested `sortBy` and `sortDir`.
- `getById` — query accepting `{ id: string }` returning novel metadata and chapters ordered by `sortOrder` (empty array if none)
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

#### Scenario: Get by id includes chapters

- **WHEN** `novels.getById` is called for a novel with two chapters
- **THEN** the response includes both chapters sorted by `sortOrder`

#### Scenario: Get by id not found

- **WHEN** `novels.getById` is called with a non-existent id
- **THEN** the procedure returns a NOT_FOUND tRPC error

#### Scenario: Create persists novel

- **WHEN** `novels.create` is called with `{ title: "Solo Leveling", sourceLanguage: "ko" }`
- **THEN** a `Novel` row is inserted and returned with a generated `id`

### Requirement: Novels library page at /novels

The route `src/app/(app)/novels/page.tsx` SHALL be a React Server Component that server-fetches the paginated novel list using URL search params (`page`, optional `pageSize`, optional `q`, optional `sortBy`, optional `sortDir`) and renders a library view inside the app shell. The page SHALL include a **New Novel** link/button to `/novels/new`. When no novels exist and no search query is applied, an empty state SHALL prompt the user to create one.

When novels exist or a search query is applied, the page SHALL render a title search input and a data table (not cards) with columns for **Title**, **Source language**, **Chapters**, and **Created**. Each title cell SHALL link to `/novels/[id]`. The **Chapters** and **Created** column headers SHALL be sortable and update URL search params on click. Pagination controls SHALL appear below the table and navigate via URL search params so page changes are server-rendered. When a search query matches no novels, a no-results message SHALL be shown while preserving the search input value.

#### Scenario: Library lists existing novels in a table

- **WHEN** user navigates to `/novels` with novels in the database
- **THEN** novels appear in a table with title, source language, chapter count, and created date; each title links to `/novels/[id]`

#### Scenario: Empty library state

- **WHEN** user navigates to `/novels` with zero novels and no search query
- **THEN** an empty state message and link to create a novel are shown (no table or pagination)

#### Scenario: Pagination via URL

- **WHEN** user navigates to `/novels?page=2`
- **THEN** the server fetches page 2 and the table shows the second page of results with pagination controls reflecting the current page

#### Scenario: Search by title via URL

- **WHEN** user navigates to `/novels?q=solo`
- **THEN** the server fetches novels whose titles match "solo" case-insensitively and the search input shows the query

#### Scenario: Sort by chapters via URL

- **WHEN** user navigates to `/novels?sortBy=chapterCount&sortDir=asc`
- **THEN** the table rows are ordered by chapter count ascending and the **Chapters** header reflects the active sort

#### Scenario: No search results

- **WHEN** user searches for a title that matches no novels
- **THEN** a no-results message is shown and the search input retains the query

### Requirement: Novel list loading skeleton at /novels

The route segment `src/app/(app)/novels/loading.tsx` SHALL render a list-specific skeleton while the library page loads. The skeleton SHALL use shadcn `Skeleton` via a dedicated `NovelListSkeleton` component and mimic the table layout: page heading, **New Novel** action placeholder, search input placeholder, table header row, multiple table row placeholders, and pagination control placeholders.

#### Scenario: List route has its own loading boundary

- **WHEN** inspecting `src/app/(app)/novels/loading.tsx`
- **THEN** it renders `NovelListSkeleton` and does not reuse the new/detail skeleton

#### Scenario: List skeleton visible during navigation

- **WHEN** user navigates to `/novels` and the server component is pending
- **THEN** the list skeleton appears inside the app shell until the library page renders
