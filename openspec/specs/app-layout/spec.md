# App Layout

Authenticated app shell with sidebar navigation for Reword Stories product pages.

## Requirements

### Requirement: App route group with inset sidebar shell

The application SHALL provide an authenticated app shell under a `(app)` route group that wraps product pages in a shadcn sidebar-08 inset layout: `SidebarProvider`, left `Sidebar` with `variant="inset"`, and `SidebarInset` for page content.

#### Scenario: App pages render inside sidebar shell

- **WHEN** user navigates to `/novels` or `/settings`
- **THEN** the page content renders inside `SidebarInset` with the left sidebar visible

#### Scenario: API routes exclude sidebar shell

- **WHEN** a request targets `src/app/api/**`
- **THEN** no sidebar layout wraps the response

### Requirement: Primary sidebar navigation

The sidebar SHALL expose exactly two primary navigation items linking to `/novels` and `/settings`, labeled **Novels** and **Settings**, with distinct lucide icons.

#### Scenario: Novels nav item links to novels route

- **WHEN** user clicks **Novels** in the sidebar
- **THEN** the browser navigates to `/novels`

#### Scenario: Settings nav item links to settings route

- **WHEN** user clicks **Settings** in the sidebar
- **THEN** the browser navigates to `/settings`

#### Scenario: Active nav item is highlighted

- **WHEN** user is on `/novels` or a nested route under novels (future)
- **THEN** the **Novels** sidebar item appears active
- **WHEN** user is on `/settings`
- **THEN** the **Settings** sidebar item appears active

### Requirement: Sidebar header and collapse controls

The sidebar SHALL display a **Reword Stories** product header in the sidebar header area. The app shell SHALL include a `SidebarTrigger` in the inset header so users can collapse or expand the sidebar on desktop and open the mobile sheet on small viewports.

#### Scenario: Sidebar trigger toggles visibility

- **WHEN** user clicks the sidebar trigger in the inset header
- **THEN** the sidebar collapses on desktop or opens/closes the mobile overlay per shadcn sidebar behavior

#### Scenario: Product branding visible in sidebar

- **WHEN** user views any app page
- **THEN** the sidebar header shows **Reword Stories** (not the Next.js starter branding)

### Requirement: App layout server and client boundaries

The `(app)` layout file SHALL be a React Server Component. Interactive sidebar pieces (`AppSidebar`, navigation with active-state detection) SHALL be Client Components (`"use client"`) imported into the server layout. Page routes under `(app)` SHALL default to Server Components.

#### Scenario: App layout has no client directive

- **WHEN** inspecting `src/app/(app)/layout.tsx`
- **THEN** the file does not include `"use client"` at the top

#### Scenario: Sidebar component is a client island

- **WHEN** inspecting `src/components/app-sidebar.tsx` (or equivalent)
- **THEN** the file includes `"use client"` and uses shadcn sidebar primitives

### Requirement: Placeholder app pages and default route

The application SHALL serve a functional novels library at `/novels` (replacing the placeholder) and a placeholder Server Component page at `/settings`. Nested novel routes `/novels/new` and `/novels/[novelId]` SHALL render inside the app shell. The root path `/` SHALL redirect to `/novels`.

#### Scenario: Root redirects to novels

- **WHEN** user navigates to `/`
- **THEN** the browser is redirected to `/novels`

#### Scenario: Novel sub-routes render inside shell

- **WHEN** user visits `/novels/new` or `/novels/[novelId]`
- **THEN** page content renders inside `SidebarInset` with the left sidebar visible

#### Scenario: Settings remains placeholder

- **WHEN** user visits `/settings`
- **THEN** a minimal placeholder heading renders in the inset content area without errors

### Requirement: App metadata

Root layout metadata SHALL use the product name **Reword Stories** and a description aligned with the MT novel polisher purpose (replacing create-next-app defaults).

#### Scenario: Document title reflects product

- **WHEN** user loads an app page
- **THEN** the HTML document title includes **Reword Stories**
