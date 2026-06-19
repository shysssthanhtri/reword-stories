## 1. Validation schemas

- [ ] 1.1 Add `novelIdInputSchema` (`{ id: string }`) to `src/lib/validations/novel.ts`
- [ ] 1.2 Add `chapterIdInputSchema` (`{ id: string }`) to `src/lib/validations/chapter.ts`
- [ ] 1.3 Reuse existing `translationIdInputSchema` for `translations.delete` input

## 2. tRPC delete procedures

- [ ] 2.1 Add `novels.delete` mutation in `src/server/routers/novels.ts` — NOT_FOUND if missing, `db.novel.delete`, return `{ id }`
- [ ] 2.2 Add `chapters.delete` mutation in `src/server/routers/chapters.ts` — NOT_FOUND if missing, `db.chapter.delete`, return `{ id }`
- [ ] 2.3 Add `translations.delete` mutation in `src/server/routers/translations.ts` — NOT_FOUND if missing, BAD_REQUEST if status is `QUEUED` or `PROCESSING`, otherwise `db.translation.delete`, return `{ id }`

## 3. Delete UI components

- [ ] 3.1 Create `DeleteNovelButton` client component with `AlertDialog` confirmation, `novels.delete` mutation, list invalidation, and redirect to `/novels`
- [ ] 3.2 Create `DeleteChapterButton` client component with `AlertDialog` confirmation, `chapters.delete` mutation, chapter list invalidation, and redirect to novel detail
- [ ] 3.3 Add delete action to `TranslationList` — `AlertDialog` confirmation, `translations.delete` mutation, list invalidation; show only for `COMPLETED` and `FAILED` statuses; stop click propagation

## 4. Wire into pages

- [ ] 4.1 Add `DeleteNovelButton` to novel detail page header (`src/app/(app)/novels/(novel)/[novelId]/page.tsx`)
- [ ] 4.2 Add `DeleteChapterButton` to chapter detail page header (`src/app/(app)/novels/(novel)/[novelId]/chapters/[chapterId]/page.tsx`)

## 5. Verification

- [ ] 5.1 Run lint and type check
- [ ] 5.2 Run production build
- [ ] 5.3 Manual smoke test: delete completed translation, delete failed translation, confirm in-flight translation has no delete button, delete chapter (cascade), delete novel (cascade)
