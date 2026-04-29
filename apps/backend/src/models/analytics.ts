import mongoose, { Schema, Document } from 'mongoose'

// API Request Analytics
export interface IApiRequestAnalytics extends Document {
  timestamp: Date
  method: string
  endpoint: string
  statusCode: number
  responseTime: number
  userAgent?: string
  ip: string
  userId?: string
  traceId?: string
  error?: string
  requestSize?: number
  responseSize?: number
  userAgent?: string
  referer?: string
  country?: string
  city?: string
}

const ApiRequestAnalyticsSchema = new Schema<IApiRequestAnalytics>({
  timestamp: { type: Date, default: Date.now, index: true },
  method: { type: String, required: true, index: true },
  endpoint: { type: String, required: true, index: true },
  statusCode: { type: Number, required: true, index: true },
  responseTime: { type: Number, required: true },
  userAgent: { type: String },
  ip: { type: String, required: true, index: true },
  userId: { type: String, index: true },
  traceId: { type: String, index: true },
  error: { type: String },
  requestSize: { type: Number },
  responseSize: { type: Number },
  referer: { type: String },
  country: { type: String },
  city: { type: String }
}, {
  timestamps: true,
  collection: 'api_request_analytics'
})

// Hourly Analytics Aggregation
export interface IHourlyAnalytics extends Document {
  hour: Date
  endpoint: string
  method: string
  totalRequests: number
  successRequests: number
  errorRequests: number
  averageResponseTime: number
  minResponseTime: number
  maxResponseTime: number
  p95ResponseTime: number
  p99ResponseTime: number
  totalRequestSize: number
  totalResponseSize: number
  uniqueUsers: number
  uniqueIPs: number
  errorRate: number
}

const HourlyAnalyticsSchema = new Schema<IHourlyAnalytics>({
  hour: { type: Date, required: true, unique: true, index: true },
  endpoint: { type: String, required: true, index: true },
  method: { type: String, required: true, index: true },
  totalRequests: { type: Number, required: true, default: 0 },
  successRequests: { type: Number, required: true, default: 0 },
  errorRequests: { type: Number, required: true, default: 0 },
  averageResponseTime: { type: Number, required: true, default: 0 },
  minResponseTime: { type: Number, required: true },
  maxResponseTime: { type: Number, required: true },
  p95ResponseTime: { type: Number, required: true },
  p99ResponseTime: { type: Number, required: true },
  totalRequestSize: { type: Number, required: true, default: 0 },
  totalResponseSize: { type: Number, required: true, default: 0 },
  uniqueUsers: { type: Number, required: true, default: 0 },
  uniqueIPs: { type: Number, required: true, default: 0 },
  errorRate: { type: Number, required: true, default: 0 }
}, {
  timestamps: true,
  collection: 'hourly_analytics'
})

// Daily Analytics Summary
export interface IDailyAnalytics extends Document {
  date: Date
  totalRequests: number
  successRequests: number
  errorRequests: number
  averageResponseTime: number
  uniqueUsers: number
  uniqueIPs: number
  topEndpoints: Array<{
    endpoint: string
    requests: number
    averageResponseTime: number
  }>
  topErrors: Array<{
    error: string
    count: number
    endpoint: string
  }>
  trafficByHour: Array<{
    hour: number
    requests: number
  }>
}

const DailyAnalyticsSchema = new Schema<IDailyAnalytics>({
  date: { type: Date, required: true, unique: true, index: true },
  totalRequests: { type: Number, required: true, default: 0 },
  successRequests: { type: Number, required: true, default: 0 },
  errorRequests: { type: Number, required: true, default: 0 },
  averageResponseTime: { type: Number, required: true, default: 0 },
  uniqueUsers: { type: Number, required: true, default: 0 },
  uniqueIPs: { type: Number, required: true, default: 0 },
  topEndpoints: [{
    endpoint: { type: String, required: true },
    requests: { type: Number, required: true },
    averageResponseTime: { type: Number, required: true }
  }],
  topErrors: [{
    error: { type: String, required: true },
    count: { type: Number, required: true },
    endpoint: { type: String, required: true }
  }],
  trafficByHour: [{
    hour: { type: Number, required: true },
    requests: { type: Number, required: true }
  }]
}, {
  timestamps: true,
  collection: 'daily_analytics'
})

// Error Analytics
export interface IErrorAnalytics extends Document {
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

const ErrorAnalyticsSchema = new Schema<IErrorAnalytics>({
  timestamp: { type: Date, default: Date.now, index: true },
  errorType: { type: String, required: true, index: true },
  errorMessage: { type: String, required: true },
  stack: { type: String },
  endpoint: { type: String, required: true, index: true },
  method: { type: String, required: true },
  statusCode: { type: Number, required: true },
  userId: { type: String, index: true },
  ip: { type: String, required: true },
  userAgent: { type: String },
  traceId: { type: String, index: true },
  context: { type: Schema.Types.Mixed }
}, {
  timestamps: true,
  collection: 'error_analytics'
})

// Performance Metrics
export interface IPerformanceMetrics extends Document {
  timestamp: Date
  metricType: 'cpu' | 'memory' | 'disk' | 'network'
  value: number
  unit: string
  tags?: Record<string, string>
}

const PerformanceMetricsSchema = new Schema<IPerformanceMetrics>({
  timestamp: { type: Date, default: Date.now, index: true },
  metricType: { type: String, required: true, enum: ['cpu', 'memory', 'disk', 'network'], index: true },
  value: { type: Number, required: true },
  unit: { type: String, required: true },
  tags: { type: Schema.Types.Mixed }
}, {
  timestamps: true,
  collection: 'performance_metrics'
})

// Create indexes for better query performance
ApiRequestAnalyticsSchema.index({ timestamp: -1 })
ApiRequestAnalyticsSchema.index({ endpoint: 1, timestamp: -1 })
ApiRequestAnalyticsSchema.index({ statusCode: 1, timestamp: -1 })
ApiRequestAnalyticsSchema.index({ userId: 1, timestamp: -1 })

HourlyAnalyticsSchema.index({ hour: -1 })
HourlyAnalyticsSchema.index({ endpoint: 1, hour: -1 })

DailyAnalyticsSchema.index({ date: -1 })

ErrorAnalyticsSchema.index({ timestamp: -1 })
ErrorAnalyticsSchema.index({ errorType: 1, timestamp: -1 })
ErrorAnalyticsSchema.index({ endpoint: 1, timestamp: -1 })

PerformanceMetricsSchema.index({ timestamp: -1 })
PerformanceMetricsSchema.index({ metricType: 1, timestamp: -1 })

export const ApiRequestAnalytics = mongoose.model<IApiRequestAnalytics>('ApiRequestAnalytics', ApiRequestAnalyticsSchema)
export const HourlyAnalytics = mongoose.model<IHourlyAnalytics>('HourlyAnalytics', HourlyAnalyticsSchema)
export const DailyAnalytics = mongoose.model<IDailyAnalytics>('DailyAnalytics', DailyAnalyticsSchema)
export const ErrorAnalytics = mongoose.model<IErrorAnalytics>('ErrorAnalytics', ErrorAnalyticsSchema)
export const PerformanceMetrics = mongoose.model<IPerformanceMetrics>('PerformanceMetrics', PerformanceMetricsSchema)
