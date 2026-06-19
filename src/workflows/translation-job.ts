import { FatalError, sleep } from "workflow"

import { assemblePolishedContent } from "@/lib/chunking/assemble-chunks"
import { extractOverlapContext } from "@/lib/chunking/overlap-context"
import { db } from "@/lib/db"
import { getErrorMessage } from "@/lib/llm/error-utils"
import { getProvider } from "@/lib/llm/providers"
import { TRANSLATION_JOB_LOG_PREFIX } from "@/lib/workflow/log-prefix"

const chunkWithTranslationInclude = {
  translation: {
    include: {
      chapter: {
        include: {
          novel: true,
        },
      },
    },
  },
} as const

type JobChunk = {
  id: string
  chunkIndex: number
  status: "PENDING" | "COMPLETED" | "FAILED"
}

async function isGlobalJobSlotAvailable(translationId: string) {
  "use step"

  const otherProcessing = await db.translation.findFirst({
    where: {
      status: "PROCESSING",
      id: { not: translationId },
    },
    select: { id: true },
  })

  return !otherProcessing
}

async function markTranslationProcessing(translationId: string) {
  "use step"

  console.log(TRANSLATION_JOB_LOG_PREFIX, "mark processing", { translationId })

  await db.translation.update({
    where: { id: translationId },
    data: {
      status: "PROCESSING",
      errorMessage: null,
    },
  })
}

async function loadChunksForJob(translationId: string): Promise<JobChunk[]> {
  "use step"

  const chunks = await db.translationChunk.findMany({
    where: { translationId },
    orderBy: { chunkIndex: "asc" },
    select: {
      id: true,
      chunkIndex: true,
      status: true,
    },
  })

  return chunks
}

async function loadPredecessorPolishedSlice(
  translationId: string,
  chunkIndex: number,
) {
  if (chunkIndex === 0) {
    return null
  }

  const predecessor = await db.translationChunk.findUnique({
    where: {
      translationId_chunkIndex: {
        translationId,
        chunkIndex: chunkIndex - 1,
      },
    },
    select: { polishedSlice: true },
  })

  return predecessor?.polishedSlice ?? null
}

async function updateTranslationProgress(
  translationId: string,
  tokenDelta: number,
) {
  const [chunks, translation] = await Promise.all([
    db.translationChunk.findMany({
      where: { translationId },
      orderBy: { chunkIndex: "asc" },
    }),
    db.translation.findUnique({
      where: { id: translationId },
      select: { tokenUsage: true },
    }),
  ])

  const totalCount = chunks.length
  const completedCount = chunks.filter(
    (chunk) => chunk.status === "COMPLETED",
  ).length
  const progressPct =
    totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0

  await db.translation.update({
    where: { id: translationId },
    data: {
      progressPct,
      tokenUsage: (translation?.tokenUsage ?? 0) + tokenDelta,
      errorMessage: null,
    },
  })
}

