import { env } from "@/env"
import {
  DEFAULT_MODAL_VIETNAMESE_MODEL_ID,
  MODAL_VIETNAMESE_MODELS,
  MODAL_VIETNAMESE_PROVIDER_ID,
} from "@/lib/llm/models"
import type { PolishParams, PolishResult, TranslationProvider } from "@/lib/llm/types"

const MAX_INPUT_CHARS = 2000

type CorrectResponse = {
  corrected_text: string
}

function assertModalConfig() {
  if (!env.MODAL_VIETNAMESE_API_URL || !env.MODAL_VIETNAMESE_API_KEY) {
    throw new Error(
      "Missing Modal Vietnamese correction configuration. Set MODAL_VIETNAMESE_API_URL and MODAL_VIETNAMESE_API_KEY in .env.",
    )
  }
}

function buildInputText(text: string, contextOverlap?: string): string {
  const combined = contextOverlap ? `${contextOverlap}\n${text}` : text

  if (combined.length <= MAX_INPUT_CHARS) {
    return combined
  }

  return combined.slice(-MAX_INPUT_CHARS)
}

function resolveCorrectUrl(baseUrl: string): string {
  const normalized = baseUrl.replace(/\/$/, "")
  return `${normalized}/correct`
}

async function polish(params: PolishParams): Promise<PolishResult> {
  assertModalConfig()

  const response = await fetch(resolveCorrectUrl(env.MODAL_VIETNAMESE_API_URL!), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Api-Key": env.MODAL_VIETNAMESE_API_KEY!,
    },
    body: JSON.stringify({
      text: buildInputText(params.text, params.contextOverlap),
    }),
  })

  if (!response.ok) {
    const detail = await response.text()
    throw new Error(
      `Modal Vietnamese correction failed (${response.status}): ${detail || response.statusText}`,
    )
  }

  const data = (await response.json()) as CorrectResponse

  return {
    polishedText: data.corrected_text.trim(),
  }
}

export const modalVietnameseProvider: TranslationProvider = {
  id: MODAL_VIETNAMESE_PROVIDER_ID,
  label: "Vietnamese Correction (Modal)",
  models: MODAL_VIETNAMESE_MODELS,
  polish,
}

export { DEFAULT_MODAL_VIETNAMESE_MODEL_ID }
