import { getSourceLanguageLabel } from "@/lib/validations/novel"

type NovelDetailHeaderProps = {
  title: string
  sourceLanguage: string
}

export function NovelDetailHeader({
  title,
  sourceLanguage,
}: NovelDetailHeaderProps) {
  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Source language: {getSourceLanguageLabel(sourceLanguage)}
      </p>
    </div>
  )
}
