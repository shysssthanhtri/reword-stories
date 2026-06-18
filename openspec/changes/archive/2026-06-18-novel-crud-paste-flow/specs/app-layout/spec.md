## MODIFIED Requirements

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
