"use client"

import type { inferRouterOutputs } from "@trpc/server"

import { ChunkStatusBadge } from "@/components/translations/chunk-status-badge"
import { Button } from "@/components/ui/button"
import type { AppRouter } from "@/server/trpc/router"

export type TranslationChunkSummary =
  inferRouterOutputs<AppRouter>["translations"]["listByChapter"][number]["chunks"][number]

type TranslationChunkListProps = {
  chunks: TranslationChunkSummary[]
  onRetryChunk?: (chunkId: string) => void
  retryingChunkId?: string | null
  showRetry?: boolean
}

export function TranslationChunkList({
  chunks,
  onRetryChunk,
  retryingChunkId,
  showRetry = true,
}: TranslationChunkListProps) {
  if (chunks.length === 0) {
    return null
  }

  return (
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
          {showRetry && chunk.status === "FAILED" && onRetryChunk ? (
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
}
