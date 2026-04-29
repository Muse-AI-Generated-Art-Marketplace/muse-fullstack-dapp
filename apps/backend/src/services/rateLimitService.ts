import { Request, Response } from 'express'
import { redis } from '@/config/redis'
import { createLogger } from '@/utils/logger'
import { TIER_LIMITS, AI_GENERATION_LIMITS } from '@/config/rateLimitConfig'
import { AuthRequest } from '@/middleware/authMiddleware'

const logger = createLogger('RateLimitService')

export interface RateLimitResult {
  allowed: boolean
  remaining: number
  resetTime: Date
  limit: number
  windowMs: number
  tier: string
}

export class RateLimitService {
  private static instance: RateLimitService

  private constructor() {}

  public static getInstance(): RateLimitService {
    if (!RateLimitService.instance) {
      RateLimitService.instance = new RateLimitService()
    }
    return RateLimitService.instance
  }

  /**
   * Check rate limit using Redis for distributed rate limiting
   */
  public async checkRateLimit(
    req: AuthRequest,
    limitType: 'standard' | 'ai' = 'standard'
  ): Promise<RateLimitResult> {
    const tier = req.user?.tier || 'anonymous'
    const identifier = this.getIdentifier(req)
    
    const limits = limitType === 'ai' 
      ? AI_GENERATION_LIMITS[tier as keyof typeof AI_GENERATION_LIMITS] || AI_GENERATION_LIMITS.anonymous
      : TIER_LIMITS[tier as keyof typeof TIER_LIMITS] || TIER_LIMITS.anonymous

    const key = `rate_limit:${limitType}:${identifier}:${tier}`
    const windowMs = limits.windowMs
    const maxRequests = limits.max

    try {
      if (redis.getConnectionStatus()) {
        return await this.checkRedisRateLimit(key, maxRequests, windowMs, tier)
      } else {
        logger.warn('Redis not available, falling back to memory rate limiting')
        return await this.checkMemoryRateLimit(key, maxRequests, windowMs, tier)
      }
    } catch (error) {
      logger.error('Rate limiting error, allowing request:', error)
      // Fail open - allow the request if rate limiting fails
      return {
        allowed: true,
        remaining: maxRequests - 1,
        resetTime: new Date(Date.now() + windowMs),
        limit: maxRequests,
        windowMs,
        tier
      }
    }
  }

  /**
   * Redis-based distributed rate limiting using sliding window algorithm
   */
  private async checkRedisRateLimit(
    key: string,
    maxRequests: number,
    windowMs: number,
    tier: string
  ): Promise<RateLimitResult> {
    const client = redis.getClient()
    if (!client) {
      throw new Error('Redis client not available')
    }

    const now = Date.now()
    const windowStart = now - windowMs
    const resetTime = new Date(now + windowMs)

    try {
      // Use a sorted set for sliding window
      const pipeline = client.multi()
      
      // Remove expired entries
      pipeline.zRemRangeByScore(key, 0, windowStart)
      
      // Count current requests in window
      pipeline.zCard(key)
      
      // Add current request
      pipeline.zAdd(key, { score: now, value: `${now}-${Math.random()}` })
      
      // Set expiration on the key
      pipeline.expire(key, Math.ceil(windowMs / 1000))

      const results = await pipeline.exec()
      
      if (!results) {
        throw new Error('Redis pipeline execution failed')
      }

      const currentRequests = (results[1] as any).response as number
      const allowed = currentRequests < maxRequests
      const remaining = Math.max(0, maxRequests - currentRequests - 1)

      if (!allowed) {
        logger.debug('Rate limit exceeded', { key, currentRequests, maxRequests, tier })
      }

      return {
        allowed,
        remaining,
        resetTime,
        limit: maxRequests,
        windowMs,
        tier
      }

    } catch (error) {
      logger.error('Redis rate limiting error:', error)
      throw error
    }
  }

