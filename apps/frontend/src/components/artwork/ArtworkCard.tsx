import React from 'react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { OptimizedImage } from '@/components/ui/OptimizedImage'

export interface Artwork {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  price: string;
  currency: string;
  creator?: string;
  createdAt?: string;
  category?: string;
}

export interface ArtworkCardProps {
  artwork: Artwork;
  onPurchase?: (artwork: Artwork) => void;
  onView?: (artwork: Artwork) => void;
  showPrice?: boolean;
  showCreator?: boolean;
  variant?: "default" | "compact" | "detailed";
  className?: string;
}

export function ArtworkCard({
  artwork,
  onPurchase,
  onView,
  showPrice = true,
  showCreator = false,
  variant = "default",
  className = "",
}: ArtworkCardProps) {
  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const target = e.target as HTMLImageElement;
    target.style.display = "none";
    target.parentElement?.classList.add(
      "bg-gradient-to-br",
      "from-primary-100",
      "to-primary-200",
    );
  };

  const renderContent = () => {
    switch (variant) {
      case "compact":
        return (
          <div className="flex space-x-3">
            <div className="w-16 h-16 bg-gradient-to-br from-primary-100 to-primary-200 rounded-lg flex-shrink-0">
              <OptimizedImage
                src={artwork.imageUrl}
                alt={artwork.title}
                className="w-full h-full object-cover rounded-lg"
                width={64}
                height={64}
                placeholder="blur"
              />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-secondary-900 text-sm truncate">
                {artwork.title}
              </h3>
              {showCreator && artwork.creator && (
                <p className="text-xs text-secondary-600">{artwork.creator}</p>
              )}
              {showPrice && (
                <p className="text-sm font-medium text-secondary-900">
                  {artwork.price} {artwork.currency}
                </p>
              )}
            </div>
          </div>
        );

      case "detailed":
        return (
          <div className="space-y-4">
            <div className="aspect-square bg-gradient-to-br from-primary-100 to-primary-200 rounded-lg overflow-hidden">
              <OptimizedImage
                src={artwork.imageUrl}
                alt={artwork.title}
                className="w-full h-full object-cover"
                width={400}
                height={400}
                placeholder="blur"
              />
            </div>

            <div className="space-y-3">
              <div>
                <h3 className="font-semibold text-secondary-900 text-lg">
                  {artwork.title}
                </h3>
                {showCreator && artwork.creator && (
                  <p className="text-sm text-secondary-600">
                    by {artwork.creator}
                  </p>
                )}
              </div>

              <p className="text-secondary-600 text-sm line-clamp-3">
                {artwork.description}
              </p>

              {showPrice && (
                <div className="flex items-center justify-between pt-2">
                  <span className="text-lg font-medium text-secondary-900">
                    {artwork.price} {artwork.currency}
                  </span>
                  <div className="flex space-x-2">
                    {onView && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onView(artwork)}
                      >
                        View
                      </Button>
                    )}
                    {onPurchase && (
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => onPurchase(artwork)}
                      >
                        Buy Now
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        );

      default:
        return (
          <div className="space-y-4">
            <div className="aspect-square bg-gradient-to-br from-primary-100 to-primary-200 rounded-lg overflow-hidden group-hover:scale-105 transition-transform">
              <OptimizedImage
                src={artwork.imageUrl}
                alt={artwork.title}
                className="w-full h-full object-cover"
                width={300}
                height={300}
                placeholder="blur"
              />
            </div>

            <div className="space-y-2">
              <h3 className="font-semibold text-secondary-900 text-mobile-base truncate">
                {artwork.title}
              </h3>
              <p className="text-mobile-sm text-secondary-600 line-clamp-2">
                {artwork.description}
              </p>

              {showPrice && (
                <div className="flex items-center justify-between">
                  <span className="text-mobile-sm font-medium text-secondary-900">
                    {artwork.price} {artwork.currency}
                  </span>
                  <div className="flex space-x-2">
                    {onView && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onView(artwork)}
                      >
                        View
                      </Button>
                    )}
                    {onPurchase && (
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => onPurchase(artwork)}
                      >
                        Buy Now
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        );
    }
  };

  const cardVariants = {
    compact: "p-3",
    detailed: "p-6",
    default: "mobile",
  };

  return (
    <Card
      variant={variant === "default" ? "mobile" : "default"}
      padding={variant === "default" ? "none" : "md"}
      hover={variant !== "compact"}
      className={`${className} group cursor-pointer`}
    >
      {renderContent()}
    </Card>
  );
}
