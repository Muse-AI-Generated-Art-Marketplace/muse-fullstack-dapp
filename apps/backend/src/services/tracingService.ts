import { randomUUID } from 'crypto'
import cacheService from './cacheService'
import { createLogger } from '@/utils/logger'

const logger = createLogger('TracingService')

export interface TraceSpan {
  traceId: string
  spanId: string
  parentSpanId?: string
  operationName: string
  startTime: number
  endTime?: number
  duration?: number
  status: 'pending' | 'success' | 'error'
  tags: Record<string, any>
  logs: TraceLog[]
  service: string
  resource?: string
  error?: TraceError
}

export interface TraceLog {
  timestamp: number
  level: 'debug' | 'info' | 'warn' | 'error'
  message: string
  fields?: Record<string, any>
}

export interface TraceError {
  type: string
  message: string
  stack?: string
}

export interface TraceContext {
  traceId: string
  spanId: string
  baggage: Record<string, string>
}

export interface TraceFilter {
  service?: string
  operationName?: string
  status?: string
  startTime?: number
  endTime?: number
  minDuration?: number
  maxDuration?: number
  tags?: Record<string, any>
}

export interface TraceMetrics {
  totalSpans: number
  errorRate: number
  averageDuration: number
  p95Duration: number
  p99Duration: number
  operations: Record<string, {
    count: number
    errors: number
    avgDuration: number
  }>
}

class TracingService {
  private activeSpans: Map<string, TraceSpan> = new Map()
  private completedSpans: TraceSpan[] = []
  private maxCompletedSpans: number = 10000
  private serviceName: string = 'muse-backend'

  constructor() {
    this.serviceName = process.env.SERVICE_NAME || 'muse-backend'
  }

  // Start a new trace span
  startSpan(operationName: string, parentSpanId?: string, tags: Record<string, any> = {}): TraceSpan {
    const traceId = parentSpanId ? this.getTraceIdFromSpan(parentSpanId) : randomUUID()
    const spanId = randomUUID()

    const span: TraceSpan = {
      traceId,
      spanId,
      parentSpanId,
      operationName,
      startTime: Date.now(),
      status: 'pending',
      tags: {
        service: this.serviceName,
        ...tags
      },
      logs: [],
      service: this.serviceName
    }

    this.activeSpans.set(spanId, span)
    
    logger.debug(`Started span: ${operationName}`, { traceId, spanId, parentSpanId })
    
    return span
  }

  // Finish a trace span
  finishSpan(spanId: string, status: 'success' | 'error' = 'success', error?: TraceError): void {
    const span = this.activeSpans.get(spanId)
    if (!span) {
      logger.warn(`Attempted to finish non-existent span: ${spanId}`)
      return
    }

    span.endTime = Date.now()
    span.duration = span.endTime - span.startTime
    span.status = status

    if (error) {
      span.error = error
    }

    // Move from active to completed
    this.activeSpans.delete(spanId)
    this.addToCompletedSpans(span)

    // Store in cache for persistence
    this.storeSpanInCache(span)

    logger.debug(`Finished span: ${span.operationName}`, {
      traceId: span.traceId,
      spanId: span.spanId,
      duration: span.duration,
      status
    })
  }

  // Add a log entry to a span
  addLog(spanId: string, level: 'debug' | 'info' | 'warn' | 'error', message: string, fields?: Record<string, any>): void {
    const span = this.activeSpans.get(spanId)
    if (!span) {
      logger.warn(`Attempted to add log to non-existent span: ${spanId}`)
      return
    }

    span.logs.push({
      timestamp: Date.now(),
      level,
      message,
      fields
    })
  }

  // Add tags to a span
  addTags(spanId: string, tags: Record<string, any>): void {
    const span = this.activeSpans.get(spanId)
    if (!span) {
      logger.warn(`Attempted to add tags to non-existent span: ${spanId}`)
      return
    }

    Object.assign(span.tags, tags)
  }

  // Set resource for a span
  setResource(spanId: string, resource: string): void {
    const span = this.activeSpans.get(spanId)
    if (!span) {
      logger.warn(`Attempted to set resource for non-existent span: ${spanId}`)
      return
    }

    span.resource = resource
  }

  // Get trace by ID
  async getTrace(traceId: string): Promise<TraceSpan[]> {
    const spans: TraceSpan[] = []
    
    // Check active spans
    for (const span of this.activeSpans.values()) {
      if (span.traceId === traceId) {
        spans.push(span)
      }
    }

    // Check completed spans
    for (const span of this.completedSpans) {
      if (span.traceId === traceId) {
        spans.push(span)
      }
    }

    // Check cache for additional spans
    const cacheKey = `trace:${traceId}`
    const cachedSpans = await cacheService.get<TraceSpan[]>(cacheKey)
    if (cachedSpans) {
      spans.push(...cachedSpans)
    }

    return spans.sort((a, b) => a.startTime - b.startTime)
  }

  // Search traces with filters
  async searchTraces(filter: TraceFilter, limit: number = 100, offset: number = 0): Promise<TraceSpan[]> {
    let results: TraceSpan[] = []

    // Search in completed spans
    results = this.completedSpans.filter(span => this.matchesFilter(span, filter))

    // TODO: Search in persistent storage if implemented

    // Sort by start time descending
    results.sort((a, b) => b.startTime - a.startTime)

    // Apply pagination
    return results.slice(offset, offset + limit)
  }

