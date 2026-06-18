## Context

Steps 1–2 delivered the Next.js app shell, shadcn/ui component library, and Prisma domain schema (`Novel`, `Chapter`, `Translation`, `TranslationChunk`). The `/novels` route is still a placeholder. Init plan step 3 begins the paste flow with **Create novel** — title + source language tag → land on detail page.

The init plan sketched REST routes (`POST/GET /api/novels`). This change adopts **tRPC** for end-to-end type safety between server procedures and client mutations, while keeping SSR-first rendering for list and detail pages.

Current stack: Next.js 16 App Router, React 19, Zod 4, Prisma 7, shadcn `Field` component (already installed). No form library or tRPC packages yet.

## Goals / Non-Goals

**Goals:**

- Wire tRPC with Next.js App Router fetch adapter and typed client
- Implement novel `list`, `getById`, `create` procedures against Prisma
- Ship three routes: `/novels`, `/novels/new`, `/novels/[novelId]`
- Create-novel form with React Hook Form, shadcn `Field`, and Zod validation
- SSR for list and detail; client island only for the create form mutation
- Shared Zod schemas reused by tRPC input validation and React Hook Form
- Loading skeletons via Next.js `loading.tsx`: list-specific at `/novels`; shared for `/novels/new` and `/novels/[novelId]`

**Non-Goals:**

- Chapter paste form (`/novels/[id]/chapters/new`) — next change in step 3
- Edit/delete novel, novel search/filter
- Translation or queue procedures
- Auth changes (existing `SITE_PASSWORD` middleware sufficient)
- Optimistic updates, infinite scroll, or pagination (personal library, small N)

## Decisions

### 1. API layer: tRPC over REST route handlers

**Decision:** Use tRPC v11 with `@trpc/server`, `@trpc/client`, `@trpc/react-query`, and the fetch adapter at `/api/trpc/[trpc]`.

