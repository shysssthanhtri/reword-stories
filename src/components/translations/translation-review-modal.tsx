"use client"

import type { inferRouterOutputs } from "@trpc/server"
import { useState } from "react"

import { TranslationChunkList } from "@/components/translations/translation-chunk-list"
import { TranslationStatusBadge } from "@/components/translations/translation-status-badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Skeleton } from "@/components/ui/skeleton"
import type { AppRouter } from "@/server/trpc/router"
import { trpc } from "@/trpc/react"

type TranslationDetail =
  inferRouterOutputs<AppRouter>["translations"]["getById"]

type TranslationReviewModalProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  translationId: string | null
  chapterId: string
}

function ReviewBody({
  translation,
  onRetryChunk,
  retryingChunkId,
}: {
  translation: TranslationDetail
  onRetryChunk: (chunkId: string) => void
  retryingChunkId: string | null
}) {
  if (translation.status === "COMPLETED") {
    return (
      <div className="max-h-[60vh] overflow-y-auto rounded-md border bg-muted/30 p-4">
        <p className="whitespace-pre-wrap text-sm leading-relaxed">
          {translation.polishedContent ?? "No polished content available."}
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      {translation.status === "QUEUED" ? (
        <p className="text-sm text-muted-foreground">
          Translation is queued and has not started yet.
        </p>
      ) : null}
      {translation.status === "PROCESSING" ? (
        <p className="text-sm text-muted-foreground">
          Translation in progress ({translation.progressPct}%).
        </p>
      ) : null}
      {translation.status === "FAILED" && translation.errorMessage ? (
        <p className="text-sm text-destructive">{translation.errorMessage}</p>
      ) : null}
      <TranslationChunkList
        chunks={translation.chunks}
        retryingChunkId={retryingChunkId}
        onRetryChunk={onRetryChunk}
        collapsible={false}
      />
    </div>
  )
}

export function TranslationReviewModal({
  open,
  onOpenChange,
  translationId,
  chapterId,
}: TranslationReviewModalProps) {
  const [retryingChunkId, setRetryingChunkId] = useState<string | null>(null)
  const utils = trpc.useUtils()
  const retryChunk = trpc.translations.retryChunk.useMutation({
    onMutate: ({ chunkId }) => {
      setRetryingChunkId(chunkId)
    },
    onSettled: () => {
      setRetryingChunkId(null)
    },
    onSuccess: async () => {
      await Promise.all([
        utils.translations.getById.invalidate({ id: translationId ?? "" }),
        utils.translations.listByChapter.invalidate({ chapterId }),
      ])
    },
  })
  const translationQuery = trpc.translations.getById.useQuery(
    { id: translationId ?? "" },
    {
      enabled: open && !!translationId,
      refetchInterval: (query) => {
        const status = query.state.data?.status
        return status === "QUEUED" || status === "PROCESSING" ? 3000 : false
      },
    },
  )

  const translation = translationQuery.data

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        {translationQuery.isLoading ? (
          <div className="flex flex-col gap-4">
            <Skeleton className="h-5 w-48" />
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-40 w-full" />
          </div>
        ) : translation ? (
          <>
            <DialogHeader>
              <div className="flex flex-wrap items-start justify-between gap-2 pr-8">
                <div className="flex flex-col gap-1">
                  <DialogTitle>
                    {translation.providerLabel} · {translation.modelLabel}
                  </DialogTitle>
                  <DialogDescription>
                    Started {new Date(translation.createdAt).toLocaleString()}
                  </DialogDescription>
                </div>
                <TranslationStatusBadge
                  status={translation.status}
                  progressPct={translation.progressPct}
                />
              </div>
            </DialogHeader>
            <ReviewBody
              translation={translation}
              retryingChunkId={retryingChunkId}
              onRetryChunk={(chunkId) => {
                retryChunk.mutate({
                  translationId: translation.id,
                  chunkId,
                })
              }}
            />
          </>
        ) : (
          <p className="text-sm text-muted-foreground">
            Translation could not be loaded.
          </p>
        )}
      </DialogContent>
    </Dialog>
  )
}
