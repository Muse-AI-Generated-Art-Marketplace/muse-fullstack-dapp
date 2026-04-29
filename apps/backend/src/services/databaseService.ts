import mongoose from 'mongoose'
import { createLogger } from '@/utils/logger'

const logger = createLogger('DatabaseService')

class DatabaseService {
  private static instance: DatabaseService
  private isConnected: boolean = false

  private constructor() {}

  static getInstance(): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService()
    }
    return DatabaseService.instance
  }

  async connect(): Promise<void> {
    try {
      if (this.isConnected && mongoose.connection.readyState === 1) {
        logger.info('Already connected to MongoDB')
        return
      }

      const mongoUri = process.env.MONGODB_URI
      if (!mongoUri) {
        throw new Error('MONGODB_URI environment variable is not set')
      }

      await mongoose.connect(mongoUri, {
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
        bufferCommands: false,
        bufferMaxEntries: 0
      })

      this.isConnected = true
      logger.info(`Connected to MongoDB: ${mongoUri}`)

      mongoose.connection.on('error', (error) => {
        logger.error('MongoDB connection error:', error)
        this.isConnected = false
      })

      mongoose.connection.on('disconnected', () => {
        logger.warn('MongoDB disconnected')
        this.isConnected = false
      })

      mongoose.connection.on('reconnected', () => {
        logger.info('MongoDB reconnected')
        this.isConnected = true
      })

    } catch (error) {
      this.isConnected = false
      logger.error('Failed to connect to MongoDB:', error)
      throw error
    }
  }

  async disconnect(): Promise<void> {
    try {
      await mongoose.disconnect()
      this.isConnected = false
      logger.info('Disconnected from MongoDB')
    } catch (error) {
      logger.error('Error disconnecting from MongoDB:', error)
      throw error
    }
  }

  isConnectionHealthy(): boolean {
    return this.isConnected && mongoose.connection.readyState === 1
  }

  getConnectionState(): string {
    switch (mongoose.connection.readyState) {
      case 0: return 'disconnected'
      case 1: return 'connected'
      case 2: return 'connecting'
      case 3: return 'disconnecting'
      default: return 'unknown'
    }
  }

  async healthCheck(): Promise<{ status: string; responseTime: number }> {
    const startTime = Date.now()
    
    try {
      await mongoose.connection.db.admin().ping()
      return {
        status: 'healthy',
        responseTime: Date.now() - startTime
      }
    } catch (error) {
      return {
        status: 'unhealthy',
        responseTime: Date.now() - startTime
      }
    }
  }
}

export default DatabaseService.getInstance()
