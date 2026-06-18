# Data Model

Prisma domain schema for Reword Stories: Novel → Chapter → Translation → TranslationChunk.

## Requirements

### Requirement: Database tables use snake_case naming

All Prisma models SHALL map to snake_case PostgreSQL table names via `@@map`. Multi-word fields SHALL map to snake_case column names via `@map`. Prisma model and field names in application code SHALL remain PascalCase / camelCase.

#### Scenario: Table names are snake_case plural

- **WHEN** inspecting `prisma/schema.prisma`
- **THEN** `Novel`, `Chapter`, `Translation`, and `TranslationChunk` use `@@map("novels")`, `@@map("chapters")`, `@@map("translations")`, and `@@map("translation_chunks")` respectively

#### Scenario: Multi-word columns are snake_case

- **WHEN** inspecting mapped fields such as `sourceLanguage`, `rawContent`, `sortOrder`, and `createdAt`
- **THEN** each uses `@map` to a snake_case column name (e.g. `source_language`, `raw_content`, `sort_order`, `created_at`)

### Requirement: Novel model stores project metadata

The Prisma schema SHALL define a `Novel` model with fields: `id` (cuid primary key), `title` (required string), `sourceLanguage` (required string), `createdAt`, and `updatedAt`. It SHALL have a one-to-many relation to `Chapter`. Valid `sourceLanguage` values SHALL be enforced in application code, not via a Prisma enum.

#### Scenario: Novel record structure

- **WHEN** inspecting `prisma/schema.prisma`
- **THEN** the `Novel` model includes `title`, `sourceLanguage` as a `String`, timestamps, and `chapters Chapter[]`

### Requirement: Chapter model stores pasted raw MT content

The Prisma schema SHALL define a `Chapter` model with fields: `id`, `title` (optional), `rawContent` (required text), `sortOrder` (integer, default 0), `novelId` (foreign key), `createdAt`, and `updatedAt`. Chapters SHALL belong to exactly one `Novel` with cascade delete. Chapters SHALL have a one-to-many relation to `Translation`.

#### Scenario: Chapter belongs to novel

- **WHEN** inspecting the `Chapter` model
- **THEN** it references `Novel` via `novelId` with `onDelete: Cascade` and exposes `translations Translation[]`

#### Scenario: Chapter ordering index

- **WHEN** inspecting the `Chapter` model
- **THEN** it has a composite index on `[novelId, sortOrder]` for ordered chapter listing

### Requirement: Translation model tracks async polish jobs

The Prisma schema SHALL define a `Translation` model with fields: `id`, `provider` (string), `modelName` (string), `status` (enum: `QUEUED`, `PROCESSING`, `COMPLETED`, `FAILED`), `progressPct` (integer, default 0), `errorMessage` (optional string), `tokenUsage` (optional integer), `polishedContent` (optional text), `chapterId` (foreign key), `createdAt`, and `updatedAt`. Translations SHALL belong to exactly one `Chapter` with cascade delete and have a one-to-many relation to `TranslationChunk`. Valid `provider` values SHALL be enforced in application code, not via a Prisma enum.

#### Scenario: Translation status enum

- **WHEN** inspecting the `Translation` model
- **THEN** `status` uses a `TranslationStatus` enum with values `QUEUED`, `PROCESSING`, `COMPLETED`, and `FAILED`

#### Scenario: Translation provider is a string

- **WHEN** inspecting the `Translation` model
- **THEN** `provider` is a `String` column (not a Prisma enum)

### Requirement: TranslationChunk model stores chunked pipeline state

The Prisma schema SHALL define a `TranslationChunk` model with fields: `id`, `chunkIndex` (integer, 0-based), `rawSlice` (required text), `polishedSlice` (optional text), `status` (enum: `PENDING`, `COMPLETED`, `FAILED`), `tokenCount` (optional integer), `translationId` (foreign key), `createdAt`, and `updatedAt`. Chunks SHALL belong to exactly one `Translation` with cascade delete.

#### Scenario: Chunk unique per translation index

- **WHEN** inspecting the `TranslationChunk` model
- **THEN** it has a unique constraint on `[translationId, chunkIndex]`

#### Scenario: Chunk status supports queue consumer lookup

- **WHEN** inspecting the `TranslationChunk` model
- **THEN** it has an index on `[translationId, status]` to find the next pending chunk efficiently

#### Scenario: Chunk status enum

- **WHEN** inspecting the `TranslationChunk` model
- **THEN** `status` uses a `ChunkStatus` enum with values `PENDING`, `COMPLETED`, and `FAILED`

### Requirement: Prisma client generates with domain types

After schema update, running `pnpm prisma generate` SHALL produce a client at `src/generated/prisma` that exports all four models and status enum types importable from `@/generated/prisma/client`.

#### Scenario: Generate succeeds

- **WHEN** developer runs `pnpm prisma generate`
- **THEN** the command completes without errors and exports `Novel`, `Chapter`, `Translation`, `TranslationChunk`, and `TranslationStatus` / `ChunkStatus` enum types

### Requirement: Initial database migration applies cleanly

The project SHALL include a Prisma migration that creates all four tables, status enum types, foreign keys, indexes, and unique constraints. Running `pnpm prisma migrate dev` against a running local Docker Postgres instance (via `DATABASE_URL` in `.env`) SHALL apply the migration without errors.

#### Scenario: Migration creates tables locally

- **WHEN** developer runs `pnpm docker:up`, then `pnpm prisma migrate dev` with a valid local `DATABASE_URL`
- **THEN** the Docker Postgres instance contains `novels`, `chapters`, `translations`, and `translation_chunks` tables with snake_case column names and the defined relations
