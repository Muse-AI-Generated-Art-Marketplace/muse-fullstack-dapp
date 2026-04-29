import rateLimit from 'express-rate-limit'
import { Request, Response, NextFunction } from 'express'
import { TIER_LIMITS, AI_GENERATION_LIMITS, AUTH_LIMITS } from '../config/rateLimitConfig'
import { AuthRequest } from './authMiddleware'
import { rateLimitService } from '../services/rateLimitService'
import { createError } from './errorHandler'
import { createLogger } from '@/utils/logger'

const logger = createLogger('RateLimitMiddleware')

/**
 * Redis-based distributed rate limiter for general API endpoints.
 * Dynamically adjusts limits based on user tier if authenticated.
 */
export const standardLimiter = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const result = await rateLimitService.checkRateLimit(req, 'standard')
    
    // Set rate limit headers
    res.set({
      'X-RateLimit-Limit': result.limit.toString(),
      'X-RateLimit-Remaining': result.remaining.toString(),
      'X-RateLimit-Reset': Math.ceil(result.resetTime.getTime() / 1000).toString(),
      'X-RateLimit-Tier': result.tier
    })

    if (!result.allowed) {
      const tier = req.user?.tier || 'anonymous'
      const limits = TIER_LIMITS[tier as keyof typeof TIER_LIMITS] || TIER_LIMITS.anonymous
      return next(createError(limits.message, 429))
    }

    next()
  } catch (error) {
    logger.error('Rate limiting error:', error)
    // Fail open - allow the request if rate limiting fails
    next()
  }
}

/**
 * Redis-based distributed rate limiter for AI generation endpoints.
 */
export const aiGenerationLimiter = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const result = await rateLimitService.checkRateLimit(req, 'ai')
    
    // Set rate limit headers
    res.set({
      'X-RateLimit-Limit': result.limit.toString(),
      'X-RateLimit-Remaining': result.remaining.toString(),
      'X-RateLimit-Reset': Math.ceil(result.resetTime.getTime() / 1000).toString(),
      'X-RateLimit-Tier': result.tier
    })

    if (!result.allowed) {
      const tier = req.user?.tier || 'anonymous'
      const limits = AI_GENERATION_LIMITS[tier as keyof typeof AI_GENERATION_LIMITS] || AI_GENERATION_LIMITS.anonymous
      return next(createError(limits.message, 429))
    }

    next()
  } catch (error) {
    logger.error('AI generation rate limiting error:', error)
    // Fail open - allow the request if rate limiting fails
    next()
  }
}

/**
 * Very strict rate limiter for authentication endpoints to prevent brute force.
 * Uses traditional express-rate-limit for auth endpoints (IP-based only)
 */
export const authLimiter = rateLimit({
  windowMs: AUTH_LIMITS.windowMs,
  max: AUTH_LIMITS.max,
  keyGenerator: (req) => req.ip || 'anonymous',
  message: AUTH_LIMITS.message,
  standardHeaders: true,
  legacyHeaders: false,
})
