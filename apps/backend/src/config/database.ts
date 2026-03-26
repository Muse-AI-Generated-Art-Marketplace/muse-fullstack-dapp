import mongoose from 'mongoose'
import { createLogger } from '@/utils/logger'

const logger = createLogger('Database')

export class DatabaseConnection {
  private static instance: DatabaseConnection
  private isConnected: boolean = false

  private constructor() {}

  public static getInstance(): DatabaseConnection {
    if (!DatabaseConnection.instance) {
      DatabaseConnection.instance = new DatabaseConnection()
    }
    return DatabaseConnection.instance
  }

  public async connect(): Promise<void> {
    if (this.isConnected) {
      logger.info('Database already connected')
      return
    }

    try {
      const mongoUri = process.env.MONGODB_URI || process.env.DATABASE_URL || 'mongodb://localhost:27017/muse'
      
      await mongoose.connect(mongoUri, {
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
        bufferCommands: false,
        bufferMaxEntries: 0
      })

      this.isConnected = true
      logger.info('Connected to MongoDB successfully')

      // Set up connection event listeners
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
      logger.error('Failed to connect to MongoDB:', error)
      this.isConnected = false
      throw error
    }
  }

  public async disconnect(): Promise<void> {
    if (!this.isConnected) {
      return
    }

    try {
      await mongoose.disconnect()
      this.isConnected = false
      logger.info('Disconnected from MongoDB')
    } catch (error) {
      logger.error('Error disconnecting from MongoDB:', error)
      throw error
    }
  }

  public getConnectionStatus(): boolean {
    return this.isConnected && mongoose.connection.readyState === 1
  }

  public async healthCheck(): Promise<{ status: string; responseTime?: number }> {
    const startTime = Date.now()
    
    try {
      await mongoose.connection.db?.admin().ping()
      const responseTime = Date.now() - startTime
      
      return {
        status: 'healthy',
        responseTime
      }
    } catch (error) {
      logger.error('Database health check failed:', error)
      return {
        status: 'unhealthy'
      }
    }
  }
}

// Export singleton instance
export const database = DatabaseConnection.getInstance()
