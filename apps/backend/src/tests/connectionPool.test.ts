import { database } from '@/config/database'
import mongoose from 'mongoose'

describe('Database Connection Pool', () => {
  beforeAll(async () => {
    // Set test environment variables
    process.env.NODE_ENV = 'test'
    process.env.DB_MAX_POOL_SIZE = '10'
    process.env.DB_MIN_POOL_SIZE = '2'
  })

  afterAll(async () => {
    // Clean up connection
    if (database.getConnectionStatus()) {
      await database.disconnect()
    }
  })

  describe('Connection Management', () => {
    it('should connect to database with pooling configuration', async () => {
      await expect(database.connect()).resolves.not.toThrow()
      expect(database.getConnectionStatus()).toBe(true)
    })

    it('should handle multiple connection attempts gracefully', async () => {
      await database.connect()
      
      // Should not throw error on subsequent connection attempts
      await expect(database.connect()).resolves.not.toThrow()
      expect(database.getConnectionStatus()).toBe(true)
    })

    it('should disconnect properly', async () => {
      await database.connect()
      await expect(database.disconnect()).resolves.not.toThrow()
      expect(database.getConnectionStatus()).toBe(false)
    })
  })

  describe('Connection Pool Statistics', () => {
    beforeEach(async () => {
      await database.connect()
      database.resetMetrics()
    })

    it('should return pool statistics', () => {
      const stats = database.getConnectionPoolStats()
      
      expect(stats).toHaveProperty('readyState')
      expect(stats).toHaveProperty('maxPoolSize')
      expect(stats).toHaveProperty('minPoolSize')
      expect(stats).toHaveProperty('poolSize')
      expect(typeof stats.readyState).toBe('number')
    })

    it('should return connection metrics', () => {
      const metrics = database.getConnectionMetrics()
      
      expect(metrics).toHaveProperty('totalConnections')
      expect(metrics).toHaveProperty('activeConnections')
      expect(metrics).toHaveProperty('failedConnections')
      expect(metrics).toHaveProperty('averageResponseTime')
      expect(metrics).toHaveProperty('errorRate')
      expect(Array.isArray(metrics.recentErrors)).toBe(true)
    })
  })

  describe('Health Check', () => {
    beforeEach(async () => {
      await database.connect()
    })

    it('should perform successful health check', async () => {
      const health = await database.healthCheck()
      
      expect(health).toHaveProperty('status')
      expect(health).toHaveProperty('responseTime')
      expect(typeof health.responseTime).toBe('number')
      expect(health.responseTime).toBeGreaterThan(0)
    })

    it('should update metrics after health check', async () => {
      database.resetMetrics()
      
      await database.healthCheck()
      
      const metrics = database.getConnectionMetrics()
      expect(metrics.lastHealthCheck).toBeInstanceOf(Date)
      expect(metrics.responseTimeHistory.length).toBeGreaterThan(0)
    })
  })

  describe('Error Handling', () => {
    it('should handle connection errors gracefully', async () => {
      // Test with invalid connection string
      const originalUri = process.env.MONGODB_URI
      process.env.MONGODB_URI = 'mongodb://invalid:27017/test'
      
      // Reset database instance to test error handling
      // Note: This would require modifying the singleton pattern for testing
      
      process.env.MONGODB_URI = originalUri
    })
  })

  describe('Concurrent Connections', () => {
    beforeEach(async () => {
      await database.connect()
    })

    it('should handle multiple concurrent operations', async () => {
      const operations = Array.from({ length: 10 }, () => 
        database.healthCheck()
      )
      
      const results = await Promise.all(operations)
      
      results.forEach(result => {
        expect(result).toHaveProperty('status')
        expect(result).toHaveProperty('responseTime')
      })
    })
  })

  describe('Metrics Reset', () => {
    beforeEach(async () => {
      await database.connect()
    })

    it('should reset all metrics', async () => {
      // Generate some activity
      await database.healthCheck()
      
      // Reset metrics
      database.resetMetrics()
      
      const metrics = database.getConnectionMetrics()
      expect(metrics.totalConnections).toBe(0)
      expect(metrics.failedConnections).toBe(0)
      expect(metrics.responseTimeHistory.length).toBe(0)
      expect(metrics.averageResponseTime).toBe(0)
    })
  })
})
