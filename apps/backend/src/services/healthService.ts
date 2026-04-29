import mongoose from 'mongoose'
import Redis from 'redis'
import { createLogger } from '@/utils/logger'
import cacheService from './cacheService'
import { getStellarService } from './stellar'
import axios from 'axios'

const logger = createLogger('HealthService')

export interface HealthCheckResult {
  status: 'healthy' | 'unhealthy' | 'degraded'
  timestamp: string
  service: string
  version?: string
  uptime: number
  checks: {
    database: HealthCheck
    cache: HealthCheck
    stellar: HealthCheck
    aiServices: HealthCheck
  }
  summary: {
    total: number
    healthy: number
    unhealthy: number
    degraded: number
  }
}

export interface HealthCheck {
  status: 'healthy' | 'unhealthy' | 'degraded'
  responseTime?: number
  error?: string
  details?: any
}

class HealthService {
  private startTime: Date

  constructor() {
    this.startTime = new Date()
  }

  async checkDatabase(): Promise<HealthCheck> {
    const startTime = Date.now()
    
    try {
      if (mongoose.connection.readyState === 1) {
        // Test database with a simple ping
        await mongoose.connection.db.admin().ping()
        
        return {
          status: 'healthy',
          responseTime: Date.now() - startTime,
          details: {
            readyState: mongoose.connection.readyState,
            host: mongoose.connection.host,
            name: mongoose.connection.name
          }
        }
      } else if (mongoose.connection.readyState === 2) {
        return {
          status: 'degraded',
          responseTime: Date.now() - startTime,
          details: {
            readyState: mongoose.connection.readyState,
            message: 'Connecting to database'
          }
        }
      } else {
        return {
          status: 'unhealthy',
          responseTime: Date.now() - startTime,
          error: 'Database not connected',
          details: {
            readyState: mongoose.connection.readyState
          }
        }
      }
    } catch (error) {
      return {
        status: 'unhealthy',
        responseTime: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown database error',
        details: {
          readyState: mongoose.connection.readyState
        }
      }
    }
  }

  async checkCache(): Promise<HealthCheck> {
    const startTime = Date.now()
    
    try {
      const cacheStats = cacheService.getCacheStats()
      
      // Test cache with a simple set/get operation
      const testKey = 'health-check-test'
      const testValue = { timestamp: Date.now() }
      
      const setSuccess = await cacheService.set(testKey, testValue, 10)
      if (!setSuccess) {
        throw new Error('Failed to set test value in cache')
      }
      
      const retrievedValue = await cacheService.get(testKey)
      if (!retrievedValue || retrievedValue.timestamp !== testValue.timestamp) {
        throw new Error('Failed to retrieve test value from cache')
      }
      
      // Clean up test key
      await cacheService.del(testKey)
      
      return {
        status: 'healthy',
        responseTime: Date.now() - startTime,
        details: {
          useRedis: cacheStats.useRedis,
          fallbackKeys: cacheStats.fallbackKeys,
          fallbackStats: cacheStats.fallbackStats
        }
      }
    } catch (error) {
      return {
        status: 'unhealthy',
        responseTime: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown cache error'
      }
    }
  }

  async checkStellar(): Promise<HealthCheck> {
    const startTime = Date.now()
    
    try {
      if (process.env.NODE_ENV === 'test') {
        return {
          status: 'degraded',
          responseTime: Date.now() - startTime,
          details: {
            message: 'Skipped external Stellar health check in test environment'
          }
        }
      }

      const stellarService = getStellarService()
      
      // Test Stellar RPC connectivity by getting the latest ledger
      const server = stellarService['server']
      await server.getLatestLedger()
      
      return {
        status: 'healthy',
        responseTime: Date.now() - startTime,
        details: {
          network: stellarService['network'],
          rpcUrl: stellarService['server']['serverURL']?.toString()
        }
      }
    } catch (error) {
      return {
        status: 'unhealthy',
        responseTime: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown Stellar RPC error'
      }
    }
  }

