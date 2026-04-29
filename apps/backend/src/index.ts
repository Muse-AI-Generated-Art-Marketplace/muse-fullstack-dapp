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
    closeDatabaseConnection()
  ])
  process.exit(0)
})

process.on('SIGINT', async () => {
  logger.info('SIGINT received, shutting down gracefully')
  await Promise.all([
    cacheService.disconnect(),
    closeDatabaseConnection()
  ])
  process.exit(0)
})

export default app
