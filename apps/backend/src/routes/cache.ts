import { Router, Request, Response } from 'express'
import cacheService from '@/services/cacheService'
import { invalidateArtworkCache, invalidateUserCache } from '@/middleware/cacheMiddleware'
import { createLogger } from '@/utils/logger'
import { validate } from '@/middleware/validate'
import { clearCacheSchema, getCacheStatsSchema } from '@/schemas'

const logger = createLogger('CacheRoutes')
const router = Router()

// Get cache statistics
router.get('/stats', validate(getCacheStatsSchema), async (req: Request, res: Response) => {
  try {
    const stats = cacheService.getCacheStats()
    res.json({
      success: true,
      data: stats,
    })
  } catch (error) {
    logger.error('Error fetching cache stats:', error)
    res.status(500).json({
      success: false,
      error: {
        code: 'CACHE_STATS_ERROR',
        message: 'Failed to fetch cache statistics',
      },
    })
  }
})

// Clear all caches
router.delete('/clear', validate(clearCacheSchema), async (req: Request, res: Response) => {
  try {
    await cacheService.flush()
    logger.info('All caches cleared via API')
    res.json({
      success: true,
      message: 'All caches cleared successfully',
    })
  } catch (error) {
    logger.error('Error clearing cache:', error)
    res.status(500).json({
      success: false,
      error: {
        code: 'CACHE_CLEAR_ERROR',
        message: 'Failed to clear cache',
      },
    })
  }
})

// Invalidate artwork caches
router.delete('/invalidate/artworks', async (req: Request, res: Response) => {
  try {
    const { artworkId } = req.query
    
    if (artworkId) {
      await invalidateArtworkCache(artworkId as string)
      logger.info(`Artwork cache invalidated for ID: ${artworkId}`)
    } else {
      await invalidateArtworkCache()
      logger.info('All artwork caches invalidated')
    }
    
    res.json({
      success: true,
      message: artworkId 
        ? `Artwork cache invalidated for ID: ${artworkId}`
        : 'All artwork caches invalidated',
    })
  } catch (error) {
    logger.error('Error invalidating artwork cache:', error)
    res.status(500).json({
      success: false,
      error: {
        code: 'ARTWORK_CACHE_INVALIDATION_ERROR',
        message: 'Failed to invalidate artwork cache',
      },
    })
  }
})

// Invalidate user caches
router.delete('/invalidate/users', async (req: Request, res: Response) => {
  try {
    const { userAddress } = req.query
    
    if (!userAddress) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'User address is required',
        },
      })
    }
    
    await invalidateUserCache(userAddress as string)
    logger.info(`User cache invalidated for address: ${userAddress}`)
    
    res.json({
      success: true,
      message: `User cache invalidated for address: ${userAddress}`,
    })
  } catch (error) {
    logger.error('Error invalidating user cache:', error)
    res.status(500).json({
      success: false,
      error: {
        code: 'USER_CACHE_INVALIDATION_ERROR',
        message: 'Failed to invalidate user cache',
      },
    })
  }
})

// Get specific cache key
router.get('/key/:key', async (req: Request, res: Response) => {
  try {
    const { key } = req.params
    const value = await cacheService.get(key)
    
    if (value === null) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'CACHE_KEY_NOT_FOUND',
          message: 'Cache key not found',
        },
      })
    }
    
    res.json({
      success: true,
      data: {
        key,
        value,
      },
    })
  } catch (error) {
    logger.error(`Error fetching cache key ${req.params.key}:`, error)
    res.status(500).json({
      success: false,
      error: {
        code: 'CACHE_KEY_ERROR',
        message: 'Failed to fetch cache key',
      },
    })
  }
})

// Delete specific cache key
router.delete('/key/:key', async (req: Request, res: Response) => {
  try {
    const { key } = req.params
    const success = await cacheService.del(key)
    
    if (!success) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'CACHE_KEY_NOT_FOUND',
          message: 'Cache key not found or deletion failed',
        },
      })
    }
    
    logger.info(`Cache key deleted: ${key}`)
    
    res.json({
      success: true,
      message: `Cache key deleted: ${key}`,
    })
  } catch (error) {
    logger.error(`Error deleting cache key ${req.params.key}:`, error)
    res.status(500).json({
      success: false,
      error: {
        code: 'CACHE_KEY_DELETE_ERROR',
        message: 'Failed to delete cache key',
      },
    })
  }
})

export default router
