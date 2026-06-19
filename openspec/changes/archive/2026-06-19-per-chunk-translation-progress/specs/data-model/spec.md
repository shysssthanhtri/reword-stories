# Data Model

## MODIFIED Requirements

### Requirement: TranslationChunk model stores chunked pipeline state

The Prisma schema SHALL define a `TranslationChunk` model with fields: `id`, `chunkIndex` (integer, 0-based), `rawSlice` (required text), `polishedSlice` (optional text), `status` (enum: `PENDING`, `COMPLETED`, `FAILED`), `errorMessage` (optional string), `tokenCount` (optional integer), `translationId` (foreign key), `createdAt`, and `updatedAt`. Chunks SHALL belong to exactly one `Translation` with cascade delete.

#### Scenario: Chunk unique per translation index

- **WHEN** inspecting the `TranslationChunk` model
- **THEN** it has a unique constraint on `[translationId, chunkIndex]`

#### Scenario: Chunk status supports queue consumer lookup

- **WHEN** inspecting the `TranslationChunk` model
- **THEN** it has an index on `[translationId, status]` to find the next pending chunk efficiently

#### Scenario: Chunk status enum

- **WHEN** inspecting the `TranslationChunk` model
- **THEN** `status` uses a `ChunkStatus` enum with values `PENDING`, `COMPLETED`, and `FAILED`

#### Scenario: Chunk error message column

- **WHEN** inspecting the `TranslationChunk` model
- **THEN** `errorMessage` is an optional `String` mapped to `error_message`
