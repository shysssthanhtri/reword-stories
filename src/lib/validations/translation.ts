import { z } from "zod"

import { getProvider, listProviders } from "@/lib/llm/providers"

export const createTranslationSchema = z
  .object({
    provider: z.string().min(1),
    modelName: z.string().min(1),
  })
  .superRefine((value, context) => {
    let provider

    try {
      provider = getProvider(value.provider)
    } catch {
      context.addIssue({
        code: "custom",
        message: "Unknown provider",
        path: ["provider"],
      })
      return
    }

    const modelExists = provider.models.some(
      (model) => model.id === value.modelName,
    )

    if (!modelExists) {
      context.addIssue({
        code: "custom",
        message: "Invalid model for provider",
        path: ["modelName"],
      })
    }
  })

export const createTranslationInputSchema = createTranslationSchema.extend({
  chapterId: z.string().min(1),
})

export const estimateChunksInputSchema = z.object({
  chapterId: z.string().min(1),
})

export const translationIdInputSchema = z.object({
  id: z.string().min(1),
})

export const retryChunkInputSchema = z.object({
  translationId: z.string().min(1),
  chunkId: z.string().min(1),
})

export const listByChapterInputSchema = z.object({
  chapterId: z.string().min(1),
})

export function getProviderOptions() {
  return listProviders().map((provider) => ({
    id: provider.id,
    label: provider.label,
    models: provider.models,
  }))
}

export function getProviderLabel(providerId: string): string {
  try {
    return getProvider(providerId).label
  } catch {
    return providerId
  }
}

export function getModelLabel(providerId: string, modelId: string): string {
  try {
    const provider = getProvider(providerId)
    return provider.models.find((model) => model.id === modelId)?.label ?? modelId
  } catch {
    return modelId
  }
}
