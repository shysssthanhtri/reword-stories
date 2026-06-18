## 1. Scaffold sidebar block

- [x] 1.1 Run `pnpm dlx shadcn@latest add sidebar-08` and confirm files land under `src/components/` with `@/` import paths
- [x] 1.2 Remove unused sidebar-08 demo pieces (`nav-projects`, `nav-secondary`, `nav-user`) if not needed after simplification

## 2. App sidebar components

- [x] 2.1 Simplify `AppSidebar` to inset variant with **Reword Stories** header (replace Acme branding)
- [x] 2.2 Replace demo nav with flat **Novels** (`/novels`, `BookOpen`) and **Settings** (`/settings`, `Settings2`) links using Next.js `Link`
- [x] 2.3 Implement active nav highlighting via `usePathname()` on `SidebarMenuButton`
- [x] 2.4 Ensure `AppSidebar` and any nav helper remain Client Components; remove dead demo data/constants

## 3. Route group and layout

- [x] 3.1 Create `src/app/(app)/layout.tsx` as a Server Component with `SidebarProvider`, `AppSidebar`, `SidebarInset`, and inset header containing `SidebarTrigger` + vertical `Separator`
- [x] 3.2 Render `{children}` in the inset content area below the header (no demo placeholder grids)
- [x] 3.3 Create `src/app/(app)/novels/page.tsx` placeholder (Server Component with heading)
- [x] 3.4 Create `src/app/(app)/settings/page.tsx` placeholder (Server Component with heading)

## 4. Root route and metadata

- [x] 4.1 Replace `src/app/page.tsx` with server-side `redirect('/novels')` from `next/navigation`
- [x] 4.2 Update `src/app/layout.tsx` metadata title and description to **Reword Stories** product copy

## 5. Verification

- [x] 5.1 Run `pnpm lint` and fix any issues introduced by new files
- [x] 5.2 Run `pnpm build` and confirm TypeScript and Next.js compile succeed
- [x] 5.3 Manually verify `/` redirects to `/novels`, sidebar nav works between novels/settings, and sidebar trigger collapses on desktop
