import { Router } from "express";
import { generateImage, getGenerationStatus } from "@/controllers/aiController";
import { aiStatusCache } from "@/middleware/cacheMiddleware";
import { authenticate } from "@/middleware/authMiddleware";

import { aiGenerationLimiter } from "@/middleware/rateLimitMiddleware";
import { aiPromptSizeLimit } from "@/middleware/sizeLimitMiddleware";

const router = Router();

/**
 * @openapi
 * /api/ai/generate:
 *   post:
 *     summary: Generate AI art
 *     description: Start an AI art generation process (Requires Authentication)
 *     tags: [AI]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               prompt:
 *                 type: string
 *                 description: The text prompt for image generation
 *                 maxLength: 1000
 *               style:
 *                 type: string
 *                 description: Art style (digital-art, abstract, realistic, etc.)
 *                 default: digital-art
 *               quality:
 *                 type: string
 *                 description: Generation quality (standard, hd)
 *                 default: standard
 *               model:
 *                 type: string
 *                 description: AI model to use (dall-e-3, dall-e-2, stability-ai)
 *                 default: dall-e-3
 *     responses:
 *       202:
 *         description: Generation started successfully
 *       400:
 *         description: Invalid prompt or parameters
 *       401:
 *         description: Unauthorized - authentication required
 *       413:
 *         description: Payload too large - prompt exceeds size limit
 *       429:
 *         description: Rate limit exceeded
 */
router.post(
  "/generate",
  authenticate,
  aiGenerationLimiter,
  aiPromptSizeLimit,
  generateImage,
);

/**
 * @openapi
 * /api/ai/status/{id}:
 *   get:
 *     summary: Get generation status
 *     description: Check the status of a specific AI generation process (Requires Authentication)
 *     tags: [AI]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The generation ID returned from the generate endpoint
 *     responses:
 *       200:
 *         description: Current status of the generation
 *       401:
 *         description: Unauthorized - authentication required
 *       404:
 *         description: Generation not found
 */
router.get("/status/:id", authenticate, aiStatusCache, getGenerationStatus);

export default router;
