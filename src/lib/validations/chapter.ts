import { z } from "zod"

export const createChapterSchema = z.object({
  title: z.string().trim().max(200),
  rawContent: z.string().trim().min(1).max(100_000),
})

export const createChapterInputSchema = createChapterSchema.extend({
  novelId: z.string(),
})

export const chapterListSortBySchema = z.enum(["sortOrder", "createdAt"])
export const chapterListSortDirSchema = z.enum(["asc", "desc"])

export const chapterListInputSchema = z.object({
  novelId: z.string(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(10),
  q: z
    .string()
    .trim()
    .transform((value) => (value.length > 0 ? value : undefined))
    .optional(),
  sortBy: chapterListSortBySchema.default("sortOrder"),
  sortDir: chapterListSortDirSchema.default("asc"),
})

export type ChapterListInput = z.infer<typeof chapterListInputSchema>

export const chapterListSearchParamsSchema = chapterListInputSchema.omit({
  novelId: true,
})

export type ChapterListSearchParams = z.infer<
  typeof chapterListSearchParamsSchema
>

export function parseChapterListSearchParams(
  searchParams: Record<string, string | string[] | undefined>
): ChapterListSearchParams {
  const get = (key: string) => {
    const value = searchParams[key]
    return Array.isArray(value) ? value[0] : value
  }

  return chapterListSearchParamsSchema.parse({
    page: get("page"),
    pageSize: get("pageSize"),
    q: get("q"),
    sortBy: get("sortBy"),
    sortDir: get("sortDir"),
  })
}

export function getDefaultChapterTitle(sortOrder: number): string {
  return `Chapter ${sortOrder + 1}`
}

export function getChapterDisplayTitle(chapter: {
  title: string | null
  sortOrder: number
}): string {
  return chapter.title ?? getDefaultChapterTitle(chapter.sortOrder)
}
