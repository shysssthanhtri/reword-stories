"use client"

import type { inferRouterOutputs } from "@trpc/server"
import Link from "next/link"
import { useState } from "react"

import { TranslationProgress } from "@/components/translations/translation-progress"
import { TranslationReviewModal } from "@/components/translations/translation-review-modal"
import { TranslationStatusBadge } from "@/components/translations/translation-status-badge"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty"
import { routes } from "@/configs/routes"
import { cn } from "@/lib/utils"
import type { AppRouter } from "@/server/trpc/router"
import { trpc } from "@/trpc/react"

export type TranslationListItem =
  inferRouterOutputs<AppRouter>["translations"]["listByChapter"][number]

type TranslationListProps = {
  novelId: string
  chapterId: string
  initialTranslations: TranslationListItem[]
}

export function TranslationList({
  novelId,
  chapterId,
  initialTranslations,
}: TranslationListProps) {
  const [selectedTranslationId, setSelectedTranslationId] = useState<
    string | null
  >(null)
  const [deletingTranslationId, setDeletingTranslationId] = useState<
    string | null
  >(null)
  const utils = trpc.useUtils()
  const retryTranslation = trpc.translations.retry.useMutation({
    onSuccess: async () => {
      await utils.translations.listByChapter.invalidate({ chapterId })
    },
  })
  const deleteTranslation = trpc.translations.delete.useMutation({
    onSuccess: async () => {
      await utils.translations.listByChapter.invalidate({ chapterId })
      setDeletingTranslationId(null)
    },
  })
  const translationsQuery = trpc.translations.listByChapter.useQuery(
    { chapterId },
    {
      initialData: initialTranslations,
      refetchInterval: (query) => {
        const hasInFlight = query.state.data?.some(
          (translation) =>
            translation.status === "QUEUED" ||
            translation.status === "PROCESSING",
        )

        return hasInFlight ? 3000 : false
      },
    },
  )

  const translations = translationsQuery.data ?? []
  const deletingTranslation = translations.find(
    (translation) => translation.id === deletingTranslationId,
  )

  if (translations.length === 0) {
    return (
      <Empty className="border">
        <EmptyHeader>
          <EmptyTitle>No translations yet</EmptyTitle>
          <EmptyDescription>
            Start a translation job to polish this chapter in the background.
          </EmptyDescription>
        </EmptyHeader>
        <Button
          nativeButton={false}
          render={
            <Link href={routes.chapterTranslate(novelId, chapterId)} />
          }
        >
          Start translation
        </Button>
      </Empty>
    )
  }

  return (
    <>
      <ul className="flex flex-col gap-3">
        {translations.map((translation) => {
          const isClickable =
            translation.status === "COMPLETED" ||
            translation.status === "FAILED"

          return (
            <li
              key={translation.id}
              className={cn(
                "flex flex-col gap-2 rounded-lg border p-4",
                isClickable &&
                "cursor-pointer transition-colors hover:bg-muted/50",
              )}
              onClick={
                isClickable
                  ? () => setSelectedTranslationId(translation.id)
                  : undefined
              }
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-col gap-1">
                  <p className="font-medium">
                    {translation.providerLabel} · {translation.modelLabel}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Started {new Date(translation.createdAt).toLocaleString()}
                  </p>
                </div>
                <TranslationStatusBadge
                  status={translation.status}
                  progressPct={translation.progressPct}
                />
              </div>

              <TranslationProgress
                status={translation.status}
                progressPct={translation.progressPct}
              />

              {translation.status === "FAILED" && translation.errorMessage ? (
                <p className="text-sm text-destructive">
                  {translation.errorMessage}
                </p>
              ) : null}

              <div className="flex flex-wrap gap-2">
                {translation.status !== "PROCESSING" ? (
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={retryTranslation.isPending}
                    onClick={(event) => {
                      event.stopPropagation()
                      retryTranslation.mutate({ id: translation.id })
                    }}
                  >
                    {retryTranslation.isPending ? "Retrying..." : "Retry all"}
                  </Button>
                ) : null}
                <Button
                  size="sm"
                  variant="outline"
                  className="text-destructive"
                  onClick={(event) => {
                    event.stopPropagation()
                    setDeletingTranslationId(translation.id)
                  }}
                >
                  Delete
                </Button>
              </div>
            </li>
          )
        })}
      </ul>

      <TranslationReviewModal
        open={selectedTranslationId !== null}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedTranslationId(null)
          }
        }}
        translationId={selectedTranslationId}
        chapterId={chapterId}
      />

      <AlertDialog
        open={deletingTranslationId !== null}
        onOpenChange={(open) => {
          if (!open) {
            setDeletingTranslationId(null)
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete translation?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently deletes the{" "}
              {deletingTranslation
                ? `${deletingTranslation.providerLabel} · ${deletingTranslation.modelLabel}`
                : "selected"}{" "}
              translation. This cannot be undone.
              {deletingTranslation &&
              (deletingTranslation.status === "QUEUED" ||
                deletingTranslation.status === "PROCESSING") ? (
                <>
                  {" "}
                  The background job for this translation will stop if it is
                  still running.
                </>
              ) : null}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteTranslation.isPending}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={deleteTranslation.isPending || !deletingTranslationId}
              onClick={() => {
                if (deletingTranslationId) {
                  deleteTranslation.mutate({ id: deletingTranslationId })
                }
              }}
            >
              {deleteTranslation.isPending ? "Deleting..." : "Delete translation"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
