import Redis from 'redis'
import NodeCache from 'node-cache'
import { createLogger } from '@/utils/logger'

const logger = createLogger('CacheService')

interface CacheConfig {
  redis?: {
    host: string
    port: number
    password?: string
    db?: number
  }
  fallback: {
    stdTTL: number
    checkperiod: number
  }
}

class CacheService {
  private redisClient: Redis.RedisClientType | null = null
  private fallbackCache: NodeCache
  private useRedis: boolean = false

  constructor(config: CacheConfig) {
    // Initialize fallback cache (in-memory)
    this.fallbackCache = new NodeCache({
      stdTTL: config.fallback.stdTTL,
      checkperiod: config.fallback.checkperiod,
      useClones: false
    })

    // Initialize Redis if configured
    if (config.redis) {
      this.initializeRedis(config.redis)
    }
  }

  private async initializeRedis(config: NonNullable<CacheConfig['redis']>) {
    try {
      this.redisClient = Redis.createClient({
        socket: {
          host: config.host,
          port: config.port
        },
        password: config.password,
        database: config.db || 0
      })

      this.redisClient.on('error', (err) => {
        logger.error('Redis connection error:', err)
        this.useRedis = false
      })

      this.redisClient.on('connect', () => {
        logger.info('Redis connected successfully')
        this.useRedis = true
      })

      await this.redisClient.connect()
    } catch (error) {
      logger.error('Failed to initialize Redis:', error)
      this.useRedis = false
    }
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      if (this.useRedis && this.redisClient) {
        const value = await this.redisClient.get(key)
        if (value) {
          return JSON.parse(value) as T
        }
      }

      // Fallback to in-memory cache
      const value = this.fallbackCache.get<T>(key)
      if (value !== undefined) {
        return value
      }

      return null
    } catch (error) {
      logger.error(`Error getting cache key ${key}:`, error)
      return null
    }
  }

  async set(key: string, value: any, ttl?: number): Promise<boolean> {
    try {
      const serializedValue = JSON.stringify(value)

      if (this.useRedis && this.redisClient) {
        if (ttl) {
          await this.redisClient.setEx(key, ttl, serializedValue)
        } else {
          await this.redisClient.set(key, serializedValue)
        }
      }

      // Always set in fallback cache
      this.fallbackCache.set(key, value, ttl)

      return true
    } catch (error) {
      logger.error(`Error setting cache key ${key}:`, error)
      return false
    }
  }

  async del(key: string): Promise<boolean> {
    try {
      if (this.useRedis && this.redisClient) {
        await this.redisClient.del(key)
      }

      this.fallbackCache.del(key)
      return true
    } catch (error) {
      logger.error(`Error deleting cache key ${key}:`, error)
      return false
    }
  }

  async delPattern(pattern: string): Promise<boolean> {
    try {
      if (this.useRedis && this.redisClient) {
        const keys = await this.redisClient.keys(pattern)
        if (keys.length > 0) {
          await this.redisClient.del(keys)
        }
      }

      // For fallback cache, we need to manually find and delete matching keys
      const keys = this.fallbackCache.keys()
      const matchingKeys = keys.filter(key => key.includes(pattern.replace('*', '')))
      this.fallbackCache.del(matchingKeys)

      return true
    } catch (error) {
      logger.error(`Error deleting cache pattern ${pattern}:`, error)
      return false
    }
  }

  async exists(key: string): Promise<boolean> {
    try {
      if (this.useRedis && this.redisClient) {
        const result = await this.redisClient.exists(key)
        return result === 1
      }

      return this.fallbackCache.has(key)
    } catch (error) {
      logger.error(`Error checking cache key ${key}:`, error)
      return false
    }
  }

  async flush(): Promise<boolean> {
    try {
      if (this.useRedis && this.redisClient) {
        await this.redisClient.flushDb()
      }

      this.fallbackCache.flushAll()
      return true
    } catch (error) {
      logger.error('Error flushing cache:', error)
      return false
    }
  }

  getCacheStats() {
    return {
      useRedis: this.useRedis,
      fallbackKeys: this.fallbackCache.keys().length,
      fallbackStats: this.fallbackCache.getStats()
    }
  }

  async disconnect() {
    if (this.redisClient) {
      await this.redisClient.disconnect()
    }
    this.fallbackCache.close()
  }

  // Advanced caching methods
  
  async getOrSet<T>(
    key: string, 
    fetcher: () => Promise<T>, 
    ttl?: number
  ): Promise<T | null> {
    try {
      // Try to get from cache first
      let value = await this.get<T>(key)
      
      if (value === null) {
        // If not in cache, fetch the data
        value = await fetcher()
        
        if (value !== null && value !== undefined) {
          // Cache the fetched data
          await this.set(key, value, ttl)
          logger.debug(`Cache miss, fetched and cached: ${key}`)
        }
      } else {
        logger.debug(`Cache hit: ${key}`)
      }
      
      return value
    } catch (error) {
      logger.error(`Error in getOrSet for ${key}:`, error)
      return null
    }
  }

  async getMultiple<T>(keys: string[]): Promise<Map<string, T | null>> {
    const results = new Map<string, T | null>()
    
    try {
      if (this.useRedis && this.redisClient) {
        // Use Redis MGET for multiple keys
        const values = await this.redisClient.mGet(keys)
        
        keys.forEach((key, index) => {
          const value = values[index]
          if (value) {
            try {
              results.set(key, JSON.parse(value) as T)
            } catch (parseError) {
              logger.warn(`Failed to parse cached value for ${key}:`, parseError)
              results.set(key, null)
            }
          } else {
            results.set(key, null)
          }
        })
      } else {
        // Fallback to individual cache calls
        for (const key of keys) {
          const value = await this.get<T>(key)
          results.set(key, value)
        }
      }
    } catch (error) {
      logger.error('Error getting multiple cache keys:', error)
      // Return empty map on error
      keys.forEach(key => results.set(key, null))
    }
    
    return results
  }

  async setMultiple(
    entries: Array<{ key: string; value: any; ttl?: number }>,
    defaultTtl?: number
  ): Promise<boolean> {
    try {
      if (this.useRedis && this.redisClient) {
        // Use Redis pipeline for multiple sets
        const pipeline = this.redisClient.multi()
        
        entries.forEach(({ key, value, ttl }) => {
          const serializedValue = JSON.stringify(value)
          const finalTtl = ttl || defaultTtl
          
          if (finalTtl) {
            pipeline.setEx(key, finalTtl, serializedValue)
          } else {
            pipeline.set(key, serializedValue)
          }
        })
        
        await pipeline.exec()
      }
      
      // Always set in fallback cache
      entries.forEach(({ key, value, ttl }) => {
        this.fallbackCache.set(key, value, ttl || defaultTtl)
      })
      
      return true
    } catch (error) {
      logger.error('Error setting multiple cache keys:', error)
      return false
    }
  }

  async increment(key: string, amount: number = 1): Promise<number | null> {
    try {
      if (this.useRedis && this.redisClient) {
        const result = await this.redisClient.incrBy(key, amount)
        
        // Also update fallback cache
        this.fallbackCache.set(key, result.toString(), 300)
        
        return result
      } else {
        // Fallback implementation
        const currentValue = await this.get<string>(key)
        const newValue = currentValue ? parseInt(currentValue) + amount : amount
        await this.set(key, newValue.toString(), 300)
        return newValue
      }
    } catch (error) {
      logger.error(`Error incrementing cache key ${key}:`, error)
      return null
    }
  }

  async getTtl(key: string): Promise<number | null> {
    try {
      if (this.useRedis && this.redisClient) {
        return await this.redisClient.ttl(key)
      }
      
      // Fallback cache doesn't support TTL, return default
      return this.fallbackCache.getTtl(key) || -1
    } catch (error) {
      logger.error(`Error getting TTL for ${key}:`, error)
      return null
    }
  }

  async setWithExpiry(key: string, value: any, expiryDate: Date): Promise<boolean> {
    const ttl = Math.floor((expiryDate.getTime() - Date.now()) / 1000)
    
    if (ttl <= 0) {
      logger.warn(`Expiry date is in the past for key: ${key}`)
      return false
    }
    
    return await this.set(key, value, ttl)
  }

  // Cache health and diagnostics
  async healthCheck(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy'
    redis: boolean
    fallback: boolean
    details?: any
  }> {
    const health = {
      status: 'healthy' as 'healthy' | 'degraded' | 'unhealthy',
      redis: false,
      fallback: false,
      details: {}
    }

    try {
      // Check Redis health
      if (this.redisClient && this.useRedis) {
        await this.redisClient.ping()
        health.redis = true
        health.details.redis = 'connected'
      } else {
        health.details.redis = 'disconnected'
      }
    } catch (error) {
      health.details.redis = `error: ${error}`
    }

    try {
      // Check fallback cache health
      const testKey = 'health_check_' + Date.now()
      this.fallbackCache.set(testKey, 'test', 1)
      const value = this.fallbackCache.get(testKey)
      this.fallbackCache.del(testKey)
      
      if (value === 'test') {
        health.fallback = true
        health.details.fallback = 'working'
      } else {
        health.details.fallback = 'not working'
      }
    } catch (error) {
      health.details.fallback = `error: ${error}`
    }

    // Determine overall health
    if (health.redis && health.fallback) {
      health.status = 'healthy'
    } else if (health.fallback) {
      health.status = 'degraded'
    } else {
      health.status = 'unhealthy'
    }

    return health
  }

  // Cache analytics
  async getAnalytics(): Promise<{
    totalKeys: number
    redisStats?: any
    fallbackStats: any
    hitRate?: number
  }> {
    const analytics = {
      totalKeys: 0,
      fallbackStats: this.fallbackCache.getStats()
    }

    try {
      if (this.useRedis && this.redisClient) {
        const info = await this.redisClient.info('memory')
        const keyCount = await this.redisClient.dbSize()
        
        analytics.redisStats = {
          keyCount,
          memoryInfo: info
        }
        analytics.totalKeys = keyCount
      }
    } catch (error) {
      logger.warn('Failed to get Redis analytics:', error)
    }

    return analytics
  }
}

// Cache configuration
const cacheConfig: CacheConfig = {
  redis: process.env.REDIS_URL ? {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD,
    db: parseInt(process.env.REDIS_DB || '0')
  } : undefined,
  fallback: {
    stdTTL: 300, // 5 minutes default TTL
    checkperiod: 60 // Check for expired keys every minute
  }
}

// Create singleton instance
const cacheService = new CacheService(cacheConfig)

export default cacheService
export { CacheService, CacheConfig }
