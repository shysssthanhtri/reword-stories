## MODIFIED Requirements

### Requirement: Modal Vietnamese correction provider

The application SHALL register a `modal-vietnamese` provider in `src/lib/llm/providers.ts` implemented in `src/lib/llm/modal-vietnamese-provider.ts` with:

- `id`: `modal-vietnamese`
- `label`: human-readable name (e.g. "Vietnamese Correction (Modal)")
- `models`: a single entry `{ id: "bmd1905/vietnamese-correction-v2", label: "Vietnamese Correction v2", isFree: true }`

The provider's `polish()` SHALL:

- Delegate HTTP calls to `correctText()` from `src/lib/modal-vietnamese` (typed Modal client) instead of inline `fetch`
- Build request text via `buildCorrectionInput(text, contextOverlap)` before calling `correctText`
- Return `{ polishedText: corrected_text }` from the Modal response
- Omit `tokenUsage` (the correction model does not expose token counts)
- NOT invoke AI Gateway or post-edit prompt builders

If `MODAL_VIETNAMESE_API_URL` or `MODAL_VIETNAMESE_API_KEY` is missing when `polish()` runs, the provider SHALL throw a clear configuration error before calling the client.

#### Scenario: Registry returns modal-vietnamese provider

- **WHEN** `getProvider("modal-vietnamese")` is called
- **THEN** it returns the Modal-backed Vietnamese correction provider

#### Scenario: Polish via Modal client

- **WHEN** `polish()` is called with valid env and Vietnamese text
- **THEN** the provider calls `correctText()` and returns corrected text in `polishedText`

#### Scenario: Overlap prepended to input text

- **WHEN** `polish()` is called with `contextOverlap: "Đoạn trước."` and `text: "Đoạn sau."`
- **THEN** `correctText` receives text built as `"Đoạn trước.\nĐoạn sau."`

#### Scenario: Missing Modal config throws

- **WHEN** `polish()` is called without `MODAL_VIETNAMESE_API_URL` or `MODAL_VIETNAMESE_API_KEY` configured
- **THEN** the provider throws a clear error about missing Modal configuration
