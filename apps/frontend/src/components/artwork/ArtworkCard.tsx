import React from 'react'
import { Artwork, ArtworkCardProps } from '@/types'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { cn } from '@/utils/cn'

export function ArtworkCard({
  artwork,
  variant = 'default',
  onPurchase,
  onView,
  onShare,
  onFavorite,
  showPrice = true,
  showCreator = false,
  showActions = true,
  className = '',
  isLoading = false
}: ArtworkCardProps) {
  const cardId = `artwork-card-${artwork.id}`
  const titleId = `artwork-title-${artwork.id}`

  const handlePurchase = (e: React.MouseEvent) => {
    e.stopPropagation()
    onPurchase?.(artwork)
  }

  const handleView = () => {
    onView?.(artwork)
  }

  if (variant === 'compact') {
    return (
      <article
        id={cardId}
        aria-labelledby={titleId}
        className={cn(
          'flex items-center space-x-4 p-3 rounded-lg border border-secondary-100 hover:border-primary-200 transition-colors bg-white',
          className
        )}
      >
        <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-md">
          <img
            src={artwork.imageUrl}
            alt={artwork.title}
            className="h-full w-full object-cover"
          />
        </div>
        <div className="flex-1 min-w-0">
          <h4 id={titleId} className="text-sm font-semibold text-secondary-900 truncate">
            {artwork.title}
          </h4>
          {showPrice && (
            <p className="text-xs text-secondary-500">
              {artwork.price} {artwork.currency}
            </p>
          )}
        </div>
        {showActions && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleView}
            aria-label={`View details for ${artwork.title}`}
          >
            View
          </Button>
        )}
      </article>
    )
  }

  return (
    <Card
      id={cardId}
      aria-labelledby={titleId}
      as="article"
      className={cn('group overflow-hidden flex flex-col', className)}
      onClick={handleView}
    >
      {/* Image Container */}
      <div className="relative aspect-square overflow-hidden bg-secondary-100">
        <img
          src={artwork.imageUrl}
          alt={artwork.title}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          loading="lazy"
        />
        
        {/* Overlay Actions */}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center space-x-2">
          {onFavorite && (
            <Button
              variant="secondary"
              size="sm"
              className="rounded-full w-10 h-10 p-0"
              onClick={(e) => {
                e.stopPropagation()
                onFavorite(artwork)
              }}
              aria-label={`Add ${artwork.title} to favorites`}
            >
              ❤️
            </Button>
          )}
          {onShare && (
            <Button
              variant="secondary"
              size="sm"
              className="rounded-full w-10 h-10 p-0"
              onClick={(e) => {
                e.stopPropagation()
                onShare(artwork)
              }}
              aria-label={`Share ${artwork.title}`}
            >
              🔗
            </Button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-4 flex-1 flex flex-col">
        <div className="flex justify-between items-start mb-1">
          <h3 id={titleId} className="font-semibold text-secondary-900 truncate pr-2">
            {artwork.title}
          </h3>
          {showPrice && (
            <span className="text-primary-600 font-bold whitespace-nowrap">
              {artwork.price} {artwork.currency}
            </span>
          )}
        </div>

        {showCreator && (
          <p className="text-sm text-secondary-500 mb-3 truncate">
            by <span className="text-secondary-700 font-medium">@{artwork.creator}</span>
          </p>
        )}

        <p className="text-sm text-secondary-600 line-clamp-2 mb-4 flex-1">
          {artwork.description}
        </p>

        {showActions && (
          <div className="mt-auto flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              fullWidth
              onClick={handleView}
              aria-label={`View details for ${artwork.title}`}
            >
              Details
            </Button>
            {onPurchase && (
              <Button
                variant="primary"
                size="sm"
                fullWidth
                onClick={handlePurchase}
                aria-label={`Purchase ${artwork.title} for ${artwork.price} ${artwork.currency}`}
              >
                Buy Now
              </Button>
            )}
          </div>
        )}
      </div>
    </Card>
  )
}