import compression from 'compression'
import cors from 'cors'
import dotenv from 'dotenv'
import express from 'express'
import mongoose from 'mongoose'

import { database } from '@/config/database'
import { securityMiddleware } from '@/middleware/security'
import { requestContext } from '@/middleware/requestContext'
import { requestLogger } from '@/middleware/requestLogger'
import { errorHandler } from '@/middleware/errorHandler'
import { notFound } from '@/middleware/notFound'
import { deprecationMiddleware, addVersionHeader, API_VERSION } from '@/middleware/deprecation'
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
import fileUploadRoutes from '@/routes/fileUpload'
import databaseMetricsRoutes from '@/routes/databaseMetrics'
import healthService from '@/services/healthService'
import cacheService from '@/services/cacheService'
import { jobQueueService } from '@/services/jobQueueService'
import { createLogger } from '@/utils/logger'
import { websocketService } from '@/services/websocketService'
import { ensureIndexes } from '@/scripts/ensureIndexes'
import { runMigrations } from '@/services/migrationService'
import adminRoutes from '@/routes/admin'
import { backupService } from '@/services/backupService'
import { backupQueue } from '@/queues/backupQueue'
import logsRoute from "./routes/logs";
import { optionalAuthenticate } from '@/middleware/authMiddleware';
import { standardLimiter } from '@/middleware/rateLimitMiddleware';

dotenv.config()

const logger = createLogger('Server')
const PORT = Number(process.env.PORT || 3001)
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/muse'

export function createApp() {
  const app = express()

  const allowedOrigins = process.env.CORS_ORIGINS
    ? process.env.CORS_ORIGINS.split(',').map((origin) => origin.trim())
    : [process.env.FRONTEND_URL || 'http://localhost:3000']

  const corsOptions = {
    origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
      if (!origin || allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
        return callback(null, true)
      }

      callback(new Error('Not allowed by CORS'))
    },
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Origin', 'X-Requested-With', 'Content-Type', 'Accept', 'Authorization'],
    credentials: true,
    optionsSuccessStatus: 204
  }

  app.use(cors(corsOptions))
  app.options('*', cors(corsOptions))
  
  // ── Security Headers ─────────────────────────────────────────────────────────────
  // Apply security middleware early to ensure all responses have proper headers
  app.use(securityMiddleware)
  
  app.use(compression())
  app.use(express.json({ limit: '10mb' }))
  app.use(express.urlencoded({ extended: true }))
  app.use("/logs", logsRoute);

  // ── Request Tracing ──────────────────────────────────────────────────────────
  app.use(requestContext)

  // ── Structured HTTP Logging (replaces morgan) ────────────────────────────────
  if (process.env.NODE_ENV !== 'test') {
    app.use(requestLogger)
  }

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
  
  // Apply baseline rate limiting to all API endpoints
  app.use('/api', standardLimiter)

  app.use('/api/auth', authRoutes)
  app.use('/api/artworks', artworkRoutes)
  app.use('/api/users', userRoutes)
  app.use('/api/search', searchRoutes)
  app.use('/api/ai', aiRoutes)
  app.use('/api/metadata', metadataRoutes)
  app.use('/api/cache', cacheRoutes)
  app.use('/api/cache', cacheManagementRoutes)
  app.use('/api/database', databaseMetricsRoutes)
  app.use('/api/admin', adminRoutes)

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

  if (process.env.NODE_ENV !== 'test') {
    try {
      await jobQueueService.initialize()
      logger.info('Job queue service initialized')
    } catch (error) {
      logger.warn('Job queue service initialization failed:', error)
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
