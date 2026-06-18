import { BookOpenIcon } from "lucide-react"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { routes } from "@/configs/routes"
import { getSourceLanguageLabel } from "@/lib/validations/novel"

type NovelListItem = {
  id: string
  title: string
  sourceLanguage: string
  chapterCount: number
}

type NovelListProps = {
  novels: NovelListItem[]
}

export function NovelList({ novels }: NovelListProps) {
  if (novels.length === 0) {
    return (
      <Empty className="border">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <BookOpenIcon />
          </EmptyMedia>
          <EmptyTitle>No novels yet</EmptyTitle>
          <EmptyDescription>
            Create your first novel to start pasting chapters and translating
            them.
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button nativeButton={false} render={<Link href={routes.novelNew} />}>
            Create novel
          </Button>
        </EmptyContent>
      </Empty>
    )
  }

  return (
    <div className="grid gap-3">
      {novels.map((novel) => (
        <Link key={novel.id} href={routes.novelDetail(novel.id)}>
          <Card className="transition-colors hover:bg-muted/30">
            <CardHeader>
              <CardTitle>{novel.title}</CardTitle>
              <CardDescription>
                {getSourceLanguageLabel(novel.sourceLanguage)} ·{" "}
                {novel.chapterCount}{" "}
                {novel.chapterCount === 1 ? "chapter" : "chapters"}
              </CardDescription>
            </CardHeader>
          </Card>
        </Link>
      ))}
    </div>
  )
}

export function NovelLibraryHeader() {
  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Novels</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Your translation projects
        </p>
      </div>
      <Button nativeButton={false} render={<Link href={routes.novelNew} />}>
        New Novel
      </Button>
    </div>
  )
}

export function NovelChaptersEmptyState() {
  return (
    <Empty className="border">
      <EmptyHeader>
        <EmptyTitle>No chapters yet</EmptyTitle>
        <EmptyDescription>
          Chapter paste is coming next. You will be able to add raw chapters here
          soon.
        </EmptyDescription>
      </EmptyHeader>
    </Empty>
  )
}
