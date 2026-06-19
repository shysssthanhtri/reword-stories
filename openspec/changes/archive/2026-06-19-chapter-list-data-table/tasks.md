## 1. API & Validation

- [x] 1.1 Add Zod schema for `chapters.list` input (`novelId`, `page`, `pageSize`, `q`, `sortBy`, `sortDir` with defaults and bounds) and `parseChapterListSearchParams` helper in `src/lib/validations/chapter.ts`
- [x] 1.2 Add `chapters.list` in `src/server/routers/chapters.ts` — verify novel exists, apply Prisma `where` (novelId + optional title `contains`), `orderBy` (sortOrder or createdAt), `skip`/`take` + `count()`, return `{ items, totalCount, page, pageSize }` with lightweight item fields
- [x] 1.3 Slim `novels.getById` in `src/server/routers/novels.ts` to return metadata only (remove embedded `chapters` include)

## 2. Table UI Components

- [x] 2.1 Create `src/lib/chapter-list-url.ts` with `buildChapterListUrl` and `getChapterListSortUrl` mirroring the novels library helper
- [x] 2.2 Create `src/components/chapters/chapter-list-columns.tsx` with column defs: Title (link + fallback), # (sortable), Created (sortable)
- [x] 2.3 Create `src/components/chapters/chapter-list-table.tsx` Client Component using TanStack Table + shadcn `Table` primitives; sortable headers link to toggled sort URLs
- [x] 2.4 Create `src/components/chapters/chapter-list-search.tsx` with title search input that navigates to `?q=...&page=1` preserving sort and page-size params
- [x] 2.5 Create `src/components/chapters/chapter-list-pagination.tsx` with shadcn `Pagination` prev/next links and no-results message, preserving `q`, `sortBy`, and `sortDir`

## 3. Page Integration

- [x] 3.1 Update `src/app/(app)/novels/(novel)/[novelId]/page.tsx` to read list searchParams, call `novels.getById` + `chapters.list`, and render search + table + pagination; show empty state only when `totalCount === 0` and no `q`; show no-results when `totalCount === 0` and `q` is set
- [x] 3.2 Update `src/components/novels/skeletons/novel-page-skeleton.tsx` chapters section to mimic search input, table header, rows, and pagination placeholders

## 4. Verification

- [x] 4.1 Run lint and type check; fix any errors
- [x] 4.2 Run production build and confirm `/novels/[novelId]` compiles with the new paginated response shape
- [x] 4.3 Manually verify: empty state, title search (match + no match), sort by # asc/desc, sort by created asc/desc, pagination with search and sort params preserved
