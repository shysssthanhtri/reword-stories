## Context

Novel CRUD is complete: tRPC `novels` router, `/novels`, `/novels/new`, and `/novels/[novelId]` with a chapters list. The Prisma `Chapter` model exists (`title`, `rawContent`, `sortOrder`, `novelId`). The novel detail page renders chapter rows but they are not linked, the empty state says "coming soon", and there is no paste form.

Init plan step 3 requires: paste raw MT text → validate → save as `Chapter` → verify on a detail page. This is the first write path for chapter content and unblocks translation jobs in the next change.

## Goals / Non-Goals

**Goals:**

- `chapters` tRPC router with `create` and `getById` procedures
- Shared Zod schema for chapter validation (reused by tRPC and React Hook Form)
- Create page at `/novels/[novelId]/chapters/new` with large textarea paste form
- Detail page at `/novels/[novelId]/chapters/[chapterId]` showing saved raw content
- Novel detail page: **Add Chapter** button, linked chapter rows, actionable empty state
- Auto-increment `sortOrder` per novel
- SSR-first: RSC for detail pages; client island only for create form mutation

**Non-Goals:**

- Translation creation, queue pipeline, reader view
- Chapter edit, delete, or manual reorder
- Character/word count display, delimiter splitting, file upload
- Loading skeletons for chapter routes (acceptable to inherit `(novel)` group skeleton or add later)

## Decisions

### 1. tRPC `chapters` router

**Decision:** Add `src/server/routers/chapters.ts` with two procedures:

| Procedure | Type | Input | Behavior |
|-----------|------|-------|----------|
| `create` | mutation | `{ novelId, title?, rawContent }` | Verify novel exists; compute `sortOrder`; insert chapter |
| `getById` | query | `{ id }` | Return chapter with `novelId`; NOT_FOUND if missing |

Register in `appRouter` alongside `novels`.

**Rationale:** Matches existing `novels` router pattern. Type-safe from form to DB. No REST route handlers needed.

**Alternative:** Nest `chapters.create` under `novels` router — rejected; chapters are a first-class domain entity with their own pages and will gain translation procedures later.

### 2. Validation: shared Zod schema

**Decision:** Define `createChapterSchema` in `src/lib/validations/chapter.ts`:

```typescript
export const createChapterSchema = z.object({
  novelId: z.string(),
  title: z.string().trim().max(200).optional().or(z.literal("")),
  rawContent: z.string().trim().min(1).max(100_000),
})
```

tRPC `.input()` wraps `{ novelId, ...createChapterSchema.omit({ novelId }) }` or passes full object. Empty title stored as `null`.

**Rationale:** Init plan v1 rule: one paste = one chapter, max 100k chars. Shared schema powers both server and client validation with inline errors on the textarea.

### 3. `sortOrder` assignment

**Decision:** On `create`, query `max(sortOrder)` for the novel's chapters. New chapter gets `max + 1`, or `0` if none exist. Use a Prisma transaction: read max → insert.

**Rationale:** Simple append ordering. No user-facing reorder UI in v1. Matches init plan `sort_order` field usage.

**Alternative:** Count-based ordering — rejected; gaps from future deletes would cause issues (delete is out of scope but sortOrder max is safer).

### 4. Page architecture (SSR-first)

**Decision:** Route tree under existing `(novel)` group:

```
novels/(novel)/[novelId]/
  page.tsx                          ← updated: Add Chapter button, linked rows
  chapters/
    new/page.tsx                    ← RSC shell + <CreateChapterForm /> client island
    [chapterId]/page.tsx            ← RSC: fetch chapter, display raw content
```

| Surface | Component type | Data access |
|---------|---------------|-------------|
| Novel detail (chapters section) | RSC | Existing `novels.getById` |
| `/chapters/new` | RSC shell + Client form | `trpc.chapters.create.useMutation()` |
| `/chapters/[chapterId]` | RSC | `api.chapters.getById({ id })` via server caller |

On successful create, client navigates to `routes.chapterDetail(novelId, chapter.id)`.

**Rationale:** Consistent with novel create pattern. Detail page server-fetches to verify persisted content without client JS.

### 5. Create chapter form

**Decision:** Client component `src/components/chapters/create-chapter-form.tsx` using React Hook Form + shadcn `Field` + `Textarea`:

- **Title** (optional text input)
- **Raw content** (large textarea, `min-h-[24rem]`, monospace or relaxed prose styling)
- Submit → `chapters.create` → redirect to chapter detail

`novelId` passed as prop (not user-editable). Cancel links back to novel detail.

**Rationale:** RHF uncontrolled textarea minimizes re-renders on 100k-char input (established in novel-crud design). shadcn `Textarea` already available.

### 6. Chapter detail page

**Decision:** RSC displays:

- Back link to novel detail
- Chapter title (or fallback `Chapter N` using `sortOrder + 1`)
- Character count of `rawContent` (informational, not validation)
- Raw content in a `<pre>` or `whitespace-pre-wrap` block inside a `Card`
- Placeholder section for translations ("No translations yet" — wired in next change)

Verify `chapter.novelId` matches route `novelId`; call `notFound()` on mismatch or missing chapter.

**Rationale:** Primary success criterion is verifying raw text saved. Readable monospace block confirms paste integrity.

### 7. Novel detail page updates

**Decision:**

- Add **Add Chapter** button in chapters section header linking to `routes.chapterNew(novelId)`
- Wrap each chapter row in `Link` to `routes.chapterDetail(novelId, chapter.id)`
- Update `NovelChaptersEmptyState` with **Add chapter** button (same link)

**Rationale:** User-requested navigation path. Actionable empty state removes dead-end UX.

### 8. Route config

**Decision:** Extend `src/configs/routes/index.ts`:

```typescript
chapterNew: (novelId: string) => `/novels/${novelId}/chapters/new`,
chapterDetail: (novelId: string, chapterId: string) =>
  `/novels/${novelId}/chapters/${chapterId}`,
```

### 9. UI components

**Decision:** New components under `src/components/chapters/`:

- `create-chapter-form.tsx` — client paste form
- `chapter-detail-header.tsx` — title + metadata display
- `chapter-raw-content.tsx` — presentational raw text block (server-rendered props)

Reuse existing shadcn: `Card`, `Button`, `Textarea`, `Field*`, `Empty`.

## Risks / Trade-offs

| Risk | Mitigation |
|------|------------|
| Large textarea (100k chars) slows client hydration | RHF uncontrolled input; only form island is client-side |
| `sortOrder` race on concurrent creates | Single-user v1; transaction still prevents partial state |
| No chapter loading skeleton | Acceptable for v1; chapter routes are fast single-row fetches |
| Chapter detail shows wall of raw text | `whitespace-pre-wrap` + scrollable card; reader view handles polished text later |
| Mismatched novelId/chapterId in URL | Server validates `chapter.novelId === params.novelId`; `notFound()` on mismatch |

## Migration Plan

1. Add validation schema and `chapters` router
2. Register router in `appRouter`
3. Build create form and pages
4. Update novel detail page and empty state
5. Extend route config
6. Verify with `pnpm check` and manual flow: novel detail → add chapter → paste → save → detail shows raw text → novel detail lists linked chapter

**Rollback:** Remove chapter routes and router; novel detail reverts to unlinked list. No data loss if chapters were created (rows remain in DB).

## Open Questions

1. **Loading skeleton for chapter routes?** Defer — `(novel)` group skeleton is sufficient for now.
2. **Show raw content preview on novel detail list?** No — title/sortOrder label only; full content on detail page.
