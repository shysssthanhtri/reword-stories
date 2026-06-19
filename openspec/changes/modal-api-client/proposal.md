## Why

The `modal-vietnamese` provider currently calls the Modal `/correct` endpoint with inline `fetch` logic. The sibling **Parrot** project already uses a typed Modal HTTP client pattern (`openapi-fetch` + OpenAPI snapshot + `server-only` singleton) for Chatterbox TTS. Extracting the same client layer here improves type safety, error formatting, and reuse as more Modal endpoints are added — without changing polish behavior for users.

## What Changes

- Add a typed Modal Vietnamese correction client module under `src/lib/modal-vietnamese/` (Parrot `src/lib/chatterbox/` pattern)
- Commit an OpenAPI snapshot for the Modal FastAPI app and a `generate:api` script to regenerate TypeScript types
- Add `openapi-fetch` and `openapi-typescript` dependencies
- Refactor `modal-vietnamese-provider.ts` to call the client instead of raw `fetch`
- Document OpenAPI regeneration in README (fetch spec from deployed Modal `/openapi.json` or maintain hand-written snapshot)

## Capabilities

### New Capabilities

- `modal-api-client`: Typed HTTP client for Modal-hosted inference APIs — singleton factory, OpenAPI-derived request/response types, and domain functions (e.g. `correctText`)

### Modified Capabilities

- `llm-provider`: `modal-vietnamese` provider SHALL delegate HTTP calls to the Modal client module instead of inline `fetch`; external polish behavior unchanged

## Impact

- **Code**: New `src/lib/modal-vietnamese/` (client, correct, index, schema.d.ts); refactor `src/lib/llm/modal-vietnamese-provider.ts`
- **Tooling**: New `openapi/` directory, `scripts/generate-openapi.mjs`, `package.json` script `generate:api`
- **Dependencies**: `openapi-fetch`, `openapi-typescript` (dev)
- **Env**: No new env vars — continues using `MODAL_VIETNAMESE_API_URL` and `MODAL_VIETNAMESE_API_KEY`
- **Runtime**: No change to Modal Python app or deploy workflow
