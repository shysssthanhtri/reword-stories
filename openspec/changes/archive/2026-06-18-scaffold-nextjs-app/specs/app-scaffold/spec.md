## ADDED Requirements

### Requirement: Next.js App Router foundation

The project SHALL use Next.js App Router with TypeScript, Tailwind CSS v4, and the `@/*` path alias pointing to `src/*`.

#### Scenario: Dev server starts

- **WHEN** developer runs `pnpm dev`
- **THEN** the Next.js dev server starts without errors and serves the default page at `/`

#### Scenario: Production build succeeds

- **WHEN** developer runs `pnpm build`
- **THEN** the application compiles successfully with no TypeScript or build errors

### Requirement: Prisma PostgreSQL client

The project SHALL include Prisma ORM configured for PostgreSQL with a `prisma/schema.prisma` file and a generated client importable from application code.

#### Scenario: Prisma client generates

- **WHEN** developer runs `pnpm prisma generate`
- **THEN** `@prisma/client` is generated without errors

#### Scenario: Schema placeholder exists

- **WHEN** inspecting `prisma/schema.prisma`
- **THEN** it defines a PostgreSQL datasource using `DATABASE_URL` and a generator for `prisma-client-js`

### Requirement: Vercel Queue consumer skeleton

The project SHALL include `@vercel/queue` as a dependency and a push consumer route skeleton at `src/app/api/queues/process-chunk/route.ts` wired for future chunk processing.

#### Scenario: Queue route exports handler

- **WHEN** inspecting the process-chunk API route
- **THEN** it exports a `POST` handler using `@vercel/queue` `handleCallback` (or equivalent SDK pattern) as a no-op or stub that returns 200

#### Scenario: Vercel queue trigger configured

- **WHEN** inspecting `vercel.json`
- **THEN** it declares a queue/v2beta trigger for topic `translation-chunk` on the process-chunk route with `maxDuration` 300

### Requirement: shadcn/ui initialized

The project SHALL have shadcn/ui initialized with Tailwind CSS and a `components.json` config.

#### Scenario: shadcn config present

- **WHEN** inspecting `components.json`
- **THEN** it specifies the correct paths for components, utils, and Tailwind CSS integration

### Requirement: All shadcn components installed

After shadcn init, the project SHALL install every component available in the shadcn registry (via `pnpm dlx shadcn@latest add --all` or equivalent batch add), placing them under `src/components/ui/`.

#### Scenario: Full component library present

- **WHEN** inspecting `src/components/ui/`
- **THEN** all registry components (e.g. accordion, alert, button, card, dialog, form, input, select, table, etc.) are present as individual files

#### Scenario: Any shadcn component importable

- **WHEN** a page imports any installed shadcn component (e.g. Button, Dialog, Table)
- **THEN** TypeScript resolves the import and the component compiles without errors
