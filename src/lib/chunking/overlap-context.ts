import { truncateToTokenLimit } from "@/lib/chunking/token-utils"

export const DEFAULT_MAX_OVERLAP_TOKENS = 500

export function extractOverlapContext(
  polishedSlice: string | null | undefined,
  maxTokens = DEFAULT_MAX_OVERLAP_TOKENS,
): string | undefined {
  if (!polishedSlice?.trim()) {
    return undefined
  }

  const paragraphs = polishedSlice
    .trim()
    .split(/\n\n+/)
    .map((paragraph) => paragraph.trim())
    .filter((paragraph) => paragraph.length > 0)

  const lastParagraph = paragraphs.at(-1)

  if (!lastParagraph) {
    return undefined
  }

  return truncateToTokenLimit(lastParagraph, maxTokens)
}
