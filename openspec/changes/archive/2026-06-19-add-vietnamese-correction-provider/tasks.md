## 1. Modal app

- [x] 1.1 Create `modal/vietnamese_correction.py` with Modal image (`transformers`, `torch`, `fastapi[standard]`), GPU class loading `bmd1905/vietnamese-correction-v2` via `pipeline("text2text-generation")`
- [x] 1.2 Implement `POST /correct` FastAPI endpoint with `X-Api-Key` auth, request validation, and `{ corrected_text }` response
- [x] 1.3 Add `@app.local_entrypoint()` for `modal run` smoke tests with `--text` argument
- [x] 1.4 Wire Modal secrets: `hf-token`, `modal-vietnamese-api-key`

## 2. GitHub Actions

- [x] 2.1 Add `.github/workflows/deploy-modal-vietnamese-correction.yml` (`workflow_dispatch`) that syncs Modal secrets (`HF_TOKEN` → `hf-token`, `MODAL_VIETNAMESE_API_KEY` → `modal-vietnamese-api-key` with `--force`) then runs `modal deploy modal/vietnamese_correction.py`

## 3. TypeScript provider

- [x] 3.1 Add `MODAL_VIETNAMESE_PROVIDER_ID`, `MODAL_VIETNAMESE_MODELS`, and `DEFAULT_MODAL_VIETNAMESE_MODEL_ID` to `src/lib/llm/models.ts`
- [x] 3.2 Implement `src/lib/llm/modal-vietnamese-provider.ts` — HTTP POST to `/correct`, overlap prepending, error handling for missing env and non-2xx responses
- [x] 3.3 Register `modalVietnameseProvider` in `src/lib/llm/providers.ts`

## 4. Env and docs

- [x] 4.1 Add optional `MODAL_VIETNAMESE_API_URL` and `MODAL_VIETNAMESE_API_KEY` to `src/env.ts`
- [x] 4.2 Document new vars in `.env.example`
- [x] 4.3 Add README section: GitHub secrets list, deploy workflow (secrets + deploy in one run), and copying Modal URL to Vercel env

## 5. Verification

- [x] 5.1 Run `pnpm lint` and `pnpm build` — fix any type or lint errors
- [ ] 5.2 Manual smoke test: `modal run modal/vietnamese_correction.py --text "..."` with sample noisy Vietnamese
- [x] 5.3 Verify `translations.listProviders` includes `modal-vietnamese` locally (with env set)
