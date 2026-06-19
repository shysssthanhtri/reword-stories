# Translation Queue

Chapter text chunking and chunk persistence on translation create. Async processing is handled by `translation-workflow` jobs (Vercel Workflows), not Vercel Queues.

## Requirements

### Requirement: Chapter text chunking on translation create

The application SHALL provide a chunking function in `src/lib/chunking/split-chapter.ts` that splits chapter raw text into slices suitable for LLM post-editing.

Chunking rules:
- Target maximum ~1800 tokens per chunk, counted via `gpt-tokenizer`
- Split primarily on `\n\n` paragraph boundaries
- When a single paragraph exceeds the token limit, split on `. ` sentence boundaries
- Never split mid-word; if a single sentence still exceeds the limit, hard-split at a token boundary as a last resort

The function SHALL return an ordered array of raw text slices (0-based index order).

#### Scenario: Multi-paragraph chapter produces multiple chunks

- **WHEN** a 5,000-word chapter with many `\n\n`-separated paragraphs is chunked
- **THEN** the function returns two or more slices, each at most ~1800 tokens

#### Scenario: Oversized paragraph splits on sentences

- **WHEN** a chapter contains one paragraph exceeding 1800 tokens
- **THEN** the function splits that paragraph on sentence boundaries into multiple slices

### Requirement: Translation chunks persisted on create

When a translation is created, the application SHALL run chunking on the chapter's `rawContent`, create one `TranslationChunk` row per slice with `chunkIndex` (0-based), `rawSlice`, and `status = PENDING`, set the parent `Translation.status = QUEUED`, and start a translation workflow job.

#### Scenario: Chunks created before job start

- **WHEN** `translations.create` succeeds for a chapter with raw content
- **THEN** `TranslationChunk` rows exist for every slice with `status = PENDING`, translation status is `QUEUED`, and a translation job is started

### Requirement: Polished content assembly

When all chunks are `COMPLETED`, the application SHALL concatenate `polishedSlice` values in `chunkIndex` order separated by `\n\n` into `Translation.polishedContent`.

Assembly logic SHALL live in `src/lib/chunking/assemble-chunks.ts`.

#### Scenario: Full chapter assembled on completion

- **WHEN** the translation job completes the last chunk for a 3-chunk translation
- **THEN** `polishedContent` contains all three polished slices in order with paragraph breaks between them
