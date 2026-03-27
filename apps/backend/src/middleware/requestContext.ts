import { Request, Response, NextFunction } from 'express'
import { randomUUID } from 'crypto'

// Extend Express Request to carry requestId
declare global {
  namespace Express {
    interface Request {
      requestId: string
    }
  }
}

/**
 * Attaches a unique requestId (UUID v4) to every incoming request.
 * The ID is also reflected in the response via the `X-Request-Id` header
 * so clients can correlate logs with specific API calls.
 */
export const requestContext = (req: Request, res: Response, next: NextFunction): void => {
  const requestId = (req.headers['x-request-id'] as string) ?? randomUUID()
  req.requestId = requestId
  res.setHeader('X-Request-Id', requestId)
  next()
}
