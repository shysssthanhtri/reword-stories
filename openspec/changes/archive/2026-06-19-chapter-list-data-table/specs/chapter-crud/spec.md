# Chapter CRUD

Delta spec for paginated chapter list on novel detail page.

## ADDED Requirements

### Requirement: Chapters list tRPC procedure

The `chapters` router SHALL expose:

- `list` — query accepting `{ novelId: string; page?: number; pageSize?: number; q?: string; sortBy?: "sortOrder" | "createdAt"; sortDir?: "asc" | "desc" }` and returning `{ items, totalCount, page, pageSize }` where each item includes `id`, `title`, `sortOrder`, and `createdAt` (no `rawContent`). Defaults: `page = 1`, `pageSize = 10`, `sortBy = sortOrder`, `sortDir = asc`. `page` SHALL be a positive integer; `pageSize` SHALL be between 1 and 50 inclusive. Results SHALL be scoped to the given `novelId`. When `q` is a non-empty trimmed string, results SHALL be filtered to chapters whose `title` contains `q` case-insensitively (chapters with `title: null` are excluded). Results SHALL be ordered by the requested `sortBy` and `sortDir`. If `novelId` does not exist, the procedure SHALL return a NOT_FOUND tRPC error.

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

## MODIFIED Requirements

### Requirement: Chapters tRPC router procedures

The `chapters` router SHALL expose:

- `list` — query accepting `{ novelId: string; page?: number; pageSize?: number; q?: string; sortBy?: "sortOrder" | "createdAt"; sortDir?: "asc" | "desc" }` and returning `{ items, totalCount, page, pageSize }` where each item includes `id`, `title`, `sortOrder`, and `createdAt`
- `create` — mutation accepting `{ novelId: string; title?: string; rawContent: string }` returning the created chapter
- `getById` — query accepting `{ id: string }` returning the chapter (`id`, `title`, `rawContent`, `sortOrder`, `novelId`, `createdAt`, `updatedAt`)

On `create`, the procedure SHALL verify the parent novel exists (NOT_FOUND if missing), assign `sortOrder` as `max(existing sortOrder) + 1` or `0` when no chapters exist, and persist `rawContent` to the `Chapter` table.

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
