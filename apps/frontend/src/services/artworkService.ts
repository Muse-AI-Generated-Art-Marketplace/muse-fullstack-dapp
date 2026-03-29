import { ErrorHandler } from '@/utils/errorHandler'
import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { MOCK_ARTWORKS, getFilteredMockArtworks } from '@/data/mock-api'
import type { Artwork as BaseArtwork, ArtworksFilters } from '@/types'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'

export interface ApiArtwork {
  _id: string
  title: string
  description: string
  imageUrl: string
  price: string
  currency: 'XLM' | 'USD' | 'EUR'
  creator: string
  owner: string
  category: string
  prompt?: string
  aiModel?: string
  tokenId?: string
  isListed: boolean
  metadata?: Record<string, unknown>
  createdAt: string
  updatedAt: string
}

export interface ArtworksResponse {
  artworks: ApiArtwork[]
  total: number
  page: number
  limit: number
  pages: number
}

export interface ArtworkFilters {
  page?: number
  limit?: number
  category?: string
  creator?: string
  isListed?: boolean
  sort?: string
}

export interface CreateArtworkForm {
  title: string
  description: string
  imageUrl: string
  price: string
  currency?: 'XLM' | 'USD' | 'EUR'
  category: string
  prompt?: string
  aiModel?: string
}

const getAuthHeaders = (): Record<string, string> => {
  const token = localStorage.getItem('muse_auth_token')
  return token ? { Authorization: `Bearer ${token}` } : {}
}

