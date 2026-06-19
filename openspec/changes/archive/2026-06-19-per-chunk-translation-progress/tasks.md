## 1. Schema and data layer

- [x] 1.1 Add optional `errorMessage` field to `TranslationChunk` in `prisma/schema.prisma` with `@map("error_message")`
- [x] 1.2 Create and apply Prisma migration for `translation_chunks.error_message`
- [x] 1.3 Run `pnpm prisma generate` and verify `ChunkStatus` types include the new field

## 2. API and queue

- [x] 2.1 Add `retryChunkInputSchema` to `src/lib/validations/translation.ts`
- [x] 2.2 Define shared chunk summary select (`id`, `chunkIndex`, `status`, `errorMessage`) for list/detail queries
- [x] 2.3 Extend `translations.listByChapter` to include ordered chunk summaries per translation
- [x] 2.4 Extend `translations.getById` to include ordered chunk summaries
- [x] 2.5 Implement `translations.retryChunk` mutation with validation, transaction, and `kickoffTranslation`
- [x] 2.6 Update `process-translation-chunk.ts` to persist chunk `errorMessage` on failure and clear it when processing starts

## 3. UI components

- [x] 3.1 Add `ChunkStatusBadge` component for per-chunk status labels
- [x] 3.2 Add `TranslationChunkList` (or inline chunk rows) showing chunk number, status, error, and per-chunk Retry
- [x] 3.3 Update `TranslationList` to render chunk rows under each translation; rename translation retry label to **Retry all**
- [x] 3.4 Wire `retryChunk` mutation with `stopPropagation`, list invalidation, and pending state on chunk buttons
- [x] 3.5 Update `TranslationReviewModal` to show per-chunk status list and per-chunk retry for failed chunks

## 4. Verification

- [x] 4.1 Run `pnpm lint` and fix any issues
- [x] 4.2 Run `pnpm typecheck` (or `tsc --noEmit`) and fix type errors
- [x] 4.3 Run `pnpm build` and confirm the project compiles
