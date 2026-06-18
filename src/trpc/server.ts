import "server-only"

import { cache } from "react"

import { createTRPCContext } from "@/server/trpc/context"
import { appRouter } from "@/server/trpc/router"

export const api = cache(async () => {
  const ctx = await createTRPCContext()
  return appRouter.createCaller(ctx)
})
