import { Request, Response, NextFunction } from 'express'
import cacheService from '@/services/cacheService'
import { createLogger } from '@/utils/logger'

const logger = createLogger('CacheMiddleware')

export interface CacheOptions {
  ttl?: number // Time to live in seconds
  keyGenerator?: (req: Request) => string
  condition?: (req: Request, res: Response) => boolean
  skipCache?: boolean
}

export const cacheMiddleware = (options: CacheOptions = {}) => {
  const {
    ttl = 300, // Default 5 minutes
    keyGenerator = (req) => `cache:${req.method}:${req.originalUrl}`,
    condition = () => true,
    skipCache = false
  } = options

  return async (req: Request, res: Response, next: NextFunction) => {
    // Skip caching for specific conditions
    if (skipCache || !condition(req, res)) {
      return next()
    }

    // Skip caching for non-GET requests
    if (req.method !== 'GET') {
      return next()
    }

    const cacheKey = keyGenerator(req)

    try {
      // Try to get from cache
      const cachedData = await cacheService.get(cacheKey)
      
      if (cachedData) {
        logger.debug(`Cache hit: ${cacheKey}`)
        
        // Set cache headers
        res.set('X-Cache', 'HIT')
        res.set('X-Cache-Key', cacheKey)
        
        return res.json(cachedData)
      }

      logger.debug(`Cache miss: ${cacheKey}`)

      // Intercept response to cache it
      const originalJson = res.json
      res.json = function(data: any) {
        // Only cache successful responses
        if (res.statusCode >= 200 && res.statusCode < 300) {
          // Cache the response asynchronously
          cacheService.set(cacheKey, data, ttl).catch(error => {
            logger.warn(`Failed to cache response for ${cacheKey}:`, error)
          })
          
          logger.debug(`Cached response: ${cacheKey}`)
        }

        // Set cache headers
        res.set('X-Cache', 'MISS')
        res.set('X-Cache-Key', cacheKey)
        
        return originalJson.call(this, data)
      }

      next()
    } catch (error) {
      logger.error(`Cache middleware error for ${cacheKey}:`, error)
      next() // Continue without caching if there's an error
    }
  }
}

// Invalidate cache middleware
export const invalidateCache = (patterns: string[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const originalSend = res.send
    
    res.send = function(data: any) {
      // Invalidate cache patterns after successful response
      if (res.statusCode >= 200 && res.statusCode < 300) {
        patterns.forEach(async pattern => {
          try {
            await cacheService.delPattern(pattern)
            logger.debug(`Invalidated cache pattern: ${pattern}`)
          } catch (error) {
            logger.warn(`Failed to invalidate cache pattern ${pattern}:`, error)
          }
        })
      }
      
      return originalSend.call(this, data)
    }
    
    next()
  }
}

// Cache warming middleware
export const warmCache = (warmupData: Array<{ key: string; data: any; ttl?: number }>) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    // Warm up cache asynchronously
    warmupData.forEach(async ({ key, data, ttl }) => {
      try {
        await cacheService.set(key, data, ttl)
        logger.debug(`Warmed up cache: ${key}`)
      } catch (error) {
        logger.warn(`Failed to warm up cache ${key}:`, error)
      }
    })
    
    next()
  }
}

// Cache statistics middleware
export const cacheStats = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const stats = cacheService.getCacheStats()
    res.set('X-Cache-Stats', JSON.stringify(stats))
  } catch (error) {
    logger.warn('Failed to get cache stats:', error)
  }
  
  next()
}
