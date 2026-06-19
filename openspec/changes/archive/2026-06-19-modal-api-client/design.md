## Context

Reword Stories already hosts Vietnamese correction on Modal (`modal/vietnamese_correction.py`) and calls it from `src/lib/llm/modal-vietnamese-provider.ts` via inline `fetch`. That works but duplicates patterns the sibling **Parrot** project solved with a typed client layer:

| Parrot | Reword Stories (today) |
|--------|------------------------|
| `src/lib/chatterbox/client.ts` + `openapi-fetch` | Inline `fetch` in provider |
| `openapi/chatterbox.openapi.json` + `generate:api` | No OpenAPI snapshot |
| `src/lib/chatterbox/generate.ts` domain functions | Logic mixed into `polish()` |

The Modal Python app already exposes FastAPI with auto-generated OpenAPI at `/openapi.json` when deployed. We mirror Parrot's committed snapshot approach so CI and offline dev do not depend on a live Modal URL for type generation.

**Server boundary:** The client module is `server-only` — used from workflow steps and server-side provider code only. No client components call Modal directly.

## Goals / Non-Goals

**Goals:**

- Extract a reusable `src/lib/modal-vietnamese/` module matching Parrot's chatterbox layout
- Type-safe `POST /correct` via `openapi-fetch` + generated `schema.d.ts`
- Keep `modal-vietnamese-provider.ts` thin — config guard + `buildCorrectionInput` + `correctText`
- Add `pnpm generate:api` for regenerating types when the Modal API changes

**Non-Goals:**

- Changing the Modal Python app, deploy workflow, or env var names
- Adding new Modal endpoints beyond `/correct`
- Client-side Modal access or Route Handler proxy
- Auto-fetching OpenAPI from deployed Modal in CI (manual snapshot update is fine for v1)

## Decisions

### 1. Module layout — mirror Parrot chatterbox

**Choice:** `src/lib/modal-vietnamese/{client,correct,index,schema.d.ts}`

**Rationale:** Proven in Parrot; clear separation between transport (`client.ts`) and domain call (`correct.ts`). Future Modal services (if any) can follow the same folder-per-service pattern.

**Alternative considered:** Keep fetch in provider — rejected; harder to test and extend.

### 2. openapi-fetch + committed snapshot (not live codegen)

**Choice:** Hand-maintained or curl-sourced `openapi/vietnamese-correction.openapi.json`, generated `schema.d.ts` via `openapi-typescript`.

**Rationale:** Matches Parrot. Snapshot stays in git; `pnpm generate:api` is deterministic. When Modal FastAPI changes, developer updates snapshot (from `https://<modal-url>/openapi.json`) and regenerates.

**Alternative considered:** Runtime fetch of OpenAPI — rejected for build reproducibility.

### 3. Input building lives in client module, not provider

**Choice:** `buildCorrectionInput(text, contextOverlap?)` in `correct.ts` (or `input.ts`); provider calls it before `correctText`.

**Rationale:** Overlap concatenation and 2000-char truncation are Modal API concerns, not provider-registry concerns. Provider stays a thin `TranslationProvider` adapter.

### 4. Singleton client factory

**Choice:** Module-level cached client in `createModalVietnameseClient()` (Parrot pattern).

**Rationale:** Avoids re-instantiating `openapi-fetch` on every workflow chunk in a warm serverless instance.

### 5. Error formatting

**Choice:** `formatModalVietnameseError(status, error)` helper in `correct.ts`, JSON-stringify detail when present (Parrot `formatChatterboxError` pattern).

**Rationale:** Consistent error messages in workflow logs; openapi-fetch surfaces parsed error bodies.

### 6. Dependencies

**Choice:** Add `openapi-fetch` (runtime), `openapi-typescript` (dev).

**Rationale:** Same versions as Parrot (`openapi-fetch@^0.17`, `openapi-typescript@^7.13`) unless resolution conflicts — then latest compatible.

## Risks / Trade-offs

- **[Risk] OpenAPI snapshot drifts from deployed Modal app** → Mitigation: Document refresh steps in README; regenerate after Modal deploy when endpoints change
- **[Risk] `openapi-fetch` adds bundle to server code only** → Mitigation: `server-only` import; negligible for workflow steps
- **[Risk] Snapshot hand-authored incorrectly** → Mitigation: Prefer curling live `/openapi.json` from deployed endpoint after first deploy

## Migration Plan

1. Add OpenAPI snapshot, generate script, dependencies
2. Implement `src/lib/modal-vietnamese/` module
3. Refactor `modal-vietnamese-provider.ts` to use client — behavior unchanged
4. Run `pnpm typecheck` — no env or deploy changes required
5. Optional: curl fresh OpenAPI from Modal and run `pnpm generate:api` to verify snapshot accuracy

**Rollback:** Revert provider to inline `fetch`; client module is additive and safe to remove.

## Open Questions

- Should we add a `generate:api:fetch` script that curls `MODAL_VIETNAMESE_API_URL/openapi.json` before codegen? (Deferred — manual curl is enough for v1)
- Rename module to generic `src/lib/modal/` if a second Modal service is added? (Deferred — YAGNI until second endpoint)
