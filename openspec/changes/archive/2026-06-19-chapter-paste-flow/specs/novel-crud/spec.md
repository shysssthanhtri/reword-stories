# Novel CRUD

Delta spec for novel detail page chapter navigation updates.

## MODIFIED Requirements

### Requirement: Novel detail page at /novels/[novelId]

The route `src/app/(app)/novels/(novel)/[novelId]/page.tsx` SHALL be a React Server Component that server-fetches novel metadata and chapters. It SHALL display the novel title, source language label, and a **Chapters** section with an **Add Chapter** button linking to `/novels/[novelId]/chapters/new`.

When chapters exist, each chapter row SHALL link to `/novels/[novelId]/chapters/[chapterId]` and display the chapter title or fallback `Chapter {sortOrder + 1}`.

When no chapters exist, an empty state SHALL prompt the user to add a chapter with a link/button to `/novels/[novelId]/chapters/new`.

Unknown `novelId` SHALL render a not-found response (`notFound()`).

#### Scenario: Detail shows novel metadata

- **WHEN** user navigates to `/novels/[validId]`
- **THEN** the page shows the novel title and human-readable source language

#### Scenario: Detail shows add chapter button

- **WHEN** user navigates to a valid novel detail page
- **THEN** an **Add Chapter** button links to `/novels/[novelId]/chapters/new`

#### Scenario: Detail links chapter rows

- **WHEN** user navigates to a novel with chapters
- **THEN** each chapter row links to its chapter detail page

#### Scenario: Detail shows actionable empty chapters state

- **WHEN** user navigates to a novel with zero chapters
- **THEN** the chapters section shows an empty state with a link to add a chapter

#### Scenario: Invalid novel id returns 404

- **WHEN** user navigates to `/novels/nonexistent-id`
- **THEN** Next.js renders the not-found page
