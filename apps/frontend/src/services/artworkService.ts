import { ErrorHandler } from '@/utils/errorHandler'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'

export interface Artwork {
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
  artworks: Artwork[]
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

  async getArtwork(id: string): Promise<Artwork> {
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

  async createArtwork(artworkData: CreateArtworkForm): Promise<Artwork> {
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

  async updateArtwork(id: string, updates: Partial<CreateArtworkForm> & { isListed?: boolean }): Promise<Artwork> {
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

export default artworkService
