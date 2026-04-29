import { ErrorHandler } from '@/utils/errorHandler'
import {
  Collection,
  CreateCollectionForm,
  UpdateCollectionForm,
  CollectionSearchParams,
  CollectionsResponse,
  CollectionAction
} from '@/types'

const API_BASE_URL = (import.meta.env as any).VITE_API_URL || 'http://localhost:3001'

export const collectionService = {
  /**
   * Get all collections for a user
   */
  async getUserCollections(ownerAddress: string, params?: CollectionSearchParams): Promise<CollectionsResponse> {
    try {
      const searchParams = new URLSearchParams()
      if (params?.query) searchParams.append('query', params.query)
      if (params?.isPublic !== undefined) searchParams.append('isPublic', params.isPublic.toString())
      if (params?.page) searchParams.append('page', params.page.toString())
      if (params?.limit) searchParams.append('limit', params.limit.toString())

      const response = await fetch(`${API_BASE_URL}/api/collections/user/${ownerAddress}?${searchParams}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || 'Failed to fetch collections')
      }

      return await response.json()
    } catch (error) {
      throw ErrorHandler.handleError(error, {
        context: 'collectionService.getUserCollections',
        userMessage: 'Failed to load your collections. Please try again.',
      })
    }
  },

  /**
   * Get a single collection by ID
   */
  async getCollection(collectionId: string): Promise<Collection> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/collections/${collectionId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw ErrorHandler.createError(
          'FETCH_COLLECTION_FAILED',
          errorData.message || 'Failed to fetch collection',
          response.status
        )
      }

      const data = await response.json()
      return data.data
    } catch (error) {
      throw ErrorHandler.handleError(error, {
        context: 'collectionService.getCollection',
        userMessage: 'Failed to load collection. Please try again.',
      })
    }
  },

  /**
   * Create a new collection
   */
  async createCollection(collectionData: CreateCollectionForm): Promise<Collection> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/collections`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(collectionData),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw ErrorHandler.createError(
          'CREATE_COLLECTION_FAILED',
          errorData.message || 'Failed to create collection',
          response.status
        )
      }

      const data = await response.json()
      return data.data
    } catch (error) {
      throw ErrorHandler.handleError(error, {
        context: 'collectionService.createCollection',
        userMessage: 'Failed to create collection. Please try again.',
      })
    }
  },

  /**
   * Update an existing collection
   */
  async updateCollection(collectionData: UpdateCollectionForm): Promise<Collection> {
    try {
      const { id, ...updateData } = collectionData
      const response = await fetch(`${API_BASE_URL}/api/collections/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw ErrorHandler.createError(
          'UPDATE_COLLECTION_FAILED',
          errorData.message || 'Failed to update collection',
          response.status
        )
      }

      const data = await response.json()
      return data.data
    } catch (error) {
      throw ErrorHandler.handleError(error, {
        context: 'collectionService.updateCollection',
        userMessage: 'Failed to update collection. Please try again.',
      })
    }
  },

  /**
   * Delete a collection
   */
  async deleteCollection(collectionId: string): Promise<void> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/collections/${collectionId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw ErrorHandler.createError(
          'DELETE_COLLECTION_FAILED',
          errorData.message || 'Failed to delete collection',
          response.status
        )
      }
    } catch (error) {
      throw ErrorHandler.handleError(error, {
        context: 'collectionService.deleteCollection',
        userMessage: 'Failed to delete collection. Please try again.',
      })
    }
  },

  /**
   * Add or remove artwork from a collection
   */
  async updateCollectionArtworks(action: CollectionAction): Promise<Collection> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/collections/${action.collectionId}/artworks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(action),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw ErrorHandler.createError(
          'UPDATE_COLLECTION_ARTWORKS_FAILED',
          errorData.message || 'Failed to update collection artworks',
          response.status
        )
      }

      const data = await response.json()
      return data.data
    } catch (error) {
      const actionText = action.type === 'add' ? 'add to' : 'remove from'
      throw ErrorHandler.handleError(error, {
        context: 'collectionService.updateCollectionArtworks',
        userMessage: `Failed to ${actionText} collection. Please try again.`,
      })
    }
  },

  /**
   * Get public collections with optional search
   */
  async getPublicCollections(params?: CollectionSearchParams): Promise<CollectionsResponse> {
    try {
      const searchParams = new URLSearchParams()
      if (params?.query) searchParams.append('query', params.query)
      if (params?.page) searchParams.append('page', params.page.toString())
      if (params?.limit) searchParams.append('limit', params.limit.toString())

      const response = await fetch(`${API_BASE_URL}/api/collections/public?${searchParams}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw ErrorHandler.createError(
          'FETCH_PUBLIC_COLLECTIONS_FAILED',
          errorData.message || 'Failed to fetch public collections',
          response.status
        )
      }

      return await response.json()
    } catch (error) {
      throw ErrorHandler.handleError(error, {
        context: 'collectionService.getPublicCollections',
        userMessage: 'Failed to load collections. Please try again.',
      })
    }
  },
}

export default collectionService
