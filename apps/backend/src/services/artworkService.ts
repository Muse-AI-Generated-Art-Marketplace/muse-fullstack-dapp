import { Artwork, ArtworkDocument, UserDocument } from '@/models'
import { CreateArtworkRequest, ArtworkQueryParams, PaginatedResponse } from '@/types'
import { createLogger } from '@/utils/logger'

const logger = createLogger('ArtworkService')

export interface ArtworkListOptions extends ArtworkQueryParams {
  includeCreator?: boolean
  includeOwner?: boolean
  sortBy?: 'createdAt' | 'price' | 'title' | 'category'
  sortOrder?: 'asc' | 'desc'
}

export interface ArtworkDetailOptions {
  includeCreator?: boolean
  includeOwner?: boolean
  includeMetadata?: boolean
}

class ArtworkService {
  /**
   * Get artworks with optimized queries to prevent N+1 problems
   */
  async getArtworks(options: ArtworkListOptions = {}): Promise<PaginatedResponse<any>> {
    const {
      page = '1',
      limit = '20',
      category,
      sort = 'createdAt',
      creator,
      minPrice,
      maxPrice,
      isListed,
      search,
      includeCreator = true,
      includeOwner = false,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = options

    const pageNum = parseInt(page as string)
    const limitNum = parseInt(limit as string)

    // Build query with proper indexing
    const query: any = {}
    
    if (category) {
      query.category = category
    }
    
    if (creator) {
      query.creator = creator
    }
    
    if (isListed !== undefined) {
      query.isListed = isListed === 'true'
    }
    
    if (minPrice || maxPrice) {
      query.price = {}
      if (minPrice) query.price.$gte = minPrice
      if (maxPrice) query.price.$lte = maxPrice
    }
    
    if (search) {
      query.$text = { $search: search }
    }

    // Build population options to prevent N+1 queries
    const populateFields: any[] = []
    
    if (includeCreator) {
      populateFields.push({
        path: 'creator',
        select: 'publicKey username avatar isVerified',
        model: 'User'
      })
    }
    
    if (includeOwner) {
      populateFields.push({
        path: 'owner',
        select: 'publicKey username avatar isVerified',
        model: 'User'
      })
    }

    try {
      // Execute queries in parallel for better performance
      const [artworks, total] = await Promise.all([
        Artwork.find(query)
          .populate(populateFields)
          .sort({ [sortBy]: sortOrder === 'desc' ? -1 : 1 })
          .skip((pageNum - 1) * limitNum)
          .limit(limitNum)
          .lean() // Use lean for better performance
          .exec(),
        Artwork.countDocuments(query).exec()
      ])

      const totalPages = Math.ceil(total / limitNum)

      return {
        success: true,
        data: artworks,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages,
          hasNextPage: pageNum < totalPages,
          hasPrevPage: pageNum > 1
        }
      }
    } catch (error) {
      logger.error('Error fetching artworks:', error)
      throw new Error('Failed to fetch artworks')
    }
  }

  /**
   * Get artwork by ID with optimized population
   */
  async getArtworkById(id: string, options: ArtworkDetailOptions = {}): Promise<any> {
    const { includeCreator = true, includeOwner = true, includeMetadata = true } = options

    const populateFields: any[] = []
    
    if (includeCreator) {
      populateFields.push({
        path: 'creator',
        select: 'publicKey username avatar bio isVerified stats',
        model: 'User'
      })
    }
    
    if (includeOwner) {
      populateFields.push({
        path: 'owner',
        select: 'publicKey username avatar bio isVerified stats',
        model: 'User'
      })
    }

    try {
      const artwork = await Artwork.findById(id)
        .populate(populateFields)
        .lean()
        .exec()

      if (!artwork) {
        throw new Error('Artwork not found')
      }

      return artwork
    } catch (error) {
      logger.error(`Error fetching artwork ${id}:`, error)
      throw error
    }
  }

  /**
   * Create artwork with proper validation and error handling
   */
  async createArtwork(data: CreateArtworkRequest, creatorId: string): Promise<any> {
    try {
      const artwork = new Artwork({
        ...data,
        creator: creatorId,
        owner: creatorId, // Initially, creator is also the owner
        isListed: true
      })

      const savedArtwork = await artwork.save()

      // Update user stats
      await this.updateUserArtworkStats(creatorId, 'created')

      // Return populated artwork
      return await this.getArtworkById(savedArtwork._id.toString(), {
        includeCreator: true,
        includeOwner: true
      })
    } catch (error) {
      logger.error('Error creating artwork:', error)
      throw new Error('Failed to create artwork')
    }
  }

