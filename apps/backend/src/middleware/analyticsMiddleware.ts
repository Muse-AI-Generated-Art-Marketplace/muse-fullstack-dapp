import { Request, Response, NextFunction } from 'express'
import { v4 as uuidv4 } from 'uuid'
import { createLogger } from '@/utils/logger'
import analyticsService from '@/services/analyticsService'
import { TracingRequest } from './tracingMiddleware'

const logger = createLogger('AnalyticsMiddleware')

export interface AnalyticsRequest extends Request {
  analyticsId?: string
  startTime?: number
}

// Analytics middleware to track API calls, response times, and error rates
export const analyticsMiddleware = (options: {
  excludePaths?: string[]
  includeRequestBody?: boolean
  includeResponseBody?: boolean
  sampleRate?: number
} = {}) => {
  const { 
    excludePaths = ['/health', '/metrics', '/favicon.ico'],
    includeRequestBody = false,
    includeResponseBody = false,
    sampleRate = 1.0
  } = options

  return (req: AnalyticsRequest & TracingRequest, res: Response, next: NextFunction) => {
    // Skip analytics for excluded paths
    if (excludePaths.some(path => req.path.startsWith(path))) {
      return next()
    }

    // Sample requests to reduce overhead
    if (Math.random() > sampleRate) {
      return next()
    }

    // Generate unique analytics ID for this request
    req.analyticsId = uuidv4()
    req.startTime = Date.now()

    // Extract client information
    const clientInfo = {
      ip: req.ip || req.connection.remoteAddress || 'unknown',
      userAgent: req.headers['user-agent'] || 'unknown',
      referer: req.headers.referer || req.headers.referrer || 'unknown',
      userId: (req as any).user?.publicKey || (req as any).user?.id,
      traceId: req.traceId
    }

    // Log request start
    logger.debug('Analytics tracking started', {
      analyticsId: req.analyticsId,
      method: req.method,
      path: req.path,
      ip: clientInfo.ip,
      userAgent: clientInfo.userAgent
    })

    // Store request size
    let requestSize = 0
    if (req.headers['content-length']) {
      requestSize = parseInt(req.headers['content-length'], 10)
    } else if (req.body && includeRequestBody) {
      requestSize = JSON.stringify(req.body).length
    }

    // Override res.end to capture response metrics
    const originalEnd = res.end
    res.end = function(this: Response, ...args: any[]) {
      const endTime = Date.now()
      const responseTime = endTime - (req.startTime || endTime)

      // Extract response information
      const responseInfo = {
        statusCode: res.statusCode,
        responseSize: 0,
        error: undefined as string | undefined
      }

      // Calculate response size
      if (res.headers['content-length']) {
        responseInfo.responseSize = parseInt(res.headers['content-length'], 10)
      }

      // Check for errors
      if (res.statusCode >= 400) {
        responseInfo.error = `HTTP ${res.statusCode}`
        
        // Try to extract error message from response body
        if (args[0] && typeof args[0] === 'string') {
          try {
            const errorData = JSON.parse(args[0])
            if (errorData.message || errorData.error) {
              responseInfo.error = errorData.message || errorData.error
            }
          } catch (e) {
            // Ignore JSON parsing errors
          }
        }
      }

      // Prepare analytics data
      const analyticsData = {
        timestamp: new Date(),
        method: req.method,
        endpoint: req.path,
        statusCode: responseInfo.statusCode,
        responseTime,
        requestSize,
        responseSize: responseInfo.responseSize,
        ip: clientInfo.ip,
        userAgent: clientInfo.userAgent,
        referer: clientInfo.referer,
        userId: clientInfo.userId,
        traceId: clientInfo.traceId,
        error: responseInfo.error
      }

      // Store analytics data asynchronously
      analyticsService.recordRequest(analyticsData).catch(error => {
        logger.error('Failed to record analytics data', {
          analyticsId: req.analyticsId,
          error: error.message
        })
      })

      // Log completion
      logger.debug('Analytics tracking completed', {
        analyticsId: req.analyticsId,
        method: req.method,
        path: req.path,
        statusCode: responseInfo.statusCode,
        responseTime,
        responseSize: responseInfo.responseSize
      })

      // Call original end
      originalEnd.apply(this, args)
    }

    // Handle response errors
    res.on('error', (error) => {
      const endTime = Date.now()
      const responseTime = endTime - (req.startTime || endTime)

      const errorAnalyticsData = {
        timestamp: new Date(),
        method: req.method,
        endpoint: req.path,
        statusCode: 500,
        responseTime,
        requestSize,
        responseSize: 0,
        ip: clientInfo.ip,
        userAgent: clientInfo.userAgent,
        referer: clientInfo.referer,
        userId: clientInfo.userId,
        traceId: clientInfo.traceId,
        error: error.message
      }

      analyticsService.recordRequest(errorAnalyticsData).catch(err => {
        logger.error('Failed to record error analytics data', {
          analyticsId: req.analyticsId,
          error: err.message
        })
      })

      // Record detailed error information
      analyticsService.recordError({
        timestamp: new Date(),
        errorType: error.constructor.name,
        errorMessage: error.message,
        stack: error.stack,
        endpoint: req.path,
        method: req.method,
        statusCode: 500,
        userId: clientInfo.userId,
        ip: clientInfo.ip,
        userAgent: clientInfo.userAgent,
        traceId: clientInfo.traceId
      }).catch(err => {
        logger.error('Failed to record error details', {
          analyticsId: req.analyticsId,
          error: err.message
        })
      })
    })

    next()
  }
}

// Error analytics middleware
export const errorAnalyticsMiddleware = (error: Error, req: AnalyticsRequest & TracingRequest, res: Response, next: NextFunction) => {
  const clientInfo = {
    ip: req.ip || req.connection.remoteAddress || 'unknown',
    userAgent: req.headers['user-agent'] || 'unknown',
    userId: (req as any).user?.publicKey || (req as any).user?.id,
    traceId: req.traceId
  }

  // Record detailed error information
  analyticsService.recordError({
    timestamp: new Date(),
    errorType: error.constructor.name,
    errorMessage: error.message,
    stack: error.stack,
    endpoint: req.path,
    method: req.method,
    statusCode: res.statusCode || 500,
    userId: clientInfo.userId,
    ip: clientInfo.ip,
    userAgent: clientInfo.userAgent,
    traceId: clientInfo.traceId,
    context: {
      body: req.body,
      query: req.query,
      params: req.params,
      headers: req.headers
    }
  }).catch(err => {
    logger.error('Failed to record error analytics', {
      analyticsId: req.analyticsId,
      error: err.message
    })
  })

  // Log error
  logger.error('Request error recorded', {
    analyticsId: req.analyticsId,
    errorType: error.constructor.name,
    errorMessage: error.message,
    endpoint: req.path,
    method: req.method,
    userId: clientInfo.userId,
    ip: clientInfo.ip
  })

  next(error)
}

// Performance monitoring middleware
export const performanceMiddleware = (options: {
  interval?: number
  enabled?: boolean
} = {}) => {
  const { interval = 60000, enabled = true } = options

  if (!enabled) {
    return (req: Request, res: Response, next: NextFunction) => next()
  }

  return (req: Request, res: Response, next: NextFunction) => {
    // Start performance monitoring if not already running
    analyticsService.startPerformanceMonitoring(interval).catch(error => {
      logger.error('Failed to start performance monitoring', { error: error.message })
    })
    
    next()
  }
}

export default analyticsMiddleware
