/**
 * Skeleton loader for item lists.
 * Uses .skeleton-shimmer CSS class defined in globals.css.
 */

interface SkeletonItemProps {
  /** Show a small image placeholder on the left (e.g. for gift items) */
  hasImage?: boolean
}

function SkeletonItem({ hasImage = false }: SkeletonItemProps) {
  return (
    <div className="flex items-center gap-3 rounded-[14px] border border-border-card bg-bg-card px-4 py-3">
      {/* Icon square */}
      <div className="skeleton-shimmer h-10 w-10 flex-shrink-0 rounded-[10px]" />

      {/* Text lines */}
      <div className="flex flex-1 flex-col gap-2">
        <div className="skeleton-shimmer h-3.5 w-3/5 rounded-full" />
        <div className="skeleton-shimmer h-2.5 w-2/5 rounded-full" />
      </div>

      {hasImage && (
        <div className="skeleton-shimmer h-10 w-10 flex-shrink-0 rounded-[10px]" />
      )}
    </div>
  )
}

interface SkeletonListProps {
  count?: number
  hasImage?: boolean
}

export function SkeletonList({ count = 4, hasImage = false }: SkeletonListProps) {
  return (
    <div className="flex flex-col gap-2">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonItem key={i} hasImage={hasImage} />
      ))}
    </div>
  )
}
