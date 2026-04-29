import { Router } from "express";
import { login, getChallenge, refreshTokens, logout } from "@/controllers/authController";
import { validate } from "@/middleware/validate";
import {
  loginSchema,
  challengeSchema,
  refreshTokenSchema,
  logoutSchema,
} from "@/schemas/authSchemas";
import { authLimiter } from "@/middleware/rateLimitMiddleware";
import { authSizeLimit } from "@/middleware/sizeLimitMiddleware";

const router = Router();

/**
 * @openapi
 * /api/auth/challenge:
 *   get:
 *     summary: Get a challenge/nonce
 *     description: Retrieve a nonce for signing to authenticate with a Stellar wallet
 *     tags: [Auth]
 */
router.get("/challenge", authLimiter, authSizeLimit, validate(challengeSchema), getChallenge);

/**
 * @openapi
 * /api/auth/login:
 *   post:
 *     summary: Login with Stellar wallet
 *     description: Verify signature and issue access + refresh tokens
 *     tags: [Auth]
 */
router.post("/login", authLimiter, authSizeLimit, validate(loginSchema), login);

/**
 * @openapi
 * /api/auth/refresh:
 *   post:
 *     summary: Rotate tokens
 *     description: Exchange a valid refresh token for a new access + refresh token pair
 *     tags: [Auth]
 */
router.post("/refresh", authLimiter, authSizeLimit, validate(refreshTokenSchema), refreshTokens);

/**
 * @openapi
 * /api/auth/logout:
 *   post:
 *     summary: Logout
 *     description: Revoke the current refresh token (or all sessions with logoutAll=true)
 *     tags: [Auth]
 */
router.post("/logout", authLimiter, authSizeLimit, validate(logoutSchema), logout);

export default router;
