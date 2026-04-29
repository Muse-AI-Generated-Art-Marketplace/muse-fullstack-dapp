import mongoose from 'mongoose'
import { createLogger } from '@/utils/logger'

const logger = createLogger('Database')

export class DatabaseConnection {
  private static instance: DatabaseConnection
  private isConnected: boolean = false
  private connectionMetrics = {
    totalConnections: 0,
    activeConnections: 0,
    failedConnections: 0,
    connectionErrors: [] as Array<{ timestamp: Date; error: string }>,
    lastHealthCheck: null as Date | null,
    averageResponseTime: 0,
    responseTimeHistory: [] as number[]
  }

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

    const mongoUri = process.env.MONGODB_URI || process.env.DATABASE_URL || 'mongodb://localhost:27017/muse'

    try {
      await mongoose.connect(mongoUri, {
        maxPoolSize: Math.max(10, Number(process.env.DB_MAX_POOL_SIZE) || 20),
        minPoolSize: Math.max(2, Number(process.env.DB_MIN_POOL_SIZE) || 5),
        maxIdleTimeMS: Number(process.env.DB_MAX_IDLE_TIME_MS) || 30000,
        serverSelectionTimeoutMS: Number(process.env.DB_SERVER_SELECTION_TIMEOUT_MS) || 5000,
        socketTimeoutMS: Number(process.env.DB_SOCKET_TIMEOUT_MS) || 45000,
        connectTimeoutMS: Number(process.env.DB_CONNECT_TIMEOUT_MS) || 10000,
        heartbeatFrequencyMS: Number(process.env.DB_HEARTBEAT_FREQUENCY_MS) || 10000,
        bufferCommands: false,
        waitQueueTimeoutMS: Number(process.env.DB_WAIT_QUEUE_TIMEOUT_MS) || 10000,
        retryWrites: true,
        retryReads: true,
        readPreference: (process.env.DB_READ_PREFERENCE as any) || 'primary',
        writeConcern: {
          w: Number(process.env.DB_WRITE_CONCERN_W) || 'majority',
          j: process.env.DB_WRITE_CONCERN_J !== 'false',
          wtimeout: Number(process.env.DB_WRITE_CONCERN_TIMEOUT_MS) || 5000
        }
      })

      this.isConnected = true
      this.connectionMetrics.totalConnections++
      this.connectionMetrics.activeConnections = mongoose.connection.readyState === 1 ? 1 : 0
      logger.info('Connected to MongoDB successfully')

      mongoose.connection.on('error', (error: Error) => {
        logger.error('MongoDB connection error:', error)
        this.isConnected = false
        this.connectionMetrics.failedConnections++
        this.connectionMetrics.connectionErrors.push({
          timestamp: new Date(),
          error: error.message
        })
        if (this.connectionMetrics.connectionErrors.length > 50) {
          this.connectionMetrics.connectionErrors = this.connectionMetrics.connectionErrors.slice(-50)
        }
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
      logger.warn('MongoDB connection failed. Running in demo mode without database:', error instanceof Error ? error.message : error)
      this.isConnected = false
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

    if (!this.isConnected || !mongoose.connection.db) {
      return { status: 'unavailable' }
    }

    try {
      await mongoose.connection.db.admin().ping()
      const responseTime = Date.now() - startTime

      this.connectionMetrics.lastHealthCheck = new Date()
      this.connectionMetrics.responseTimeHistory.push(responseTime)
      if (this.connectionMetrics.responseTimeHistory.length > 100) {
        this.connectionMetrics.responseTimeHistory = this.connectionMetrics.responseTimeHistory.slice(-100)
      }
      this.connectionMetrics.averageResponseTime =
        this.connectionMetrics.responseTimeHistory.reduce((a, b) => a + b, 0) / this.connectionMetrics.responseTimeHistory.length

      return {
        status: 'healthy',
        responseTime
      }
    } catch (error) {
      logger.error('Database health check failed:', error)
      this.connectionMetrics.lastHealthCheck = new Date()
      return {
        status: 'unhealthy'
      }
    }
  }

  public getConnectionPoolStats() {
    return {
      readyState: mongoose.connection.readyState,
      host: mongoose.connection.host,
      port: mongoose.connection.port,
      name: mongoose.connection.name,
      isConnected: this.isConnected
    }
  }

  public getConnectionMetrics() {
    return {
      ...this.connectionMetrics,
      connectionUptime: this.isConnected ? Date.now() - (this.connectionMetrics.lastHealthCheck?.getTime() || Date.now()) : 0,
      errorRate: this.connectionMetrics.totalConnections > 0
        ? (this.connectionMetrics.failedConnections / this.connectionMetrics.totalConnections) * 100
        : 0,
      recentErrors: this.connectionMetrics.connectionErrors.slice(-10)
    }
  }

  public resetMetrics() {
    this.connectionMetrics = {
      totalConnections: 0,
      activeConnections: 0,
      failedConnections: 0,
      connectionErrors: [],
      lastHealthCheck: null,
      averageResponseTime: 0,
      responseTimeHistory: []
    }
    logger.info('Database connection metrics reset')
  }
}

export const database = DatabaseConnection.getInstance()