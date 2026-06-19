# tRPC API

Type-safe application API layer for Next.js App Router with server callers and React Query client hooks.

## Requirements

### Requirement: tRPC dependencies and App Router fetch adapter

The project SHALL include `@trpc/server`, `@trpc/client`, `@trpc/react-query`, and `@tanstack/react-query` as runtime dependencies. A Route Handler at `src/app/api/trpc/[trpc]/route.ts` SHALL expose the tRPC router via the fetch adapter (`fetchRequestHandler`) for both GET and POST.

#### Scenario: tRPC endpoint responds

- **WHEN** a typed tRPC client calls any registered procedure
- **THEN** the request is handled by `src/app/api/trpc/[trpc]/route.ts` and returns a valid tRPC response

#### Scenario: API route excludes app layout

- **WHEN** a request targets `/api/trpc/*`
- **THEN** no sidebar layout wraps the response

### Requirement: tRPC initialization and typed AppRouter

The project SHALL define tRPC initialization in `src/server/trpc/` with a shared context factory that provides the Prisma client from `src/lib/db.ts`. The root router SHALL compose feature routers and export `AppRouter` as a type for end-to-end inference on the client.

#### Scenario: Context includes database client

- **WHEN** a tRPC procedure runs
- **THEN** it receives a context object with access to the Prisma `db` instance

#### Scenario: AppRouter type is exported

- **WHEN** client code imports `AppRouter`
- **THEN** TypeScript resolves procedure names, inputs, and outputs from the server router definition

### Requirement: React Query provider for client components

The application SHALL wrap client-side subtrees that call tRPC mutations with a `TRPCReactProvider` (or equivalent) configured with `httpBatchLink` pointing at `/api/trpc`. The provider SHALL be mounted once at an appropriate layout boundary without forcing `"use client"` on server page components.

#### Scenario: Mutation from client form succeeds

- **WHEN** a Client Component calls a tRPC mutation hook
- **THEN** the request uses the shared provider and completes without manual fetch configuration

### Requirement: Server-side tRPC caller for RSC

The project SHALL expose a server-side tRPC caller (e.g. `createCaller` or `createHydrationHelpers`) so React Server Components can invoke procedures directly without an HTTP round-trip for initial page data.

#### Scenario: RSC fetches novel list without client fetch

- **WHEN** the `/novels` Server Component loads
- **THEN** it invokes the tRPC caller on the server to fetch novels and renders HTML without `useEffect` or client-side data fetching

### Requirement: Input validation via Zod in procedures

All tRPC procedure inputs SHALL be validated with Zod schemas defined in shared modules (e.g. `src/lib/validations/`). Invalid input SHALL return a tRPC error with a client-safe message.

#### Scenario: Invalid create input rejected

- **WHEN** a client submits a novel create mutation with an empty title
- **THEN** the procedure returns a validation error and no database row is created

### Requirement: Translations router on AppRouter

The root `AppRouter` in `src/server/trpc/router.ts` SHALL register a `translations` feature router exposing `listProviders`, `estimateChunks`, `create`, `getById`, `listByChapter`, and `retry` procedures.

All translation procedure inputs SHALL be validated with Zod schemas in `src/lib/validations/translation.ts` (or shared modules). Invalid input SHALL return a tRPC validation error.

#### Scenario: Translations router registered

- **WHEN** inspecting `src/server/trpc/router.ts`
- **THEN** the `translations` router is composed into `appRouter`

#### Scenario: Client invokes translation create

- **WHEN** a Client Component calls `trpc.translations.create.useMutation()`
- **THEN** the request is handled by the translations router and returns a typed response
