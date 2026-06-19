import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import {
  buildChapterListUrl,
  type ChapterListParams,
} from "@/lib/chapter-list-url"

type ChapterListPaginationProps = {
  novelId: string
  page: number
  pageSize: number
  totalCount: number
  listParams: ChapterListParams
}

export function ChapterListPagination({
  novelId,
  page,
  pageSize,
  totalCount,
  listParams,
}: ChapterListPaginationProps) {
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize))
  const hasPrevious = page > 1
  const hasNext = page < totalPages

  if (totalCount <= pageSize) {
    return null
  }

  return (
    <div className="flex items-center justify-between gap-4">
      <p className="text-sm text-muted-foreground">
        Page {page} of {totalPages}
      </p>
      <Pagination className="mx-0 w-auto justify-end">
        <PaginationContent>
          <PaginationItem>
            {hasPrevious ? (
              <PaginationPrevious
                href={buildChapterListUrl(novelId, {
                  ...listParams,
                  page: page - 1,
                })}
              />
            ) : (
              <PaginationPrevious
                href="#"
                aria-disabled
                className="pointer-events-none opacity-50"
              />
            )}
          </PaginationItem>
          <PaginationItem>
            {hasNext ? (
              <PaginationNext
                href={buildChapterListUrl(novelId, {
                  ...listParams,
                  page: page + 1,
                })}
              />
            ) : (
              <PaginationNext
                href="#"
                aria-disabled
                className="pointer-events-none opacity-50"
              />
            )}
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
  )
}

export function ChapterListNoResults({ query }: { query: string }) {
  return (
    <div className="rounded-lg border px-4 py-8 text-center text-sm text-muted-foreground">
      No chapters match &ldquo;{query}&rdquo;.
    </div>
  )
}
