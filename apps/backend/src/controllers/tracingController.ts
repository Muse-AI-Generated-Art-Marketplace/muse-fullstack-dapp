import { Request, Response } from 'express'
import tracingService from '@/services/tracingService'
import { createLogger } from '@/utils/logger'
import { ApiResponse } from '@/types'

const logger = createLogger('TracingController')

export const getTrace = async (req: Request, res: Response) => {
  try {
    const { traceId } = req.params
    
    if (!traceId) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'INVALID_REQUEST',
          message: 'Trace ID is required',
          userMessage: 'Please provide a trace ID',
          statusCode: 400
        }
      }
      return res.status(400).json(response)
    }

    const trace = await tracingService.getTrace(traceId)
    
    const response: ApiResponse = {
      success: true,
      data: {
        traceId,
        spans: trace,
        spanCount: trace.length,
        totalDuration: trace.length > 0 ? Math.max(...trace.map(s => s.duration || 0)) : 0
      }
    }
    
    res.json(response)
  } catch (error) {
    logger.error('Error getting trace:', error)
    
    const response: ApiResponse = {
      success: false,
      error: {
        code: 'TRACE_ERROR',
        message: 'Error retrieving trace',
        userMessage: 'Unable to retrieve trace information',
        statusCode: 500
      }
    }
    
    res.status(500).json(response)
  }
}

export const searchTraces = async (req: Request, res: Response) => {
  try {
    const {
      service,
      operationName,
      status,
      startTime,
      endTime,
      minDuration,
      maxDuration,
      limit = 100,
      offset = 0
    } = req.query

    const filter: any = {}
    
    if (service) filter.service = service as string
    if (operationName) filter.operationName = operationName as string
    if (status) filter.status = status as string
    if (startTime) filter.startTime = parseInt(startTime as string)
    if (endTime) filter.endTime = parseInt(endTime as string)
    if (minDuration) filter.minDuration = parseInt(minDuration as string)
    if (maxDuration) filter.maxDuration = parseInt(maxDuration as string)

    const traces = await tracingService.searchTraces(
      filter,
      parseInt(limit as string),
      parseInt(offset as string)
    )
    
    const response: ApiResponse = {
      success: true,
      data: {
        traces,
        pagination: {
          limit: parseInt(limit as string),
          offset: parseInt(offset as string),
          total: traces.length
        }
      }
    }
    
    res.json(response)
  } catch (error) {
    logger.error('Error searching traces:', error)
    
    const response: ApiResponse = {
      success: false,
      error: {
        code: 'SEARCH_ERROR',
        message: 'Error searching traces',
        userMessage: 'Unable to search traces',
        statusCode: 500
      }
    }
    
    res.status(500).json(response)
  }
}

export const getMetrics = async (req: Request, res: Response) => {
  try {
    const {
      service,
      operationName,
      status,
      startTime,
      endTime
    } = req.query

    const filter: any = {}
    
    if (service) filter.service = service as string
    if (operationName) filter.operationName = operationName as string
    if (status) filter.status = status as string
    if (startTime) filter.startTime = parseInt(startTime as string)
    if (endTime) filter.endTime = parseInt(endTime as string)

    const metrics = await tracingService.getMetrics(filter)
    
    const response: ApiResponse = {
      success: true,
      data: metrics
    }
    
    res.json(response)
  } catch (error) {
    logger.error('Error getting metrics:', error)
    
    const response: ApiResponse = {
      success: false,
      error: {
        code: 'METRICS_ERROR',
        message: 'Error retrieving metrics',
        userMessage: 'Unable to retrieve trace metrics',
        statusCode: 500
      }
    }
    
    res.status(500).json(response)
  }
}

export const getServiceMap = async (req: Request, res: Response) => {
  try {
    const serviceMap = await tracingService.getServiceMap()
    
    const response: ApiResponse = {
      success: true,
      data: serviceMap
    }
    
    res.json(response)
  } catch (error) {
    logger.error('Error getting service map:', error)
    
    const response: ApiResponse = {
      success: false,
      error: {
        code: 'SERVICE_MAP_ERROR',
        message: 'Error retrieving service map',
        userMessage: 'Unable to retrieve service map',
        statusCode: 500
      }
    }
    
    res.status(500).json(response)
  }
}

