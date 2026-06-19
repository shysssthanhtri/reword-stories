## MODIFIED Requirements

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

## ADDED Requirements

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
