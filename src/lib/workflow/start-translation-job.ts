import { start } from "workflow/api"

import { translationJob } from "@/workflows/translation-job"

export async function startTranslationJob(translationId: string) {
  await start(translationJob, [translationId])
}
