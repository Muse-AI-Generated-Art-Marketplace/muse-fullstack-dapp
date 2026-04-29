import axios from "axios";
import { v4 as uuidv4 } from "uuid";
import {
  AIProvider,
  ImageGenerationRequest,
  ImageGenerationResponse,
  AIProviderError,
} from "./types";
import { createLogger } from "@/utils/logger";

const logger = createLogger("StabilityAIProvider");

const STABILITY_API_URL = "https://api.stability.ai/v1";

const STYLE_PRESET_MAP: Record<string, string> = {
  "digital-art": "digital-art",
  "analog-film": "analog-film",
  anime: "anime",
  cinematic: "cinematic",
  "comic-book": "comic-book",
  enhance: "enhance",
  "fantasy-art": "fantasy-art",
  isometric: "isometric",
  "line-art": "line-art",
  "low-poly": "low-poly",
  "neon-punk": "neon-punk",
  origami: "origami",
  photographic: "photographic",
  "pixel-art": "pixel-art",
  "tile-texture": "tile-texture",
};

export class StabilityAIProvider implements AIProvider {
  name = "stability-ai";

  constructor(private apiKey: string) {
    if (!apiKey) {
      throw new Error("Stability AI API key is required");
    }
  }

  async generateImage(
    request: ImageGenerationRequest,
  ): Promise<ImageGenerationResponse> {
    const generationId = uuidv4();
    const startTime = Date.now();

    try {
      const engineId =
        request.quality === "hd"
          ? "stable-diffusion-xl-1024-v1-0"
          : "stable-diffusion-v1-6";
      const stylePreset = STYLE_PRESET_MAP[request.style || "digital-art"];

      logger.info(
        `Starting Stability AI generation: ${generationId}, engine: ${engineId}`,
      );

      const response = await axios.post(
        `${STABILITY_API_URL}/generation/${engineId}/text-to-image`,
        {
          text_prompts: [
            {
              text: request.prompt,
              weight: 1,
            },
          ],
          cfg_scale: 7,
          height: 1024,
          width: 1024,
          samples: 1,
          steps: 30,
          ...(stylePreset && { style_preset: stylePreset }),
        },
        {
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          timeout: 120000,
        },
      );

      const generationTime = Date.now() - startTime;
      const artifacts = response.data.artifacts;

      if (!artifacts || artifacts.length === 0) {
        throw new Error("No image artifacts returned from Stability AI");
      }

      const base64Image = artifacts[0].base64;

      logger.info(
        `Stability AI generation completed: ${generationId}, time: ${generationTime}ms`,
      );

      return {
        generationId,
        status: "completed",
        imageBase64: base64Image,
        provider: this.name,
        metadata: {
          model: engineId,
          generationTime,
          style: request.style,
        },
      };
    } catch (error: any) {
      const generationTime = Date.now() - startTime;
      logger.error(
        `Stability AI generation failed: ${generationId}`,
        error?.response?.data || error.message,
      );

      if (error.response?.status === 429) {
        throw new AIProviderError(
          "Stability AI rate limit exceeded. Please try again later.",
          429,
          this.name,
          true,
        );
      }

      if (error.response?.status === 400) {
        throw new AIProviderError(
          "Invalid request to Stability AI. Please check your prompt.",
          400,
          this.name,
          false,
        );
      }

      if (error.code === "ECONNABORTED" || error.code === "ETIMEDOUT") {
        throw new AIProviderError(
          "Request to Stability AI timed out. Please try again.",
          504,
          this.name,
          true,
        );
      }

      throw new AIProviderError(
        error.response?.data?.message ||
          "Failed to generate image with Stability AI",
        error.response?.status || 500,
        this.name,
        true,
      );
    }
  }

  validatePrompt(prompt: string): { valid: boolean; error?: string } {
    if (!prompt || typeof prompt !== "string") {
      return { valid: false, error: "Prompt is required and must be a string" };
    }

    const trimmedPrompt = prompt.trim();

    if (trimmedPrompt.length === 0) {
      return { valid: false, error: "Prompt cannot be empty" };
    }

    if (trimmedPrompt.length > 10000) {
      return {
        valid: false,
        error: "Prompt must be 10000 characters or less for Stability AI",
      };
    }

    return { valid: true };
  }
}
