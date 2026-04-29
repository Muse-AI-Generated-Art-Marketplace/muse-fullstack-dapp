export interface ImageGenerationRequest {
  prompt: string;
  style?: string;
  quality?: "standard" | "hd";
  size?: "256x256" | "512x512" | "1024x1024";
}

export interface ImageGenerationResponse {
  generationId: string;
  status: "processing" | "completed" | "failed";
  imageUrl?: string;
  imageBase64?: string;
  revisedPrompt?: string;
  error?: string;
  provider: string;
  metadata?: {
    model?: string;
    generationTime?: number;
    style?: string;
  };
}

export interface AIProvider {
  name: string;
  generateImage(
    request: ImageGenerationRequest,
  ): Promise<ImageGenerationResponse>;
  validatePrompt(prompt: string): { valid: boolean; error?: string };
}

export class AIProviderError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public provider: string,
    public isRetryable: boolean = false,
  ) {
    super(message);
    this.name = "AIProviderError";
  }
}
