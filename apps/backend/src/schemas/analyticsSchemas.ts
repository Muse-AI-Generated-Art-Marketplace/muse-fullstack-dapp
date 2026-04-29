import { z } from 'zod'
import { stellarAddressRegex } from './userSchemas'

export const getAnalyticsSchema = z.object({
  query: z.object({
    metric: z.enum(['views', 'sales', 'users', 'revenue', 'engagement']),
    period: z.enum(['24h', '7d', '30d', '90d', '1y']).default('7d'),
    granularity: z.enum(['hour', 'day', 'week', 'month']).default('day'),
    filters: z.record(z.string()).optional()
  })
})

export const getUserAnalyticsSchema = z.object({
  params: z.object({
    address: z.string().regex(stellarAddressRegex, 'Invalid Stellar address format')
  }),
  query: z.object({
    period: z.enum(['7d', '30d', '90d']).default('30d'),
    metrics: z.array(z.enum(['views', 'sales', 'followers', 'engagement'])).optional()
  })
})

export const getArtworkAnalyticsSchema = z.object({
  params: z.object({
    artworkId: z.string().min(1, 'Artwork ID is required')
  }),
  query: z.object({
    period: z.enum(['7d', '30d', '90d']).default('30d')
  })
})

export const getTopArtworksSchema = z.object({
  query: z.object({
    metric: z.enum(['views', 'sales', 'likes', 'bids']).default('views'),
    period: z.enum(['24h', '7d', '30d']).default('7d'),
    limit: z.coerce.number().int().min(1).max(100).default(10)
  })
})

export const exportAnalyticsSchema = z.object({
  body: z.object({
    format: z.enum(['csv', 'json', 'xlsx']).default('csv'),
    metrics: z.array(z.enum(['views', 'sales', 'users', 'revenue'])).min(1),
    period: z.enum(['7d', '30d', '90d']).default('30d'),
    filters: z.record(z.string()).optional()
  })
})
