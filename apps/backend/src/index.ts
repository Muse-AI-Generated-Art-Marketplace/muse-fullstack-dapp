import compression from 'compression'
import cors from 'cors'
import dotenv from 'dotenv'
import express from 'express'
import mongoose from 'mongoose'

import { database } from '@/config/database'
import { corsOptions } from '@/config/cors'
import { securityMiddleware } from '@/middleware/security'
import { addCDNHeaders, injectCDNConfig } from '@/middleware/cdnMiddleware'
import { requestContext } from '@/middleware/requestContext'
import { requestLogger } from '@/middleware/requestLogger'
import { performanceLogger } from '@/middleware/performanceLogger'
import { errorHandler } from '@/middleware/errorHandler'
import { notFound } from '@/middleware/notFound'
import { deprecationMiddleware, addVersionHeader, API_VERSION } from '@/middleware/deprecation'
import { featureFlagMiddleware } from '@/middleware/featureFlagMiddleware'
import v1Routes from '@/routes/v1'
import authRoutes from '@/routes/auth'
import artworkRoutes from '@/routes/artwork'
import userRoutes from '@/routes/user'
import searchRoutes from '@/routes/search'
import aiRoutes from '@/routes/ai'
import metadataRoutes from '@/routes/metadata'
import cacheRoutes from '@/routes/cache'
import cacheManagementRoutes from '@/routes/cacheManagement'
import imageOptimizerRoutes from '@/routes/imageOptimizer'
import favoriteRoutes from '@/routes/favorites'
import apiKeyRoutes from '@/routes/apiKeys'
import jobRoutes from '@/routes/jobs'
import notificationRoutes from '@/routes/notifications'
import transactionRoutes from '@/routes/transactions'
import analyticsRoutes from '@/routes/analytics'
import bidRoutes from '@/routes/bidRoutes'
import fileUploadRoutes from '@/routes/fileUpload'
import databaseMetricsRoutes from '@/routes/databaseMetrics'
import rateLimitRoutes from '@/routes/rateLimit'
import healthService from '@/services/healthService'
import cacheService from '@/services/cacheService'
import { jobQueueService } from '@/services/jobQueueService'
import { createLogger } from '@/utils/logger'
import { websocketService } from '@/services/websocketService'
import { emailService } from '@/services/emailService'
import { ensureIndexes } from '@/scripts/ensureIndexes'
import { runMigrations } from '@/services/migrationService'
import { redis } from '@/config/redis'
import adminRoutes from '@/routes/admin'
import cdnRoutes from '@/routes/cdn'
import logsRoute from "./routes/logs";
import { optionalAuthenticate } from '@/middleware/authMiddleware';
import { standardLimiter } from '@/middleware/rateLimitMiddleware';
import { setupSwagger } from '@/config/swagger';
import { backupService } from '@/services/backupService';
import { backupQueue } from '@/queues/backupQueue';
import apiDashboardRoutes from '@/routes/apiDashboard';

dotenv.config()

const logger = createLogger('Server')
const PORT = Number(process.env.PORT || 3001)
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/muse'

export function createApp() {
  const app = express()

  app.use(cors(corsOptions))
  app.options('*', cors(corsOptions))

  // ── Security Headers ─────────────────────────────────────────────────────────────
  // Apply security middleware early to ensure all responses have proper headers
  app.use(securityMiddleware)
  // ── CDN Headers & Configuration ──────────────────────────────────────────────────
  // Apply CDN headers for static assets and inject CDN configuration
  app.use(addCDNHeaders)
  app.use(injectCDNConfig)

  app.use(
      compression({
        threshold: 0,
        filter: (req, res) => {
          if (req.headers['x-no-compression']) {
            return false
          }
          return compression.filter(req, res)
        }
      })
  )
  app.use(express.json({ limit: '10mb' }))
  app.use(express.urlencoded({ extended: true }))

  // ── Request Tracing ──────────────────────────────────────────────────────────
  app.use(requestContext)

  // ── Structured HTTP Logging & Performance Monitoring ────────────────────────
  if (process.env.NODE_ENV !== 'test') {
    app.use(requestLogger)
    app.use(performanceLogger)
  }

  // ── Frontend error ingestion & log query ─────────────────────────────────────
  app.use('/logs', logsRoute)

  // ── Health / Readiness / Liveness ────────────────────────────────────────────
  app.get('/health', async (_req, res, next) => {
    try {
      const health = await healthService.getHealthCheck()
      res.status(200).json(health)
    } catch (error) {
      next(error)
    }
  })

  app.get('/health/simple', (_req, res) => {
    res.status(200).json({
      status: 'OK',
      timestamp: new Date().toISOString(),
      service: 'muse-backend'
    })
  })

  app.get('/ready', async (_req, res, next) => {
    try {
      const readiness = await healthService.getReadinessCheck()
      res.status(readiness.ready ? 200 : 503).json({
        ...readiness,
        timestamp: new Date().toISOString()
      })
    } catch (error) {
      next(error)
    }
  })

  app.get('/live', async (_req, res, next) => {
    try {
      const liveness = await healthService.getLivenessCheck()
      res.status(200).json(liveness)
    } catch (error) {
      next(error)
    }
  })

  // ── Swagger Documentation ────────────────────────────────────────────────────
  setupSwagger(app)

  // ── API Routes ───────────────────────────────────────────────────────────────
  // Apply optional authentication globally to populate req.user for rate limiting
  app.use('/api', optionalAuthenticate)
  app.use('/api', featureFlagMiddleware)

  // Apply baseline rate limiting to all API endpoints
  app.use('/api', standardLimiter)

  app.use('/api/auth', authRoutes)
  app.use('/api/artworks', artworkRoutes)
  app.use('/api/users', userRoutes)
  app.use('/api/search', searchRoutes)
  app.use('/api/ai', aiRoutes)
  app.use('/api/cdn', cdnRoutes)
  app.use('/api/metadata', metadataRoutes)
  app.use('/api/cache', cacheRoutes)
  app.use('/api/cache', cacheManagementRoutes)
  app.use('/api/database', databaseMetricsRoutes)
  app.use('/api/admin', adminRoutes)
  app.use('/api/bids', bidRoutes)
  app.use('/api/dashboard', apiDashboardRoutes)

  // ── 404 & Global Error Handlers ──────────────────────────────────────────────
  app.use(notFound)
  app.use(errorHandler)

  return app
}

