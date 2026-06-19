# Chapter CRUD

## MODIFIED Requirements

### Requirement: Chapter detail page at /novels/[novelId]/chapters/[chapterId]

The route `src/app/(app)/novels/(novel)/[novelId]/chapters/[chapterId]/page.tsx` SHALL be a React Server Component that server-fetches the chapter via `chapters.getById` and translations via `translations.listByChapter`.

The page SHALL display:

- A back link to `/novels/[novelId]`
- Chapter title (or fallback label `Chapter {sortOrder + 1}` when title is null)
- The full saved `rawContent` in a readable pre-wrapped text block
- A translations section listing translation jobs with status, provider, model, and progress (via a Client Component for polling), plus actions to start a new translation and retry failed jobs

If the chapter does not exist, or `chapter.novelId` does not match the route `novelId`, the page SHALL render a not-found response.

#### Scenario: Detail shows saved raw content

- **WHEN** user navigates to a valid chapter detail URL after pasting content
- **THEN** the page displays the exact saved `rawContent` text

#### Scenario: Detail shows title fallback

- **WHEN** user navigates to a chapter with no title and `sortOrder` = 2
- **THEN** the page displays "Chapter 3" as the heading

#### Scenario: Detail lists translations

- **WHEN** user navigates to a chapter with one completed translation
- **THEN** the translations section shows that translation with its status badge

#### Scenario: Mismatched novel id returns 404

- **WHEN** user navigates to `/novels/[novelA]/chapters/[chapterBelongingToNovelB]`
- **THEN** Next.js renders the not-found page

#### Scenario: Invalid chapter id returns 404

- **WHEN** user navigates to `/novels/[novelId]/chapters/nonexistent-id`
- **THEN** Next.js renders the not-found page
