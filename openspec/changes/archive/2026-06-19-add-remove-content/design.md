## Context

The app supports creating novels, chapters, and translations via tRPC mutations and SSR pages, but has no delete path. The Prisma schema already defines `onDelete: Cascade` on all parent-child relations (`Novel → Chapter → Translation → TranslationChunk`), so hard deletes are safe without schema changes. The queue consumer in `process-translation-chunk.ts` already no-ops when a translation row is missing.

Delete actions need confirmation dialogs (destructive, irreversible) and must respect the async translation pipeline — users should not delete jobs that are actively running.

## Goals / Non-Goals

**Goals:**

- Add `novels.delete`, `chapters.delete`, and `translations.delete` tRPC mutations
- Cascade-delete descendants via Prisma (no manual child deletion)
- Block deletion of `QUEUED`/`PROCESSING` translations server-side; hide delete UI for those rows
- Add confirmed delete actions on novel detail, chapter detail, and translation list
- Navigate away and invalidate queries after successful deletes

**Non-Goals:**

- Soft delete / trash / undo
- Bulk delete (multi-select)
- Delete from library table rows (novel list stays read-only for delete; action lives on detail page)
- Cancelling in-flight queue messages (consumer already handles missing rows)
- Reordering `sortOrder` after chapter deletion

## Decisions

### 1. Hard delete via Prisma `delete` (not soft delete)

**Choice:** Use `db.novel.delete`, `db.chapter.delete`, `db.translation.delete` and rely on cascade.

**Rationale:** Single-user personal app; no audit/recovery requirement. Cascade is already configured. Simpler than adding `deletedAt` columns and filtering every query.

**Alternative considered:** Soft delete with `deletedAt` — rejected as over-engineering for v1.

### 2. Block in-flight translation deletion server-side

**Choice:** `translations.delete` checks `status` and returns `BAD_REQUEST` if `QUEUED` or `PROCESSING`. UI hides the delete button for those statuses.

**Rationale:** Prevents race with the queue consumer. Even if a stale message arrives after deletion, the consumer already returns early when the translation is missing — but blocking avoids confusing partial state while a job is running.

**Alternative considered:** Allow delete and let the consumer no-op — rejected because it could confuse users who delete then see transient processing updates.

### 3. Confirmation via shadcn `AlertDialog`

**Choice:** Each delete action opens an `AlertDialog` with explicit warning text about cascade scope. Confirm button uses `variant="destructive"`.

**Rationale:** Matches existing shadcn component library (`alert-dialog.tsx` already installed). Consistent with destructive-action UX patterns.

### 4. Client Component delete buttons colocated with headers/lists

**Choice:**

| Surface | Component | Server/Client |
|---------|-----------|---------------|
| Novel detail delete | New `DeleteNovelButton` client component | Client island in RSC page header |
| Chapter detail delete | New `DeleteChapterButton` client component | Client island in RSC page header |
| Translation delete | Extend existing `TranslationList` client component | Already `"use client"` |

**Rationale:** Pages remain RSC for initial data fetch. Only the interactive delete affordance is client-side, matching the existing pattern (`TranslationList`, `CreateNovelForm`).

**Post-delete navigation:**

- Novel delete → `router.push(routes.novels())` + `utils.novels.list.invalidate()`
- Chapter delete → `router.push(routes.novelDetail(novelId))` + `utils.chapters.list.invalidate({ novelId })`
- Translation delete → `utils.translations.listByChapter.invalidate({ chapterId })` (stay on page)

### 5. Reuse existing id input schemas

**Choice:** Add `novelIdInputSchema` in `novel.ts`, `chapterIdInputSchema` in `chapter.ts`, reuse `translationIdInputSchema` for `translations.delete`.

**Rationale:** Consistent with `getById`/`retry` patterns. Single `{ id: string }` Zod object per entity.

### 6. No queue cancellation on delete

**Choice:** Do not add queue message cancellation when deleting completed/failed translations or entire novels/chapters.

**Rationale:** Consumer already handles missing translation with early return (line 48–51 of `process-translation-chunk.ts`). In-flight translations are blocked from deletion. Orphaned messages for deleted completed jobs are harmless no-ops.

## Risks / Trade-offs

- **[Risk] User deletes novel while translation is processing** → Mitigated: deleting a novel cascades to translations; consumer no-ops on missing row. Brief window where queue may still fire but does nothing harmful.
- **[Risk] User expects undo** → Mitigated: confirmation dialog states permanence. Acceptable for personal-use v1.
- **[Risk] Chapter `sortOrder` gaps after delete** → Accepted: gaps do not affect display (`sortOrder + 1` label still works). Re-compaction deferred.
- **[Risk] Delete button placement clutters header** → Mitigated: use `variant="outline"` or ghost destructive styling, right-aligned in header row.

## Migration Plan

No database migration. Deploy as a single feature PR:

1. Add tRPC delete procedures and validation schemas
2. Add client delete components
3. Wire into existing RSC pages
4. Manual test: delete translation (completed/failed), delete chapter, delete novel; verify cascade and navigation

Rollback: revert the PR; no data migration to undo.

## Open Questions

None — scope is straightforward CRUD extension.
