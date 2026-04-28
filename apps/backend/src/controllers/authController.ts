import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import stellarService from "@/services/stellarService";
import User from "@/models/User";
import { createError } from "@/middleware/errorHandler";
import { createLogger } from "@/utils/logger";
import cacheService from "@/services/cacheService";

const logger = createLogger("AuthController");
const JWT_SECRET =
  process.env.JWT_SECRET || "your_fallback_jwt_secret_donotuseinprod";
const TOKEN_EXPIRY = "24h";

/**
 * Validates a signature from a Stellar wallet.
 * In a real implementation, you'd use a challenge-based system to prevent replay attacks.
 */
export const login = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { address, signature, payload } = req.body;

    const storedChallenge = await cacheService.get(`auth_challenge:${address}`);
    if (!storedChallenge) {
      return next(
        createError(
          "Challenge expired or not found. Please request a new challenge.",
          401,
        ),
      );
    }

    if (payload !== storedChallenge) {
      return next(
        createError(
          "Invalid payload: does not match authentication challenge",
          401,
        ),
      );
    }

    // Verify signature using Stellar service
    const isVerified = stellarService.verifySignature(
      payload,
      signature,
      address,
    );

    if (!isVerified) {
      return next(createError("Invalid signature provided", 401));
    }

    // After successful verification, remove the challenge
    await cacheService.del(`auth_challenge:${address}`);

    // Check if user exists or create a new one
    let user = await User.findOne({ address });
    if (!user) {
      user = await User.create({
        address,
        username: "New Artist",
        bio: "Just joined Muse marketplace",
      });
    }

    // Generate JWT
    const token = jwt.sign(
      {
        address: user.address,
        id: user._id,
      },
      JWT_SECRET,
      { expiresIn: TOKEN_EXPIRY },
    );

    res.json({
      success: true,
      data: {
        token,
        user: {
          address: user.address,
          username: user.username,
          profileImage: user.profileImage,
        },
      },
    });

    logger.info(`User logged in successfully: ${address}`);
  } catch (error) {
    logger.error("Login failed:", error);
    next(createError("Authentication failed", 500));
  }
};

/**
 * Placeholder for fetching a challenge/nonce for more secure login
 */
export const getChallenge = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { address } = req.query as { address: string };

    // Generate a random nonce
    const nonce = `Muse Authentication Challenge: ${Math.random().toString(36).substring(2, 15)} at ${Date.now()}`;

    // Store in cache with 5 minute TTL (300 seconds)
    await cacheService.set(`auth_challenge:${address}`, nonce, 300);

    res.json({
      success: true,
      data: { challenge: nonce },
    });
  } catch (error) {
    logger.error("Failed to generate challenge:", error);
    next(createError("Failed to generate authentication challenge", 500));
  }
};
