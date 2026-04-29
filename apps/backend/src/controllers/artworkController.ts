import { Request, Response, NextFunction } from 'express'
import { 
  createError, 
  createValidationError, 
  createNotFoundError,
  createDatabaseError,
  createExternalServiceError 
} from '@/middleware/errorHandler'
import { invalidateArtworkCache } from '@/middleware/cacheMiddleware'
import { createLogger } from '@/utils/logger'
import { artworkService } from '@/services/artworkService'
import { Artwork, ApiResponse, CreateArtworkRequest, ArtworkQueryParams } from '@/types'

const logger = createLogger('ArtworkController')

export const getArtworks = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page = '1', limit = '20', category, sort, creator, minPrice, maxPrice, isListed, search } = req.query
    
    // Validate query parameters
    const pageNum = parseInt(page as string)
    const limitNum = parseInt(limit as string)
    
    if (isNaN(pageNum) || pageNum < 1) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid page number. Must be a positive integer.',
          userMessage: 'Please enter a valid page number (1 or greater).'
        }
      })
    }
    
    if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid limit. Must be between 1 and 100.',
          userMessage: 'Please limit your results to between 1 and 100 items per page.'
        }
      })
    }

    // Use optimized artwork service with eager loading to prevent N+1 queries
    const result = await artworkService.getArtworks({
      page: page as string,
      limit: limit as string,
      category: category as string,
      sort: sort as string,
      creator: creator as string,
      minPrice: minPrice as string,
      maxPrice: maxPrice as string,
      isListed: isListed as string,
      search: search as string,
      includeCreator: true,
      includeOwner: false
    })

    res.json(result)
  } catch (error) {
    logger.error('Error in getArtworks:', error)
    
    // Handle different types of errors
    if (error instanceof Error) {
      if (error.message.includes('database') || error.message.includes('connection')) {
        const err = createDatabaseError('Failed to fetch artworks from database')
        return next(err)
      }
      if (error.message.includes('external') || error.message.includes('api')) {
        const err = createExternalServiceError('Art service', 'Failed to fetch artwork data')
        return next(err)
      }
    }
    
    const err = createError(
      'Unable to load artworks at this time',
      500,
      'ARTWORK_FETCH_ERROR',
      { originalError: error instanceof Error ? error.message : 'Unknown error' }
    )
    next(err)
  }
}

export const getArtworkById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params
    
    // Validate ID format
    if (!id || id.trim() === '') {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Artwork ID is required',
          userMessage: 'Please provide a valid artwork ID.'
        }
      })
    }
    
    // Use optimized artwork service with eager loading to prevent N+1 queries
    const artwork = await artworkService.getArtworkById(id, {
      includeCreator: true,
      includeOwner: true,
      includeMetadata: true
    })

    res.json({
      success: true,
      data: artwork,
    })
  } catch (error) {
    logger.error('Error in getArtworkById:', error)
    
    if (error instanceof Error && error.message === 'Artwork not found') {
      const err = createNotFoundError('Artwork not found')
      return next(err)
    }
    
    const err = createError(
      'Unable to load artwork details',
      500,
      'ARTWORK_DETAILS_ERROR',
      { artworkId: req.params.id }
    )
    next(err)
  }
}

export const createArtwork = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { title, description, imageUrl, price, category, prompt, aiModel, attributes } = req.body
    
    // Validate required fields
    const validationErrors: string[] = []
    
    if (!title || title.trim() === '') {
      validationErrors.push('Title is required')
    }
    
    if (!description || description.trim() === '') {
      validationErrors.push('Description is required')
    }
    
    if (!imageUrl || imageUrl.trim() === '') {
      validationErrors.push('Image URL is required')
    }
    
    if (!price || price.trim() === '') {
      validationErrors.push('Price is required')
    }
    
    if (!category || category.trim() === '') {
      validationErrors.push('Category is required')
    }
    
    // Validate price format
    if (price && isNaN(parseFloat(price))) {
      validationErrors.push('Price must be a valid number')
    }
    
    if (validationErrors.length > 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Validation failed',
          userMessage: 'Please check all required fields and try again.',
          details: { validationErrors }
        }
      })
    }
    
    // Get creator ID from authenticated user (for now using a placeholder)
    // In a real implementation, this would come from authentication middleware
    const creatorId = (req as any).user?.publicKey || '507f1f77bcf86cd799439011'
    
    // Use optimized artwork service with proper database operations
    const artwork = await artworkService.createArtwork({
      title: title.trim(),
      description: description.trim(),
      imageUrl: imageUrl.trim(),
      price: price.trim(),
      category: category.trim(),
      prompt: prompt?.trim(),
      aiModel: aiModel?.trim(),
      attributes
    }, creatorId)

    res.status(201).json({
      success: true,
      data: artwork,
    })

    // Invalidate relevant caches after creating new artwork
    invalidateArtworkCache(artwork.id).catch(error => 
      logger.error('Failed to invalidate cache after artwork creation:', error)
    )
  } catch (error) {
    logger.error('Error in createArtwork:', error)
    
    const err = createError(
      'Unable to create artwork at this time',
      500,
      'ARTWORK_CREATION_ERROR',
      { requestBody: req.body }
    )
    next(err)
  }
}
