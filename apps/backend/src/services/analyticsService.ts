import { 
  ApiRequestAnalytics, 
  HourlyAnalytics, 
  DailyAnalytics, 
  ErrorAnalytics, 
  PerformanceMetrics,
  IApiRequestAnalytics,
  IErrorAnalytics,
  IPerformanceMetrics
} from '@/models/analytics'
import { createLogger } from '@/utils/logger'
import moment from 'moment'
import _ from 'lodash'

const logger = createLogger('AnalyticsService')

export interface RequestAnalyticsData {
  timestamp: Date
  method: string
  endpoint: string
  statusCode: number
  responseTime: number
  requestSize?: number
  responseSize?: number
  ip: string
  userAgent?: string
  referer?: string
  userId?: string
  traceId?: string
  error?: string
}

export interface ErrorAnalyticsData {
  timestamp: Date
  errorType: string
  errorMessage: string
  stack?: string
  endpoint: string
  method: string
  statusCode: number
  userId?: string
  ip: string
  userAgent?: string
  traceId?: string
  context?: Record<string, any>
}

class AnalyticsService {
  private performanceMonitoringInterval?: ReturnType<typeof setInterval>
  private isPerformanceMonitoring = false

  // Record individual API request
  async recordRequest(data: RequestAnalyticsData): Promise<void> {
    try {
      const analytics = new ApiRequestAnalytics(data)
      await analytics.save()
      
      logger.debug('API request analytics recorded', {
        method: data.method,
        endpoint: data.endpoint,
        statusCode: data.statusCode,
        responseTime: data.responseTime
      })
    } catch (error: any) {
      logger.error('Failed to record API request analytics', {
        error: error.message,
        method: data.method,
        endpoint: data.endpoint
      })
    }
  }

  // Record error details
  async recordError(data: ErrorAnalyticsData): Promise<void> {
    try {
      const errorAnalytics = new ErrorAnalytics(data)
      await errorAnalytics.save()
      
      logger.debug('Error analytics recorded', {
        errorType: data.errorType,
        endpoint: data.endpoint,
        statusCode: data.statusCode
      })
    } catch (error: any) {
      logger.error('Failed to record error analytics', {
        error: error.message,
        errorType: data.errorType,
        endpoint: data.endpoint
      })
    }
  }

  // Record performance metrics
  async recordPerformanceMetric(metricType: 'cpu' | 'memory' | 'disk' | 'network', value: number, unit: string, tags?: Record<string, string>): Promise<void> {
    try {
      const metric = new PerformanceMetrics({
        timestamp: new Date(),
        metricType,
        value,
        unit,
        tags
      })
      await metric.save()
    } catch (error: any) {
      logger.error('Failed to record performance metric', {
        error: error.message,
        metricType,
        value
      })
    }
  }

  // Aggregate hourly analytics
  async aggregateHourlyAnalytics(hour: Date): Promise<void> {
    try {
      const hourStart = moment(hour).startOf('hour').toDate()
      const hourEnd = moment(hour).endOf('hour').toDate()

      // Get all requests for the hour
      const requests = await ApiRequestAnalytics.find({
        timestamp: { $gte: hourStart, $lt: hourEnd }
      })

      if (requests.length === 0) {
        logger.debug('No requests found for hourly aggregation', { hour: hourStart })
        return
      }

      // Group by endpoint and method
      const groupedRequests = _.groupBy(requests, (req: IApiRequestAnalytics) => `${req.method}:${req.endpoint}`)

      for (const [key, reqs] of Object.entries(groupedRequests)) {
        const [method, endpoint] = key.split(':')
        const typedReqs = reqs as IApiRequestAnalytics[]
        
        const responseTimes = typedReqs.map((req: IApiRequestAnalytics) => req.responseTime).sort((a: number, b: number) => a - b)
        const successRequests = typedReqs.filter((req: IApiRequestAnalytics) => req.statusCode < 400)
        const errorRequests = typedReqs.filter((req: IApiRequestAnalytics) => req.statusCode >= 400)
        
        // Calculate percentiles
        const p95Index = Math.floor(responseTimes.length * 0.95)
        const p99Index = Math.floor(responseTimes.length * 0.99)
        
        const uniqueUsers = new Set(typedReqs.filter((req: IApiRequestAnalytics) => req.userId).map((req: IApiRequestAnalytics) => req.userId)).size
        const uniqueIPs = new Set(typedReqs.map((req: IApiRequestAnalytics) => req.ip)).size

        const hourlyAnalytics = {
          hour: hourStart,
          method,
          endpoint,
          totalRequests: reqs.length,
          successRequests: successRequests.length,
          errorRequests: errorRequests.length,
          averageResponseTime: _.mean(responseTimes),
          minResponseTime: _.min(responseTimes) || 0,
          maxResponseTime: _.max(responseTimes) || 0,
          p95ResponseTime: responseTimes[p95Index] || 0,
          p99ResponseTime: responseTimes[p99Index] || 0,
          totalRequestSize: _.sum(typedReqs.map((req: IApiRequestAnalytics) => req.requestSize || 0)),
          totalResponseSize: _.sum(typedReqs.map((req: IApiRequestAnalytics) => req.responseSize || 0)),
          uniqueUsers,
          uniqueIPs,
          errorRate: (errorRequests.length / reqs.length) * 100
        }

        // Upsert hourly analytics
        await HourlyAnalytics.findOneAndUpdate(
          { hour: hourStart, method, endpoint },
          hourlyAnalytics,
          { upsert: true, new: true }
        )
      }

      logger.info('Hourly analytics aggregation completed', { 
        hour: hourStart,
        totalRequests: requests.length,
        endpoints: Object.keys(groupedRequests).length
      })
    } catch (error: any) {
      logger.error('Failed to aggregate hourly analytics', {
        error: error.message,
        hour
      })
    }
  }

