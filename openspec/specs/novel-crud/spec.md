# Novel CRUD

Novel library, create form, detail pages, and loading skeletons for the paste flow entry point.

## Requirements

### Requirement: Novel source language taxonomy

The application SHALL accept `sourceLanguage` as one of: `ko`, `ja`, `zh`, `vi`, `other`. Labels displayed in the UI SHALL be **Korean**, **Japanese**, **Chinese**, **Vietnamese**, and **Other** respectively. Validation SHALL be enforced in shared Zod schemas used by both tRPC and forms.

#### Scenario: Valid source language persisted

- **WHEN** user creates a novel with source language `ja`
- **THEN** the `Novel.sourceLanguage` column stores `ja`

#### Scenario: Invalid source language rejected

- **WHEN** a create request includes `sourceLanguage: "fr"`
- **THEN** validation fails before any database write

### Requirement: Novels tRPC router procedures

The `novels` router SHALL expose:

- `list` — query accepting optional input `{ page?: number; pageSize?: number; q?: string; sortBy?: "createdAt" | "chapterCount"; sortDir?: "asc" | "desc" }` and returning `{ items, totalCount, page, pageSize }` where each item includes `id`, `title`, `sourceLanguage`, `createdAt`, and chapter count. Defaults: `page = 1`, `pageSize = 10`, `sortBy = createdAt`, `sortDir = desc`. `page` SHALL be a positive integer; `pageSize` SHALL be between 1 and 50 inclusive. When `q` is a non-empty trimmed string, results SHALL be filtered to novels whose title contains `q` case-insensitively. Results SHALL be ordered by the requested `sortBy` and `sortDir`.
- `getById` — query accepting `{ id: string }` returning novel metadata (`id`, `title`, `sourceLanguage`, `createdAt`, `updatedAt`) without embedded chapters
- `create` — mutation accepting `{ title: string; sourceLanguage: string }` returning the created novel
- `delete` — mutation accepting `{ id: string }` deleting the novel and all descendant chapters, translations, and translation chunks via database cascade; returning `{ id: string }` on success

Title SHALL be required, trimmed, and between 1 and 200 characters.

On `delete`, if the novel does not exist, the procedure SHALL return a NOT_FOUND tRPC error.

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

#### Scenario: Delete removes novel and descendants

- **WHEN** `novels.delete` is called with a valid novel id that has chapters and translations
- **THEN** the novel row and all related chapter, translation, and translation chunk rows are removed from the database

#### Scenario: Delete not found

- **WHEN** `novels.delete` is called with a non-existent id
- **THEN** the procedure returns a NOT_FOUND tRPC error

### Requirement: Delete novel UI on novel detail page

The novel detail page at `/novels/[novelId]` SHALL include a Client Component **Delete novel** action in the page header area. The action SHALL open a shadcn `AlertDialog` confirmation before deletion. The dialog SHALL warn that deleting the novel removes all chapters and translations.

On confirmed delete, the client SHALL call `novels.delete` via tRPC, invalidate `novels.list`, and navigate to `/novels`. While the mutation is pending, the confirm button SHALL be disabled.

#### Scenario: Delete novel with confirmation

- **WHEN** user clicks **Delete novel**, confirms in the dialog, and the mutation succeeds
- **THEN** the browser navigates to `/novels` and the deleted novel no longer appears in the library

#### Scenario: Cancel delete dialog

- **WHEN** user opens the delete dialog and clicks cancel
- **THEN** no deletion occurs and the user remains on the novel detail page

#### Scenario: Delete button disabled while pending

- **WHEN** user confirms delete and the mutation is in flight
- **THEN** the confirm button is disabled until the request completes

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

### Requirement: Create novel page at /novels/new

The route `src/app/(app)/novels/(novel)/new/page.tsx` SHALL render a create-novel form. The form SHALL be a Client Component using React Hook Form, shadcn `Field` primitives, Zod validation, and a source-language select. Fields: **Title** (text input) and **Source language** (select).

On successful submit, the client SHALL call `novels.create` via tRPC and navigate to `/novels/[id]`. Validation errors SHALL display inline next to fields.

#### Scenario: Successful create redirects to detail

- **WHEN** user submits a valid title and source language
- **THEN** a novel is created and the browser navigates to `/novels/[novelId]`

#### Scenario: Inline validation on empty title

- **WHEN** user submits with an empty title
- **THEN** an inline error appears on the title field and no navigation occurs

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

### Requirement: Create novel form uses React Hook Form

The create-novel form SHALL use React Hook Form per the project form standard (`app-scaffold`): `useForm` with `zodResolver`, `Controller` per field, and shadcn `Field`, `FieldLabel`, `FieldError`, and `Input` / `Select` components.

#### Scenario: Form matches shadcn RHF integration

- **WHEN** inspecting `src/components/novels/create-novel-form.tsx` (or equivalent)
- **THEN** it uses `react-hook-form`, `@hookform/resolvers/zod`, and shadcn `Field` components

### Requirement: Novel list loading skeleton at /novels

The route segment `src/app/(app)/novels/loading.tsx` SHALL render a list-specific skeleton while the library page loads. The skeleton SHALL use shadcn `Skeleton` via a dedicated `NovelListSkeleton` component and mimic the table layout: page heading, **New Novel** action placeholder, search input placeholder, table header row, multiple table row placeholders, and pagination control placeholders.

#### Scenario: List route has its own loading boundary

- **WHEN** inspecting `src/app/(app)/novels/loading.tsx`
- **THEN** it renders `NovelListSkeleton` and does not reuse the new/detail skeleton

#### Scenario: List skeleton visible during navigation

- **WHEN** user navigates to `/novels` and the server component is pending
- **THEN** the list skeleton appears inside the app shell until the library page renders

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
