import mongoose, { Schema, Document } from 'mongoose';

/**
 * API Request Log - Stores individual API requests for analysis
 */
export interface IApiRequestLog extends Document {
    endpoint: string;
    method: string;
    userId?: string;
    userAddress?: string;
    userTier: string;
    ip: string;
    statusCode: number;
    responseTime: number;
    rateLimited: boolean;
    timestamp: Date;
    userAgent?: string;
    errorMessage?: string;
}

const ApiRequestLogSchema = new Schema<IApiRequestLog>(
    {
        endpoint: { type: String, required: true, index: true },
        method: { type: String, required: true },
        userId: { type: String, index: true },
        userAddress: { type: String, index: true },
        userTier: { type: String, default: 'anonymous', index: true },
        ip: { type: String, required: true, index: true },
        statusCode: { type: Number, required: true },
        responseTime: { type: Number, required: true },
        rateLimited: { type: Boolean, default: false, index: true },
        timestamp: { type: Date, default: Date.now, index: true },
        userAgent: { type: String },
        errorMessage: { type: String }
    },
    {
        timestamps: false,
        collection: 'api_request_logs'
    }
);

// TTL index - automatically delete logs older than 30 days
ApiRequestLogSchema.index({ timestamp: 1 }, { expireAfterSeconds: 30 * 24 * 60 * 60 });

// Compound indexes for common queries
ApiRequestLogSchema.index({ endpoint: 1, timestamp: -1 });
ApiRequestLogSchema.index({ userAddress: 1, timestamp: -1 });
ApiRequestLogSchema.index({ rateLimited: 1, timestamp: -1 });
ApiRequestLogSchema.index({ statusCode: 1, timestamp: -1 });

export const ApiRequestLog = mongoose.model<IApiRequestLog>('ApiRequestLog', ApiRequestLogSchema);

/**
 * Aggregated API Metrics - Hourly snapshots for performance
 */
export interface IAggregatedMetrics extends Document {
    period: 'hourly' | 'daily';
    timestamp: Date;
    endpoint?: string;
    totalRequests: number;
    successfulRequests: number;
    failedRequests: number;
    rateLimitedRequests: number;
    averageResponseTime: number;
    p50ResponseTime: number;
    p95ResponseTime: number;
    p99ResponseTime: number;
    uniqueUsers: number;
    requestsByTier: {
        anonymous: number;
        verified: number;
        premium: number;
    };
    requestsByMethod: {
        GET: number;
        POST: number;
        PUT: number;
        DELETE: number;
        PATCH: number;
    };
    statusCodeDistribution: Map<string, number>;
}

const AggregatedMetricsSchema = new Schema<IAggregatedMetrics>(
    {
        period: { type: String, enum: ['hourly', 'daily'], required: true, index: true },
        timestamp: { type: Date, required: true, index: true },
        endpoint: { type: String, index: true },
        totalRequests: { type: Number, default: 0 },
        successfulRequests: { type: Number, default: 0 },
        failedRequests: { type: Number, default: 0 },
        rateLimitedRequests: { type: Number, default: 0 },
        averageResponseTime: { type: Number, default: 0 },
        p50ResponseTime: { type: Number, default: 0 },
        p95ResponseTime: { type: Number, default: 0 },
        p99ResponseTime: { type: Number, default: 0 },
        uniqueUsers: { type: Number, default: 0 },
        requestsByTier: {
            anonymous: { type: Number, default: 0 },
            verified: { type: Number, default: 0 },
            premium: { type: Number, default: 0 }
        },
        requestsByMethod: {
            GET: { type: Number, default: 0 },
            POST: { type: Number, default: 0 },
            PUT: { type: Number, default: 0 },
            DELETE: { type: Number, default: 0 },
            PATCH: { type: Number, default: 0 }
        },
        statusCodeDistribution: { type: Map, of: Number }
    },
    {
        timestamps: false,
        collection: 'aggregated_metrics'
    }
);

// TTL index - keep hourly for 7 days, daily for 90 days
AggregatedMetricsSchema.index(
    { timestamp: 1 },
    { expireAfterSeconds: 90 * 24 * 60 * 60 }
);

// Compound indexes
AggregatedMetricsSchema.index({ period: 1, timestamp: -1 });
AggregatedMetricsSchema.index({ period: 1, endpoint: 1, timestamp: -1 });

export const AggregatedMetrics = mongoose.model<IAggregatedMetrics>('AggregatedMetrics', AggregatedMetricsSchema);

/**
 * Alert Configuration - Settings for anomaly detection
 */
export interface IAlertConfig extends Document {
    name: string;
    type: 'rate_limit' | 'response_time' | 'error_rate' | 'throughput' | 'custom';
    enabled: boolean;
    conditions: {
        metric: string;
        operator: 'gt' | 'lt' | 'gte' | 'lte' | 'eq';
        threshold: number;
        duration: number; // in minutes
    };
    actions: {
        email?: boolean;
        webhook?: string;
        slack?: string;
        inApp: boolean;
    };
    cooldownMinutes: number;
    lastTriggered?: Date;
    triggeredCount: number;
    createdBy: string;
    createdAt: Date;
    updatedAt: Date;
}

