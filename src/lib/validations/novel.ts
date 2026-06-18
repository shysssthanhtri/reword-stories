import { z } from "zod"

export const sourceLanguageSchema = z.enum(["ko", "ja", "zh", "vi", "other"])

export const createNovelSchema = z.object({
  title: z.string().trim().min(1).max(200),
  sourceLanguage: sourceLanguageSchema,
})

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
