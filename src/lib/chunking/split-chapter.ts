import { countTextTokens, hardSplitByTokens } from "@/lib/chunking/token-utils"

export const DEFAULT_MAX_CHUNK_TOKENS = 1800

function splitParagraphIntoSentences(paragraph: string): string[] {
  const parts = paragraph.split(/(?<=\. )/)
  return parts.map((part) => part.trim()).filter((part) => part.length > 0)
}

function splitOversizedText(text: string, maxTokens: number): string[] {
  if (countTextTokens(text) <= maxTokens) {
    return [text]
  }

  const sentences = splitParagraphIntoSentences(text)
  if (sentences.length <= 1) {
    return hardSplitByTokens(text, maxTokens)
  }

  const slices: string[] = []
  let current = ""

  for (const sentence of sentences) {
    const candidate = current ? `${current} ${sentence}` : sentence

    if (countTextTokens(candidate) <= maxTokens) {
      current = candidate
      continue
    }

    if (current) {
      slices.push(current)
    }

    if (countTextTokens(sentence) <= maxTokens) {
      current = sentence
      continue
    }

    slices.push(...hardSplitByTokens(sentence, maxTokens))
    current = ""
  }

  if (current) {
    slices.push(current)
  }

  return slices
}

function packUnits(units: string[], maxTokens: number): string[] {
  const chunks: string[] = []
  let current = ""

  for (const unit of units) {
    const candidate = current ? `${current}\n\n${unit}` : unit

    if (countTextTokens(candidate) <= maxTokens) {
      current = candidate
      continue
    }

    if (current) {
      chunks.push(current)
    }

    if (countTextTokens(unit) <= maxTokens) {
      current = unit
      continue
    }

    const oversizedSlices = splitOversizedText(unit, maxTokens)
    chunks.push(...oversizedSlices.slice(0, -1))
    current = oversizedSlices.at(-1) ?? ""
  }

  if (current) {
    chunks.push(current)
  }

  return chunks
}

export function splitIntoChunks(
  rawContent: string,
  maxTokens = DEFAULT_MAX_CHUNK_TOKENS,
): string[] {
  const trimmed = rawContent.trim()

  if (!trimmed) {
    return []
  }

  if (countTextTokens(trimmed) <= maxTokens) {
    return [trimmed]
  }

  const paragraphs = trimmed
    .split(/\n\n+/)
    .map((paragraph) => paragraph.trim())
    .filter((paragraph) => paragraph.length > 0)

  if (paragraphs.length === 0) {
    return splitOversizedText(trimmed, maxTokens)
  }

  return packUnits(paragraphs, maxTokens)
}
