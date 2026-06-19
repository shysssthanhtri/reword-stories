import { TRPCError } from "@trpc/server"
import Link from "next/link"
import { notFound } from "next/navigation"

import { ChapterDetailHeader } from "@/components/chapters/chapter-detail-header"
import { ChapterRawContent } from "@/components/chapters/chapter-raw-content"
import { Button } from "@/components/ui/button"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty"
import { routes } from "@/configs/routes"
import { api } from "@/trpc/server"

type ChapterDetailPageProps = {
  params: Promise<{ novelId: string; chapterId: string }>
}

export default async function ChapterDetailPage({
  params,
}: ChapterDetailPageProps) {
  const { novelId, chapterId } = await params
  const caller = await api()

  let chapter

  try {
    chapter = await caller.chapters.getById({ id: chapterId })
  } catch (error) {
    if (error instanceof TRPCError && error.code === "NOT_FOUND") {
      notFound()
    }

    throw error
  }

  if (chapter.novelId !== novelId) {
    notFound()
  }

  return (
    <div className="mx-auto flex w-full flex-col gap-6">
      <Button
        variant="ghost"
        size="sm"
        className="w-fit"
        nativeButton={false}
        render={<Link href={routes.novelDetail(novelId)} />}
      >
        ← Back to novel
      </Button>

      <ChapterDetailHeader
        title={chapter.title}
        sortOrder={chapter.sortOrder}
        characterCount={chapter.rawContent.length}
      />

      <ChapterRawContent rawContent={chapter.rawContent} />

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-medium">Translations</h2>
        <Empty className="border">
          <EmptyHeader>
            <EmptyTitle>No translations yet</EmptyTitle>
            <EmptyDescription>
              Translation jobs will be available in a future update.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      </section>
    </div>
  )
}
