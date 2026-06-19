## Context

Reword Stories polishes machine-translated novel chapters through a `TranslationProvider` interface. Today only the `gateway` provider exists (Vercel AI Gateway + post-edit prompts). Vietnamese novels (`sourceLanguage: vi`) would benefit from a domain-specific correction model rather than a general chat LLM.

The [bmd1905/vietnamese-correction-v2](https://huggingface.co/bmd1905/vietnamese-correction-v2) model is a 0.4B mBART text2text model fine-tuned for Vietnamese spelling/diacritic correction. It cannot run inside Vercel serverless workflow steps (needs GPU + PyTorch). The sibling **Parrot** project already hosts GPU models on Modal with GitHub Actions for secret bootstrap and deploy — we reuse that pattern.

Current flow is unchanged at the workflow layer: `translationJob` calls `getProvider(id).polish()` per chunk. Only the provider implementation differs.

## Goals / Non-Goals

**Goals:**

- Host `bmd1905/vietnamese-correction-v2` on Modal with a secured HTTP API
- Register a `modal-vietnamese` provider that calls that API from existing workflow steps
- Sync Modal secrets and deploy via a single GitHub Actions workflow
- Expose the provider in the translate-page model picker with zero UI redesign

**Non-Goals:**

- Restricting the provider to `sourceLanguage: vi` only (user can pick any provider for any novel in v1; language gating is a future UX improvement)
- Batching multiple chunks in one Modal request (keep one chunk = one HTTP call for simplicity and idempotency)
- Token usage tracking for this provider (model pipeline does not expose counts)
- Replacing or removing the gateway provider

## Decisions

### 1. Modal GPU service instead of Hugging Face Inference API

**Choice:** Self-host on Modal with `transformers` pipeline.

**Rationale:** The model has no Inference Provider on Hugging Face. Modal gives cold-start control, fixed cost profile, and matches existing Parrot infra skills. A dedicated endpoint also avoids HF rate limits during long chapter jobs.

**Alternative considered:** HF Inference Endpoints — rejected for cost/complexity on a personal project when Modal is already proven in Parrot.

### 2. FastAPI ASGI app on Modal (Parrot pattern)

**Choice:** `@modal.cls` + `@modal.asgi_app()` + `POST /correct`, API key via `X-Api-Key`.

**Rationale:** Mirrors `parrot/modal/chatterbox_tts.py` — same secret names pattern, same deploy workflow shape, same local `modal run` smoke test.

**Server boundary:** Inference runs entirely on Modal. Next.js workflow steps only make outbound HTTPS calls; no Python in the Next.js bundle.

### 3. Provider id `modal-vietnamese` with HTTP adapter in TypeScript

**Choice:** New file `src/lib/llm/modal-vietnamese-provider.ts`; register alongside `gatewayProvider` in `providers.ts`.

**Rationale:** Keeps gateway and Modal concerns separate. The shared `TranslationProvider` interface needs no change.

**Polish semantics:** Send raw Vietnamese text to the correction model — do **not** use `buildPostEditSystemPrompt`. For chunk continuity, prepend `contextOverlap` with a newline (simple concatenation the seq2seq model can use as left context).

### 4. Env vars split: Vercel app vs Modal secrets

| Variable | Where | Purpose |
|----------|-------|---------|
| `MODAL_VIETNAMESE_API_URL` | Vercel + `.env` | Deployed Modal HTTPS base URL |
| `MODAL_VIETNAMESE_API_KEY` | Vercel + `.env` + Modal secret | Shared API key for auth |
| `MODAL_TOKEN_ID` / `MODAL_TOKEN_SECRET` | GitHub secrets only | CI deploy auth |
| `HF_TOKEN` | GitHub secrets → Modal secret `hf-token` | Model download |

Both URL and API key are optional at app startup; required only when `polish()` runs for this provider.

### 5. GitHub Actions — single deploy workflow

**`deploy-modal-vietnamese-correction.yml`** — `workflow_dispatch`, runs in order:

1. `modal secret create hf-token ... --force` ← `HF_TOKEN`
2. `modal secret create modal-vietnamese-api-key ... --force` ← `MODAL_VIETNAMESE_API_KEY`
3. `modal deploy modal/vietnamese_correction.py`

Inspired by Parrot's separate bootstrap workflow, but consolidated here so every deploy refreshes secrets (credential rotation = re-run deploy). No standalone `setup-modal-secrets.yml`.

### 6. GPU and scaling

**Choice:** `gpu="T4"`, `max_containers=1`, `scaledown_window=300` (5 min), `@modal.concurrent(max_inputs=5)`.

**Rationale:** 0.4B model fits T4; single container avoids duplicate model loads; modest concurrency handles sequential workflow chunks without queueing many parallel GPU jobs.

### 7. Model max_length

**Choice:** Default `max_length=512` on the Modal endpoint (matches model card examples); allow override in request body for future tuning.

**Rationale:** Chunks are already ~1800 tokens at the app layer; Vietnamese correction model was trained/evaluated at 512. If a chunk exceeds safe input length, the TypeScript provider SHOULD truncate input to a safe character limit before POST (document in implementation — ~2000 chars conservative) or rely on chunking keeping slices reasonable.

## Risks / Trade-offs

- **[Risk] Cold start latency on first chunk** → Mitigation: 5-minute scaledown window; acceptable for async workflow jobs
- **[Risk] Correction ≠ creative post-edit** → Mitigation: Label provider clearly in UI; user chooses between gateway LLM polish and specialized correction
- **[Risk] Overlap concatenation may confuse seq2seq model** → Mitigation: Monitor output quality; future option to send only `text` without overlap
- **[Risk] Modal URL changes on redeploy** → Mitigation: Update Vercel env after deploy; document in README
- **[Risk] 512 max_length vs large chunks** → Mitigation: Existing chunking targets ~1800 tokens; add input truncation guard in provider if needed

## Migration Plan

1. Add GitHub secrets: `MODAL_TOKEN_ID`, `MODAL_TOKEN_SECRET`, `HF_TOKEN`, `MODAL_VIETNAMESE_API_KEY`
2. Merge Modal app + deploy workflow; run **Deploy Vietnamese Correction** workflow (syncs secrets, then deploys)
3. Copy deployed Modal URL to Vercel env `MODAL_VIETNAMESE_API_URL`; set matching `MODAL_VIETNAMESE_API_KEY`
4. Deploy Next.js app — new provider appears in picker immediately (no DB migration)

**Rollback:** Remove provider from registry or hide via env check; gateway provider unaffected. Modal app can stay deployed idle.

## Open Questions

- Should we auto-select `modal-vietnamese` when novel `sourceLanguage === "vi"`? (Deferred — nice UX, not required for v1)
- Is T4 sufficient for latency at ~1800-token chunks, or should we test A10G? (Start T4; upgrade if p95 polish step exceeds workflow timeout)
