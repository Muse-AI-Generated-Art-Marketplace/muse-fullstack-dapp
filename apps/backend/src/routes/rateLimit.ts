import { Router } from "express";
import { AuthRequest, optionalAuthenticate } from "@/middleware/authMiddleware";
import { rateLimitService } from "@/services/rateLimitService";
import { createError } from "@/middleware/errorHandler";
import { createLogger } from "@/utils/logger";

const logger = createLogger("RateLimitRoutes");
const router = Router();

/**
 * @openapi
 * /api/rate-limit/status:
 *   get:
 *     summary: Get current rate limit status
 *     description: Returns current rate limit status for the authenticated user or anonymous IP
 *     tags: [Rate Limit]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Rate limit status returned successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     standard:
 *                       type: object
 *                       properties:
 *                         allowed:
 *                           type: boolean
 *                         remaining:
 *                           type: number
 *                         limit:
 *                           type: number
 *                         resetTime:
 *                           type: string
 *                           format: date-time
 *                         windowMs:
 *                           type: number
 *                         tier:
 *                           type: string
 *                     ai:
 *                       type: object
 *                       properties:
 *                         allowed:
 *                           type: boolean
 *                         remaining:
 *                           type: number
 *                         limit:
 *                           type: number
 *                         resetTime:
 *                           type: string
 *                           format: date-time
 *                         windowMs:
 *                           type: number
 *                         tier:
 *                           type: string
 */
router.get("/status", optionalAuthenticate, async (req: AuthRequest, res, next) => {
  try {
    const rateLimitStatus = await rateLimitService.getRateLimitStatus(req);

    res.json({
      success: true,
      data: {
        standard: {
          ...rateLimitStatus.standard,
          resetTime: rateLimitStatus.standard.resetTime.toISOString(),
        },
        ai: {
          ...rateLimitStatus.ai,
          resetTime: rateLimitStatus.ai.resetTime.toISOString(),
        },
      },
    });

    logger.debug("Rate limit status retrieved", {
      tier: req.user?.tier || 'anonymous',
      identifier: req.user?.address || req.ip
    });
  } catch (error) {
    logger.error("Failed to get rate limit status:", error);
    next(createError("Failed to retrieve rate limit status", 500));
  }
});

export default router;
