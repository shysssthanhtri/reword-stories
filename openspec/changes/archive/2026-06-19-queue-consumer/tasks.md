## 1. Dependencies and chunking

- [x] 1.1 Add `gpt-tokenizer` dependency
- [x] 1.2 Create `src/lib/chunking/split-chapter.ts` — paragraph/sentence splitting with ~1800 token target
- [x] 1.3 Create `src/lib/chunking/assemble-chunks.ts` — concatenate polished slices with `\n\n`
- [x] 1.4 Create `src/lib/chunking/overlap-context.ts` — extract last paragraph from previous chunk, truncate to ~500 tokens

## 2. Queue helpers

- [x] 2.1 Create `src/lib/queue/translation-queue.ts` with topic constant, `kickoffTranslation`, and `chainNextChunk` (with idempotency keys)

## 3. Queue consumer

- [x] 3.1 Implement `src/app/api/queues/process-chunk/route.ts` — load translation, process one chunk via `getProvider().polish()`, update progress, chain or finish
- [x] 3.2 Add `export const maxDuration = 300` to the consumer route segment
- [x] 3.3 Implement error classification — fail-fast ack for 400/content-policy; rethrow for 429/5xx retry

## 4. Validation and translations router

- [x] 4.1 Create `src/lib/validations/translation.ts` with `createTranslationSchema` (provider + modelName validation against registry)
- [x] 4.2 Create `src/server/routers/translations.ts` with `listProviders`, `estimateChunks`, `create`, `getById`, `listByChapter`, and `retry`
- [x] 4.3 Wire `translations` router into `src/server/trpc/router.ts`

## 5. Route config

- [x] 5.1 Add `chapterTranslate(novelId, chapterId)` to `src/configs/routes/index.ts`

## 6. Translation UI components

- [x] 6.1 Create `src/components/translations/translation-status-badge.tsx` — badge for QUEUED / PROCESSING / COMPLETED / FAILED with progress
- [x] 6.2 Create `src/components/translations/create-translation-form.tsx` — client form with provider select, model select (filtered by provider), chunk estimate, and create mutation
- [x] 6.3 Create `src/components/translations/translation-list.tsx` — client list with 3s polling for in-flight jobs, retry action on failed rows

## 7. Pages (SSR)

- [x] 7.1 Create `src/app/(app)/novels/(novel)/[novelId]/chapters/[chapterId]/translate/page.tsx` — RSC shell with chapter validation and create form
- [x] 7.2 Update chapter detail page — server-fetch translations via `listByChapter`, replace placeholder with `TranslationList`, add **New Translation** action

## 8. Verification

- [x] 8.1 Run `pnpm check` (lint + typecheck) with no errors
- [x] 8.2 Run `pnpm build` successfully
- [ ] 8.3 Manually verify on Vercel preview: create translation with provider + model → status progresses → completes with `polishedContent` in DB
- [ ] 8.4 Manually verify: failed translation shows error and retry re-processes from failed chunk only
