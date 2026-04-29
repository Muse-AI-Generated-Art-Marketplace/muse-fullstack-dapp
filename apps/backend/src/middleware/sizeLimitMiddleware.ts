import { Request, Response, NextFunction } from "express";

export interface SizeLimitOptions {
  limit: string;
  message?: string;
}

export const createSizeLimitMiddleware = (limit: string, message?: string) => {
  const limitBytes = parseSizeLimit(limit);

  return (req: Request, res: Response, next: NextFunction): void => {
    const contentLength = parseInt(req.headers["content-length"] || "0", 10);

    if (contentLength > limitBytes) {
      res.status(413).json({
        success: false,
        error: {
          code: "PAYLOAD_TOO_LARGE",
          message:
            message ||
            `Request body exceeds the maximum size limit of ${limit}`,
        },
      });
      return;
    }
    next();
  };
};

const parseSizeLimit = (limit: string): number => {
  const match = limit.match(/^(\d+(?:\.\d+)?)\s*(b|kb|mb|gb)?$/i);
  if (!match) {
    throw new Error(`Invalid size limit format: ${limit}`);
  }

  const value = parseFloat(match[1]);
  const unit = (match[2] || "b").toLowerCase();

  const multipliers: Record<string, number> = {
    b: 1,
    kb: 1024,
    mb: 1024 * 1024,
    gb: 1024 * 1024 * 1024,
  };

  return Math.floor(value * multipliers[unit]);
};

export const AUTH_SIZE_LIMIT = "10kb";
export const JSON_SIZE_LIMIT = "1mb";
export const STANDARD_API_SIZE_LIMIT = "100kb";
export const IMAGE_UPLOAD_SIZE_LIMIT = "10mb";
export const AI_PROMPT_SIZE_LIMIT = "50kb";

export const authSizeLimit = createSizeLimitMiddleware(
  AUTH_SIZE_LIMIT,
  `Request body exceeds ${AUTH_SIZE_LIMIT} limit for authentication endpoints`,
);

export const jsonSizeLimit = createSizeLimitMiddleware(
  JSON_SIZE_LIMIT,
  `Request body exceeds ${JSON_SIZE_LIMIT} limit for standard JSON endpoints`,
);

export const standardApiSizeLimit = createSizeLimitMiddleware(
  STANDARD_API_SIZE_LIMIT,
  `Request body exceeds ${STANDARD_API_SIZE_LIMIT} limit for API endpoints`,
);

export const imageUploadSizeLimit = createSizeLimitMiddleware(
  IMAGE_UPLOAD_SIZE_LIMIT,
  `Request body exceeds ${IMAGE_UPLOAD_SIZE_LIMIT} limit for image uploads`,
);

export const aiPromptSizeLimit = createSizeLimitMiddleware(
  AI_PROMPT_SIZE_LIMIT,
  `Request body exceeds ${AI_PROMPT_SIZE_LIMIT} limit for AI generation prompts`,
);
