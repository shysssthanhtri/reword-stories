import { createGateway, generateText } from "ai"

import { env } from "@/env"
import { GATEWAY_MODELS, GATEWAY_PROVIDER_ID } from "@/lib/llm/models"
import {
  buildPostEditSystemPrompt,
  buildPostEditUserMessage,
} from "@/lib/llm/prompts"
import type { PolishParams, PolishResult, TranslationProvider } from "@/lib/llm/types"

function createGatewayClient() {
  if (env.AI_GATEWAY_API_KEY) {
    return createGateway({ apiKey: env.AI_GATEWAY_API_KEY })
  }

  return createGateway()
}

function assertGatewayAuth() {
  if (env.AI_GATEWAY_API_KEY) {
    return
  }

  if (process.env.VERCEL === "1") {
    return
  }

  throw new Error(
    "Missing AI Gateway authentication. Set AI_GATEWAY_API_KEY in .env for local development.",
  )
}

async function polish(params: PolishParams): Promise<PolishResult> {
  assertGatewayAuth()

  const gateway = createGatewayClient()
  const { text, usage } = await generateText({
    model: gateway(params.modelId),
    system: buildPostEditSystemPrompt(params.sourceLanguage),
    prompt: buildPostEditUserMessage(params.text, params.contextOverlap),
    temperature: 0.3,
  })

  const input = usage?.inputTokens ?? 0
  const output = usage?.outputTokens ?? 0
  const total = usage?.totalTokens ?? input + output

  return {
    polishedText: text.trim(),
    tokenUsage:
      total > 0
        ? {
            input,
            output,
            total,
          }
        : undefined,
  }
}

export const gatewayProvider: TranslationProvider = {
  id: GATEWAY_PROVIDER_ID,
  label: "AI Gateway",
  models: GATEWAY_MODELS,
  polish,
}
