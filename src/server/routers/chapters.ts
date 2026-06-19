import { TRPCError } from "@trpc/server"
import { z } from "zod"

import { createChapterInputSchema } from "@/lib/validations/chapter"
import { publicProcedure, router } from "@/server/trpc/init"

export const chaptersRouter = router({
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

        return tx.chapter.create({
          data: {
            novelId: input.novelId,
            title: input.title || null,
            rawContent: input.rawContent,
            sortOrder,
          },
        })
      })
    }),
})
