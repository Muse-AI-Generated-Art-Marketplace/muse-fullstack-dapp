import { Request, Response, NextFunction } from 'express'
import { 
  createError, 
  createValidationError, 
  createNotFoundError,
  createDatabaseError,
  createExternalServiceError 
} from '@/middleware/errorHandler'

export const getArtworks = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page = '1', limit = '20', category, sort } = req.query
    
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
    
    const artworks = [
      {
        id: '1',
        title: 'AI Artwork #1',
        description: 'Generated with AI Model',
        imageUrl: 'https://example.com/image1.jpg',
        price: '0.1',
        currency: 'ETH',
        creator: '0x1234...5678',
        createdAt: new Date().toISOString(),
        category: 'abstract',
      },
      {
        id: '2',
        title: 'AI Artwork #2',
        description: 'Generated with AI Model',
        imageUrl: 'https://example.com/image2.jpg',
        price: '0.15',
        currency: 'ETH',
        creator: '0x8765...4321',
        createdAt: new Date().toISOString(),
        category: 'portrait',
      },
    ]

    res.json({
      success: true,
      data: artworks,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: artworks.length,
      },
    })
  } catch (error) {
    console.error('Error in getArtworks:', error)
    
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
    
    // Simulate artwork lookup - in real app, this would be a database query
    const artwork = {
      id,
      title: `AI Artwork #${id}`,
      description: 'Generated with AI Model',
      imageUrl: `https://example.com/image${id}.jpg`,
      price: '0.1',
      currency: 'ETH',
      creator: '0x1234...5678',
      createdAt: new Date().toISOString(),
      category: 'abstract',
      prompt: 'A futuristic cityscape at sunset with flying cars and neon lights',
      aiModel: 'Stable Diffusion v2.1',
    }

    res.json({
      success: true,
      data: artwork,
    })
  } catch (error) {
    console.error('Error in getArtworkById:', error)
    
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
    const { title, description, imageUrl, price, prompt, aiModel } = req.body
    
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
    
    const artwork = {
      id: Date.now().toString(),
      title: title.trim(),
      description: description.trim(),
      imageUrl: imageUrl.trim(),
      price: price.trim(),
      currency: 'ETH',
      creator: '0x1234...5678',
      createdAt: new Date().toISOString(),
      category: 'ai-generated',
      prompt: prompt?.trim() || '',
      aiModel: aiModel?.trim() || 'Unknown',
    }

    res.status(201).json({
      success: true,
      data: artwork,
    })
  } catch (error) {
    console.error('Error in createArtwork:', error)
    
    const err = createError(
      'Unable to create artwork at this time',
      500,
      'ARTWORK_CREATION_ERROR',
      { requestBody: req.body }
    )
    next(err)
  }
}
