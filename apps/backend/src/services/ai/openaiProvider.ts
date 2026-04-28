import axios from "axios";
import { v4 as uuidv4 } from "uuid";
import {
  AIProvider,
  ImageGenerationRequest,
  ImageGenerationResponse,
  AIProviderError,
} from "./types";
import { createLogger } from "@/utils/logger";

const logger = createLogger("OpenAIProvider");

const OPENAI_API_URL = "https://api.openai.com/v1";

const SIZE_MAP = {
  "256x256": "256x256",
  "512x512": "512x512",
  "1024x1024": "1024x1024",
};

export class OpenAIProvider implements AIProvider {
  name = "openai-dalle";

  constructor(private apiKey: string) {
    if (!apiKey) {
      throw new Error("OpenAI API key is required");
    }
  }

  async generateImage(
    request: ImageGenerationRequest,
  ): Promise<ImageGenerationResponse> {
    const generationId = uuidv4();
    const startTime = Date.now();

    try {
      const model = request.quality === "hd" ? "dall-e-3" : "dall-e-2";
      const size = SIZE_MAP[request.size || "1024x1024"];

      logger.info(
        `Starting DALL-E generation: ${generationId}, model: ${model}`,
      );

      const response = await axios.post(
        `${OPENAI_API_URL}/images/generations`,
        {
          model,
          prompt: request.prompt,
          n: 1,
          size,
          response_format: "url",
          style: request.style || "vivid",
        },
        {
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            "Content-Type": "application/json",
          },
          timeout: 120000,
        },
      );

      const generationTime = Date.now() - startTime;
      const imageData = response.data.data[0];

      logger.info(
        `DALL-E generation completed: ${generationId}, time: ${generationTime}ms`,
      );

      return {
        generationId,
        status: "completed",
        imageUrl: imageData.url,
        revisedPrompt: imageData.revised_prompt,
        provider: this.name,
        metadata: {
          model,
          generationTime,
          style: request.style,
        },
      };
    } catch (error: any) {
      const generationTime = Date.now() - startTime;
      logger.error(
        `DALL-E generation failed: ${generationId}`,
        error?.response?.data || error.message,
      );

      if (error.response?.status === 429) {
        throw new AIProviderError(
          "OpenAI rate limit exceeded. Please try again later.",
          429,
          this.name,
          true,
        );
      }

      if (error.response?.status === 400) {
        const errorData = error.response?.data?.error;
        if (errorData?.code === "content_policy_violation") {
          throw new AIProviderError(
            "Your prompt was rejected due to content policy. Please modify and try again.",
            400,
            this.name,
            false,
          );
        }
      }

      if (error.code === "ECONNABORTED" || error.code === "ETIMEDOUT") {
        throw new AIProviderError(
          "Request to OpenAI timed out. Please try again.",
          504,
          this.name,
          true,
        );
      }

      throw new AIProviderError(
        error.response?.data?.error?.message ||
          "Failed to generate image with DALL-E",
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

    if (trimmedPrompt.length > 4000) {
      return { valid: false, error: "Prompt must be 4000 characters or less" };
    }

    return { valid: true };
  }
}
