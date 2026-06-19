## Why

Users can create novels, chapters, and translations but cannot remove them. Mistakes (wrong paste, duplicate chapter, bad translation run) accumulate with no way to clean up the library. Deletion is a basic content-management gap that blocks confident experimentation with the paste-and-translate workflow.

## What Changes

- Add `novels.delete`, `chapters.delete`, and `translations.delete` tRPC mutations with NOT_FOUND handling and cascade cleanup via existing Prisma relations
- Block deletion of in-flight translations (`QUEUED` or `PROCESSING`) with a clear BAD_REQUEST error
- Add confirmation dialogs before destructive actions (shadcn `AlertDialog`)
- Add delete actions in the UI:
  - Novel detail page — delete novel (redirects to `/novels`)
  - Chapter detail page — delete chapter (redirects to novel detail)
  - Translation list on chapter detail — delete individual translation
- Invalidate relevant tRPC queries and navigate away after successful deletes

## Capabilities

### New Capabilities

_None — deletion extends existing CRUD capabilities._

### Modified Capabilities

- `novel-crud`: Add `novels.delete` procedure and delete-novel UI on the novel detail page
- `chapter-crud`: Add `chapters.delete` procedure and delete-chapter UI on the chapter detail page
- `translation-crud`: Add `translations.delete` procedure, in-flight guard, and delete action on translation list rows
- `trpc-api`: Register new delete procedures on the novels, chapters, and translations routers

## Impact

- **tRPC routers**: `src/server/routers/novels.ts`, `chapters.ts`, `translations.ts`
- **Validation**: `src/lib/validations/novel.ts`, `chapter.ts`, `translation.ts` (shared id input schemas)
- **UI**: novel detail header, chapter detail header, `translation-list.tsx`; new delete confirmation dialog components
- **Database**: No schema migration — Prisma `onDelete: Cascade` already removes child rows (novel → chapters → translations → chunks)
- **Queue**: Deleting a `QUEUED`/`PROCESSING` translation is blocked server-side; orphaned queue messages for already-deleted translations are handled by the existing idempotent consumer (NOT_FOUND no-op)
