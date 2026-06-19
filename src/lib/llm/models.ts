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
