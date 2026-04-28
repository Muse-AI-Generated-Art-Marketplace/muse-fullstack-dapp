import { z } from 'zod'
import { stellarAddressRegex } from './userSchemas'

export const getUserManagementSchema = z.object({
  query: z.object({
    status: z.enum(['active', 'suspended', 'all']).default('all'),
    role: z.enum(['user', 'admin', 'moderator']).optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    search: z.string().max(100).optional()
  })
})

export const updateUserStatusSchema = z.object({
  params: z.object({
    address: z.string().regex(stellarAddressRegex, 'Invalid Stellar address format')
  }),
  body: z.object({
    status: z.enum(['active', 'suspended'], {
      errorMap: () => ({ message: 'Invalid status. Choose from: active, suspended' })
    }),
    reason: z.string().max(500).optional()
  })
})

export const getSystemStatsSchema = z.object({
  query: z.object({
    period: z.enum(['24h', '7d', '30d', '90d']).default('7d'),
    metrics: z.array(z.enum(['users', 'artworks', 'transactions', 'revenue'])).optional()
  })
})

export const getContentModerationSchema = z.object({
  query: z.object({
    status: z.enum(['pending', 'approved', 'rejected', 'all']).default('pending'),
    type: z.enum(['artwork', 'user', 'report']).optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20)
  })
})

export const moderateContentSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Content ID is required')
  }),
  body: z.object({
    action: z.enum(['approve', 'reject', 'flag'], {
      errorMap: () => ({ message: 'Invalid action. Choose from: approve, reject, flag' })
    }),
    reason: z.string().max(500).optional(),
    notes: z.string().max(1000).optional()
  })
})
