import { routes } from "@/configs/routes"

export type NovelListSortBy = "createdAt" | "chapterCount"
export type NovelListSortDir = "asc" | "desc"

export type NovelListParams = {
  page?: number
  pageSize?: number
  q?: string
  sortBy?: NovelListSortBy
  sortDir?: NovelListSortDir
}

export const NOVEL_LIST_DEFAULTS = {
  page: 1,
  pageSize: 10,
  sortBy: "createdAt" as NovelListSortBy,
  sortDir: "desc" as NovelListSortDir,
}

export function buildNovelListUrl(params: NovelListParams = {}): string {
  const page = params.page ?? NOVEL_LIST_DEFAULTS.page
  const pageSize = params.pageSize ?? NOVEL_LIST_DEFAULTS.pageSize
  const sortBy = params.sortBy ?? NOVEL_LIST_DEFAULTS.sortBy
  const sortDir = params.sortDir ?? NOVEL_LIST_DEFAULTS.sortDir

  const searchParams = new URLSearchParams()

  if (params.q) {
    searchParams.set("q", params.q)
  }

  if (page > 1) {
    searchParams.set("page", String(page))
  }

  if (pageSize !== NOVEL_LIST_DEFAULTS.pageSize) {
    searchParams.set("pageSize", String(pageSize))
  }

  if (
    sortBy !== NOVEL_LIST_DEFAULTS.sortBy ||
    sortDir !== NOVEL_LIST_DEFAULTS.sortDir
  ) {
    searchParams.set("sortBy", sortBy)
    searchParams.set("sortDir", sortDir)
  }

  const query = searchParams.toString()
  return query ? `${routes.novels}?${query}` : routes.novels
}

export function getNovelListSortUrl(
  column: NovelListSortBy,
  current: NovelListParams
): string {
  const isActive = current.sortBy === column
  const nextDir: NovelListSortDir =
    isActive && current.sortDir === "desc" ? "asc" : "desc"

  return buildNovelListUrl({
    ...current,
    sortBy: column,
    sortDir: isActive ? nextDir : "desc",
    page: 1,
  })
}
