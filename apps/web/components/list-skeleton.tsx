import { Skeleton } from '@/components/ui/skeleton'

interface ListSkeletonProps {
  count?: number
}

export function ListSkeleton({ count = 4 }: ListSkeletonProps) {
  return (
    <div className="space-y-4">
      {[...Array(count)].map((_, i) => (
        <Skeleton key={i} className="h-20 w-full rounded-xl" />
      ))}
    </div>
  )
}
