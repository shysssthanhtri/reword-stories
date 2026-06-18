## 1. Local Development (Docker)

- [x] 1.1 Create `docker/docker-compose.yml` with `postgres:16-alpine`, port `5432`, database `reword_stories`, dev credentials, named volume, and healthcheck
- [x] 1.2 Add `docker:up` and `docker:down` scripts to `package.json` pointing at `docker/docker-compose.yml`
- [x] 1.3 Update `.env.example` with Docker Compose `DATABASE_URL` (`postgresql://reword:reword@localhost:5432/reword_stories`) and note that Neon URL can override for production/preview

## 2. Prisma Enums (status only)

- [x] 2.1 Add `TranslationStatus` enum (`QUEUED`, `PROCESSING`, `COMPLETED`, `FAILED`) with `@@map("translation_status")`
- [x] 2.2 Add `ChunkStatus` enum (`PENDING`, `COMPLETED`, `FAILED`) with `@@map("chunk_status")`

## 3. Prisma Models

- [x] 3.1 Add `Novel` model: `id`, `title`, `sourceLanguage` (`String`, `@map("source_language")`), timestamps (`@map("created_at")`, `@map("updated_at")`), `@@map("novels")`, `chapters` relation
- [x] 3.2 Add `Chapter` model: `id`, `title?`, `rawContent` (`@db.Text`, `@map("raw_content")`), `sortOrder` (`@map("sort_order")`, default 0), `novelId` (`@map("novel_id")`), timestamps, `@@index([novelId, sortOrder])`, `@@map("chapters")`, cascade to `Novel`
- [x] 3.3 Add `Translation` model: `id`, `provider`, `modelName` (`@map("model_name")`), `status`, `progressPct` (`@map("progress_pct")`, default 0), `errorMessage?` (`@map("error_message")`), `tokenUsage?` (`@map("token_usage")`), `polishedContent?` (`@db.Text`, `@map("polished_content")`), `chapterId` (`@map("chapter_id")`), timestamps, `@@map("translations")`, cascade to `Chapter`
- [x] 3.4 Add `TranslationChunk` model: `id`, `chunkIndex` (`@map("chunk_index")`), `rawSlice` (`@db.Text`, `@map("raw_slice")`), `polishedSlice?` (`@db.Text`, `@map("polished_slice")`), `status`, `tokenCount?` (`@map("token_count")`), `translationId` (`@map("translation_id")`), timestamps, `@@unique([translationId, chunkIndex])`, `@@index([translationId, status])`, `@@map("translation_chunks")`, cascade to `Translation`

## 4. Generate & Migrate

- [x] 4.1 Run `pnpm docker:up` and verify Postgres is healthy on `localhost:5432`
- [x] 4.2 Copy `.env.example` to `.env` (if not present) and run `pnpm prisma generate` — verify types export from `@/generated/prisma/client`
- [x] 4.3 Run `pnpm prisma migrate dev --name init_data_model` against local Docker Postgres
- [x] 4.4 Commit migration SQL under `prisma/migrations/` and verify Postgres table/column names are snake_case

## 5. Verification

- [x] 5.1 Run `pnpm typecheck` — no errors from generated Prisma types
- [x] 5.2 Run `pnpm lint` — no new lint issues
- [x] 5.3 Run `pnpm build` — production build succeeds with updated schema
