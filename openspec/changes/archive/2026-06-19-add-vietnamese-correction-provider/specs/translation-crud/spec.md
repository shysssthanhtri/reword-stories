# Translation CRUD

## ADDED Requirements

### Requirement: Modal Vietnamese provider in translation UI

The create-translation Client Component SHALL populate the provider select from `translations.listProviders` and SHALL include the `modal-vietnamese` provider when it is registered.

When the user selects `modal-vietnamese`, the model select SHALL show `bmd1905/vietnamese-correction-v2` and default to `DEFAULT_MODAL_VIETNAMESE_MODEL_ID`.

#### Scenario: List providers returns modal-vietnamese

- **WHEN** `translations.listProviders` is called
- **THEN** the response includes the `modal-vietnamese` provider with its model catalog

#### Scenario: Valid modal provider and model accepted

- **WHEN** create input uses `provider: "modal-vietnamese"` and `modelName: "bmd1905/vietnamese-correction-v2"`
- **THEN** validation passes

#### Scenario: Provider picker shows Vietnamese correction option

- **WHEN** user opens the translate page
- **THEN** the provider dropdown includes "Vietnamese Correction (Modal)" (or equivalent label)
