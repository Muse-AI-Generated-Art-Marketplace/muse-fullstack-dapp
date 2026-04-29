import { z } from 'zod'

export const clearCacheSchema = z.object({
  body: z.object({
    pattern: z.string().optional(),
    keys: z.array(z.string()).optional(),
    scope: z.enum(['all', 'user', 'artwork', 'search', 'metadata']).default('all')
  })
})

export const getCacheStatsSchema = z.object({
  query: z.object({
    scope: z.enum(['all', 'user', 'artwork', 'search', 'metadata']).optional()
  })
})

export const warmupCacheSchema = z.object({
  body: z.object({
    type: z.enum(['popular-artworks', 'recent-users', 'search-index', 'all']).default('all'),
    limit: z.coerce.number().int().min(1).max(1000).default(100)
  })
})

export const setCacheConfigSchema = z.object({
  body: z.object({
    ttl: z.number().int().min(60).max(86400).optional(),
    maxSize: z.number().int().min(1).max(10000).optional(),
    strategy: z.enum(['lru', 'lfu', 'ttl']).optional()
  })
})
