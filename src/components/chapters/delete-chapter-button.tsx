"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { routes } from "@/configs/routes"
import { getChapterDisplayTitle } from "@/lib/validations/chapter"
import { trpc } from "@/trpc/react"

type DeleteChapterButtonProps = {
  novelId: string
  chapterId: string
  title: string | null
  sortOrder: number
}

export function DeleteChapterButton({
  novelId,
  chapterId,
  title,
  sortOrder,
}: DeleteChapterButtonProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const utils = trpc.useUtils()
  const chapterTitle = getChapterDisplayTitle({ title, sortOrder })
  const deleteChapter = trpc.chapters.delete.useMutation({
    onSuccess: async () => {
      await utils.chapters.list.invalidate({ novelId })
      setOpen(false)
      router.push(routes.novelDetail(novelId))
    },
  })

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger
        render={
          <Button variant="outline" size="sm" className="text-destructive" />
        }
      >
        Delete chapter
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete chapter?</AlertDialogTitle>
          <AlertDialogDescription>
            This permanently deletes <strong>{chapterTitle}</strong> and all of
            its translations. This cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleteChapter.isPending}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            disabled={deleteChapter.isPending}
            onClick={() => deleteChapter.mutate({ id: chapterId })}
          >
            {deleteChapter.isPending ? "Deleting..." : "Delete chapter"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
