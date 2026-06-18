## Context

Step 1 scaffolded Prisma with a PostgreSQL datasource and empty schema (comment only). The init plan defines a four-level hierarchy — Novel → Chapter → Translation → TranslationChunk — that backs every downstream feature: paste flow, async queue pipeline, status polling, and reader.

The existing runtime client lives in `src/lib/db.ts` using `@prisma/adapter-pg` and generated output at `src/generated/prisma`. This change fills in domain models only; no API routes or UI.

## Goals / Non-Goals

**Goals:**

- Implement all four Prisma models with status enums, string taxonomy fields, relations, and indexes aligned to init plan
- Provide Docker Compose local PostgreSQL so developers can migrate and run the app without a remote Neon instance
- Generate Prisma client and create an initial migration against local Docker Postgres
- Support queue consumer queries: find next pending chunk by `translationId`, update progress, assemble `polished_content`
- Enable step 3 paste flow to persist novels and chapters immediately after merge

**Non-Goals:**

- API routes, server actions, or validation logic (step 3+)
- Chunking algorithm or queue consumer logic (step 5)
- Seed data or test fixtures
- Dockerizing the Next.js app (Postgres only in v1 compose file)
- Production Neon/Vercel deployment wiring (future CI/deploy step)
- Auth tables (single-user via `SITE_PASSWORD` middleware; no User model in v1)
- Glossary, edition stacks, or multi-user sharing

## Decisions

### 1. Primary keys: `cuid()` strings

**Decision:** Use `@id @default(cuid())` on all models.

**Rationale:** URL-safe, sortable enough for v1, Prisma default pattern. UUID is equivalent; cuid keeps IDs shorter in URLs like `/read/[translationId]`.

**Alternative:** Auto-increment integers — rejected; expose sequential IDs in URLs unnecessarily.

### 2. Status enums; string taxonomy fields

**Decision:** Use Prisma enums only for fixed pipeline states. Store extensible taxonomy fields as strings:

| Field | Storage | Validation |
|-------|---------|------------|
| `Novel.sourceLanguage` | `String` | Application code (e.g. `ko`, `ja`, `zh`, `other`; new values without migration) |
| `Translation.provider` | `String` | Application code (e.g. `openai`, `gemini`, `deepl`; new providers without migration) |
| `Translation.status` | `TranslationStatus` enum | `QUEUED`, `PROCESSING`, `COMPLETED`, `FAILED` |
| `TranslationChunk.status` | `ChunkStatus` enum | `PENDING`, `COMPLETED`, `FAILED` |

**Rationale:** Source languages and LLM providers are expected to grow (new languages, new adapters). Strings keep the schema stable; Zod or provider registry validates at API/adapter boundaries. Pipeline status values are finite and drive queue logic — enums prevent invalid states at the DB layer.

**Alternative:** Prisma enums for all four — rejected for `sourceLanguage` and `provider`; adding values requires a migration each time.

### 3. Database naming: snake_case tables and columns

**Decision:** Prisma models and fields use PascalCase / camelCase in TypeScript; PostgreSQL uses snake_case via `@@map` and `@map`:

| Prisma model | DB table (`@@map`) |
|--------------|-------------------|
| `Novel` | `novels` |
| `Chapter` | `chapters` |
| `Translation` | `translations` |
| `TranslationChunk` | `translation_chunks` |

Multi-word fields map to snake_case columns, e.g. `sourceLanguage` → `source_language`, `rawContent` → `raw_content`, `createdAt` → `created_at`, `novelId` → `novel_id`. Single-word fields (`id`, `title`, `status`, `provider`) keep the same name in both layers.

Status enums map to snake_case Postgres enum types: `TranslationStatus` → `translation_status`, `ChunkStatus` → `chunk_status`.

**Rationale:** Matches PostgreSQL conventions; raw SQL and Neon console stay readable. Prisma client API stays idiomatic TypeScript.

**Alternative:** Default Prisma naming (PascalCase tables) — rejected; inconsistent with Postgres ecosystem.

### 4. Field types and nullability

**Decision:**

| Model | Field | Type | Notes |
|-------|-------|------|-------|
| `Novel` | `title` | `String` | Required |
| `Novel` | `sourceLanguage` | `String` | Required; e.g. `ko`, `ja`, `zh`, `other` — validated in app code |
| `Chapter` | `title` | `String?` | Optional chapter label |
| `Chapter` | `rawContent` | `String` | `@db.Text`; 100k char limit enforced in API layer (step 3) |
| `Chapter` | `sortOrder` | `Int` | Default 0; ordered within novel |
| `Translation` | `provider` | `String` | e.g. `openai`, `gemini`, `deepl` — validated in app code |
| `Translation` | `modelName` | `String` | e.g. `gpt-4o` |
| `Translation` | `progressPct` | `Int` | Default 0; 0–100 |
| `Translation` | `errorMessage` | `String?` | Set on failure |
| `Translation` | `tokenUsage` | `Int?` | Sum of chunk token counts |
| `Translation` | `polishedContent` | `String?` | `@db.Text`; assembled when all chunks complete |
| `TranslationChunk` | `chunkIndex` | `Int` | 0-based order within translation |
| `TranslationChunk` | `rawSlice` | `String` | `@db.Text` |
| `TranslationChunk` | `polishedSlice` | `String?` | `@db.Text`; null until processed |
| `TranslationChunk` | `tokenCount` | `Int?` | Per-chunk LLM usage |

