## Why

Reword Stories is a greenfield project with only OpenSpec planning artifacts — no application foundation yet. Step 1 of the init plan requires scaffolding the Next.js app with Prisma, Vercel Queues, and shadcn/ui, plus developer guardrails (lint, typecheck, pre-push hooks, typed env) so every subsequent feature change ships against a consistent, validated baseline.

## What Changes

- Scaffold Next.js App Router project structure (already partially started; finalize and extend)
- Add Prisma with PostgreSQL (Neon) client and initial schema placeholder
- Add `@vercel/queue` dependency and queue consumer route skeleton
- Initialize shadcn/ui with Tailwind CSS v4, then install all available shadcn components via CLI
- Extend ESLint with `eslint-plugin-simple-import-sort`, `eslint-plugin-unused-imports`, and Prettier integration for React
- Add `typecheck` script (`tsc --noEmit`) and `check` script (ESLint + typecheck combined)
- Add Husky with `pre-push` hook running `check` + `build`
- Replace raw `process.env` usage with `@t3-oss/env-nextjs` typed env module
- Add `.env.example` documenting required variables from init plan

## Capabilities

### New Capabilities

- `app-scaffold`: Next.js 15+ App Router foundation with Prisma, Vercel Queues skeleton, and shadcn/ui
- `dev-tooling`: ESLint plugins (import sort, unused imports, Prettier), typecheck script, ultimate lint check, Husky pre-push
- `env-config`: Type-safe environment variables via `@t3-oss/env-nextjs` with Zod validation

### Modified Capabilities

(none — greenfield; no existing specs in `openspec/specs/`)

## Impact

- **Dependencies:** `@prisma/client`, `prisma`, `@vercel/queue`, shadcn/ui components, `@t3-oss/env-nextjs`, `zod`, ESLint plugins, Prettier, Husky
- **Config files:** `eslint.config.mjs`, `package.json`, `.husky/pre-push`, `src/env.ts`, `prisma/schema.prisma`, `components.json`
- **Env vars:** `SITE_PASSWORD`, `DATABASE_URL`, `OPENAI_API_KEY`, `GEMINI_API_KEY`, `DEEPL_API_KEY` (validated at startup, not read ad hoc)
- **No runtime behavior yet** — scaffold only; no novel/chapter/translation features
