import { Badge } from "@/components/ui/badge"
import type { ChunkStatus } from "@/generated/prisma/client"

const STATUS_LABELS: Record<ChunkStatus, string> = {
  PENDING: "Pending",
  COMPLETED: "Done",
  FAILED: "Failed",
}

const STATUS_VARIANTS: Record<
  ChunkStatus,
  "default" | "secondary" | "destructive" | "outline"
> = {
  PENDING: "outline",
  COMPLETED: "default",
  FAILED: "destructive",
}

type ChunkStatusBadgeProps = {
  status: ChunkStatus
}

export function ChunkStatusBadge({ status }: ChunkStatusBadgeProps) {
  return (
    <Badge variant={STATUS_VARIANTS[status]}>{STATUS_LABELS[status]}</Badge>
  )
}
