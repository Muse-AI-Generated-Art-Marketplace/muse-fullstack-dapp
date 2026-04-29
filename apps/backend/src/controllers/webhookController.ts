import crypto from 'crypto'
import axios from 'axios'
import { Response, NextFunction } from 'express'
import { AuthRequest } from '../middleware/authMiddleware'
import { createError } from '../middleware/errorHandler'
import Webhook, { WEBHOOK_EVENTS, WebhookEvent, IDeliveryAttempt } from '../models/Webhook'
import { z } from 'zod'

// ---------------------------------------------------------------------------
// Outgoing delivery constants
// ---------------------------------------------------------------------------

const MAX_RETRY_ATTEMPTS  = 3
const RETRY_DELAYS_MS     = [0, 5_000, 30_000] // immediate, 5s, 30s
const DELIVERY_TIMEOUT_MS = 10_000             // 10 s per attempt
const MAX_DELIVERY_LOG    = 50                  // keep last N deliveries

// ---------------------------------------------------------------------------
// Validation schemas
// ---------------------------------------------------------------------------

const RegisterSchema = z.object({
  url:    z.string().url('url must be a valid HTTPS URL'),
  label:  z.string().max(100).optional(),
  events: z
    .array(z.enum(WEBHOOK_EVENTS))
    .min(1, 'At least one event must be specified'),
})

const UpdateSchema = z.object({
  url:      z.string().url().optional(),
  label:    z.string().max(100).optional(),
  events:   z.array(z.enum(WEBHOOK_EVENTS)).min(1).optional(),
  isActive: z.boolean().optional(),
})

// ---------------------------------------------------------------------------
// Signature helpers (outgoing)
// ---------------------------------------------------------------------------

/**
 * Hash the raw secret for storage. We never store the plaintext so a DB
 * breach cannot expose secrets registered by users.
 */
function hashSecret(raw: string): string {
  return crypto.createHash('sha256').update(raw).digest('hex')
}

/**
 * Sign an outgoing payload with HMAC-SHA256 using the RAW secret (not the
 * hash). The signature is sent as `X-Muse-Signature: sha256=<hex>` so
 * subscribers can verify authenticity.
 */
function signPayload(rawSecret: string, payload: string): string {
  return (
    'sha256=' +
    crypto.createHmac('sha256', rawSecret).update(payload).digest('hex')
  )
}

// ---------------------------------------------------------------------------
// Delivery
// ---------------------------------------------------------------------------
async function deliverToEndpoint(
  url: string,
  payload: string,
  signatureHeader: string,
  event: WebhookEvent,
): Promise<IDeliveryAttempt[]> {
  const attempts: IDeliveryAttempt[] = []

  for (let i = 0; i < MAX_RETRY_ATTEMPTS; i++) {
    if (i > 0) {
      await new Promise((r) => setTimeout(r, RETRY_DELAYS_MS[i]))
    }

    const attempt: IDeliveryAttempt = {
      attemptedAt: new Date(),
      success:     false,
    }

    try {
      const response = await axios.post(url, payload, {
        timeout: DELIVERY_TIMEOUT_MS,
        headers: {
          'Content-Type':       'application/json',
          'X-Muse-Event':       event,
          'X-Muse-Signature':   signatureHeader,
          'X-Muse-Timestamp':   Date.now().toString(),
          'User-Agent':         'Muse-Webhook/1.0',
        },
        validateStatus: () => true, // handle all status codes ourselves
      })

      attempt.responseStatus = response.status
      attempt.responseBody   = String(response.data).slice(0, 1000)
      attempt.success        = response.status >= 200 && response.status < 300

      attempts.push(attempt)

      if (attempt.success) break // no need to retry on success
    } catch (err: unknown) {
      attempt.error   = err instanceof Error ? err.message : 'Unknown error'
      attempt.success = false
      attempts.push(attempt)
    }
  }

  return attempts
}

// ---------------------------------------------------------------------------
// Public API: trigger event (called internally by other controllers)
// ---------------------------------------------------------------------------
export async function triggerWebhookEvent(
  userId: string,
  event: WebhookEvent,
  data: Record<string, unknown>,
): Promise<void> {
  const webhooks = await Webhook.find({ userId, isActive: true, events: event })

  if (!webhooks.length) return

  const payloadObj = {
    event,
    timestamp: new Date().toISOString(),
    data,
  }
  const payloadStr = JSON.stringify(payloadObj)

  await Promise.allSettled(
    webhooks.map(async (webhook) => {

      const signature = signPayload(webhook.secretHash, payloadStr)

      const attempts = await deliverToEndpoint(
        webhook.url,
        payloadStr,
        signature,
        event,
      )

      // Append to delivery log, cap at MAX_DELIVERY_LOG
      webhook.deliveryLog.push({ event, payload: payloadObj, attempts, createdAt: new Date() })
      if (webhook.deliveryLog.length > MAX_DELIVERY_LOG) {
        webhook.deliveryLog = webhook.deliveryLog.slice(-MAX_DELIVERY_LOG)
      }

      await webhook.save()
    }),
  )
}

