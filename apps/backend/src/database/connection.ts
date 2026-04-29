import mongoose from 'mongoose'
import { createLogger } from '@/utils/logger'

const logger = createLogger('Database')

export interface DatabaseConfig {
  uri: string
  options?: mongoose.ConnectOptions
}

class DatabaseConnection {
  private static instance: DatabaseConnection
  private isConnected: boolean = false

  private constructor() {}

  public static getInstance(): DatabaseConnection {
    if (!DatabaseConnection.instance) {
      DatabaseConnection.instance = new DatabaseConnection()
    }
    return DatabaseConnection.instance
  }

  public async connect(config: DatabaseConfig): Promise<void> {
    if (this.isConnected) {
      logger.info('Database already connected')
      return
    }

    try {
      const defaultOptions: mongoose.ConnectOptions = {
        maxPoolSize: 10, // Maintain up to 10 socket connections
        serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
        socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
        bufferMaxEntries: 0, // Disable mongoose buffering
        bufferCommands: false, // Disable mongoose buffering
      }

      const options = { ...defaultOptions, ...config.options }

      await mongoose.connect(config.uri, options)
      this.isConnected = true

      logger.info('Connected to MongoDB successfully')

      // Set up event listeners for connection monitoring
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
    return this.isConnected
  }

  public async healthCheck(): Promise<{ status: 'healthy' | 'unhealthy', details?: any }> {
    try {
      if (!this.isConnected) {
        return { status: 'unhealthy', details: 'Not connected' }
      }

      // Simple ping to check if database is responsive
      await mongoose.connection.db.admin().ping()
      
      return { 
        status: 'healthy', 
        details: {
          readyState: mongoose.connection.readyState,
          host: mongoose.connection.host,
          port: mongoose.connection.port,
          name: mongoose.connection.name
        }
      }
    } catch (error) {
      logger.error('Database health check failed:', error)
      return { 
        status: 'unhealthy', 
        details: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }
}

// Export singleton instance
export const database = DatabaseConnection.getInstance()

// Export connection function for easy use
export const connectDatabase = async (): Promise<void> => {
  const uri = process.env.DATABASE_URL || process.env.MONGODB_URI || 'mongodb://localhost:27017/muse-dapp'
  
  const config: DatabaseConfig = {
    uri,
    options: {
      // Additional options can be configured via environment variables
      maxPoolSize: parseInt(process.env.DB_MAX_POOL_SIZE || '10'),
      serverSelectionTimeoutMS: parseInt(process.env.DB_SERVER_SELECTION_TIMEOUT || '5000'),
      socketTimeoutMS: parseInt(process.env.DB_SOCKET_TIMEOUT || '45000'),
    }
  }

  await database.connect(config)
}

// Graceful shutdown helper
export const closeDatabaseConnection = async (): Promise<void> => {
  await database.disconnect()
}
