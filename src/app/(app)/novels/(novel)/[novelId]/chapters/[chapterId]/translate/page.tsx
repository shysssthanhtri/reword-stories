import { TRPCError } from "@trpc/server"
import Link from "next/link"
import { notFound } from "next/navigation"

import { CreateTranslationForm } from "@/components/translations/create-translation-form"
import { Button } from "@/components/ui/button"
import { routes } from "@/configs/routes"
import { getChapterDisplayTitle } from "@/lib/validations/chapter"
import { api } from "@/trpc/server"

type TranslatePageProps = {
  params: Promise<{ novelId: string; chapterId: string }>
}

export default async function TranslatePage({ params }: TranslatePageProps) {
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
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
      <Button
        variant="ghost"
        size="sm"
        className="w-fit"
        nativeButton={false}
        render={<Link href={routes.chapterDetail(novelId, chapterId)} />}
      >
        ← Back to chapter
      </Button>

      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold tracking-tight">
          New translation
        </h1>
        <p className="text-sm text-muted-foreground">
          Polish {getChapterDisplayTitle(chapter)} with your chosen provider
          and model.
        </p>
      </div>

      <CreateTranslationForm novelId={novelId} chapterId={chapterId} />
    </div>
  )
}
