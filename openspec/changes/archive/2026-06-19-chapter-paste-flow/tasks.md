## 1. Validation and chapters router

- [x] 1.1 Create `src/lib/validations/chapter.ts` with `createChapterSchema` (optional title max 200, required `rawContent` min 1 max 100,000)
- [x] 1.2 Create `src/server/routers/chapters.ts` with `create` mutation (verify novel exists, auto-assign `sortOrder`, persist chapter) and `getById` query (NOT_FOUND on missing)
- [x] 1.3 Wire `chapters` router into root `appRouter` in `src/server/trpc/router.ts`

## 2. Route config

- [x] 2.1 Extend `src/configs/routes/index.ts` with `chapterNew(novelId)` and `chapterDetail(novelId, chapterId)` helpers

## 3. Chapter components

- [x] 3.1 Create `src/components/chapters/create-chapter-form.tsx` — client form with RHF, `zodResolver`, shadcn `Field`, optional title `Input`, large `Textarea` for raw content, `trpc.chapters.create.useMutation()` with redirect to chapter detail on success
- [x] 3.2 Create `src/components/chapters/chapter-detail-header.tsx` — presentational title (with `Chapter {sortOrder + 1}` fallback) and metadata
- [x] 3.3 Create `src/components/chapters/chapter-raw-content.tsx` — presentational pre-wrapped raw text block inside a `Card`

## 4. Chapter pages (SSR)

- [x] 4.1 Create `src/app/(app)/novels/(novel)/[novelId]/chapters/new/page.tsx` — RSC shell with back link, novel existence check (`notFound()`), and `<CreateChapterForm novelId={novelId} />`
- [x] 4.2 Create `src/app/(app)/novels/(novel)/[novelId]/chapters/[chapterId]/page.tsx` — RSC detail view via `chapters.getById`, validate `chapter.novelId` matches route, display raw content and translations placeholder

## 5. Novel detail page updates

- [x] 5.1 Update `src/app/(app)/novels/(novel)/[novelId]/page.tsx` — add **Add Chapter** button in chapters section header, link each chapter row to chapter detail
- [x] 5.2 Update `NovelChaptersEmptyState` in `src/components/novels/novel-list.tsx` — replace "coming soon" copy with actionable **Add chapter** button linking to `routes.chapterNew(novelId)` (accept `novelId` prop)

## 6. Verification

- [x] 6.1 Run `pnpm check` (lint + typecheck) with no errors
- [x] 6.2 Run `pnpm build` successfully
- [x] 6.3 Manually verify: novel detail → Add Chapter → paste raw text → save → chapter detail shows exact saved content
- [x] 6.4 Manually verify: novel detail lists linked chapters; empty state links to create page; invalid novel/chapter IDs return 404
