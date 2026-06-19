## 1. API Layer

- [x] 1.1 Update `translations.listByChapter` in `src/server/routers/translations.ts` to use an explicit Prisma `select` that excludes `polishedContent`
- [x] 1.2 Confirm `translations.getById` returns `polishedContent` (no code change expected; verify response shape)

## 2. Review Modal Component

- [x] 2.1 Create `src/components/translations/translation-review-modal.tsx` Client Component with shadcn `Dialog`, accepting `open`, `onOpenChange`, and `translationId` props
- [x] 2.2 Fetch translation via `trpc.translations.getById.useQuery` when `open && translationId`; show loading skeleton while fetching
- [x] 2.3 Render modal header with provider label, model label, status badge, and started timestamp
- [x] 2.4 Render status-appropriate scrollable body: full `polishedContent` when `COMPLETED`, progress/queued/failed messages otherwise

## 3. List Integration

- [x] 3.1 Update `src/components/translations/translation-list.tsx` to track `selectedTranslationId` state and open `TranslationReviewModal` on row click
- [x] 3.2 Add clickable row styling (`cursor-pointer`, hover affordance) on each `<li>`
- [x] 3.3 Add `e.stopPropagation()` on the Retry button so it does not trigger the modal

## 4. Verification

- [x] 4.1 Run lint and type check; fix any errors
- [x] 4.2 Run production build and confirm chapter detail page compiles
- [x] 4.3 Manually verify: click completed translation opens modal with polished text; click processing shows progress message; click failed shows error; Retry does not open modal; modal dismiss works
