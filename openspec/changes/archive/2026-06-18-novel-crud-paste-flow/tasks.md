## 1. Dependencies and tRPC scaffold

- [x] 1.1 Install `@trpc/server`, `@trpc/client`, `@trpc/react-query`, `@tanstack/react-query`, `react-hook-form`, and `@hookform/resolvers`
- [x] 1.2 Create `src/server/trpc/context.ts` with Prisma `db` in context
- [x] 1.3 Create `src/server/trpc/init.ts` with `t`, `router`, and `publicProcedure`
- [x] 1.4 Create `src/server/trpc/router.ts` composing the root `appRouter` and export `AppRouter` type
- [x] 1.5 Create `src/app/api/trpc/[trpc]/route.ts` with `fetchRequestHandler` for GET and POST
- [x] 1.6 Create `src/trpc/server.ts` with server-side caller for RSC
- [x] 1.7 Create `src/trpc/react.tsx` with `TRPCReactProvider` and typed hooks
- [x] 1.8 Mount `TRPCReactProvider` in the `(app)` layout via a client `Providers` wrapper

## 2. Validation and novels router

- [x] 2.1 Create `src/lib/validations/novel.ts` with `sourceLanguageSchema`, `createNovelSchema`, and `SOURCE_LANGUAGES` labels
- [x] 2.2 Create `src/server/routers/novels.ts` with `list`, `getById`, and `create` procedures
- [x] 2.3 Wire `novels` router into root `appRouter`

## 3. Route config

- [x] 3.1 Extend `src/configs/routes/index.ts` with `novelNew` and `novelDetail(id)` helpers

## 4. Loading skeletons

- [x] 4.1 Create `src/components/novels/skeletons/novel-list-skeleton.tsx` (heading, action button, row/card placeholders)
- [x] 4.2 Create `src/components/novels/skeletons/novel-page-skeleton.tsx` (shared header + card layout for new/detail)
- [x] 4.3 Create `src/app/(app)/novels/loading.tsx` rendering `NovelListSkeleton`
- [x] 4.4 Restructure routes under `novels/(novel)/` and add `novels/(novel)/loading.tsx` rendering `NovelPageSkeleton`

## 5. Novel pages (SSR)

- [x] 5.1 Replace `src/app/(app)/novels/page.tsx` with RSC library view (server caller, empty state, **New Novel** link)
- [x] 5.2 Create `src/app/(app)/novels/(novel)/new/page.tsx` with page shell wrapping the create form
- [x] 5.3 Create `src/app/(app)/novels/(novel)/[novelId]/page.tsx` with RSC detail view and `notFound()` handling
- [x] 5.4 Create presentational components under `src/components/novels/` (list, detail header, empty states)

## 6. Create novel form (client island)

- [x] 6.1 Create `src/components/novels/create-novel-form.tsx` using React Hook Form, `zodResolver`, shadcn `Field`, `Input`, and source-language `Select`
- [x] 6.2 Wire `trpc.novels.create.useMutation()` with redirect to `/novels/[id]` on success and inline field errors on failure

## 7. Verification

- [x] 7.1 Run `pnpm check` (lint + typecheck) with no errors
- [x] 7.2 Run `pnpm build` successfully
- [ ] 7.3 Manually verify: empty library → create novel → land on detail → novel appears in list
- [ ] 7.4 Manually verify: navigating to `/novels`, `/novels/new`, and `/novels/[id]` each show the correct skeleton before content loads
