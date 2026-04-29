import { Router } from 'express'
import quotaController from '@/controllers/quotaController'
import { quotaMiddleware } from '@/middleware/quotaMiddleware'
import { authMiddleware } from '@/middleware/authMiddleware'

const router = Router()

// User endpoints
router.get('/status', quotaMiddleware({ cost: 1 }), quotaController.getQuotaStatus)
router.get('/history', quotaMiddleware({ cost: 2 }), quotaController.getQuotaHistory)
router.get('/tiers', quotaController.getAvailableTiers)

// Admin endpoints (would require admin authentication)
router.post('/admin/tier', quotaController.updateUserTier)
router.post('/admin/reset', quotaController.resetUserQuota)
router.post('/admin/config', quotaController.updateTierConfig)
router.get('/admin/stats', quotaController.getSystemStats)

export default router
