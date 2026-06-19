type ChapterDetailHeaderProps = {
  title: string | null
  sortOrder: number
  characterCount: number
}

export function getChapterDisplayTitle(
  title: string | null,
  sortOrder: number
): string {
  return title ?? `Chapter ${sortOrder + 1}`
}

export function ChapterDetailHeader({
  title,
  sortOrder,
  characterCount,
}: ChapterDetailHeaderProps) {
  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight">
        {getChapterDisplayTitle(title, sortOrder)}
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">
        {characterCount.toLocaleString()} characters
      </p>
    </div>
  )
}
