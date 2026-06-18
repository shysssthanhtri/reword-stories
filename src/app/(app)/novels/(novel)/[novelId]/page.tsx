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
        <h2 className="text-lg font-medium">Chapters</h2>
        {novel.chapters.length === 0 ? (
          <NovelChaptersEmptyState />
        ) : (
          <ul className="flex flex-col gap-2">
            {novel.chapters.map((chapter) => (
              <li
                key={chapter.id}
                className="rounded-lg border px-4 py-3 text-sm"
              >
                {chapter.title ?? `Chapter ${chapter.sortOrder + 1}`}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
