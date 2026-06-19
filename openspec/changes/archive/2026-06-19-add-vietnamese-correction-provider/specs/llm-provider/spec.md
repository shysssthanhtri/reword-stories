# LLM Provider

## ADDED Requirements

### Requirement: Modal Vietnamese correction provider

The application SHALL register a `modal-vietnamese` provider in `src/lib/llm/providers.ts` implemented in `src/lib/llm/modal-vietnamese-provider.ts` with:

- `id`: `modal-vietnamese`
- `label`: human-readable name (e.g. "Vietnamese Correction (Modal)")
- `models`: a single entry `{ id: "bmd1905/vietnamese-correction-v2", label: "Vietnamese Correction v2", isFree: true }`

The provider's `polish()` SHALL:

- POST to `MODAL_VIETNAMESE_API_URL` (typed env) at path `/correct` with JSON `{ text }`
- Send header `X-Api-Key: MODAL_VIETNAMESE_API_KEY`
- When `contextOverlap` is provided, prepend it to `text` separated by a newline before sending (continuity without LLM prompts)
- Return `{ polishedText: corrected_text }` from the Modal response
- Omit `tokenUsage` (the correction model does not expose token counts)
- NOT invoke AI Gateway or post-edit prompt builders

If `MODAL_VIETNAMESE_API_URL` or `MODAL_VIETNAMESE_API_KEY` is missing when `polish()` runs, the provider SHALL throw a clear configuration error.

#### Scenario: Registry returns modal-vietnamese provider

- **WHEN** `getProvider("modal-vietnamese")` is called
- **THEN** it returns the Modal-backed Vietnamese correction provider

#### Scenario: Polish via Modal HTTP endpoint

- **WHEN** `polish()` is called with valid env and Vietnamese text
- **THEN** the provider POSTs to the Modal `/correct` endpoint and returns corrected text in `polishedText`

#### Scenario: Overlap prepended to input text

- **WHEN** `polish()` is called with `contextOverlap: "Đoạn trước."` and `text: "Đoạn sau."`
- **THEN** the Modal request body text is `"Đoạn trước.\nĐoạn sau."`

#### Scenario: Missing Modal config throws

- **WHEN** `polish()` is called without `MODAL_VIETNAMESE_API_URL` or `MODAL_VIETNAMESE_API_KEY` configured
- **THEN** the provider throws a clear error about missing Modal configuration

### Requirement: Modal Vietnamese model catalog constants

The application SHALL export `MODAL_VIETNAMESE_PROVIDER_ID`, `MODAL_VIETNAMESE_MODELS`, and `DEFAULT_MODAL_VIETNAMESE_MODEL_ID` from `src/lib/llm/models.ts` alongside existing gateway constants.

`DEFAULT_MODAL_VIETNAMESE_MODEL_ID` SHALL equal `bmd1905/vietnamese-correction-v2`.

#### Scenario: Catalog lists correction model

- **WHEN** inspecting `MODAL_VIETNAMESE_MODELS`
- **THEN** it includes one entry with id `bmd1905/vietnamese-correction-v2` and `isFree: true`
