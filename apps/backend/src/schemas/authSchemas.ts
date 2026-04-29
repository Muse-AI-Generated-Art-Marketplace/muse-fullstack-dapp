import { z } from 'zod'

export const loginSchema = z.object({
  body: z.object({
    address: z.string().regex(/^G[A-Z0-9]{55}$/, 'Invalid Stellar address format'),
    signature: z.string().min(1, 'Signature is required'),
    payload: z.string().min(1, 'Payload is required'),
  }),
})

export const challengeSchema = z.object({
  query: z.object({
    address: z.string().regex(/^G[A-Z0-9]{55}$/, 'Invalid Stellar address format'),
  }),
})

export const refreshTokenSchema = z.object({
  body: z.object({
    refreshToken: z.string().min(1, 'Refresh token is required'),
  }),
})

export const logoutSchema = z.object({
  body: z.object({
    refreshToken: z.string().min(1, 'Refresh token is required'),
    logoutAll: z.boolean().optional().default(false),
  }),
})
