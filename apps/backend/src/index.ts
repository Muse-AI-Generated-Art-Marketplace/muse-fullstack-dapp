import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import compression from 'compression'
import rateLimit from 'express-rate-limit'
import dotenv from 'dotenv'

import { errorHandler } from '@/middleware/errorHandler'
import { notFound } from '@/middleware/notFound'
import cacheService from '@/services/cacheService'
import { createLogger } from '@/utils/logger'
import artworkRoutes from '@/routes/artwork'
import userRoutes from '@/routes/user'
import aiRoutes from '@/routes/ai'
import metadataRoutes from '@/routes/metadata'
import cacheRoutes from '@/routes/cache'
import imageOptimizerRoutes from '@/routes/imageOptimizer'

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

app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    service: 'muse-backend',
  })
})

app.use('/api/artworks', artworkRoutes)
app.use('/api/users', userRoutes)
app.use('/api/ai', aiRoutes)
app.use('/api/metadata', metadataRoutes)
app.use('/api/cache', cacheRoutes)
app.use('/api', imageOptimizerRoutes)

app.use(notFound)
app.use(errorHandler)

app.listen(PORT, () => {
  logger.info(`🚀 Muse Backend API running on port ${PORT}`)
  logger.info(`📊 Health check: http://localhost:${PORT}/health`)
  logger.info(`🗄️ Cache stats: ${JSON.stringify(cacheService.getCacheStats())}`)
})

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully')
  await cacheService.disconnect()
  process.exit(0)
})

process.on('SIGINT', async () => {
  logger.info('SIGINT received, shutting down gracefully')
  await cacheService.disconnect()
  process.exit(0)
})

export default app
