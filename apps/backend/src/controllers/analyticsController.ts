import { Request, Response } from 'express'
import analyticsService from '@/services/analyticsService'
import { createLogger } from '@/utils/logger'
import { DailyAnalytics, HourlyAnalytics, ErrorAnalytics, PerformanceMetrics } from '@/models/analytics'
import moment from 'moment'

const logger = createLogger('AnalyticsController')

// Get real-time metrics
export const getRealTimeMetrics = async (req: Request, res: Response) => {
  try {
    const { timeRange = '1h' } = req.query
    
    if (!['1h', '6h', '24h'].includes(timeRange as string)) {
      return res.status(400).json({
        error: 'Invalid time range. Must be one of: 1h, 6h, 24h'
      })
    }

    const metrics = await analyticsService.getRealTimeMetrics(timeRange as '1h' | '6h' | '24h')
    
    res.json({
      success: true,
      data: metrics
    })
  } catch (error: any) {
    logger.error('Failed to get real-time metrics', { error: error.message })
    res.status(500).json({
      error: 'Failed to retrieve real-time metrics',
      message: error.message
    })
  }
}

// Get daily analytics summary
export const getDailyAnalytics = async (req: Request, res: Response) => {
  try {
    const { startDate, endDate, limit = 30 } = req.query
    
    let query: any = {}
    
    if (startDate) {
      query.date = { ...query.date, $gte: new Date(startDate as string) }
    }
    
    if (endDate) {
      query.date = { ...query.date, $lte: new Date(endDate as string) }
    }
    
    const analytics = await DailyAnalytics
      .find(query)
      .sort({ date: -1 })
      .limit(parseInt(limit as string))
    
    res.json({
      success: true,
      data: analytics
    })
  } catch (error: any) {
    logger.error('Failed to get daily analytics', { error: error.message })
    res.status(500).json({
      error: 'Failed to retrieve daily analytics',
      message: error.message
    })
  }
}

// Get hourly analytics for a specific date range
export const getHourlyAnalytics = async (req: Request, res: Response) => {
  try {
    const { startDate, endDate, endpoint, method } = req.query
    
    let query: any = {}
    
    if (startDate) {
      query.hour = { ...query.hour, $gte: new Date(startDate as string) }
    }
    
    if (endDate) {
      query.hour = { ...query.hour, $lte: new Date(endDate as string) }
    }
    
    if (endpoint) {
      query.endpoint = endpoint
    }
    
    if (method) {
      query.method = method
    }
    
    const analytics = await HourlyAnalytics
      .find(query)
      .sort({ hour: -1 })
      .limit(168) // Last 7 days of hourly data
    
    res.json({
      success: true,
      data: analytics
    })
  } catch (error: any) {
    logger.error('Failed to get hourly analytics', { error: error.message })
    res.status(500).json({
      error: 'Failed to retrieve hourly analytics',
      message: error.message
    })
  }
}

// Get error analytics
export const getErrorAnalytics = async (req: Request, res: Response) => {
  try {
    const { startDate, endDate, errorType, limit = 50 } = req.query
    
    let query: any = {}
    
    if (startDate) {
      query.timestamp = { ...query.timestamp, $gte: new Date(startDate as string) }
    }
    
    if (endDate) {
      query.timestamp = { ...query.timestamp, $lte: new Date(endDate as string) }
    }
    
    if (errorType) {
      query.errorType = errorType
    }
    
    const errors = await ErrorAnalytics
      .find(query)
      .sort({ timestamp: -1 })
      .limit(parseInt(limit as string))
    
    res.json({
      success: true,
      data: errors
    })
  } catch (error: any) {
    logger.error('Failed to get error analytics', { error: error.message })
    res.status(500).json({
      error: 'Failed to retrieve error analytics',
      message: error.message
    })
  }
}

// Get performance metrics
export const getPerformanceMetrics = async (req: Request, res: Response) => {
  try {
    const { metricType, startDate, endDate, limit = 100 } = req.query
    
    let query: any = {}
    
    if (metricType) {
      query.metricType = metricType
    }
    
    if (startDate) {
      query.timestamp = { ...query.timestamp, $gte: new Date(startDate as string) }
    }
    
    if (endDate) {
      query.timestamp = { ...query.timestamp, $lte: new Date(endDate as string) }
    }
    
    const metrics = await PerformanceMetrics
      .find(query)
      .sort({ timestamp: -1 })
      .limit(parseInt(limit as string))
    
    res.json({
      success: true,
      data: metrics
    })
  } catch (error: any) {
    logger.error('Failed to get performance metrics', { error: error.message })
    res.status(500).json({
      error: 'Failed to retrieve performance metrics',
      message: error.message
    })
  }
}

