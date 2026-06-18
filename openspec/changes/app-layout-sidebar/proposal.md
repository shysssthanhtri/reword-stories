## Why

Reword Stories still uses the default Next.js starter page with no app shell. Steven needs persistent navigation between novels and settings as feature pages land, and a polished layout that matches the product's reader-first direction rather than a blank canvas.

## What Changes

- Add an authenticated app layout with a left sidebar using the shadcn **sidebar-08** inset pattern (`SidebarProvider`, collapsible sidebar, `SidebarInset` content panel)
- Sidebar navigation with two primary items: **Novels** and **Settings**
- Route group `(app)` wrapping main product pages so the sidebar shell applies to app routes but not API routes
- Placeholder pages for `/novels` and `/settings` so navigation works end-to-end
- Update root metadata (title/description) to reflect Reword Stories branding
- Redirect `/` to `/novels` as the default landing route

## Capabilities

### New Capabilities

- `app-layout`: Authenticated app shell with inset sidebar navigation, responsive collapse, and route structure for novels and settings

### Modified Capabilities

- `app-scaffold`: Extend requirements to cover app layout shell beyond the default Next.js starter page (navigation, route groups, metadata)

## Impact

- **Routes**: New `(app)` route group with layout; new `/novels` and `/settings` pages; `/` redirect
- **Components**: New `AppSidebar` (and related layout components) derived from shadcn sidebar-08 block; uses existing `src/components/ui/sidebar.tsx`
- **Root layout**: `SidebarProvider` may wrap app routes only (via nested layout), preserving minimal root layout for non-app routes
- **Dependencies**: No new packages; sidebar UI primitives already installed via shadcn
- **Out of scope**: Novel list CRUD, settings forms, auth UI changes (middleware basic auth unchanged)
