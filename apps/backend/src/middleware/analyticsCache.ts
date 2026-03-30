import { Request, Response, NextFunction } from 'express'
import { createLogger } from '@/utils/logger'
import { CacheEntry, AnalyticsResponse } from '@/models/Analytics'

const logger = createLogger('AnalyticsCache')

// In-memory cache for analytics data (5-minute TTL)
const analyticsCache = new Map<string, CacheEntry<any>>()

const CACHE_TTL = 5 * 60 * 1000 // 5 minutes in milliseconds

export const generateCacheKey = (req: Request): string => {
  const { originalUrl, query } = req
  const queryString = Object.keys(query)
    .sort()
    .map(key => `${key}=${query[key]}`)
    .join('&')
  return `${originalUrl}:${queryString}`
}

export const analyticsCacheMiddleware = (ttl: number = CACHE_TTL) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const cacheKey = generateCacheKey(req)
    const cached = analyticsCache.get(cacheKey)

    if (cached && Date.now() - cached.timestamp < cached.ttl) {
      logger.debug('Cache hit for analytics endpoint', { cacheKey })
      
      // Return cached response with cache metadata
      const cachedResponse: AnalyticsResponse<any> = {
        ...cached.data,
        meta: {
          ...cached.data.meta,
          cached: true,
          generatedAt: new Date(cached.timestamp).toISOString()
        }
      }
      
      return res.json(cachedResponse)
    }

    // Store original res.json method
    const originalJson = res.json

    // Override res.json to cache the response
    res.json = function(data: any) {
      // Only cache successful responses
      if (data && data.success === true) {
        const cacheEntry: CacheEntry<any> = {
          data,
          timestamp: Date.now(),
          ttl
        }
        
        analyticsCache.set(cacheKey, cacheEntry)
        logger.debug('Cached analytics response', { cacheKey })
      }

      // Call original json method
      return originalJson.call(this, data)
    }

    next()
  }
}

export const clearAnalyticsCache = (pattern?: string) => {
  if (pattern) {
    // Clear cache entries matching pattern
    for (const key of analyticsCache.keys()) {
      if (key.includes(pattern)) {
        analyticsCache.delete(key)
        logger.debug('Cleared analytics cache entry', { key })
      }
    }
  } else {
    // Clear all analytics cache
    const size = analyticsCache.size
    analyticsCache.clear()
    logger.info('Cleared all analytics cache', { entries: size })
  }
}

export const getCacheStats = () => {
  const now = Date.now()
  let validEntries = 0
  let expiredEntries = 0

  for (const [key, entry] of analyticsCache.entries()) {
    if (now - entry.timestamp < entry.ttl) {
      validEntries++
    } else {
      expiredEntries++
    }
  }

  return {
    totalEntries: analyticsCache.size,
    validEntries,
    expiredEntries,
    memoryUsage: process.memoryUsage()
  }
}

// Clean up expired cache entries periodically
export const cleanupExpiredCache = () => {
  const now = Date.now()
  let cleaned = 0

  for (const [key, entry] of analyticsCache.entries()) {
    if (now - entry.timestamp >= entry.ttl) {
      analyticsCache.delete(key)
      cleaned++
    }
  }

  if (cleaned > 0) {
    logger.debug('Cleaned up expired cache entries', { count: cleaned })
  }

  return cleaned
}

// Run cleanup every 2 minutes
setInterval(cleanupExpiredCache, 2 * 60 * 1000)

export default {
  analyticsCacheMiddleware,
  clearAnalyticsCache,
  getCacheStats,
  cleanupExpiredCache,
  generateCacheKey
}
