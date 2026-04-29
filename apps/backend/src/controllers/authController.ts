import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { v4 as uuidv4 } from "uuid";
import stellarService from "@/services/stellarService";
import User from "@/models/User";
import { createError } from "@/middleware/errorHandler";
import { createLogger } from "@/utils/logger";
import cacheService from "@/services/cacheService";
import { verificationService } from "@/services/verificationService";

const logger = createLogger("AuthController");

const JWT_SECRET =
  process.env.JWT_SECRET || "your_fallback_jwt_secret_donotuseinprod";
const REFRESH_SECRET =
  process.env.REFRESH_TOKEN_SECRET || "your_fallback_refresh_secret_donotuseinprod";

const ACCESS_TOKEN_EXPIRY = "15m";
const REFRESH_TOKEN_EXPIRY_SECONDS = 7 * 24 * 60 * 60; // 7 days
const REFRESH_TOKEN_EXPIRY_MS = REFRESH_TOKEN_EXPIRY_SECONDS * 1000;

/** Hash a refresh token before storing it */
function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

/** Generate a signed refresh token and return both the raw value and its hash */
function generateRefreshToken(userId: string, family: string) {
  const raw = jwt.sign({ id: userId, family }, REFRESH_SECRET, {
    expiresIn: REFRESH_TOKEN_EXPIRY_SECONDS,
  });
  return { raw, hash: hashToken(raw) };
}

/** Remove expired refresh tokens from a user document */
function pruneExpiredTokens(tokens: { expiresAt: Date }[]) {
  const now = new Date();
  return tokens.filter((t) => t.expiresAt > now);
}

/**
* Login with Stellar wallet signature verification
 * GET /api/auth/challenge
 * Returns a nonce for the client to sign with their Stellar wallet.
 */
export const getChallenge = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { address } = req.query as { address: string };

    const nonce = `Muse Authentication Challenge: ${uuidv4()} at ${Date.now()}`;
    await cacheService.set(`auth_challenge:${address}`, nonce, 300);

    res.json({ success: true, data: { challenge: nonce } });
  } catch (error) {
    logger.error("Failed to generate challenge:", error);
    next(createError("Failed to generate authentication challenge", 500));
  }
};

/**
 * POST /api/auth/login
 * Verifies the Stellar wallet signature and issues access + refresh tokens.
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
    if (payload !== storedChallenge) {
      return next(
        createError("Invalid payload: does not match authentication challenge", 401),
      );
    }

    const isVerified = stellarService.verifySignature(payload, signature, address);
    if (!isVerified) {
      return next(createError("Invalid signature provided", 401));
    }

    await cacheService.del(`auth_challenge:${address}`);

    let user = await User.findOne({ address });
    if (!user) {
      user = await User.create({
        address,
        username: "New Artist",
        bio: "Just joined Muse marketplace",
      });
    }

    const userId = user._id.toString();

    // Issue access token
    const accessToken = jwt.sign({ address: user.address, id: userId }, JWT_SECRET, {
      expiresIn: ACCESS_TOKEN_EXPIRY,
    });

    // Issue refresh token (new family on fresh login)
    const family = uuidv4();
    const { raw: refreshToken, hash: tokenHash } = generateRefreshToken(userId, family);

    // Prune expired tokens then append the new one
    user.refreshTokens = pruneExpiredTokens(user.refreshTokens) as typeof user.refreshTokens;
    user.refreshTokens.push({
      tokenHash,
      family,
      expiresAt: new Date(Date.now() + REFRESH_TOKEN_EXPIRY_MS),
      createdAt: new Date(),
    });
    await user.save();

    logger.info(`User logged in: ${address}`);

    res.json({
      success: true,
      data: {
        accessToken,
        refreshToken,
        expiresIn: 15 * 60, // seconds
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
 * POST /api/auth/refresh
 * Rotates the refresh token: invalidates the old one and issues a new pair.
 * Detects token reuse (theft) by checking the token family.
 */
export const refreshTokens = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { refreshToken } = req.body;

    if (!address) {
      return next(createError("Address is required", 400));
    }

    // Generate verification challenge using our service
    const challenge = verificationService.generateChallenge(address);
    let decoded: { id: string; family: string };
    try {
      decoded = jwt.verify(refreshToken, REFRESH_SECRET) as { id: string; family: string };
    } catch {
      return next(createError("Invalid or expired refresh token", 401));
    }

    const { id: userId, family } = decoded;
    const incomingHash = hashToken(refreshToken);

    const user = await User.findById(userId);
    if (!user) {
      return next(createError("User not found", 404));
    }

    // Check if this token hash exists in the user's stored tokens
    const tokenIndex = user.refreshTokens.findIndex(
      (t) => t.tokenHash === incomingHash && t.family === family,
    );

    if (tokenIndex === -1) {
      // Token not found — possible reuse attack: invalidate the entire family
      user.refreshTokens = user.refreshTokens.filter((t) => t.family !== family) as typeof user.refreshTokens;
      await user.save();
      logger.warn(`Refresh token reuse detected for user ${userId}, family ${family}`);
      return next(createError("Refresh token reuse detected. Please log in again.", 401));
    }

    // Remove the used token (rotation: one-time use)
    user.refreshTokens.splice(tokenIndex, 1);

    // Issue new access token
    const accessToken = jwt.sign(
      { address: user.address, id: userId },
      JWT_SECRET,
      { expiresIn: ACCESS_TOKEN_EXPIRY },
    );

    // Issue new refresh token in the same family
    const { raw: newRefreshToken, hash: newTokenHash } = generateRefreshToken(userId, family);

    user.refreshTokens = pruneExpiredTokens(user.refreshTokens) as typeof user.refreshTokens;
    user.refreshTokens.push({
      tokenHash: newTokenHash,
      family,
      expiresAt: new Date(Date.now() + REFRESH_TOKEN_EXPIRY_MS),
      createdAt: new Date(),
    });
    await user.save();

    res.json({
      success: true,
      data: {
        challenge: challenge.message,
        nonce: challenge.nonce,
        expiresAt: challenge.expiresAt,
        timestamp: challenge.timestamp
        accessToken,
        refreshToken: newRefreshToken,
        expiresIn: 15 * 60,
      },
    });

    logger.info(`Verification challenge generated for address: ${address}`);
  } catch (error) {
    logger.error("Token refresh failed:", error);
    next(createError("Token refresh failed", 500));
  }
};

/**
 * POST /api/auth/logout
 * Revokes the provided refresh token (or all tokens if logoutAll is true).
 */
export const logout = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { refreshToken, logoutAll } = req.body;

    let decoded: { id: string; family: string };
    try {
      decoded = jwt.verify(refreshToken, REFRESH_SECRET) as { id: string; family: string };
    } catch {
      // Token already expired/invalid — treat as already logged out
      return res.json({ success: true, data: { message: "Logged out successfully" } });
    }

    const user = await User.findById(decoded.id);
    if (!user) {
      return res.json({ success: true, data: { message: "Logged out successfully" } });
    }

    if (logoutAll) {
      user.refreshTokens = [] as typeof user.refreshTokens;
    } else {
      const incomingHash = hashToken(refreshToken);
      user.refreshTokens = user.refreshTokens.filter(
        (t) => t.tokenHash !== incomingHash,
      ) as typeof user.refreshTokens;
    }

    await user.save();

    logger.info(`User logged out: ${user.address}${logoutAll ? " (all sessions)" : ""}`);

    res.json({ success: true, data: { message: "Logged out successfully" } });
  } catch (error) {
    logger.error("Logout failed:", error);
    next(createError("Logout failed", 500));
  }
};
