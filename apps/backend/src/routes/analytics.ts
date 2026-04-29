import { Router } from 'express'
import {
  getRealTimeMetrics,
  getDailyAnalytics,
  getHourlyAnalytics,
  getErrorAnalytics,
  getPerformanceMetrics,
  getApiUsageStats,
  triggerAggregation,
  cleanupOldData,
  getAnalyticsHealth
} from '@/controllers/analyticsController'

const router = Router()

// Real-time metrics
router.get('/metrics/realtime', getRealTimeMetrics)

// Daily analytics
router.get('/daily', getDailyAnalytics)

// Hourly analytics
router.get('/hourly', getHourlyAnalytics)

// Error analytics
router.get('/errors', getErrorAnalytics)

// Performance metrics
router.get('/performance', getPerformanceMetrics)

// API usage statistics
router.get('/usage', getApiUsageStats)

// Analytics health
router.get('/health', getAnalyticsHealth)

// Manual aggregation (POST)
router.post('/aggregate', triggerAggregation)

// Cleanup old data (POST)
router.post('/cleanup', cleanupOldData)

export default router
