import { useInfiniteQuery, UseInfiniteQueryOptions } from '@tanstack/react-query'

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
    throw new Error('Failed to fetch artworks')
  }
  
  return response.json()
}

export function useArtworks(
  filters: ArtworksFilters = {},
  options?: Omit<UseInfiniteQueryOptions<ArtworksResponse, Error>, 'queryKey' | 'queryFn' | 'getNextPageParam'>
) {
  return useInfiniteQuery({
    queryKey: ['artworks', filters],
    queryFn: ({ pageParam = 1 }) => fetchArtworks({ pageParam, filters }),
    getNextPageParam: (lastPage, allPages) => {
      const { pagination, data } = lastPage
      const hasMore = allPages.flat().length < pagination.total
      return hasMore ? pagination.page + 1 : undefined
    },
    ...options,
  })
}

export async function getArtworkById(id: string): Promise<Artwork> {
  const response = await fetch(`${API_BASE_URL}/api/artworks/${id}`)
  
  if (!response.ok) {
    throw new Error('Failed to fetch artwork')
  }
  
  const result = await response.json()
  return result.data
}
