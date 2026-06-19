# LLM Provider

Provider interface, Vercel AI Gateway adapter, post-edit prompts, and model catalog for MT chapter post-editing.

## Requirements

### Requirement: TranslationProvider interface

The application SHALL define a `TranslationProvider` interface in `src/lib/llm/types.ts` with:

- `id` — stable provider slug (e.g. `gateway`)
- `label` — human-readable name for UI
- `models` — array of `{ id: string; label: string; isFree?: boolean }` entries the provider supports
- `polish(params)` — async function accepting `{ text: string; sourceLanguage: string; contextOverlap?: string; modelId: string }` and returning `{ polishedText: string; tokenUsage?: { input: number; output: number; total: number } }`

A provider registry in `src/lib/llm/providers.ts` SHALL export `getProvider(id: string)` and `listProviders()` for lookup by slug.

#### Scenario: Registry returns gateway provider

- **WHEN** `getProvider("gateway")` is called
- **THEN** it returns the AI Gateway-backed provider implementation

#### Scenario: Unknown provider slug

- **WHEN** `getProvider("unknown")` is called
- **THEN** it throws or returns a typed error indicating the provider is not registered

### Requirement: GatewayPolishProvider uses Vercel AI Gateway

The `gateway` provider implementation SHALL use the Vercel AI SDK (`generateText` from the `ai` package) with model ids in `creator/model-name` format (e.g. `google/gemini-2.5-flash-lite`, `openai/gpt-4o`).

Authentication SHALL use `AI_GATEWAY_API_KEY` from typed env when set; on Vercel deployment, OIDC auto-auth MAY be used when the key is absent.

The provider SHALL NOT call OpenAI, Anthropic, or Google APIs directly — all v1 LLM traffic routes through AI Gateway.

#### Scenario: Polish via gateway model id

- **WHEN** `polish()` is called with `modelId: "openai/gpt-4o"` and valid input text
- **THEN** the implementation invokes AI Gateway via the AI SDK and returns polished text

#### Scenario: Gateway auth from env

- **WHEN** the app runs locally with `AI_GATEWAY_API_KEY` set in env
- **THEN** gateway requests authenticate using that key

#### Scenario: Local polish fails without gateway auth

- **WHEN** `polish()` is called locally without `AI_GATEWAY_API_KEY` and without Vercel OIDC context
- **THEN** the provider throws a clear error about missing gateway authentication

### Requirement: Post-edit system prompt

The application SHALL define a prompt builder in `src/lib/llm/prompts.ts` that produces a system prompt instructing the model to post-edit (not translate) already-machine-translated English prose: preserve meaning, plot, and proper names; fix awkward MT phrasing; do not summarize or omit content.

The builder SHALL accept `sourceLanguage` (`ko` | `ja` | `zh` | `vi` | `other`) and include language-specific context hints for `ko`, `ja`, `zh`, and `vi`; for `other`, it SHALL omit source-language hints.

When `contextOverlap` is provided, the user message SHALL include the prior chunk's trailing paragraph as continuity context before the chunk to polish.

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

The application SHALL define a curated model catalog in `src/lib/llm/models.ts` listing gateway model ids and display labels for model selection in the translation UI.

The catalog SHALL include free-tier Google Gemini models (`google/gemini-2.5-flash-lite`, `google/gemini-2.5-flash`) marked with `isFree: true`, plus additional gateway models (OpenAI, Anthropic, etc.).

`DEFAULT_GATEWAY_MODEL_ID` SHALL default to `google/gemini-2.5-flash-lite`.

Each catalog entry SHALL be routable via the `gateway` provider.

#### Scenario: Catalog lists gateway models with free tier

- **WHEN** inspecting `src/lib/llm/models.ts`
- **THEN** it exports model entries with ids in `creator/model-name` format and `isFree: true` on zero-cost models

#### Scenario: Default model is free tier

- **WHEN** inspecting `DEFAULT_GATEWAY_MODEL_ID`
- **THEN** it equals `google/gemini-2.5-flash-lite`

### Requirement: Token usage returned from polish

The `polish()` result SHALL include token usage when the AI SDK response provides it, using `{ input, output, total }` counts suitable for persisting to `Translation.tokenUsage` in the queue pipeline.

#### Scenario: Token counts populated

- **WHEN** a successful gateway polish completes
- **THEN** the result includes `tokenUsage.total` as a positive integer when the SDK exposes usage metadata
