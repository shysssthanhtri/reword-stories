import { handleCallback } from "@vercel/queue"

import { TRANSLATION_QUEUE_LOG_PREFIX } from "@/lib/queue/log-prefix"
import { processTranslationChunk } from "@/lib/queue/process-translation-chunk"
import type { TranslationChunkMessage } from "@/lib/queue/translation-queue"

export const maxDuration = 300

export const POST = handleCallback<TranslationChunkMessage>(
  async (message) => {
    console.log(TRANSLATION_QUEUE_LOG_PREFIX, "message received", {
      translationId: message.translationId,
    })
    await processTranslationChunk(message.translationId)
  },
  {
    visibilityTimeoutSeconds: 300,
    retry: () => ({ acknowledge: true }),
  },
)
