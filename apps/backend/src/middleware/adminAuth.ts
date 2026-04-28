import { Response, NextFunction } from 'express';
import { AuthRequest, authenticate } from '@/middleware/authMiddleware';
import { createError } from '@/middleware/errorHandler';
import { createLogger } from '@/utils/logger';

const logger = createLogger('AdminAuth');

/**
 * Middleware that first authenticates the JWT, then checks whether the
 * authenticated user's address is in the ADMIN_ADDRESSES allow-list.
 *
 * Set ADMIN_ADDRESSES as a comma-separated list of Stellar addresses in .env:
 *   ADMIN_ADDRESSES=GABC...,GXYZ...
 */
export const authenticateAdmin = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  // Reuse the standard JWT authentication first
  await authenticate(req, res, async (err?: any) => {
    if (err) return next(err);

    const adminAddresses = (process.env.ADMIN_ADDRESSES || '')
      .split(',')
      .map((a) => a.trim())
      .filter(Boolean);

    if (adminAddresses.length === 0) {
      logger.warn('ADMIN_ADDRESSES env var is not set — admin endpoints are disabled');
      return next(createError('Admin access is not configured', 403));
    }

    if (!req.user?.address || !adminAddresses.includes(req.user.address)) {
      logger.warn('Unauthorized admin access attempt', { address: req.user?.address });
      return next(createError('Forbidden: admin access required', 403));
    }

    next();
  });
};
