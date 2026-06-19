## MODIFIED Requirements

### Requirement: Chapter detail page at /novels/[novelId]/chapters/[chapterId]

The route `src/app/(app)/novels/(novel)/[novelId]/chapters/[chapterId]/page.tsx` SHALL be a React Server Component that server-fetches the chapter via `chapters.getById` and translations via `translations.listByChapter`.

The page SHALL display:

- A back link to `/novels/[novelId]`
- Chapter title (or fallback label `Chapter {sortOrder + 1}` when title is null)
- The saved `rawContent` in a collapsible section (Client Component) that is **collapsed by default**, showing a compact header with the label "Raw content" and the character count; when expanded, the full text in a readable pre-wrapped, scrollable block
- A translations section listing translation jobs with status, provider, model, and progress (via a Client Component for polling), plus actions to start a new translation and retry failed jobs

If the chapter does not exist, or `chapter.novelId` does not match the route `novelId`, the page SHALL render a not-found response.

#### Scenario: Detail shows saved raw content when expanded

- **WHEN** user navigates to a valid chapter detail URL after pasting content and expands the raw content section
- **THEN** the page displays the exact saved `rawContent` text

#### Scenario: Raw content collapsed by default

- **WHEN** user navigates to a chapter detail page
- **THEN** the raw content section is collapsed and the translations section is visible without scrolling past the full raw text

#### Scenario: Collapsed header shows character count

- **WHEN** user views a chapter detail page with raw content of 12,345 characters
- **THEN** the collapsed raw content header indicates the character count (e.g. "12,345 characters")

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