  // Aggregate daily analytics
  async aggregateDailyAnalytics(date: Date): Promise<void> {
    try {
      const dateStart = moment(date).startOf('day').toDate()
      const dateEnd = moment(date).endOf('day').toDate()

      // Get all hourly analytics for the day
      const hourlyData = await HourlyAnalytics.find({
        hour: { $gte: dateStart, $lt: dateEnd }
      })

      if (hourlyData.length === 0) {
        logger.debug('No hourly data found for daily aggregation', { date: dateStart })
        return
      }

      // Get all requests for the day
      const requests = await ApiRequestAnalytics.find({
        timestamp: { $gte: dateStart, $lt: dateEnd }
      })

      const totalRequests = requests.length
      const successRequests = requests.filter(req => req.statusCode < 400).length
      const errorRequests = requests.filter(req => req.statusCode >= 400).length
      const averageResponseTime = _.mean(requests.map(req => req.responseTime))
      const uniqueUsers = new Set(requests.filter(req => req.userId).map(req => req.userId)).size
      const uniqueIPs = new Set(requests.map(req => req.ip)).size

      // Calculate top endpoints
      const endpointStats = _.groupBy(requests, req => `${req.method}:${req.endpoint}`)
      const topEndpoints = Object.entries(endpointStats)
        .map(([key, reqs]) => {
          const typedReqs = reqs as IApiRequestAnalytics[]
          return {
            endpoint: key,
            requests: typedReqs.length,
            averageResponseTime: _.mean(typedReqs.map((req: IApiRequestAnalytics) => req.responseTime))
          }
        })
        .sort((a, b) => b.requests - a.requests)
        .slice(0, 10)

      // Calculate top errors
      const errorStats = requests.filter(req => req.statusCode >= 400)
      const errorGroups = _.groupBy(errorStats, (req: IApiRequestAnalytics) => req.error || `HTTP ${req.statusCode}`)
      const topErrors = Object.entries(errorGroups)
        .map(([error, reqs]) => {
          const typedReqs = reqs as IApiRequestAnalytics[]
          return {
            error,
            count: typedReqs.length,
            endpoint: typedReqs[0].endpoint
          }
        })
        .sort((a, b) => b.count - a.count)
        .slice(0, 10)

      // Calculate traffic by hour
      const trafficByHour = Array.from({ length: 24 }, (_, hour) => {
        const hourStart = moment(dateStart).add(hour, 'hours').toDate()
        const hourEnd = moment(hourStart).add(1, 'hour').toDate()
        const hourRequests = requests.filter(req => 
          req.timestamp >= hourStart && req.timestamp < hourEnd
        )
        return {
          hour,
          requests: hourRequests.length
        }
      })

      const dailyAnalytics = {
        date: dateStart,
        totalRequests,
        successRequests,
        errorRequests,
        averageResponseTime,
        uniqueUsers,
        uniqueIPs,
        topEndpoints,
        topErrors,
        trafficByHour
      }

      // Upsert daily analytics
      await DailyAnalytics.findOneAndUpdate(
        { date: dateStart },
        dailyAnalytics,
        { upsert: true, new: true }
      )

      logger.info('Daily analytics aggregation completed', {
        date: dateStart,
        totalRequests,
        topEndpoints: topEndpoints.length,
        topErrors: topErrors.length
      })
    } catch (error: any) {
      logger.error('Failed to aggregate daily analytics', {
        error: error.message,
        date
      })
    }
  }

