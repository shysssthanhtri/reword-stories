## MODIFIED Requirements

### Requirement: Translations router on AppRouter

The root `AppRouter` in `src/server/trpc/router.ts` SHALL register a `translations` feature router exposing `listProviders`, `estimateChunks`, `create`, `getById`, `listByChapter`, `retry`, and `delete` procedures.

All translation procedure inputs SHALL be validated with Zod schemas in `src/lib/validations/translation.ts` (or shared modules). Invalid input SHALL return a tRPC validation error.

#### Scenario: Translations router registered

- **WHEN** inspecting `src/server/trpc/router.ts`
- **THEN** the `translations` router is composed into `appRouter`

#### Scenario: Client invokes translation create

- **WHEN** a Client Component calls `trpc.translations.create.useMutation()`
- **THEN** the request is handled by the translations router and returns a typed response

#### Scenario: Client invokes translation delete

- **WHEN** a Client Component calls `trpc.translations.delete.useMutation()`
- **THEN** the request is handled by the translations router and returns a typed response

## ADDED Requirements

### Requirement: Novels and chapters delete procedures on AppRouter

The root `AppRouter` SHALL register `novels.delete` and `chapters.delete` mutations on their respective feature routers. Delete procedure inputs SHALL accept `{ id: string }` validated with shared Zod schemas in `src/lib/validations/novel.ts` and `src/lib/validations/chapter.ts`.

#### Scenario: Client invokes novel delete

- **WHEN** a Client Component calls `trpc.novels.delete.useMutation()`
- **THEN** the request is handled by the novels router and returns `{ id: string }`

#### Scenario: Client invokes chapter delete

- **WHEN** a Client Component calls `trpc.chapters.delete.useMutation()`
- **THEN** the request is handled by the chapters router and returns `{ id: string }`