async function polishChunkStep(translationId: string, chunkId: string) {
  "use step"

  console.log(TRANSLATION_JOB_LOG_PREFIX, "polish chunk started", {
    translationId,
    chunkId,
  })

  const chunk = await db.translationChunk.findUnique({
    where: { id: chunkId },
    include: chunkWithTranslationInclude,
  })

  if (!chunk || chunk.translationId !== translationId) {
    console.warn(TRANSLATION_JOB_LOG_PREFIX, "chunk not found", {
      translationId,
      chunkId,
    })
    throw new FatalError("Chunk not found")
  }

  if (chunk.status === "COMPLETED") {
    console.log(TRANSLATION_JOB_LOG_PREFIX, "chunk already completed", {
      translationId,
      chunkId,
      chunkIndex: chunk.chunkIndex,
    })
    return
  }

  await db.translationChunk.update({
    where: { id: chunkId },
    data: { errorMessage: null },
  })

  const predecessorPolishedSlice = await loadPredecessorPolishedSlice(
    translationId,
    chunk.chunkIndex,
  )
  const contextOverlap = extractOverlapContext(predecessorPolishedSlice)

  console.log(TRANSLATION_JOB_LOG_PREFIX, "processing chunk", {
    translationId,
    chunkIndex: chunk.chunkIndex,
    chunkId: chunk.id,
    provider: chunk.translation.provider,
    modelName: chunk.translation.modelName,
  })

  try {
    const provider = getProvider(chunk.translation.provider)
    const result = await provider.polish({
      text: chunk.rawSlice,
      sourceLanguage: chunk.translation.chapter.novel.sourceLanguage,
      contextOverlap,
      modelId: chunk.translation.modelName,
    })

    await db.translationChunk.update({
      where: { id: chunkId },
      data: {
        polishedSlice: result.polishedText,
        tokenCount: result.tokenUsage?.total ?? null,
        status: "COMPLETED",
        errorMessage: null,
      },
    })

    const tokenDelta = result.tokenUsage?.total ?? 0

    console.log(TRANSLATION_JOB_LOG_PREFIX, "chunk completed", {
      translationId,
      chunkIndex: chunk.chunkIndex,
      chunkId: chunk.id,
      tokenDelta,
    })

    await updateTranslationProgress(translationId, tokenDelta)
  } catch (error) {
    const errorMessage = getErrorMessage(error)

    console.error(TRANSLATION_JOB_LOG_PREFIX, "chunk failed", {
      translationId,
      chunkIndex: chunk.chunkIndex,
      chunkId: chunk.id,
      error: errorMessage,
    })

    await db.translationChunk.update({
      where: { id: chunkId },
      data: {
        status: "FAILED",
        errorMessage,
      },
    })

    throw new FatalError(errorMessage)
  }
}

async function finalizeTranslationStep(translationId: string) {
  "use step"

  const chunks = await db.translationChunk.findMany({
    where: { translationId },
    orderBy: { chunkIndex: "asc" },
  })

  const polishedContent = assemblePolishedContent(chunks)

  console.log(TRANSLATION_JOB_LOG_PREFIX, "finalize translation", {
    translationId,
    chunkCount: chunks.length,
  })

  await db.translation.update({
    where: { id: translationId },
    data: {
      status: "COMPLETED",
      progressPct: 100,
      polishedContent,
      errorMessage: null,
    },
  })

  console.log(TRANSLATION_JOB_LOG_PREFIX, "translation completed", {
    translationId,
  })
}

async function failTranslationStep(translationId: string, errorMessage: string) {
  "use step"

  const chunks = await db.translationChunk.findMany({
    where: { translationId },
    select: { status: true },
  })

  const totalCount = chunks.length
  const completedCount = chunks.filter(
    (chunk) => chunk.status === "COMPLETED",
  ).length
  const progressPct =
    totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0

  console.log(TRANSLATION_JOB_LOG_PREFIX, "translation failed", {
    translationId,
    error: errorMessage,
  })

  await db.translation.update({
    where: { id: translationId },
    data: {
      status: "FAILED",
      errorMessage,
      progressPct,
    },
  })
}

export async function translationJob(translationId: string) {
  "use workflow"

  console.log(TRANSLATION_JOB_LOG_PREFIX, "job started", { translationId })

  let slotAvailable = await isGlobalJobSlotAvailable(translationId)
  while (!slotAvailable) {
    await sleep("10s")
    slotAvailable = await isGlobalJobSlotAvailable(translationId)
  }

  await markTranslationProcessing(translationId)

  const chunks = await loadChunksForJob(translationId)

  for (const chunk of chunks) {
    if (chunk.status === "COMPLETED") {
      continue
    }

    try {
      await polishChunkStep(translationId, chunk.id)
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Chunk polish failed"
      await failTranslationStep(translationId, message)
      return
    }
  }

  await finalizeTranslationStep(translationId)
}
