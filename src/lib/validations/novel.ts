import { z } from "zod"

export const sourceLanguageSchema = z.enum(["ko", "ja", "zh", "vi", "other"])

export const createNovelSchema = z.object({
  title: z.string().trim().min(1).max(200),
  sourceLanguage: sourceLanguageSchema,
})

export const novelIdInputSchema = z.object({
  id: z.string().min(1),
})

export const novelListSortBySchema = z.enum(["createdAt", "chapterCount"])
export const novelListSortDirSchema = z.enum(["asc", "desc"])

export const novelListInputSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(10),
  q: z
    .string()
    .trim()
    .transform((value) => (value.length > 0 ? value : undefined))
    .optional(),
  sortBy: novelListSortBySchema.default("createdAt"),
  sortDir: novelListSortDirSchema.default("desc"),
})

export type NovelListInput = z.infer<typeof novelListInputSchema>

export function parseNovelListSearchParams(
  searchParams: Record<string, string | string[] | undefined>
): NovelListInput {
  const get = (key: string) => {
    const value = searchParams[key]
    return Array.isArray(value) ? value[0] : value
  }

  return novelListInputSchema.parse({
    page: get("page"),
    pageSize: get("pageSize"),
    q: get("q"),
    sortBy: get("sortBy"),
    sortDir: get("sortDir"),
  })
}

export const SOURCE_LANGUAGES = [
  { value: "ko", label: "Korean" },
  { value: "ja", label: "Japanese" },
  { value: "zh", label: "Chinese" },
  { value: "vi", label: "Vietnamese" },
  { value: "other", label: "Other" },
] as const

export type SourceLanguage = z.infer<typeof sourceLanguageSchema>

export function getSourceLanguageLabel(value: string): string {
  return (
    SOURCE_LANGUAGES.find((language) => language.value === value)?.label ??
    value
  )
}
