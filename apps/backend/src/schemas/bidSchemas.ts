import { z } from 'zod'
import { stellarAddressRegex } from './userSchemas'

export const createBidSchema = z.object({
  body: z.object({
    artworkId: z.string().min(1, 'Artwork ID is required'),
    amount: z.string()
      .regex(/^\d+(\.\d+)?$/, 'Amount must be a valid positive number')
      .refine((val: string) => parseFloat(val) > 0, 'Amount must be greater than 0'),
    currency: z.enum(['XLM', 'ETH', 'SOL'], {
      errorMap: () => ({ message: 'Invalid currency. Choose from: XLM, ETH, SOL' })
    }).default('XLM'),
    expiresAt: z.string().datetime().optional().refine((date) => {
      if (!date) return true
      return new Date(date) > new Date()
    }, 'Expiration date must be in the future')
  })
})

export const updateBidStatusSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Bid ID is required')
  }),
  body: z.object({
    status: z.enum(['pending', 'accepted', 'rejected', 'expired'], {
      errorMap: () => ({ message: 'Invalid status. Choose from: pending, accepted, rejected, expired' })
    }),
    reason: z.string().max(500).optional()
  })
})

export const getArtworkBidsSchema = z.object({
  params: z.object({
    artworkId: z.string().min(1, 'Artwork ID is required')
  }),
  query: z.object({
    status: z.enum(['pending', 'accepted', 'rejected', 'expired']).optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20)
  })
})

export const getUserBidsSchema = z.object({
  query: z.object({
    status: z.enum(['pending', 'accepted', 'rejected', 'expired']).optional(),
    type: z.enum(['made', 'received']).optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20)
  })
})

export const expireBidsSchema = z.object({
  body: z.object({
    artworkIds: z.array(z.string()).optional(),
    dryRun: z.boolean().default(false)
  })
})

export const checkAuctionEndingsSchema = z.object({
  body: z.object({
    dryRun: z.boolean().default(false)
  })
})
