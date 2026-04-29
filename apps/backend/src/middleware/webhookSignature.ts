import crypto from 'crypto'
import { Request, Response, NextFunction } from 'express'
import { createError } from './errorHandler'

const SIGNATURE_HEADER = 'x-webhook-signature'
const PROVIDER_SECRET   = process.env.WEBHOOK_PROVIDER_SECRET ?? ''

/**
 * Compute an HMAC-SHA256 hex digest of `payload` using `secret`.
 */
export function computeHmac(secret: string, payload: Buffer | string): string {
  return crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex')
}

/**
 * Constant-time comparison to prevent timing attacks on signature checks.
 */
function safeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b))
}

export function verifyWebhookSignature(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  if (!PROVIDER_SECRET) {
    console.error('[Webhook] WEBHOOK_PROVIDER_SECRET is not set — refusing all incoming webhook requests')
    return next(createError('Webhook verification not configured', 500))
  }

  const signatureHeader = req.headers[SIGNATURE_HEADER]

  if (!signatureHeader || typeof signatureHeader !== 'string') {
    return next(createError('Missing X-Webhook-Signature header', 401))
  }

  if (!signatureHeader.startsWith('sha256=')) {
    return next(createError('Invalid signature format — expected sha256=<hex>', 401))
  }

  const providedHex = signatureHeader.slice('sha256='.length)

  const rawBody: Buffer | string =
    (req as Request & { rawBody?: Buffer }).rawBody ??
    (Buffer.isBuffer(req.body) ? req.body : JSON.stringify(req.body))

  const expectedHex = computeHmac(PROVIDER_SECRET, rawBody)

  if (!safeCompare(providedHex, expectedHex)) {
    return next(createError('Webhook signature verification failed', 401))
  }

  next()
}