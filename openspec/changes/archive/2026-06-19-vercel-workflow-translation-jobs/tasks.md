## 1. Workflow SDK setup

- [x] 1.1 Add `workflow` dependency to `package.json`
- [x] 1.2 Wrap `next.config.ts` with `withWorkflow()` from `workflow/next`
- [x] 1.3 Update `vercel.json`: remove queue trigger for `translation-chunk`; set `maxDuration: 300` on workflow step routes as required by WDK

## 2. Translation job workflow

- [x] 2.1 Create `src/workflows/translation-job.ts` with `translationJob` (`"use workflow"`) orchestration loop
- [x] 2.2 Implement `isGlobalJobSlotAvailable` step — true when no other translation is `PROCESSING`
- [x] 2.3 Add global wait loop: `while (!available) await sleep("10s")` before acquiring slot
- [x] 2.4 Implement `markTranslationProcessing` step — translation → `PROCESSING`, clear `errorMessage`
- [x] 2.5 Implement `loadChunksForJob` step — return chunks ordered by `chunkIndex`
- [x] 2.6 Implement `polishChunkStep` — overlap, LLM call, chunk → `COMPLETED`, update `progressPct`/`tokenUsage`; on error chunk → `FAILED` + `FatalError`
- [x] 2.7 Implement `finalizeTranslationStep` — assemble `polishedContent`, translation → `COMPLETED`
- [x] 2.8 Implement `failTranslationStep` — translation → `FAILED` with error message
- [x] 2.9 Add in-job rate limit: `await sleep("60s")` in workflow after every 3 successful polish steps
- [x] 2.10 Create `src/lib/workflow/start-translation-job.ts` wrapping `start(translationJob, [translationId])`

## 3. Remove queue infrastructure

- [x] 3.1 Delete `src/lib/queue/translation-queue.ts`, `predecessor-not-ready-error.ts`, and `src/app/api/queues/process-chunk/route.ts`
- [x] 3.2 Remove or refactor `src/lib/queue/process-translation-chunk.ts` — logic moved to workflow steps
- [x] 3.3 Remove `@vercel/queue` dependency if no longer referenced
- [x] 3.4 Update log prefix usage to `[translation-job]` (or rename shared constant)

## 4. tRPC mutations

- [x] 4.1 Update `translations.create` to call `startTranslationJob` after create transaction
- [x] 4.2 Update `translations.retry` to call `startTranslationJob` after resetting failed chunks
- [x] 4.3 Update `translations.retryChunk` to call `startTranslationJob`; reject when `status = PROCESSING`
- [x] 4.4 Remove all imports of queue helpers from `translations.ts`

## 5. Documentation and verification

- [x] 5.1 Rewrite README Translation queue section → Translation workflow jobs (diagram + logs + debugging)
- [x] 5.2 Run `pnpm lint` and `pnpm build`
- [ ] 5.3 Manual verify on Vercel preview: create 4+ chunk translation, confirm sequential processing, rate-limit pause before chunk 4, fail-fast on error; create second translation while first runs and confirm second stays `QUEUED` until first completes
- [x] 5.4 Note in `per-chunk-queue-messages` change that it is superseded by this change (optional archive comment)
