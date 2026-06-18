## Why

Init plan step 3 starts the paste flow with **Create novel** — Steven needs to name a project, tag its source language, and land on a detail page before pasting MT chapters. Steps 1–2 delivered the app shell and Prisma schema; this change wires the first real product data path: type-safe API + novel CRUD pages so novels persist in Postgres and are browsable in the sidebar shell.

## What Changes

- Add **tRPC** as the application API layer (replacing the init plan's REST route sketch for novel operations)
- Add `novels` router with `list`, `getById`, and `create` procedures backed by Prisma
- Implement three novel routes under the existing `(app)` layout:
  - `/novels` — server-rendered library listing
  - `/novels/new` — client form to create a novel (title + source language)
  - `/novels/[novelId]` — server-rendered novel detail (metadata + empty chapters section placeholder)
- Adopt **React Hook Form** as the project-wide form library (with `@hookform/resolvers/zod` and shadcn `Field` + `Controller`)
- Add shared Zod schemas for novel input validation (reused by tRPC and forms)
- Add create-novel form using the standard RHF pattern
- Extend route config with novel sub-route helpers
- Redirect to novel detail after successful create
- Add Next.js `loading.tsx` skeleton boundaries: list-specific skeleton at `/novels`; shared skeleton for `/novels/new` and `/novels/[novelId]` via a `(novel)` route group

**Out of scope for this change:** chapter paste (`/novels/[id]/chapters/new`), translation jobs, reader view, edit/delete novel.

## Capabilities

### New Capabilities

- `trpc-api`: tRPC server/client setup for Next.js App Router — fetch adapter route, React Query provider, typed `AppRouter`, shared context with Prisma
- `novel-crud`: Novel list/create/detail pages, create form, and `novels` tRPC procedures

### Modified Capabilities

- `app-scaffold`: Add React Hook Form as the required form library for all interactive forms
- `app-layout`: Replace `/novels` placeholder with functional listing; add nested novel routes that remain inside the sidebar shell with **Novels** nav active

## Impact

- **New dependencies:** `@trpc/server`, `@trpc/client`, `@trpc/react-query`, `@tanstack/react-query`, `react-hook-form`, `@hookform/resolvers`
- **New files:** `src/server/trpc/**`, `src/server/routers/novels.ts`, `src/app/api/trpc/[trpc]/route.ts`, `src/trpc/**`, novel page routes, `loading.tsx` skeleton boundaries, `src/components/novels/**`, `src/lib/validations/novel.ts`
- **Modified files:** `src/app/(app)/novels/page.tsx`, `src/configs/routes/index.ts`, root or app layout for TRPCProvider
- **Database:** Uses existing `Novel` model; no schema migration
- **API surface:** Init plan REST routes `POST/GET /api/novels` superseded by tRPC for novels (queue consumer routes unchanged)
