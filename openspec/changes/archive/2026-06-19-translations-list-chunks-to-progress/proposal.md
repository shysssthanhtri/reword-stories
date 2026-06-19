## Why

The chapter detail translation list currently shows a collapsible per-chunk table under every translation row. That detail is useful for debugging failures but clutters the default list view where users mainly need to see whether a job is moving forward. A progress bar with the existing `progressPct` rollup gives a cleaner at-a-glance status while chunk-level detail remains available in the review modal.

## What Changes

- Replace the collapsible chunk table in `TranslationList` with a progress indicator (bar + percentage) for translations in `QUEUED`, `PROCESSING`, or `FAILED` states.
- Remove per-chunk retry controls from the list row; keep translation-level **Retry all** for failed jobs.
- Stop including chunk summaries in `translations.listByChapter` since the list UI no longer consumes them (chunk data stays on `translations.getById` for the review modal).
- Update polling scenario wording: list refreshes `progressPct` while in-flight, not per-chunk rows.
- Leave `retryChunk`, chunk retry in the review modal, and backend chunk processing unchanged.

## Capabilities

### New Capabilities

_None._

### Modified Capabilities

- `translation-crud`: Translation list UI shows progress instead of chunk rows; `listByChapter` omits chunk summaries; polling and list interaction requirements updated accordingly.

## Impact

- **UI**: `translation-list.tsx` — remove `TranslationChunkList`, add `Progress` component; simplify list-row click/retry state.
- **API**: `src/server/routers/translations.ts` — remove `chunks` from `listByChapter` select.
- **Unchanged**: `translation-chunk-list.tsx` (still used by review modal), `retryChunk` mutation, queue/workflow pipeline, `getById` chunk summaries.
