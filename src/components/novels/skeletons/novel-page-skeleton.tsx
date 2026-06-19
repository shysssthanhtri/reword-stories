import { Skeleton } from "@/components/ui/skeleton"

type NovelPageSkeletonProps = {
  showChaptersSection?: boolean
}

export function NovelPageSkeleton({
  showChaptersSection = true,
}: NovelPageSkeletonProps) {
  return (
    <div className="flex flex-col gap-6">
      <Skeleton className="h-4 w-24" />
      <div className="flex flex-col gap-4">
        <Skeleton className="h-8 w-64" />
        <div className="rounded-xl ring-1 ring-foreground/10">
          <div className="flex flex-col gap-4 p-4">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-8 w-full" />
          </div>
        </div>
      </div>
      {showChaptersSection ? (
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between gap-4">
            <Skeleton className="h-6 w-24" />
            <Skeleton className="h-9 w-28" />
          </div>
          <Skeleton className="h-9 max-w-sm" />
          <div className="overflow-hidden rounded-lg border">
            <div className="flex gap-4 border-b px-4 py-3">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-8" />
              <Skeleton className="h-4 w-20" />
            </div>
            {Array.from({ length: 5 }).map((_, index) => (
              <div
                key={index}
                className="flex gap-4 border-b px-4 py-3 last:border-0"
              >
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-4 w-8" />
                <Skeleton className="h-4 w-24" />
              </div>
            ))}
          </div>
          <div className="flex items-center justify-between gap-4">
            <Skeleton className="h-4 w-24" />
            <div className="flex gap-2">
              <Skeleton className="h-9 w-24" />
              <Skeleton className="h-9 w-16" />
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
