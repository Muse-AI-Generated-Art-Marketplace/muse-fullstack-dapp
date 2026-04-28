import { Router } from "express";
import { login, getChallenge } from "@/controllers/authController";
import { validate } from "@/middleware/validate";
import { loginSchema, challengeSchema } from "@/schemas/authSchemas";

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
 *     responses:
 *       200:
 *         description: Challenge nonce returned successfully
 */
router.get(
  "/challenge",
  authLimiter,
  authSizeLimit,
  validate(challengeSchema),
  getChallenge,
);

/**
 * @openapi
 * /api/auth/login:
 *   post:
 *     summary: Login with Stellar wallet
 *     description: Verify signature and issue a JWT token
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               publicKey:
 *                 type: string
 *               signature:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful, JWT issued
 *       401:
 *         description: Invalid signature or public key
 */
router.post("/login", authLimiter, authSizeLimit, validate(loginSchema), login);

export default router;
