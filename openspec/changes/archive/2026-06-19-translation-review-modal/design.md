## Context

The chapter detail page renders `TranslationList`, a Client Component that displays translation job metadata (provider, model, status, progress, error) and polls `translations.listByChapter` while jobs are in flight. `translations.getById` already returns the full Translation row including `polishedContent`, but nothing in the UI surfaces it. The immersive reader at `/read/[translationId]` is planned for end-user reading; content managers need a lightweight preview on the chapter detail page without navigating away.

Existing primitives: shadcn `Dialog` (`src/components/ui/dialog.tsx`), tRPC client hooks, `TranslationStatusBadge`.

## Goals / Non-Goals

**Goals:**

- Click a translation list item to open a modal showing the polished result (when available)
- Lazy-load `polishedContent` via `translations.getById` on modal open so the list query stays lightweight
- Present readable, scrollable prose in the modal with provider/model context in the header
- Handle non-completed statuses gracefully (queued, processing, failed)
- Keep retry button functional without accidentally opening the modal

**Non-Goals:**

- Side-by-side raw MT vs polished comparison (v1.5)
- Reader themes, font size, or sepia/dark mode in the modal
- Inline editing or re-run from the modal
- Partial/in-progress text preview from assembled chunks
- Opening review from routes other than chapter detail

## Decisions

### 1. Lazy fetch via `getById` on modal open

**Choice:** When the user clicks a translation row, set `selectedTranslationId` state and enable `translations.getById` with `{ enabled: !!selectedTranslationId }`. Display `polishedContent` when status is `COMPLETED`.

**Alternatives considered:**

- *Include `polishedContent` in `listByChapter`* — simple but sends up to 100k chars per translation on every poll (every 3s while processing); wasteful.
- *Dedicated `getContent` procedure* — unnecessary; `getById` already returns the field.

**Rationale:** On-demand fetch matches SSR-first data discipline and keeps polling payloads small.

### 2. Slim `listByChapter` Prisma select

**Choice:** Change `findMany` to an explicit `select` excluding `polishedContent`:

```typescript
select: {
  id: true,
  provider: true,
  modelName: true,
  status: true,
  progressPct: true,
  errorMessage: true,
  tokenUsage: true,
  chapterId: true,
  createdAt: true,
  updatedAt: true,
}
```

**Rationale:** List is polled frequently; content belongs in the review modal only.

### 3. Modal UX with shadcn Dialog

**Choice:** Extract `TranslationReviewModal` as a Client Component controlled by `open` + `translationId` props from `TranslationList`. Structure:

| Piece | Type |
|-------|------|
| `TranslationList` | Client Component — owns `selectedId` state, row click handler |
| `TranslationReviewModal` | Client Component — Dialog shell, fetches via `getById`, renders content |
| Chapter detail page | Server Component (unchanged) — passes initial list data |

**Row interaction:**

- Entire `<li>` is clickable (`cursor-pointer`, hover affordance) except interactive children (Retry button uses `e.stopPropagation()`)
- Dialog title: `{providerLabel} · {modelLabel}`
- Dialog description: status badge + started timestamp
- Body: scrollable `max-h-[60vh]` prose area with `whitespace-pre-wrap` for paragraph breaks

**Status-specific body:**

| Status | Body content |
|--------|-------------|
| `COMPLETED` | Full `polishedContent` text |
| `QUEUED` | "Translation is queued and has not started yet." |
| `PROCESSING` | "Translation in progress ({progressPct}%). Check back when complete." |
| `FAILED` | Error message + note that retry is available on the list |

**Alternatives considered:**

- *Separate "Review" link/button* — extra click; user asked for row click.
- *Sheet/drawer instead of dialog* — dialog is sufficient for preview; matches shadcn patterns already in project.

### 4. No new tRPC procedures

**Choice:** Reuse `translations.getById`; document that it returns `polishedContent` for review use.

**Rationale:** Zero API surface expansion; existing polling already uses this shape.

## Risks / Trade-offs

| Risk | Mitigation |
|------|------------|
| Large chapter text (up to 100k chars) may feel slow on first modal open | Acceptable for single-user v1; content fetched once per open, cached by React Query |
| Clicking Retry accidentally opens modal | `stopPropagation` on Retry button |
| Processing jobs show no partial text | Explicit messaging; partial preview deferred to avoid chunk-assembly complexity |
| Modal prose styling differs from reader | Intentional — review is utilitarian; reader gets immersive treatment later |

## Migration Plan

No migration. Deploy as a UI + query-select change. Rollback: revert component and router select changes.

## Open Questions

_(none — scope is clear for v1)_
