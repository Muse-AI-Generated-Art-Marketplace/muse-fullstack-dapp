import { Request, Response, NextFunction } from 'express'
import { apiKeyService } from '@/services/apiKeyService'
import { createLogger } from '@/utils/logger'

const logger = createLogger('ApiKeyMiddleware')

export interface AuthenticatedRequest extends Request {
  apiKey?: any
  user?: {
    id: string
    permissions: string[]
  }
}

// Rate limiting storage for API keys
const rateLimitStore = new Map<string, { count: number; resetTime: number }>()

export const validateApiKey = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Missing or invalid authorization header',
        message: 'API key required in format: Bearer <api-key>'
      })
    }

    const apiKey = authHeader.substring(7) // Remove 'Bearer ' prefix
    
    if (!apiKey) {
      return res.status(401).json({
        error: 'Missing API key',
        message: 'API key required in format: Bearer <api-key>'
      })
    }

    const validation = await apiKeyService.validateApiKey(apiKey)
    
    if (!validation.isValid) {
      logger.warn(`Invalid API key attempt: ${validation.error}`)
      return res.status(401).json({
        error: 'Invalid API key',
        message: validation.error
      })
    }

    if (!validation.apiKey) {
      return res.status(401).json({
        error: 'API key validation failed',
        message: 'Unable to validate API key'
      })
    }

    // Check rate limiting
    const rateLimitResult = checkRateLimit(validation.apiKey)
    if (!rateLimitResult.allowed) {
      return res.status(429).json({
        error: 'Rate limit exceeded',
        message: `Too many requests. Limit: ${validation.apiKey.rateLimit.requests} per ${validation.apiKey.rateLimit.window / 1000} seconds`,
        retryAfter: Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000)
      })
    }

    // Attach API key and user info to request
    req.apiKey = validation.apiKey
    req.user = {
      id: validation.apiKey.userId.toString(),
      permissions: validation.apiKey.permissions
    }

    logger.debug(`API key validated successfully: ${validation.apiKey.name}`)
    next()
  } catch (error) {
    logger.error('Error in API key validation middleware:', error)
    return res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to validate API key'
    })
  }
}

export const requirePermission = (permission: string) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user || !req.user.permissions.includes(permission)) {
      return res.status(403).json({
        error: 'Insufficient permissions',
        message: `Required permission: ${permission}`,
        currentPermissions: req.user?.permissions || []
      })
    }
    next()
  }
}

export const requireAnyPermission = (permissions: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user || !permissions.some(perm => req.user!.permissions.includes(perm))) {
      return res.status(403).json({
        error: 'Insufficient permissions',
        message: `Required one of: ${permissions.join(', ')}`,
        currentPermissions: req.user?.permissions || []
      })
    }
    next()
  }
}

function checkRateLimit(apiKey: any): { allowed: boolean; resetTime: number } {
  const now = Date.now()
  const key = apiKey._id.toString()
  
  let rateLimitData = rateLimitStore.get(key)
  
  if (!rateLimitData || now > rateLimitData.resetTime) {
    // Reset or initialize rate limit
    rateLimitData = {
      count: 1,
      resetTime: now + apiKey.rateLimit.window
    }
    rateLimitStore.set(key, rateLimitData)
    return { allowed: true, resetTime: rateLimitData.resetTime }
  }
  
  // Increment count
  rateLimitData.count++
  
  if (rateLimitData.count > apiKey.rateLimit.requests) {
    return { allowed: false, resetTime: rateLimitData.resetTime }
  }
  
  return { allowed: true, resetTime: rateLimitData.resetTime }
}

// Cleanup expired rate limit entries periodically
setInterval(() => {
  const now = Date.now()
  for (const [key, data] of rateLimitStore.entries()) {
    if (now > data.resetTime) {
      rateLimitStore.delete(key)
    }
  }
}, 60000) // Cleanup every minute
