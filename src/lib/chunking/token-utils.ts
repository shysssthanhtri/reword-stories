import { countTokens, decode, encode } from "gpt-tokenizer"

export function countTextTokens(text: string): number {
  return countTokens(text)
}

export function truncateToTokenLimit(text: string, maxTokens: number): string {
  if (countTokens(text) <= maxTokens) {
    return text
  }

  const tokens = encode(text)
  return decode(tokens.slice(-maxTokens))
}

export function hardSplitByTokens(text: string, maxTokens: number): string[] {
  const tokens = encode(text)
  const slices: string[] = []

  for (let index = 0; index < tokens.length; index += maxTokens) {
    slices.push(decode(tokens.slice(index, index + maxTokens)))
  }

  return slices.filter((slice) => slice.length > 0)
}
