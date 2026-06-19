import "server-only"

import { createModalVietnameseClient } from "./client"
import type { components } from "./schema"

export type CorrectRequest = components["schemas"]["CorrectRequest"]

export type CorrectTextParams = Pick<CorrectRequest, "text"> & {
  max_length?: number
}

const MAX_INPUT_CHARS = 2000

export function buildCorrectionInput(text: string, contextOverlap?: string): string {
  const combined = contextOverlap ? `${contextOverlap}\n${text}` : text

  if (combined.length <= MAX_INPUT_CHARS) {
    return combined
  }

  return combined.slice(-MAX_INPUT_CHARS)
}

function formatModalVietnameseError(status: number, error: unknown): string {
  if (error !== undefined && error !== null) {
    return `Modal Vietnamese correction failed (${status}): ${JSON.stringify(error)}`
  }

  return `Modal Vietnamese correction failed (${status})`
}

export async function correctText(body: CorrectTextParams): Promise<string> {
  const { data, error, response } = await createModalVietnameseClient().POST("/correct", {
    body: body as CorrectRequest,
  })

  if (!response.ok || error) {
    throw new Error(formatModalVietnameseError(response.status, error))
  }

  if (!data?.corrected_text) {
    throw new Error("Modal Vietnamese correction returned empty corrected_text")
  }

  return data.corrected_text.trim()
}
