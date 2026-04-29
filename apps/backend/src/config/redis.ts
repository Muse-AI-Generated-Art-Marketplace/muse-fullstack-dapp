import { createClient, RedisClientType } from 'redis'
import { createLogger } from '@/utils/logger'

const logger = createLogger('Redis')

export class RedisConnection {
  private static instance: RedisConnection
  private client: RedisClientType | null = null
  private isConnected: boolean = false
  private connectionMetrics = {
    totalConnections: 0,
    failedConnections: 0,
    connectionErrors: [] as Array<{ timestamp: Date; error: string }>,
    lastHealthCheck: null as Date | null,
    averageResponseTime: 0,
    responseTimeHistory: [] as number[]
  }

  private constructor() {}

  public static getInstance(): RedisConnection {
    if (!RedisConnection.instance) {
      RedisConnection.instance = new RedisConnection()
    }
    return RedisConnection.instance
  }

  public async connect(): Promise<void> {
    if (this.isConnected && this.client) {
      logger.info('Redis already connected')
      return
    }

    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379'

    try {
      this.client = createClient({
        url: redisUrl,
        socket: {
          connectTimeout: Number(process.env.REDIS_CONNECT_TIMEOUT_MS) || 10000,
          lazyConnect: true,
          reconnectStrategy: (retries) => {
            if (retries > 10) {
              logger.error('Redis reconnection failed after 10 attempts')
              return new Error('Redis reconnection failed')
            }
            return Math.min(retries * 50, 1000)
          }
        },
        password: process.env.REDIS_PASSWORD
      })

      this.client.on('error', (error) => {
        logger.error('Redis client error:', error)
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

      this.client.on('connect', () => {
        logger.info('Redis client connected')
        this.isConnected = true
        this.connectionMetrics.totalConnections++
      })

      this.client.on('disconnect', () => {
        logger.warn('Redis client disconnected')
        this.isConnected = false
      })

      this.client.on('reconnecting', () => {
        logger.info('Redis client reconnecting')
      })

      await this.client.connect()
      logger.info('Connected to Redis successfully')

    } catch (error) {
      logger.warn('Redis connection failed. Rate limiting will fall back to memory:', error instanceof Error ? error.message : error)
      this.isConnected = false
      this.client = null
    }
  }

  public async disconnect(): Promise<void> {
    if (!this.client || !this.isConnected) {
      return
    }

    try {
      await this.client.quit()
      this.isConnected = false
      this.client = null
      logger.info('Disconnected from Redis')
    } catch (error) {
      logger.error('Error disconnecting from Redis:', error)
      throw error
    }
  }

  public getClient(): RedisClientType | null {
    return this.client
  }

  public getConnectionStatus(): boolean {
    return this.isConnected && this.client !== null
  }

  public async healthCheck(): Promise<{ status: string; responseTime?: number }> {
    const startTime = Date.now()

    if (!this.isConnected || !this.client) {
      return { status: 'unavailable' }
    }

    try {
      await this.client.ping()
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
      logger.error('Redis health check failed:', error)
      this.connectionMetrics.lastHealthCheck = new Date()
      return {
        status: 'unhealthy'
      }
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
      failedConnections: 0,
      connectionErrors: [],
      lastHealthCheck: null,
      averageResponseTime: 0,
      responseTimeHistory: []
    }
    logger.info('Redis connection metrics reset')
  }
}

export const redis = RedisConnection.getInstance()
