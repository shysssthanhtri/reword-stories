import { Badge } from "@/components/ui/badge"
import type { TranslationStatus } from "@/generated/prisma/client"

const STATUS_LABELS: Record<TranslationStatus, string> = {
  QUEUED: "Queued",
  PROCESSING: "Processing",
  COMPLETED: "Completed",
  FAILED: "Failed",
}

const STATUS_VARIANTS: Record<
  TranslationStatus,
  "default" | "secondary" | "destructive" | "outline"
> = {
  QUEUED: "outline",
  PROCESSING: "secondary",
  COMPLETED: "default",
  FAILED: "destructive",
}

type TranslationStatusBadgeProps = {
  status: TranslationStatus
  progressPct?: number
}

export function TranslationStatusBadge({
  status,
  progressPct = 0,
}: TranslationStatusBadgeProps) {
  const label =
    status === "PROCESSING"
      ? `${STATUS_LABELS[status]} (${progressPct}%)`
      : STATUS_LABELS[status]

  return <Badge variant={STATUS_VARIANTS[status]}>{label}</Badge>
}