export const getTraceVisualization = async (req: Request, res: Response) => {
  try {
    const { traceId } = req.params
    
    if (!traceId) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'INVALID_REQUEST',
          message: 'Trace ID is required',
          userMessage: 'Please provide a trace ID',
          statusCode: 400
        }
      }
      return res.status(400).json(response)
    }

    const trace = await tracingService.getTrace(traceId)
    
    // Create visualization data
    const visualization = {
      traceId,
      spans: trace.map(span => ({
        id: span.spanId,
        parentId: span.parentSpanId,
        name: span.operationName,
        service: span.service,
        startTime: span.startTime,
        endTime: span.endTime,
        duration: span.duration,
        status: span.status,
        tags: span.tags,
        logs: span.logs,
        error: span.error
      })),
      timeline: {
        start: Math.min(...trace.map(s => s.startTime)),
        end: Math.max(...trace.map(s => s.endTime || s.startTime)),
        totalDuration: Math.max(...trace.map(s => s.duration || 0))
      },
      services: [...new Set(trace.map(s => s.service))],
      operations: [...new Set(trace.map(s => s.operationName))]
    }
    
    const response: ApiResponse = {
      success: true,
      data: visualization
    }
    
    res.json(response)
  } catch (error) {
    logger.error('Error getting trace visualization:', error)
    
    const response: ApiResponse = {
      success: false,
      error: {
        code: 'VISUALIZATION_ERROR',
        message: 'Error creating trace visualization',
        userMessage: 'Unable to create trace visualization',
        statusCode: 500
      }
    }
    
    res.status(500).json(response)
  }
}

export const getPerformanceReport = async (req: Request, res: Response) => {
  try {
    const { timeRange = '1h' } = req.query
    
    // Calculate time range
    const now = Date.now()
    let startTime: number
    
    switch (timeRange) {
      case '1h':
        startTime = now - 60 * 60 * 1000
        break
      case '24h':
        startTime = now - 24 * 60 * 60 * 1000
        break
      case '7d':
        startTime = now - 7 * 24 * 60 * 60 * 1000
        break
      default:
        startTime = now - 60 * 60 * 1000
    }

    const metrics = await tracingService.getMetrics({
      startTime,
      endTime: now
    })

    const serviceMap = await tracingService.getServiceMap()
    
    const report = {
      timeRange,
      period: {
        start: new Date(startTime).toISOString(),
        end: new Date(now).toISOString()
      },
      summary: {
        totalRequests: metrics.totalSpans,
        errorRate: metrics.errorRate,
        averageResponseTime: metrics.averageDuration,
        p95ResponseTime: metrics.p95Duration,
        p99ResponseTime: metrics.p99Duration
      },
      operations: metrics.operations,
      services: serviceMap.services,
      topErrors: [], // Would be populated with actual error analysis
      recommendations: generateRecommendations(metrics)
    }
    
    const response: ApiResponse = {
      success: true,
      data: report
    }
    
    res.json(response)
  } catch (error) {
    logger.error('Error generating performance report:', error)
    
    const response: ApiResponse = {
      success: false,
      error: {
        code: 'REPORT_ERROR',
        message: 'Error generating performance report',
        userMessage: 'Unable to generate performance report',
        statusCode: 500
      }
    }
    
    res.status(500).json(response)
  }
}

// Admin endpoints
export const cleanupTraces = async (req: Request, res: Response) => {
  try {
    const { maxAge } = req.body
    
    tracingService.cleanup(maxAge)
    
    const response: ApiResponse = {
      success: true,
      message: 'Trace cleanup completed'
    }
    
    res.json(response)
  } catch (error) {
    logger.error('Error cleaning up traces:', error)
    
    const response: ApiResponse = {
      success: false,
      error: {
        code: 'CLEANUP_ERROR',
        message: 'Error cleaning up traces',
        userMessage: 'Unable to clean up traces',
        statusCode: 500
      }
    }
    
    res.status(500).json(response)
  }
}

// Helper function to generate performance recommendations
const generateRecommendations = (metrics: any): string[] => {
  const recommendations: string[] = []
  
  if (metrics.errorRate > 5) {
    recommendations.push('High error rate detected. Consider implementing better error handling and retry logic.')
  }
  
  if (metrics.averageDuration > 1000) {
    recommendations.push('Average response time is high. Consider optimizing slow operations or implementing caching.')
  }
  
  if (metrics.p95Duration > 2000) {
    recommendations.push('P95 response time is high. Some requests are taking much longer than average.')
  }
  
  // Find slowest operations
  const slowOps = Object.entries(metrics.operations)
    .filter(([_, data]: [string, any]) => data.avgDuration > 1000)
    .map(([name, data]: [string, any]) => ({ name, avgDuration: data.avgDuration }))
    .sort((a, b) => b.avgDuration - a.avgDuration)
  
  if (slowOps.length > 0) {
    recommendations.push(`Consider optimizing slow operations: ${slowOps.slice(0, 3).map(op => op.name).join(', ')}`)
  }
  
  return recommendations
}

export default {
  getTrace,
  searchTraces,
  getMetrics,
  getServiceMap,
  getTraceVisualization,
  getPerformanceReport,
  cleanupTraces
}
