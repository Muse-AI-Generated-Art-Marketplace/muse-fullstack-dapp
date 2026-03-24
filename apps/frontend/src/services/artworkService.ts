import { useInfiniteQuery, useQuery } from '@tanstack/react-query'
import { ErrorHandler } from '@/utils/errorHandler'

export interface Artwork {
  id: string
  title: string
  description: string
  imageUrl: string
  price: string
  currency: string
  creator: string
  createdAt: string
  category: string
  prompt?: string
  aiModel?: string
  likes?: number
  views?: number
}

export interface ArtworksResponse {
  success: boolean
  data: Artwork[]
  pagination: {
    page: number
    limit: number
    total: number
  }
}

export interface ArtworksFilters {
  category?: string
  priceRange?: string
  sortBy?: string
}

export interface PlatformStats {
  totalArtworks: number
  totalArtists: number
  totalCollectors: number
  totalVolume: string
  volumeCurrency: string
}

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

async function fetchArtworks({
  pageParam = 1,
  filters = {},
}: {
  pageParam?: number
  filters?: ArtworksFilters
}): Promise<ArtworksResponse> {
  const params = new URLSearchParams({
    page: pageParam.toString(),
    limit: '20',
    ...filters,
  })

  const response = await fetch(`${API_BASE_URL}/api/artworks?${params}`)

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    const errorMessage = errorData?.error?.message || `Failed to fetch artworks (Status: ${response.status})`
    throw new Error(errorMessage)
  }

  const data = await response.json()

  if (!data.success) {
    throw new Error(data?.error?.message || 'Failed to fetch artworks')
  }

  return data
}

export function useArtworks(
  filters: ArtworksFilters = {},
) {
  return useInfiniteQuery<ArtworksResponse, Error>(
    ['artworks', filters] as const,
    ({ pageParam = 1 }) => fetchArtworks({ pageParam: pageParam as number, filters }),
    {
      getNextPageParam: (lastPage, allPages) => {
        const { pagination } = lastPage
        const totalFetched = allPages.reduce((sum, p) => sum + p.data.length, 0)
        const hasMore = totalFetched < pagination.total
        return hasMore ? pagination.page + 1 : undefined
      },
      retry: (failureCount: number, error: Error) => {
        const appError = ErrorHandler.handle(error)
        return ErrorHandler.isRecoverable(appError) && failureCount < 3
      },
      retryDelay: (attemptIndex: number) => ErrorHandler.getRetryDelay(attemptIndex),
      onError: (error: Error) => {
        const appError = ErrorHandler.handle(error)
        console.error('Failed to fetch artworks:', appError.userMessage)
      },
    }
  )
}

// ─── Featured Artworks ────────────────────────────────────────────────────────

async function fetchFeaturedArtworks(): Promise<Artwork[]> {
  const response = await fetch(`${API_BASE_URL}/api/artworks/featured`)
  if (!response.ok) {
    throw new Error(`Failed to fetch featured artworks (Status: ${response.status})`)
  }
  const data = await response.json()
  if (!data.success) {
    throw new Error(data?.error?.message || 'Failed to fetch featured artworks')
  }
  return data.data
}

export function useFeaturedArtworks() {
  return useQuery<Artwork[], Error>({
    queryKey: ['artworks', 'featured'],
    queryFn: fetchFeaturedArtworks,
    staleTime: 5 * 60 * 1000,
    retry: 2,
  })
}

// ─── Trending Artworks ────────────────────────────────────────────────────────

async function fetchTrendingArtworks(): Promise<Artwork[]> {
  const response = await fetch(`${API_BASE_URL}/api/artworks/trending`)
  if (!response.ok) {
    throw new Error(`Failed to fetch trending artworks (Status: ${response.status})`)
  }
  const data = await response.json()
  if (!data.success) {
    throw new Error(data?.error?.message || 'Failed to fetch trending artworks')
  }
  return data.data
}

export function useTrendingArtworks() {
  return useQuery<Artwork[], Error>({
    queryKey: ['artworks', 'trending'],
    queryFn: fetchTrendingArtworks,
    staleTime: 5 * 60 * 1000,
    retry: 2,
  })
}

// ─── Platform Stats ───────────────────────────────────────────────────────────

async function fetchPlatformStats(): Promise<PlatformStats> {
  const response = await fetch(`${API_BASE_URL}/api/artworks/stats`)
  if (!response.ok) {
    throw new Error(`Failed to fetch platform stats (Status: ${response.status})`)
  }
  const data = await response.json()
  if (!data.success) {
    throw new Error(data?.error?.message || 'Failed to fetch platform stats')
  }
  return data.data
}

export function usePlatformStats() {
  return useQuery<PlatformStats, Error>({
    queryKey: ['platform', 'stats'],
    queryFn: fetchPlatformStats,
    staleTime: 10 * 60 * 1000,
    retry: 2,
  })
}

// ─── Single Artwork ───────────────────────────────────────────────────────────

export async function getArtworkById(id: string): Promise<Artwork> {
  const response = await fetch(`${API_BASE_URL}/api/artworks/${id}`)

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    const errorMessage = errorData?.error?.message || `Failed to fetch artwork (Status: ${response.status})`
    throw new Error(errorMessage)
  }

  const result = await response.json()

  if (!result.success) {
    throw new Error(result?.error?.message || 'Failed to fetch artwork')
  }

  return result.data
}