// Get API usage statistics
export const getApiUsageStats = async (req: Request, res: Response) => {
  try {
    const { days = 7 } = req.query
    const startDate = moment().subtract(parseInt(days as string), 'days').toDate()
    
    // Get daily analytics for the specified period
    const dailyData = await DailyAnalytics.find({
      date: { $gte: startDate }
    }).sort({ date: 1 })
    
    // Aggregate statistics
    const totalRequests = dailyData.reduce((sum, day) => sum + day.totalRequests, 0)
    const totalErrors = dailyData.reduce((sum, day) => sum + day.errorRequests, 0)
    const totalUsers = dailyData.reduce((sum, day) => sum + day.uniqueUsers, 0)
    const averageResponseTime = dailyData.length > 0 
      ? dailyData.reduce((sum, day) => sum + day.averageResponseTime, 0) / dailyData.length 
      : 0
    
    // Get top endpoints across all days
    const endpointStats: Record<string, { requests: number; avgResponseTime: number }> = {}
    
    dailyData.forEach(day => {
      day.topEndpoints.forEach(endpoint => {
        if (!endpointStats[endpoint.endpoint]) {
          endpointStats[endpoint.endpoint] = { requests: 0, avgResponseTime: 0 }
        }
        endpointStats[endpoint.endpoint].requests += endpoint.requests
        endpointStats[endpoint.endpoint].avgResponseTime += endpoint.averageResponseTime
      })
    })
    
    // Calculate average response time for each endpoint
    Object.keys(endpointStats).forEach(endpoint => {
      const daysWithData = dailyData.filter(day => 
        day.topEndpoints.some(e => e.endpoint === endpoint)
      ).length
      endpointStats[endpoint].avgResponseTime /= daysWithData
    })
    
    const topEndpoints = Object.entries(endpointStats)
      .map(([endpoint, stats]) => ({
        endpoint,
        ...stats
      }))
      .sort((a, b) => b.requests - a.requests)
      .slice(0, 10)
    
    res.json({
      success: true,
      data: {
        period: `${days} days`,
        totalRequests,
        totalErrors,
        errorRate: totalRequests > 0 ? (totalErrors / totalRequests) * 100 : 0,
        totalUsers,
        averageResponseTime: Math.round(averageResponseTime),
        topEndpoints,
        dailyBreakdown: dailyData.map(day => ({
          date: day.date,
          requests: day.totalRequests,
          errors: day.errorRequests,
          users: day.uniqueUsers,
          avgResponseTime: Math.round(day.averageResponseTime)
        }))
      }
    })
  } catch (error: any) {
    logger.error('Failed to get API usage stats', { error: error.message })
    res.status(500).json({
      error: 'Failed to retrieve API usage statistics',
      message: error.message
    })
  }
}

// Trigger manual aggregation
export const triggerAggregation = async (req: Request, res: Response) => {
  try {
    const { type, date } = req.body
    
    if (!type || !['hourly', 'daily'].includes(type)) {
      return res.status(400).json({
        error: 'Invalid aggregation type. Must be one of: hourly, daily'
      })
    }
    
    const targetDate = date ? new Date(date) : new Date()
    
    if (type === 'hourly') {
      await analyticsService.aggregateHourlyAnalytics(targetDate)
    } else {
      await analyticsService.aggregateDailyAnalytics(targetDate)
    }
    
    res.json({
      success: true,
      message: `${type} aggregation completed for ${targetDate.toISOString()}`
    })
  } catch (error: any) {
    logger.error('Failed to trigger aggregation', { error: error.message })
    res.status(500).json({
      error: 'Failed to trigger aggregation',
      message: error.message
    })
  }
}

// Cleanup old data
export const cleanupOldData = async (req: Request, res: Response) => {
  try {
    const { retentionDays = 90 } = req.body
    
    await analyticsService.cleanupOldData(parseInt(retentionDays))
    
    res.json({
      success: true,
      message: `Cleaned up data older than ${retentionDays} days`
    })
  } catch (error: any) {
    logger.error('Failed to cleanup old data', { error: error.message })
    res.status(500).json({
      error: 'Failed to cleanup old data',
      message: error.message
    })
  }
}

// Get analytics health status
export const getAnalyticsHealth = async (req: Request, res: Response) => {
  try {
    const now = new Date()
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000)
    
    // Check if we have recent data
    const recentRequests = await DailyAnalytics.countDocuments({
      date: { $gte: oneHourAgo }
    })
    
    const recentErrors = await ErrorAnalytics.countDocuments({
      timestamp: { $gte: oneHourAgo }
    })
    
    const recentMetrics = await PerformanceMetrics.countDocuments({
      timestamp: { $gte: oneHourAgo }
    })
    
    const health = {
      status: 'healthy',
      timestamp: now,
      dataCollection: {
        requests: recentRequests > 0,
        errors: recentErrors >= 0,
        metrics: recentMetrics > 0
      },
      lastHour: {
        requests: recentRequests,
        errors: recentErrors,
        metrics: recentMetrics
      }
    }
    
    // Determine overall health
    if (recentRequests === 0) {
      health.status = 'warning'
    }
    
    res.json({
      success: true,
      data: health
    })
  } catch (error: any) {
    logger.error('Failed to get analytics health', { error: error.message })
    res.status(500).json({
      error: 'Failed to retrieve analytics health',
      message: error.message
    })
  }
}
