## Why

Init plan step 5 is the core async pipeline: without chunking, queue consumption, and progress tracking, Steven cannot polish novel-length chapters in the background. Steps 1–4 delivered schema, paste flow, and a working LLM adapter — now those pieces must connect so a user can start a translation job, leave the page, and return to completed prose.

## What Changes

- Add paragraph/sentence chunking (~1800 tokens) when a translation is created; persist `TranslationChunk` rows immediately for pre-flight estimates
- Implement `/api/queues/process-chunk` consumer: process one chunk via `getProvider().polish()`, update progress, chain next message or mark complete
- Add tRPC translation procedures: `create` (enqueue job), `getById` (status polling), `retry` (reset failed chunks and re-kick)
- Add translate page at `/novels/[id]/chapters/[chapterId]/translate` with **provider + model** pickers (model list filtered by selected provider), pre-flight chunk estimate, and start button
- Update chapter detail page to list translations with status badges and link to translate / read (read link deferred until reader step 6)
- Add client-side status polling (every 3s) while translation is `PROCESSING` or `QUEUED`
- Wire Vercel Queue kickoff on translation create and chunk chaining with idempotency keys
- Add chunk overlap context from previous completed chunk's last paragraph (max ~500 tokens)

**Out of scope:** reader view (step 6), DeepL/Gemini direct adapters (step 7), bulk "translate all chapters", cost pre-flight dollar estimate

## Capabilities

### New Capabilities

- `translation-queue`: Chunking algorithm, Vercel Queue kickoff/chaining, `/api/queues/process-chunk` consumer, progress assembly, retry semantics
- `translation-crud`: tRPC create/get/retry for translations, provider+model selection UI, status polling on chapter detail

### Modified Capabilities

- `trpc-api`: New `translations` router registered on `AppRouter`
- `chapter-crud`: Chapter detail page shows real translation list instead of placeholder

## Impact

- **New files:** `src/lib/chunking/**`, `src/lib/queue/**`, `src/server/routers/translations.ts`, `src/lib/validations/translation.ts`, translate page + form components, translation status badge component
- **Modified files:** `src/app/api/queues/process-chunk/route.ts`, chapter detail page, `src/server/trpc/router.ts`, `src/configs/routes/index.ts`
- **Dependencies:** `gpt-tokenizer` (chunk token counting), `@vercel/queue` `send()` for message publish (already installed)
- **Database:** No schema migration — uses existing `Translation` and `TranslationChunk` models
- **Infrastructure:** `vercel.json` queue trigger already configured for topic `translation-chunk`
