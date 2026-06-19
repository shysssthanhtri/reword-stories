import { z } from "zod"

export const createChapterSchema = z.object({
  title: z.string().trim().max(200),
  rawContent: z.string().trim().min(1).max(100_000),
})

export const createChapterInputSchema = createChapterSchema.extend({
  novelId: z.string(),
})
