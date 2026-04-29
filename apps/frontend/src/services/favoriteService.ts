import { Artwork } from '@/types'
import { ErrorHandler, AppError } from '@/utils/errorHandler'

const API_BASE_URL = (import.meta as any).env.VITE_API_URL || 'http://localhost:3001'

export interface FavoritesResponse {
  success: boolean
  data: Artwork[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasNextPage: boolean
    hasPrevPage: boolean
  }
}

export interface FavoriteStatus {
  isFavorite: boolean
}

export interface FavoriteCount {
  count: number
}

export const favoriteService = {
  /**
   * Get all favorites for a user
   */
  async getUserFavorites(userAddress: string, page = 1, limit = 12): Promise<FavoritesResponse> {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/favorites/${userAddress}?page=${page}&limit=${limit}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      )

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || 'Failed to fetch favorites')
      }

      return await response.json()
    } catch (error) {
      throw ErrorHandler.handle(error)
    }
  },

  /**
   * Add artwork to favorites
   */
  async addFavorite(artworkId: string, userAddress: string): Promise<Artwork> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/favorites`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          artworkId,
          userAddress,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || 'Failed to add to favorites')
      }

      const data = await response.json()
      return data.data
    } catch (error) {
      const appError = ErrorHandler.handle(error)
      appError.userMessage = 'Failed to add to favorites. Please try again.'
      throw appError
    }
  },

  /**
   * Remove artwork from favorites
   */
  async removeFavorite(artworkId: string, userAddress: string): Promise<void> {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/favorites/${artworkId}?userAddress=${encodeURIComponent(userAddress)}`,
        {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      )

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || 'Failed to remove from favorites')
      }
    } catch (error) {
      const appError = ErrorHandler.handle(error)
      appError.userMessage = 'Failed to remove from favorites. Please try again.'
      throw appError
    }
  },

  /**
   * Check if artwork is in favorites
   */
  async checkFavorite(artworkId: string, userAddress: string): Promise<boolean> {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/favorites/check/${artworkId}?userAddress=${encodeURIComponent(userAddress)}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      )

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || 'Failed to check favorite status')
      }

      const data = await response.json()
      return data.data.isFavorite
    } catch (error) {
      const appError = ErrorHandler.handle(error)
      appError.userMessage = 'Failed to check favorite status.'
      throw appError
    }
  },

  /**
   * Get favorites count for a user
   */
  async getFavoritesCount(userAddress: string): Promise<number> {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/favorites/count/${userAddress}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      )

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || 'Failed to fetch favorites count')
      }

      const data = await response.json()
      return data.data.count
    } catch (error) {
      const appError = ErrorHandler.handle(error)
      appError.userMessage = 'Failed to fetch favorites count.'
      throw appError
    }
  },

  /**
   * Toggle favorite status (convenience method)
   */
  async toggleFavorite(
    artworkId: string,
    userAddress: string,
    isCurrentlyFavorite: boolean
  ): Promise<{ success: boolean; isFavorite: boolean; artwork?: Artwork }> {
    try {
      if (isCurrentlyFavorite) {
        await this.removeFavorite(artworkId, userAddress)
        return { success: true, isFavorite: false }
      } else {
        const artwork = await this.addFavorite(artworkId, userAddress)
        return { success: true, isFavorite: true, artwork }
      }
    } catch (error) {
      const appError = ErrorHandler.handle(error)
      appError.userMessage = isCurrentlyFavorite
        ? 'Failed to remove from favorites'
        : 'Failed to add to favorites'
      throw appError
    }
  },
}

export default favoriteService
