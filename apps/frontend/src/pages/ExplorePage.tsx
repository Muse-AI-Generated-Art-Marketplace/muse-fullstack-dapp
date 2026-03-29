import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ArtworkGrid } from '@/components/ArtworkGrid'
import { ErrorDisplay } from '@/components/ErrorDisplay'
import { FilterPanel } from '@/components/FilterPanel'
import { Button } from '@/components/ui/Button'
import { artworkService, type ApiArtwork, type Artwork } from '@/services/artworkService'
import { useErrorContext } from '@/contexts/ErrorContext'
import { ErrorHandler } from '@/utils/errorHandler'
import { MOCK_ARTWORKS } from '@/data/mock-api'
import type { ArtworksFilters } from '@/types'

const PAGE_SIZE = 12

function mapApiArtworkToUi(artwork: ApiArtwork): Artwork {
    return {
        id: artwork._id,
        title: artwork.title,
        description: artwork.description,
        imageUrl: artwork.imageUrl,
        price: artwork.price,
        currency: artwork.currency,
        creator: artwork.creator,
        createdAt: artwork.createdAt,
        category: artwork.category,
        prompt: artwork.prompt,
        aiModel: artwork.aiModel,
        tokenId: artwork.tokenId,
        owner: artwork.owner,
        isListed: artwork.isListed,
    }
}

export function ExplorePage() {
    const { showError } = useErrorContext()
    const [filters, setFilters] = useState<ArtworksFilters>({})
    const [page, setPage] = useState(1)
    const [useFallbackData, setUseFallbackData] = useState(false)

    const { data, isLoading, isFetching, error, refetch } = useQuery({
        queryKey: ['explore-artworks', page, filters],
        queryFn: async () => {
            return artworkService.getArtworks({
                page,
                limit: PAGE_SIZE,
                category: filters.category,
                creator: filters.creator,
                isListed: filters.isListed,
                sort: filters.sortBy,
            })
        },
        enabled: !useFallbackData,
        retry: 1,
        onError: (queryError) => {
            showError(queryError)
        },
    })

    const appError = !useFallbackData && error ? ErrorHandler.handle(error) : null

    const artworks = useMemo(() => {
        if (useFallbackData) {
            return MOCK_ARTWORKS.slice(0, PAGE_SIZE) as Artwork[]
        }

        const apiArtworks = data?.artworks ?? []
        return apiArtworks.map(mapApiArtworkToUi)
    }, [data?.artworks, useFallbackData])

    const hasFilters = Boolean(filters.category || filters.priceRange || filters.sortBy)
    const hasNextPage = !useFallbackData && !!data && page < data.pages

    const handleRetry = async () => {
        setUseFallbackData(false)
        await refetch()
    }

    const handleLoadMore = () => {
        if (hasNextPage && !isFetching) {
            setPage((prev) => prev + 1)
        }
    }

    const handleFilterChange = (nextFilters: ArtworksFilters) => {
        setFilters(nextFilters)
        setPage(1)
        setUseFallbackData(false)
    }

    const handleClearFilters = () => {
        setFilters({})
        setPage(1)
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="mb-6">
                    <h1 className="text-3xl font-bold text-gray-900">Explore Artwork</h1>
                    <p className="text-gray-600 mt-1">
                        Discover AI-generated collections and trending pieces from creators.
                    </p>
                </div>

                {appError && (
                    <div className="mb-6 space-y-3">
                        <ErrorDisplay
                            error={appError}
                            onRetry={handleRetry}
                            showRetry
                            showDismiss={false}
                        />
                        <div className="flex flex-wrap gap-2">
                            <Button variant="outline" size="sm" onClick={handleRetry}>
                                Retry Loading
                            </Button>
                            <Button
                                variant="secondary"
                                size="sm"
                                onClick={() => setUseFallbackData(true)}
                            >
                                View Demo Artworks
                            </Button>
                        </div>
                    </div>
                )}

                <div className="mb-6">
                    <FilterPanel
                        filters={filters}
                        onChange={handleFilterChange}
                        onClear={handleClearFilters}
                    />
                </div>

                <ArtworkGrid
                    artworks={artworks}
                    isLoading={isLoading && !useFallbackData}
                    hasNextPage={hasNextPage}
                    isFetchingNextPage={isFetching && page > 1}
                    onLoadMore={handleLoadMore}
                    onClearFilters={hasFilters ? handleClearFilters : undefined}
                    hasFilters={hasFilters}
                />
            </div>
        </div>
    )
}
