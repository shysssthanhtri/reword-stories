## Context

The translation pipeline already loads `novel.sourceLanguage` in `polishChunkStep` and passes it to `TranslationProvider.polish()`. The gateway provider forwards it only to `buildPostEditSystemPrompt`, which adds optional MT artifact hints for `ko`, `ja`, `zh`, and `vi`.

`buildPostEditUserMessage` ignores source language entirely. Both prompts assume English MT input/output ("Rewrite … into smooth English prose"), so the model never receives an explicit original-language instruction in the user turn. Steven pastes rough text in the novel's original language and expects reworded output in that same language — not translation to English.

No UI, database, or workflow changes are required — this is a server-side prompt fix in `src/lib/llm/`.

## Goals / Non-Goals

**Goals:**

- Name the novel's original language in every LLM request (system + user messages)
- Instruct the model to reword in that same language (post-edit, not translate)
- Reuse existing `getSourceLanguageLabel()` for human-readable language names
- Keep the `PolishParams` interface unchanged (`sourceLanguage` already present)

**Non-Goals:**

- Target language selection (output language is always the novel's original language)
- Schema or UI changes to novel creation
- Detecting input language automatically from text
- Re-translating completed chapters (users retry manually)

## Decisions

### 1. Extend `buildPostEditUserMessage` signature

**Decision:** Add required `sourceLanguage: string` as the second parameter (before optional `contextOverlap`).

```typescript
buildPostEditUserMessage(text, sourceLanguage, contextOverlap?)
```

**Rationale:** Keeps language context co-located with the passage being polished. The gateway provider already has `params.sourceLanguage`; no new data plumbing.

**Alternative:** Embed language only in the system prompt — rejected; user message is where the task and passage live, and the current gap is exactly that the user turn omits language.

### 2. Human-readable labels in prompts

**Decision:** Call `getSourceLanguageLabel(sourceLanguage)` inside prompt builders for display strings ("Korean", "Japanese", …). For `other`, user message uses phrasing like "its original language" without inventing a name.

**Rationale:** Models respond better to full language names than ISO-ish codes (`ko`). Labels already exist for the UI.

### 3. Reword in original language, not translate

**Decision:** Update system and user prompt copy to:

- State the original language when known (via existing hints + explicit naming)
- Instruct rewording/post-editing in that language
- Explicitly forbid translation to another language

**Rationale:** Matches product intent — Steven rewords awkward MT or rough prose in the language he's reading, not converting to English.

**Alternative:** Translate to English — rejected; user confirmed this is a reword app, not a translation app.

### 4. No workflow or provider interface changes

**Decision:** Only edit `prompts.ts` and the single call site in `gateway-provider.ts`. Update `scripts/polish-slice.ts` if it calls `buildPostEditUserMessage` directly.

**Rationale:** `translation-job.ts` already passes `sourceLanguage`; no server/client boundary changes.

## Risks / Trade-offs

- **[Risk] Model still drifts to English on weak instruction** → Mitigation: repeat "stay in {language}, do not translate" in both system and user messages.
- **[Risk] `other` novels still lack specific hints** → Mitigation: generic "same language as input" wording; Steven can pick a specific language when known.
- **[Risk] Existing in-flight jobs use old prompts until retry** → Mitigation: acceptable; no migration needed.

## Migration Plan

Deploy as a code-only change. New translations and retries pick up updated prompts automatically. No database migration or env changes.

## Open Questions

- None for v1.
