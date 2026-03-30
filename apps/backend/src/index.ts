import compression from 'compression'
import cors from 'cors'
import dotenv from 'dotenv'
import express from 'express'
import mongoose from 'mongoose'

import { securityMiddleware } from '@/middleware/security'
import { requestContext } from '@/middleware/requestContext'
import { requestLogger } from '@/middleware/requestLogger'
import { errorHandler } from '@/middleware/errorHandler'
import { notFound } from '@/middleware/notFound'
import authRoutes from '@/routes/auth'
import artworkRoutes from '@/routes/artwork'
import userRoutes from '@/routes/user'
import aiRoutes from '@/routes/ai'
import metadataRoutes from '@/routes/metadata'
import cacheRoutes from '@/routes/cache'
import cacheManagementRoutes from '@/routes/cacheManagement'
import imageOptimizerRoutes from '@/routes/imageOptimizer'
import favoriteRoutes from '@/routes/favorites'
import apiKeyRoutes from '@/routes/apiKeys'
import jobRoutes from '@/routes/jobs'
import transactionRoutes from '@/routes/transactions'
import analyticsRoutes from '@/routes/analytics'
import healthService from '@/services/healthService'
import cacheService from '@/services/cacheService'
import { jobQueueService } from '@/services/jobQueueService'
import { createLogger } from '@/utils/logger'

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

  // ── API Routes ───────────────────────────────────────────────────────────────
  app.use('/api/auth', authRoutes)
  app.use('/api/artworks', artworkRoutes)
  app.use('/api/users', userRoutes)
  app.use('/api/ai', aiRoutes)
  app.use('/api/metadata', metadataRoutes)
  app.use('/api/cache', cacheRoutes)
  app.use('/api/cache', cacheManagementRoutes)
  app.use('/api/images', imageOptimizerRoutes)
  app.use('/api/favorites', favoriteRoutes)
  app.use('/api/keys', apiKeyRoutes)
  app.use('/api/jobs', jobRoutes)
  app.use('/api/transactions', transactionRoutes)
  app.use('/api/analytics', analyticsRoutes)

  // ── 404 & Global Error Handlers ──────────────────────────────────────────────
  app.use(notFound)
  app.use(errorHandler)

  return app
}

export const app = createApp()

export async function startServer() {
  await mongoose.connect(MONGODB_URI)
  logger.info('Connected to MongoDB')

  if (process.env.NODE_ENV !== 'test') {
    try {
      await jobQueueService.initialize()
      logger.info('Job queue service initialized')
    } catch (error) {
      logger.error('Failed to initialize job queue service:', error)
    }
  }

  return app.listen(PORT, () => {
    logger.info(`Server running on port ${PORT}`)
    logger.info(`Cache stats: ${JSON.stringify(cacheService.getCacheStats())}`)
  })
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
    await jobQueueService.shutdown()
  } catch (error) {
    logger.warn('Job queue shutdown encountered an error:', error)
  }

  try {
    await cacheService.disconnect()
  } catch (error) {
    logger.warn('Cache disconnect encountered an error:', error)
  }

  try {
    await mongoose.connection.close()
  } catch (error) {
    logger.warn('MongoDB disconnect encountered an error:', error)
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
