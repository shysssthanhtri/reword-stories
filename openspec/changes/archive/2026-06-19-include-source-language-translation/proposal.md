## Why

Novels already capture a source language at creation, and the translation pipeline passes `sourceLanguage` into `polish()`, but the LLM user message never mentions it. Prompts hardcode English-only assumptions ("already-machine-translated English prose"), so the model lacks explicit context about the original language when rewording pasted chapter text. Output drifts to English even though this app rewords prose in the novel's original language — it is not a translate-to-English tool.

## What Changes

- Pass `sourceLanguage` into `buildPostEditUserMessage` so every LLM request states the novel's original language in the user message, not only optional system-prompt hints.
- Update system and user prompt copy to name the source language explicitly (human-readable label) and instruct the model to reword in that same language — not translate to another language.
- Reuse existing `SOURCE_LANGUAGES` / `getSourceLanguageLabel` for display names in prompts.

## Capabilities

### New Capabilities

_(none)_

### Modified Capabilities

- `llm-provider`: Post-edit prompt builders must include source language in both system and user messages, with updated scenarios for explicit language naming and rewording in the original language.

## Impact

- `src/lib/llm/prompts.ts` — prompt builder signatures and copy
- `src/lib/llm/gateway-provider.ts` — pass `sourceLanguage` to user message builder
- `scripts/polish-slice.ts` (if present) — align CLI with updated prompt API
- `openspec/specs/llm-provider/spec.md` — requirement updates via delta spec
