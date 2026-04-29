import { Request, Response, NextFunction } from 'express'
import tracingService from '@/services/tracingService'
import { createLogger } from '@/utils/logger'

const logger = createLogger('TracingMiddleware')

export interface TracingRequest extends Request {
  traceId?: string
  spanId?: string
}

// Extract trace context from headers
const extractTraceContext = (req: TracingRequest): { traceId?: string; parentSpanId?: string } => {
  const traceHeader = req.headers['x-trace-id'] as string
  const parentSpanHeader = req.headers['x-parent-span-id'] as string
  
  return {
    traceId: traceHeader,
    parentSpanId: parentSpanHeader
  }
}

// Distributed tracing middleware
export const tracingMiddleware = (options: {
  serviceName?: string
  excludePaths?: string[]
  includeHeaders?: boolean
  includeBody?: boolean
} = {}) => {
  const { serviceName, excludePaths = [], includeHeaders = false, includeBody = false } = options

  return (req: TracingRequest, res: Response, next: NextFunction) => {
    // Skip tracing for excluded paths
    if (excludePaths.some(path => req.path.startsWith(path))) {
      return next()
    }

    const { traceId, parentSpanId } = extractTraceContext(req)
    
    // Start a new span for this request
    const span = tracingService.startSpan(
      `${req.method} ${req.path}`,
      parentSpanId,
      {
        'http.method': req.method,
        'http.url': req.path,
        'http.user_agent': req.headers['user-agent'],
        'http.remote_addr': req.ip,
        'service.name': serviceName || 'muse-backend',
        'user.id': req.user?.publicKey
      }
    )

    // Set trace context on request
    req.traceId = span.traceId
    req.spanId = span.spanId

    // Set trace headers for downstream services
    res.set({
      'X-Trace-Id': span.traceId,
      'X-Parent-Span-Id': span.spanId
    })

    // Add request details to span
    if (includeHeaders) {
      tracingService.addTags(span.spanId, {
        'http.headers': JSON.stringify(req.headers)
      })
    }

    if (includeBody && req.body) {
      tracingService.addTags(span.spanId, {
        'http.body_size': JSON.stringify(req.body).length
      })
    }

    // Log request start
    tracingService.addLog(span.spanId, 'info', 'Request started', {
      method: req.method,
      url: req.path,
      userAgent: req.headers['user-agent'],
      ip: req.ip
    })

    // Override res.end to capture response
    const originalEnd = res.end
    res.end = function(this: Response, ...args: any[]) {
      // Add response details to span
      tracingService.addTags(span.spanId, {
        'http.status_code': res.statusCode,
        'http.response_size': res.get('content-length') || 0
      })

      // Log response
      tracingService.addLog(span.spanId, 'info', 'Request completed', {
        statusCode: res.statusCode,
        responseSize: res.get('content-length') || 0
      })

      // Finish the span
      const status = res.statusCode >= 400 ? 'error' : 'success'
      const error = res.statusCode >= 400 ? {
        type: 'HTTP_ERROR',
        message: `HTTP ${res.statusCode}`,
        stack: undefined
      } : undefined

      tracingService.finishSpan(span.spanId, status, error)

      // Call original end
      originalEnd.apply(this, args)
    }

    // Handle request errors
    res.on('error', (error) => {
      tracingService.addTags(span.spanId, {
        'error.type': error.constructor.name,
        'error.message': error.message
      })

      tracingService.addLog(span.spanId, 'error', 'Request error', {
        error: error.message
      })

      tracingService.finishSpan(span.spanId, 'error', {
        type: error.constructor.name,
        message: error.message,
        stack: error.stack
      })
    })

    next()
  }
}

// Function tracing decorator for manual tracing
export function traceFunction(operationName: string, tags: Record<string, any> = {}) {
  return function(target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value

    descriptor.value = async function(...args: any[]) {
      const span = tracingService.startSpan(operationName, undefined, {
        ...tags,
        'function.name': propertyName,
        'class.name': target.constructor.name
      })

      try {
        tracingService.addLog(span.spanId, 'info', 'Function execution started', {
          args: args.length
        })

        const result = await method.apply(this, args)

        tracingService.addTags(span.spanId, {
          'function.success': true
        })

        tracingService.addLog(span.spanId, 'info', 'Function execution completed')

        tracingService.finishSpan(span.spanId, 'success')

        return result
      } catch (error) {
        tracingService.addTags(span.spanId, {
          'function.success': false,
          'error.type': error.constructor.name,
          'error.message': error.message
        })

        tracingService.addLog(span.spanId, 'error', 'Function execution failed', {
          error: error.message
        })

        tracingService.finishSpan(span.spanId, 'error', {
          type: error.constructor.name,
          message: error.message,
          stack: error.stack
        })

        throw error
      }
    }

    return descriptor
  }
}

// Async function tracing utility
export async function traceAsync<T>(
  operationName: string,
  fn: () => Promise<T>,
  tags: Record<string, any> = {},
  parentSpanId?: string
): Promise<T> {
  const span = tracingService.startSpan(operationName, parentSpanId, tags)

  try {
    tracingService.addLog(span.spanId, 'info', 'Async operation started')

    const result = await fn()

    tracingService.addLog(span.spanId, 'info', 'Async operation completed')
    tracingService.finishSpan(span.spanId, 'success')

    return result
  } catch (error) {
    tracingService.addLog(span.spanId, 'error', 'Async operation failed', {
      error: error.message
    })

    tracingService.finishSpan(span.spanId, 'error', {
      type: error.constructor.name,
      message: error.message,
      stack: error.stack
    })

    throw error
  }
}

// Database query tracing
export const traceDatabaseQuery = (query: string, params?: any[]) => {
  return traceAsync(
    'database.query',
    async () => {
      // This would be implemented with actual database query execution
      logger.debug(`Executing database query: ${query}`, { params })
      return { rows: [], rowCount: 0 }
    },
    {
      'db.query': query,
      'db.params_count': params?.length || 0
    }
  )
}

// External service call tracing
export const traceExternalCall = (serviceName: string, operation: string) => {
  return traceAsync(
    `external.${serviceName}.${operation}`,
    async () => {
      // This would be implemented with actual external service call
      logger.debug(`Calling external service: ${serviceName}.${operation}`)
      return { success: true, data: {} }
    },
    {
      'external.service': serviceName,
      'external.operation': operation
    }
  )
}

// Custom tracing utilities
export const createCustomSpan = (operationName: string, parentSpanId?: string) => {
  const span = tracingService.startSpan(operationName, parentSpanId)
  
  return {
    span,
    addTag: (key: string, value: any) => tracingService.addTags(span.spanId, { [key]: value }),
    addLog: (level: 'debug' | 'info' | 'warn' | 'error', message: string, fields?: Record<string, any>) => 
      tracingService.addLog(span.spanId, level, message, fields),
    setResource: (resource: string) => tracingService.setResource(span.spanId, resource),
    finish: (status: 'success' | 'error' = 'success', error?: any) => 
      tracingService.finishSpan(span.spanId, status, error)
  }
}

export default tracingMiddleware
