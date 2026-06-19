# Translation Workflow

Durable Vercel Workflow jobs for sequential chapter chunk polishing.

## Requirements

### Requirement: Translation job workflow

The application SHALL define a durable workflow `translationJob(translationId: string)` in `src/workflows/translation-job.ts` using the Workflow SDK `"use workflow"` directive. Each workflow run SHALL be referred to as a **job**. One job SHALL process exactly one translation.

The job SHALL execute in order:

1. Wait until no other translation has `status = PROCESSING` (global job slot)
2. Set translation `status = PROCESSING` and clear `errorMessage`
3. Load all chunks for the translation ordered by `chunkIndex` ascending
4. For each chunk that is not `COMPLETED`, polish sequentially (skip `COMPLETED` chunks on retry)
5. Apply an in-job rate limit of at most 3 polish operations per 60-second window using workflow-level `sleep()`
6. On first chunk failure, stop processing remaining chunks, mark the failed chunk `FAILED`, and set translation `status = FAILED`
7. After the final chunk succeeds, assemble `polishedContent` and set translation `status = COMPLETED`

#### Scenario: Job processes chunks in order

- **WHEN** a translation job runs for a translation with 4 `PENDING` chunks
- **THEN** chunks are polished in `chunkIndex` order 0, 1, 2, 3

#### Scenario: Job skips completed chunks on retry

- **WHEN** a job runs after `retry` with chunks 0–1 `COMPLETED` and chunk 2 `PENDING`
- **THEN** the job skips chunks 0–1 and starts polishing at chunk 2

#### Scenario: Job stops on first failure

- **WHEN** chunk 2 fails during a job and chunks 3+ are still `PENDING`
- **THEN** chunks 3+ are not polished, chunk 2 is `FAILED`, and translation `status = FAILED`

### Requirement: Global job concurrency limit

The application SHALL allow at most **one active translation job** system-wide at any time. A translation is considered active when its `status = PROCESSING`.

Before setting a translation to `PROCESSING`, the job workflow SHALL poll (via step `isGlobalJobSlotAvailable(translationId)`) until no **other** translation has `status = PROCESSING`. While waiting, the workflow SHALL `await sleep("10s")` at the workflow function level. The waiting translation SHALL remain `QUEUED` until it acquires the slot.

#### Scenario: Second job waits for first

- **WHEN** translation A is `PROCESSING` and a job starts for translation B (`QUEUED`)
- **THEN** translation B remains `QUEUED` until translation A reaches a terminal status, then translation B moves to `PROCESSING`

#### Scenario: Only one PROCESSING translation at a time

- **WHEN** any translation job holds the global slot
- **THEN** at most one translation row has `status = PROCESSING`

#### Scenario: Create while another job runs

- **WHEN** `translations.create` succeeds while another translation is `PROCESSING`
- **THEN** the new translation is created as `QUEUED`, a job is started, and the job waits for the global slot before processing chunks

### Requirement: Chunk polish workflow step

Each chunk polish operation SHALL run as a Workflow SDK step (`"use step"`) that:

1. Loads the chunk with translation, chapter, and novel (`sourceLanguage`)
2. Builds overlap context from the previous chunk's `polishedSlice` when `chunkIndex > 0`
3. Calls `getProvider(translation.provider).polish()` with `rawSlice`, `sourceLanguage`, overlap, and `modelId: translation.modelName`
4. Persists `polishedSlice`, `tokenCount`, marks chunk `COMPLETED`, clears chunk `errorMessage`, updates `progressPct` and `tokenUsage`
5. On LLM or processing error, marks chunk `FAILED` with `errorMessage` and throws `FatalError` to stop the job without automatic step retry

#### Scenario: Overlap from previous chunk

- **WHEN** polishing chunk index 1 in a job and chunk index 0 is `COMPLETED`
- **THEN** `polish()` receives `contextOverlap` from chunk 0's polished text

#### Scenario: LLM failure does not auto-retry

- **WHEN** `polish()` throws an error in a chunk step
- **THEN** the chunk is marked `FAILED` and the step throws `FatalError` so Workflow does not automatically retry the LLM call

### Requirement: In-job rate limit

The translation job SHALL enforce a maximum of 3 chunk polish steps per 60-second window **within a single job**. The rate limit SHALL NOT be shared across concurrent jobs for different translations.

After every 3 successful polish steps, the workflow SHALL `await sleep("60s")` at the workflow function level before starting the next polish step.

#### Scenario: Fourth chunk waits after three polishes

- **WHEN** a job successfully polishes chunks 0, 1, and 2 in quick succession
- **THEN** the workflow sleeps 60 seconds before polishing chunk 3

### Requirement: Global job slot check step

The application SHALL implement `isGlobalJobSlotAvailable(translationId: string)` as a Workflow SDK step that queries the database and returns `true` when no translation other than `translationId` has `status = PROCESSING`.

#### Scenario: Slot available when idle

- **WHEN** no translations are `PROCESSING`
- **THEN** `isGlobalJobSlotAvailable` returns `true` for any `translationId`

#### Scenario: Slot blocked by another translation

- **WHEN** translation A is `PROCESSING` and the step is called for translation B
- **THEN** `isGlobalJobSlotAvailable` returns `false`

### Requirement: Start translation job helper

The application SHALL provide `startTranslationJob(translationId: string)` in `src/lib/workflow/start-translation-job.ts` that calls `start(translationJob, [translationId])` from `workflow/api`.

The helper SHALL be invoked by `translations.create`, `translations.retry`, and `translations.retryChunk` after the database transaction succeeds.

#### Scenario: Create starts a job

- **WHEN** `translations.create` succeeds
- **THEN** a translation job is started for the new translation id

### Requirement: Workflow Next.js configuration

The application SHALL install the `workflow` npm package and wrap `next.config.ts` with `withWorkflow()` from `workflow/next`.

Workflow step routes SHALL use `maxDuration = 300` in `vercel.json` or route segment config.

#### Scenario: Next config enables workflow directives

- **WHEN** inspecting `next.config.ts`
- **THEN** the default export is wrapped with `withWorkflow()`

### Requirement: Polished content assembly on job completion

When all chunks reach `COMPLETED`, the finalize step SHALL concatenate `polishedSlice` values in `chunkIndex` order separated by `\n\n` into `Translation.polishedContent`, set `progressPct = 100`, and clear `errorMessage`.

Assembly logic SHALL reuse `src/lib/chunking/assemble-chunks.ts`.

#### Scenario: Full chapter assembled on job completion

- **WHEN** the last chunk completes in a job for a 3-chunk translation
- **THEN** `polishedContent` contains all three polished slices in order

### Requirement: Translation job observability

Translation job steps SHALL log with prefix `[translation-job]`. Operators SHALL be able to inspect job runs in the Vercel dashboard under Observability → Workflows.

#### Scenario: Job logs include translation id

- **WHEN** a translation job runs
- **THEN** log lines include `translationId` for filtering
