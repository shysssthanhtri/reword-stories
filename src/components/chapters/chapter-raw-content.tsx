import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

type ChapterRawContentProps = {
  rawContent: string
}

export function ChapterRawContent({ rawContent }: ChapterRawContentProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Raw content</CardTitle>
        <CardDescription>
          Machine-translated text saved for this chapter.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <pre className="max-h-[32rem] overflow-auto whitespace-pre-wrap font-mono text-sm leading-relaxed">
          {rawContent}
        </pre>
      </CardContent>
    </Card>
  )
}
