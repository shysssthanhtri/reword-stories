import {
  Progress,
  ProgressLabel,
  ProgressValue,
} from "@/components/ui/progress"
import type { TranslationStatus } from "@/generated/prisma/client"

type TranslationProgressProps = {
  status: TranslationStatus
  progressPct: number
}

export function TranslationProgress({
  status,
  progressPct,
}: TranslationProgressProps) {
  if (status === "COMPLETED") {
    return null
  }

  const value = status === "QUEUED" ? 0 : progressPct

  return (
    <Progress value={value} className="w-full">
      <ProgressLabel className="text-xs text-muted-foreground">
        Progress
      </ProgressLabel>
      <ProgressValue>{(_, val) => `${val ?? 0}%`}</ProgressValue>
    </Progress>
  )
}
