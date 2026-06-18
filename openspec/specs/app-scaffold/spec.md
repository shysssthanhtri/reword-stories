# App Scaffold

Foundation for Reword Stories: Next.js App Router, Prisma PostgreSQL, Vercel Queues skeleton, and shadcn/ui component library.

## Requirements

### Requirement: Next.js App Router foundation

The project SHALL use Next.js App Router with TypeScript, Tailwind CSS v4, and the `@/*` path alias pointing to `src/*`.

#### Scenario: Dev server starts

- **WHEN** developer runs `pnpm dev`
- **THEN** the Next.js dev server starts without errors and serves the default page at `/`

#### Scenario: Production build succeeds

- **WHEN** developer runs `pnpm build`
- **THEN** the application compiles successfully with no TypeScript or build errors

### Requirement: Prisma PostgreSQL client

The project SHALL include Prisma ORM v7 configured for PostgreSQL with a `prisma/schema.prisma` file, `prisma.config.ts` for the database URL, and a generated client importable from `src/generated/prisma`.

#### Scenario: Prisma client generates

- **WHEN** developer runs `pnpm prisma generate`
- **THEN** the Prisma client is generated to `src/generated/prisma` without errors

#### Scenario: Schema and config exist

- **WHEN** inspecting `prisma/schema.prisma` and `prisma.config.ts`
- **THEN** the schema defines a PostgreSQL datasource and `prisma-client` generator with output path, and the config defines `DATABASE_URL` for CLI operations

#### Scenario: Runtime client uses driver adapter

- **WHEN** inspecting `src/lib/db.ts`
- **THEN** it instantiates `PrismaClient` with `@prisma/adapter-pg` using the typed `env.DATABASE_URL`

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
