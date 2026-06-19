import type { TranslationChunk } from "@/generated/prisma/client"
import { assemblePolishedContent } from "@/lib/chunking/assemble-chunks"
import { extractOverlapContext } from "@/lib/chunking/overlap-context"
import { db } from "@/lib/db"
import { getErrorMessage } from "@/lib/llm/error-utils"
import { getProvider } from "@/lib/llm/providers"
import { TRANSLATION_QUEUE_LOG_PREFIX } from "@/lib/queue/log-prefix"
import {
  chainNextChunk,
} from "@/lib/queue/translation-queue"

async function finalizeTranslation(
  translationId: string,
  chunks: TranslationChunk[],
) {
  const polishedContent = assemblePolishedContent(chunks)

  await db.translation.update({
    where: { id: translationId },
    data: {
      status: "COMPLETED",
      progressPct: 100,
      polishedContent,
      errorMessage: null,
    },
  })
}

async function processTranslationChunk(translationId: string) {
  console.log(TRANSLATION_QUEUE_LOG_PREFIX, "started", { translationId })

  const translation = await db.translation.findUnique({
    where: { id: translationId },
    include: {
      chapter: {
        include: {
          novel: true,
        },
      },
      chunks: {
        orderBy: {
          chunkIndex: "asc",
        },
      },
    },
  })

  if (!translation) {
    console.warn(TRANSLATION_QUEUE_LOG_PREFIX, "translation not found", { translationId })
    return
  }

  const pendingChunk = translation.chunks.find(
    (chunk) => chunk.status === "PENDING" || chunk.status === "FAILED",
  )

  if (!pendingChunk) {
    const allCompleted = translation.chunks.every(
      (chunk) => chunk.status === "COMPLETED",
    )

    if (allCompleted && translation.status !== "COMPLETED") {
      console.log(TRANSLATION_QUEUE_LOG_PREFIX, "finalizing already-completed chunks", {
        translationId,
        chunkCount: translation.chunks.length,
      })
      await finalizeTranslation(translationId, translation.chunks)
    } else {
      console.log(TRANSLATION_QUEUE_LOG_PREFIX, "no pending chunk to process", {
        translationId,
        translationStatus: translation.status,
        chunkStatuses: translation.chunks.map((chunk) => ({
          index: chunk.chunkIndex,
          status: chunk.status,
        })),
      })
    }

    return
  }

  console.log(TRANSLATION_QUEUE_LOG_PREFIX, "processing chunk", {
    translationId,
    chunkIndex: pendingChunk.chunkIndex,
    chunkId: pendingChunk.id,
    totalChunks: translation.chunks.length,
    provider: translation.provider,
    modelName: translation.modelName,
  })

  await db.translation.update({
    where: { id: translationId },
    data: {
      status: "PROCESSING",
      errorMessage: null,
    },
  })

  const previousChunk = translation.chunks
    .filter(
      (chunk) =>
        chunk.chunkIndex < pendingChunk.chunkIndex &&
        chunk.status === "COMPLETED",
    )
    .at(-1)

  const contextOverlap = extractOverlapContext(previousChunk?.polishedSlice)

  try {
    const provider = getProvider(translation.provider)
    const result = await provider.polish({
      text: pendingChunk.rawSlice,
      sourceLanguage: translation.chapter.novel.sourceLanguage,
      contextOverlap,
      modelId: translation.modelName,
    })

    await db.translationChunk.update({
      where: { id: pendingChunk.id },
      data: {
        polishedSlice: result.polishedText,
        tokenCount: result.tokenUsage?.total ?? null,
        status: "COMPLETED",
      },
    })

    const completedCount = translation.chunks.filter(
      (chunk) =>
        chunk.status === "COMPLETED" || chunk.id === pendingChunk.id,
    ).length
    const totalCount = translation.chunks.length
    const progressPct = Math.round((completedCount / totalCount) * 100)
    const tokenDelta = result.tokenUsage?.total ?? 0

    await db.translation.update({
      where: { id: translationId },
      data: {
        progressPct,
        tokenUsage: (translation.tokenUsage ?? 0) + tokenDelta,
      },
    })

    console.log(TRANSLATION_QUEUE_LOG_PREFIX, "chunk completed", {
      translationId,
      chunkIndex: pendingChunk.chunkIndex,
      progressPct,
      tokenDelta,
    })

    const remainingChunks = translation.chunks.filter(
      (chunk) =>
        chunk.id !== pendingChunk.id &&
        (chunk.status === "PENDING" || chunk.status === "FAILED"),
    )

    if (remainingChunks.length > 0) {
      const nextChunkIndex = Math.min(
        ...remainingChunks.map((chunk) => chunk.chunkIndex),
      )
      console.log(TRANSLATION_QUEUE_LOG_PREFIX, "chaining next chunk", {
        translationId,
        nextChunkIndex,
        remainingCount: remainingChunks.length,
      })
      await chainNextChunk(translationId, nextChunkIndex)
      return
    }

    console.log(TRANSLATION_QUEUE_LOG_PREFIX, "all chunks completed, finalizing translation", {
      translationId,
    })
    const updatedChunks = await db.translationChunk.findMany({
      where: { translationId },
      orderBy: { chunkIndex: "asc" },
    })

    await finalizeTranslation(translationId, updatedChunks)
    console.log(TRANSLATION_QUEUE_LOG_PREFIX, "translation completed", { translationId })
  } catch (error) {
    console.error(TRANSLATION_QUEUE_LOG_PREFIX, "chunk failed", {
      translationId,
      chunkIndex: pendingChunk.chunkIndex,
      chunkId: pendingChunk.id,
      error: getErrorMessage(error),
    })

    await db.$transaction([
      db.translationChunk.update({
        where: { id: pendingChunk.id },
        data: { status: "FAILED" },
      }),
      db.translation.update({
        where: { id: translationId },
        data: {
          status: "FAILED",
          errorMessage: getErrorMessage(error),
        },
      }),
    ])
  }
}

export const maxDuration = 300

export { processTranslationChunk }