  /**
   * Get artworks by creator with proper eager loading
   */
  async getArtworksByCreator(
    creatorId: string, 
    options: { page?: string; limit?: string; includeCreator?: boolean } = {}
  ): Promise<PaginatedResponse<any>> {
    const { page = '1', limit = '20', includeCreator = false } = options
    const pageNum = parseInt(page)
    const limitNum = parseInt(limit)

    const query = { creator: creatorId, isListed: true }

    const populateFields = includeCreator ? [{
      path: 'creator',
      select: 'publicKey username avatar isVerified',
      model: 'User'
    }] : []

    try {
      const [artworks, total] = await Promise.all([
        Artwork.find(query)
          .populate(populateFields)
          .sort({ createdAt: -1 })
          .skip((pageNum - 1) * limitNum)
          .limit(limitNum)
          .lean()
          .exec(),
        Artwork.countDocuments(query).exec()
      ])

      const totalPages = Math.ceil(total / limitNum)

      return {
        success: true,
        data: artworks,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages,
          hasNextPage: pageNum < totalPages,
          hasPrevPage: pageNum > 1
        }
      }
    } catch (error) {
      logger.error(`Error fetching artworks for creator ${creatorId}:`, error)
      throw new Error('Failed to fetch creator artworks')
    }
  }

  /**
   * Get artworks owned by user with proper eager loading
   */
  async getArtworksByOwner(
    ownerId: string, 
    options: { page?: string; limit?: string; includeOwner?: boolean } = {}
  ): Promise<PaginatedResponse<any>> {
    const { page = '1', limit = '20', includeOwner = false } = options
    const pageNum = parseInt(page)
    const limitNum = parseInt(limit)

    const query = { owner: ownerId }

    const populateFields: any[] = [
      {
        path: 'creator',
        select: 'publicKey username avatar isVerified',
        model: 'User'
      }
    ]

    if (includeOwner) {
      populateFields.push({
        path: 'owner',
        select: 'publicKey username avatar isVerified',
        model: 'User'
      })
    }

    try {
      const [artworks, total] = await Promise.all([
        Artwork.find(query)
          .populate(populateFields)
          .sort({ createdAt: -1 })
          .skip((pageNum - 1) * limitNum)
          .limit(limitNum)
          .lean()
          .exec(),
        Artwork.countDocuments(query).exec()
      ])

      const totalPages = Math.ceil(total / limitNum)

      return {
        success: true,
        data: artworks,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages,
          hasNextPage: pageNum < totalPages,
          hasPrevPage: pageNum > 1
        }
      }
    } catch (error) {
      logger.error(`Error fetching artworks for owner ${ownerId}:`, error)
      throw new Error('Failed to fetch owned artworks')
    }
  }

  /**
   * Update user artwork stats efficiently
   */
  private async updateUserArtworkStats(userId: string, type: 'created' | 'owned'): Promise<void> {
    try {
      const updateField = type === 'created' ? 'stats.artworksCreated' : 'stats.artworksOwned'
      
      await UserDocument.updateOne(
        { _id: userId },
        { $inc: { [updateField]: 1 } }
      ).exec()
    } catch (error) {
      logger.error(`Error updating user stats for ${userId}:`, error)
      // Don't throw here as this is not critical
    }
  }

  /**
   * Get featured artworks with optimized queries
   */
  async getFeaturedArtworks(limit: number = 10): Promise<any[]> {
    try {
      return await Artwork.find({ isListed: true })
        .populate([
          {
            path: 'creator',
            select: 'publicKey username avatar isVerified',
            model: 'User'
          }
        ])
        .sort({ createdAt: -1, 'stats.followers': -1 })
        .limit(limit)
        .lean()
        .exec()
    } catch (error) {
      logger.error('Error fetching featured artworks:', error)
      throw new Error('Failed to fetch featured artworks')
    }
  }

  /**
   * Search artworks with text index and proper population
   */
  async searchArtworks(
    searchTerm: string,
    options: { page?: string; limit?: string; category?: string } = {}
  ): Promise<PaginatedResponse<any>> {
    const { page = '1', limit = '20', category } = options
    const pageNum = parseInt(page)
    const limitNum = parseInt(limit)

    const query: any = {
      $text: { $search: searchTerm },
      isListed: true
    }

    if (category) {
      query.category = category
    }

    try {
      const [artworks, total] = await Promise.all([
        Artwork.find(query, { score: { $meta: 'textScore' } })
          .populate([
            {
              path: 'creator',
              select: 'publicKey username avatar isVerified',
              model: 'User'
            }
          ])
          .sort({ score: { $meta: 'textScore' } })
          .skip((pageNum - 1) * limitNum)
          .limit(limitNum)
          .lean()
          .exec(),
        Artwork.countDocuments(query).exec()
      ])

      const totalPages = Math.ceil(total / limitNum)

      return {
        success: true,
        data: artworks,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages,
          hasNextPage: pageNum < totalPages,
          hasPrevPage: pageNum > 1
        }
      }
    } catch (error) {
      logger.error(`Error searching artworks with term "${searchTerm}":`, error)
      throw new Error('Failed to search artworks')
    }
  }
}

export const artworkService = new ArtworkService()
