## ADDED Requirements

### Requirement: App layout beyond starter page

The project SHALL replace the default create-next-app landing experience with a product app shell: route group layout, sidebar navigation, and placeholder routes for `/novels` and `/settings`, as specified in the `app-layout` capability.

#### Scenario: Default starter page removed

- **WHEN** user navigates to `/` after layout implementation
- **THEN** they are redirected to `/novels` and do not see the create-next-app template content

#### Scenario: Build succeeds with app shell

- **WHEN** developer runs `pnpm build`
- **THEN** the application compiles with the new `(app)` route group and sidebar components without TypeScript or build errors
