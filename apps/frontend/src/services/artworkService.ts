import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { MOCK_ARTWORKS, getFilteredMockArtworks } from '@/data/mock-api'
import type { Artwork as BaseArtwork, ArtworksFilters } from '@/types'

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
    queryFn: async () => MOCK_ARTWORKS.slice(0, 6),
  })
}

export function useTrendingArtworks() {
  return useQuery({
    queryKey: ['artworks', 'trending'],
    queryFn: async () => [...MOCK_ARTWORKS].sort((a, b) => (b.views ?? 0) - (a.views ?? 0)).slice(0, 6),
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
    queryFn: async () => getFilteredMockArtworks(filters),
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
        return MOCK_ARTWORKS.filter((artwork) => artwork.creator === DEFAULT_PROFILE_ADDRESS)
      }

      const created = MOCK_ARTWORKS.filter((artwork) => artwork.creator === userAddress)
      return created.length > 0 ? created : MOCK_ARTWORKS.slice(0, 3)
    },
  })
}

export function useUserCollection(userAddress: string) {
  return useQuery({
    queryKey: ['profile', 'collection', userAddress],
    queryFn: async (): Promise<Artwork[]> => {
      if (!userAddress) {
        return MOCK_ARTWORKS.slice(6, 10)
      }

      const notOwnedByUser = MOCK_ARTWORKS.filter((artwork) => artwork.creator !== userAddress)
      return notOwnedByUser.slice(0, 4)
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
