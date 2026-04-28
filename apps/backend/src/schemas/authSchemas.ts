import { z } from 'zod'

export const loginSchema = z.object({
  body: z.object({
    address: z.string().regex(/^G[A-Z0-9]{55}$/, 'Invalid Stellar address format'),
    signature: z.string().min(1, 'Signature is required'),
    payload: z.string().min(1, 'Payload is required')
  })
})

export const challengeSchema = z.object({
  query: z.object({
    address: z.string().regex(/^G[A-Z0-9]{55}$/, 'Invalid Stellar address format')
  })
})
