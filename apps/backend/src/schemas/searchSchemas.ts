import { z } from 'zod'

export const searchArtworksSchema = z.object({
  query: z.object({
    q: z.string().min(1, 'Search query is required').max(100, 'Search query too long'),
    category: z.string().optional(),
    creator: z.string().optional(),
    minPrice: z.string().regex(/^\d+(\.\d+)?$/, 'Invalid minimum price').optional(),
    maxPrice: z.string().regex(/^\d+(\.\d+)?$/, 'Invalid maximum price').optional(),
    currency: z.enum(['XLM', 'ETH', 'SOL']).optional(),
    tags: z.array(z.string()).optional(),
    sortBy: z.enum(['createdAt', 'price', 'title', 'views']).default('createdAt'),
    sortOrder: z.enum(['asc', 'desc']).default('desc'),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20)
  })
})

export const searchUsersSchema = z.object({
  query: z.object({
    q: z.string().min(1, 'Search query is required').max(100, 'Search query too long'),
    sortBy: z.enum(['username', 'createdAt', 'followers']).default('username'),
    sortOrder: z.enum(['asc', 'desc']).default('asc'),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20)
  })
})
