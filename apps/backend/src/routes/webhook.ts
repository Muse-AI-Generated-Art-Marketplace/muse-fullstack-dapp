import { Router } from 'express'
import { authenticate } from '../middleware/authMiddleware'
import {
  registerWebhook,
  listWebhooks,
  getWebhook,
  updateWebhook,
  deleteWebhook,
  testWebhook,
  listEventTypes,
} from '../controllers/webhookController'

const router = Router()

// All webhook management routes require authentication
router.use(authenticate)

/**
 * GET  /api/webhooks/events
 * Returns the full list of supported event types.
 */
router.get('/events', listEventTypes)

/**
 * POST /api/webhooks
 * Register a new webhook. Returns the raw signing secret once.
 *
 * Body: { url: string, events: WebhookEvent[], label?: string }
 */
router.post('/', registerWebhook)

/**
 * GET  /api/webhooks
 * List all webhooks owned by the authenticated user.
 */
router.get('/', listWebhooks)

/**
 * GET  /api/webhooks/:id
 * Get a single webhook with recent delivery history.
 */
router.get('/:id', getWebhook)

/**
 * PATCH /api/webhooks/:id
 * Update URL, events, label, or active state.
 */
router.patch('/:id', updateWebhook)

/**
 * DELETE /api/webhooks/:id
 * Remove a webhook registration permanently.
 */
router.delete('/:id', deleteWebhook)

/**
 * POST /api/webhooks/:id/test
 * Fire a test ping to the endpoint and return delivery results.
 */
router.post('/:id/test', testWebhook)

export default router
