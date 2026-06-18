import { novelsRouter } from "@/server/routers/novels"

import { router } from "./init"

export const appRouter = router({
  novels: novelsRouter,
})

export type AppRouter = typeof appRouter
