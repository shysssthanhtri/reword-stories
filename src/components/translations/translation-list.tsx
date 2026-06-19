"use client"

import type { inferRouterOutputs } from "@trpc/server"
import Link from "next/link"
import { useState } from "react"

import { TranslationReviewModal } from "@/components/translations/translation-review-modal"
import { TranslationStatusBadge } from "@/components/translations/translation-status-badge"
import { Button } from "@/components/ui/button"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty"
import { routes } from "@/configs/routes"
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
  const utils = trpc.useUtils()
  const retryTranslation = trpc.translations.retry.useMutation({
    onSuccess: async () => {
      await utils.translations.listByChapter.invalidate({ chapterId })
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
        {translations.map((translation) => (
          <li
            key={translation.id}
            className="flex cursor-pointer flex-col gap-2 rounded-lg border p-4 transition-colors hover:bg-muted/50"
            onClick={() => setSelectedTranslationId(translation.id)}
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

            {translation.status === "FAILED" && translation.errorMessage ? (
              <p className="text-sm text-destructive">
                {translation.errorMessage}
              </p>
            ) : null}

            {translation.status === "FAILED" ? (
              <div>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={retryTranslation.isPending}
                  onClick={(event) => {
                    event.stopPropagation()
                    retryTranslation.mutate({ id: translation.id })
                  }}
                >
                  {retryTranslation.isPending ? "Retrying..." : "Retry"}
                </Button>
              </div>
            ) : null}
          </li>
        ))}
      </ul>

      <TranslationReviewModal
        open={selectedTranslationId !== null}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedTranslationId(null)
          }
        }}
        translationId={selectedTranslationId}
      />
    </>
  )
}
