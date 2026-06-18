## Context

Reword Stories is a greenfield Next.js project. A minimal Next.js 16 + Tailwind v4 + ESLint baseline already exists (`package.json`, `eslint.config.mjs`, `src/app/`). Init plan step 1 requires extending this into a full scaffold: Prisma, Vercel Queues, shadcn/ui, developer tooling (ESLint plugins, typecheck, Husky pre-push), and typed env via [t3-env](https://github.com/t3-oss/t3-env).

The repo uses **pnpm** (`pnpm-workspace.yaml` present).

## Goals / Non-Goals

**Goals:**

- Establish a production-ready project skeleton aligned with init-plan architecture
- Enforce code quality gates locally (lint + typecheck + build on pre-push)
- Centralize env validation with `@t3-oss/env-nextjs` + Zod — no ad hoc `process.env` in app code
- Leave Prisma schema as datasource-only placeholder (models come in step 2)
- Leave queue consumer as a stub handler (chunk logic comes in step 5)

**Non-Goals:**

- Novel/Chapter/Translation data models or API routes
- LLM provider adapters, middleware auth, or reader UI
- CI/CD GitHub Actions (separate from local Husky; can add later)
- Writing automated tests

## Decisions

### 1. Package manager: pnpm

**Decision:** Use pnpm for all install/run commands.

**Rationale:** `pnpm-workspace.yaml` already exists; stay consistent.

### 2. Next.js version: keep existing 16.x

**Decision:** Keep Next.js 16.2.9 already in `package.json` (init plan says 15+; 16 satisfies).

**Alternative:** Downgrade to 15 — rejected; no benefit on greenfield with 16 already working.

### 3. Prisma setup

**Decision:**

- Install `prisma` (dev) + `@prisma/client` (runtime)
- `prisma/schema.prisma` with PostgreSQL datasource + empty models block (comment pointing to step 2)
- Add `postinstall` script: `prisma generate`
- Add `src/lib/db.ts` exporting a singleton `PrismaClient` (standard Next.js hot-reload pattern)

**Rationale:** Prisma client must be generated before build; postinstall ensures CI/local consistency.

### 4. Vercel Queue skeleton

**Decision:**

- Install `@vercel/queue`
- Create `src/app/api/queues/process-chunk/route.ts` with `handleCallback` stub returning `{ ok: true }`
- Add `vercel.json` with `experimentalTriggers` for topic `translation-chunk`, `maxDuration: 300`

**Rationale:** Matches init-plan queue flow; stub unblocks deployment config without implementing chunk logic.

### 5. shadcn/ui initialization + full component library

**Decision:** Run `pnpm dlx shadcn@latest init` with defaults compatible with Tailwind v4 + App Router, then install **all** registry components in one batch:

```bash
pnpm dlx shadcn@latest add --all --yes
```

**Config:**

- Style: `new-york` (default)
- Base color: `neutral`
- CSS variables: yes
- `src/components/ui/` for components, `src/lib/utils.ts` for `cn()` helper

**Rationale:** shadcn is the chosen UI layer per init plan. Installing the full component set upfront avoids repeated CLI runs during feature work (forms, dialogs, reader UI, status badges, etc.) and ensures peer deps (e.g. `@radix-ui/*`, `react-hook-form`, `sonner`) are resolved once.

**Alternative:** Add components incrementally as needed — rejected; user wants full library at scaffold time.

**Note:** `--all` installs every component in the current shadcn registry. Re-run or add individually if new components ship later.

### 6. ESLint extensions

**Decision:** Extend existing flat config (`eslint.config.mjs`) with:

| Package | Purpose |
|---------|---------|
| `eslint-plugin-simple-import-sort` | Auto-sort imports/exports |
| `eslint-plugin-unused-imports` | Detect + autofix unused imports |
| `eslint-config-prettier` | Disable ESLint rules that conflict with Prettier |
| `prettier` | Code formatting |

**Rules:**

```js
"simple-import-sort/imports": "error",
"simple-import-sort/exports": "error",
"unused-imports/no-unused-imports": "error",
"unused-imports/no-unused-vars": ["warn", { vars: "all", varsIgnorePattern: "^_", argsIgnorePattern: "^_" }],
```

**Alternative:** `eslint-plugin-prettier` — optional; prefer running Prettier separately or via editor. Use `eslint-config-prettier` only to avoid conflicts; add `format` script with `prettier --write .` if desired.

**Note:** User asked for "eslint prettier react" — interpret as Prettier + ESLint integration for React/TS via `eslint-config-prettier` atop existing `eslint-config-next`.

### 7. Scripts in `package.json`

**Decision:**

```json
{
  "typecheck": "tsc --noEmit",
  "check": "pnpm lint && pnpm typecheck",
  "lint": "eslint .",
  "prepare": "husky"
}
```

**Rationale:** `check` is the "ultimate lint check" (ESLint + TypeScript). Husky `prepare` auto-installs hooks on `pnpm install`.

### 8. Husky pre-push

**Decision:**

- Install `husky` as devDependency
- Run `pnpm exec husky init`
- `.husky/pre-push`:

```sh
pnpm check
pnpm build
```

**Rationale:** User requested pre-push (not pre-commit) for heavier gates. Blocks broken pushes without slowing every commit.

### 9. Typed env with t3-env

**Decision:** Create `src/env.ts`:

```typescript
import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  server: {
    DATABASE_URL: z.string().url(),
    SITE_PASSWORD: z.string().min(1),
    OPENAI_API_KEY: z.string().min(1),
    GEMINI_API_KEY: z.string().min(1),
    DEEPL_API_KEY: z.string().min(1),
  },
  client: {},
  experimental__runtimeEnv: process.env,
});
```

**Packages:** `@t3-oss/env-nextjs`, `zod`

**Usage rule:** All server code imports `env` from `@/env`. ESLint `no-restricted-syntax` or code review convention — no `process.env` outside `src/env.ts`.

**Alternative:** `@t3-oss/env-core` — rejected; `@t3-oss/env-nextjs` handles Next.js client/server split even with no client vars today.

**Dev ergonomics:** `.env.example` committed; `.env` gitignored. For local dev, copy example and fill values. Optional: mark API keys optional in dev with `.optional()` — **rejected for v1**; fail fast on missing vars.

### 10. File layout after scaffold

```
src/
  app/
    layout.tsx
    page.tsx
    api/queues/process-chunk/route.ts
  components/ui/          # all shadcn registry components
  env.ts
  lib/
    db.ts
    utils.ts
prisma/schema.prisma
vercel.json
.husky/pre-push
.env.example
eslint.config.mjs
components.json
```

## Risks / Trade-offs

| Risk | Mitigation |
|------|------------|
| Pre-push hook slow (full build every push) | Acceptable for solo project; can switch to pre-commit lint-only later |
| All API keys required at startup even before LLM features | Keys needed soon anyway; `.env.example` documents setup |
| `@vercel/queue` API may change (v2beta) | Skeleton only; update trigger config when implementing step 5 |
| shadcn init may conflict with Tailwind v4 | Use latest shadcn CLI; verify build passes after `--all` |
| `add --all` pulls many peer deps and lengthens install | One-time cost; keeps feature branches lean |
| t3-env `experimental__runtimeEnv` API | Use current `@t3-oss/env-nextjs` docs; pin version |

## Migration Plan

1. Install dependencies and run scaffold commands
2. Verify `pnpm check` and `pnpm build` pass
3. Copy `.env.example` → `.env.local` for local dev
4. No rollback needed — greenfield; revert commit if scaffold fails

## Open Questions

1. Should `GEMINI_API_KEY` and `DEEPL_API_KEY` be optional until step 7 (multi-model)? **Recommendation:** Keep required in env schema but allow empty string skip in dev — defer to implementer; default to required per init plan.
2. Add `format` script for Prettier? **Recommendation:** Yes — `prettier --write .` as optional dev script, not in pre-push.
