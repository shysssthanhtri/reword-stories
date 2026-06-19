# tRPC API

## MODIFIED Requirements

### Requirement: Translations router on AppRouter

The root `AppRouter` in `src/server/trpc/router.ts` SHALL register a `translations` feature router exposing `listProviders`, `estimateChunks`, `create`, `getById`, `listByChapter`, `retry`, and `retryChunk` procedures.

All translation procedure inputs SHALL be validated with Zod schemas in `src/lib/validations/translation.ts` (or shared modules). Invalid input SHALL return a tRPC validation error.

#### Scenario: Translations router registered

- **WHEN** inspecting `src/server/trpc/router.ts`
- **THEN** the `translations` router is composed into `appRouter`

#### Scenario: Client invokes translation create

- **WHEN** a Client Component calls `trpc.translations.create.useMutation()`
- **THEN** the request is handled by the translations router and returns a typed response

#### Scenario: Client invokes chunk retry

- **WHEN** a Client Component calls `trpc.translations.retryChunk.useMutation()`
- **THEN** the request is handled by the translations router and returns a typed response with the re-queued chunk id
