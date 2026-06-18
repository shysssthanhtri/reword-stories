## Why

Step 1 scaffolded Next.js with an empty Prisma schema placeholder. Step 2 of the init plan requires the domain data model — Novel, Chapter, Translation, and TranslationChunk — so subsequent features (paste flow, queue pipeline, reader) can persist and query real data. Without this schema, no API route or background job can store novels, chapters, or translation progress.

## What Changes

- Define Prisma models for `Novel`, `Chapter`, `Translation`, and `TranslationChunk` per init plan data model
- Map database tables and columns to snake_case via Prisma `@@map` / `@map`; keep PascalCase model and camelCase field names in application code
- Add Prisma enums for pipeline status fields (`TranslationStatus`, `ChunkStatus`); store `sourceLanguage` and `provider` as strings validated in application code
- Define relations, indexes, and field constraints (e.g. `raw_content` max 100k chars enforced at app layer; DB stores as text)
- Generate Prisma client and apply initial migration against local Postgres (Docker Compose)
- Add `docker/docker-compose.yml` for local PostgreSQL development environment
- Export typed model helpers or re-exports from `src/lib/db.ts` if needed for downstream use

## Capabilities

### New Capabilities

- `data-model`: Prisma schema for Novel → Chapter → Translation → TranslationChunk hierarchy with status enums, string taxonomy fields, relations, and migration
- `local-dev`: Docker Compose PostgreSQL under `docker/` for local development and migrations

### Modified Capabilities

(none — app-scaffold already requires Prisma setup; this change adds domain models without changing scaffold requirements)

## Impact

- **Files:** `prisma/schema.prisma`, `prisma/migrations/`, `docker/docker-compose.yml`, `.env.example`, `package.json` (docker scripts), regenerated `src/generated/prisma/`
- **Dependencies:** No new npm packages; uses existing Prisma stack; Docker required for local Postgres
- **Database:** Initial migration against local Docker Postgres; same migration SQL deploys to Neon in production via `prisma migrate deploy`
- **Downstream:** Enables step 3 (paste flow), step 5 (queue consumer), and step 6 (reader) — no API routes or UI in this change
