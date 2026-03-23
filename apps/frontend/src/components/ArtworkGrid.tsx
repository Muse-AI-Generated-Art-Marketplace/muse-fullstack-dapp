import { useEffect } from 'react'
import { Artwork } from '@/services/artworkService'
import { useIntersectionObserver } from '@/hooks/useIntersectionObserver'
import { ArtworkCardSkeleton, ArtworkGridSkeleton } from './ArtworkCardSkeleton'
import { EmptyState } from './EmptyState'

interface ArtworkCardProps {
  artwork: Artwork
  onPurchase?: (artwork: Artwork) => void
}

function ArtworkCard({ artwork, onPurchase }: ArtworkCardProps) {
  return (
    <div className="card-mobile overflow-hidden group cursor-pointer touch-manipulation">
      <div className="aspect-square bg-gradient-to-br from-primary-100 to-primary-200 relative overflow-hidden group-hover:scale-105 transition-transform">
        <img
          src={artwork.imageUrl}
          alt={artwork.title}
          className="w-full h-full object-cover"
          onError={(e) => {
            const target = e.target as HTMLImageElement
            target.style.display = 'none'
            target.parentElement?.classList.add('bg-gradient-to-br', 'from-primary-100', 'to-primary-200')
          }}
        />
      </div>
      <div className="p-4">
        <h3 className="font-semibold text-secondary-900 text-mobile-base truncate">
          {artwork.title}
        </h3>
        <p className="text-mobile-sm text-secondary-600 mb-2 line-clamp-2">
          {artwork.description}
        </p>
        <div className="flex items-center justify-between">
          <span className="text-mobile-sm font-medium text-secondary-900">
            {artwork.price} {artwork.currency}
          </span>
          <button
            onClick={() => onPurchase?.(artwork)}
            className="btn-primary text-mobile-sm px-4 py-2 touch-manipulation"
          >
            Buy Now
          </button>
        </div>
      </div>
    </div>
  )
}

interface ArtworkGridProps {
  artworks: Artwork[]
  isLoading: boolean
  hasNextPage: boolean
  isFetchingNextPage: boolean
  onLoadMore: () => void
  onPurchase?: (artwork: Artwork) => void
  onClearFilters?: () => void
  hasFilters?: boolean
}

export function ArtworkGrid({
  artworks,
  isLoading,
  hasNextPage,
  isFetchingNextPage,
  onLoadMore,
  onPurchase,
  onClearFilters,
  hasFilters = false,
}: ArtworkGridProps) {
  const loadMoreRef = useIntersectionObserver({
    onIntersect: onLoadMore,
    enabled: hasNextPage && !isFetchingNextPage,
    rootMargin: '200px',
  })

  // Show skeleton on initial load
  if (isLoading && artworks.length === 0) {
    return <ArtworkGridSkeleton count={8} />
  }

  // Show empty state when no artworks
  if (!isLoading && artworks.length === 0) {
    return (
      <EmptyState
        type={hasFilters ? 'no-results' : 'no-artworks'}
        onClearFilters={onClearFilters}
      />
    )
  }

  return (
    <>
      <div className="grid-mobile xs:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {artworks.map((artwork) => (
          <ArtworkCard
            key={artwork.id}
            artwork={artwork}
            onPurchase={onPurchase}
          />
        ))}
      </div>

      {/* Loading indicator for infinite scroll */}
      {isFetchingNextPage && <ArtworkGridSkeleton count={4} />}

      {/* Intersection observer target */}
      {hasNextPage && !isFetchingNextPage && (
        <div ref={loadMoreRef} className="w-full h-4" />
      )}

      {/* End of results message */}
      {!hasNextPage && !isLoading && artworks.length > 0 && (
        <div className="text-center py-8 text-secondary-600 text-mobile-sm">
          You've reached the end of the collection
        </div>
      )}
    </>
  )
}
