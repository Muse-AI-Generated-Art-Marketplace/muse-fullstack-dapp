import { Request, Response, NextFunction } from 'express'
import Artwork from '@/models/Artwork'
import { createError } from '@/middleware/errorHandler'
import { createLogger } from '@/utils/logger'

const logger = createLogger('MetadataController')

export const getArtworkMetadata = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params
    const artwork = await Artwork.findOne({ id })

    if (!artwork) {
      // Return a 404 error but we could also return generic mock if we wanted for SEO trial
      return next(createError('Artwork not found', 404))
    }

    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000'
    const artworkUrl = `${baseUrl}/artwork/${id}`

    const metadata = {
      title: `${artwork.title} - Muse AI Art Marketplace`,
      description: `${artwork.description} | Price: ${artwork.price} ${artwork.currency}`,
      image: artwork.image,
      url: artworkUrl,
      type: 'website',
      siteName: 'Muse - AI Art Marketplace',
      twitterCard: 'summary_large_image',
      twitterSite: '@museartmarket',
      additionalTags: {
        'art:category': artwork.metadata?.category,
        'art:price': `${artwork.price} ${artwork.currency}`,
        'art:creator': artwork.creator,
        'art:ai_model': artwork.metadata?.attributes?.aiModel,
        'art:prompt': artwork.metadata?.attributes?.prompt,
      }
    }

    res.json({
      success: true,
      data: metadata,
    })
  } catch (error) {
    logger.error(`Failed to fetch artwork metadata for ${req.params.id}`, { errorMessage: error instanceof Error ? error.message : String(error) })
    next(createError('Failed to fetch artwork metadata', 500))
  }
}
