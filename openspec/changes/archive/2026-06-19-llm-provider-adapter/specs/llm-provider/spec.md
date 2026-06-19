# LLM Provider

Provider interface, Vercel AI Gateway adapter, post-edit prompts, model catalog, and dev polish script for MT chapter post-editing.

## ADDED Requirements

### Requirement: TranslationProvider interface

The application SHALL define a `TranslationProvider` interface in `src/lib/llm/types.ts` with:

- `id` — stable provider slug (e.g. `gateway`)
- `label` — human-readable name for UI
- `models` — array of `{ id: string; label: string }` entries the provider supports
- `polish(params)` — async function accepting `{ text: string; sourceLanguage: string; contextOverlap?: string; modelId: string }` and returning `{ polishedText: string; tokenUsage?: { input: number; output: number; total: number } }`

A provider registry in `src/lib/llm/providers.ts` SHALL export `getProvider(id: string)` and `listProviders()` for lookup by slug.

#### Scenario: Registry returns gateway provider

- **WHEN** `getProvider("gateway")` is called
- **THEN** it returns the AI Gateway-backed provider implementation

#### Scenario: Unknown provider slug

- **WHEN** `getProvider("unknown")` is called
- **THEN** it throws or returns a typed error indicating the provider is not registered

### Requirement: GatewayPolishProvider uses Vercel AI Gateway

The `gateway` provider implementation SHALL use the Vercel AI SDK (`generateText` from the `ai` package) with model ids in `creator/model-name` format (e.g. `openai/gpt-4o`, `anthropic/claude-sonnet-4.6`).

Authentication SHALL use `AI_GATEWAY_API_KEY` from typed env when set; on Vercel deployment, OIDC auto-auth MAY be used when the key is absent.

The provider SHALL NOT call OpenAI, Anthropic, or Google APIs directly — all v1 LLM traffic routes through AI Gateway.

#### Scenario: Polish via gateway model id

- **WHEN** `polish()` is called with `modelId: "openai/gpt-4o"` and valid input text
- **THEN** the implementation invokes AI Gateway via the AI SDK and returns polished text

#### Scenario: Gateway auth from env

- **WHEN** the app runs locally with `AI_GATEWAY_API_KEY` set in env
- **THEN** gateway requests authenticate using that key

### Requirement: Post-edit system prompt

The application SHALL define a prompt builder in `src/lib/llm/prompts.ts` that produces a system prompt instructing the model to post-edit (not translate) already-machine-translated English prose: preserve meaning, plot, and proper names; fix awkward MT phrasing; do not summarize or omit content.

The builder SHALL accept `sourceLanguage` (`ko` | `ja` | `zh` | `other`) and include language-specific context hints for `ko`, `ja`, and `zh`; for `other`, it SHALL omit source-language hints.

When `contextOverlap` is provided, the user message SHALL include the prior chunk's trailing paragraph (max 500 tokens worth of text) as continuity context before the chunk to polish.

#### Scenario: Korean source language hint

- **WHEN** the prompt builder is called with `sourceLanguage: "ko"`
- **THEN** the system prompt mentions Korean-origin MT as context for the model

#### Scenario: Other source language omits hint

- **WHEN** the prompt builder is called with `sourceLanguage: "other"`
- **THEN** the system prompt uses a generic post-edit instruction without naming a source language

#### Scenario: Overlap context included in user message

- **WHEN** `polish()` is called with a non-empty `contextOverlap`
- **THEN** the LLM request includes that text as continuity context before the raw slice

### Requirement: V1 gateway model catalog

The application SHALL define a curated model catalog in `src/lib/llm/models.ts` listing gateway model ids and display labels for Steven to choose in a future translation UI.

The catalog SHALL include at least two OpenAI models routed via gateway (e.g. `openai/gpt-4o` and a faster/cheaper variant) and SHALL be structured so additional gateway models (Anthropic, Google, etc.) can be appended without changing the provider interface.

Each catalog entry SHALL map to the `gateway` provider id.

#### Scenario: Catalog lists gateway models

- **WHEN** inspecting `src/lib/llm/models.ts`
- **THEN** it exports model entries with `providerId: "gateway"` and ids in `creator/model-name` format

### Requirement: Dev polish script for manual QA

The project SHALL include a server-side script (e.g. `scripts/polish-slice.ts`, runnable via `pnpm polish-slice`) that reads a text file or stdin slice, calls `GatewayPolishProvider.polish()` with configurable `--model` and `--source-language`, and prints the polished output to stdout.

This script is for Steven's init-plan assignment (manual before/after quality check) and is not exposed as a public API route.

#### Scenario: Script polishes sample text

- **WHEN** developer runs `pnpm polish-slice -- --model openai/gpt-4o --source-language ko` with a sample MT paragraph on stdin
- **THEN** the script prints polished prose to stdout and exits 0 on success

#### Scenario: Script fails without gateway key locally

- **WHEN** developer runs the script locally without `AI_GATEWAY_API_KEY` and without Vercel OIDC context
- **THEN** the script exits with a clear error about missing gateway authentication

### Requirement: Token usage returned from polish

The `polish()` result SHALL include token usage when the AI SDK response provides it, using `{ input, output, total }` counts suitable for persisting to `Translation.tokenUsage` in the queue pipeline (step 5).

#### Scenario: Token counts populated

- **WHEN** a successful gateway polish completes
- **THEN** the result includes `tokenUsage.total` as a positive integer when the SDK exposes usage metadata
