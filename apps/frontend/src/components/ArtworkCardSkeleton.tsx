interface ArtworkCardSkeletonProps {
  className?: string
}

export function ArtworkCardSkeleton({ className = '' }: ArtworkCardSkeletonProps) {
  return (
    <div 
      className={`card-mobile overflow-hidden ${className}`}
      role="status"
      aria-label="Loading artwork"
      aria-busy="true"
    >
      <div className="aspect-square bg-secondary-100 animate-pulse" />
      <div className="p-4">
        <div className="h-5 bg-secondary-100 rounded animate-pulse mb-2" />
        <div className="h-4 bg-secondary-100 rounded animate-pulse mb-3 w-3/4" />
        <div className="flex items-center justify-between">
          <div className="h-4 bg-secondary-100 rounded animate-pulse w-16" />
          <div className="h-8 bg-secondary-100 rounded animate-pulse w-20" />
        </div>
      </div>
    </div>
  )
}

interface ArtworkGridSkeletonProps {
  count?: number
}

export function ArtworkGridSkeleton({ count = 8 }: ArtworkGridSkeletonProps) {
  return (
    <div className="grid-mobile xs:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {Array.from({ length: count }).map((_, index) => (
        <ArtworkCardSkeleton key={index} />
      ))}
    </div>
  )
}
