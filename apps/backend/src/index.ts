import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import compression from 'compression'
import morgan from 'morgan'

import { requestContext } from '@/middleware/requestContext'
import { errorHandler, notFoundHandler } from '@/middleware/errorHandler'
import { createLogger } from '@/utils/logger'
import databaseService from '@/services/databaseService'

// Route imports
import authRoutes from '@/routes/auth'
import artworkRoutes from '@/routes/artwork'
import userRoutes from '@/routes/user'
import aiRoutes from '@/routes/ai'
import metadataRoutes from '@/routes/metadata'

const logger = createLogger('App')
const PORT = parseInt(process.env.PORT || '3001', 10)

const app = express()

// ── Security & Parsing Middleware ────────────────────────────────────────────
app.use(helmet())
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}))
app.use(compression())
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true }))

// ── Request Tracing ──────────────────────────────────────────────────────────
app.use(requestContext)

// ── HTTP Logging ─────────────────────────────────────────────────────────────
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('combined'))
}

// ── Health Check ─────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV || 'development',
  })
})

// ── API Routes ───────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes)
app.use('/api/artworks', artworkRoutes)
app.use('/api/users', userRoutes)
app.use('/api/ai', aiRoutes)
app.use('/api/metadata', metadataRoutes)

// ── 404 & Global Error Handlers ──────────────────────────────────────────────
app.use(notFoundHandler)
app.use(errorHandler)

// ── Graceful Startup ─────────────────────────────────────────────────────────
async function start() {
  try {
    await databaseService.connect()
    logger.info('Database connected successfully')

    const server = app.listen(PORT, () => {
      logger.info(`Server running on port ${PORT}`, { port: PORT, env: process.env.NODE_ENV })
    })

    // ── Graceful Shutdown ──────────────────────────────────────────────────
    const shutdown = async (signal: string) => {
      logger.warn(`Received ${signal} — shutting down gracefully`)
      server.close(async () => {
        try {
          await databaseService.disconnect()
          logger.info('Database disconnected. Server closed.')
          process.exit(0)
        } catch (err) {
          logger.error('Error during shutdown', { error: err })
          process.exit(1)
        }
      })
    }

    process.on('SIGTERM', () => shutdown('SIGTERM'))
    process.on('SIGINT', () => shutdown('SIGINT'))

  } catch (err) {
    logger.error('Failed to start server', { error: err })
    process.exit(1)
  }
}

start()

export default app
