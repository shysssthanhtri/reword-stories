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

The application SHALL define prompt builders in `src/lib/llm/prompts.ts`:

- `buildPostEditSystemPrompt(sourceLanguage)` — system message instructing the model to reword (not translate) novel prose in the novel's original language. The prompt SHALL preserve meaning, plot, and proper names; fix awkward machine-translation phrasing; and not summarize or omit content.
- `buildPostEditUserMessage(text, sourceLanguage, contextOverlap?)` — user message that explicitly states the original language (human-readable label from `getSourceLanguageLabel`) and asks the model to reword the passage in that same language.

The system prompt builder SHALL accept `sourceLanguage` (`ko` | `ja` | `zh` | `vi` | `other`) and include language-specific context hints for `ko`, `ja`, `zh`, and `vi`; for `other`, it SHALL use a generic instruction that names no specific language but requires output in the same language as the input.

When `contextOverlap` is provided, the user message SHALL include the prior chunk's trailing paragraph as continuity context before the chunk to polish.

The gateway provider SHALL pass `sourceLanguage` to both prompt builders on every `polish()` call.

#### Scenario: Korean source language named in prompts

- **WHEN** the prompt builders are called with `sourceLanguage: "ko"`
- **THEN** both the system prompt and user message mention Korean as the original language and instruct rewording in Korean without translation

#### Scenario: Other source language uses generic wording

- **WHEN** the prompt builders are called with `sourceLanguage: "other"`
- **THEN** the system prompt omits language-specific MT hints and the user message instructs rewording in the original language without naming a specific language

#### Scenario: Overlap context included in user message

- **WHEN** `polish()` is called with a non-empty `contextOverlap`
- **THEN** the LLM user message includes that text as continuity context before the raw slice

#### Scenario: User message forbids translation

- **WHEN** `buildPostEditUserMessage` is called for any supported `sourceLanguage`
- **THEN** the user message instructs the model to reword in the original language and not translate to another language

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

### Requirement: Modal Vietnamese correction provider

The application SHALL register a `modal-vietnamese` provider in `src/lib/llm/providers.ts` implemented in `src/lib/llm/modal-vietnamese-provider.ts` with:

- `id`: `modal-vietnamese`
- `label`: human-readable name (e.g. "Vietnamese Correction (Modal)")
- `models`: a single entry `{ id: "bmd1905/vietnamese-correction-v2", label: "Vietnamese Correction v2", isFree: true }`

The provider's `polish()` SHALL:

- POST to `MODAL_VIETNAMESE_API_URL` (typed env) at path `/correct` with JSON `{ text }`
- Send header `X-Api-Key: MODAL_VIETNAMESE_API_KEY`
- When `contextOverlap` is provided, prepend it to `text` separated by a newline before sending (continuity without LLM prompts)
- Return `{ polishedText: corrected_text }` from the Modal response
- Omit `tokenUsage` (the correction model does not expose token counts)
- NOT invoke AI Gateway or post-edit prompt builders

If `MODAL_VIETNAMESE_API_URL` or `MODAL_VIETNAMESE_API_KEY` is missing when `polish()` runs, the provider SHALL throw a clear configuration error.

#### Scenario: Registry returns modal-vietnamese provider

- **WHEN** `getProvider("modal-vietnamese")` is called
- **THEN** it returns the Modal-backed Vietnamese correction provider

#### Scenario: Polish via Modal HTTP endpoint

- **WHEN** `polish()` is called with valid env and Vietnamese text
- **THEN** the provider POSTs to the Modal `/correct` endpoint and returns corrected text in `polishedText`

#### Scenario: Overlap prepended to input text

- **WHEN** `polish()` is called with `contextOverlap: "Đoạn trước."` and `text: "Đoạn sau."`
- **THEN** the Modal request body text is `"Đoạn trước.\nĐoạn sau."`

#### Scenario: Missing Modal config throws

- **WHEN** `polish()` is called without `MODAL_VIETNAMESE_API_URL` or `MODAL_VIETNAMESE_API_KEY` configured
- **THEN** the provider throws a clear error about missing Modal configuration

### Requirement: Modal Vietnamese model catalog constants

The application SHALL export `MODAL_VIETNAMESE_PROVIDER_ID`, `MODAL_VIETNAMESE_MODELS`, and `DEFAULT_MODAL_VIETNAMESE_MODEL_ID` from `src/lib/llm/models.ts` alongside existing gateway constants.

`DEFAULT_MODAL_VIETNAMESE_MODEL_ID` SHALL equal `bmd1905/vietnamese-correction-v2`.

#### Scenario: Catalog lists correction model

- **WHEN** inspecting `MODAL_VIETNAMESE_MODELS`
- **THEN** it includes one entry with id `bmd1905/vietnamese-correction-v2` and `isFree: true`
