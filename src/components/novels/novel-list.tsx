import { BookOpenIcon } from "lucide-react"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { routes } from "@/configs/routes"

export function NovelListEmptyState() {
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

export function NovelChaptersEmptyState({ novelId }: { novelId: string }) {
  return (
    <Empty className="border">
      <EmptyHeader>
        <EmptyTitle>No chapters yet</EmptyTitle>
        <EmptyDescription>
          Paste your first machine-translated chapter to get started.
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Button
          nativeButton={false}
          render={<Link href={routes.chapterNew(novelId)} />}
        >
          Add chapter
        </Button>
      </EmptyContent>
    </Empty>
  )
}
