import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import stellarService from "@/services/stellarService";
import User from "@/models/User";
import { createError } from "@/middleware/errorHandler";
import { createLogger } from "@/utils/logger";
import cacheService from "@/services/cacheService";
import { verificationService } from "@/services/verificationService";

const logger = createLogger("AuthController");
const JWT_SECRET =
  process.env.JWT_SECRET || "your_fallback_jwt_secret_donotuseinprod";
const TOKEN_EXPIRY = "24h";

/**
 * Login with Stellar wallet signature verification
 */
export const login = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { address, signature, username } = req.body;

    if (!address || !signature) {
      return next(createError("Address and signature are required", 400));
    }

    // Verify signature using our verification service
    const verificationResult = await verificationService.verifySignature(
      address,
      signature,
      username
    );

    if (!verificationResult.success) {
      return next(createError(verificationResult.error || "Authentication failed", 401));
    }

    const user = verificationResult.user!;

    // Generate JWT
    const token = jwt.sign(
      {
        address: user.address,
        id: user.id,
      },
      JWT_SECRET,
      { expiresIn: TOKEN_EXPIRY },
    );

    res.json({
      success: true,
      data: {
        token,
        user: {
          id: user.id,
          address: user.address,
          username: user.username,
          tier: user.tier,
          isVerified: user.isVerified,
        },
        isNewUser: verificationResult.isNewUser,
      },
    });

    logger.info(`User authenticated successfully: ${address}, tier: ${user.tier}`);
  } catch (error) {
    logger.error("Login failed:", error);
    next(createError("Authentication failed", 500));
  }
};

/**
 * Generate a verification challenge for wallet signature
 */
export const getChallenge = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { address } = req.query as { address: string };

    if (!address) {
      return next(createError("Address is required", 400));
    }

    // Generate verification challenge using our service
    const challenge = verificationService.generateChallenge(address);

    res.json({
      success: true,
      data: {
        challenge: challenge.message,
        nonce: challenge.nonce,
        expiresAt: challenge.expiresAt,
        timestamp: challenge.timestamp
      },
    });

    logger.info(`Verification challenge generated for address: ${address}`);
  } catch (error) {
    logger.error("Failed to generate challenge:", error);
    next(createError("Failed to generate authentication challenge", 500));
  }
};
