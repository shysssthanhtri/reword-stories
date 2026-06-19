"use client"

import type { inferRouterOutputs } from "@trpc/server"
import { ChevronDownIcon } from "lucide-react"

import { ChunkStatusBadge } from "@/components/translations/chunk-status-badge"
import { Button } from "@/components/ui/button"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { cn } from "@/lib/utils"
import type { AppRouter } from "@/server/trpc/router"

export type TranslationChunkSummary =
  inferRouterOutputs<AppRouter>["translations"]["listByChapter"][number]["chunks"][number]

type TranslationChunkListProps = {
  chunks: TranslationChunkSummary[]
  onRetryChunk?: (chunkId: string) => void
  retryingChunkId?: string | null
  showRetry?: boolean
  collapsible?: boolean
}

export function TranslationChunkList({
  chunks,
  onRetryChunk,
  retryingChunkId,
  showRetry = true,
  collapsible = true,
}: TranslationChunkListProps) {
  if (chunks.length === 0) {
    return null
  }

  const chunkRows = (
    <ul className="flex flex-col gap-1.5 border-t pt-2">
      {chunks.map((chunk) => (
        <li
          key={chunk.id}
          className="flex flex-wrap items-center justify-between gap-2 text-sm"
        >
          <div className="flex min-w-0 flex-1 flex-col gap-0.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-muted-foreground">
                Chunk {chunk.chunkIndex + 1}
              </span>
              <ChunkStatusBadge status={chunk.status} />
            </div>
            {chunk.status === "FAILED" && chunk.errorMessage ? (
              <p className="text-xs text-destructive">{chunk.errorMessage}</p>
            ) : null}
          </div>
          {showRetry && onRetryChunk ? (
            <Button
              size="sm"
              variant="outline"
              disabled={retryingChunkId === chunk.id}
              onClick={(event) => {
                event.stopPropagation()
                onRetryChunk(chunk.id)
              }}
            >
              {retryingChunkId === chunk.id ? "Retrying..." : "Retry"}
            </Button>
          ) : null}
        </li>
      ))}
    </ul>
  )

  if (!collapsible) {
    return chunkRows
  }

  return (
    <Collapsible defaultOpen={false}>
      <CollapsibleTrigger
        className={cn(
          "group/trigger flex w-full items-center gap-2 text-sm text-muted-foreground outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
        )}
        onClick={(event) => {
          event.stopPropagation()
        }}
      >
        <ChevronDownIcon
          aria-hidden
          className="size-4 shrink-0 transition-transform group-aria-expanded/trigger:rotate-180"
        />
        <span className="group-aria-expanded/trigger:hidden">
          Show chunks ({chunks.length})
        </span>
        <span className="hidden group-aria-expanded/trigger:inline">Hide chunks</span>
      </CollapsibleTrigger>
      <CollapsibleContent>{chunkRows}</CollapsibleContent>
    </Collapsible>
  )
}
