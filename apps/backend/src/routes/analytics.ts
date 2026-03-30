import { Router, Request, Response, NextFunction } from 'express'
import { createLogger } from '@/utils/logger'
import { analyticsService } from '@/services/analyticsService'
import { analyticsCacheMiddleware } from '@/middleware/analyticsCache'
import { authenticate, AuthRequest } from '@/middleware/authMiddleware'
import { createError } from '@/middleware/errorHandler'
import rateLimit from 'express-rate-limit'
import { AnalyticsQueryParams } from '@/models/Analytics'

const logger = createLogger('AnalyticsRoutes')
const router = Router()

// Rate limiting: 100 requests per minute per user
const analyticsRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100, // 100 requests per minute
  message: 'Too many analytics requests, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
})

// Admin role check middleware
const requireAdmin = (req: AuthRequest, res: Response, next: NextFunction) => {
  // For this implementation, we'll check if user has 'premium' tier as admin
  // In production, you'd have a proper role system
  if (!req.user || req.user.tier !== 'premium') {
    return next(createError('Admin access required', 403))
  }
  next()
}

// Validate date range parameters
const validateDateRange = (req: Request, res: Response, next: NextFunction) => {
  const { startDate, endDate, period } = req.query as AnalyticsQueryParams
  
  if (startDate && isNaN(Date.parse(startDate))) {
    return next(createError('Invalid startDate format', 400))
  }
  
  if (endDate && isNaN(Date.parse(endDate))) {
    return next(createError('Invalid endDate format', 400))
  }
  
  if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
    return next(createError('startDate must be before endDate', 400))
  }
  
  if (period && !['1d', '7d', '30d', '90d', '1y'].includes(period)) {
    return next(createError('Invalid period. Use: 1d, 7d, 30d, 90d, 1y', 400))
  }
  
  next()
}

// Apply authentication, admin check, rate limiting, and date validation to all routes
router.use(authenticate)
router.use(requireAdmin)
router.use(analyticsRateLimit)
router.use(validateDateRange)

/**
 * GET /api/analytics/dashboard
 * Returns summary metrics for dashboard
 * - Total users, total transactions, revenue, active users
 */
router.get('/dashboard', analyticsCacheMiddleware(), async (req: Request, res: Response, next: NextFunction) => {
  try {
    logger.info('Dashboard analytics requested', { 
      user: (req as AuthRequest).user?.address,
      query: req.query 
    })

    const params = req.query as AnalyticsQueryParams
    const metrics = await analyticsService.getDashboardMetrics(params)
    const response = analyticsService.createResponse(metrics, false, params)
    
    logger.info('Dashboard analytics retrieved successfully', { 
      user: (req as AuthRequest).user?.address,
      totalUsers: metrics.totalUsers 
    })

    res.json(response)
  } catch (error) {
    logger.error('Error fetching dashboard analytics', { 
      error: error instanceof Error ? error.message : String(error),
      user: (req as AuthRequest).user?.address
    })
    next(error)
  }
})

/**
 * GET /api/analytics/marketplace
 * Marketplace metrics
 * - Total listings, sold items, average price, volume by category
 */
router.get('/marketplace', analyticsCacheMiddleware(), async (req: Request, res: Response, next: NextFunction) => {
  try {
    logger.info('Marketplace analytics requested', { 
      user: (req as AuthRequest).user?.address,
      query: req.query 
    })

    const params = req.query as AnalyticsQueryParams
    const metrics = await analyticsService.getMarketplaceMetrics(params)
    const response = analyticsService.createResponse(metrics, false, params)
    
    logger.info('Marketplace analytics retrieved successfully', { 
      user: (req as AuthRequest).user?.address,
      totalListings: metrics.totalListings 
    })

    res.json(response)
  } catch (error) {
    logger.error('Error fetching marketplace analytics', { 
      error: error instanceof Error ? error.message : String(error),
      user: (req as AuthRequest).user?.address
    })
    next(error)
  }
})

/**
 * GET /api/analytics/users
 * User analytics
 * - New users (daily/weekly/monthly), retention rate, top users
 */
router.get('/users', analyticsCacheMiddleware(), async (req: Request, res: Response, next: NextFunction) => {
  try {
    logger.info('User analytics requested', { 
      user: (req as AuthRequest).user?.address,
      query: req.query 
    })

    const params = req.query as AnalyticsQueryParams
    const metrics = await analyticsService.getUserAnalytics(params)
    const response = analyticsService.createResponse(metrics, false, params)
    
    logger.info('User analytics retrieved successfully', { 
      user: (req as AuthRequest).user?.address,
      totalUsers: metrics.totalUsers 
    })

    res.json(response)
  } catch (error) {
    logger.error('Error fetching user analytics', { 
      error: error instanceof Error ? error.message : String(error),
      user: (req as AuthRequest).user?.address
    })
    next(error)
  }
})

