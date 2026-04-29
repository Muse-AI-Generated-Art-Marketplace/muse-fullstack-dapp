import { Request, Response, NextFunction } from 'express'
import quotaService from '@/services/quotaService'
import { createLogger } from '@/utils/logger'
import { ApiResponse } from '@/types'

const logger = createLogger('QuotaMiddleware')

export interface QuotaRequest extends Request {
  user?: {
    publicKey: string
    network?: 'testnet' | 'mainnet'
  }
}

// Get user ID from request
const getUserId = (req: QuotaRequest): string => {
  // Try to get from authenticated user first
  if (req.user?.publicKey) {
    return req.user.publicKey
  }
  
  // Fall back to IP address for unauthenticated requests
  const forwarded = req.headers['x-forwarded-for'] as string
  const ip = forwarded ? forwarded.split(',')[0] : req.ip || req.connection.remoteAddress || 'unknown'
  return `ip:${ip}`
}

// Quota enforcement middleware
export const quotaMiddleware = (options: {
  cost?: number
  feature?: string
  skipPaths?: string[]
} = {}) => {
  const { cost = 1, feature, skipPaths = [] } = options

  return async (req: QuotaRequest, res: Response, next: NextFunction) => {
    try {
      // Skip quota check for certain paths
      if (skipPaths.some(path => req.path.startsWith(path))) {
        return next()
      }

      const userId = getUserId(req)
      
      // Check feature access if specified
      if (feature) {
        const hasAccess = await quotaService.checkFeatureAccess(userId, feature)
        if (!hasAccess) {
          const response: ApiResponse = {
            success: false,
            error: {
              code: 'FEATURE_NOT_ALLOWED',
              message: 'Feature not available for your subscription tier',
              userMessage: 'This feature requires a higher subscription tier',
              statusCode: 403
            }
          }
          return res.status(403).json(response)
        }
      }

      // Check and consume quota
      const check = await quotaService.checkQuota(userId, cost)
      
      if (!check.allowed) {
        const quota = check.quota
        const response: ApiResponse = {
          success: false,
          error: {
            code: 'QUOTA_EXCEEDED',
            message: `API quota exceeded. Used ${quota.requestsUsed}/${quota.requestsLimit}`,
            userMessage: `You have exceeded your API quota. Your quota will reset in ${Math.ceil((quota.windowEnd - Date.now()) / 60000)} minutes.`,
            statusCode: 429,
            details: {
              resetTime: quota.resetTime,
              requestsUsed: quota.requestsUsed,
              requestsLimit: quota.requestsLimit,
              tier: quota.tier.name
            }
          }
        }
        
        // Set rate limit headers
        res.set({
          'X-RateLimit-Limit': quota.requestsLimit.toString(),
          'X-RateLimit-Remaining': check.remaining.toString(),
          'X-RateLimit-Reset': quota.resetTime.toString(),
          'Retry-After': Math.ceil((quota.windowEnd - Date.now()) / 1000).toString()
        })
        
        return res.status(429).json(response)
      }

      // Consume quota
      await quotaService.consumeQuota(userId, cost)

      // Add quota info to response headers
      const updatedQuota = await quotaService.getUserQuota(userId)
      res.set({
        'X-RateLimit-Limit': updatedQuota.requestsLimit.toString(),
        'X-RateLimit-Remaining': (updatedQuota.requestsLimit - updatedQuota.requestsUsed).toString(),
        'X-RateLimit-Reset': updatedQuota.resetTime.toString(),
        'X-User-Tier': updatedQuota.tier.name
      })

      // Add quota info to request for downstream use
      req.quota = updatedQuota

      next()
    } catch (error) {
      logger.error('Quota middleware error:', error)
      
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'QUOTA_ERROR',
          message: 'Error checking API quota',
          userMessage: 'An error occurred while checking your API quota',
          statusCode: 500
        }
      }
      
      res.status(500).json(response)
    }
  }
}

// Quota info middleware - adds quota info without consuming
export const quotaInfoMiddleware = async (req: QuotaRequest, res: Response, next: NextFunction) => {
  try {
    const userId = getUserId(req)
    const quota = await quotaService.getUserQuota(userId)
    
    // Add quota info to response headers
    res.set({
      'X-RateLimit-Limit': quota.requestsLimit.toString(),
      'X-RateLimit-Remaining': (quota.requestsLimit - quota.requestsUsed).toString(),
      'X-RateLimit-Reset': quota.resetTime.toString(),
      'X-User-Tier': quota.tier.name
    })

    req.quota = quota
    next()
  } catch (error) {
    logger.error('Quota info middleware error:', error)
    next()
  }
}

// Admin quota middleware - bypass quota checks for admin users
export const adminQuotaMiddleware = async (req: QuotaRequest, res: Response, next: NextFunction) => {
  try {
    const userId = getUserId(req)
    
    // Check if user is admin (this would typically check against a database)
    const isAdmin = await checkAdminAccess(userId)
    
    if (isAdmin) {
      // Set unlimited quota headers
      res.set({
        'X-RateLimit-Limit': '999999',
        'X-RateLimit-Remaining': '999999',
        'X-RateLimit-Reset': (Date.now() + 86400000).toString(), // 24 hours
        'X-User-Tier': 'admin'
      })
      return next()
    }

    // Fall back to regular quota check
    return quotaMiddleware()(req, res, next)
  } catch (error) {
    logger.error('Admin quota middleware error:', error)
    next()
  }
}

// Helper function to check admin access
const checkAdminAccess = async (userId: string): Promise<boolean> => {
  // This would typically check against a database or config
  // For now, return false (no admin access)
  return false
}

// Extend Request interface to include quota info
declare module 'express' {
  interface Request {
    quota?: any
  }
}

export default quotaMiddleware
