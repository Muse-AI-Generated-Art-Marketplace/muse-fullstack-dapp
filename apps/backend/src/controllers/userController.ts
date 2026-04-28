import { Request, Response, NextFunction } from "express";
import { createError } from "@/middleware/errorHandler";
import { createLogger } from "@/utils/logger";
import { User, IUser } from "@/models/User";
import { Artwork } from "@/models/Artwork";
import { Favorite } from "@/models/Favorite";
import { Transaction } from "@/models/Transaction";

const logger = createLogger("UserController");

export interface PaginationQuery {
  page?: number;
  limit?: number;
  sort?: string;
}

export const getProfile = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const log = logger.child({ requestId: req.requestId })
  try {
    const { address } = req.params;

    const user = await User.findOne({ address }).select("-__v");

    if (!user) {
      const err = createError("User not found", 404, "NOT_FOUND");
      return next(err);
    }

    log.info('User profile fetched', { address })
    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    logger.error("Error fetching user profile:", error);
    const err = createError("Failed to fetch user profile", 500);
    next(err);
  }
};

export const getProfileById = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const log = logger.child({ requestId: req.requestId })
  try {
    const { id } = req.params;

    const user = await User.findById(id).select("-__v");

    if (!user) {
      const err = createError("User not found", 404, "NOT_FOUND");
      return next(err);
    }

    log.info('User profile fetched by ID', { userId: id })
    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    logger.error("Error fetching user by ID:", error);
    const err = createError("Failed to fetch user profile", 500);
    next(err);
  }
};

export const updateProfile = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const log = logger.child({ requestId: req.requestId })
  try {
    const { address } = req.params;
    const updates = req.body;

    const authUser = (req as any).user;
    if (authUser?.address !== address) {
      const err = createError(
        "You can only update your own profile",
        403,
        "FORBIDDEN",
      );
      return next(err);
    }

    const allowedUpdates = [
      "username",
      "bio",
      "profileImage",
      "bannerImage",
      "website",
      "twitter",
      "discord",
    ];

    const filteredUpdates: Record<string, any> = {};
    for (const key of allowedUpdates) {
      if (updates[key] !== undefined) {
        filteredUpdates[key] = updates[key];
      }
    }

    if (Object.keys(filteredUpdates).length === 0) {
      const err = createError(
        "No valid updates provided",
        400,
        "VALIDATION_ERROR",
      );
      return next(err);
    }

    const user = await User.findOneAndUpdate(
      { address },
      { $set: filteredUpdates },
      { new: true, runValidators: true },
    ).select("-__v");

    if (!user) {
      const err = createError("User not found", 404, "NOT_FOUND");
      return next(err);
    }

    log.info(`Profile updated for user ${address}`);

    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    logger.error("Error updating user profile:", error);
    const err = createError("Failed to update user profile", 500);
    next(err);
  }
};

export const deleteProfile = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const log = logger.child({ requestId: req.requestId })
  try {
    const { address } = req.params;

    const authUser = (req as any).user;
    if (authUser?.address !== address) {
      const err = createError(
        "You can only delete your own profile",
        403,
        "FORBIDDEN",
      );
      return next(err);
    }

    const user = await User.findOneAndDelete({ address });

    if (!user) {
      const err = createError("User not found", 404, "NOT_FOUND");
      return next(err);
    }

    log.info(`Profile deleted for user ${address}`);

    res.json({
      success: true,
      message: "Profile deleted successfully",
    });
  } catch (error) {
    logger.error("Error deleting user profile:", error);
    const err = createError("Failed to delete user profile", 500);
    next(err);
  }
};

export const updatePreferences = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const log = logger.child({ requestId: req.requestId })
  try {
    const { address } = req.params;
    const { preferences } = req.body;

    const authUser = (req as any).user;
    if (authUser?.address !== address) {
      const err = createError(
        "You can only update your own preferences",
        403,
        "FORBIDDEN",
      );
      return next(err);
    }

    const user = await User.findOneAndUpdate(
      { address },
      { $set: { preferences } },
      { new: true, runValidators: true },
    ).select("-__v");

    if (!user) {
      const err = createError("User not found", 404, "NOT_FOUND");
      return next(err);
    }

    log.info('Preferences updated', { address })
    res.json({
      success: true,
      data: user.preferences,
    });
  } catch (error) {
    logger.error("Error updating user preferences:", error);
    const err = createError("Failed to update preferences", 500);
    next(err);
  }
};