/**
 * GET /api/analytics/transactions
 * Transaction metrics
 * - Volume over time, success rate, average transaction value
 */
router.get('/transactions', analyticsCacheMiddleware(), async (req: Request, res: Response, next: NextFunction) => {
  try {
    logger.info('Transaction analytics requested', { 
      user: (req as AuthRequest).user?.address,
      query: req.query 
    })

    const params = req.query as AnalyticsQueryParams
    const metrics = await analyticsService.getTransactionMetrics(params)
    const response = analyticsService.createResponse(metrics, false, params)
    
    logger.info('Transaction analytics retrieved successfully', { 
      user: (req as AuthRequest).user?.address,
      totalTransactions: metrics.totalTransactions 
    })

    res.json(response)
  } catch (error) {
    logger.error('Error fetching transaction analytics', { 
      error: error instanceof Error ? error.message : String(error),
      user: (req as AuthRequest).user?.address
    })
    next(error)
  }
})

/**
 * GET /api/analytics/revenue
 * Revenue analytics
 * - Revenue by period, by category, growth rate
 */
router.get('/revenue', analyticsCacheMiddleware(), async (req: Request, res: Response, next: NextFunction) => {
  try {
    logger.info('Revenue analytics requested', { 
      user: (req as AuthRequest).user?.address,
      query: req.query 
    })

    const params = req.query as AnalyticsQueryParams
    const metrics = await analyticsService.getRevenueAnalytics(params)
    const response = analyticsService.createResponse(metrics, false, params)
    
    logger.info('Revenue analytics retrieved successfully', { 
      user: (req as AuthRequest).user?.address,
      totalRevenue: metrics.totalRevenue 
    })

    res.json(response)
  } catch (error) {
    logger.error('Error fetching revenue analytics', { 
      error: error instanceof Error ? error.message : String(error),
      user: (req as AuthRequest).user?.address
    })
    next(error)
  }
})

/**
 * GET /api/analytics/cache/stats
 * Get cache statistics (admin only)
 */
router.get('/cache/stats', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { getCacheStats } = await import('@/middleware/analyticsCache')
    const stats = getCacheStats()
    
    logger.info('Cache stats retrieved', { 
      user: (req as AuthRequest).user?.address,
      stats 
    })

    res.json({
      success: true,
      data: stats,
      meta: {
        generatedAt: new Date().toISOString()
      }
    })
  } catch (error) {
    logger.error('Error fetching cache stats', { 
      error: error instanceof Error ? error.message : String(error),
      user: (req as AuthRequest).user?.address
    })
    next(error)
  }
})

/**
 * DELETE /api/analytics/cache
 * Clear analytics cache (admin only)
 */
router.delete('/cache', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { clearAnalyticsCache } = await import('@/middleware/analyticsCache')
    const { pattern } = req.query
    
    clearAnalyticsCache(pattern as string)
    
    logger.info('Analytics cache cleared', { 
      user: (req as AuthRequest).user?.address,
      pattern 
    })

    res.json({
      success: true,
      message: pattern ? `Cache cleared for pattern: ${pattern}` : 'All analytics cache cleared',
      meta: {
        generatedAt: new Date().toISOString()
      }
    })
  } catch (error) {
    logger.error('Error clearing cache', { 
      error: error instanceof Error ? error.message : String(error),
      user: (req as AuthRequest).user?.address
    })
    next(error)
  }
})

/**
 * GET /api/analytics/health
 * Health check for analytics service
 */
router.get('/health', async (req: Request, res: Response) => {
  try {
    // Test database connectivity
    await mongoose.connection.db.admin().ping()
    
    res.json({
      success: true,
      data: {
        status: 'healthy',
        database: 'connected',
        timestamp: new Date().toISOString()
      },
      meta: {
        generatedAt: new Date().toISOString()
      }
    })
  } catch (error) {
    logger.error('Analytics health check failed', { 
      error: error instanceof Error ? error.message : String(error) 
    })
    
    res.status(503).json({
      success: false,
      data: {
        status: 'unhealthy',
        database: 'disconnected',
        timestamp: new Date().toISOString()
      },
      meta: {
        generatedAt: new Date().toISOString()
      }
    })
  }
})

export default router
