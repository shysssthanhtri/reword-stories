import { TRPCError } from "@trpc/server"
import Link from "next/link"
import { notFound } from "next/navigation"

import {
  ChapterListNoResults,
  ChapterListPagination,
} from "@/components/chapters/chapter-list-pagination"
import { ChapterListSearch } from "@/components/chapters/chapter-list-search"
import { ChapterListTable } from "@/components/chapters/chapter-list-table"
import { NovelDetailHeader } from "@/components/novels/novel-detail-header"
import { NovelChaptersEmptyState } from "@/components/novels/novel-list"
import { Button } from "@/components/ui/button"
import { routes } from "@/configs/routes"
import type { ChapterListParams } from "@/lib/chapter-list-url"
import { parseChapterListSearchParams } from "@/lib/validations/chapter"
import { api } from "@/trpc/server"

type NovelDetailPageProps = {
  params: Promise<{ novelId: string }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

export default async function NovelDetailPage({
  params,
  searchParams,
}: NovelDetailPageProps) {
  const { novelId } = await params
  const listInput = parseChapterListSearchParams(await searchParams)
  const caller = await api()

  let novel
  let chaptersResult

  try {
    ;[novel, chaptersResult] = await Promise.all([
      caller.novels.getById({ id: novelId }),
      caller.chapters.list({ novelId, ...listInput }),
    ])
  } catch (error) {
    if (error instanceof TRPCError && error.code === "NOT_FOUND") {
      notFound()
    }

    throw error
  }

  const listParams: ChapterListParams = {
    page: chaptersResult.page,
    pageSize: chaptersResult.pageSize,
    q: listInput.q,
    sortBy: listInput.sortBy,
    sortDir: listInput.sortDir,
  }

  const isEmptyChapters = chaptersResult.totalCount === 0 && !listInput.q

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
        {isEmptyChapters ? (
          <NovelChaptersEmptyState novelId={novelId} />
        ) : (
          <>
            <ChapterListSearch
              novelId={novelId}
              defaultValue={listInput.q ?? ""}
              listParams={listParams}
            />
            {chaptersResult.totalCount === 0 && listInput.q ? (
              <ChapterListNoResults query={listInput.q} />
            ) : (
              <>
                <ChapterListTable
                  novelId={novelId}
                  items={chaptersResult.items}
                  listParams={listParams}
                />
                <ChapterListPagination
                  novelId={novelId}
                  page={chaptersResult.page}
                  pageSize={chaptersResult.pageSize}
                  totalCount={chaptersResult.totalCount}
                  listParams={listParams}
                />
              </>
            )}
          </>
        )}
      </section>
    </div>
  )
}
