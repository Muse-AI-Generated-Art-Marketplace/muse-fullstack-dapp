import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { createError } from './errorHandler'
import { createLogger } from '@/utils/logger'

const logger = createLogger('AuthMiddleware')
const JWT_SECRET = process.env.JWT_SECRET || 'your_fallback_jwt_secret_donotuseinprod'

import User from '@/models/User'

export interface AuthRequest extends Request {
  user?: {
    id: string
    address: string
    tier: 'free' | 'pro' | 'premium'
    [key: string]: any
  }
}

export const authenticate = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(createError('Authentication token required', 401))
  }

  const token = authHeader.split(' ')[1]

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { address: string, id: string }
    
    // Fetch user to get current tier
    const user = await User.findById(decoded.id)
    if (!user) {
      return next(createError('User not found', 404))
    }

    req.user = {
      id: user._id.toString(),
      address: user.address,
      tier: user.tier as 'free' | 'pro' | 'premium'
    }
    next()
  } catch (error) {
    logger.error('JWT Verification failed', { errorMessage: error instanceof Error ? error.message : String(error) })
    next(createError('Invalid or expired token', 401))
  }
}

export const optionalAuthenticate = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next()
  }

  const token = authHeader.split(' ')[1]

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { address: string, id: string }
    const user = await User.findById(decoded.id)
    if (user) {
      req.user = {
        id: user._id.toString(),
        address: user.address,
        tier: user.tier as 'free' | 'pro' | 'premium'
      }
    }
    next()
  } catch (error) {
    // If token is invalid, we don't fail, just continue as anonymous
    logger.debug('Optional JWT Verification failed', { errorMessage: error instanceof Error ? error.message : String(error) })
    next()
  }
}
