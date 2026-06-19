## Why

Reword Stories already supports Vietnamese (`vi`) as a source language, but all polishing runs through generic AI Gateway chat models with post-edit prompts. The [bmd1905/vietnamese-correction-v2](https://huggingface.co/bmd1905/vietnamese-correction-v2) model is a dedicated Vietnamese text-correction model (mBART text2text, ~0.4B params) trained to fix diacritics, spelling, and spacing in noisy Vietnamese text — a better fit for raw MT Vietnamese chapters than a general-purpose LLM. Hosting it on Modal (following the same bootstrap pattern as the Parrot project) keeps GPU inference off Vercel's serverless workflow steps while still integrating through the existing `TranslationProvider` interface.

## What Changes

- Add a Modal Python app (`modal/vietnamese_correction.py`) that loads `bmd1905/vietnamese-correction-v2` and exposes a FastAPI `/correct` endpoint secured by API key
- Add a GitHub Actions deploy workflow that syncs GitHub secrets → Modal (`--force`) and deploys the Modal app in one run
- Add a new `modal-vietnamese` provider in `src/lib/llm/` that calls the Modal endpoint from `polish()` instead of AI Gateway
- Register one model entry: `bmd1905/vietnamese-correction-v2` with a human-readable label
- Add typed env vars for Modal endpoint URL, API key, and optional HF token (for gated model downloads)
- Document local Modal dev (`modal run`) and the deploy workflow (secrets + deploy) in README

## Capabilities

### New Capabilities

- `modal-inference`: Modal app definition, deploy workflow (includes secret sync), and HTTP inference contract for Vietnamese text correction

### Modified Capabilities

- `llm-provider`: New `modal-vietnamese` provider implementation, model catalog entry, and provider-specific polish semantics (direct correction, not post-edit prompts)
- `env-config`: New optional/required env vars for Modal endpoint URL, API key, and HF token
- `translation-crud`: Provider picker SHALL include the new provider when registered; validation accepts its model id

## Impact

- **New files**: `modal/vietnamese_correction.py`, `.github/workflows/deploy-modal-vietnamese-correction.yml`
- **Modified**: `src/lib/llm/providers.ts`, new `src/lib/llm/modal-vietnamese-provider.ts`, `src/lib/llm/models.ts`, `src/env.ts`, `.env.example`, README
- **Secrets**: GitHub repo secrets `MODAL_TOKEN_ID`, `MODAL_TOKEN_SECRET`, `HF_TOKEN`, `MODAL_VIETNAMESE_API_KEY`; Vercel env `MODAL_VIETNAMESE_API_URL`, `MODAL_VIETNAMESE_API_KEY`
- **Infra**: Modal account with GPU worker for model inference; no changes to Prisma schema or workflow job structure
