# Chapter CRUD

Chapter paste form, create/detail pages, tRPC procedures, and validation for raw MT content.

## Requirements

### Requirement: Chapter validation schema

The application SHALL define a shared Zod schema `createChapterSchema` in `src/lib/validations/chapter.ts` with:

- `title` — optional string, trimmed, max 200 characters; empty string treated as no title
- `rawContent` — required string, trimmed, min 1 character, max 100,000 characters

The schema SHALL be used by both the `chapters.create` tRPC procedure and the create-chapter React Hook Form.

#### Scenario: Valid raw content accepted

- **WHEN** a create request includes `rawContent` with 5,000 characters of pasted MT text
- **THEN** validation passes

#### Scenario: Empty raw content rejected

- **WHEN** a create request includes `rawContent` that is empty or whitespace-only
- **THEN** validation fails before any database write

#### Scenario: Oversized raw content rejected

- **WHEN** a create request includes `rawContent` exceeding 100,000 characters
- **THEN** validation fails with a max-length error

#### Scenario: Optional title omitted

- **WHEN** a create request omits `title` or provides an empty string
- **THEN** validation passes and the chapter is stored with a default title `Chapter {sortOrder + 1}`

### Requirement: Chapters list tRPC procedure

The `chapters` router SHALL expose:

- `list` — query accepting `{ novelId: string; page?: number; pageSize?: number; q?: string; sortBy?: "sortOrder" | "createdAt"; sortDir?: "asc" | "desc" }` and returning `{ items, totalCount, page, pageSize }` where each item includes `id`, `title`, `sortOrder`, and `createdAt` (no `rawContent`). Defaults: `page = 1`, `pageSize = 10`, `sortBy = sortOrder`, `sortDir = asc`. `page` SHALL be a positive integer; `pageSize` SHALL be between 1 and 50 inclusive. Results SHALL be scoped to the given `novelId`. When `q` is a non-empty trimmed string, results SHALL be filtered to chapters whose `title` contains `q` case-insensitively. Results SHALL be ordered by the requested `sortBy` and `sortDir`. If `novelId` does not exist, the procedure SHALL return a NOT_FOUND tRPC error.

#### Scenario: List returns paginated chapters in sort order by default

- **WHEN** `chapters.list` is called with `{ novelId, page: 1, pageSize: 10 }` and 25 chapters exist for that novel
- **THEN** the response includes 10 items ordered by `sortOrder` ascending, `totalCount` of 25, `page` of 1, and `pageSize` of 10

#### Scenario: List defaults to first page in chapter order

- **WHEN** `chapters.list` is called with `{ novelId }` only
- **THEN** the response uses `page = 1`, `pageSize = 10`, `sortBy = sortOrder`, and `sortDir = asc`

#### Scenario: List page beyond range returns empty items

- **WHEN** `chapters.list` is called with `{ novelId, page: 99, pageSize: 10 }` and only 3 chapters exist
- **THEN** `items` is an empty array and `totalCount` is 3

#### Scenario: List filters by title search

- **WHEN** `chapters.list` is called with `{ novelId, q: "prologue" }` and chapters titled "Prologue" and "Chapter 1" exist
- **THEN** only "Prologue" appears in `items` and `totalCount` reflects the filtered count

#### Scenario: List sorts by created date descending

- **WHEN** `chapters.list` is called with `{ novelId, sortBy: "createdAt", sortDir: "desc" }`
- **THEN** items are ordered by `createdAt` from newest to oldest

#### Scenario: List with unknown novel id

- **WHEN** `chapters.list` is called with a non-existent `novelId`
- **THEN** the procedure returns a NOT_FOUND tRPC error

### Requirement: Chapters tRPC router procedures

The `chapters` router SHALL expose:

- `list` — query accepting `{ novelId: string; page?: number; pageSize?: number; q?: string; sortBy?: "sortOrder" | "createdAt"; sortDir?: "asc" | "desc" }` and returning `{ items, totalCount, page, pageSize }` where each item includes `id`, `title`, `sortOrder`, and `createdAt`
- `create` — mutation accepting `{ novelId: string; title?: string; rawContent: string }` returning the created chapter
- `getById` — query accepting `{ id: string }` returning the chapter (`id`, `title`, `rawContent`, `sortOrder`, `novelId`, `createdAt`, `updatedAt`)

On `create`, the procedure SHALL verify the parent novel exists (NOT_FOUND if missing), assign `sortOrder` as `max(existing sortOrder) + 1` or `0` when no chapters exist, persist `rawContent` to the `Chapter` table, and use default title `Chapter {sortOrder + 1}` when no title is provided.

#### Scenario: Create persists chapter with auto sort order