export const getUserActivity = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const log = logger.child({ requestId: req.requestId })
  try {
    const { address } = req.params;
    const { page = 1, limit = 20 } = req.query;

    const user = await User.findOne({ address });
    if (!user) {
      const err = createError("User not found", 404, "NOT_FOUND");
      return next(err);
    }

    const pageNum = parseInt(page as string, 10);
    const limitNum = Math.min(parseInt(limit as string, 10), 100);
    const skip = (pageNum - 1) * limitNum;

    const [created, collected, transactions] = await Promise.all([
      Artwork.find({ creator: user._id })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
      Artwork.find({ owner: user._id })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
      Transaction.find({
        $or: [{ from: user._id }, { to: user._id }],
      })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .populate("artwork", "title imageUrl"),
    ]);

    const totalCounts = await Promise.all([
      Artwork.countDocuments({ creator: user._id }),
      Artwork.countDocuments({ owner: user._id }),
      Transaction.countDocuments({
        $or: [{ from: user._id }, { to: user._id }],
      }),
    ]);

    log.info('User activity fetched', { address, page: pageNum })
    res.json({
      success: true,
      data: {
        created: {
          items: created,
          total: totalCounts[0],
          page: pageNum,
          limit: limitNum,
        },
        collected: {
          items: collected,
          total: totalCounts[1],
          page: pageNum,
          limit: limitNum,
        },
        transactions: {
          items: transactions,
          total: totalCounts[2],
          page: pageNum,
          limit: limitNum,
        },
      },
    });
  } catch (error) {
    logger.error("Error fetching user activity:", error);
    const err = createError("Failed to fetch user activity", 500);
    next(err);
  }
};

export const getUserStats = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const log = logger.child({ requestId: req.requestId })
  try {
    const { address } = req.params;

    const user = await User.findOne({ address });

    if (!user) {
      const err = createError("User not found", 404, "NOT_FOUND");
      return next(err);
    }

    const [createdCount, collectedCount, favoritesCount] = await Promise.all([
      Artwork.countDocuments({ creator: user._id }),
      Artwork.countDocuments({ owner: user._id }),
      Favorite.countDocuments({ user: user._id }),
    ]);

    const totalSalesResult = await Transaction.aggregate([
      { $match: { from: user._id, type: "sale" } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]);

    const totalPurchasesResult = await Transaction.aggregate([
      { $match: { to: user._id, type: "sale" } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]);

    const stats = {
      created: createdCount,
      collected: collectedCount,
      favorites: favoritesCount,
      followers: user.stats?.followers || 0,
      following: user.stats?.following || 0,
      totalSales: totalSalesResult[0]?.total?.toString() || "0",
      totalPurchases: totalPurchasesResult[0]?.total?.toString() || "0",
    };

    if (user.stats) {
      user.stats = { ...user.stats, ...stats };
      await user.save();
    }

    log.info('User stats fetched', { address })
    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    logger.error("Error fetching user stats:", error);
    const err = createError("Failed to fetch user stats", 500);
    next(err);
  }
};

export const searchUsers = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const log = logger.child({ requestId: req.requestId })
  try {
    const { q, page = 1, limit = 20 } = req.query;

    if (!q || (q as string).trim().length === 0) {
      const err = createError(
        "Search query is required",
        400,
        "VALIDATION_ERROR",
      );
      return next(err);
    }

    const pageNum = parseInt(page as string, 10);
    const limitNum = Math.min(parseInt(limit as string, 10), 100);
    const skip = (pageNum - 1) * limitNum;

    const searchRegex = new RegExp((q as string).trim(), "i");

    const [users, total] = await Promise.all([
      User.find({
        $or: [
          { username: searchRegex },
          { address: searchRegex },
          { bio: searchRegex },
        ],
      })
        .select("-__v")
        .skip(skip)
        .limit(limitNum)
        .sort({ "stats.followers": -1 }),
      User.countDocuments({
        $or: [
          { username: searchRegex },
          { address: searchRegex },
          { bio: searchRegex },
        ],
      }),
    ]);

    log.info('User search completed', { query: q, resultCount: users.length })
    res.json({
      success: true,
      data: {
        items: users,
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    logger.error("Error searching users:", error);
    const err = createError("Failed to search users", 500);
    next(err);
  }
};

export const getLeaderboard = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const log = logger.child({ requestId: req.requestId })
  try {
    const { limit = 10, type = "followers" } = req.query;

    const limitNum = Math.min(parseInt(limit as string, 10), 100);

    const sortOptions: Record<string, any> = {
      followers: { "stats.followers": -1 },
      created: { "stats.created": -1 },
      collected: { "stats.collected": -1 },
    };

    const sortBy = sortOptions[type as string] || sortOptions.followers;

    const users = await User.find()
      .select("username address profileImage stats.isVerified")
      .sort(sortBy)
      .limit(limitNum);

    log.info('Leaderboard fetched', { type, limit: limitNum })
    res.json({
      success: true,
      data: users,
    });
  } catch (error) {
    logger.error("Error fetching leaderboard:", error);
    const err = createError("Failed to fetch leaderboard", 500);
    next(err);
  }
};
