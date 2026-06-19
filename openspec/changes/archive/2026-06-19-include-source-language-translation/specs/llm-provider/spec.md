## MODIFIED Requirements

### Requirement: Post-edit system prompt

The application SHALL define prompt builders in `src/lib/llm/prompts.ts`:

- `buildPostEditSystemPrompt(sourceLanguage)` — system message instructing the model to reword (not translate) novel prose in the novel's original language. The prompt SHALL preserve meaning, plot, and proper names; fix awkward machine-translation phrasing; and not summarize or omit content.
- `buildPostEditUserMessage(text, sourceLanguage, contextOverlap?)` — user message that explicitly states the original language (human-readable label from `getSourceLanguageLabel`) and asks the model to reword the passage in that same language.

The system prompt builder SHALL accept `sourceLanguage` (`ko` | `ja` | `zh` | `vi` | `other`) and include language-specific context hints for `ko`, `ja`, `zh`, and `vi`; for `other`, it SHALL use a generic instruction that names no specific language but requires output in the same language as the input.

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
