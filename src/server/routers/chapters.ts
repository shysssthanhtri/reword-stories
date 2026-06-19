import { TRPCError } from "@trpc/server"
import { z } from "zod"

import {
  chapterListInputSchema,
  createChapterInputSchema,
  getDefaultChapterTitle,
} from "@/lib/validations/chapter"
import { publicProcedure, router } from "@/server/trpc/init"

export const chaptersRouter = router({
  list: publicProcedure
    .input(chapterListInputSchema)
    .query(async ({ ctx, input }) => {
      const { novelId, page, pageSize, q, sortBy, sortDir } = input

      const novel = await ctx.db.novel.findUnique({
        where: { id: novelId },
      })

      if (!novel) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Novel not found",
        })
      }

      const where = {
        novelId,
        ...(q
          ? {
              title: {
                contains: q,
                mode: "insensitive" as const,
              },
            }
          : {}),
      }

      const orderBy =
        sortBy === "sortOrder"
          ? { sortOrder: sortDir }
          : { createdAt: sortDir }

      const skip = (page - 1) * pageSize

      const [totalCount, items] = await Promise.all([
        ctx.db.chapter.count({ where }),
        ctx.db.chapter.findMany({
          where,
          orderBy,
          skip,
          take: pageSize,
          select: {
            id: true,
            title: true,
            sortOrder: true,
            createdAt: true,
          },
        }),
      ])

      return {
        items,
        totalCount,
        page,
        pageSize,
      }
    }),

  getById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const chapter = await ctx.db.chapter.findUnique({
        where: { id: input.id },
      })

      if (!chapter) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Chapter not found",
        })
      }

      return chapter
    }),

  create: publicProcedure
    .input(createChapterInputSchema)
    .mutation(async ({ ctx, input }) => {
      return ctx.db.$transaction(async (tx) => {
        const novel = await tx.novel.findUnique({
          where: { id: input.novelId },
        })

        if (!novel) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Novel not found",
          })
        }

        const aggregate = await tx.chapter.aggregate({
          where: { novelId: input.novelId },
          _max: { sortOrder: true },
        })

        const sortOrder = (aggregate._max.sortOrder ?? -1) + 1
        const title = input.title.trim() || getDefaultChapterTitle(sortOrder)

        return tx.chapter.create({
          data: {
            novelId: input.novelId,
            title,
            rawContent: input.rawContent,
            sortOrder,
          },
        })
      })
    }),
})
