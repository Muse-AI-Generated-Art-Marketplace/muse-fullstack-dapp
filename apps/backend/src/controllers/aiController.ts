import { Request, Response, NextFunction } from "express";
import { createError } from "@/middleware/errorHandler";
import { createLogger } from "@/utils/logger";
import { aiService, AIProviderError } from "@/services/ai";
import { AuthRequest } from "@/middleware/authMiddleware";

const logger = createLogger("AIController");

const generationStore: Map<string, any> = new Map();

export const generateImage = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const log = logger.child({ requestId: req.requestId })
  try {
    const authReq = req as AuthRequest;
    const {
      prompt,
      style = "digital-art",
      quality = "standard",
      model,
    } = req.body;

    if (!prompt) {
      const err = createError("Prompt is required", 400);
      return next(err);
    }

    if (!aiService.isConfigured()) {
      const err = createError(
        "AI image generation is not configured on this server",
        503,
      );
      return next(err);
    }

    const request = {
      prompt: prompt.trim(),
      style,
      quality: quality as "standard" | "hd",
      size:
        model === "dall-e-2" || model === "stable-diffusion-v1-6"
          ? ("512x512" as const)
          : ("1024x1024" as const),
    };

    log.info(
      `Starting image generation for user ${authReq.user?.address}, prompt length: ${prompt.length}`,
    );

    const result = await aiService.generateImage(request);

    generationStore.set(result.generationId, {
      ...result,
      userId: authReq.user?.id,
      createdAt: new Date(),
    });

    if (result.status === "completed") {
      log.info(`Image generation completed: ${result.generationId}`);
    }

    res.status(202).json({
      success: true,
      data: {
        generationId: result.generationId,
        status: result.status,
        prompt: request.prompt,
        style,
        quality,
        provider: result.provider,
        estimatedTime: result.status === "processing" ? "30 seconds" : null,
      },
    });
  } catch (error) {
    log.error("Image generation failed:", error);

    if (error instanceof AIProviderError) {
      if (error.statusCode === 429) {
        return next(createError(error.message, 429, "RATE_LIMIT_EXCEEDED"));
      }
      if (error.statusCode === 400) {
        return next(createError(error.message, 400, "INVALID_REQUEST"));
      }
      if (error.statusCode === 504) {
        return next(createError(error.message, 504, "TIMEOUT"));
      }
      return next(createError(error.message, 502, "PROVIDER_ERROR"));
    }

    const err = createError("Failed to start image generation", 500);
    next(err);
  }
};

export const getGenerationStatus = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const log = logger.child({ requestId: req.requestId })
  try {
    const { id } = req.params;

    if (!id) {
      const err = createError("Generation ID is required", 400);
      return next(err);
    }

    log.info('Fetching generation status', { generationId: id })

    const generation = generationStore.get(id);

    if (!generation) {
      const statuses = ["processing", "completed", "failed"];
      const randomStatus =
        statuses[Math.floor(Math.random() * statuses.length)];

      const statusData = {
        generationId: id,
        status: randomStatus,
        progress:
          randomStatus === "processing" ? Math.floor(Math.random() * 100) : 100,
        imageUrl:
          randomStatus === "completed"
            ? `https://example.com/generated-${id}.jpg`
            : null,
        error:
          randomStatus === "failed"
            ? "Generation failed due to server error"
            : null,
      };

      return res.json({
        success: true,
        data: statusData,
      });
    }

    res.status(202).json({
      success: true,
      data: {
        generationId: generation.generationId,
        status: generation.status,
        imageUrl: generation.imageUrl,
        imageBase64: generation.imageBase64,
        provider: generation.provider,
        metadata: generation.metadata,
        error: generation.error,
        createdAt: generation.createdAt,
      },
    });
  } catch (error) {
    log.error('Failed to fetch generation status', { generationId: req.params.id, error })
    const err = createError("Failed to fetch generation status", 500);
    next(err);
  }
};
