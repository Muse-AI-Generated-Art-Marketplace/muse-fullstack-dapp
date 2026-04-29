import { Router } from 'express'
import tracingController from '@/controllers/tracingController'
import { quotaMiddleware } from '@/middleware/quotaMiddleware'

const router = Router()

// Public endpoints
router.get('/trace/:traceId', quotaMiddleware({ cost: 1 }), tracingController.getTrace)
router.get('/trace/:traceId/visualization', quotaMiddleware({ cost: 2 }), tracingController.getTraceVisualization)
router.get('/search', quotaMiddleware({ cost: 2 }), tracingController.searchTraces)
router.get('/metrics', quotaMiddleware({ cost: 1 }), tracingController.getMetrics)
router.get('/service-map', quotaMiddleware({ cost: 3 }), tracingController.getServiceMap)
router.get('/performance-report', quotaMiddleware({ cost: 5 }), tracingController.getPerformanceReport)

// Admin endpoints
router.post('/admin/cleanup', tracingController.cleanupTraces)

export default router
