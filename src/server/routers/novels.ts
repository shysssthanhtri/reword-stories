import { TRPCError } from "@trpc/server"
import { z } from "zod"

import {
  createNovelSchema,
  novelListInputSchema,
} from "@/lib/validations/novel"
import { publicProcedure, router } from "@/server/trpc/init"

export const novelsRouter = router({
  list: publicProcedure
    .input(novelListInputSchema.optional())
    .query(async ({ ctx, input }) => {
      const { page, pageSize, q, sortBy, sortDir } =
        novelListInputSchema.parse(input ?? {})

      const where = q
        ? {
            title: {
              contains: q,
              mode: "insensitive" as const,
            },
          }
        : {}

      const orderBy =
        sortBy === "chapterCount"
          ? { chapters: { _count: sortDir } }
          : { createdAt: sortDir }

      const skip = (page - 1) * pageSize

      const [totalCount, novels] = await Promise.all([
        ctx.db.novel.count({ where }),
        ctx.db.novel.findMany({
          where,
          orderBy,
          skip,
          take: pageSize,
          include: {
            _count: {
              select: { chapters: true },
            },
          },
        }),
      ])

      return {
        items: novels.map(({ _count, ...novel }) => ({
          ...novel,
          chapterCount: _count.chapters,
        })),
        totalCount,
        page,
        pageSize,
      }
    }),

  getById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const novel = await ctx.db.novel.findUnique({
        where: { id: input.id },
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
