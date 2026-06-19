import type { SourceLanguage } from "@/lib/validations/novel"

export type ModelOption = {
  id: string
  label: string
  isFree?: boolean
}

export type PolishParams = {
  text: string
  sourceLanguage: SourceLanguage | string
  contextOverlap?: string
  modelId: string
}

export type TokenUsage = {
  input: number
  output: number
  total: number
}

export type PolishResult = {
  polishedText: string
  tokenUsage?: TokenUsage
}

export type TranslationProvider = {
  id: string
  label: string
  models: ModelOption[]
  polish(params: PolishParams): Promise<PolishResult>
}
