## ADDED Requirements

### Requirement: OpenAPI snapshot for Modal Vietnamese correction API

The project SHALL maintain a committed OpenAPI 3.x snapshot at `openapi/vietnamese-correction.openapi.json` describing the Modal FastAPI app's `POST /correct` endpoint, request body (`text`, optional `max_length`), JSON response (`corrected_text`), validation errors, and `ApiKeyAuth` security scheme.

A `openapi/generate.config.json` entry SHALL map that snapshot to generated types at `src/lib/modal-vietnamese/schema.d.ts`.

#### Scenario: Snapshot documents correct endpoint

- **WHEN** inspecting `openapi/vietnamese-correction.openapi.json`
- **THEN** it defines `POST /correct` with `CorrectRequest` and `CorrectResponse` schemas and `ApiKeyAuth` security

#### Scenario: Generate config maps snapshot to schema types

- **WHEN** inspecting `openapi/generate.config.json`
- **THEN** it includes an entry with `input: openapi/vietnamese-correction.openapi.json` and `output: src/lib/modal-vietnamese/schema.d.ts`

### Requirement: OpenAPI type generation script

The project SHALL include `scripts/generate-openapi.mjs` (Parrot pattern) and a `package.json` script `generate:api` that runs `openapi-typescript` for each entry in `openapi/generate.config.json`.

An optional filter argument SHALL allow regenerating a single spec (e.g. `pnpm generate:api vietnamese-correction`).

#### Scenario: Generate all API types

- **WHEN** developer runs `pnpm generate:api`
- **THEN** `src/lib/modal-vietnamese/schema.d.ts` is regenerated from the OpenAPI snapshot

#### Scenario: Generate single spec by filter

- **WHEN** developer runs `pnpm generate:api vietnamese-correction`
- **THEN** only the vietnamese-correction schema file is regenerated

### Requirement: Modal Vietnamese typed HTTP client

The project SHALL provide a server-only Modal client module at `src/lib/modal-vietnamese/` with:

- `client.ts` — singleton `createModalVietnameseClient()` using `openapi-fetch`, `baseUrl` from `env.MODAL_VIETNAMESE_API_URL`, and default header `x-api-key` from `env.MODAL_VIETNAMESE_API_KEY`
- `correct.ts` — `correctText(body)` calling `POST /correct` via the client, throwing a formatted error when the response is not OK or `corrected_text` is missing
- `index.ts` — re-exports client factory and `correctText`
- `schema.d.ts` — generated OpenAPI types (not hand-edited)

The client module SHALL import `env` from `@/env` and SHALL NOT read `process.env` directly.

#### Scenario: Client uses typed env and API key header

- **WHEN** `createModalVietnameseClient()` is called with valid env
- **THEN** it returns an `openapi-fetch` client configured with the Modal base URL and `x-api-key` header

#### Scenario: correctText returns trimmed correction

- **WHEN** `correctText({ text: "côn viec kin doanh" })` is called against a healthy Modal endpoint
- **THEN** it returns the `corrected_text` string trimmed of leading/trailing whitespace

#### Scenario: correctText throws on HTTP error

- **WHEN** `correctText` receives a non-2xx response from Modal
- **THEN** it throws an Error including the HTTP status and response detail

#### Scenario: Client is server-only

- **WHEN** inspecting `src/lib/modal-vietnamese/client.ts` and `correct.ts`
- **THEN** both files include `import "server-only"` at the top

### Requirement: Input truncation helper for correction requests

The Modal client module SHALL export a `buildCorrectionInput(text, contextOverlap?)` helper that concatenates overlap and text with a newline when overlap is provided, and truncates the combined string to a safe maximum (2000 characters) by keeping the trailing portion when over limit.

#### Scenario: Overlap prepended before truncation

- **WHEN** `buildCorrectionInput("Đoạn sau.", "Đoạn trước.")` is called
- **THEN** the result is `"Đoạn trước.\nĐoạn sau."` when within the character limit

#### Scenario: Long input truncated from the end

- **WHEN** `buildCorrectionInput` receives combined input longer than 2000 characters
- **THEN** it returns the last 2000 characters of the combined string
