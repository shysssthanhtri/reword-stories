## 1. Prompt builders

- [x] 1.1 Update `buildPostEditSystemPrompt` in `src/lib/llm/prompts.ts` to name the original language (via `getSourceLanguageLabel`) and instruct translate/reword to smooth English while preserving meaning, plot, and names
- [x] 1.2 Add required `sourceLanguage` parameter to `buildPostEditUserMessage` and include explicit original-language + English-target instructions in the user message (generic wording for `other`)
- [x] 1.3 Keep overlap-context block unchanged; ensure it still precedes the main passage block when `contextOverlap` is provided

## 2. Provider wiring

- [x] 2.1 Pass `params.sourceLanguage` to `buildPostEditUserMessage` in `src/lib/llm/gateway-provider.ts`
- [x] 2.2 Search for other `buildPostEditUserMessage` call sites and update signatures if any exist

## 3. Verification

- [x] 3.1 Run `pnpm lint` and fix any issues
- [x] 3.2 Run `pnpm typecheck` (or `tsc --noEmit`) and confirm clean build
- [x] 3.3 Manually spot-check prompt output for `ko` and `other` source languages (log or temporary script) to confirm both system and user messages name language context and require English output
