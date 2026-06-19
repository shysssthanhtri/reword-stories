## 1. Collapsible raw content component

- [x] 1.1 Convert `ChapterRawContent` to a Client Component with `"use client"`
- [x] 1.2 Wrap the Card in shadcn `Collapsible` with `defaultOpen={false}`
- [x] 1.3 Add `characterCount` prop and show locale-formatted count in the collapsed header (e.g. "12,345 characters")
- [x] 1.4 Make the Card header the `CollapsibleTrigger` with a chevron icon that rotates when open
- [x] 1.5 Keep the existing `<pre>` scrollable block inside `CollapsibleContent` unchanged

## 2. Wire into chapter detail page

- [x] 2.1 Pass `characterCount={chapter.rawContent.length}` from the chapter detail RSC page to `ChapterRawContent`

## 3. Verification

- [x] 3.1 Run lint and type check
- [x] 3.2 Run production build
- [x] 3.3 Manual smoke test: chapter detail loads with raw content collapsed, translations visible without scrolling; expand shows full text; collapse hides it again
