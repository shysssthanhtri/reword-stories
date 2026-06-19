import { chaptersRouter } from "@/server/routers/chapters"
import { novelsRouter } from "@/server/routers/novels"

import { router } from "./init"

export const appRouter = router({
  chapters: chaptersRouter,
  novels: novelsRouter,
})

export type AppRouter = typeof appRouter
