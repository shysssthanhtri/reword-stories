## Context

The chapter detail page (`/novels/[novelId]/chapters/[chapterId]`) is an RSC that fetches chapter data server-side and renders `ChapterRawContent` — a Server Component that always shows the full pasted MT text in a scrollable `<pre>` block inside a Card. After creating a chapter, users primarily interact with the translations section below; the raw content block can be very long (up to 100k chars) and pushes translations off-screen.

The project already ships shadcn `Collapsible` (`src/components/ui/collapsible.tsx`) built on `@base-ui/react/collapsible`. No new dependencies are needed.

## Goals / Non-Goals

**Goals:**

- Collapse raw content by default on the chapter detail page
- Show a compact header with title and character count when collapsed
- Preserve full pre-wrapped, scrollable text display when expanded
- Keep the chapter detail page as an RSC; only the collapsible raw content section is a Client Component

**Non-Goals:**

- Editing or deleting raw content from this section
- Persisting expand/collapse state across page visits (local UI state only)
- Collapsing raw content on other pages (create form, novel list, etc.)
- Lazy-loading raw content from a separate API call (content is already fetched by `chapters.getById`)

## Decisions

### 1. Use shadcn `Collapsible` with `defaultOpen={false}`

**Choice:** Wrap the existing Card layout in `Collapsible`, `CollapsibleTrigger`, and `CollapsibleContent`. Set `defaultOpen={false}` so the section starts collapsed.

**Rationale:** Matches the project's component library. Simpler than Accordion (single section, no multi-panel semantics). Uncontrolled default state avoids URL/localStorage complexity for a minor UX tweak.

**Alternative considered:** Accordion — rejected; single item doesn't need accordion semantics.

**Alternative considered:** Persist open state in `localStorage` — rejected as over-engineering; user can re-expand when needed.

### 2. Convert `ChapterRawContent` to a Client Component

**Choice:** Add `"use client"` to `src/components/chapters/chapter-raw-content.tsx` and accept `{ rawContent: string; characterCount: number }`.

**Rationale:** Collapsible requires client-side interactivity. The parent RSC page already has `chapter.rawContent.length` for the header — pass it as `characterCount` for the collapsed summary. Raw text is still server-rendered as props (no extra fetch).

**Server/Client boundary:**

| Surface | Component | Type |
|---------|-----------|------|
| Chapter detail page | `page.tsx` | RSC — fetches chapter + translations |
| Raw content section | `ChapterRawContent` | Client island — collapsible toggle only |

### 3. Collapsed header shows character count with locale formatting

**Choice:** Display `{characterCount.toLocaleString()} characters` in the CardDescription or trigger row when collapsed.

**Rationale:** Gives users at a glance that content exists and how large it is without rendering the full text. Reuses the count already shown in `ChapterDetailHeader`.

**Alternative considered:** Show a text preview (first N chars) — rejected; character count is cleaner and avoids leaking MT text into the collapsed view.

### 4. Keep expanded content styling unchanged

**Choice:** Retain the existing `<pre className="max-h-[32rem] overflow-auto whitespace-pre-wrap font-mono text-sm leading-relaxed">` inside `CollapsibleContent`.

**Rationale:** No regression in readability when user chooses to expand.

### 5. Chevron icon on trigger for affordance

**Choice:** Add a chevron (e.g. `ChevronDown` from lucide-react) on the trigger that rotates when open, consistent with common collapsible patterns.

**Rationale:** Makes expand/collapse discoverable without reading helper text.

## Risks / Trade-offs

- **[Risk] Large raw content in HTML even when collapsed** → Accepted: text is still in the DOM as props/hidden panel content. Mitigation is visual (collapsed UI), not payload reduction. Full lazy-load would require API changes — out of scope.
- **[Risk] Client Component adds small JS bundle** → Accepted: minimal; collapsible is a standard interactive island per project architecture.
- **[Risk] User lands after create expecting to see pasted text** → Mitigated: they just pasted on the previous page; translations section is the natural next action. One click expands raw content if needed.

## Migration Plan

No database migration or API changes. Single PR:

1. Update `ChapterRawContent` to collapsible Client Component
2. Pass `characterCount` from chapter detail page
3. Manual verify: collapsed by default, expand shows full text, translations visible without scroll on typical viewports

Rollback: revert the PR.

## Open Questions

None.
