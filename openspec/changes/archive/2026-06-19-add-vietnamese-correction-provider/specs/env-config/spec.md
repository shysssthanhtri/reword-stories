# Env Config

## MODIFIED Requirements

### Requirement: Type-safe env via t3-env

The project SHALL use `@t3-oss/env-nextjs` with Zod schemas to validate environment variables at startup instead of reading `process.env` directly in application code.

#### Scenario: Env module exists

- **WHEN** inspecting `src/env.ts` (or `src/env.js`)
- **THEN** it exports a typed `env` object created via `createEnv` from `@t3-oss/env-nextjs`

#### Scenario: Server env vars validated

- **WHEN** the application starts with missing or invalid required server env vars (`DATABASE_URL`, `SITE_PASSWORD`)
- **THEN** startup fails with a clear Zod validation error listing the missing/invalid variable

#### Scenario: Application code uses typed env

- **WHEN** server-side code needs an environment variable
- **THEN** it imports from the typed `env` module rather than accessing `process.env` directly

#### Scenario: Optional gateway and direct provider keys

- **WHEN** the application starts without `AI_GATEWAY_API_KEY`, `OPENAI_API_KEY`, `GEMINI_API_KEY`, or `DEEPL_API_KEY`
- **THEN** startup succeeds — `AI_GATEWAY_API_KEY` is optional (Vercel OIDC on deploy); direct provider keys are optional until native adapters are implemented

#### Scenario: Optional Modal Vietnamese correction vars

- **WHEN** the application starts without `MODAL_VIETNAMESE_API_URL` or `MODAL_VIETNAMESE_API_KEY`
- **THEN** startup succeeds — these vars are optional until a translation uses the `modal-vietnamese` provider

### Requirement: Env example documented

The project SHALL include a `.env.example` file listing all required environment variables with placeholder values and brief comments.

#### Scenario: Example file lists all vars

- **WHEN** inspecting `.env.example`
- **THEN** it documents `DATABASE_URL`, `SITE_PASSWORD`, `AI_GATEWAY_API_KEY`, optional `OPENAI_API_KEY`, `GEMINI_API_KEY`, `DEEPL_API_KEY`, and optional `MODAL_VIETNAMESE_API_URL`, `MODAL_VIETNAMESE_API_KEY`

#### Scenario: Example is safe to commit

- **WHEN** inspecting `.env.example`
- **THEN** it contains no real secrets — only placeholder values
