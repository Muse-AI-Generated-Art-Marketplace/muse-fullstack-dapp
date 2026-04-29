import { z } from 'zod'

export const createArtworkSchema = z.object({
  body: z.object({
    id: z.string().uuid().or(z.string().min(3).max(50)),
    title: z.string().trim().min(3, 'Title must be at least 3 characters').max(100),
    description: z.string().trim().max(1000).optional(),
    creator: z.string().regex(/^G[A-Z0-9]{55}$/, 'Invalid Stellar address format'),
    image: z.string().url('Product image must be a valid URL'),
    price: z.string()
      .regex(/^\d+(\.\d+)?$/, 'Price must be a valid positive number string')
      .refine((val: string) => parseFloat(val) >= 0, 'Price cannot be negative')
      .optional(),
    currency: z.enum(['XLM', 'ETH', 'SOL'], {
      errorMap: () => ({ message: 'Invalid currency supported: XLM, ETH, or SOL' })
    }).default('XLM'),
    metadata: z.object({
      category: z.string().min(2, 'Category name must be at least 2 characters').optional(),
      attributes: z.record(z.any()).optional(),
      tags: z.array(z.string().min(1)).max(10, 'Maximum 10 tags allowed').optional(),
    }).optional()
  })
})

export const updateArtworkSchema = z.object({
  body: z.object({
    title: z.string().trim().min(3).max(100).optional(),
    description: z.string().trim().max(1000).optional(),
    price: z.string()
      .regex(/^\d+(\.\d+)?$/, 'Price must be a valid positive number string')
      .refine((val: string) => parseFloat(val) >= 0, 'Price cannot be negative')
      .optional(),
    currency: z.enum(['XLM', 'ETH', 'SOL']).optional(),
    metadata: z.object({
      category: z.string().min(2).optional(),
      attributes: z.record(z.any()).optional(),
      tags: z.array(z.string().min(1)).max(10).optional(),
    }).optional()
  }),
  params: z.object({
    id: z.string().min(1)
  })
})

export const getArtworkSchema = z.object({
  params: z.object({
    id: z.string().min(1)
  })
})

export const artworkQuerySchema = z.object({
  query: z.object({
    category: z.string().optional(),
    creator: z.string().optional(),
    limit: z.coerce.number().int().min(1).max(100).optional(),
    page: z.coerce.number().int().min(1).optional()
  })
})
