## 1. API — slim listByChapter response

- [x] 1.1 Remove `chunks` from `translationListSelect` in `src/server/routers/translations.ts`
- [x] 1.2 Verify `getById` still returns chunk summaries unchanged

## 2. UI — progress component

- [x] 2.1 Create `src/components/translations/translation-progress.tsx` using shadcn `Progress`, bound to `progressPct`
- [x] 2.2 Hide progress for `COMPLETED` status; show 0% for `QUEUED`

## 3. UI — translation list

- [x] 3.1 Remove `TranslationChunkList`, `retryChunk` mutation, and `retryingChunkId` state from `translation-list.tsx`
- [x] 3.2 Render `TranslationProgress` for `QUEUED`, `PROCESSING`, and `FAILED` rows
- [x] 3.3 Show translation-level `errorMessage` below progress bar when status is `FAILED`
- [x] 3.4 Make `FAILED` rows clickable to open the review modal (same affordance as `COMPLETED`)

## 4. Verification

- [x] 4.1 Run `pnpm lint` and fix any type errors from removed `chunks` on list items
- [x] 4.2 Run `pnpm build` to confirm the app compiles
