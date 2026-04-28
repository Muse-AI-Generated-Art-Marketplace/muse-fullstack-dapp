import rateLimit from 'express-rate-limit'
import { TIER_LIMITS, AI_GENERATION_LIMITS, AUTH_LIMITS } from '../config/rateLimitConfig'
import { AuthRequest } from './authMiddleware'

/**
 * Standard rate limiter for general API endpoints.
 * Dynamically adjusts limits based on user tier if authenticated.
 */
export const standardLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: (req: AuthRequest) => {
    const tier = req.user?.tier || 'anonymous'
    const limits = TIER_LIMITS[tier as keyof typeof TIER_LIMITS] || TIER_LIMITS.anonymous
    return limits.max
  },
  keyGenerator: (req: AuthRequest) => {
    // Priority: User Address > IP Address
    return req.user?.address || req.ip || 'anonymous'
  },
  message: (req: AuthRequest) => {
    const tier = req.user?.tier || 'anonymous'
    const limits = TIER_LIMITS[tier as keyof typeof TIER_LIMITS] || TIER_LIMITS.anonymous
    return limits.message
  },
  standardHeaders: true,
  legacyHeaders: false,
})

/**
 * Stricter rate limiter for AI generation endpoints.
 */
export const aiGenerationLimiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000, // 24 hours
  max: (req: AuthRequest) => {
    const tier = req.user?.tier || 'anonymous'
    const limits = AI_GENERATION_LIMITS[tier as keyof typeof AI_GENERATION_LIMITS] || AI_GENERATION_LIMITS.anonymous
    return limits.max
  },
  keyGenerator: (req: AuthRequest) => {
    return req.user?.address || req.ip || 'anonymous'
  },
  message: (req: AuthRequest) => {
    const tier = req.user?.tier || 'anonymous'
    const limits = AI_GENERATION_LIMITS[tier as keyof typeof AI_GENERATION_LIMITS] || AI_GENERATION_LIMITS.anonymous
    return limits.message
  },
  standardHeaders: true,
  legacyHeaders: false,
})

/**
 * Very strict rate limiter for authentication endpoints to prevent brute force.
 */
export const authLimiter = rateLimit({
  windowMs: AUTH_LIMITS.windowMs,
  max: AUTH_LIMITS.max,
  keyGenerator: (req) => req.ip || 'anonymous',
  message: AUTH_LIMITS.message,
  standardHeaders: true,
  legacyHeaders: false,
})
