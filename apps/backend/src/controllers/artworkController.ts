import { Request, Response, NextFunction } from 'express'
import Artwork from '@/models/Artwork'
import {
  createValidationError,
  createNotFoundError,
  createDatabaseError,
} from '@/middleware/errorHandler'
import { createLogger } from '@/utils/logger'
import { fileUploadService } from '@/services/fileUploadService'

const logger = createLogger('ArtworkController')

// ── GET /api/artworks ────────────────────────────────────────────────────────
export const getArtworks = async (req: Request, res: Response, next: NextFunction) => {
  const log = logger.child({ requestId: req.requestId })
  try {
    const {
      page = 1,
      limit = 20,
      category,
      creator,
      isListed,
      sort = '-createdAt',
      search,
      minPrice,
      maxPrice,
      artist,
      style,
      dateFrom,
      dateTo,
    } = req.query as Record<string, string>

    const filter: Record<string, unknown> = {}
    
    // Basic filters
    if (category) filter.category = category.toLowerCase()
    if (creator) filter.creator = creator
    if (isListed !== undefined) filter.isListed = isListed === 'true'
    
    // Advanced search filters
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { prompt: { $regex: search, $options: 'i' } },
        { category: { $regex: search, $options: 'i' } },
      ]
    }
    
    // Price range filter
    if (minPrice || maxPrice) {
      filter.price = {}
      if (minPrice) {
        const min = parseFloat(minPrice)
        if (!isNaN(min)) filter.price.$gte = min.toString()
      }
      if (maxPrice) {
        const max = parseFloat(maxPrice)
        if (!isNaN(max)) filter.price.$lte = max.toString()
      }
    }
    
    // Artist filter (alias for creator)
    if (artist) filter.creator = artist
    
    // Style filter (alias for category)
    if (style) filter.category = style.toLowerCase()
    
    // Creation date range filter
    if (dateFrom || dateTo) {
      filter.createdAt = {}
      if (dateFrom) {
        const fromDate = new Date(dateFrom)
        if (!isNaN(fromDate.getTime())) filter.createdAt.$gte = fromDate
      }
      if (dateTo) {
        const toDate = new Date(dateTo)
        if (!isNaN(toDate.getTime())) {
          toDate.setHours(23, 59, 59, 999) // End of day
          filter.createdAt.$lte = toDate
        }
      }
    }

    const pageNum = Math.max(1, parseInt(String(page), 10))
    const limitNum = Math.min(100, Math.max(1, parseInt(String(limit), 10)))
    const skip = (pageNum - 1) * limitNum

    const [artworks, total] = await Promise.all([
      Artwork.find(filter).sort(sort).skip(skip).limit(limitNum).lean(),
      Artwork.countDocuments(filter),
    ])

    log.info('Artworks fetched', { count: artworks.length, total, filters: Object.keys(filter) })
    res.json({
      success: true,
      data: { artworks, total, page: pageNum, limit: limitNum, pages: Math.ceil(total / limitNum) },
    })
  } catch (error) {
    log.error('Failed to fetch artworks', { error })
    next(createDatabaseError('Failed to fetch artworks'))
  }
}

// ── GET /api/artworks/:id ────────────────────────────────────────────────────
export const getArtwork = async (req: Request, res: Response, next: NextFunction) => {
  const log = logger.child({ requestId: req.requestId })
  try {
    const { id } = req.params
    const artwork = await Artwork.findById(id).lean()
    if (!artwork) {
      return next(createNotFoundError('Artwork'))
    }
    log.info('Artwork fetched', { artworkId: id })
    res.json({ success: true, data: artwork })
  } catch (error) {
    log.error('Failed to fetch artwork', { artworkId: req.params.id, error })
    next(createDatabaseError('Failed to fetch artwork'))
  }
}