**Rationale:** [tRPC](https://trpc.io/) gives automatic TypeScript inference from server to client — rename a procedure input and the form breaks at compile time. Fits a single-repo Next.js app with no external API consumers. Zod validation integrates natively via `.input()`.

**Pattern:**

```
src/server/trpc/init.ts       — t, context, procedures
src/server/trpc/context.ts    — { db } from @/lib/db
src/server/trpc/router.ts     — appRouter = { novels: novelsRouter }
src/server/routers/novels.ts  — list, getById, create
src/app/api/trpc/[trpc]/route.ts — fetchRequestHandler
src/trpc/server.ts            — createCaller for RSC
src/trpc/react.tsx            — TRPCReactProvider + hooks
```

**Server vs client data flow:**

| Surface | Component type | Data access |
|---------|---------------|-------------|
| `/novels` | RSC | `api.novels.list()` via server caller |
| `/novels/[id]` | RSC | `api.novels.getById({ id })` via server caller |
| `/novels/new` form | Client | `trpc.novels.create.useMutation()` |
| Queue consumer | Route Handler | Direct Prisma (unchanged) |

**Alternative:** REST route handlers per init plan — rejected; duplicates types between route body and client fetch, no compile-time link.

### 2. Form library: React Hook Form (project standard)

**Decision:** All interactive forms in this app SHALL use **React Hook Form** with `@hookform/resolvers/zod` and shadcn `Field` + `Controller`, following the [shadcn React Hook Form guide](https://ui.shadcn.com/docs/forms/react-hook-form). TanStack Form is not used.

**Rationale:**

1. **shadcn canonical pattern** — matches `src/components/ui/field.tsx` and the scaffold design's anticipated peer dependency.
2. **Shared Zod schemas** — validation modules in `src/lib/validations/` power both `zodResolver` on the client and tRPC `.input()` on the server.
3. **Performance on large inputs** — uncontrolled inputs (refs) minimize re-renders on the upcoming chapter paste textarea (up to 100k chars).
4. **Consistency** — one form pattern across create novel, chapter paste, and future translation/model-picker forms.

**Standard pattern:**

```typescript
const form = useForm<z.infer<typeof schema>>({
  resolver: zodResolver(schema),
  defaultValues: { ... },
})

<Controller
  name="title"
  control={form.control}
  render={({ field, fieldState }) => (
    <Field data-invalid={fieldState.invalid}>
      <FieldLabel>...</FieldLabel>
      <Input {...field} aria-invalid={fieldState.invalid} />
      {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
    </Field>
  )}
/>
```

### 3. Validation: shared Zod schemas

**Decision:** Define `createNovelSchema` and `sourceLanguageSchema` in `src/lib/validations/novel.ts`. Export `SOURCE_LANGUAGES` constant with `{ value, label }` pairs.

```typescript
export const sourceLanguageSchema = z.enum(["ko", "ja", "zh", "other"])
export const createNovelSchema = z.object({
  title: z.string().trim().min(1).max(200),
  sourceLanguage: sourceLanguageSchema,
})
```

Used by: tRPC `.input(createNovelSchema)`, RHF `zodResolver(createNovelSchema)`, and the select options UI.

### 4. Page architecture (SSR-first)

**Decision:**

Route tree under `(app)/novels/`:

```
novels/
  loading.tsx              ← list skeleton (library only)
  page.tsx                 ← /novels
  (novel)/                 ← route group (no URL segment)
    loading.tsx            ← shared skeleton for new + detail
    new/page.tsx           ← /novels/new
    [novelId]/page.tsx     ← /novels/[novelId]
```

- **`/novels`** — RSC calls server tRPC caller, renders list with links. No client JS required for read path.
- **`/novels/new`** — RSC page shell (title, back link) wraps `<CreateNovelForm />` client island.
- **`/novels/[novelId]`** — RSC fetches novel + chapters; `notFound()` on missing id. Chapters section shows empty state placeholder.

**Rationale:** Aligns with project SSR-first rule. Only the create mutation needs client interactivity. The `(novel)` route group colocates new and detail under one `loading.tsx` without affecting URLs.

### 4b. Loading skeletons

**Decision:** Use Next.js App Router `loading.tsx` files with shadcn `Skeleton` components. Skeleton UI lives in reusable components under `src/components/novels/skeletons/`.

| Route | Loading boundary | Skeleton component | Layout mimic |
|-------|------------------|-------------------|--------------|
| `/novels` | `novels/loading.tsx` | `NovelListSkeleton` | Page header + **New Novel** button placeholder + N card/row placeholders |
| `/novels/new`, `/novels/[novelId]` | `novels/(novel)/loading.tsx` | `NovelPageSkeleton` (shared) | Page header/back link placeholder + card with title/metadata field placeholders; detail adds a chapters section block |

**Rationale:** List and detail/new have different layouts — list is a grid/table of items; new and detail share a single-column header + card pattern. One shared skeleton avoids duplicating markup while keeping list-specific loading accurate.

**Constraints:**

- Skeleton components are Server Components (no `"use client"`)
- Skeletons render inside the existing app shell (sidebar remains visible)
- No artificial `delay()` — rely on natural RSC streaming boundaries

### 5. TRPCProvider placement

**Decision:** Add `TRPCReactProvider` in `src/app/(app)/layout.tsx` by extracting a thin `Providers` client wrapper, or mount in root layout if settings also needs tRPC later. Prefer `(app)` layout scope to limit client bundle to authenticated pages.

### 6. Route config

**Decision:** Extend `src/configs/routes/index.ts`:

```typescript
novels: "/novels",
novelNew: "/novels/new",
novelDetail: (id: string) => `/novels/${id}`,
```

Use helpers in links and post-create redirect.

### 7. UI components

**Decision:** Reuse existing shadcn primitives — `Card`, `Button`, `Input`, `Select` (or `NativeSelect`), `Empty`, `Field*`. Novel-specific components under `src/components/novels/`:

- `create-novel-form.tsx` — client form
- `novel-list.tsx` — presentational list (server-rendered props)
- `novel-detail-header.tsx` — metadata display
- `skeletons/novel-list-skeleton.tsx` — list loading UI
- `skeletons/novel-page-skeleton.tsx` — shared new/detail loading UI

## Risks / Trade-offs

| Risk | Mitigation |
|------|------------|
| tRPC adds bundle weight via React Query | Scope provider to `(app)` layout; RSC pages don't import client hooks |
| RSC + tRPC caller coupling | Keep procedures thin; server caller is just typed Prisma access |
| Init plan REST docs become stale | Document tRPC as canonical API in this change; queue routes stay REST |
| Complex dynamic forms (e.g. bulk chapter arrays) | Use RHF `useFieldArray`; same Zod + Field pattern |
| No pagination on novel list | Acceptable for single-user v1; add cursor pagination if library grows |

## Migration Plan

1. Install dependencies (`@trpc/*`, `@tanstack/react-query`, `react-hook-form`, `@hookform/resolvers`)
2. Scaffold tRPC server + API route + providers
3. Implement `novels` router and validation schemas
4. Build pages and form
5. Verify with `pnpm check` and manual flow: create → redirect → list → detail
6. No database migration required

**Rollback:** Remove tRPC files and revert to placeholder `/novels` page; no data loss.

## Open Questions

1. **Chapter paste next?** Follow-on change should add `/novels/[id]/chapters/new` with a large textarea form — React Hook Form + Zod + shadcn `Field`, `chapters.create` procedure.
2. **Breadcrumbs on detail/new?** Optional UX polish; not blocking v1.
