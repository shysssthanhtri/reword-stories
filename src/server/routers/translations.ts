import { TRPCError } from "@trpc/server"

import { splitIntoChunks } from "@/lib/chunking/split-chapter"
import {
  createTranslationInputSchema,
  estimateChunksInputSchema,
  getModelLabel,
  getProviderLabel,
  getProviderOptions,
  listByChapterInputSchema,
  retryChunkInputSchema,
  translationIdInputSchema,
} from "@/lib/validations/translation"
import { startTranslationJob } from "@/lib/workflow/start-translation-job"
import { publicProcedure, router } from "@/server/trpc/init"

const chunkSummarySelect = {
  id: true,
  chunkIndex: true,
  status: true,
  errorMessage: true,
} as const

const translationListSelect = {
  id: true,
  provider: true,
  modelName: true,
  status: true,
  progressPct: true,
  errorMessage: true,
  tokenUsage: true,
  chapterId: true,
  createdAt: true,
  updatedAt: true,
} as const

function enrichTranslation<T extends { provider: string; modelName: string }>(
  translation: T,
) {
  return {
    ...translation,
    providerLabel: getProviderLabel(translation.provider),
    modelLabel: getModelLabel(translation.provider, translation.modelName),
  }
}

export const translationsRouter = router({
  listProviders: publicProcedure.query(() => {
    return getProviderOptions()
  }),

  estimateChunks: publicProcedure
    .input(estimateChunksInputSchema)
    .query(async ({ ctx, input }) => {
      const chapter = await ctx.db.chapter.findUnique({
        where: { id: input.chapterId },
        select: { rawContent: true },
      })

      if (!chapter) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Chapter not found",
        })
      }

      return {
        chunkCount: splitIntoChunks(chapter.rawContent).length,
      }
    }),

  create: publicProcedure
    .input(createTranslationInputSchema)
    .mutation(async ({ ctx, input }) => {
      const chapter = await ctx.db.chapter.findUnique({
        where: { id: input.chapterId },
      })

      if (!chapter) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Chapter not found",
        })
      }

      const slices = splitIntoChunks(chapter.rawContent)

      if (slices.length === 0) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Chapter has no content to translate",
        })
      }

      const translation = await ctx.db.translation.create({
        data: {
          chapterId: input.chapterId,
          provider: input.provider,
          modelName: input.modelName,
          status: "QUEUED",
          chunks: {
            create: slices.map((rawSlice, chunkIndex) => ({
              chunkIndex,
              rawSlice,
              status: "PENDING",
            })),
          },
        },
        include: {
          chunks: {
            select: { id: true },
            orderBy: { chunkIndex: "asc" },
          },
        },
      })

      await startTranslationJob(translation.id)

      return {
        id: translation.id,
        status: translation.status,
        progressPct: translation.progressPct,
      }
    }),

  getById: publicProcedure
    .input(translationIdInputSchema)
    .query(async ({ ctx, input }) => {
      const translation = await ctx.db.translation.findUnique({
        where: { id: input.id },
        include: {
          chunks: {
            orderBy: { chunkIndex: "asc" },
            select: chunkSummarySelect,
          },
        },
      })

      if (!translation) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Translation not found",
        })
      }

      return enrichTranslation(translation)
    }),

  listByChapter: publicProcedure
    .input(listByChapterInputSchema)
    .query(async ({ ctx, input }) => {
      const chapter = await ctx.db.chapter.findUnique({
        where: { id: input.chapterId },
        select: { id: true },
      })

      if (!chapter) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Chapter not found",
        })
      }

      const translations = await ctx.db.translation.findMany({
        where: { chapterId: input.chapterId },
        orderBy: { createdAt: "desc" },
        select: translationListSelect,
      })

      return translations.map(enrichTranslation)
    }),

  retry: publicProcedure
    .input(translationIdInputSchema)
    .mutation(async ({ ctx, input }) => {
      const translation = await ctx.db.translation.findUnique({
        where: { id: input.id },
        include: {
          chunks: true,
        },
      })

      if (!translation) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Translation not found",
        })
      }

      if (
        translation.status === "PROCESSING") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Only failed or completed translations can be retried",
        })
      }

      const resetAllChunks = translation.status === "COMPLETED"

      await ctx.db.$transaction([
        ctx.db.translationChunk.updateMany({
          where: resetAllChunks
            ? { translationId: translation.id }
            : {
              translationId: translation.id,
              status: "FAILED",
            },
          data: {
            status: "PENDING",
            errorMessage: null,
            ...(resetAllChunks
              ? { polishedSlice: null, tokenCount: null }
              : {}),
          },
        }),
        ctx.db.translation.update({
          where: { id: translation.id },
          data: {
            status: "QUEUED",
            errorMessage: null,
            ...(resetAllChunks
              ? { polishedContent: null, progressPct: 0, tokenUsage: 0 }
              : {}),
          },
        }),
      ])

      await startTranslationJob(translation.id)

      return {
        id: translation.id,
        status: "QUEUED" as const,
      }
    }),

  retryChunk: publicProcedure
    .input(retryChunkInputSchema)
    .mutation(async ({ ctx, input }) => {
      const chunk = await ctx.db.translationChunk.findUnique({
        where: { id: input.chunkId },
        select: {
          id: true,
          status: true,
          translationId: true,
        },
      })

      if (!chunk) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Chunk not found",
        })
      }

      if (chunk.translationId !== input.translationId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Chunk does not belong to this translation",
        })
      }

      const translation = await ctx.db.translation.findUnique({
        where: { id: input.translationId },
        select: {
          status: true,
          chunks: {
            select: {
              id: true,
              status: true,
            },
          },
        },
      })

      if (!translation) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Translation not found",
        })
      }

      if (translation.status === "PROCESSING") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Translation is already processing",
        })
      }

      const completedCount = translation.chunks.filter(
        (item) => item.status === "COMPLETED" && item.id !== chunk.id,
      ).length
      const totalCount = translation.chunks.length
      const progressPct =
        totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0

      await ctx.db.$transaction([
        ctx.db.translationChunk.update({
          where: { id: chunk.id },
          data: {
            status: "PENDING",
            errorMessage: null,
            polishedSlice: null,
            tokenCount: null,
          },
        }),
        ctx.db.translation.update({
          where: { id: input.translationId },
          data: {
            status: "QUEUED",
            errorMessage: null,
            polishedContent: null,
            progressPct,
          },
        }),
      ])

      await startTranslationJob(input.translationId)

      return {
        translationId: input.translationId,
        chunkId: chunk.id,
        status: "QUEUED" as const,
      }
    }),

  delete: publicProcedure
    .input(translationIdInputSchema)
    .mutation(async ({ ctx, input }) => {
      const translation = await ctx.db.translation.findUnique({
        where: { id: input.id },
        select: { id: true },
      })

      if (!translation) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Translation not found",
        })
      }

      await ctx.db.translation.delete({
        where: { id: input.id },
      })

      return { id: input.id }
    }),
})
