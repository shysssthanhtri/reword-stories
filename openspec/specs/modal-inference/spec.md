# Modal Inference

Modal-hosted GPU inference for Vietnamese text correction via `bmd1905/vietnamese-correction-v2`.

## Requirements

### Requirement: Vietnamese correction Modal app

The project SHALL include a Modal Python app at `modal/vietnamese_correction.py` that:

- Defines a Modal app named `reword-stories-vietnamese-correction`
- Uses a Debian-slim image with `transformers`, `torch`, and `fastapi[standard]` installed
- Loads `bmd1905/vietnamese-correction-v2` via Hugging Face `pipeline("text2text-generation", ...)` on GPU at container startup (`@modal.enter`)
- Exposes a FastAPI ASGI app via `@modal.asgi_app()` with a `POST /correct` endpoint
- Accepts JSON `{ "text": string, "max_length"?: number }` where `text` is non-empty
- Returns JSON `{ "corrected_text": string }` with the model's generated output trimmed
- Secures all routes with `X-Api-Key` header validation against `MODAL_VIETNAMESE_API_KEY` from a Modal secret
- Uses Modal secret `hf-token` (`HF_TOKEN`) for Hugging Face model download when required

The Modal class SHALL use GPU (`T4` or better), `max_containers=1`, and a scaledown window to limit idle cost.

#### Scenario: Correct endpoint returns corrected Vietnamese

- **WHEN** `POST /correct` is called with valid API key and text `"côn viec kin doanh thì rất kho khan"`
- **THEN** the response status is 200 and `corrected_text` contains diacritic-corrected Vietnamese prose

#### Scenario: Missing API key rejected

- **WHEN** `POST /correct` is called without `X-Api-Key`
- **THEN** the response status is 403

#### Scenario: Empty text rejected

- **WHEN** `POST /correct` is called with `{ "text": "" }`
- **THEN** the response status is 422

### Requirement: Modal local entrypoint for manual QA

The Modal app SHALL include a `@app.local_entrypoint()` that accepts a `--text` argument, calls the correction method remotely, and prints the corrected output to stdout for local smoke testing via `modal run modal/vietnamese_correction.py --text "..."`.

#### Scenario: Local entrypoint prints correction

- **WHEN** developer runs `modal run modal/vietnamese_correction.py --text "toi dang hoc"`
- **THEN** corrected Vietnamese text is printed to stdout

### Requirement: GitHub Action deploys Modal app and syncs secrets

The project SHALL include `.github/workflows/deploy-modal-vietnamese-correction.yml` triggered by `workflow_dispatch` (and optionally on push to `main` when `modal/**` changes) that:

- Checks out the repo
- Installs Python 3.11 and the `modal` CLI
- Authenticates with GitHub secrets `MODAL_TOKEN_ID` and `MODAL_TOKEN_SECRET`
- Runs `modal secret create hf-token --force` with `HF_TOKEN` from GitHub secrets
- Runs `modal secret create modal-vietnamese-api-key --force` with `MODAL_VIETNAMESE_API_KEY` from GitHub secrets
- Runs `modal deploy modal/vietnamese_correction.py`

Secret sync SHALL run before deploy on every workflow run so credential rotation only requires re-running deploy (no separate bootstrap workflow).

#### Scenario: Deploy syncs secrets then publishes endpoint

- **WHEN** the deploy workflow runs with valid Modal, HF, and API key credentials
- **THEN** Modal secrets `hf-token` and `modal-vietnamese-api-key` are updated and Modal reports a deployed HTTPS URL for the ASGI app

#### Scenario: Secret sync uses force overwrite

- **WHEN** the deploy workflow runs and Modal secrets already exist
- **THEN** `modal secret create ... --force` updates them without failing the workflow
