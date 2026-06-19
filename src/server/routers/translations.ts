import { TRPCError } from "@trpc/server"

import { splitIntoChunks } from "@/lib/chunking/split-chapter"
import { kickoffTranslation } from "@/lib/queue/translation-queue"
import {
  createTranslationInputSchema,
  estimateChunksInputSchema,
  getModelLabel,
  getProviderLabel,
  getProviderOptions,
  listByChapterInputSchema,
  translationIdInputSchema,
} from "@/lib/validations/translation"
import { publicProcedure, router } from "@/server/trpc/init"

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
      })

      await kickoffTranslation(translation.id)

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

      if (translation.status !== "FAILED") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Only failed translations can be retried",
        })
      }

      await ctx.db.$transaction([
        ctx.db.translationChunk.updateMany({
          where: {
            translationId: translation.id,
            status: "FAILED",
          },
          data: {
            status: "PENDING",
          },
        }),
        ctx.db.translation.update({
          where: { id: translation.id },
          data: {
            status: "QUEUED",
            errorMessage: null,
          },
        }),
      ])

      await kickoffTranslation(translation.id)

      return {
        id: translation.id,
        status: "QUEUED" as const,
      }
    }),
})
