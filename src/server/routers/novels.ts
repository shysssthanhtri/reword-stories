import { TRPCError } from "@trpc/server"
import { z } from "zod"

import { createNovelSchema } from "@/lib/validations/novel"
import { publicProcedure, router } from "@/server/trpc/init"

export const novelsRouter = router({
  list: publicProcedure.query(async ({ ctx }) => {
    const novels = await ctx.db.novel.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        _count: {
          select: { chapters: true },
        },
      },
    })

    return novels.map(({ _count, ...novel }) => ({
      ...novel,
      chapterCount: _count.chapters,
    }))
  }),

  getById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const novel = await ctx.db.novel.findUnique({
        where: { id: input.id },
        include: {
          chapters: {
            orderBy: { sortOrder: "asc" },
          },
        },
      })

      if (!novel) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Novel not found",
        })
      }

      return novel
    }),

  create: publicProcedure
    .input(createNovelSchema)
    .mutation(async ({ ctx, input }) => {
      return ctx.db.novel.create({
        data: input,
      })
    }),
})