- **WHEN** `chapters.create` is called for a novel with two existing chapters (max `sortOrder` = 1) and valid `rawContent`
- **THEN** a `Chapter` row is inserted with `sortOrder` = 2 and the pasted `rawContent`

#### Scenario: Create first chapter gets sort order zero

- **WHEN** `chapters.create` is called for a novel with zero chapters
- **THEN** the new chapter has `sortOrder` = 0

#### Scenario: Create with unknown novel id

- **WHEN** `chapters.create` is called with a non-existent `novelId`
- **THEN** the procedure returns a NOT_FOUND tRPC error

#### Scenario: Get by id returns chapter

- **WHEN** `chapters.getById` is called with a valid chapter id
- **THEN** the response includes `rawContent` and `novelId`

#### Scenario: Get by id not found

- **WHEN** `chapters.getById` is called with a non-existent id
- **THEN** the procedure returns a NOT_FOUND tRPC error

### Requirement: Create chapter page at /novels/[novelId]/chapters/new

The route `src/app/(app)/novels/(novel)/[novelId]/chapters/new/page.tsx` SHALL render a page shell (React Server Component) with a back link to the novel detail page and a client create-chapter form.

The form SHALL be a Client Component using React Hook Form, shadcn `Field` primitives, Zod validation, and a large `Textarea` for raw content. Fields: **Title** (optional text input) and **Raw content** (required textarea).

On successful submit, the client SHALL call `chapters.create` via tRPC and navigate to `/novels/[novelId]/chapters/[chapterId]`. Validation errors SHALL display inline next to fields.

If `novelId` does not exist, the page SHALL render a not-found response.

#### Scenario: Successful paste redirects to chapter detail

- **WHEN** user submits valid raw content on the create chapter page
- **THEN** a chapter is created and the browser navigates to `/novels/[novelId]/chapters/[chapterId]`

#### Scenario: Inline validation on empty content

- **WHEN** user submits with empty raw content
- **THEN** an inline error appears on the raw content field and no navigation occurs

#### Scenario: Invalid novel id returns 404

- **WHEN** user navigates to `/novels/nonexistent-id/chapters/new`
- **THEN** Next.js renders the not-found page

### Requirement: Chapter detail page at /novels/[novelId]/chapters/[chapterId]

The route `src/app/(app)/novels/(novel)/[novelId]/chapters/[chapterId]/page.tsx` SHALL be a React Server Component that server-fetches the chapter via `chapters.getById`.

The page SHALL display:

- A back link to `/novels/[novelId]`
- Chapter title (or fallback label `Chapter {sortOrder + 1}` when title is null)
- The full saved `rawContent` in a readable pre-wrapped text block
- A translations placeholder section indicating translations are not yet available

If the chapter does not exist, or `chapter.novelId` does not match the route `novelId`, the page SHALL render a not-found response.

#### Scenario: Detail shows saved raw content

- **WHEN** user navigates to a valid chapter detail URL after pasting content
- **THEN** the page displays the exact saved `rawContent` text

#### Scenario: Detail shows title fallback

- **WHEN** user navigates to a chapter with no title and `sortOrder` = 2
- **THEN** the page displays "Chapter 3" as the heading

#### Scenario: Mismatched novel id returns 404

- **WHEN** user navigates to `/novels/[novelA]/chapters/[chapterBelongingToNovelB]`
- **THEN** Next.js renders the not-found page

#### Scenario: Invalid chapter id returns 404

- **WHEN** user navigates to `/novels/[novelId]/chapters/nonexistent-id`
- **THEN** Next.js renders the not-found page

### Requirement: Create chapter form uses React Hook Form

The create-chapter form SHALL use React Hook Form per the project form standard: `useForm` with `zodResolver`, `Controller` per field, and shadcn `Field`, `FieldLabel`, `FieldError`, `Input`, and `Textarea` components.

#### Scenario: Form matches shadcn RHF integration

- **WHEN** inspecting `src/components/chapters/create-chapter-form.tsx`
- **THEN** it uses `react-hook-form`, `@hookform/resolvers/zod`, and shadcn `Field` components with a `Textarea` for raw content

### Requirement: Route config chapter helpers

`src/configs/routes/index.ts` SHALL export:

- `chapterNew: (novelId: string) => string` → `/novels/${novelId}/chapters/new`
- `chapterDetail: (novelId: string, chapterId: string) => string` → `/novels/${novelId}/chapters/${chapterId}`

#### Scenario: Route helpers produce correct paths

- **WHEN** `routes.chapterNew("abc")` and `routes.chapterDetail("abc", "xyz")` are called
- **THEN** they return `/novels/abc/chapters/new` and `/novels/abc/chapters/xyz` respectively
