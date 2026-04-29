import { Request, Response, NextFunction } from "express";
import User from "@/models/User";
import { rateLimitService } from "@/services/rateLimitService";
import { createError } from "@/middleware/errorHandler";
import { createLogger } from "@/utils/logger";
import { AuthRequest } from "@/middleware/authMiddleware";

const logger = createLogger("AdminRateLimitController");

/**
 * Get all users with their tier information and rate limit status
 */
export const getAllUsers = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { page = 1, limit = 50, tier, search } = req.query;
    
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    // Build filter
    const filter: any = {};
    if (tier && tier !== 'all') {
      filter.tier = tier;
    }
    if (search) {
      filter.$or = [
        { username: { $regex: search, $options: 'i' } },
        { address: { $regex: search, $options: 'i' } }
      ];
    }

    const users = await User.find(filter)
      .select('address username tier isVerified createdAt stats')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    const total = await User.countDocuments(filter);

    res.json({
      success: true,
      data: {
        users,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          pages: Math.ceil(total / limitNum)
        }
      }
    });

    logger.info(`Admin retrieved user list`, { 
      count: users.length, 
      page: pageNum, 
      filter: { tier, search } 
    });
  } catch (error) {
    logger.error("Failed to get users:", error);
    next(createError("Failed to retrieve users", 500));
  }
};

/**
 * Update user tier
 */
export const updateUserTier = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { userId } = req.params;
    const { tier } = req.body;

    if (!['verified', 'premium'].includes(tier)) {
      return next(createError("Invalid tier specified", 400));
    }

    const user = await User.findById(userId);
    if (!user) {
      return next(createError("User not found", 404));
    }

    const oldTier = user.tier;
    user.tier = tier;
    await user.save();

    // Reset rate limits for this user to apply new tier immediately
    await rateLimitService.resetRateLimit(user.address, 'standard');
    await rateLimitService.resetRateLimit(user.address, 'ai');

    logger.info(`Admin updated user tier`, {
      userId,
      address: user.address,
      oldTier,
      newTier: tier
    });

    res.json({
      success: true,
      data: {
        user: {
          id: user._id,
          address: user.address,
          username: user.username,
          tier: user.tier,
          isVerified: user.isVerified
        }
      }
    });
  } catch (error) {
    logger.error("Failed to update user tier:", error);
    next(createError("Failed to update user tier", 500));
  }
};

/**
 * Get rate limit statistics
 */
export const getRateLimitStats = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const stats = await rateLimitService.getRateLimitStats();
    
    // Get user tier distribution
    const tierStats = await User.aggregate([
      {
        $group: {
          _id: '$tier',
          count: { $sum: 1 }
        }
      }
    ]);

    const tierDistribution = tierStats.reduce((acc, stat) => {
      acc[stat._id] = stat.count;
      return acc;
    }, {} as Record<string, number>);

    res.json({
      success: true,
      data: {
        rateLimitStats: stats,
        tierDistribution,
        totalUsers: await User.countDocuments()
      }
    });

    logger.info("Admin retrieved rate limit statistics");
  } catch (error) {
    logger.error("Failed to get rate limit stats:", error);
    next(createError("Failed to retrieve rate limit statistics", 500));
  }
};

/**
 * Reset user rate limits
 */
export const resetUserRateLimits = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { userId } = req.params;
    const { limitType } = req.query; // 'standard', 'ai', or 'all'

    const user = await User.findById(userId);
    if (!user) {
      return next(createError("User not found", 404));
    }

    if (limitType === 'all' || limitType === 'standard') {
      await rateLimitService.resetRateLimit(user.address, 'standard');
    }
    if (limitType === 'all' || limitType === 'ai') {
      await rateLimitService.resetRateLimit(user.address, 'ai');
    }

    logger.info(`Admin reset user rate limits`, {
      userId,
      address: user.address,
      limitType
    });

    res.json({
      success: true,
      message: `Rate limits reset for ${limitType === 'all' ? 'all' : limitType} endpoints`
    });
  } catch (error) {
    logger.error("Failed to reset user rate limits:", error);
    next(createError("Failed to reset user rate limits", 500));
  }
};

/**
 * Get detailed user rate limit status
 */
export const getUserRateLimitStatus = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId);
    if (!user) {
      return next(createError("User not found", 404));
    }

    // Create a mock request object to get rate limit status
    const mockReq = {
      user: {
        id: user._id.toString(),
        address: user.address,
        tier: user.tier
      },
      ip: req.ip
    } as AuthRequest;

    const rateLimitStatus = await rateLimitService.getRateLimitStatus(mockReq);

    res.json({
      success: true,
      data: {
        user: {
          id: user._id,
          address: user.address,
          username: user.username,
          tier: user.tier,
          isVerified: user.isVerified
        },
        rateLimits: {
          standard: {
            ...rateLimitStatus.standard,
            resetTime: rateLimitStatus.standard.resetTime.toISOString(),
          },
          ai: {
            ...rateLimitStatus.ai,
            resetTime: rateLimitStatus.ai.resetTime.toISOString(),
          }
        }
      }
    });

    logger.info(`Admin retrieved rate limit status for user`, {
      userId,
      address: user.address
    });
  } catch (error) {
    logger.error("Failed to get user rate limit status:", error);
    next(createError("Failed to retrieve user rate limit status", 500));
  }
};
