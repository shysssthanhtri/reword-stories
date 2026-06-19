## Context

Init plan step 5 connects the existing pieces: Prisma schema (`Translation`, `TranslationChunk`), LLM adapter (`getProvider().polish()`), and a stub queue consumer at `src/app/api/queues/process-chunk/route.ts`. `vercel.json` already wires topic `translation-chunk` to that route with `maxDuration: 300`.

Steven needs to paste a chapter, pick **provider + model**, start a background job, and see progress without babysitting the page. Only the `gateway` provider exists today, but the UI and persistence use the provider registry so DeepL/Gemini direct adapters can register later without UI rewrites.

## Goals / Non-Goals

**Goals:**

- Chunk chapter text on translation create (~1800 tokens, paragraph then sentence boundaries)
- Process one chunk per queue message; chain until all chunks complete
- Persist progress (`progressPct`, chunk statuses, `tokenUsage`, assembled `polishedContent`)
- tRPC create/get/retry for translations
- Translate page with provider dropdown + model dropdown (models filtered by provider)
- Chapter detail shows translation list with live status polling while in-flight
- Idempotent consumer (skip completed chunks; safe on retry)

**Non-Goals:**

- Reader view (step 6)
- DeepL/Gemini direct provider adapters (step 7)
- Dollar cost estimate pre-flight (chunk count estimate only)
- Bulk "translate all chapters"
- Automated tests

## Decisions

### 1. Chunking module

**Decision:** `src/lib/chunking/split-chapter.ts` exports `splitIntoChunks(rawContent: string, maxTokens = 1800): string[]`.

Algorithm:
1. Split on `\n\n` paragraph boundaries
2. Greedily pack paragraphs into chunks until adding the next would exceed `maxTokens` (count via `gpt-tokenizer` `encode`)
3. If a single paragraph exceeds limit, split on `. ` sentence boundaries
4. Never split mid-word; if a single sentence still exceeds limit, hard-split at token boundary as last resort

**Rationale:** Matches init-plan pipeline; `gpt-tokenizer` aligns with OpenAI token counting used in planning docs.

**Alternative:** Character-based chunking — rejected; token limits are what matter for LLM context windows.

### 2. Queue topic and message shape

**Decision:** Topic `translation-chunk` (already in `vercel.json`). Payload: `{ translationId: string }`. Consumer finds next `PENDING` or `FAILED` chunk by lowest `chunkIndex`.

Chain with:
```typescript
await send("translation-chunk", { translationId }, {
  idempotencyKey: `${translationId}-${chunkIndex}`,
})
```

**Rationale:** One message = one LLM call, fits 300s limit. Idempotency key prevents duplicate processing on retry.

### 3. Queue kickoff helper

**Decision:** `src/lib/queue/translation-queue.ts` exports:
- `TRANSLATION_CHUNK_TOPIC = "translation-chunk"`
- `kickoffTranslation(translationId: string)` — sends initial message
- `chainNextChunk(translationId: string, chunkIndex: number)` — sends chain message with idempotency key

Used by tRPC `translations.create`, consumer after chunk success, and `translations.retry`.

**Rationale:** Centralizes topic name and idempotency convention.

### 4. Consumer implementation

**Decision:** Replace stub in `process-chunk/route.ts`:

1. Load translation with chapter → novel (for `sourceLanguage`), chunks
2. Find next chunk where `status IN (PENDING, FAILED)` ordered by `chunkIndex ASC`
3. If none: if all `COMPLETED`, assemble `polishedContent` and set `COMPLETED`; else no-op (idempotent)
4. Set translation `status = PROCESSING`
5. Build overlap: last paragraph (~500 tokens max) from previous `COMPLETED` chunk's `polishedSlice`
6. Call `getProvider(translation.provider).polish({ text: chunk.rawSlice, sourceLanguage, contextOverlap, modelId: translation.modelName })`
7. Save `polishedSlice`, `tokenCount`, mark chunk `COMPLETED`; increment `translation.tokenUsage`
8. Update `progressPct = round(completedCount / totalCount * 100)`
9. If more pending chunks → `chainNextChunk`; else assemble and set `COMPLETED`
10. On error: mark chunk `FAILED`, translation `FAILED` with `errorMessage`; rethrow for queue retry on transient errors

Export `maxDuration = 300` on the route segment config.

**Error handling:** Let 429/5xx propagate for Vercel Queue retry. Content-policy / 400 errors: catch, mark failed, return 200 (ack, no retry).

### 5. Assembling polished content

**Decision:** `src/lib/chunking/assemble-chunks.ts` concatenates completed `polishedSlice` values in `chunkIndex` order with `\n\n` between chunks.

**Rationale:** Chunks were split on paragraph boundaries; double newline preserves structure.

### 6. tRPC translations router

**Decision:** `src/server/routers/translations.ts`:

