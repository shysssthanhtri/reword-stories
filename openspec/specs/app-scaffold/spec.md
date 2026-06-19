# App Scaffold

Foundation for Reword Stories: Next.js App Router, Prisma PostgreSQL, Vercel Workflows setup, and shadcn/ui component library.

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

### Requirement: Vercel queue consumer skeleton

The project SHALL include a Workflow SDK setup for durable translation jobs instead of a `@vercel/queue` push consumer.

The project SHALL install the `workflow` npm package and wrap `next.config.ts` with `withWorkflow()` from `workflow/next`.

#### Scenario: Workflow package installed

- **WHEN** inspecting `package.json`
- **THEN** `workflow` is listed as a dependency

#### Scenario: Next config wrapped with withWorkflow

- **WHEN** inspecting `next.config.ts`
- **THEN** the default export uses `withWorkflow()` from `workflow/next`

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

### Requirement: App layout beyond starter page

The project SHALL replace the default create-next-app landing experience with a product app shell: route group layout, sidebar navigation, and placeholder routes for `/novels` and `/settings`, as specified in the `app-layout` capability.

#### Scenario: Default starter page removed

- **WHEN** user navigates to `/` after layout implementation
- **THEN** they are redirected to `/novels` and do not see the create-next-app template content

#### Scenario: Build succeeds with app shell

- **WHEN** developer runs `pnpm build`
- **THEN** the application compiles with the new `(app)` route group and sidebar components without TypeScript or build errors

### Requirement: React Hook Form as project form library

All interactive forms in the application SHALL use **React Hook Form** with `@hookform/resolvers/zod` for Zod schema validation and shadcn/ui `Field` primitives with `Controller` for field wiring. Validation schemas SHALL live in shared modules under `src/lib/validations/` and be reused by both form `zodResolver` and tRPC procedure `.input()` where applicable.

TanStack Form SHALL NOT be used for application forms.

#### Scenario: Form dependencies installed

- **WHEN** inspecting `package.json`
- **THEN** `react-hook-form` and `@hookform/resolvers` are listed as runtime dependencies

#### Scenario: Forms follow shadcn RHF pattern

- **WHEN** inspecting any Client Component form (e.g. create-novel form)
- **THEN** it uses `useForm` with `zodResolver`, `Controller` per field, and shadcn `Field`, `FieldLabel`, and `FieldError` components

#### Scenario: Shared validation schema

- **WHEN** a form submits data validated by a Zod schema
- **THEN** the same schema (or a subset) is used by the corresponding tRPC procedure input validation