// ---------------------------------------------------------------------------
// REST handlers
// ---------------------------------------------------------------------------

export async function registerWebhook(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const parsed = RegisterSchema.safeParse(req.body)
    if (!parsed.success) {
      return next(createError(parsed.error.errors[0].message, 400))
    }

    const { url, label, events } = parsed.data

    // Reject non-HTTPS URLs in production
    if (process.env.NODE_ENV === 'production' && !url.startsWith('https://')) {
      return next(createError('Webhook URL must use HTTPS in production', 400))
    }

    const rawSecret = crypto.randomBytes(32).toString('hex') // 64-char hex
    const secretHash = hashSecret(rawSecret)

    const webhook = await Webhook.create({
      userId:     req.user!.id,
      url,
      label,
      events,
      secretHash,
    })

    res.status(201).json({
      message: 'Webhook registered. Save the secret — it will not be shown again.',
      webhook: {
        id:        webhook._id,
        url:       webhook.url,
        label:     webhook.label,
        events:    webhook.events,
        isActive:  webhook.isActive,
        createdAt: webhook.createdAt,
      },
      // Raw secret returned ONCE
      secret: rawSecret,
      signingNote:
        'Sign verification: HMAC-SHA256(sha256(secret), payload). ' +
        'See docs/webhooks.md for the full verification guide.',
    })
  } catch (err) {
    next(err)
  }
}

/**
 * GET /api/webhooks
 * List all webhooks for the authenticated user.
 */
export async function listWebhooks(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const webhooks = await Webhook.find({ userId: req.user!.id }).select(
      '-secretHash -deliveryLog',
    )
    res.json({ webhooks })
  } catch (err) {
    next(err)
  }
}

/**
 * GET /api/webhooks/:id
 * Get a single webhook including recent delivery log.
 */
export async function getWebhook(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const webhook = await Webhook.findOne({
      _id:    req.params.id,
      userId: req.user!.id,
    }).select('-secretHash')

    if (!webhook) return next(createError('Webhook not found', 404))

    res.json({ webhook })
  } catch (err) {
    next(err)
  }
}

/**
 * PATCH /api/webhooks/:id
 * Update URL, label, events, or active state.
 */
export async function updateWebhook(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const parsed = UpdateSchema.safeParse(req.body)
    if (!parsed.success) {
      return next(createError(parsed.error.errors[0].message, 400))
    }

    const { url, label, events, isActive } = parsed.data

    if (url && process.env.NODE_ENV === 'production' && !url.startsWith('https://')) {
      return next(createError('Webhook URL must use HTTPS in production', 400))
    }

    const webhook = await Webhook.findOneAndUpdate(
      { _id: req.params.id, userId: req.user!.id },
      { $set: { ...(url && { url }), ...(label !== undefined && { label }), ...(events && { events }), ...(isActive !== undefined && { isActive }) } },
      { new: true },
    ).select('-secretHash -deliveryLog')

    if (!webhook) return next(createError('Webhook not found', 404))

    res.json({ webhook })
  } catch (err) {
    next(err)
  }
}

/**
 * DELETE /api/webhooks/:id
 * Remove a webhook registration.
 */
export async function deleteWebhook(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const result = await Webhook.findOneAndDelete({
      _id:    req.params.id,
      userId: req.user!.id,
    })
    if (!result) return next(createError('Webhook not found', 404))
    res.json({ message: 'Webhook deleted' })
  } catch (err) {
    next(err)
  }
}

/**
 * POST /api/webhooks/:id/test
 * Send a test ping to the registered endpoint.
 */
export async function testWebhook(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const webhook = await Webhook.findOne({
      _id:    req.params.id,
      userId: req.user!.id,
    })
    if (!webhook) return next(createError('Webhook not found', 404))

    const payload = JSON.stringify({
      event:     'webhook.test',
      timestamp: new Date().toISOString(),
      data:      { message: 'This is a test delivery from Muse.' },
    })
    const signature = signPayload(webhook.secretHash, payload)

    const attempts = await deliverToEndpoint(
      webhook.url,
      payload,
      signature,
      'artwork.created', // placeholder — test doesn't subscribe-check
    )

    const success = attempts.some((a) => a.success)
    res.status(success ? 200 : 502).json({ success, attempts })
  } catch (err) {
    next(err)
  }
}

/**
 * GET /api/webhooks/events
 * Return the list of supported event types — useful for integration UIs.
 */
export async function listEventTypes(
  _req: AuthRequest,
  res: Response,
): Promise<void> {
  res.json({ events: WEBHOOK_EVENTS })
}
