## MODIFIED Requirements

### Requirement: Chapters tRPC router procedures

The `chapters` router SHALL expose:

- `list` — query accepting `{ novelId: string; page?: number; pageSize?: number; q?: string; sortBy?: "sortOrder" | "createdAt"; sortDir?: "asc" | "desc" }` and returning `{ items, totalCount, page, pageSize }` where each item includes `id`, `title`, `sortOrder`, and `createdAt`
- `create` — mutation accepting `{ novelId: string; title?: string; rawContent: string }` returning the created chapter
- `getById` — query accepting `{ id: string }` returning the chapter (`id`, `title`, `rawContent`, `sortOrder`, `novelId`, `createdAt`, `updatedAt`)
- `delete` — mutation accepting `{ id: string }` deleting the chapter and all descendant translations and translation chunks via database cascade; returning `{ id: string }` on success

On `create`, the procedure SHALL verify the parent novel exists (NOT_FOUND if missing), assign `sortOrder` as `max(existing sortOrder) + 1` or `0` when no chapters exist, persist `rawContent` to the `Chapter` table, and use default title `Chapter {sortOrder + 1}` when no title is provided.

On `delete`, if the chapter does not exist, the procedure SHALL return a NOT_FOUND tRPC error.

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

#### Scenario: Delete removes chapter and descendants

- **WHEN** `chapters.delete` is called with a valid chapter id that has translations
- **THEN** the chapter row and all related translation and translation chunk rows are removed from the database

#### Scenario: Delete not found

- **WHEN** `chapters.delete` is called with a non-existent id
- **THEN** the procedure returns a NOT_FOUND tRPC error

## ADDED Requirements

### Requirement: Delete chapter UI on chapter detail page

The chapter detail page at `/novels/[novelId]/chapters/[chapterId]` SHALL include a Client Component **Delete chapter** action in the page header area. The action SHALL open a shadcn `AlertDialog` confirmation before deletion. The dialog SHALL warn that deleting the chapter removes all translations for that chapter.

On confirmed delete, the client SHALL call `chapters.delete` via tRPC, invalidate `chapters.list` for the parent novel, and navigate to `/novels/[novelId]`. While the mutation is pending, the confirm button SHALL be disabled.

#### Scenario: Delete chapter with confirmation

- **WHEN** user clicks **Delete chapter**, confirms in the dialog, and the mutation succeeds
- **THEN** the browser navigates to the parent novel detail page and the deleted chapter no longer appears in the chapter list

#### Scenario: Cancel delete dialog

- **WHEN** user opens the delete dialog and clicks cancel
- **THEN** no deletion occurs and the user remains on the chapter detail page

#### Scenario: Delete button disabled while pending

- **WHEN** user confirms delete and the mutation is in flight
- **THEN** the confirm button is disabled until the request completes
