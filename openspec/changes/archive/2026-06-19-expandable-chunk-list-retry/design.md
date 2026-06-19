## Context

Per-chunk progress was recently added to the chapter detail translation list (`TranslationList` + `TranslationChunkList`). Chunks render inline under every translation row, the entire row is clickable (opens `TranslationReviewModal` for any status), and `translations.retryChunk` rejects non-`FAILED` chunks. The project already ships shadcn `Collapsible` (`src/components/ui/collapsible.tsx`) and an idempotent queue consumer that processes the lowest-index `PENDING | FAILED` chunk.

## Goals / Non-Goals

**Goals:**

- Collapse chunk lists by default; user expands to inspect per-chunk status.
- Open the review modal only from completed translations (the only state with readable polished output).
- Allow retry on any chunk status so users can re-run completed segments without restarting the whole translation.
- Relax `retryChunk` backend validation and reset semantics accordingly.

**Non-Goals:**

- Changing translation-level **Retry all** (still failed-chunks only).
- Adding chunk-level `PROCESSING` status or live "currently processing" indicator beyond existing badges.
- Auto-expanding chunk list while a translation is in flight.
- Reader view or `polishedContent` assembly algorithm changes beyond re-finalization after retry.

## Decisions

### 1. Collapsible chunk list with collapsed default

**Choice:** Wrap `TranslationChunkList` in shadcn `Collapsible` inside each translation row. A **Show chunks (N)** / **Hide chunks** trigger sits between the header and chunk rows. Default `open={false}`.

**Rationale:** Long chapters can have dozens of chunks; collapsed default keeps the list scannable. Reuses existing `Collapsible` primitive; no new dependency.

**Alternative considered:** Accordion at translation-list level — rejected; per-translation expand is sufficient.

**Client boundary:** `TranslationList` is already a Client Component; collapsible state is local per row (`useState` or uncontrolled `Collapsible`).

### 2. Modal open gated on `COMPLETED` status

**Choice:** Translation row `onClick` sets `selectedTranslationId` only when `translation.status === "COMPLETED"`. Remove `cursor-pointer` and hover affordance when not completed. Action buttons (retry, delete, expand toggle) use `stopPropagation` as today.

**Rationale:** Modal's primary value is reading `polishedContent`. Opening it for queued/processing/failed states duplicates inline chunk info without adding value.

**Alternative considered:** Disable click but keep pointer cursor with tooltip — rejected for simplicity; non-clickable rows use default cursor.

### 3. Per-chunk Retry visible for all chunk statuses

**Choice:** Show **Retry** on every chunk row regardless of `PENDING`, `COMPLETED`, or `FAILED`. Label stays **Retry** (not "Re-run").

**Rationale:** Matches user request to retry "despite done." Failed-only guard was an artificial limitation.

### 4. Relax `retryChunk` mutation

**Choice:** Remove the `chunk.status !== "FAILED"` BAD_REQUEST guard. On success, always:

1. Set chunk `status = PENDING`, `errorMessage = null`, `polishedSlice = null`, `tokenCount = null`.
2. Set translation `status = QUEUED`, `errorMessage = null`. If translation was `COMPLETED`, also set `polishedContent = null` and `progressPct` to reflect incomplete work (recompute from chunk counts or set below 100).
3. Call `kickoffTranslation(translationId)`.

**Rationale:** Consumer already selects next `PENDING | FAILED` chunk by index. Resetting a `COMPLETED` chunk to `PENDING` re-enters it into the pipeline. Clearing `polishedSlice` avoids stale assembly.

**Alternative considered:** Separate `reprocessChunk` mutation — rejected; same semantics, more surface area.

**Edge case — retry while translation is `PROCESSING`:** Allowed. Resetting one chunk to `PENDING` and re-kicking is safe; consumer is idempotent. Translation status moves to `QUEUED` then `PROCESSING` when consumer runs.

### 5. Review modal retry alignment

**Choice:** Update `TranslationReviewModal` chunk list to show per-chunk Retry for all statuses (same as list), since modal is only reachable for completed translations today but chunk retry inside modal should stay consistent if opened.

**Rationale:** Single `TranslationChunkList` component with `showRetry` controls both surfaces.

## Risks / Trade-offs

- **[Re-processing completed chunk invalidates polished output]** → Clearing `polishedContent` and chunk `polishedSlice` until re-assembly; translation badge shows in-flight again. User expects re-run behavior.
- **[Retry on pending chunk during active processing]** → Extra queue message is harmless; consumer skips completed chunks.
- **[Collapsed chunks hide errors]** → Failed translation still shows **Retry all** at row level; user expands to see per-chunk errors. Consider auto-expand when translation is `FAILED` — deferred unless requested.
- **[Click affordance confusion]** → Non-completed rows lose hover/pointer styling to signal they are not openable.

## Migration Plan

1. Ship API change first (backward compatible — strictly more permissive).
2. Ship UI changes in same deploy.
3. No database migration required.
4. Rollback: revert UI gating and re-add FAILED-only guard on `retryChunk`.

## Open Questions

- Should failed translations auto-expand the chunk list? **Default: no** (keep collapsed-by-default consistent); easy follow-up if Steven wants it.