All models include `createdAt` and `updatedAt` (`@updatedAt`).

**Rationale:** Matches init plan data model verbatim; `@db.Text` avoids varchar length limits on chapter content.

### 5. Relations and cascade deletes

**Decision:**

```
Novel 1──* Chapter 1──* Translation 1──* TranslationChunk
```

- `Chapter.novelId` → `Novel.id` (`onDelete: Cascade`)
- `Translation.chapterId` → `Chapter.id` (`onDelete: Cascade`)
- `TranslationChunk.translationId` → `Translation.id` (`onDelete: Cascade`)

**Rationale:** Personal-use app; deleting a novel should clean up all dependent rows. No soft-delete in v1.

### 6. Indexes and constraints

**Decision:**

- `@@unique([translationId, chunkIndex])` on `TranslationChunk` — idempotency key `${translationId}-${chunkIndex}` per init plan
- `@@index([novelId, sortOrder])` on `Chapter` — list chapters in order
- `@@index([chapterId])` on `Translation` — list translations per chapter
- `@@index([translationId, status])` on `TranslationChunk` — consumer finds next pending chunk efficiently
- `@@index([status])` on `Translation` — optional; useful if listing in-progress jobs later

**Rationale:** Supports hot query paths from queue consumer and novel detail page without full table scans.

### 7. Local development: Docker Compose Postgres

**Decision:** Add `docker/docker-compose.yml` with a single `postgres` service for local development:

| Setting | Value |
|---------|-------|
| Image | `postgres:16-alpine` |
| Container name | `reword-stories-db` |
| Port | `5432:5432` |
| Database | `reword_stories` |
| User / password | `reword` / `reword` (dev-only credentials) |
| Volume | Named volume for data persistence across restarts |

`DATABASE_URL` for local dev:

```
postgresql://reword:reword@localhost:5432/reword_stories
```

Add `package.json` scripts:

- `docker:up` — `docker compose -f docker/docker-compose.yml up -d`
- `docker:down` — `docker compose -f docker/docker-compose.yml down`

Update `.env.example` to document the Docker Compose connection string (Neon URL remains valid for production/preview overrides in `.env`).

**Rationale:** Removes Neon dependency for day-to-day schema work and feature development. Migrations run locally; same SQL applies to Neon via `prisma migrate deploy` in production.

**Alternative:** Neon-only dev — rejected; requires network/account for every contributor and slower iteration.

### 8. Migration strategy

**Decision:** Run `pnpm docker:up`, then `pnpm prisma migrate dev --name init_data_model` against local Docker Postgres; commit migration SQL to repo.

**Rationale:** Standard Prisma workflow; migration history is source of truth for production deploy via `prisma migrate deploy` on Neon.

**Alternative:** `db push` only — rejected; no migration history for production.

### 9. No schema changes to `src/lib/db.ts`

**Decision:** Keep existing singleton export; downstream code imports types from `@/generated/prisma/client`.

**Rationale:** db.ts already wired correctly; adding models requires only `prisma generate`.

## Risks / Trade-offs

| Risk | Mitigation |
|------|------------|
| Large `rawContent` / `polishedContent` rows (up to 100k chars) | Acceptable for personal-use v1; Neon handles text columns fine |
| No DB-level char limit on `rawContent` | Enforce 100k in API validation (step 3); document in spec |
| Migration fails when Docker Postgres is not running | Document `pnpm docker:up` before migrate in tasks; healthcheck on postgres service |
| Invalid `sourceLanguage` or `provider` values in DB | Validate on write in API layer (step 3+); init plan defaults documented in app constants |
| Status enum changes later require migration | v1 status enums cover queue pipeline; add values via new migrations when needed |

## Migration Plan

1. Add `docker/docker-compose.yml` and `pnpm docker:up` / `docker:down` scripts
2. Update `prisma/schema.prisma` with models, status enums, string taxonomy fields, and snake_case `@@map` / `@map`
3. Copy `.env.example` → `.env` with Docker `DATABASE_URL`; run `pnpm docker:up`
4. Run `pnpm prisma generate` — verify client types in `src/generated/prisma`
5. Run `pnpm prisma migrate dev --name init_data_model` against local Docker Postgres
6. Commit schema + migration folder
7. Production: `prisma migrate deploy` against Neon (future CI/deploy step)

**Rollback:** Revert migration commit; run `prisma migrate resolve` if partially applied. Greenfield — no production data yet.

## Open Questions

1. **Cost tracking granularity:** `tokenUsage` on Translation only (sum) — sufficient for v1 pre-flight estimates; per-chunk `tokenCount` enables drill-down later.