const AlertConfigSchema = new Schema<IAlertConfig>(
    {
        name: { type: String, required: true },
        type: {
            type: String,
            enum: ['rate_limit', 'response_time', 'error_rate', 'throughput', 'custom'],
            required: true,
            index: true
        },
        enabled: { type: Boolean, default: true, index: true },
        conditions: {
            metric: { type: String, required: true },
            operator: { type: String, enum: ['gt', 'lt', 'gte', 'lte', 'eq'], required: true },
            threshold: { type: Number, required: true },
            duration: { type: Number, default: 5 }
        },
        actions: {
            email: { type: Boolean, default: false },
            webhook: { type: String },
            slack: { type: String },
            inApp: { type: Boolean, default: true }
        },
        cooldownMinutes: { type: Number, default: 15 },
        lastTriggered: { type: Date },
        triggeredCount: { type: Number, default: 0 },
        createdBy: { type: String, required: true }
    },
    {
        timestamps: true,
        collection: 'alert_configs'
    }
);

export const AlertConfig = mongoose.model<IAlertConfig>('AlertConfig', AlertConfigSchema);

/**
 * Alert History - Record of triggered alerts
 */
export interface IAlertHistory extends Document {
    alertConfigId: mongoose.Types.ObjectId;
    alertName: string;
    alertType: string;
    triggeredAt: Date;
    resolvedAt?: Date;
    status: 'triggered' | 'acknowledged' | 'resolved';
    metricValue: number;
    threshold: number;
    message: string;
    acknowledgedBy?: string;
    notes?: string;
}

const AlertHistorySchema = new Schema<IAlertHistory>(
    {
        alertConfigId: { type: Schema.Types.ObjectId, ref: 'AlertConfig', required: true, index: true },
        alertName: { type: String, required: true },
        alertType: { type: String, required: true },
        triggeredAt: { type: Date, default: Date.now, index: true },
        resolvedAt: { type: Date },
        status: {
            type: String,
            enum: ['triggered', 'acknowledged', 'resolved'],
            default: 'triggered',
            index: true
        },
        metricValue: { type: Number, required: true },
        threshold: { type: Number, required: true },
        message: { type: String, required: true },
        acknowledgedBy: { type: String },
        notes: { type: String }
    },
    {
        timestamps: false,
        collection: 'alert_history'
    }
);

// TTL index - keep alert history for 90 days
AlertHistorySchema.index({ triggeredAt: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });

export const AlertHistory = mongoose.model<IAlertHistory>('AlertHistory', AlertHistorySchema);

/**
 * User Rate Limit Status - Current rate limit state per user
 */
export interface IUserRateLimitStatus extends Document {
    userAddress: string;
    userId?: string;
    tier: string;
    standardLimit: {
        current: number;
        max: number;
        windowMs: number;
        resetAt: Date;
    };
    aiLimit: {
        current: number;
        max: number;
        windowMs: number;
        resetAt: Date;
    };
    totalRequestsToday: number;
    rateLimitedCountToday: number;
    lastRequestAt: Date;
    updatedAt: Date;
}

const UserRateLimitStatusSchema = new Schema<IUserRateLimitStatus>(
    {
        userAddress: { type: String, required: true, unique: true, index: true },
        userId: { type: String, index: true },
        tier: { type: String, default: 'anonymous', index: true },
        standardLimit: {
            current: { type: Number, default: 0 },
            max: { type: Number, required: true },
            windowMs: { type: Number, required: true },
            resetAt: { type: Date, required: true }
        },
        aiLimit: {
            current: { type: Number, default: 0 },
            max: { type: Number, required: true },
            windowMs: { type: Number, required: true },
            resetAt: { type: Date, required: true }
        },
        totalRequestsToday: { type: Number, default: 0 },
        rateLimitedCountToday: { type: Number, default: 0 },
        lastRequestAt: { type: Date, default: Date.now }
    },
    {
        timestamps: { createdAt: false, updatedAt: true },
        collection: 'user_rate_limit_status'
    }
);

export const UserRateLimitStatus = mongoose.model<IUserRateLimitStatus>('UserRateLimitStatus', UserRateLimitStatusSchema);

// Export types for dashboard
export interface DashboardMetricsSnapshot {
    timestamp: Date;
    totalRequests: number;
    requestsPerSecond: number;
    averageResponseTime: number;
    errorRate: number;
    rateLimitedPercentage: number;
    activeUsers: number;
    topEndpoints: Array<{ endpoint: string; count: number; avgResponseTime: number }>;
    tierDistribution: { anonymous: number; verified: number; premium: number };
    statusCodeDistribution: Record<string, number>;
}

export interface RealTimeMetrics {
    currentRPS: number;
    currentLatency: number;
    activeConnections: number;
    rateLimitedRequests: number;
    errorCount: number;
    healthStatus: 'healthy' | 'degraded' | 'unhealthy';
}