| Procedure | Type | Input | Behavior |
|-----------|------|-------|----------|
| `listProviders` | query | none | Returns `listProviders()` with id, label, models |
| `estimateChunks` | query | `{ chapterId }` | Runs chunking on chapter raw content, returns `{ chunkCount }` |
| `create` | mutation | `{ chapterId, provider, modelName }` | Validates provider/model, creates Translation + chunks in transaction, `kickoffTranslation`, returns translation id |
| `getById` | query | `{ id }` | Returns translation fields + chunk summary for polling |
| `listByChapter` | query | `{ chapterId }` | Returns translations for chapter (for detail page SSR) |
| `retry` | mutation | `{ id }` | Only when `FAILED`; reset failed chunks to `PENDING`, clear error, set `QUEUED`, kickoff |

Validation schema in `src/lib/validations/translation.ts`:
- `provider` — must match registered provider id
- `modelName` — must be in selected provider's `models` list

**Rationale:** tRPC matches existing novel/chapter patterns; `listProviders` feeds UI without hardcoding models client-side.

### 7. Translate page (SSR shell + client form)

**Decision:** Route `src/app/(app)/novels/(novel)/[novelId]/chapters/[chapterId]/translate/page.tsx` (RSC):
- Verify chapter exists and belongs to novel
- Pass `chapterId`, `novelId`, `characterCount` to client form

Client form `src/components/translations/create-translation-form.tsx`:
- Fetch providers via `translations.listProviders.useQuery()` (or pass from RSC via server caller — prefer client query for simplicity since it's static catalog data)
- **Provider** `<Select>` — options from `listProviders`
- **Model** `<Select>` — filtered to selected provider's `models`; reset model when provider changes; default to provider's first model or `DEFAULT_GATEWAY_MODEL_ID` for gateway
- Pre-flight: `translations.estimateChunks.useQuery({ chapterId })` shows "~N chunks"
- Submit: `translations.create.useMutation()` → redirect to chapter detail on success

**Rationale:** User explicitly requested provider + model choice. Two dropdowns are clearer than a flat model list when multiple providers exist.

### 8. Chapter detail translations section

**Decision:** RSC loads translations via `translations.listByChapter`. Renders `TranslationList` client component that:
- Shows each translation: provider label, model label, status badge, progress %, error message if failed
- **New Translation** button → translate page
- **Retry** button on failed rows (calls `translations.retry`)
- Polls `translations.getById` every 3s for any translation with status `QUEUED` or `PROCESSING`

Read button deferred (no reader until step 6); show disabled or omit.

Replace placeholder empty state with actionable **Start translation** link.

**Rationale:** SSR for initial list; client polling only for in-flight status per project rules.

### 9. Route config

**Decision:** Add `chapterTranslate: (novelId, chapterId) => /novels/${novelId}/chapters/${chapterId}/translate`

### 10. Local dev queue

**Decision:** Document that full queue flow requires Vercel dev or deployed environment. For local `next dev`, `@vercel/queue` supports `registerDevConsumer` — add optional dev registration in a separate `instrumentation.ts` or document manual testing on Vercel preview. Minimum: consumer code is correct; local polish already validated via `pnpm polish-slice`.

**Alternative:** PollingQueueClient in dev — defer unless needed; Steven can test on Vercel preview.

### 11. Server vs client boundaries

| Surface | Type |
|---------|------|
| Chapter detail page | RSC — initial translations via server caller |
| Translate page shell | RSC — chapter validation |
| Create translation form | Client — provider/model selects, submit |
| Translation list + polling | Client — status polling island |
| Queue consumer | Route Handler — server only |
| Chunking / queue helpers | Server modules — no client imports |

## Risks / Trade-offs

- **[Local queue not wired in `next dev`]** → Test on Vercel preview; document in tasks verification step
- **[Token count mismatch across models]** → Use `gpt-tokenizer` as approximation; chunks may vary slightly from provider billing
- **[Single provider in v1]** → UI still shows provider picker with one option; ready for step 7 adapters
- **[Failed mid-chapter leaves partial progress]** → Retry resets only `FAILED` chunks; completed chunks preserved
- **[LLM latency spikes]** → 300s visibility timeout + queue retry handles transient failures

## Migration Plan

1. Add `gpt-tokenizer` dependency
2. Implement chunking, queue helpers, consumer
3. Add translations router + validation
4. Add translate page + update chapter detail
5. Deploy to Vercel; verify end-to-end on a real chapter

No database migration. Rollback: revert code; in-flight translations may stall (manual retry after redeploy).

## Open Questions

1. **Dev consumer registration:** Add `instrumentation.ts` with `registerDevConsumer` in this change or defer? → Defer unless quick; verify on Vercel preview first.
2. **Show polished preview on chapter detail when complete?** → No; reader is step 6. Show status badge only.
