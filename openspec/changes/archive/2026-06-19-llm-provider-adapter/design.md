## Context

Init plan step 4 originally called for a direct OpenAI adapter. The queue consumer stub exists at `src/app/api/queues/process-chunk/route.ts` but has no LLM integration yet. Env currently requires `OPENAI_API_KEY`, `GEMINI_API_KEY`, and `DEEPL_API_KEY` even though no adapters consume them.

The project is deployed on Vercel. Vercel AI Gateway provides a single endpoint and credential (`AI_GATEWAY_API_KEY`) to reach models from OpenAI, Anthropic, Google, and others via the AI SDK, with optional BYOK and provider routing. Steven still wants per-translation model choice and future direct adapters (DeepL Write, native Gemini) without rewriting the pipeline.

This change is server-only — no UI pages. The dev polish script validates prompt quality before step 5 wires the queue consumer.

## Goals / Non-Goals

**Goals:**

- Prove post-edit quality via a callable `polish()` function and CLI script
- Route all v1 LLM calls through Vercel AI Gateway (not direct OpenAI SDK)
- Keep a stable `TranslationProvider` interface and registry for future providers
- Return token usage for downstream cost tracking
- Update env validation for gateway-first auth

**Non-Goals:**

- Queue consumer implementation, chunking, translation CRUD, or model-picker UI (steps 5+)
- DeepL or direct Gemini adapters (v1.1)
- Gateway fallbacks / multi-model retry chains (can add via `providerOptions.gateway.models` later)
- Automated tests

## Decisions

### 1. AI SDK + built-in gateway (not `@ai-sdk/openai`)

**Decision:** Add the `ai` package (v6+) and call `generateText({ model: "openai/gpt-4o", ... })`. The SDK routes `creator/model-name` strings through AI Gateway automatically.

**Rationale:** One dependency, one auth path, easy model switching by string. Matches Vercel docs and init-plan's "user picks model per translation."

**Alternative:** `@ai-sdk/openai` with direct API key — rejected; user explicitly wants gateway. **`@ai-sdk/gateway` explicit provider** — optional; built-in routing is sufficient for v1.

### 2. Single `gateway` provider slug for v1

**Decision:** Register one provider with `id: "gateway"`. Persist `Translation.provider = "gateway"` and `Translation.modelName = "<creator>/<model>"` (e.g. `openai/gpt-4o`).

**Rationale:** All v1 models share the same transport and auth. The model string carries vendor identity for UI grouping later.

**Alternative:** Store vendor slug (`openai`) in `provider` and short model name (`gpt-4o`) — rejected for now; splits gateway identity from routing and complicates future direct-vs-gateway disambiguation.

### 3. Provider registry pattern

**Decision:**

```
src/lib/llm/
  types.ts          # TranslationProvider interface + PolishParams/Result
  prompts.ts        # buildPostEditPrompt(sourceLanguage)
  models.ts         # GATEWAY_MODELS catalog
  gateway-provider.ts
  providers.ts      # registry: getProvider, listProviders
```

Future adapters (e.g. `deepl-provider.ts`) register alongside gateway without changing call sites.

**Rationale:** Matches init-plan adapter interface; queue consumer (step 5) calls `getProvider(translation.provider).polish(...)`.

### 4. Post-edit prompt design

**Decision:** System message defines the post-edit role. User message structure:

1. Optional overlap block: `"Previous paragraph (for continuity only, do not rewrite):\n{contextOverlap}"`
2. Main block: `"Rewrite the following machine-translated passage into smooth English prose:\n\n{text}"`

Source language hints (Korean/Japanese/Chinese) note likely MT artifacts (honorifics, word order). `other` uses generic instructions.

Temperature: `0.3` (low creativity, preserve plot). No streaming for v1 polish (queue consumer wants full text).

### 5. Authentication

**Decision:** Read `AI_GATEWAY_API_KEY` from `src/env.ts`. Pass to `createGateway({ apiKey })` when present; omit `apiKey` on Vercel production where OIDC applies.

Local dev requires a gateway API key from the Vercel dashboard (AI Gateway section).

**Alternative:** Require key everywhere — rejected; breaks zero-config Vercel deploy.

### 6. Env var changes

**Decision:**

| Variable | Required | Notes |
|----------|----------|-------|
| `AI_GATEWAY_API_KEY` | Yes (local) / optional on Vercel OIDC | Primary LLM auth |
| `OPENAI_API_KEY` | No | Future BYOK or direct adapter |
| `GEMINI_API_KEY` | No | Future direct adapter |
| `DEEPL_API_KEY` | No | Future DeepL Write adapter |

Use `z.string().min(1).optional()` for optional keys.

**Migration:** Update `.env` — add `AI_GATEWAY_API_KEY`; existing provider keys can remain but are no longer required for startup.

### 7. V1 model catalog (curated)

**Decision:** Start with a small static list in `models.ts`:

| id | label |
|----|-------|
| `openai/gpt-4o` | GPT-4o |
| `openai/gpt-4o-mini` | GPT-4o Mini |
| `anthropic/claude-sonnet-4.6` | Claude Sonnet 4.6 |

Expand as Steven tests quality/cost. No runtime fetch from gateway models API in v1.

### 8. Dev polish script

**Decision:** `scripts/polish-slice.ts` run via `pnpm polish-slice`:

```bash
pnpm polish-slice -- --model openai/gpt-4o --source-language ko < sample.txt
```

Uses `tsx` (add as devDependency) or `node --import tsx`. Loads env via `dotenv/config`. Calls gateway provider directly — no HTTP, no tRPC.

**Rationale:** Supports init-plan assignment (manual before/after) without building translation UI first.

### 9. Error handling

**Decision:** Let gateway/SDK errors propagate with message intact. Map common cases in step 5 (429 retry, 400 fail-fast). Step 4 script prints error and exits 1.

### 10. Server vs client boundary

**Decision:** All LLM code lives under `src/lib/llm/` and is imported only from server contexts (scripts, future Route Handlers, queue consumer). No `"use client"` imports of provider code.

## Risks / Trade-offs

- **[Gateway availability / model renames]** → Curated catalog in code; update ids when gateway deprecates models.
- **[Local dev without Vercel key]** → Document key setup in `.env.example`; script fails fast with clear message.
- **[Cost visibility]** → Return token usage now; aggregation in step 5 when translations persist.
- **[Gateway vs direct latency]** → Accept small routing overhead for unified billing and model access.
- **[Optional env keys]** → Startup no longer forces placeholder keys; reduces local friction.

## Migration Plan

1. Add `ai` dependency and `AI_GATEWAY_API_KEY` to env
2. Make legacy provider keys optional in `src/env.ts`
3. Implement LLM module + dev script
4. Update developer `.env` with gateway key from Vercel dashboard
5. Run `pnpm polish-slice` on a real MT sample before step 5

No database migration. Rollback: revert package and env changes; queue stub unchanged.

## Open Questions

1. **Default model for dev script:** Default to `openai/gpt-4o-mini` for cheap iteration or `openai/gpt-4o` for quality? → Default `openai/gpt-4o-mini` in CLI; Steven overrides with `--model`.
2. **BYOK through gateway:** Defer to v1.1; optional env keys reserved for future `providerOptions.gateway.byok`.
