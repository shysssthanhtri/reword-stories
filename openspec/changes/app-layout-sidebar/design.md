## Context

Reword Stories has a greenfield Next.js 15 scaffold: root layout with fonts/toaster, a create-next-app placeholder at `/`, and the full shadcn/ui library including `src/components/ui/sidebar.tsx` and `src/hooks/use-mobile.ts`. Feature pages (novel library, settings) need a persistent navigation shell before CRUD work begins.

The user requested the **sidebar-08** block: inset variant sidebar with raised content panel — a good fit for a productivity/reader app (Linear/Notion-style embedded look).

## Goals / Non-Goals

**Goals:**

- Add `(app)` route group with sidebar-08 inset layout
- Left sidebar with **Novels** and **Settings** only
- Collapsible sidebar + mobile sheet via existing shadcn sidebar primitives
- Placeholder pages and `/` → `/novels` redirect
- Update product metadata
- Preserve SSR-first architecture: server layout, client sidebar island

**Non-Goals:**

- Novel list, settings forms, or database-backed pages
- User avatar/footer menu, projects list, secondary nav (Support/Feedback) from the full sidebar-08 demo
- Nested/collapsible nav sections
- Breadcrumb header (optional follow-up; not required for v1 shell)
- Auth UI changes (middleware `SITE_PASSWORD` unchanged)

## Decisions

### 1. Install sidebar-08 block, then simplify

**Decision:** Run `pnpm dlx shadcn@latest add sidebar-08` to scaffold block files, then strip demo sections and reduce nav to two flat items.

**Rationale:** Block gives correct inset wiring (`SidebarProvider`, `variant="inset"`, `SidebarInset`, trigger/header patterns) aligned with project shadcn config (`base-nova`, `@/` aliases). Simplifying in place is faster than hand-rolling and avoids drift from shadcn patterns.

**Alternatives considered:**

- Hand-build layout from `sidebar.tsx` primitives only — more error-prone for inset variant cookie/state wiring
- Use sidebar-07 or default variant — user explicitly requested sidebar-08 inset look

**Simplifications from block defaults:**

| Block section | Action |
|---------------|--------|
| `NavMain` collapsible groups | Replace with flat **Novels** / **Settings** links |
| `NavProjects` | Remove |
| `NavSecondary` (Support, Feedback) | Remove |
| `NavUser` footer | Remove (single-user app, no account UI in v1) |
| Header "Acme Inc" | Replace with **Reword Stories** |
| Demo breadcrumb + placeholder grids in page template | Replace with minimal inset header (trigger only) + `{children}` |

### 2. Route structure

**Decision:**

```
src/app/
  layout.tsx              # root: fonts, TooltipProvider, Toaster (unchanged)
  page.tsx                # redirect to /novels
  (app)/
    layout.tsx            # SidebarProvider + AppSidebar + SidebarInset shell
    novels/page.tsx       # placeholder
    settings/page.tsx     # placeholder
  api/...                 # unchanged, outside (app) group
```

**Rationale:** Route groups keep API routes free of sidebar HTML. Nested layout scopes `SidebarProvider` to product pages only.

**Server/client boundary:**

- `(app)/layout.tsx` — **Server Component**; composes `SidebarProvider`, `AppSidebar` (client), `SidebarInset`, header with `SidebarTrigger`
- `app-sidebar.tsx`, `nav-main.tsx` (if kept) — **Client Components** for `usePathname()` active states and sidebar interactivity
- `novels/page.tsx`, `settings/page.tsx` — **Server Components** (static placeholders)

### 3. Navigation implementation

**Decision:** Use Next.js `Link` from `next/link` with `usePathname()` for active styling on `SidebarMenuButton` (`isActive` prop or `data-active` class).

Nav config (single source):

| Label | href | Icon |
|-------|------|------|
| Novels | `/novels` | `BookOpen` |
| Settings | `/settings` | `Settings2` |

**Rationale:** Flat nav matches v1 scope; avoids collapsible complexity from demo `NavMain`.

### 4. Root redirect

**Decision:** Replace `src/app/page.tsx` with a server-side `redirect('/novels')` from `next/navigation`.

**Alternative:** Middleware redirect — unnecessary for a single static rule.

### 5. Metadata

**Decision:** Update `src/app/layout.tsx` metadata to `{ title: "Reword Stories", description: "Polish machine-translated novel chapters into readable prose." }` (wording can be tuned in implementation).

## Risks / Trade-offs

| Risk | Mitigation |
|------|------------|
| sidebar-08 block imports registry paths | shadcn CLI rewrites to `@/components/...`; verify imports after add |
| Over-scoped block files left unused | Delete or inline unused nav-* components during simplification |
| Sidebar cookie state on SSR | shadcn sidebar handles via cookie; no custom state needed |
| Active route matching too naive | Use `pathname === href` or `pathname.startsWith(href)` for novels prefix only when nested routes exist |

## Migration Plan

1. Add shadcn block and layout files
2. Remove starter `page.tsx` content; add redirect
3. Verify `pnpm dev`, `pnpm build`, manual nav between `/novels` and `/settings`
4. No database or env changes; deploy as normal Vercel push

**Rollback:** Revert route group and restore starter page.

## Open Questions

- None blocking. Breadcrumbs and inset page header title can be added when novel detail routes land.
