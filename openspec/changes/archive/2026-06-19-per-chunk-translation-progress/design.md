## Context

Translations are processed sequentially as `TranslationChunk` rows via Vercel Queues. The queue consumer already tracks per-chunk `status` (`PENDING`, `COMPLETED`, `FAILED`) and rolls up `progressPct` on the parent `Translation`, but the chapter detail UI only surfaces aggregate progress on `TranslationStatusBadge` and a translation-level **Retry** when the whole job fails.

Chunk failures currently copy the error onto `Translation.errorMessage` only; chunk rows have no `errorMessage`. The list polls `listByChapter` every 3s but the query does not return chunk data, so the UI cannot render per-chunk state without API changes.

## Goals / Non-Goals

**Goals:**

- Show each chunk's status inline under its parent translation on the chapter detail list.
- Allow retrying a single failed chunk without resetting completed chunks.
- Keep translation-level **Retry all** for the existing "whole job failed" flow.
- Preserve SSR-first: initial list still server-fetched; polling stays client-side on `listByChapter`.
- Store chunk-level errors for display next to the failing segment.

**Non-Goals:**

- Re-chunking or editing raw slices after creation.
- Parallel chunk processing (still one chunk at a time per translation).
- Per-chunk polished text preview in the list (modal/detail only for full content).
- Reader view changes.

## Decisions

### 1. Add `errorMessage` to `TranslationChunk`

**Choice:** Nullable `errorMessage` column on `translation_chunks`, set in the queue consumer on failure and cleared on retry/start.

**Alternatives:** Reuse translation-level `errorMessage` only — rejected because partial failures cannot attribute errors to a specific chunk once multiple chunks exist.

### 2. Extend `listByChapter` with lightweight chunk summaries

**Choice:** Include `chunks: { id, chunkIndex, status, errorMessage }[]` ordered by `chunkIndex` in `listByChapter`. Omit `rawSlice` / `polishedSlice` to keep payloads small.

**Alternatives:** Separate `translations.listChunks` query — rejected as extra round-trips during polling; list already refetches every 3s.

`getById` continues to return full translation fields plus the same chunk summary array (and `polishedContent` when complete).

### 3. New `retryChunk` mutation

**Choice:** `translations.retryChunk({ translationId, chunkId })` validates ownership and `FAILED` status, then in a transaction:

1. Set chunk `status = PENDING`, `errorMessage = null`
2. Set translation `status = QUEUED`, `errorMessage = null` (translation may have been `FAILED` or stuck `PROCESSING`)
3. Call existing `kickoffTranslation(translationId)`

The consumer already picks the lowest-index `PENDING | FAILED` chunk, so a single-chunk retry slots into the existing pipeline without queue schema changes.

**Alternatives:** Targeted queue message with `chunkIndex` — unnecessary; consumer already resolves next work item.

Keep `translations.retry` as **Retry all**: reset all `FAILED` chunks (unchanged semantics).

### 4. UI components

**Choice:**

- New `ChunkStatusBadge` (or extend badge with `ChunkStatus`) mapping `PENDING → Pending`, `COMPLETED → Done`, `FAILED → Failed`.
- `TranslationList` renders a nested `<ul>` of chunk rows under each translation card: `Chunk {n}` label (1-based), badge, truncated error, per-chunk Retry when `FAILED`.
- Translation header keeps overall `TranslationStatusBadge` with `progressPct` for at-a-glance rollup.
- `TranslationReviewModal` shows the same chunk list in the body for in-flight/failed states.

Chunk action buttons use `event.stopPropagation()` like the existing translation retry.

**Alternatives:** Collapsible accordion per translation — deferred; inline list is simpler for typical chapter sizes (~3–15 chunks).

### 5. Polling unchanged in mechanism, richer in data

**Choice:** Keep `refetchInterval: 3000` on `listByChapter` when any translation is `QUEUED` or `PROCESSING`. No new polling endpoint.

**Rationale:** One query now carries chunk state; avoids N+1 `getById` calls per translation.

### 6. Queue consumer tweaks

On chunk failure, persist `errorMessage` on the chunk row (in addition to translation-level message).

When processing starts for a chunk, clear that chunk's `errorMessage` (already sets translation `errorMessage = null`).

If a translation has some `COMPLETED` and one `FAILED` chunk, translation status becomes `FAILED` but completed chunks remain — UI shows mixed states; **Retry all** resets only failed chunks (existing behavior).

## Risks / Trade-offs

- **[Larger list payloads]** → Chunk summaries are small (4 fields × ~10 chunks); acceptable for personal-use scale.
- **[Translation status vs chunk status mismatch]** → Translation may show `FAILED` while most chunks are `COMPLETED`; mitigated by per-chunk rows and single-chunk retry.
- **[Retry during active processing]** → `retryChunk` only allowed for `FAILED` chunks; consumer idempotency unchanged.
- **[Migration on production]** → Additive nullable column; safe deploy before code.

## Migration Plan

1. Add Prisma migration: `error_message TEXT NULL` on `translation_chunks`.
2. Deploy migration + API changes together.
3. No backfill required; existing failed chunks show status without message until next failure.

Rollback: revert app code; column can remain unused.

## Open Questions

- None blocking implementation. Optional follow-up: highlight the actively processing chunk (infer as lowest-index `PENDING` while translation is `PROCESSING`).