// ── POST /api/artworks ───────────────────────────────────────────────────────
export const createArtwork = async (req: Request, res: Response, next: NextFunction) => {
  const log = logger.child({ requestId: req.requestId })
  try {
    const { 
      title, 
      description, 
      imageUrl, 
      price, 
      currency, 
      category, 
      prompt, 
      aiModel,
      fileUpload,
      images 
    } = req.body

    const validationErrors: string[] = []
    if (!title?.trim()) validationErrors.push('title is required')
    if (!description?.trim()) validationErrors.push('description is required')
    if (!imageUrl?.trim()) validationErrors.push('imageUrl is required')
    if (!price) validationErrors.push('price is required')
    if (!category?.trim()) validationErrors.push('category is required')

    if (validationErrors.length > 0) {
      return next(createValidationError('Validation failed', { fields: validationErrors }))
    }

    const creator = (req as any).user?.address
    if (!creator) {
      return next(createValidationError('Creator wallet address is required'))
    }

    const artwork = await Artwork.create({
      title,
      description,
      imageUrl,
      price,
      currency: currency ?? 'XLM',
      category,
      prompt,
      aiModel,
      creator,
      owner: creator,
      isListed: false,
      fileUpload,
      images,
    })

    log.info('Artwork created', { artworkId: artwork._id, creator })
    res.status(201).json({ success: true, data: artwork })
  } catch (error) {
    log.error('Failed to create artwork', { error })
    next(createDatabaseError('Failed to create artwork'))
  }
}

// ── PUT /api/artworks/:id ────────────────────────────────────────────────────
export const updateArtwork = async (req: Request, res: Response, next: NextFunction) => {
  const log = logger.child({ requestId: req.requestId })
  try {
    const { id } = req.params
    const callerAddress = (req as any).user?.address

    const artwork = await Artwork.findById(id)
    if (!artwork) {
      return next(createNotFoundError('Artwork'))
    }

    if (artwork.creator !== callerAddress && artwork.owner !== callerAddress) {
      return next(createValidationError('You do not have permission to update this artwork'))
    }

    const allowedUpdates = ['title', 'description', 'price', 'currency', 'isListed', 'metadata']
    const updates: Record<string, unknown> = {}
    allowedUpdates.forEach((field) => {
      if (req.body[field] !== undefined) updates[field] = req.body[field]
    })

    const updated = await Artwork.findByIdAndUpdate(id, updates, { new: true, runValidators: true })
    log.info('Artwork updated', { artworkId: id })
    res.json({ success: true, data: updated })
  } catch (error) {
    log.error('Failed to update artwork', { artworkId: req.params.id, error })
    next(createDatabaseError('Failed to update artwork'))
  }
}

// ── DELETE /api/artworks/:id ─────────────────────────────────────────────────
export const deleteArtwork = async (req: Request, res: Response, next: NextFunction) => {
  const log = logger.child({ requestId: req.requestId })
  try {
    const { id } = req.params
    const callerAddress = (req as any).user?.address

    const artwork = await Artwork.findById(id)
    if (!artwork) {
      return next(createNotFoundError('Artwork'))
    }

    if (artwork.creator !== callerAddress) {
      return next(createValidationError('Only the creator can delete an artwork'))
    }

    // Delete associated files from S3 if they exist
    if (artwork.fileUpload?.key) {
      try {
        await fileUploadService.deleteFile(artwork.fileUpload.key)
        log.info('Associated file deleted from S3', { key: artwork.fileUpload.key })
      } catch (error) {
        log.warn('Failed to delete associated file from S3', { 
          key: artwork.fileUpload.key, 
          error 
        })
        // Continue with artwork deletion even if file deletion fails
      }
    }

    // Delete multiple image formats if they exist
    if (artwork.images) {
      const imageKeys = Object.values(artwork.images)
        .filter(url => url && url.includes('/')) // Filter out empty/null values
        .map(url => {
          try {
            const urlObj = new URL(url)
            return urlObj.pathname.substring(1) // Remove leading slash
          } catch {
            return null
          }
        })
        .filter(key => key) as string[]

      for (const key of imageKeys) {
        try {
          await fileUploadService.deleteFile(key)
          log.info('Associated image format deleted from S3', { key })
        } catch (error) {
          log.warn('Failed to delete associated image format from S3', { 
            key, 
            error 
          })
        }
      }
    }

    await Artwork.findByIdAndDelete(id)
    log.info('Artwork deleted', { artworkId: id })
    res.json({ 
      success: true, 
      data: null,
      message: 'Artwork and associated files deleted successfully'
    })
  } catch (error) {
    log.error('Failed to delete artwork', { artworkId: req.params.id, error })
    next(createDatabaseError('Failed to delete artwork'))
  }
}
