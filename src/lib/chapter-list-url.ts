import { routes } from "@/configs/routes"

export type ChapterListSortBy = "sortOrder" | "createdAt"
export type ChapterListSortDir = "asc" | "desc"

export type ChapterListParams = {
  page?: number
  pageSize?: number
  q?: string
  sortBy?: ChapterListSortBy
  sortDir?: ChapterListSortDir
}

export const CHAPTER_LIST_DEFAULTS = {
  page: 1,
  pageSize: 10,
  sortBy: "sortOrder" as ChapterListSortBy,
  sortDir: "asc" as ChapterListSortDir,
}

export function buildChapterListUrl(
  novelId: string,
  params: ChapterListParams = {}
): string {
  const page = params.page ?? CHAPTER_LIST_DEFAULTS.page
  const pageSize = params.pageSize ?? CHAPTER_LIST_DEFAULTS.pageSize
  const sortBy = params.sortBy ?? CHAPTER_LIST_DEFAULTS.sortBy
  const sortDir = params.sortDir ?? CHAPTER_LIST_DEFAULTS.sortDir

  const searchParams = new URLSearchParams()

  if (params.q) {
    searchParams.set("q", params.q)
  }

  if (page > 1) {
    searchParams.set("page", String(page))
  }

  if (pageSize !== CHAPTER_LIST_DEFAULTS.pageSize) {
    searchParams.set("pageSize", String(pageSize))
  }

  if (
    sortBy !== CHAPTER_LIST_DEFAULTS.sortBy ||
    sortDir !== CHAPTER_LIST_DEFAULTS.sortDir
  ) {
    searchParams.set("sortBy", sortBy)
    searchParams.set("sortDir", sortDir)
  }

  const query = searchParams.toString()
  const base = routes.novelDetail(novelId)
  return query ? `${base}?${query}` : base
}

export function getChapterListSortUrl(
  column: ChapterListSortBy,
  novelId: string,
  current: ChapterListParams
): string {
  const isActive = current.sortBy === column
  const defaultDir: ChapterListSortDir =
    column === "sortOrder" ? "asc" : "desc"

  return buildChapterListUrl(novelId, {
    ...current,
    sortBy: column,
    sortDir: isActive
      ? current.sortDir === "asc"
        ? "desc"
        : "asc"
      : defaultDir,
    page: 1,
  })
}