  async checkAIServices(): Promise<HealthCheck> {
    const startTime = Date.now()
    const results: { [key: string]: HealthCheck } = {}

    if (process.env.NODE_ENV === 'test') {
      return {
        status: 'degraded',
        responseTime: Date.now() - startTime,
        details: {
          testMode: true,
          message: 'Skipped external AI service checks in test environment'
        }
      }
    }
    
    // Check OpenAI
    if (process.env.OPENAI_API_KEY) {
      try {
        const response = await axios.get('https://api.openai.com/v1/models', {
          headers: {
            'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
            'Content-Type': 'application/json'
          },
          timeout: 5000
        })
        
        results.openai = {
          status: response.status === 200 ? 'healthy' : 'unhealthy',
          responseTime: Date.now() - startTime,
          details: {
            status: response.status,
            modelCount: response.data?.data?.length || 0
          }
        }
      } catch (error) {
        results.openai = {
          status: 'unhealthy',
          responseTime: Date.now() - startTime,
          error: error instanceof Error ? error.message : 'OpenAI API error'
        }
      }
    } else {
      results.openai = {
        status: 'degraded',
        error: 'OpenAI API key not configured'
      }
    }
    
    // Check Stability AI
    if (process.env.STABILITY_API_KEY) {
      try {
        const response = await axios.get('https://api.stability.ai/v1/user/account', {
          headers: {
            'Authorization': `Bearer ${process.env.STABILITY_API_KEY}`,
            'Content-Type': 'application/json'
          },
          timeout: 5000
        })
        
        results.stability = {
          status: response.status === 200 ? 'healthy' : 'unhealthy',
          responseTime: Date.now() - startTime,
          details: {
            status: response.status
          }
        }
      } catch (error) {
        results.stability = {
          status: 'unhealthy',
          responseTime: Date.now() - startTime,
          error: error instanceof Error ? error.message : 'Stability AI API error'
        }
      }
    } else {
      results.stability = {
        status: 'degraded',
        error: 'Stability AI API key not configured'
      }
    }
    
    // Determine overall AI services status
    const healthyCount = Object.values(results).filter(r => r.status === 'healthy').length
    const unhealthyCount = Object.values(results).filter(r => r.status === 'unhealthy').length
    const totalCount = Object.keys(results).length
    
    let overallStatus: 'healthy' | 'unhealthy' | 'degraded'
    if (unhealthyCount === 0 && healthyCount === totalCount) {
      overallStatus = 'healthy'
    } else if (unhealthyCount > 0) {
      overallStatus = 'unhealthy'
    } else {
      overallStatus = 'degraded'
    }
    
    return {
      status: overallStatus,
      responseTime: Date.now() - startTime,
      details: results
    }
  }

  async getHealthCheck(): Promise<HealthCheckResult> {
    const startTime = Date.now()
    
    // Run all health checks in parallel
    const [database, cache, stellar, aiServices] = await Promise.all([
      this.checkDatabase(),
      this.checkCache(),
      this.checkStellar(),
      this.checkAIServices()
    ])
    
    const checks = { database, cache, stellar, aiServices }
    
    // Calculate summary
    const total = Object.keys(checks).length
    const healthy = Object.values(checks).filter(c => c.status === 'healthy').length
    const unhealthy = Object.values(checks).filter(c => c.status === 'unhealthy').length
    const degraded = Object.values(checks).filter(c => c.status === 'degraded').length
    
    // Determine overall status
    let overallStatus: 'healthy' | 'unhealthy' | 'degraded'
    if (unhealthy > 0) {
      overallStatus = 'unhealthy'
    } else if (degraded > 0) {
      overallStatus = 'degraded'
    } else {
      overallStatus = 'healthy'
    }
    
    return {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      service: 'muse-backend',
      version: process.env.npm_package_version || '1.0.0',
      uptime: Date.now() - this.startTime.getTime(),
      checks,
      summary: {
        total,
        healthy,
        unhealthy,
        degraded
      }
    }
  }

  async getReadinessCheck(): Promise<{ ready: boolean; checks: HealthCheckResult['checks'] }> {
    // Readiness checks - only check critical services
    const [database, cache] = await Promise.all([
      this.checkDatabase(),
      this.checkCache()
    ])
    
    const checks = { database, cache }
    const ready = Object.values(checks).every(c => c.status === 'healthy')
    
    return { ready, checks }
  }

  async getLivenessCheck(): Promise<{ alive: boolean; timestamp: string }> {
    // Liveness check - basic check if service is responsive
    return {
      alive: true,
      timestamp: new Date().toISOString()
    }
  }
}

// Create singleton instance
const healthService = new HealthService()

export default healthService
