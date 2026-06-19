import { TRPCError } from "@trpc/server"
import Link from "next/link"
import { notFound } from "next/navigation"

import { NovelDetailHeader } from "@/components/novels/novel-detail-header"
import { NovelChaptersEmptyState } from "@/components/novels/novel-list"
import { Button } from "@/components/ui/button"
import { routes } from "@/configs/routes"
import { api } from "@/trpc/server"

type NovelDetailPageProps = {
  params: Promise<{ novelId: string }>
}

export default async function NovelDetailPage({ params }: NovelDetailPageProps) {
  const { novelId } = await params
  const caller = await api()

  let novel

  try {
    novel = await caller.novels.getById({ id: novelId })
  } catch (error) {
    if (error instanceof TRPCError && error.code === "NOT_FOUND") {
      notFound()
    }

    throw error
  }

  return (
    <div className="mx-auto flex w-full flex-col gap-6">
      <Button
        variant="ghost"
        size="sm"
        className="w-fit"
        nativeButton={false}
        render={<Link href={routes.novels} />}
      >
        ← Back to novels
      </Button>

      <NovelDetailHeader
        title={novel.title}
        sourceLanguage={novel.sourceLanguage}
      />

      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-lg font-medium">Chapters</h2>
          <Button
            size="sm"
            nativeButton={false}
            render={<Link href={routes.chapterNew(novelId)} />}
          >
            Add Chapter
          </Button>
        </div>
        {novel.chapters.length === 0 ? (
          <NovelChaptersEmptyState novelId={novelId} />
        ) : (
          <ul className="flex flex-col gap-2">
            {novel.chapters.map((chapter) => (
              <li key={chapter.id}>
                <Link
                  href={routes.chapterDetail(novelId, chapter.id)}
                  className="block rounded-lg border px-4 py-3 text-sm transition-colors hover:bg-muted/30"
                >
                  {chapter.title ?? `Chapter ${chapter.sortOrder + 1}`}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
