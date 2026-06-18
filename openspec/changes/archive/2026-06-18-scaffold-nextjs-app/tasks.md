## 1. Dependencies & Prisma

- [x] 1.1 Install runtime deps: `@prisma/client`, `@t3-oss/env-nextjs`, `@vercel/queue`, `zod`
- [x] 1.2 Install dev deps: `prisma`, `husky`, `prettier`, `eslint-config-prettier`, `eslint-plugin-simple-import-sort`, `eslint-plugin-unused-imports`
- [x] 1.3 Create `prisma/schema.prisma` with PostgreSQL datasource (`DATABASE_URL`) and `prisma-client-js` generator (no models yet)
- [x] 1.4 Create `src/lib/db.ts` PrismaClient singleton with hot-reload guard
- [x] 1.5 Add `postinstall` script (`prisma generate`) to `package.json`

## 2. App Scaffold (Queue + shadcn)

- [x] 2.1 Create `src/app/api/queues/process-chunk/route.ts` stub using `@vercel/queue` `handleCallback`
- [x] 2.2 Create `vercel.json` with queue trigger for topic `translation-chunk`, `maxDuration: 300`
- [x] 2.3 Run `pnpm dlx shadcn@latest init` (Tailwind v4, App Router, `src/components/ui`)
- [x] 2.4 Install all shadcn components: `pnpm dlx shadcn@latest add --all --yes`
- [x] 2.5 Verify `src/components/ui/` contains the full registry set and `pnpm build` still passes

## 3. Typed Environment (t3-env)

- [x] 3.1 Create `src/env.ts` with `@t3-oss/env-nextjs` + Zod schema for `DATABASE_URL`, `SITE_PASSWORD`, `OPENAI_API_KEY`, `GEMINI_API_KEY`, `DEEPL_API_KEY`
- [x] 3.2 Create `.env.example` documenting all required env vars with placeholders
- [x] 3.3 Wire `src/lib/db.ts` to use `env.DATABASE_URL` instead of `process.env`

## 4. ESLint & Prettier

- [x] 4.1 Add Prettier config (`.prettierrc` or `prettier.config.mjs`) with sensible defaults
- [x] 4.2 Extend `eslint.config.mjs` with `simple-import-sort`, `unused-imports`, and `eslint-config-prettier`
- [x] 4.3 Update `lint` script to `eslint .` in `package.json`
- [x] 4.4 Add optional `format` script: `prettier --write .`

## 5. Scripts & Quality Gates

- [x] 5.1 Add `typecheck` script: `tsc --noEmit`
- [x] 5.2 Add `check` script: `pnpm lint && pnpm typecheck` (ultimate lint check)
- [x] 5.3 Add `prepare` script: `husky` for hook installation

## 6. Husky Pre-push

- [x] 6.1 Run `pnpm exec husky init`
- [x] 6.2 Configure `.husky/pre-push` to run `pnpm check && pnpm build`

## 7. Verification

- [x] 7.1 Run `pnpm install` and confirm `prisma generate` succeeds
- [x] 7.2 Run `pnpm check` — ESLint + typecheck pass
- [x] 7.3 Run `pnpm build` — production build succeeds
- [x] 7.4 Spot-check a few shadcn imports (e.g. Button, Dialog, Table) compile via `pnpm typecheck`