export const artworkService = {
  async getArtworks(filters?: ArtworkFilters): Promise<ArtworksResponse> {
    try {
      const params = new URLSearchParams()
      if (filters?.page) params.append('page', filters.page.toString())
      if (filters?.limit) params.append('limit', filters.limit.toString())
      if (filters?.category) params.append('category', filters.category)
      if (filters?.creator) params.append('creator', filters.creator)
      if (filters?.isListed !== undefined) params.append('isListed', filters.isListed.toString())
      if (filters?.sort) params.append('sort', filters.sort)

      const response = await fetch(`${API_BASE_URL}/api/artworks?${params}`, {
        headers: { 'Content-Type': 'application/json' },
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw ErrorHandler.createError(
          'FETCH_ARTWORKS_FAILED',
          errorData.message || 'Failed to fetch artworks',
          response.status
        )
      }

      const data = await response.json()
      return data.data
    } catch (error) {
      throw ErrorHandler.handleError(error, {
        context: 'artworkService.getArtworks',
        userMessage: 'Failed to load artworks. Please try again.',
      })
    }
  },

  async getArtwork(id: string): Promise<ApiArtwork> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/artworks/${id}`, {
        headers: { 'Content-Type': 'application/json' },
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw ErrorHandler.createError(
          response.status === 404 ? 'NOT_FOUND' : 'FETCH_ARTWORK_FAILED',
          errorData.message || 'Failed to fetch artwork',
          response.status
        )
      }

      const data = await response.json()
      return data.data
    } catch (error) {
      throw ErrorHandler.handleError(error, {
        context: 'artworkService.getArtwork',
        userMessage: 'Failed to load artwork. It may no longer exist.',
      })
    }
  },

  async createArtwork(artworkData: CreateArtworkForm): Promise<ApiArtwork> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/artworks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify(artworkData),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw ErrorHandler.createError(
          'CREATE_ARTWORK_FAILED',
          errorData.userMessage || errorData.message || 'Failed to create artwork',
          response.status
        )
      }

      const data = await response.json()
      return data.data
    } catch (error) {
      throw ErrorHandler.handleError(error, {
        context: 'artworkService.createArtwork',
        userMessage: 'Failed to create artwork. Please try again.',
      })
    }
  },

  async updateArtwork(id: string, updates: Partial<CreateArtworkForm> & { isListed?: boolean }): Promise<ApiArtwork> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/artworks/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify(updates),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw ErrorHandler.createError(
          'UPDATE_ARTWORK_FAILED',
          errorData.userMessage || errorData.message || 'Failed to update artwork',
          response.status
        )
      }

      const data = await response.json()
      return data.data
    } catch (error) {
      throw ErrorHandler.handleError(error, {
        context: 'artworkService.updateArtwork',
        userMessage: 'Failed to update artwork. Please try again.',
      })
    }
  },

  async deleteArtwork(id: string): Promise<void> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/artworks/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw ErrorHandler.createError(
          'DELETE_ARTWORK_FAILED',
          errorData.userMessage || errorData.message || 'Failed to delete artwork',
          response.status
        )
      }
    } catch (error) {
      throw ErrorHandler.handleError(error, {
        context: 'artworkService.deleteArtwork',
        userMessage: 'Failed to delete artwork. Please try again.',
      })
    }
  },
}

// ─── MOCK API HOOKS FOR MIGRATION ──────────────────────────────────────────

export interface Artwork extends BaseArtwork {
  likes?: number
  views?: number
}

export interface PlatformStats {
  totalArtworks: number
  totalArtists: number
  totalVolume: string
  avgPrice: string
}

export interface ProfileStats {
  created: number
  collected: number
  favorites: number
  totalSales: string
  totalPurchases: string
}

export interface UserProfile {
  address: string
  username: string
  bio: string
  profileImage?: string
  joinedAt: string
  stats: ProfileStats
}

export interface ProfileTransaction {
  id: string
  type: 'minted' | 'purchased' | 'sold' | 'favorite'
  artworkTitle: string
  amount?: string
  timestamp: string
}

const DEFAULT_PROFILE_ADDRESS = 'GCXK...R7YN'

const buildDefaultProfile = (): UserProfile => ({
  address: DEFAULT_PROFILE_ADDRESS,
  username: 'Muse Artist',
  bio: 'AI art collector and creator exploring surreal and futuristic themes.',
  joinedAt: '2025-08-12T10:00:00Z',
  stats: {
    created: MOCK_ARTWORKS.filter((artwork) => artwork.creator === DEFAULT_PROFILE_ADDRESS).length,
    collected: 4,
    favorites: 7,
    totalSales: '18.4 XLM',
    totalPurchases: '9.7 XLM',
  },
})

const mockTransactions: ProfileTransaction[] = [
  {
    id: 'txn-1',
    type: 'sold',
    artworkTitle: 'Ocean of Stars',
    amount: '5.0 XLM',
    timestamp: '2026-03-25T13:20:00Z',
  },
  {
    id: 'txn-2',
    type: 'minted',
    artworkTitle: 'Neon Dreamscape',
    timestamp: '2026-03-20T14:30:00Z',
  },
  {
    id: 'txn-3',
    type: 'purchased',
    artworkTitle: 'Prismatic Wildlife',
    amount: '2.9 XLM',
    timestamp: '2026-03-19T11:05:00Z',
  },
  {
    id: 'txn-4',
    type: 'favorite',
    artworkTitle: 'Digital Samurai',
    timestamp: '2026-03-18T17:42:00Z',
  },
]

export function useFeaturedArtworks() {
  return useQuery({
    queryKey: ['artworks', 'featured'],
    queryFn: async () => MOCK_ARTWORKS.slice(0, 6) as Artwork[],
  })
}

export function useTrendingArtworks() {
  return useQuery({
    queryKey: ['artworks', 'trending'],
    queryFn: async () => [...MOCK_ARTWORKS].sort((a, b) => ((b as any).views ?? 0) - ((a as any).views ?? 0)).slice(0, 6) as Artwork[],
  })
}

export function usePlatformStats() {
  return useQuery({
    queryKey: ['platform', 'stats'],
    queryFn: async (): Promise<PlatformStats> => {
      const totalVolume = MOCK_ARTWORKS.reduce((acc, item) => acc + Number(item.price), 0)
      const avgPrice = totalVolume / MOCK_ARTWORKS.length
      return {
        totalArtworks: MOCK_ARTWORKS.length,
        totalArtists: new Set(MOCK_ARTWORKS.map((item) => item.creator)).size,
        totalVolume: `${totalVolume.toFixed(1)} XLM`,
        avgPrice: `${avgPrice.toFixed(2)} XLM`,
      }
    },
  })
}

export function useArtworks(filters: ArtworksFilters = {}) {
  return useQuery({
    queryKey: ['artworks', filters],
    queryFn: async () => getFilteredMockArtworks(filters) as Artwork[],
  })
}

export function useUserProfile() {
  return useQuery({
    queryKey: ['profile', 'me'],
    queryFn: async (): Promise<UserProfile> => buildDefaultProfile(),
  })
}

export function useUserArtworks(userAddress: string) {
  return useQuery({
    queryKey: ['profile', 'created', userAddress],
    queryFn: async (): Promise<Artwork[]> => {
      if (!userAddress) {
        return MOCK_ARTWORKS.filter((artwork) => artwork.creator === DEFAULT_PROFILE_ADDRESS) as Artwork[]
      }

      const created = MOCK_ARTWORKS.filter((artwork) => artwork.creator === userAddress)
      return (created.length > 0 ? created : MOCK_ARTWORKS.slice(0, 3)) as Artwork[]
    },
  })
}

export function useUserCollection(userAddress: string) {
  return useQuery({
    queryKey: ['profile', 'collection', userAddress],
    queryFn: async (): Promise<Artwork[]> => {
      if (!userAddress) {
        return MOCK_ARTWORKS.slice(6, 10) as Artwork[]
      }

      const notOwnedByUser = MOCK_ARTWORKS.filter((artwork) => artwork.creator !== userAddress)
      return notOwnedByUser.slice(0, 4) as Artwork[]
    },
  })
}

export function useUserTransactions(_userAddress: string) {
  return useQuery({
    queryKey: ['profile', 'transactions'],
    queryFn: async (): Promise<ProfileTransaction[]> => mockTransactions,
  })
}

export type { ArtworksFilters }

export function useProfileSummary(userAddress: string) {
  const profile = useUserProfile()
  const created = useUserArtworks(userAddress)
  const collection = useUserCollection(userAddress)

  return useMemo(
    () => ({
      profile,
      created,
      collection,
    }),
    [profile, created, collection]
  )
}

export default artworkService

export type { Artwork, ArtworksFilters };

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

export interface PaginatedArtworks {
  artworks: Artwork[];
  total: number;
  page: number;
  totalPages: number;
  hasNextPage: boolean;
}

export const artworkService = {
  async getArtworks(
    page = 1,
    limit = 12,
    filters?: ArtworksFilters,
  ): Promise<PaginatedArtworks> {
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
        ...(filters?.category && { category: filters.category }),
        ...(filters?.sortBy && { sortBy: filters.sortBy }),
        ...(filters?.creator && { creator: filters.creator }),
        ...(filters?.priceRange && { priceRange: filters.priceRange }),
        ...(filters?.minPrice !== undefined && {
          minPrice: String(filters.minPrice),
        }),
        ...(filters?.maxPrice !== undefined && {
          maxPrice: String(filters.maxPrice),
        }),
        ...(filters?.isListed !== undefined && {
          isListed: String(filters.isListed),
        }),
      });

      const response = await fetch(`${API_BASE_URL}/api/artwork?${params}`, {
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) {
        const errorData: ApiResponse = await response.json().catch(() => ({}));
        throw ErrorHandler.createError(
          "FETCH_ARTWORKS_FAILED",
          errorData.error?.message || "Failed to load artworks",
          response.status,
        );
      }

      const data: ApiResponse<PaginatedArtworks> = await response.json();
      return data.data!;
    } catch (error) {
      throw ErrorHandler.handleError(error, {
        context: "artworkService.getArtworks",
        userMessage: "Failed to load artworks. Please try again.",
      });
    }
  },

  async getArtworkById(id: string): Promise<Artwork> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/artwork/${id}`, {
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) {
        const errorData: ApiResponse = await response.json().catch(() => ({}));
        throw ErrorHandler.createError(
          "FETCH_ARTWORK_FAILED",
          errorData.error?.message || "Artwork not found",
          response.status,
        );
      }

      const data: ApiResponse<Artwork> = await response.json();
      return data.data!;
    } catch (error) {
      throw ErrorHandler.handleError(error, {
        context: "artworkService.getArtworkById",
        userMessage: "Failed to load artwork details. Please try again.",
      });
    }
  },
};

export default artworkService;