export const app = createApp()

export async function startServer() {
  await database.connect()
  if (database.getConnectionStatus()) {
    logger.info('Connected to MongoDB with connection pooling')

    // Run pending database migrations before accepting traffic
    try {
      await runMigrations()
      logger.info('✅ Database migrations completed')
    } catch (error) {
      logger.error('❌ Database migrations failed — aborting startup', error)
      process.exit(1)
    }

    // Initialize backup service and scheduled backups
    try {
      await backupService.initialize()
      logger.info('✅ Backup service initialized')
    } catch (error) {
      logger.warn('Backup service initialization failed:', error)
    }

    // Initialize backup queue (scheduled backups configured via BACKUP_SCHEDULE_CRON)
    try {
      // backupQueue is initialized on import (see queues/backupQueue.ts)
      logger.info('✅ Backup queue initialized')
    } catch (error) {
      logger.warn('Backup queue initialization failed:', error)
    }

    // Ensure database indexes are created
    await ensureIndexes()
    logger.info('🔍 Database indexes verified and created')

    // Initialize Redis for distributed rate limiting
    try {
      await redis.connect()
      logger.info('🔴 Redis connected for distributed rate limiting')
    } catch (error) {
      logger.warn('Redis connection failed, rate limiting will use memory fallback:', error)
    }

    if (process.env.NODE_ENV !== 'test') {
      try {
        await jobQueueService.initialize()
        const { registerAllJobProcessors } = await import('@/services/jobProcessors')
        registerAllJobProcessors(jobQueueService)
        logger.info('Job queue service initialized and processors registered')
      } catch (error) {
        logger.warn('Job queue service initialization failed:', error)
      }

      try {
        await emailService.initialize()
        logger.info('Email service initialized')
      } catch (error) {
        logger.warn('Email service initialization failed:', error)
      }
    }

    const server = app.listen(PORT, () => {
      logger.info(`Server running on port ${PORT}`)
      logger.info(`Cache stats: ${JSON.stringify(cacheService.getCacheStats())}`)
    })

    // Initialize WebSocket service
    try {
      websocketService.initialize(server)
      logger.info('WebSocket service initialized')
    } catch (error) {
      logger.error('Failed to initialize WebSocket service:', error)
    }

    return server
  }
}

if (process.env.NODE_ENV !== 'test') {
  startServer().catch((error) => {
    logger.error('Failed to start server:', error)
    process.exit(1)
  })
}

async function shutdown(signal: string) {
  logger.info(`${signal} received, shutting down gracefully`)

  try {
    await new Promise<void>((resolve) => {
      backupQueue.close().then(resolve).catch(resolve)
    })
  } catch (error) {
    logger.warn('Backup queue shutdown encountered an error:', error)
  }

  try {
    await jobQueueService.shutdown()
  } catch (error) {
    logger.warn('Job queue shutdown encountered an error:', error)
  }

  try {
    websocketService.shutdown()
  } catch (error) {
    logger.warn('WebSocket service shutdown encountered an error:', error)
  }

  try {
    await cacheService.disconnect()
  } catch (error) {
    logger.warn('Cache disconnect encountered an error:', error)
  }

  try {
    await redis.disconnect()
  } catch (error) {
    logger.warn('Redis disconnect encountered an error:', error)
  }

  try {
    await database.disconnect()
  } catch (error) {
    logger.warn('Database disconnect encountered an error:', error)
  }
}

process.on('SIGTERM', async () => {
  await shutdown('SIGTERM')
  process.exit(0)
})

process.on('SIGINT', async () => {
  await shutdown('SIGINT')
  process.exit(0)
})

export default app
