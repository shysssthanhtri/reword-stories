import {
  getSourceLanguageLabel,
  type SourceLanguage,
} from "@/lib/validations/novel"

const SOURCE_LANGUAGE_HINTS: Record<SourceLanguage, string | null> = {
  ko: "Watch for honorifics, topic-prominent word order, and literal hanja or name transliterations.",
  ja: "Watch for honorifics, sentence-final particles rendered literally, and name order artifacts.",
  zh: "Watch for measure words, idioms translated word-for-word, and name transliterations.",
  vi: "Watch for classifier phrases, pronoun repetition, and literal idiom translations.",
  other: null,
}

function resolveSourceLanguage(sourceLanguage: string): SourceLanguage {
  return sourceLanguage in SOURCE_LANGUAGE_HINTS
    ? (sourceLanguage as SourceLanguage)
    : "other"
}

export function buildPostEditSystemPrompt(sourceLanguage: string): string {
  const resolved = resolveSourceLanguage(sourceLanguage)
  const label = getSourceLanguageLabel(resolved)
  const hint = SOURCE_LANGUAGE_HINTS[resolved]

  const originLine =
    resolved === "other"
      ? "The novel's original language is not specified."
      : `The novel's original language is ${label}.`

  const outputLanguageLine =
    resolved === "other"
      ? "Reword the passage into smooth, natural prose in the same language as the input. Do not translate to another language."
      : `Reword the passage into smooth, natural ${label} prose. Stay in ${label} — do not translate to another language.`

  const hintBlock = hint ? `\n\nContext: ${hint}` : ""

  return `You are a professional literary post-editor. ${originLine} The user will give you a passage that may be rough machine translation or awkward wording in that language.

Your job is rewording, not translation. ${outputLanguageLine} Preserve the full meaning, plot beats, character names, and tone. Fix awkward phrasing so the text reads like natural fiction. Do not summarize, omit, or add new story content. Do not explain your edits.${hintBlock}`
}

export function buildPostEditUserMessage(
  text: string,
  sourceLanguage: string,
  contextOverlap?: string,
): string {
  const resolved = resolveSourceLanguage(sourceLanguage)
  const label = getSourceLanguageLabel(resolved)

  const languageInstruction =
    resolved === "other"
      ? "Reword the following passage into smooth prose in its original language (do not translate):"
      : `Reword the following passage into smooth ${label} prose (stay in ${label}, do not translate):`

  const sections: string[] = []

  if (contextOverlap?.trim()) {
    sections.push(
      `Previous paragraph (for continuity only — do not rewrite):\n${contextOverlap.trim()}`,
    )
  }

  sections.push(`${languageInstruction}\n\n${text}`)

  return sections.join("\n\n")
}
