import { getChapterDisplayTitle } from "@/lib/validations/chapter"

type ChapterDetailHeaderProps = {
  title: string | null
  sortOrder: number
  characterCount: number
}

export function ChapterDetailHeader({
  title,
  sortOrder,
  characterCount,
}: ChapterDetailHeaderProps) {
  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight">
        {getChapterDisplayTitle({ title, sortOrder })}
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">
        {characterCount.toLocaleString()} characters
      </p>
    </div>
  )
}
