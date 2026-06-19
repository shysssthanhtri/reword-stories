import { send } from "@vercel/queue"

import { TRANSLATION_QUEUE_LOG_PREFIX } from "@/lib/queue/log-prefix"

export const TRANSLATION_CHUNK_TOPIC = "translation-chunk"

export type TranslationChunkMessage = {
  translationId: string
}

export async function kickoffTranslation(translationId: string) {
  console.log(TRANSLATION_QUEUE_LOG_PREFIX, "kickoff", { translationId })
  await send<TranslationChunkMessage>(
    TRANSLATION_CHUNK_TOPIC,
    { translationId },
    {
      idempotencyKey: `${translationId}-kickoff`,
    },
  )
}

export async function chainNextChunk(
  translationId: string,
  chunkIndex: number,
) {
  console.log(TRANSLATION_QUEUE_LOG_PREFIX, "chain publish", {
    translationId,
    chunkIndex,
  })
  await send<TranslationChunkMessage>(
    TRANSLATION_CHUNK_TOPIC,
    { translationId },
    {
      idempotencyKey: `${translationId}-${chunkIndex}`,
    },
  )
}
