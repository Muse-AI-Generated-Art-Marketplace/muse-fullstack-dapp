import {
  AIProvider,
  ImageGenerationRequest,
  ImageGenerationResponse,
  AIProviderError,
} from "./types";
import { OpenAIProvider } from "./openaiProvider";
import { StabilityAIProvider } from "./stabilityAIProvider";
import { createLogger } from "@/utils/logger";

const logger = createLogger("AIService");

export type ProviderType = "openai" | "stability-ai";

export class AIService {
  private providers: Map<ProviderType, AIProvider> = new Map();
  private activeProvider: ProviderType | null;

  constructor() {
    const openaiApiKey = process.env.OPENAI_API_KEY;
    const stabilityApiKey = process.env.STABILITY_API_KEY;

    if (openaiApiKey) {
      try {
        this.providers.set("openai", new OpenAIProvider(openaiApiKey));
        logger.info("OpenAI DALL-E provider initialized");
      } catch (error) {
        logger.warn("Failed to initialize OpenAI provider:", error);
      }
    }

    if (stabilityApiKey) {
      try {
        this.providers.set(
          "stability-ai",
          new StabilityAIProvider(stabilityApiKey),
        );
        logger.info("Stability AI provider initialized");
      } catch (error) {
        logger.warn("Failed to initialize Stability AI provider:", error);
      }
    }

    this.activeProvider = this.determineActiveProvider();

    if (this.activeProvider === "openai") {
      logger.info("AI Service: Using OpenAI DALL-E as active provider");
    } else if (this.activeProvider === "stability-ai") {
      logger.info("AI Service: Using Stability AI as active provider");
    } else {
      logger.warn("AI Service: No AI providers available");
    }
  }

  private determineActiveProvider(): ProviderType | null {
    const configuredProvider = process.env.AI_IMAGE_PROVIDER as ProviderType;

    if (configuredProvider && this.providers.has(configuredProvider)) {
      return configuredProvider;
    }

    if (this.providers.has("openai")) {
      return "openai";
    }

    if (this.providers.has("stability-ai")) {
      return "stability-ai";
    }

    return null;
  }

  getActiveProvider(): AIProvider | null {
    if (!this.activeProvider) {
      return null;
    }
    return this.providers.get(this.activeProvider) || null;
  }

  getAvailableProviders(): ProviderType[] {
    return Array.from(this.providers.keys());
  }

  async generateImage(
    request: ImageGenerationRequest,
  ): Promise<ImageGenerationResponse> {
    const provider = this.getActiveProvider();

    if (!provider) {
      throw new AIProviderError(
        "No AI image generation providers are configured. Please contact support.",
        503,
        "system",
        false,
      );
    }

    const validation = provider.validatePrompt(request.prompt);
    if (!validation.valid) {
      throw new AIProviderError(
        validation.error || "Invalid prompt",
        400,
        provider.name,
        false,
      );
    }

    try {
      const result = await provider.generateImage(request);
      return result;
    } catch (error) {
      if (error instanceof AIProviderError) {
        throw error;
      }

      logger.error("Unexpected error in AI service:", error);
      throw new AIProviderError(
        "An unexpected error occurred during image generation",
        500,
        provider.name,
        true,
      );
    }
  }

  async generateWithFallback(
    request: ImageGenerationRequest,
  ): Promise<ImageGenerationResponse> {
    const providers = this.getAvailableProviders();

    if (providers.length === 0) {
      throw new AIProviderError(
        "No AI providers available",
        503,
        "system",
        false,
      );
    }

    let lastError: AIProviderError | null = null;

    for (const providerType of providers) {
      const provider = this.providers.get(providerType);
      if (!provider) continue;

      const validation = provider.validatePrompt(request.prompt);
      if (!validation.valid) {
        lastError = new AIProviderError(
          validation.error || "Invalid prompt",
          400,
          provider.name,
          false,
        );
        continue;
      }

      try {
        logger.info(`Attempting generation with ${provider.name}`);
        const result = await provider.generateImage(request);
        return result;
      } catch (error) {
        if (error instanceof AIProviderError && !error.isRetryable) {
          throw error;
        }

        lastError =
          error instanceof AIProviderError
            ? error
            : new AIProviderError("Unexpected error", 500, provider.name, true);

        logger.warn(`Provider ${provider.name} failed, trying next provider`);
      }
    }

    throw (
      lastError ||
      new AIProviderError("All AI providers failed", 503, "system", true)
    );
  }

  isConfigured(): boolean {
    return this.providers.size > 0;
  }
}

export const aiService = new AIService();
