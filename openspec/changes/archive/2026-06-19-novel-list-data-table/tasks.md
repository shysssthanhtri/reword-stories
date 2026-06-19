## 1. Dependencies & API

- [x] 1.1 Add `@tanstack/react-table` to `package.json`
- [x] 1.2 Add Zod schema for list input (`page`, `pageSize`, `q`, `sortBy`, `sortDir` with defaults and bounds) in `src/lib/validations/novel.ts`
- [x] 1.3 Update `novels.list` in `src/server/routers/novels.ts` to accept search/sort/pagination input, apply Prisma `where` (title `contains`), `orderBy` (createdAt or `_count.chapters`), `skip`/`take` + `count()`, and return `{ items, totalCount, page, pageSize }`

## 2. Table UI Components

- [x] 2.1 Create `src/components/novels/novel-list-columns.tsx` with column defs: Title (link), Source language, Chapters (sortable), Created (sortable)
- [x] 2.2 Create `src/components/novels/novel-list-table.tsx` Client Component using TanStack Table + shadcn `Table` primitives; sortable headers link to toggled sort URLs
- [x] 2.3 Create `src/components/novels/novel-list-search.tsx` with title search input that navigates to `?q=...&page=1` preserving sort and page-size params
- [x] 2.4 Create `src/components/novels/novel-list-pagination.tsx` with shadcn `Pagination` prev/next links preserving `q`, `sortBy`, and `sortDir`
- [x] 2.5 Add a small URL helper (e.g. `buildNovelListUrl`) to compose search params consistently across search, sort, and pagination links

## 3. Page Integration

- [x] 3.1 Update `src/app/(app)/novels/page.tsx` to read all list searchParams, call paginated `novels.list`, and render search + table + pagination; show empty state only when `totalCount === 0` and no `q`; show no-results when `totalCount === 0` and `q` is set
- [x] 3.2 Refactor `src/components/novels/novel-list.tsx` — remove card grid; keep `NovelLibraryHeader` and empty state; wire new table/search/pagination components
- [x] 3.3 Update `src/components/novels/skeletons/novel-list-skeleton.tsx` to mimic search input, table header, rows, and pagination placeholders

## 4. Verification

- [x] 4.1 Run lint and type check; fix any errors
- [x] 4.2 Run production build and confirm `/novels` compiles with the new paginated response shape
- [x] 4.3 Manually verify: title search (match + no match), sort by chapters asc/desc, sort by created asc/desc, pagination with search and sort params preserved
