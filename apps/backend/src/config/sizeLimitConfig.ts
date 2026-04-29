export const SIZE_LIMITS = {
  auth: {
    limit: "10kb",
    message: "Request body exceeds 10kb limit for authentication endpoints",
  },
  json: {
    limit: "1mb",
    message: "Request body exceeds 1mb limit for standard JSON endpoints",
  },
  standardApi: {
    limit: "100kb",
    message: "Request body exceeds 100kb limit for API endpoints",
  },
  imageUpload: {
    limit: "10mb",
    message: "Request body exceeds 10mb limit for image uploads",
  },
  aiPrompt: {
    limit: "50kb",
    message: "Request body exceeds 50kb limit for AI generation prompts",
  },
  artwork: {
    limit: "5mb",
    message: "Request body exceeds 5mb limit for artwork uploads",
  },
};
