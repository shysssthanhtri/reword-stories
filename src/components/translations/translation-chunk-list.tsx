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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
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

  const chunkTable = (
    <div className="border-t pt-2">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Chunk</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Error</TableHead>
            {showRetry && onRetryChunk ? (
              <TableHead className="text-right">Actions</TableHead>
            ) : null}
          </TableRow>
        </TableHeader>
        <TableBody>
          {chunks.map((chunk) => (
            <TableRow key={chunk.id}>
              <TableCell className="text-muted-foreground">
                {chunk.chunkIndex + 1}
              </TableCell>
              <TableCell>
                <ChunkStatusBadge status={chunk.status} />
              </TableCell>
              <TableCell className="max-w-xs whitespace-normal wrap-break-word text-xs text-destructive">
                {chunk.status === "FAILED" && chunk.errorMessage
                  ? chunk.errorMessage
                  : null}
              </TableCell>
              {showRetry && onRetryChunk ? (
                <TableCell className="text-right">
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
                </TableCell>
              ) : null}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )

  if (!collapsible) {
    return chunkTable
  }

  return (
    <Collapsible defaultOpen={false}>
      <CollapsibleTrigger
        className={cn(
          "group/trigger flex w-full cursor-pointer items-center gap-2 rounded-sm text-sm text-muted-foreground outline-none transition-colors hover:bg-muted/50 hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50",
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
      <CollapsibleContent>{chunkTable}</CollapsibleContent>
    </Collapsible>
  )
}
