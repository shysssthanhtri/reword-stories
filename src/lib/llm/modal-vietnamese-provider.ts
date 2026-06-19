import { env } from "@/env"
import {
  DEFAULT_MODAL_VIETNAMESE_MODEL_ID,
  MODAL_VIETNAMESE_MODELS,
  MODAL_VIETNAMESE_PROVIDER_ID,
} from "@/lib/llm/models"
import type { PolishParams, PolishResult, TranslationProvider } from "@/lib/llm/types"
import { buildCorrectionInput, correctText } from "@/lib/modal-vietnamese"

function assertModalConfig() {
  if (!env.MODAL_VIETNAMESE_API_URL || !env.MODAL_VIETNAMESE_API_KEY) {
    throw new Error(
      "Missing Modal Vietnamese correction configuration. Set MODAL_VIETNAMESE_API_URL and MODAL_VIETNAMESE_API_KEY in .env.",
    )
  }
}

async function polish(params: PolishParams): Promise<PolishResult> {
  assertModalConfig()

  const polishedText = await correctText({
    text: buildCorrectionInput(params.text, params.contextOverlap),
  })

  return { polishedText }
}

export const modalVietnameseProvider: TranslationProvider = {
  id: MODAL_VIETNAMESE_PROVIDER_ID,
  label: "Vietnamese Correction (Modal)",
  models: MODAL_VIETNAMESE_MODELS,
  polish,
}

export { DEFAULT_MODAL_VIETNAMESE_MODEL_ID }
