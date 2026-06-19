## Context

The chapter detail `TranslationList` currently renders a collapsible `TranslationChunkList` under each translation card, showing per-chunk status, errors, and retry buttons. This was added in the per-chunk progress change. The backend already maintains `progressPct` on the parent `Translation` row (updated by the workflow consumer as chunks complete), and `TranslationStatusBadge` already shows the percentage for `PROCESSING` jobs.

The list polls `translations.listByChapter` every 3s while any translation is in-flight. That query currently includes a `chunks` summary array used only by the list UI. The review modal fetches full detail via `translations.getById`, which also returns chunk summaries for in-flight/failed states.

## Goals / Non-Goals

**Goals:**

- Replace the chunk table in the translation list with a progress bar bound to `progressPct`.
- Show translation-level error text on failed rows.
- Slim down `listByChapter` by dropping unused chunk data.
- Preserve chunk-level detail and per-chunk retry via the review modal for failed translations.

**Non-Goals:**

- Removing `retryChunk`, chunk schema, or workflow chunk processing.
- Changing how `progressPct` is computed server-side.
- Adding a new API endpoint or client-side progress derivation from chunks.
- Reader view or translate-page changes.

## Decisions

### 1. Use existing `progressPct` — do not derive from chunks in the list

**Choice:** Bind the list progress bar directly to `translation.progressPct` from `listByChapter`.

**Alternatives:** Compute `(completedChunks / totalChunks) * 100` client-side from a chunks array — rejected because it duplicates server logic and requires keeping chunks in the list payload.

**Rationale:** The workflow already updates `progressPct` after each chunk; polling refreshes the value.

### 2. New `TranslationProgress` component

**Choice:** Add `src/components/translations/translation-progress.tsx` wrapping shadcn `Progress`, optional label, and percentage value. Render only when status is `QUEUED`, `PROCESSING`, or `FAILED`.

**Alternatives:** Inline Progress in `translation-list.tsx` — acceptable but a dedicated component keeps the list file focused and matches the pattern of `TranslationStatusBadge`.

### 3. Remove chunks from `listByChapter` select

**Choice:** Drop the `chunks` relation from `translationListSelect` in `translations.ts`. The `TranslationListItem` type (inferred from router output) updates automatically.

**Alternatives:** Keep chunks in API for future use — rejected; unused payload on every poll.

`getById` keeps chunk summaries for the review modal.

### 4. Simplify list client state

**Choice:** Remove `retryChunk` mutation, `retryingChunkId` state, and `TranslationChunkList` import from `translation-list.tsx`. Keep `retryTranslation` (Retry all) and `deleteTranslation`.

Per-chunk retry remains in `translation-review-modal.tsx` via `getById`.

### 5. Failed row UX — open modal for chunk detail

**Choice:** Make `FAILED` translation rows clickable (same pointer/hover affordance as `COMPLETED`) so users can open the review modal for chunk-level errors and per-chunk retry after the chunk table is removed from the list.

**Alternatives:** Add a separate "View details" button — rejected as redundant with row click.

`QUEUED` and `PROCESSING` rows remain non-clickable; progress bar is sufficient for in-flight status.

### 6. Server/client boundary unchanged

**Choice:** Chapter detail page remains an RSC that server-fetches `listByChapter`. `TranslationList` stays a Client Component for polling and modal state. No new client-side data fetching for initial render.

## Risks / Trade-offs

- **[Less inline failure detail]** → Mitigated by making failed rows open the review modal with full chunk table.
- **[progressPct stale briefly]** → Same as before; 3s polling covers in-flight updates.
- **[Type breakage in list]** → Removing `chunks` from list response may break components that reference `translation.chunks`; scope is limited to `translation-list.tsx`.

## Migration Plan

1. Update `translationListSelect` to omit chunks.
2. Replace chunk list with progress component in `TranslationList`.
3. Enable row click for `FAILED` status.
4. Deploy as a single UI + API slimming change; no database migration.

Rollback: revert component and re-add chunks to list select.

## Open Questions

- None blocking. Optional follow-up: animate progress bar transitions on poll updates.
