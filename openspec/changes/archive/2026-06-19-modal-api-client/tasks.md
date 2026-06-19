## 1. Dependencies and OpenAPI tooling

- [x] 1.1 Add `openapi-fetch` to dependencies and `openapi-typescript` to devDependencies in `package.json`
- [x] 1.2 Add `generate:api` script to `package.json` (Parrot `scripts/generate-openapi.mjs` pattern)
- [x] 1.3 Copy/adapt `scripts/generate-openapi.mjs` from Parrot
- [x] 1.4 Add `openapi/generate.config.json` mapping `vietnamese-correction.openapi.json` → `src/lib/modal-vietnamese/schema.d.ts`
- [x] 1.5 Add `openapi/vietnamese-correction.openapi.json` snapshot for `POST /correct` (curl from deployed Modal `/openapi.json` or hand-author from FastAPI models)
- [x] 1.6 Run `pnpm install` and `pnpm generate:api` to produce initial `schema.d.ts`

## 2. Modal Vietnamese client module

- [x] 2.1 Create `src/lib/modal-vietnamese/client.ts` with `createModalVietnameseClient()` singleton (`server-only`, `openapi-fetch`, env URL + `x-api-key`)
- [x] 2.2 Create `src/lib/modal-vietnamese/correct.ts` with `buildCorrectionInput`, `formatModalVietnameseError`, and `correctText()`
- [x] 2.3 Create `src/lib/modal-vietnamese/index.ts` re-exporting public API

## 3. Provider refactor

- [x] 3.1 Refactor `src/lib/llm/modal-vietnamese-provider.ts` to use `buildCorrectionInput` + `correctText` instead of inline `fetch`
- [x] 3.2 Keep config guard (`assertModalConfig`) and provider registry unchanged in behavior

## 4. Documentation and verification

- [x] 4.1 Document OpenAPI snapshot refresh and `pnpm generate:api` in README (brief section near Modal deploy docs)
- [x] 4.2 Run `pnpm typecheck` and `pnpm lint` — fix any issues
