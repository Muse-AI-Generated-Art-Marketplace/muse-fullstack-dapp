import { Request, Response, NextFunction } from 'express'
import { FeatureFlagEvaluationContext, getFeatureFlagsForRequest } from '@/config/featureFlags'

declare global {
  namespace Express {
    interface Request {
      featureFlags?: Record<string, boolean>
    }
  }
}

export function featureFlagMiddleware(req: Request, res: Response, next: NextFunction): void {
  const context: FeatureFlagEvaluationContext = {
    userId: (req as any).user?.id,
    sessionId: (req as any).sessionId,
    ip: req.ip,
  }

  req.featureFlags = getFeatureFlagsForRequest(context)
  res.locals.featureFlags = req.featureFlags
  next()
}
