import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { createError } from './errorHandler'
import { createLogger } from '@/utils/logger'

const logger = createLogger('AuthMiddleware')
const JWT_SECRET = process.env.JWT_SECRET || 'your_fallback_jwt_secret_donotuseinprod'

export interface AuthRequest extends Request {
  user?: {
    address: string
    [key: string]: any
  }
}

export const authenticate = (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(createError('Authentication token matching required', 401))
  }

  const token = authHeader.split(' ')[1]

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { address: string }
    req.user = decoded
    next()
  } catch (error) {
    logger.error('JWT Verification failed:', error)
    next(createError('Invalid or expired token', 401))
  }
}

// Optional: specific role-based or permission-based middleware can be added here
