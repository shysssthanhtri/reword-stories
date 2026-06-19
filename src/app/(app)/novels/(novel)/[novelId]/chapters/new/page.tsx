import { TRPCError } from "@trpc/server"
import Link from "next/link"
import { notFound } from "next/navigation"

import { CreateChapterForm } from "@/components/chapters/create-chapter-form"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { routes } from "@/configs/routes"
import { api } from "@/trpc/server"

type NewChapterPageProps = {
  params: Promise<{ novelId: string }>
}

export default async function NewChapterPage({ params }: NewChapterPageProps) {
  const { novelId } = await params
  const caller = await api()

  try {
    await caller.novels.getById({ id: novelId })
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
        render={<Link href={routes.novelDetail(novelId)} />}
      >
        ← Back to novel
      </Button>

      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Add chapter</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Paste machine-translated text for a new chapter.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Chapter content</CardTitle>
          <CardDescription>
            One paste equals one chapter. You can polish it with a translation
            later.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CreateChapterForm novelId={novelId} />
        </CardContent>
      </Card>
    </div>
  )
}
