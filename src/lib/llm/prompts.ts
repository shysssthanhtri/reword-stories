import type { SourceLanguage } from "@/lib/validations/novel"

const SOURCE_LANGUAGE_HINTS: Record<SourceLanguage, string | null> = {
  ko: "The original text was machine-translated from Korean. Watch for honorifics, topic-prominent word order, and literal hanja or name transliterations.",
  ja: "The original text was machine-translated from Japanese. Watch for honorifics, sentence-final particles rendered literally, and name order artifacts.",
  zh: "The original text was machine-translated from Chinese. Watch for measure words, idioms translated word-for-word, and name transliterations.",
  vi: "The original text was machine-translated from Vietnamese. Watch for classifier phrases, pronoun repetition, and literal idiom translations.",
  other: null,
}

export function buildPostEditSystemPrompt(sourceLanguage: string): string {
  const hint =
    sourceLanguage in SOURCE_LANGUAGE_HINTS
      ? SOURCE_LANGUAGE_HINTS[sourceLanguage as SourceLanguage]
      : SOURCE_LANGUAGE_HINTS.other

  const languageContext = hint
    ? `\n\nContext: ${hint}`
    : ""

  return `You are a professional literary post-editor. The user will give you a passage of already-machine-translated English prose from a novel.

Your job is post-editing, not translation. Preserve the full meaning, plot beats, character names, and tone. Fix awkward machine-translation phrasing so the text reads like natural English fiction. Do not summarize, omit, or add new story content. Do not explain your edits.${languageContext}`
}

export function buildPostEditUserMessage(
  text: string,
  contextOverlap?: string,
): string {
  const sections: string[] = []

  if (contextOverlap?.trim()) {
    sections.push(
      `Previous paragraph (for continuity only — do not rewrite):\n${contextOverlap.trim()}`,
    )
  }

  sections.push(
    `Rewrite the following machine-translated passage into smooth English prose:\n\n${text}`,
  )

  return sections.join("\n\n")
}
