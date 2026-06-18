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
          <Skeleton className="h-6 w-24" />
          <Skeleton className="h-32 w-full rounded-xl" />
        </div>
      ) : null}
    </div>
  )
}
