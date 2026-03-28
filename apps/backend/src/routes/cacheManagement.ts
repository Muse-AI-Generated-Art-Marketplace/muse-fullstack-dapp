import express from 'express'
import { z } from 'zod'
import cacheService from '@/services/cacheService'
import { createLogger } from '@/utils/logger'

const router = express.Router()
const logger = createLogger('CacheManagementRoutes')

// Validation schemas
const cacheKeySchema = z.object({
  key: z.string().min(1)
})

const cacheSetSchema = z.object({
  key: z.string().min(1),
  value: z.any(),
  ttl: z.number().min(1).optional()
})

const cacheMultipleSchema = z.object({
  entries: z.array(z.object({
    key: z.string().min(1),
    value: z.any(),
    ttl: z.number().min(1).optional()
  })).min(1)
})

// Middleware to validate cache key
const validateCacheKey = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  try {
    req.params = cacheKeySchema.parse(req.params)
    next()
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Validation failed',
        details: error.errors
      })
    }
    return res.status(400).json({ error: 'Invalid cache key' })
  }
}

// GET /api/cache/health - Check cache health
router.get('/health', async (req: express.Request, res: express.Response) => {
  try {
    const health = await cacheService.healthCheck()
    
    const statusCode = health.status === 'healthy' ? 200 : 
                     health.status === 'degraded' ? 206 : 503
    
    res.status(statusCode).json({
      success: health.status !== 'unhealthy',
      data: health
    })
  } catch (error) {
    logger.error('Error checking cache health:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to check cache health'
    })
  }
})

// GET /api/cache/stats - Get cache statistics
router.get('/stats', async (req: express.Request, res: express.Response) => {
  try {
    const stats = cacheService.getCacheStats()
    const analytics = await cacheService.getAnalytics()
    
    res.json({
      success: true,
      data: {
        ...stats,
        analytics
      }
    })
  } catch (error) {
    logger.error('Error fetching cache stats:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to fetch cache statistics'
    })
  }
})

// GET /api/cache/:key - Get cached value
router.get('/:key', validateCacheKey, async (req: express.Request, res: express.Response) => {
  try {
    const { key } = req.params
    const value = await cacheService.get(key)
    
    if (value === null) {
      return res.status(404).json({
        success: false,
        error: 'Cache key not found'
      })
    }
    
    res.json({
      success: true,
      data: {
        key,
        value,
        ttl: await cacheService.getTtl(key)
      }
    })
  } catch (error) {
    logger.error('Error getting cache value:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to get cache value'
    })
  }
})

// POST /api/cache - Set cache value
router.post('/', async (req: express.Request, res: express.Response) => {
  try {
    const { key, value, ttl } = cacheSetSchema.parse(req.body)
    
    const success = await cacheService.set(key, value, ttl)
    
    if (!success) {
      return res.status(500).json({
        success: false,
        error: 'Failed to set cache value'
      })
    }
    
    logger.info(`Cache set: ${key}`)
    
    res.status(201).json({
      success: true,
      data: {
        key,
        ttl: ttl || 'default'
      }
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Validation failed',
        details: error.errors
      })
    }
    
    logger.error('Error setting cache value:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to set cache value'
    })
  }
})

// POST /api/cache/multiple - Set multiple cache values
router.post('/multiple', async (req: express.Request, res: express.Response) => {
  try {
    const { entries } = cacheMultipleSchema.parse(req.body)
    
    const success = await cacheService.setMultiple(entries)
    
    if (!success) {
      return res.status(500).json({
        success: false,
        error: 'Failed to set cache values'
      })
    }
    
    logger.info(`Multiple cache values set: ${entries.length} entries`)
    
    res.status(201).json({
      success: true,
      data: {
        count: entries.length,
        keys: entries.map(e => e.key)
      }
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Validation failed',
        details: error.errors
      })
    }
    
    logger.error('Error setting multiple cache values:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to set cache values'
    })
  }
})

// DELETE /api/cache/:key - Delete cache key
router.delete('/:key', validateCacheKey, async (req: express.Request, res: express.Response) => {
  try {
    const { key } = req.params
    
    const success = await cacheService.del(key)
    
    if (!success) {
      return res.status(500).json({
        success: false,
        error: 'Failed to delete cache key'
      })
    }
    
    logger.info(`Cache key deleted: ${key}`)
    
    res.json({
      success: true,
      message: 'Cache key deleted successfully'
    })
  } catch (error) {
    logger.error('Error deleting cache key:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to delete cache key'
    })
  }
})

// DELETE /api/cache/pattern/:pattern - Delete cache keys by pattern
router.delete('/pattern/:pattern', async (req: express.Request, res: express.Response) => {
  try {
    const { pattern } = req.params
    
    const success = await cacheService.delPattern(pattern)
    
    if (!success) {
      return res.status(500).json({
        success: false,
        error: 'Failed to delete cache pattern'
      })
    }
    
    logger.info(`Cache pattern deleted: ${pattern}`)
    
    res.json({
      success: true,
      message: 'Cache pattern deleted successfully'
    })
  } catch (error) {
    logger.error('Error deleting cache pattern:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to delete cache pattern'
    })
  }
})

// DELETE /api/cache/flush - Flush all cache
router.delete('/flush', async (req: express.Request, res: express.Response) => {
  try {
    const success = await cacheService.flush()
    
    if (!success) {
      return res.status(500).json({
        success: false,
        error: 'Failed to flush cache'
      })
    }
    
    logger.warn('Cache flushed')
    
    res.json({
      success: true,
      message: 'Cache flushed successfully'
    })
  } catch (error) {
    logger.error('Error flushing cache:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to flush cache'
    })
  }
})

// POST /api/cache/warmup - Warm up cache with common data
router.post('/warmup', async (req: express.Request, res: express.Response) => {
  try {
    const warmupData = [
      { key: 'popular_artworks', data: { artworks: [] }, ttl: 3600 },
      { key: 'featured_artists', data: { artists: [] }, ttl: 3600 },
      { key: 'trending_styles', data: { styles: [] }, ttl: 1800 },
      { key: 'market_stats', data: { totalArtworks: 0, totalUsers: 0 }, ttl: 600 }
    ]
    
    await cacheService.setMultiple(warmupData)
    
    logger.info(`Cache warmed up with ${warmupData.length} entries`)
    
    res.json({
      success: true,
      data: {
        entriesWarmed: warmupData.length,
        keys: warmupData.map(entry => entry.key)
      }
    })
  } catch (error) {
    logger.error('Error warming up cache:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to warm up cache'
    })
  }
})

// GET /api/cache/increment/:key - Increment counter
router.get('/increment/:key', validateCacheKey, async (req: express.Request, res: express.Response) => {
  try {
    const { key } = req.params
    const amount = parseInt(req.query.amount as string) || 1
    
    const result = await cacheService.increment(key, amount)
    
    if (result === null) {
      return res.status(500).json({
        success: false,
        error: 'Failed to increment counter'
      })
    }
    
    res.json({
      success: true,
      data: {
        key,
        value: result,
        incremented: amount
      }
    })
  } catch (error) {
    logger.error('Error incrementing counter:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to increment counter'
    })
  }
})

export default router
