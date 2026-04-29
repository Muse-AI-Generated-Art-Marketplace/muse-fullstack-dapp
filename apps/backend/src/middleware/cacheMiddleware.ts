import { Request, Response, NextFunction } from 'express'
import cacheService from '@/services/cacheService'
import { createLogger } from '@/utils/logger'
import etag from 'etag'

const logger = createLogger('CacheMiddleware')

export interface RouteSpecificCacheOptions {
  ttl?: number // Time to live in seconds
  key?: string | ((req: Request) => string)
  condition?: (req: Request, res: Response) => boolean
  skipCache?: boolean
  useETag?: boolean
}

const defaultOptions: RouteSpecificCacheOptions = {
  ttl: 300, // 5 minutes
  useETag: true,
  skipCache: false
}

const buildCacheMiddleware = (options: RouteSpecificCacheOptions = {}) => {
  const opts = { ...defaultOptions, ...options }

  return async (req: Request, res: Response, next: NextFunction) => {
    // Skip caching for non-GET requests or if explicitly disabled
    if (req.method !== 'GET' || opts.skipCache) {
      return next()
    }

    // Check condition if provided
    if (opts.condition && !opts.condition(req, res)) {
      return next()
    }

    // Generate cache key
    const cacheKey = typeof opts.key === 'function' 
      ? opts.key(req) 
      : opts.key || generateCacheKey(req)

    try {
      // Check ETag first if enabled
      if (opts.useETag) {
        const cachedData = await cacheService.get<any>(cacheKey)
        if (cachedData) {
          const cachedETag = cachedData.etag
          const ifNoneMatch = req.headers['if-none-match']

          if (ifNoneMatch && ifNoneMatch === cachedETag) {
            logger.debug(`Cache hit for ${cacheKey} - ETag match, returning 304`)
            return res.status(304).end()
          }
        }
      }

      // Try to get cached response
      const cachedResponse = await cacheService.get<any>(cacheKey)
      if (cachedResponse) {
        logger.debug(`Cache hit for ${cacheKey}`)
        
        // Set cache headers
        if (cachedResponse.headers) {
          Object.entries(cachedResponse.headers).forEach(([key, value]) => {
            res.set(key, value as string)
          })
        }

        // Set ETag if available
        if (cachedResponse.etag) {
          res.set('ETag', cachedResponse.etag)
        }

        return res.json(cachedResponse.data)
      }

      logger.debug(`Cache miss for ${cacheKey}`)

      // Intercept response to cache it
      const originalJson = res.json
      const originalStatus = res.status

      res.json = function(data: any) {
        // Only cache successful responses
        if (res.statusCode >= 200 && res.statusCode < 300) {
          const responseToCache = {
            data,
            headers: res.getHeaders(),
            timestamp: Date.now()
          }

          // Generate ETag if enabled
          if (opts.useETag) {
            const generatedETag = etag(JSON.stringify(data))
            responseToCache.etag = generatedETag
            res.set('ETag', generatedETag)
          }

          // Cache the response
          cacheService.set(cacheKey, responseToCache, opts.ttl)
            .then(() => logger.debug(`Cached response for ${cacheKey}`))
            .catch(error => logger.error(`Failed to cache ${cacheKey}:`, error))
        }

        return originalJson.call(this, data)
      }

      next()
    } catch (error) {
      logger.error('Cache middleware error:', error)
      next() // Continue without caching if there's an error
    }
  }
}

// Helper function to generate cache key from request
function generateCacheKey(req: Request): string {
  const baseUrl = req.baseUrl || ''
  const route = req.route?.path || ''
  const url = req.originalUrl || req.url
  const query = JSON.stringify(req.query)
  
  return `cache:${req.method}:${baseUrl}${route}:${query}:${url}`
}

// Specialized cache middleware for different use cases
export const artworkListCache = buildCacheMiddleware({
  ttl: 600, // 10 minutes for artwork listings
  key: (req) => `artworks:list:${JSON.stringify(req.query)}`
})

export const artworkDetailCache = buildCacheMiddleware({
  ttl: 1800, // 30 minutes for individual artwork details
  key: (req) => `artwork:detail:${req.params.id}`,
  useETag: true
})

export const userProfileCache = buildCacheMiddleware({
  ttl: 900, // 15 minutes for user profiles
  key: (req) => `user:profile:${req.user?.address || 'anonymous'}`,
  condition: (req) => !!req.user // Only cache authenticated users
})

export const metadataCache = buildCacheMiddleware({
  ttl: 3600, // 1 hour for metadata (SEO data)
  key: (req) => `metadata:${req.params.id}`,
  useETag: true
})

export const aiStatusCache = buildCacheMiddleware({
  ttl: 30, // 30 seconds for AI generation status
  key: (req) => `ai:status:${req.params.id}`,
  useETag: false
})

// Cache invalidation helpers
export const invalidateArtworkCache = async (artworkId?: string) => {
  try {
    if (artworkId) {
      await Promise.all([
        cacheService.del(`artwork:detail:${artworkId}`),
        cacheService.delPattern('artworks:list:*'),
        cacheService.del(`metadata:${artworkId}`)
      ])
      logger.info(`Invalidated cache for artwork ${artworkId}`)
    } else {
      await Promise.all([
        cacheService.delPattern('artwork:detail:*'),
        cacheService.delPattern('artworks:list:*'),
        cacheService.delPattern('metadata:*')
      ])
      logger.info('Invalidated all artwork caches')
    }
  } catch (error) {
    logger.error('Error invalidating artwork cache:', error)
  }
}

export const userStatsCache = buildCacheMiddleware({
  ttl: 300, // 5 minutes for user stats (aggregations are expensive)
  key: (req) => `user:stats:${req.params.address}`,
})

export const userActivityCache = buildCacheMiddleware({
  ttl: 120, // 2 minutes for activity feed
  key: (req) => `user:activity:${req.params.address}:${JSON.stringify(req.query)}`,
})

export const leaderboardCache = buildCacheMiddleware({
  ttl: 300, // 5 minutes for leaderboard
  key: (req) => `user:leaderboard:${req.query.type || 'followers'}:${req.query.limit || '10'}`,
})

export const invalidateUserCache = async (userAddress: string) => {
  try {
    await Promise.all([
      cacheService.del(`user:profile:${userAddress}`),
      cacheService.del(`user:stats:${userAddress}`),
      cacheService.delPattern(`user:activity:${userAddress}:*`),
    ])
    logger.info(`Invalidated cache for user ${userAddress}`)
  } catch (error) {
    logger.error('Error invalidating user cache:', error)
  }
}
