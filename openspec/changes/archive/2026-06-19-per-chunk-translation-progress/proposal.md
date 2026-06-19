## Why

Long chapter translations are processed as multiple queue chunks, but the chapter detail list only shows a single overall progress percentage and a translation-level retry. When a job fails partway through—or stalls on one segment—users cannot see which chunk is stuck or retry just that segment without re-running the entire translation.

## What Changes

- Expand each translation row in the chapter detail list to show per-chunk status (index, status badge, and progress indicator) instead of only the aggregate `progressPct`.
- Add per-chunk **Retry** for failed chunks; keep translation-level retry as a convenience action that retries all failed chunks.
- Extend `translations.listByChapter` (and `translations.getById` for the review modal) to include chunk summaries needed by the UI.
- Add `translations.retryChunk` mutation to reset a single failed chunk and re-kick the queue from that chunk.
- Store chunk-level error messages when a chunk fails so the list can show which chunk broke and why.
- Update polling so in-flight translations refresh chunk rows while any chunk is `PENDING` or a sibling chunk is actively processing.

## Capabilities

### New Capabilities

- `chunk-retry`: Per-chunk retry API, queue kickoff semantics, and UI actions for failed chunks.

### Modified Capabilities

- `translation-crud`: Translation list and review modal show per-chunk progress; list response includes chunk summaries; polling and retry UX updated.
- `data-model`: `TranslationChunk` gains optional `errorMessage` for per-chunk failure display.
- `trpc-api`: Translations router adds `retryChunk` procedure.

## Impact

- **UI**: `translation-list.tsx`, new chunk row/status components, `translation-review-modal.tsx`, `translation-status-badge.tsx` (or sibling chunk badge).
- **API**: `src/server/routers/translations.ts` — extend `listByChapter` / `getById`, add `retryChunk`.
- **Queue**: `process-translation-chunk.ts` — persist chunk `errorMessage` on failure; clear on retry/start.
- **Schema**: Prisma migration adding `error_message` to `translation_chunks`.
- **Validation**: `src/lib/validations/translation.ts` — input schema for chunk retry.
