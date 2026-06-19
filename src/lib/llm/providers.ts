import { gatewayProvider } from "@/lib/llm/gateway-provider"
import { modalVietnameseProvider } from "@/lib/llm/modal-vietnamese-provider"
import type { TranslationProvider } from "@/lib/llm/types"

const providers = [
  gatewayProvider,
  modalVietnameseProvider,
] as const satisfies readonly TranslationProvider[]

const providerMap = new Map<string, TranslationProvider>(
  providers.map((provider) => [provider.id, provider]),
)

export function listProviders(): TranslationProvider[] {
  return [...providers]
}

export function getProvider(id: string): TranslationProvider {
  const provider = providerMap.get(id)

  if (!provider) {
    throw new Error(`Unknown translation provider: ${id}`)
  }

  return provider
}
