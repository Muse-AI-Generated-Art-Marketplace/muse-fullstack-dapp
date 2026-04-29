import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import compression from 'compression'
import rateLimit from 'express-rate-limit'
import dotenv from 'dotenv'

import { errorHandler } from '@/middleware/errorHandler'
import { notFound } from '@/middleware/notFound'
import { quotaMiddleware } from '@/middleware/quotaMiddleware'
import { tracingMiddleware } from '@/middleware/tracingMiddleware'
import { analyticsMiddleware, errorAnalyticsMiddleware, performanceMiddleware } from '@/middleware/analyticsMiddleware'
import cacheService from '@/services/cacheService'
import { createLogger } from '@/utils/logger'
import { connectDatabase, closeDatabaseConnection } from '@/database/connection'
import artworkRoutes from '@/routes/artwork'
import userRoutes from '@/routes/user'
import aiRoutes from '@/routes/ai'
import metadataRoutes from '@/routes/metadata'
import cacheRoutes from '@/routes/cache'
import imageOptimizerRoutes from '@/routes/imageOptimizer'
import quotaRoutes from '@/routes/quota'
import tracingRoutes from '@/routes/tracing'
import webhookRoutes from '@/routes/webhook'
import analyticsRoutes from '@/routes/analytics'
import analyticsService from '@/services/analyticsService'
import realTimeMonitoringService from '@/services/realTimeMonitoringService'

dotenv.config()

const logger = createLogger('Server')

const app = express()
const PORT = process.env.PORT || 5000

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many requests from this IP, please try again later.',
})

app.use(helmet())
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}))
app.use(compression())
app.use(morgan('combined'))
app.use(limiter)
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true }))

// Apply analytics middleware to track API calls
app.use(analyticsMiddleware({
  excludePaths: ['/health', '/metrics', '/api/analytics/health'],
  sampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0
}))

// Apply performance monitoring
app.use(performanceMiddleware({
  enabled: true,
  interval: 60000
}))

// Apply distributed tracing middleware
app.use(tracingMiddleware({
  excludePaths: ['/health'],
  includeHeaders: false,
  includeBody: false
}))

app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    service: 'muse-backend',
  })
})

// Apply quota middleware to API routes
app.use('/api/artworks', quotaMiddleware({ cost: 1, feature: 'artwork_view' }), artworkRoutes)
app.use('/api/users', quotaMiddleware({ cost: 1, feature: 'user_profile' }), userRoutes)
app.use('/api/ai', quotaMiddleware({ cost: 5, feature: 'ai_generation' }), aiRoutes)
app.use('/api/metadata', quotaMiddleware({ cost: 1 }), metadataRoutes)
app.use('/api/cache', quotaMiddleware({ cost: 1 }), cacheRoutes)
app.use('/api', quotaMiddleware({ cost: 1 }), imageOptimizerRoutes)
app.use('/api/quota', quotaRoutes)
app.use('/api/tracing', tracingRoutes)
app.use('/api/webhooks', webhookRoutes)
app.use('/api/analytics', analyticsRoutes)

// Apply error analytics middleware before error handler
app.use(errorAnalyticsMiddleware)

app.use(notFound)
app.use(errorHandler)

// Initialize database connection before starting server
const startServer = async () => {
  try {
    // Connect to database
    await connectDatabase()
    logger.info('Database connected successfully')

    app.listen(PORT, () => {
      logger.info(`? Muse Backend API running on port ${PORT}`)
      logger.info(`? Health check: http://localhost:${PORT}/health`)
      logger.info(`? Cache stats: ${JSON.stringify(cacheService.getCacheStats())}`)
      
      // Start real-time monitoring service
      try {
        realTimeMonitoringService.start(8080)
        logger.info('? Real-time monitoring service started on port 8080')
      } catch (error) {
        logger.error('Failed to start real-time monitoring service', { error })
      }
      
      // Start analytics aggregation jobs
      analyticsService.startPerformanceMonitoring(60000)
      
      // Schedule hourly aggregation
      setInterval(() => {
        analyticsService.aggregateHourlyAnalytics(new Date()).catch(error => {
          logger.error('Failed to run hourly aggregation', { error })
        })
      }, 60 * 60 * 1000) // Every hour
      
      // Schedule daily aggregation
      setInterval(() => {
        analyticsService.aggregateDailyAnalytics(new Date()).catch(error => {
          logger.error('Failed to run daily aggregation', { error })
        })
      }, 24 * 60 * 60 * 1000) // Every day
      
      // Schedule cleanup job (daily at 2 AM)
      setInterval(() => {
        const now = new Date()
        if (now.getHours() === 2 && now.getMinutes() === 0) {
          analyticsService.cleanupOldData(90).catch(error => {
            logger.error('Failed to run cleanup job', { error })
          })
        }
      }, 60 * 60 * 1000) // Check every hour
    })
  } catch (error) {
    logger.error('Failed to start server:', error)
    process.exit(1)
  }
}

// Start the server
startServer()

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully')
  await Promise.all([
    cacheService.disconnect(),
    closeDatabaseConnection(),
    analyticsService.stopPerformanceMonitoring(),
    realTimeMonitoringService.stop()
  ])
  process.exit(0)
})

process.on('SIGINT', async () => {
  logger.info('SIGINT received, shutting down gracefully')
  await Promise.all([
    cacheService.disconnect(),
    closeDatabaseConnection(),
    analyticsService.stopPerformanceMonitoring(),
    realTimeMonitoringService.stop()
  ])
  process.exit(0)
})

export default app
