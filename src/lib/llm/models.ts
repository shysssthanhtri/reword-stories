import type { ModelOption } from "@/lib/llm/types"

export const GATEWAY_PROVIDER_ID = "gateway"

export const GATEWAY_MODELS: ModelOption[] = [
  {
    id: "google/gemini-2.5-flash-lite",
    label: "Gemini 2.5 Flash Lite",
    isFree: true,
  },
  {
    id: "google/gemini-2.5-flash",
    label: "Gemini 2.5 Flash",
    isFree: true,
  },
  { id: "openai/gpt-4o", label: "GPT-4o" },
  { id: "openai/gpt-4o-mini", label: "GPT-4o Mini" },
  { id: "anthropic/claude-sonnet-4.6", label: "Claude Sonnet 4.6" },
]

export const DEFAULT_GATEWAY_MODEL_ID = "google/gemini-2.5-flash-lite"

export const MODAL_VIETNAMESE_PROVIDER_ID = "modal-vietnamese"

export const MODAL_VIETNAMESE_MODELS: ModelOption[] = [
  {
    id: "bmd1905/vietnamese-correction-v2",
    label: "Vietnamese Correction v2",
    isFree: true,
  },
]

export const DEFAULT_MODAL_VIETNAMESE_MODEL_ID =
  "bmd1905/vietnamese-correction-v2"