  // Get real-time metrics
  async getRealTimeMetrics(timeRange: '1h' | '6h' | '24h' = '1h'): Promise<any> {
    try {
      const now = new Date()
      let startTime: Date

      switch (timeRange) {
        case '1h':
          startTime = new Date(now.getTime() - 60 * 60 * 1000)
          break
        case '6h':
          startTime = new Date(now.getTime() - 6 * 60 * 60 * 1000)
          break
        case '24h':
          startTime = new Date(now.getTime() - 24 * 60 * 60 * 1000)
          break
      }

      const requests = await ApiRequestAnalytics.find({
        timestamp: { $gte: startTime }
      })

      const totalRequests = requests.length
      const successRequests = requests.filter(req => req.statusCode < 400).length
      const errorRequests = requests.filter(req => req.statusCode >= 400).length
      const averageResponseTime = requests.length > 0 ? _.mean(requests.map(req => req.responseTime)) : 0
      const errorRate = totalRequests > 0 ? (errorRequests / totalRequests) * 100 : 0

      // Get top endpoints
      const endpointStats = _.groupBy(requests, req => `${req.method}:${req.endpoint}`)
      const topEndpoints = Object.entries(endpointStats)
        .map(([key, reqs]) => {
          const typedReqs = reqs as IApiRequestAnalytics[]
          return {
            endpoint: key,
            requests: typedReqs.length,
            averageResponseTime: _.mean(typedReqs.map((req: IApiRequestAnalytics) => req.responseTime)),
            errorRate: (typedReqs.filter((req: IApiRequestAnalytics) => req.statusCode >= 400).length / typedReqs.length) * 100
          }
        })
        .sort((a, b) => b.requests - a.requests)
        .slice(0, 10)

      // Get recent errors
      const recentErrors = await ErrorAnalytics.find({
        timestamp: { $gte: startTime }
      })
      .sort({ timestamp: -1 })
      .limit(10)

      return {
        timeRange,
        totalRequests,
        successRequests,
        errorRequests,
        averageResponseTime: Math.round(averageResponseTime),
        errorRate: Math.round(errorRate * 100) / 100,
        topEndpoints,
        recentErrors
      }
    } catch (error: any) {
      logger.error('Failed to get real-time metrics', { error: error.message })
      throw error
    }
  }

  // Start performance monitoring
  async startPerformanceMonitoring(interval: number = 60000): Promise<void> {
    if (this.isPerformanceMonitoring) {
      return
    }

    this.isPerformanceMonitoring = true
    logger.info('Starting performance monitoring', { interval })

    this.performanceMonitoringInterval = setInterval(async () => {
      try {
        // CPU usage
        const cpuUsage = process.cpuUsage()
        await this.recordPerformanceMetric('cpu', cpuUsage.user + cpuUsage.system, 'microseconds')

        // Memory usage
        const memoryUsage = process.memoryUsage()
        await this.recordPerformanceMetric('memory', memoryUsage.heapUsed, 'bytes')
        await this.recordPerformanceMetric('memory', memoryUsage.heapTotal, 'bytes')
        await this.recordPerformanceMetric('memory', memoryUsage.rss, 'bytes')

        // System load
        const loadAvg = require('os').loadavg()
        await this.recordPerformanceMetric('cpu', loadAvg[0], 'load_average_1m')
        await this.recordPerformanceMetric('cpu', loadAvg[1], 'load_average_5m')
        await this.recordPerformanceMetric('cpu', loadAvg[2], 'load_average_15m')

        // Free memory
        const freeMemory = require('os').freemem()
        const totalMemory = require('os').totalmem()
        await this.recordPerformanceMetric('memory', freeMemory, 'bytes')
        await this.recordPerformanceMetric('memory', totalMemory, 'bytes')

        logger.debug('Performance metrics recorded')
      } catch (error: any) {
        logger.error('Failed to record performance metrics', { error: error.message })
      }
    }, interval)
  }

  // Stop performance monitoring
  stopPerformanceMonitoring(): void {
    if (this.performanceMonitoringInterval) {
      clearInterval(this.performanceMonitoringInterval)
      this.performanceMonitoringInterval = undefined
      this.isPerformanceMonitoring = false
      logger.info('Performance monitoring stopped')
    }
  }

  // Cleanup old analytics data
  async cleanupOldData(retentionDays: number = 90): Promise<void> {
    try {
      const cutoffDate = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000)

      // Delete old request analytics
      const deletedRequests = await ApiRequestAnalytics.deleteMany({
        timestamp: { $lt: cutoffDate }
      })

      // Delete old error analytics
      const deletedErrors = await ErrorAnalytics.deleteMany({
        timestamp: { $lt: cutoffDate }
      })

      // Delete old performance metrics
      const deletedMetrics = await PerformanceMetrics.deleteMany({
        timestamp: { $lt: cutoffDate }
      })

      // Keep daily analytics longer (1 year)
      const dailyCutoffDate = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000)
      const deletedDaily = await DailyAnalytics.deleteMany({
        date: { $lt: dailyCutoffDate }
      })

      logger.info('Old analytics data cleaned up', {
        retentionDays,
        deletedRequests: deletedRequests.deletedCount,
        deletedErrors: deletedErrors.deletedCount,
        deletedMetrics: deletedMetrics.deletedCount,
        deletedDaily: deletedDaily.deletedCount
      })
    } catch (error: any) {
      logger.error('Failed to cleanup old analytics data', { error: error.message })
    }
  }
}

const analyticsService = new AnalyticsService()
export default analyticsService
