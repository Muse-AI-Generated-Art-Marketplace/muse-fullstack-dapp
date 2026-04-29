import mongoose from 'mongoose'
import { Artwork, IArtwork } from '@/models/Artwork'
import { User, IUser } from '@/models/User'

export interface ArtworkSearchFilters {
  category?: string
  priceMin?: number
  priceMax?: number
  artist?: string
  createdAfter?: Date
  createdBefore?: Date
}

export interface UserSearchFilters {
  role?: string
  joinedAfter?: Date
  joinedBefore?: Date
  hasListings?: boolean
}

export interface SearchOptions {
  q?: string
  page?: number
  limit?: number
  sort?: 'relevance' | 'price_asc' | 'price_desc' | 'newest' | 'oldest'
}

export interface SearchResult<T> {
  success: boolean
  data: Array<T & { relevanceScore?: number }>
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
  filters: {
    applied: Record<string, any>
  }
}

class SearchService {
  async searchArtworks(
    query: string = '',
    filters: ArtworkSearchFilters = {},
    options: SearchOptions = {}
  ): Promise<SearchResult<IArtwork>> {
    const {
      page = 1,
      limit = Math.min(options.limit || 20, 100),
      sort = 'relevance'
    } = options

    const skip = (page - 1) * limit
    const searchQuery: any = {}

    // Text search
    if (query) {
      searchQuery.$text = { $search: query }
    }

    // Apply filters
    if (filters.category) {
      searchQuery.category = filters.category.toLowerCase()
    }

    if (filters.priceMin !== undefined || filters.priceMax !== undefined) {
      searchQuery.price = {}
      if (filters.priceMin !== undefined) {
        searchQuery.price.$gte = filters.priceMin.toString()
      }
      if (filters.priceMax !== undefined) {
        searchQuery.price.$lte = filters.priceMax.toString()
      }
    }

    if (filters.artist) {
      searchQuery.creator = filters.artist
    }

    if (filters.createdAfter || filters.createdBefore) {
      searchQuery.createdAt = {}
      if (filters.createdAfter) {
        searchQuery.createdAt.$gte = filters.createdAfter
      }
      if (filters.createdBefore) {
        searchQuery.createdAt.$lte = filters.createdBefore
      }
    }

    // Build sort options
    let sortOptions: any = {}
    if (query && sort === 'relevance') {
      sortOptions = { score: { $meta: 'textScore' } }
    } else if (sort === 'price_asc') {
      sortOptions = { price: 1 }
    } else if (sort === 'price_desc') {
      sortOptions = { price: -1 }
    } else if (sort === 'newest') {
      sortOptions = { createdAt: -1 }
    } else if (sort === 'oldest') {
      sortOptions = { createdAt: 1 }
    }

    // Execute query
    let artworksQuery = Artwork.find(searchQuery)
      .sort(sortOptions)
      .skip(skip)
      .limit(limit)
      .populate('creator', 'username profileImage')

    if (query && sort === 'relevance') {
      artworksQuery = artworksQuery.select({ score: { $meta: 'textScore' } })
    }

    const [artworks, total] = await Promise.all([
      artworksQuery.exec(),
      Artwork.countDocuments(searchQuery)
    ])

    // Add relevance scores if text search was used
    const data = artworks.map(artwork => {
      const artworkObj = artwork.toObject()
      if (query && sort === 'relevance' && artworkObj.score) {
        artworkObj.relevanceScore = artworkObj.score
      }
      return artworkObj
    })

    return {
      success: true,
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      },
      filters: {
        applied: filters
      }
    }
  }

  async searchUsers(
    query: string = '',
    filters: UserSearchFilters = {},
    options: SearchOptions = {}
  ): Promise<SearchResult<IUser>> {
    const {
      page = 1,
      limit = Math.min(options.limit || 20, 100),
      sort = 'relevance'
    } = options

    const skip = (page - 1) * limit
    const searchQuery: any = {}

    // Text search
    if (query) {
      searchQuery.$text = { $search: query }
    }

    // Apply filters
    if (filters.role) {
      searchQuery.tier = filters.role
    }

    if (filters.joinedAfter || filters.joinedBefore) {
      searchQuery.createdAt = {}
      if (filters.joinedAfter) {
        searchQuery.createdAt.$gte = filters.joinedAfter
      }
      if (filters.joinedBefore) {
        searchQuery.createdAt.$lte = filters.joinedBefore
      }
    }

    if (filters.hasListings !== undefined) {
      if (filters.hasListings) {
        // Users with listings - need to check if they have created artworks
        const usersWithListings = await Artwork.distinct('creator', { isListed: true })
        searchQuery.address = { $in: usersWithListings }
      } else {
        // Users without listings
        const usersWithListings = await Artwork.distinct('creator', { isListed: true })
        searchQuery.address = { $nin: usersWithListings }
      }
    }

    // Build sort options
    let sortOptions: any = {}
    if (query && sort === 'relevance') {
      sortOptions = { score: { $meta: 'textScore' } }
    } else if (sort === 'newest') {
      sortOptions = { createdAt: -1 }
    } else if (sort === 'oldest') {
      sortOptions = { createdAt: 1 }
    } else {
      // Default sort for users
      sortOptions = { 'stats.followers': -1, createdAt: -1 }
    }

    // Execute query
    let usersQuery = User.find(searchQuery)
      .sort(sortOptions)
      .skip(skip)
      .limit(limit)
      .select('-preferences')

    if (query && sort === 'relevance') {
      usersQuery = usersQuery.select({ score: { $meta: 'textScore' } })
    }

    const [users, total] = await Promise.all([
      usersQuery.exec(),
      User.countDocuments(searchQuery)
    ])

    // Add relevance scores if text search was used
    const data = users.map(user => {
      const userObj = user.toObject()
      if (query && sort === 'relevance' && userObj.score) {
        userObj.relevanceScore = userObj.score
      }
      return userObj
    })

    return {
      success: true,
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      },
      filters: {
        applied: filters
      }
    }
  }
}

export const searchService = new SearchService()
export default searchService
