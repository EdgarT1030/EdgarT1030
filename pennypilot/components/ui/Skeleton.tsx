interface SkeletonProps {
  className?: string
}

export function Skeleton({ className = '' }: SkeletonProps) {
  return (
    <div
      className={`skeleton-shimmer rounded-xl ${className}`}
      aria-hidden="true"
    />
  )
}

export function ReportCardSkeleton() {
  return (
    <div className="card overflow-hidden p-4">
      <div className="mb-2.5 flex items-start justify-between gap-3">
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-3/5" />
          <Skeleton className="h-3 w-2/5" />
        </div>
        <Skeleton className="h-5 w-20 rounded-full" />
      </div>
      <Skeleton className="mt-3 h-3 w-3/4" />
      <div className="mt-2.5 flex gap-3">
        <Skeleton className="h-3 w-10" />
        <Skeleton className="h-3 w-10" />
      </div>
    </div>
  )
}
