## 1. Dependencies and env

- [x] 1.1 Add `ai` runtime dependency and `tsx` dev dependency
- [x] 1.2 Update `src/env.ts`: require `AI_GATEWAY_API_KEY`; make `OPENAI_API_KEY`, `GEMINI_API_KEY`, `DEEPL_API_KEY` optional
- [x] 1.3 Update `.env.example` with `AI_GATEWAY_API_KEY` and mark direct provider keys as optional

## 2. LLM module core

- [x] 2.1 Create `src/lib/llm/types.ts` with `TranslationProvider`, `PolishParams`, and `PolishResult` types
- [x] 2.2 Create `src/lib/llm/prompts.ts` with `buildPostEditSystemPrompt(sourceLanguage)` and user-message builder supporting `contextOverlap`
- [x] 2.3 Create `src/lib/llm/models.ts` with curated gateway model catalog (`openai/gpt-4o`, `openai/gpt-4o-mini`, `anthropic/claude-sonnet-4.6`)
- [x] 2.4 Create `src/lib/llm/gateway-provider.ts` implementing `TranslationProvider` via `generateText` and AI Gateway auth
- [x] 2.5 Create `src/lib/llm/providers.ts` registry exporting `getProvider` and `listProviders`

## 3. Dev polish script

- [x] 3.1 Create `scripts/polish-slice.ts` — read stdin/file, parse `--model` and `--source-language`, call gateway provider, print result
- [x] 3.2 Add `polish-slice` script to `package.json` (`tsx scripts/polish-slice.ts`)
- [x] 3.3 Verify script runs locally with a sample MT paragraph (document gateway key requirement if blocked)

## 4. Verification

- [x] 4.1 Run `pnpm lint && pnpm typecheck`
- [x] 4.2 Run `pnpm build` and confirm no env validation regressions with updated `.env`
