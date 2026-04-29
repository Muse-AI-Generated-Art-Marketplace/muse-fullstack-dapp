import { useMemo, useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ArtworkGrid } from '@/components/ArtworkGrid'
import { ErrorDisplay } from '@/components/ErrorDisplay'
import { FilterPanel } from '@/components/FilterPanel'
import { Button } from '@/components/ui/Button'
import { AdvancedArtworkSearch } from '@/components/artwork'
import { artworkService, type ApiArtwork, type Artwork, type ArtworkFilters } from '@/services/artworkService'
import { useErrorContext } from '@/contexts/ErrorContext'
import { useWebSocket, useBidUpdates, useSaleUpdates, useWebSocketAuth } from '@/contexts/WebSocketContext'
import { ErrorHandler } from '@/utils/errorHandler'
import { MOCK_ARTWORKS } from '@/data/mock-api'
import type { ArtworksFilters } from '@/types'
import type { SearchFilters } from '@/components/artwork/AdvancedSearchFilters'

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
    const { isConnected, subscribeToArtwork, unsubscribeFromArtwork } = useWebSocket()
    const { bidUpdates } = useBidUpdates()
    const { saleUpdates } = useSaleUpdates()
    const { authenticate } = useWebSocketAuth()
    const [filters, setFilters] = useState<ArtworksFilters>({})
    const [searchFilters, setSearchFilters] = useState<SearchFilters>({
        search: "",
        minPrice: "",
        maxPrice: "",
        artist: "",
        style: "",
        dateFrom: "",
        dateTo: "",
        category: "",
        isListed: undefined,
        sortBy: "-createdAt",
    })
    const [page, setPage] = useState(1)
    const [useFallbackData, setUseFallbackData] = useState(false)
    const [liveActivity, setLiveActivity] = useState<Array<{type: string, message: string, timestamp: string}>>([])

    useEffect(() => {
        // Authenticate WebSocket connection
        const userData = {
            // userId: user?.id,
            // address: user?.walletAddress
        }
        
        if (isConnected && (userData.userId || userData.address)) {
            authenticate(userData)
        }
    }, [isConnected, authenticate])

    useEffect(() => {
        // Process bid updates
        bidUpdates.forEach(update => {
            const activity = {
                type: 'bid',
                message: `New bid of ${update.data.price} ${update.data.currency} on artwork`,
                timestamp: update.timestamp
            }
            setLiveActivity(prev => [activity, ...prev].slice(0, 5))
        })
    }, [bidUpdates])

    useEffect(() => {
        // Process sale updates
        saleUpdates.forEach(update => {
            const activity = {
                type: 'sale',
                message: `Artwork sold for ${update.data.price} ${update.data.currency}`,
                timestamp: update.timestamp
            }
            setLiveActivity(prev => [activity, ...prev].slice(0, 5))
        })
    }, [saleUpdates])

    const { data, isLoading, isFetching, error, refetch } = useQuery({
        queryKey: ['explore-artworks', page, searchFilters],
        queryFn: async () => {
            const apiFilters: ArtworkFilters = {
                page,
                limit: PAGE_SIZE,
                search: searchFilters.search || undefined,
                minPrice: searchFilters.minPrice || undefined,
                maxPrice: searchFilters.maxPrice || undefined,
                artist: searchFilters.artist || undefined,
                style: searchFilters.style || undefined,
                dateFrom: searchFilters.dateFrom || undefined,
                dateTo: searchFilters.dateTo || undefined,
                category: searchFilters.category || filters.category,
                creator: filters.creator,
                isListed: searchFilters.isListed !== undefined ? searchFilters.isListed : filters.isListed,
                sort: searchFilters.sortBy,
            }
            return artworkService.getArtworks(apiFilters)
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

    const hasFilters = Boolean(
        filters.category || 
        filters.priceRange || 
        filters.sortBy ||
        searchFilters.search ||
        searchFilters.minPrice ||
        searchFilters.maxPrice ||
        searchFilters.artist ||
        searchFilters.style ||
        searchFilters.dateFrom ||
        searchFilters.dateTo ||
        searchFilters.isListed !== undefined ||
        searchFilters.sortBy !== "-createdAt"
    )
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
        setSearchFilters({
            search: "",
            minPrice: "",
            maxPrice: "",
            artist: "",
            style: "",
            dateFrom: "",
            dateTo: "",
            category: "",
            isListed: undefined,
            sortBy: "-createdAt",
        })
        setPage(1)
    }

    const handleAdvancedSearch = (newSearchFilters: SearchFilters) => {
        setSearchFilters(newSearchFilters)
        setPage(1)
        setUseFallbackData(false)
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="mb-6">
                    <h1 className="text-3xl font-bold text-gray-900">Explore Artwork</h1>
                    <p className="text-gray-600 mt-1">
                        Discover AI-generated collections and trending pieces from creators.
                    </p>
                    
                    {/* Live Activity Feed */}
                    {liveActivity.length > 0 && (
                        <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                            <div className="flex items-center justify-between mb-2">
                                <h3 className="text-sm font-medium text-green-800">
                                    🔴 Live Activity
                                </h3>
                                <span className={`text-xs px-2 py-1 rounded-full ${
                                    isConnected ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                }`}>
                                    {isConnected ? 'Connected' : 'Disconnected'}
                                </span>
                            </div>
                            <div className="space-y-1">
                                {liveActivity.map((activity, index) => (
                                    <div key={index} className="text-xs text-green-700 flex items-center space-x-2">
                                        <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                                        <span>{activity.message}</span>
                                        <span className="text-green-600 opacity-75">
                                            {new Date(activity.timestamp).toLocaleTimeString()}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
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
                    <AdvancedArtworkSearch
                        onSearch={handleAdvancedSearch}
                        loading={isLoading && !useFallbackData}
                        categories={['abstract', 'landscape', 'portrait', 'digital', 'fantasy', 'sci-fi', 'nature', 'urban']}
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
