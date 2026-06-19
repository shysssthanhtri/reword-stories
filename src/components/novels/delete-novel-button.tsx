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
import { trpc } from "@/trpc/react"

type DeleteNovelButtonProps = {
  novelId: string
  novelTitle: string
}

export function DeleteNovelButton({
  novelId,
  novelTitle,
}: DeleteNovelButtonProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const utils = trpc.useUtils()
  const deleteNovel = trpc.novels.delete.useMutation({
    onSuccess: async () => {
      await utils.novels.list.invalidate()
      setOpen(false)
      router.push(routes.novels)
    },
  })

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger
        render={
          <Button variant="outline" size="sm" className="text-destructive" />
        }
      >
        Delete novel
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete novel?</AlertDialogTitle>
          <AlertDialogDescription>
            This permanently deletes <strong>{novelTitle}</strong> and all of
            its chapters and translations. This cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleteNovel.isPending}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            disabled={deleteNovel.isPending}
            onClick={() => deleteNovel.mutate({ id: novelId })}
          >
            {deleteNovel.isPending ? "Deleting..." : "Delete novel"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
