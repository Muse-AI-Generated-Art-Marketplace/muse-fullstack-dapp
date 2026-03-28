import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import mongoose from 'mongoose'
import authRoutes from './routes/auth'
import artworkRoutes from './routes/artwork'
import userRoutes from './routes/user'
import aiRoutes from './routes/ai'
import metadataRoutes from './routes/metadata'
import cacheRoutes from './routes/cache'
import cacheManagementRoutes from './routes/cacheManagement'
import imageOptimizerRoutes from './routes/imageOptimizer'
import favoriteRoutes from './routes/favorites'
import apiKeyRoutes from './routes/apiKeys'
import jobRoutes from './routes/jobs'
import { notFoundHandler } from './middleware/notFound'
import { errorHandler } from './middleware/errorHandler'
import { jobQueueService } from './services/jobQueueService'

// Load environment variables
dotenv.config()

const app = express()
const PORT = process.env.PORT || 3001
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/muse'

// Middleware
const allowedOrigins = process.env.CORS_ORIGINS
  ? process.env.CORS_ORIGINS.split(',').map((origin) => origin.trim())
  : ['*']

const corsOptions = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    if (!origin) {
      // Allow non-browser requests (e.g., server-to-server)
      return callback(null, true)
    }

    if (allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
      return callback(null, true)
    }

    callback(new Error('Not allowed by CORS'))
  },
  methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Origin', 'X-Requested-With', 'Content-Type', 'Accept', 'Authorization'],
  credentials: true,
  optionsSuccessStatus: 204,
}

app.use(cors(corsOptions))
app.options('*', cors(corsOptions))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// API Routes
app.use('/api/auth', authRoutes)
app.use('/api/artwork', artworkRoutes)
app.use('/api/user', userRoutes)
app.use('/api/ai', aiRoutes)
app.use('/api/metadata', metadataRoutes)
app.use('/api/cache', cacheRoutes)
app.use('/api/cache', cacheManagementRoutes)
app.use('/api/images', imageOptimizerRoutes)
app.use('/api/favorites', favoriteRoutes)
app.use('/api/keys', apiKeyRoutes)
app.use('/api/jobs', jobRoutes)

// Error handling
app.use(notFoundHandler)
app.use(errorHandler)

// Database connection and server start
mongoose
  .connect(MONGODB_URI)
  .then(async () => {
    console.log('Connected to MongoDB')
    
    // Initialize job queue service
    try {
      await jobQueueService.initialize()
      console.log('Job queue service initialized')
    } catch (error) {
      console.error('Failed to initialize job queue service:', error)
    }
    
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`)
    })
  })
  .catch((error) => {
    console.error('MongoDB connection error:', error)
    process.exit(1)
  })

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully')
  
  try {
    await jobQueueService.shutdown()
    await mongoose.connection.close()
    console.log('Graceful shutdown completed')
    process.exit(0)
  } catch (error) {
    console.error('Error during shutdown:', error)
    process.exit(1)
  }
})

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down gracefully')
  
  try {
    await jobQueueService.shutdown()
    await mongoose.connection.close()
    console.log('Graceful shutdown completed')
    process.exit(0)
  } catch (error) {
    console.error('Error during shutdown:', error)
    process.exit(1)
  }
})

export default app