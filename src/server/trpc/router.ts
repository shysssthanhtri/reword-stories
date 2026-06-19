import { chaptersRouter } from "@/server/routers/chapters"
import { novelsRouter } from "@/server/routers/novels"
import { translationsRouter } from "@/server/routers/translations"

import { router } from "./init"

export const appRouter = router({
  chapters: chaptersRouter,
  novels: novelsRouter,
  translations: translationsRouter,
})

export type AppRouter = typeof appRouter