  // Get trace metrics
  async getMetrics(filter?: TraceFilter): Promise<TraceMetrics> {
    let spans = this.completedSpans

    if (filter) {
      spans = spans.filter(span => this.matchesFilter(span, filter))
    }

    if (spans.length === 0) {
      return {
        totalSpans: 0,
        errorRate: 0,
        averageDuration: 0,
        p95Duration: 0,
        p99Duration: 0,
        operations: {}
      }
    }

    const durations = spans.map(span => span.duration || 0).sort((a, b) => a - b)
    const errorCount = spans.filter(span => span.status === 'error').length

    // Calculate operation-level metrics
    const operations: Record<string, { count: number; errors: number; avgDuration: number }> = {}
    for (const span of spans) {
      const op = span.operationName
      if (!operations[op]) {
        operations[op] = { count: 0, errors: 0, avgDuration: 0 }
      }
      operations[op].count++
      if (span.status === 'error') {
        operations[op].errors++
      }
    }

    // Calculate average durations per operation
    for (const op of Object.keys(operations)) {
      const opSpans = spans.filter(span => span.operationName === op)
      const totalDuration = opSpans.reduce((sum, span) => sum + (span.duration || 0), 0)
      operations[op].avgDuration = totalDuration / opSpans.length
    }

    return {
      totalSpans: spans.length,
      errorRate: (errorCount / spans.length) * 100,
      averageDuration: durations.reduce((sum, d) => sum + d, 0) / durations.length,
      p95Duration: durations[Math.floor(durations.length * 0.95)] || 0,
      p99Duration: durations[Math.floor(durations.length * 0.99)] || 0,
      operations
    }
  }

  // Get service map for visualization
  async getServiceMap(): Promise<{
    services: Record<string, { name: string; spanCount: number; errorRate: number }>
    connections: Array<{ from: string; to: string; count: number }>
  }> {
    const services: Record<string, { name: string; spanCount: number; errorRate: number }> = {}
    const connections: Array<{ from: string; to: string; count: number }> = []

    // Analyze completed spans
    for (const span of this.completedSpans) {
      const serviceName = span.service
      
      if (!services[serviceName]) {
        services[serviceName] = { name: serviceName, spanCount: 0, errorRate: 0 }
      }
      services[serviceName].spanCount++
      
      if (span.status === 'error') {
        services[serviceName].errorRate++
      }
    }

    // Calculate error rates
    for (const service of Object.values(services)) {
      if (service.spanCount > 0) {
        service.errorRate = (service.errorRate / service.spanCount) * 100
      }
    }

    // Analyze connections (parent-child relationships)
    const connectionMap = new Map<string, number>()
    for (const span of this.completedSpans) {
      if (span.parentSpanId) {
        const parentSpan = this.findSpanById(span.parentSpanId)
        if (parentSpan && parentSpan.service !== span.service) {
          const key = `${parentSpan.service}->${span.service}`
          connectionMap.set(key, (connectionMap.get(key) || 0) + 1)
        }
      }
    }

    for (const [key, count] of connectionMap) {
      const [from, to] = key.split('->')
      connections.push({ from, to, count })
    }

    return { services, connections }
  }

  // Clean up old traces
  cleanup(maxAge: number = 24 * 60 * 60 * 1000): void {
    const cutoff = Date.now() - maxAge
    const originalLength = this.completedSpans.length
    
    this.completedSpans = this.completedSpans.filter(span => span.startTime > cutoff)
    
    const cleaned = originalLength - this.completedSpans.length
    if (cleaned > 0) {
      logger.info(`Cleaned up ${cleaned} old traces`)
    }
  }

  // Private helper methods
  private getTraceIdFromSpan(spanId: string): string {
    const span = this.activeSpans.get(spanId) || this.findSpanById(spanId)
    return span?.traceId || randomUUID()
  }

  private findSpanById(spanId: string): TraceSpan | undefined {
    return this.activeSpans.get(spanId) || 
           this.completedSpans.find(span => span.spanId === spanId)
  }

  private matchesFilter(span: TraceSpan, filter: TraceFilter): boolean {
    if (filter.service && span.service !== filter.service) return false
    if (filter.operationName && span.operationName !== filter.operationName) return false
    if (filter.status && span.status !== filter.status) return false
    if (filter.startTime && span.startTime < filter.startTime) return false
    if (filter.endTime && span.startTime > filter.endTime) return false
    if (filter.minDuration && (span.duration || 0) < filter.minDuration) return false
    if (filter.maxDuration && (span.duration || 0) > filter.maxDuration) return false
    
    if (filter.tags) {
      for (const [key, value] of Object.entries(filter.tags)) {
        if (span.tags[key] !== value) return false
      }
    }

    return true
  }

  private addToCompletedSpans(span: TraceSpan): void {
    this.completedSpans.push(span)
    
    // Keep only the most recent spans
    if (this.completedSpans.length > this.maxCompletedSpans) {
      this.completedSpans = this.completedSpans.slice(-this.maxCompletedSpans)
    }
  }

  private async storeSpanInCache(span: TraceSpan): Promise<void> {
    const traceKey = `trace:${span.traceId}`
    const existingSpans = await cacheService.get<TraceSpan[]>(traceKey) || []
    
    // Add this span to the trace
    existingSpans.push(span)
    
    // Store with TTL (24 hours)
    await cacheService.set(traceKey, existingSpans, 86400)
  }
}

// Create singleton instance
const tracingService = new TracingService()

export default tracingService
export { TracingService }
