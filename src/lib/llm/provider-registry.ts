import {
  GATEWAY_MODELS,
  GATEWAY_PROVIDER_ID,
  MODAL_VIETNAMESE_MODELS,
  MODAL_VIETNAMESE_PROVIDER_ID,
} from "@/lib/llm/models"
import type { ModelOption } from "@/lib/llm/types"

export type ProviderMetadata = {
  id: string
  label: string
  models: ModelOption[]
}

const providerRegistry: ProviderMetadata[] = [
  {
    id: GATEWAY_PROVIDER_ID,
    label: "AI Gateway",
    models: GATEWAY_MODELS,
  },
  {
    id: MODAL_VIETNAMESE_PROVIDER_ID,
    label: "Vietnamese Correction (Modal)",
    models: MODAL_VIETNAMESE_MODELS,
  },
]

const providerMap = new Map(providerRegistry.map((provider) => [provider.id, provider]))

export function listProviders(): ProviderMetadata[] {
  return [...providerRegistry]
}

export function getProvider(id: string): ProviderMetadata {
  const provider = providerMap.get(id)

  if (!provider) {
    throw new Error(`Unknown translation provider: ${id}`)
  }

  return provider
}
