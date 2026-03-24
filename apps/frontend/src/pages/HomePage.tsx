import { useArtworks, ArtworksFilters, type Artwork, type ArtworksResponse } from '@/services/artworkService'

import { ArtworkGrid } from '@/components/ArtworkGrid'

export function HomePage() {
  const filters = { sortBy: 'popular' } as ArtworksFilters

  const {
    data: featuredData,
    isLoading: featuredLoading,
    isFetchingNextPage: featuredFetchingNext,
  } = useArtworks(filters)

  const featuredArtworks: Artwork[] = featuredData?.pages.flatMap((page: ArtworksResponse) => page.data) || []

  return (
    <div className="min-h-screen bg-background">
      <div className="mobile-section">
        <div className="text-center space-y-6">
          <h1 className="heading-mobile text-center">
            Discover AI-Generated
            <span className="block text-primary-600">Digital Art</span>
          </h1>
          
          <p className="text-mobile-base text-secondary-600 mobile-container">
            Explore, collect, and create unique AI-generated artworks on the blockchain. 
            Each piece is a one-of-a-kind digital collectible.
          </p>
          
          <div className="flex flex-col gap-3 mobile-container">
            <a href="/explore" className="btn-primary w-full text-base font-medium">
              Start Exploring
            </a>
            <button className="btn-outline w-full text-base font-medium">
              Create Art
            </Button>
          </div>
        </div>
      </div>
      
      <div className="mobile-section">
        <h2 className="subheading-mobile mb-6">Featured Artworks</h2>
        <ArtworkGrid
          artworks={featuredArtworks.slice(0, 6)}
          isLoading={featuredLoading}
          hasNextPage={false}
          isFetchingNextPage={featuredFetchingNext}
          onLoadMore={() => {}}
          onPurchase={(artwork) => console.log('Purchase featured:', artwork)}
          onClearFilters={() => {}}
          hasFilters={false}
        />
      </div>
    </div>
  )
}

