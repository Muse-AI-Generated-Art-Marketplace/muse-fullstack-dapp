import { Router } from 'express'
import webhookController from '@/controllers/webhookController'
import { quotaMiddleware } from '@/middleware/quotaMiddleware'
import { authMiddleware } from '@/middleware/authMiddleware'

const router = Router()

// User endpoints (require authentication)
router.post('/', authMiddleware, quotaMiddleware({ cost: 1 }), webhookController.createWebhook)
router.get('/', authMiddleware, quotaMiddleware({ cost: 1 }), webhookController.getWebhooks)
router.get('/events', quotaMiddleware({ cost: 1 }), webhookController.getAvailableEvents)
router.get('/stats', authMiddleware, quotaMiddleware({ cost: 1 }), webhookController.getWebhookStats)
router.get('/:id', authMiddleware, quotaMiddleware({ cost: 1 }), webhookController.getWebhook)
router.put('/:id', authMiddleware, quotaMiddleware({ cost: 1 }), webhookController.updateWebhook)
router.delete('/:id', authMiddleware, quotaMiddleware({ cost: 1 }), webhookController.deleteWebhook)
router.post('/:id/test', authMiddleware, quotaMiddleware({ cost: 2 }), webhookController.testWebhook)
router.get('/:id/deliveries', authMiddleware, quotaMiddleware({ cost: 1 }), webhookController.getWebhookDeliveries)

// Admin endpoints
router.get('/admin/stats', webhookController.getSystemWebhookStats)
router.post('/admin/cleanup', webhookController.cleanupDeliveries)

export default router
