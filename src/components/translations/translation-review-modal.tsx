"use client"

import { TranslationStatusBadge } from "@/components/translations/translation-status-badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Skeleton } from "@/components/ui/skeleton"
import { trpc } from "@/trpc/react"

type TranslationReviewModalProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  translationId: string | null
}

function ReviewBody({
  status,
  progressPct,
  polishedContent,
  errorMessage,
}: {
  status: "QUEUED" | "PROCESSING" | "COMPLETED" | "FAILED"
  progressPct: number
  polishedContent: string | null
  errorMessage: string | null
}) {
  if (status === "COMPLETED") {
    return (
      <div className="max-h-[60vh] overflow-y-auto rounded-md border bg-muted/30 p-4">
        <p className="whitespace-pre-wrap text-sm leading-relaxed">
          {polishedContent ?? "No polished content available."}
        </p>
      </div>
    )
  }

  if (status === "QUEUED") {
    return (
      <p className="text-sm text-muted-foreground">
        Translation is queued and has not started yet.
      </p>
    )
  }

  if (status === "PROCESSING") {
    return (
      <p className="text-sm text-muted-foreground">
        Translation in progress ({progressPct}%). Check back when complete.
      </p>
    )
  }

  return (
    <div className="flex flex-col gap-2 text-sm">
      {errorMessage ? (
        <p className="text-destructive">{errorMessage}</p>
      ) : null}
      <p className="text-muted-foreground">
        Use the Retry button on the translation list to run this job again.
      </p>
    </div>
  )
}

export function TranslationReviewModal({
  open,
  onOpenChange,
  translationId,
}: TranslationReviewModalProps) {
  const translationQuery = trpc.translations.getById.useQuery(
    { id: translationId ?? "" },
    { enabled: open && !!translationId },
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
              status={translation.status}
              progressPct={translation.progressPct}
              polishedContent={translation.polishedContent}
              errorMessage={translation.errorMessage}
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
