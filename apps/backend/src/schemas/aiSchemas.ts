import { z } from 'zod'

export const generateImageSchema = z.object({
  body: z.object({
    prompt: z.string()
      .trim()
      .min(3, 'Prompt must be at least 3 characters')
      .max(1000, 'Prompt cannot exceed 1000 characters'),
    style: z.enum(['digital-art', 'abstract', 'realistic', 'oil-painting', 'watercolor', 'cartoon', 'anime'], {
      errorMap: () => ({ message: 'Invalid style. Choose from: digital-art, abstract, realistic, oil-painting, watercolor, cartoon, anime' })
    }).default('digital-art'),
    quality: z.enum(['standard', 'hd'], {
      errorMap: () => ({ message: 'Invalid quality. Choose from: standard, hd' })
    }).default('standard'),
    model: z.enum(['dall-e-3', 'dall-e-2', 'stability-ai'], {
      errorMap: () => ({ message: 'Invalid model. Choose from: dall-e-3, dall-e-2, stability-ai' })
    }).default('dall-e-3'),
    aspectRatio: z.enum(['1:1', '16:9', '9:16'], {
      errorMap: () => ({ message: 'Invalid aspect ratio. Choose from: 1:1, 16:9, 9:16' })
    }).default('1:1').optional()
  })
})

export const getGenerationStatusSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Generation ID is required')
  })
})
