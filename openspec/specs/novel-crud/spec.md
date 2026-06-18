# Novel CRUD

Novel library, create form, detail pages, and loading skeletons for the paste flow entry point.

## Requirements

### Requirement: Novel source language taxonomy

The application SHALL accept `sourceLanguage` as one of: `ko`, `ja`, `zh`, `vi`, `other`. Labels displayed in the UI SHALL be **Korean**, **Japanese**, **Chinese**, **Vietnamese**, and **Other** respectively. Validation SHALL be enforced in shared Zod schemas used by both tRPC and forms.

#### Scenario: Valid source language persisted

- **WHEN** user creates a novel with source language `ja`
- **THEN** the `Novel.sourceLanguage` column stores `ja`

#### Scenario: Invalid source language rejected

- **WHEN** a create request includes `sourceLanguage: "fr"`
- **THEN** validation fails before any database write

### Requirement: Novels tRPC router procedures

The `novels` router SHALL expose:

- `list` — query returning all novels ordered by `createdAt` descending (`id`, `title`, `sourceLanguage`, `createdAt`, chapter count)
- `getById` — query accepting `{ id: string }` returning novel metadata and chapters ordered by `sortOrder` (empty array if none)
- `create` — mutation accepting `{ title: string; sourceLanguage: string }` returning the created novel

Title SHALL be required, trimmed, and between 1 and 200 characters.

#### Scenario: List returns novels newest first

- **WHEN** `novels.list` is called with novels A (older) and B (newer) in the database
- **THEN** B appears before A in the result

#### Scenario: Get by id includes chapters

- **WHEN** `novels.getById` is called for a novel with two chapters
- **THEN** the response includes both chapters sorted by `sortOrder`

#### Scenario: Get by id not found

- **WHEN** `novels.getById` is called with a non-existent id
- **THEN** the procedure returns a NOT_FOUND tRPC error

#### Scenario: Create persists novel

- **WHEN** `novels.create` is called with `{ title: "Solo Leveling", sourceLanguage: "ko" }`
- **THEN** a `Novel` row is inserted and returned with a generated `id`

### Requirement: Novels library page at /novels

The route `src/app/(app)/novels/page.tsx` SHALL be a React Server Component that server-fetches the novel list and renders a library view inside the app shell. The page SHALL include a **New Novel** link/button to `/novels/new`. When no novels exist, an empty state SHALL prompt the user to create one.

#### Scenario: Library lists existing novels

- **WHEN** user navigates to `/novels` with novels in the database
- **THEN** each novel title links to `/novels/[id]` and source language is displayed

#### Scenario: Empty library state

- **WHEN** user navigates to `/novels` with zero novels
- **THEN** an empty state message and link to create a novel are shown

### Requirement: Create novel page at /novels/new

The route `src/app/(app)/novels/(novel)/new/page.tsx` SHALL render a create-novel form. The form SHALL be a Client Component using React Hook Form, shadcn `Field` primitives, Zod validation, and a source-language select. Fields: **Title** (text input) and **Source language** (select).

On successful submit, the client SHALL call `novels.create` via tRPC and navigate to `/novels/[id]`. Validation errors SHALL display inline next to fields.

#### Scenario: Successful create redirects to detail

- **WHEN** user submits a valid title and source language
- **THEN** a novel is created and the browser navigates to `/novels/[novelId]`

#### Scenario: Inline validation on empty title

- **WHEN** user submits with an empty title
- **THEN** an inline error appears on the title field and no navigation occurs

### Requirement: Novel detail page at /novels/[novelId]

The route `src/app/(app)/novels/(novel)/[novelId]/page.tsx` SHALL be a React Server Component that server-fetches novel metadata and chapters. It SHALL display the novel title, source language label, and a **Chapters** section. When no chapters exist, a placeholder empty state SHALL indicate chapters can be added in a future step (no paste form in this change).

Unknown `novelId` SHALL render a not-found response (`notFound()`).

#### Scenario: Detail shows novel metadata

- **WHEN** user navigates to `/novels/[validId]`
- **THEN** the page shows the novel title and human-readable source language

#### Scenario: Detail shows empty chapters placeholder

- **WHEN** user navigates to a novel with zero chapters
- **THEN** the chapters section shows an empty state (not an error)

#### Scenario: Invalid novel id returns 404

- **WHEN** user navigates to `/novels/nonexistent-id`
- **THEN** Next.js renders the not-found page

### Requirement: Create novel form uses React Hook Form

The create-novel form SHALL use React Hook Form per the project form standard (`app-scaffold`): `useForm` with `zodResolver`, `Controller` per field, and shadcn `Field`, `FieldLabel`, `FieldError`, and `Input` / `Select` components.

#### Scenario: Form matches shadcn RHF integration

- **WHEN** inspecting `src/components/novels/create-novel-form.tsx` (or equivalent)
- **THEN** it uses `react-hook-form`, `@hookform/resolvers/zod`, and shadcn `Field` components

### Requirement: Novel list loading skeleton at /novels

The route segment `src/app/(app)/novels/loading.tsx` SHALL render a list-specific skeleton while the library page loads. The skeleton SHALL use shadcn `Skeleton` via a dedicated `NovelListSkeleton` component and mimic the list layout: page heading, **New Novel** action placeholder, and multiple novel row/card placeholders.

#### Scenario: List route has its own loading boundary

- **WHEN** inspecting `src/app/(app)/novels/loading.tsx`
- **THEN** it renders `NovelListSkeleton` and does not reuse the new/detail skeleton

#### Scenario: List skeleton visible during navigation

- **WHEN** user navigates to `/novels` and the server component is pending
- **THEN** the list skeleton appears inside the app shell until the library page renders

### Requirement: Shared loading skeleton for new and detail routes

The routes `/novels/new` and `/novels/[novelId]` SHALL share a single loading boundary via a `(novel)` route group at `src/app/(app)/novels/(novel)/loading.tsx`. That file SHALL render a shared `NovelPageSkeleton` component that mimics the single-column page layout: back-link/header placeholder, title block, and content card placeholders. The detail skeleton MAY include an extra chapters-section block; the new-page skeleton MAY omit it or use the same layout (acceptable either way if visually consistent).

#### Scenario: New and detail share one loading file

- **WHEN** inspecting the novels route tree
- **THEN** `new/page.tsx` and `[novelId]/page.tsx` live under `novels/(novel)/` and both inherit `novels/(novel)/loading.tsx`

#### Scenario: Shared skeleton component exists

- **WHEN** inspecting `src/components/novels/skeletons/novel-page-skeleton.tsx`
- **THEN** it is imported by `novels/(novel)/loading.tsx` and uses shadcn `Skeleton` primitives

#### Scenario: List skeleton is not shown for new or detail navigation

- **WHEN** user navigates to `/novels/new` or `/novels/[novelId]`
- **THEN** `NovelPageSkeleton` is shown (not `NovelListSkeleton`) while the page loads
