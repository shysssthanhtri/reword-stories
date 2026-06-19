## Why

Init plan step 3 continues the paste flow: after creating a novel, Steven must paste raw machine-translated chapter text and have it persist in Postgres. Novel CRUD is shipped and the detail page already lists chapters, but there is no way to add or view a chapter yet — blocking every downstream step (translation jobs, reader).

## What Changes

- Add `chapters` tRPC router with `create` and `getById` procedures backed by Prisma
- Add shared Zod schema for chapter input: optional title, required `rawContent` (non-empty, max 100,000 chars)
- Implement chapter create page at `/novels/[novelId]/chapters/new` — paste form with large textarea (React Hook Form + shadcn `Field`)
- Implement chapter detail page at `/novels/[novelId]/chapters/[chapterId]` — display chapter metadata and saved raw content
- Add **Add Chapter** button on novel detail page linking to the create route
- Link chapter rows on novel detail page to chapter detail route
- Replace novel detail empty-chapters placeholder with actionable empty state (link to add chapter)
- Extend route config with chapter sub-route helpers
- Auto-assign `sortOrder` as `max(existing sortOrder) + 1` (or `0` when first chapter)

**Out of scope for this change:** translation creation, queue jobs, reader view, chapter edit/delete, chapter reordering.

## Capabilities

### New Capabilities

- `chapter-crud`: Chapter paste form, create/detail pages, `chapters` tRPC procedures, and validation for raw MT content

### Modified Capabilities

- `novel-crud`: Novel detail page gains **Add Chapter** button, linked chapter list, and actionable empty state (replaces "coming soon" placeholder)

## Impact

- **New files:** `src/server/routers/chapters.ts`, `src/lib/validations/chapter.ts`, `src/components/chapters/**`, chapter page routes under `src/app/(app)/novels/(novel)/[novelId]/chapters/`
- **Modified files:** `src/server/trpc/router.ts` (register `chapters` router), `src/configs/routes/index.ts`, `src/app/(app)/novels/(novel)/[novelId]/page.tsx`, `src/components/novels/novel-list.tsx` (`NovelChaptersEmptyState`)
- **Database:** Uses existing `Chapter` model; no schema migration
- **Dependencies:** None (reuses existing tRPC, RHF, Zod, shadcn stack)