  /**
   * Fallback in-memory rate limiting (less accurate in distributed environment)
   */
  private memoryStore = new Map<string, { count: number; resetTime: number }>()

  private async checkMemoryRateLimit(
    key: string,
    maxRequests: number,
    windowMs: number,
    tier: string
  ): Promise<RateLimitResult> {
    const now = Date.now()
    const record = this.memoryStore.get(key)

    if (!record || now > record.resetTime) {
      // New window or expired window
      this.memoryStore.set(key, {
        count: 1,
        resetTime: now + windowMs
      })

      return {
        allowed: true,
        remaining: maxRequests - 1,
        resetTime: new Date(now + windowMs),
        limit: maxRequests,
        windowMs,
        tier
      }
    }

    // Existing window
    const allowed = record.count < maxRequests
    const remaining = Math.max(0, maxRequests - record.count - 1)

    if (allowed) {
      record.count++
    }

    return {
      allowed,
      remaining,
      resetTime: new Date(record.resetTime),
      limit: maxRequests,
      windowMs,
      tier
    }
  }

  /**
   * Get rate limit status for a user
   */
  public async getRateLimitStatus(req: AuthRequest): Promise<{
    standard: RateLimitResult
    ai: RateLimitResult
  }> {
    const [standard, ai] = await Promise.all([
      this.checkRateLimit(req, 'standard'),
      this.checkRateLimit(req, 'ai')
    ])

    return { standard, ai }
  }

  /**
   * Reset rate limits for a user (admin function)
   */
  public async resetRateLimit(identifier: string, limitType: 'standard' | 'ai' = 'standard'): Promise<void> {
    if (redis.getConnectionStatus()) {
      const client = redis.getClient()
      if (!client) {
        throw new Error('Redis client not available')
      }

      // Delete all rate limit keys for this identifier across all tiers
      const tiers = ['anonymous', 'verified', 'premium']
      const pipeline = client.multi()

      for (const tier of tiers) {
        pipeline.del(`rate_limit:${limitType}:${identifier}:${tier}`)
      }

      await pipeline.exec()
      logger.info('Rate limits reset for identifier', { identifier, limitType })
    } else {
      // Clear memory store
      const keysToDelete: string[] = []
      for (const [key] of this.memoryStore.entries()) {
        if (key.includes(identifier)) {
          keysToDelete.push(key)
        }
      }
      keysToDelete.forEach(key => this.memoryStore.delete(key))
      logger.info('Memory rate limits reset for identifier', { identifier, limitType })
    }
  }

  /**
   * Get rate limit statistics (admin function)
   */
  public async getRateLimitStats(): Promise<{
    redisConnected: boolean
    memoryStoreSize: number
    totalTrackedIdentifiers: number
  }> {
    const redisConnected = redis.getConnectionStatus()
    const memoryStoreSize = this.memoryStore.size

    // Count unique identifiers from memory store keys
    const identifiers = new Set<string>()
    for (const [key] of this.memoryStore.entries()) {
      const parts = key.split(':')
      if (parts.length >= 3) {
        identifiers.add(parts[2]) // identifier is at index 2
      }
    }

    return {
      redisConnected,
      memoryStoreSize,
      totalTrackedIdentifiers: identifiers.size
    }
  }

  /**
   * Clean up expired entries from memory store
   */
  public async cleanupMemoryStore(): Promise<void> {
    const now = Date.now()
    const keysToDelete: string[] = []

    for (const [key, record] of this.memoryStore.entries()) {
      if (now > record.resetTime) {
        keysToDelete.push(key)
      }
    }

    keysToDelete.forEach(key => this.memoryStore.delete(key))
    
    if (keysToDelete.length > 0) {
      logger.debug('Cleaned up expired memory rate limit entries', { count: keysToDelete.length })
    }
  }

  /**
   * Get identifier for rate limiting (user address or IP)
   */
  private getIdentifier(req: AuthRequest): string {
    return req.user?.address || req.ip || 'anonymous'
  }
}

export const rateLimitService = RateLimitService.getInstance()
