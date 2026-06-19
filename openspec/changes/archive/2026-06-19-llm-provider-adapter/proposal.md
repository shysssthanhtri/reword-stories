## Why

Init plan step 4 requires a working LLM adapter and post-edit prompt to prove polish quality before building the queue pipeline (step 5). The original plan wired OpenAI directly, but Vercel AI Gateway gives a single API key and unified interface to many models (OpenAI, Anthropic, Google, and others) while staying on the same Vercel stack — and we still need a provider interface so DeepL and direct-provider adapters can be added later without rewriting the consumer.

## What Changes

- Add a `TranslationProvider` interface and provider registry (`getProvider`, list models)
- Implement `GatewayPolishProvider` using Vercel AI SDK + AI Gateway (`generateText` with `creator/model-name` model ids)
- Add post-edit system prompt builder keyed on novel `sourceLanguage` (ko | ja | zh | other) with optional overlap context from the previous chunk
- Add a curated v1 model catalog (gateway-backed OpenAI and other gateway models Steven can pick in step 5 UI)
- Add `AI_GATEWAY_API_KEY` to typed env and `.env.example`; make direct provider keys optional until those adapters ship
- Add a server-side dev script to polish a text slice locally (manual quality check before queue work)
- Return token usage from `polish()` for future cost tracking on `Translation.tokenUsage`

**Out of scope for this change:** queue consumer chunk processing (step 5), translation CRUD UI, chunking, reader view, DeepL/Gemini direct adapters.

## Capabilities

### New Capabilities

- `llm-provider`: Provider interface, AI Gateway adapter, post-edit prompts, model catalog, and dev polish script

### Modified Capabilities

- `env-config`: Require `AI_GATEWAY_API_KEY` for LLM access; direct provider keys (`OPENAI_API_KEY`, `GEMINI_API_KEY`, `DEEPL_API_KEY`) become optional placeholders for future adapters or BYOK

## Impact

- **New files:** `src/lib/llm/**` (provider interface, gateway adapter, prompts, model catalog), `scripts/polish-slice.ts` (or equivalent dev runner)
- **Modified files:** `src/env.ts`, `.env.example`, `package.json` (add `ai` dependency)
- **Dependencies:** `ai` (Vercel AI SDK v6 with built-in gateway support)
- **Database:** No schema migration; `Translation.provider` / `modelName` conventions documented for gateway model ids
- **Env:** Deployments need `AI_GATEWAY_API_KEY` from Vercel AI Gateway dashboard; OIDC auto-auth applies on Vercel without a key
