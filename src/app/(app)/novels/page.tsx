import {
  NovelLibraryHeader,
  NovelListEmptyState,
} from "@/components/novels/novel-list"
import {
  NovelListNoResults,
  NovelListPagination,
} from "@/components/novels/novel-list-pagination"
import { NovelListSearch } from "@/components/novels/novel-list-search"
import { NovelListTable } from "@/components/novels/novel-list-table"
import type { NovelListParams } from "@/lib/novel-list-url"
import { parseNovelListSearchParams } from "@/lib/validations/novel"
import { api } from "@/trpc/server"

type NovelsPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

export default async function NovelsPage({ searchParams }: NovelsPageProps) {
  const input = parseNovelListSearchParams(await searchParams)
  const caller = await api()
  const result = await caller.novels.list(input)

  const listParams: NovelListParams = {
    page: result.page,
    pageSize: result.pageSize,
    q: input.q,
    sortBy: input.sortBy,
    sortDir: input.sortDir,
  }

  const isEmptyLibrary = result.totalCount === 0 && !input.q

  return (
    <div className="flex flex-col gap-6">
      <NovelLibraryHeader />
      {isEmptyLibrary ? (
        <NovelListEmptyState />
      ) : (
        <>
          <NovelListSearch defaultValue={input.q ?? ""} listParams={listParams} />
          {result.totalCount === 0 && input.q ? (
            <NovelListNoResults query={input.q} />
          ) : (
            <>
              <NovelListTable items={result.items} listParams={listParams} />
              <NovelListPagination
                page={result.page}
                pageSize={result.pageSize}
                totalCount={result.totalCount}
                listParams={listParams}
              />
            </>
          )}
        </>
      )}
    </div>
  )
}
