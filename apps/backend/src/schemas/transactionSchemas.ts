import { z } from 'zod'

const objectIdSchema = z.string().regex(/^[a-f\d]{24}$/i, 'Invalid MongoDB ObjectId')
const stellarAddressSchema = z.string().regex(/^G[A-Z0-9]{55}$/, 'Invalid Stellar address format')
const amountSchema = z.string()
  .regex(/^\d+(\.\d+)?$/, 'Amount must be a valid positive number string')
  .refine((value) => Number.parseFloat(value) >= 0, 'Amount cannot be negative')

const metadataSchema = z.record(z.any()).optional()

export const createTransactionSchema = z.object({
  body: z.object({
    hash: z.string().trim().min(10).max(128),
    type: z.enum(['mint', 'sale', 'transfer', 'bid', 'cancel']),
    artwork: objectIdSchema,
    from: stellarAddressSchema,
    to: stellarAddressSchema.optional(),
    price: amountSchema,
    currency: z.enum(['XLM', 'USD', 'EUR']).default('XLM'),
    network: z.enum(['testnet', 'mainnet']).default('testnet'),
    metadata: metadataSchema,
    idempotencyKey: z.string().trim().min(8).max(128).optional(),
    externalId: z.string().trim().min(3).max(128).optional(),
    autoProcess: z.boolean().optional()
  }).superRefine((value, ctx) => {
    if (value.type !== 'cancel' && !value.to) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['to'],
        message: 'Recipient wallet is required for this transaction type'
      })
    }

    if (value.type === 'cancel' && value.to && value.to === value.from) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['to'],
        message: 'Cancellation recipient cannot match sender'
      })
    }
  })
})

export const transactionQuerySchema = z.object({
  query: z.object({
    status: z.enum(['pending', 'processing', 'completed', 'failed', 'cancelled']).optional(),
    type: z.enum(['mint', 'sale', 'transfer', 'bid', 'cancel']).optional(),
    artwork: objectIdSchema.optional(),
    from: stellarAddressSchema.optional(),
    to: stellarAddressSchema.optional(),
    network: z.enum(['testnet', 'mainnet']).optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20)
  })
})

export const transactionIdParamSchema = z.object({
  params: z.object({
    id: objectIdSchema
  })
})

export const updateTransactionStatusSchema = z.object({
  params: z.object({
    id: objectIdSchema
  }),
  body: z.object({
    status: z.enum(['processing', 'completed', 'failed', 'cancelled']),
    reason: z.string().trim().max(500).optional(),
    blockNumber: z.number().int().positive().optional(),
    gasUsed: z.string().trim().optional(),
    gasPrice: z.string().trim().optional(),
    fee: z.string().trim().optional(),
    metadata: metadataSchema
  })
})

export const processTransactionSchema = z.object({
  params: z.object({
    id: objectIdSchema
  }),
  body: z.object({
    shouldFail: z.boolean().optional(),
    blockNumber: z.number().int().positive().optional(),
    gasUsed: z.string().trim().optional(),
    gasPrice: z.string().trim().optional(),
    fee: z.string().trim().optional(),
    metadata: metadataSchema,
    failureReason: z.string().trim().max(500).optional()
  }).optional()
})
