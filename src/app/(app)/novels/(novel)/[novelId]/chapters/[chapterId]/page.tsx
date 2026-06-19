import { TRPCError } from "@trpc/server"
import Link from "next/link"
import { notFound } from "next/navigation"

import { ChapterDetailHeader } from "@/components/chapters/chapter-detail-header"
import { ChapterRawContent } from "@/components/chapters/chapter-raw-content"
import { DeleteChapterButton } from "@/components/chapters/delete-chapter-button"
import { TranslationList } from "@/components/translations/translation-list"
import { Button } from "@/components/ui/button"
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
  let translations

  try {
    ;[chapter, translations] = await Promise.all([
      caller.chapters.getById({ id: chapterId }),
      caller.translations.listByChapter({ chapterId }),
    ])
  } catch (error) {
    if (error instanceof TRPCError && error.code === "NOT_FOUND") {
      notFound()
    }

    throw error
  }

  if (chapter.novelId !== novelId) {
    notFound()
  }

  const serializedTranslations = translations.map((translation) => ({
    ...translation,
    createdAt: translation.createdAt.toISOString(),
    updatedAt: translation.updatedAt.toISOString(),
  }))

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

      <div className="flex items-start justify-between gap-4">
        <ChapterDetailHeader
          title={chapter.title}
          sortOrder={chapter.sortOrder}
          characterCount={chapter.rawContent.length}
        />
        <DeleteChapterButton
          novelId={novelId}
          chapterId={chapterId}
          title={chapter.title}
          sortOrder={chapter.sortOrder}
        />
      </div>

      <ChapterRawContent rawContent={chapter.rawContent} />

      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex flex-col gap-1">
            <h2 className="text-lg font-medium">Translations</h2>
            {serializedTranslations.length > 0 ? (
              <p className="text-sm text-muted-foreground">
                {serializedTranslations.length} translation
                {serializedTranslations.length === 1 ? "" : "s"}
              </p>
            ) : null}
          </div>
          {serializedTranslations.length > 0 ? (
            <Button
              size="sm"
              nativeButton={false}
              render={
                <Link href={routes.chapterTranslate(novelId, chapterId)} />
              }
            >
              New translation
            </Button>
          ) : null}
        </div>
        <TranslationList
          novelId={novelId}
          chapterId={chapterId}
          initialTranslations={serializedTranslations}
        />
      </section>
    </div>
  )
}
