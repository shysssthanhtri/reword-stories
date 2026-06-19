import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import { buildNovelListUrl, type NovelListParams } from "@/lib/novel-list-url"

type NovelListPaginationProps = {
  page: number
  pageSize: number
  totalCount: number
  listParams: NovelListParams
}

export function NovelListPagination({
  page,
  pageSize,
  totalCount,
  listParams,
}: NovelListPaginationProps) {
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
                href={buildNovelListUrl({ ...listParams, page: page - 1 })}
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
                href={buildNovelListUrl({ ...listParams, page: page + 1 })}
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

export function NovelListNoResults({ query }: { query: string }) {
  return (
    <div className="rounded-lg border px-4 py-8 text-center text-sm text-muted-foreground">
      No novels match &ldquo;{query}&rdquo;.
    </div>
  )
}
