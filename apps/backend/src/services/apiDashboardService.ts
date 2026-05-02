import {
    ApiRequestLog,
    AggregatedMetrics,
    AlertConfig,
    AlertHistory,
    UserRateLimitStatus,
    IAlertConfig,
    IAlertHistory,
    DashboardMetricsSnapshot,
    RealTimeMetrics
} from '@/models/ApiMetrics';
import { redis } from '@/config/redis';
import { createLogger } from '@/utils/logger';
import mongoose from 'mongoose';

const logger = createLogger('ApiDashboardService');

// Keys for Redis real-time metrics
const REDIS_KEYS = {
    CURRENT_RPS: 'metrics:current_rps',
    CURRENT_LATENCY: 'metrics:current_latency',
    ACTIVE_CONNECTIONS: 'metrics:active_connections',
    RATE_LIMITED_COUNT: 'metrics:rate_limited_count',
    ERROR_COUNT: 'metrics:error_count',
    REQUESTS_WINDOW: 'metrics:requests:window',
    LATENCY_WINDOW: 'metrics:latency:window'
};

interface TimeRange {
    start: Date;
    end: Date;
}

interface PerformanceMetrics {
    trends: {
        timestamp: Date;
        requestsPerSecond: number;
        averageLatency: number;
        errorRate: number;
        rateLimitedPercentage: number;
    }[];
    summary: {
        totalRequests: number;
        averageLatency: number;
        p50Latency: number;
        p95Latency: number;
        p99Latency: number;
        errorRate: number;
        successRate: number;
        rateLimitedPercentage: number;
    };
    topEndpoints: {
        endpoint: string;
        count: number;
        avgResponseTime: number;
        errorRate: number;
    }[];
    topUsers: {
        userAddress: string;
        tier: string;
        requests: number;
        rateLimited: number;
    }[];
}

interface SystemHealth {
    overall: 'healthy' | 'degraded' | 'unhealthy';
    components: {
        name: string;
        status: 'healthy' | 'degraded' | 'unhealthy';
        latency?: number;
        message?: string;
    }[];
    uptime: number;
    lastCheck: Date;
    metrics: {
        cpuUsage?: number;
        memoryUsage?: number;
        activeConnections: number;
        requestsPerSecond: number;
    };
}

interface UserRateLimitInfo {
    users: {
        userAddress: string;
        userId?: string;
        tier: string;
        standardUsage: number;
        standardLimit: number;
        aiUsage: number;
        aiLimit: number;
        totalRequestsToday: number;
        rateLimitedToday: number;
        lastRequest: Date;
    }[];
    total: number;
    page: number;
    limit: number;
}

class ApiDashboardService {
    private startTime = Date.now();

    /**
     * Get dashboard snapshot with aggregated metrics
     */
    async getDashboardSnapshot(timeRange?: TimeRange): Promise<DashboardMetricsSnapshot> {
        const now = new Date();
        const defaultStart = new Date(now.getTime() - 60 * 60 * 1000); // Last hour
        const start = timeRange?.start || defaultStart;
        const end = timeRange?.end || now;

        try {
            // Get aggregated metrics from database
            const [requestStats, statusDistribution, topEndpoints, tierDistribution] = await Promise.all([
                this.getRequestStats(start, end),
                this.getStatusCodeDistribution(start, end),
                this.getTopEndpoints(start, end),
                this.getTierDistribution(start, end)
            ]);

            // Get real-time RPS from Redis
            const rps = await this.getCurrentRPS();

            return {
                timestamp: now,
                totalRequests: requestStats.total,
                requestsPerSecond: rps,
                averageResponseTime: requestStats.avgResponseTime,
                errorRate: requestStats.errorRate,
                rateLimitedPercentage: requestStats.rateLimitedPercentage,
                activeUsers: requestStats.uniqueUsers,
                topEndpoints,
                tierDistribution,
                statusCodeDistribution: statusDistribution
            };
        } catch (error) {
            logger.error('Failed to get dashboard snapshot:', error);
            throw error;
        }
    }

    /**
     * Get real-time metrics from Redis
     */
    async getRealTimeMetrics(): Promise<RealTimeMetrics> {
        try {
            const [rps, latency, connections, rateLimited, errors] = await Promise.all([
                this.getCurrentRPS(),
                this.getCurrentLatency(),
                this.getActiveConnections(),
                this.getRateLimitedCount(),
                this.getErrorCount()
            ]);

            // Determine health status
            let healthStatus: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
            if (errors > 100 || latency > 2000) {
                healthStatus = 'unhealthy';
            } else if (errors > 50 || latency > 1000 || rateLimited > 100) {
                healthStatus = 'degraded';
            }

            return {
                currentRPS: rps,
                currentLatency: latency,
                activeConnections: connections,
                rateLimitedRequests: rateLimited,
                errorCount: errors,
                healthStatus
            };
        } catch (error) {
            logger.error('Failed to get real-time metrics:', error);
            // Return default metrics on error
            return {
                currentRPS: 0,
                currentLatency: 0,
                activeConnections: 0,
                rateLimitedRequests: 0,
                errorCount: 0,
                healthStatus: 'unhealthy'
            };
        }
    }

    /**
     * Get user rate limit information with pagination
     */
    async getUserRateLimitInfo(
        page: number = 1,
        limit: number = 50,
        tier?: string,
        search?: string
    ): Promise<UserRateLimitInfo> {
        try {
            const query: Record<string, unknown> = {};

            if (tier && tier !== 'all') {
                query.tier = tier;
            }

            if (search) {
                query.$or = [
                    { userAddress: { $regex: search, $options: 'i' } },
                    { userId: { $regex: search, $options: 'i' } }
                ];
            }

            const skip = (page - 1) * limit;

            const [users, total] = await Promise.all([
                UserRateLimitStatus.find(query)
                    .sort({ lastRequestAt: -1 })
                    .skip(skip)
                    .limit(limit)
                    .lean(),
                UserRateLimitStatus.countDocuments(query)
            ]);

            return {
                users: users.map(user => ({
                    userAddress: user.userAddress,
                    userId: user.userId,
                    tier: user.tier,
                    standardUsage: user.standardLimit.current,
                    standardLimit: user.standardLimit.max,
                    aiUsage: user.aiLimit.current,
                    aiLimit: user.aiLimit.max,
                    totalRequestsToday: user.totalRequestsToday,
                    rateLimitedToday: user.rateLimitedCountToday,
                    lastRequest: user.lastRequestAt
                })),
                total,
                page,
                limit
            };
        } catch (error) {
            logger.error('Failed to get user rate limit info:', error);
            throw error;
        }
    }

    /**
     * Get comprehensive system health metrics
     */
    async getSystemHealthMetrics(): Promise<SystemHealth> {
        const components: SystemHealth['components'] = [];

        // Check MongoDB
        try {
            const mongoStart = Date.now();
            await mongoose.connection.db?.admin().ping();
            components.push({
                name: 'MongoDB',
                status: 'healthy',
                latency: Date.now() - mongoStart,
                message: 'Connected'
            });
        } catch (error) {
            components.push({
                name: 'MongoDB',
                status: 'unhealthy',
                message: error instanceof Error ? error.message : 'Connection failed'
            });
        }

        // Check Redis
        try {
            const redisStart = Date.now();
            await redis.ping();
            components.push({
                name: 'Redis',
                status: 'healthy',
                latency: Date.now() - redisStart,
                message: 'Connected'
            });
        } catch (error) {
            components.push({
                name: 'Redis',
                status: 'degraded',
                message: 'Using fallback (memory)'
            });
        }

        // Get real-time metrics
        const realTimeMetrics = await this.getRealTimeMetrics();

        // Determine overall health
        const unhealthyCount = components.filter(c => c.status === 'unhealthy').length;
        const degradedCount = components.filter(c => c.status === 'degraded').length;

        let overall: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
        if (unhealthyCount > 0) {
            overall = 'unhealthy';
        } else if (degradedCount > 0) {
            overall = 'degraded';
        }

        return {
            overall,
            components,
            uptime: Date.now() - this.startTime,
            lastCheck: new Date(),
            metrics: {
                activeConnections: realTimeMetrics.activeConnections,
                requestsPerSecond: realTimeMetrics.currentRPS
            }
        };
    }

    /**
     * Get performance metrics with trends
     */
    async getPerformanceMetrics(timeRange?: TimeRange): Promise<PerformanceMetrics> {
        const now = new Date();
        const defaultStart = new Date(now.getTime() - 60 * 60 * 1000);
        const start = timeRange?.start || defaultStart;
        const end = timeRange?.end || now;

        try {
            // Calculate bucket size based on time range
            const durationMs = end.getTime() - start.getTime();
            const bucketMinutes = durationMs > 24 * 60 * 60 * 1000 ? 60 :
                durationMs > 6 * 60 * 60 * 1000 ? 15 : 5;

            // Get trends using aggregation
            const trends = await ApiRequestLog.aggregate([
                {
                    $match: {
                        timestamp: { $gte: start, $lte: end }
                    }
                },
                {
                    $group: {
                        _id: {
                            $toDate: {
                                $subtract: [
                                    { $toLong: '$timestamp' },
                                    { $mod: [{ $toLong: '$timestamp' }, bucketMinutes * 60 * 1000] }
                                ]
                            }
                        },
                        totalRequests: { $sum: 1 },
                        avgLatency: { $avg: '$responseTime' },
                        errors: { $sum: { $cond: [{ $gte: ['$statusCode', 400] }, 1, 0] } },
                        rateLimited: { $sum: { $cond: ['$rateLimited', 1, 0] } }
                    }
                },
                { $sort: { _id: 1 } }
            ]);

            // Get summary stats
            const summaryStats = await ApiRequestLog.aggregate([
                {
                    $match: {
                        timestamp: { $gte: start, $lte: end }
                    }
                },
                {
                    $group: {
                        _id: null,
                        total: { $sum: 1 },
                        avgLatency: { $avg: '$responseTime' },
                        errors: { $sum: { $cond: [{ $gte: ['$statusCode', 400] }, 1, 0] } },
                        rateLimited: { $sum: { $cond: ['$rateLimited', 1, 0] } },
                        responseTimes: { $push: '$responseTime' }
                    }
                }
            ]);

            const summary = summaryStats[0] || {
                total: 0,
                avgLatency: 0,
                errors: 0,
                rateLimited: 0,
                responseTimes: []
            };

            // Calculate percentiles
            const sortedTimes = (summary.responseTimes || []).sort((a: number, b: number) => a - b);
            const p50Index = Math.floor(sortedTimes.length * 0.5);
            const p95Index = Math.floor(sortedTimes.length * 0.95);
            const p99Index = Math.floor(sortedTimes.length * 0.99);

            // Get top endpoints
            const topEndpoints = await ApiRequestLog.aggregate([
                {
                    $match: {
                        timestamp: { $gte: start, $lte: end }
                    }
                },
                {
                    $group: {
                        _id: '$endpoint',
                        count: { $sum: 1 },
                        avgResponseTime: { $avg: '$responseTime' },
                        errors: { $sum: { $cond: [{ $gte: ['$statusCode', 400] }, 1, 0] } }
                    }
                },
                { $sort: { count: -1 } },
                { $limit: 10 }
            ]);

            // Get top users
            const topUsers = await ApiRequestLog.aggregate([
                {
                    $match: {
                        timestamp: { $gte: start, $lte: end },
                        userAddress: { $exists: true, $ne: null }
                    }
                },
                {
                    $group: {
                        _id: { userAddress: '$userAddress', tier: '$userTier' },
                        requests: { $sum: 1 },
                        rateLimited: { $sum: { $cond: ['$rateLimited', 1, 0] } }
                    }
                },
                { $sort: { requests: -1 } },
                { $limit: 10 }
            ]);

            const durationSeconds = durationMs / 1000;

            return {
                trends: trends.map(t => ({
                    timestamp: t._id,
                    requestsPerSecond: t.totalRequests / (bucketMinutes * 60),
                    averageLatency: t.avgLatency,
                    errorRate: t.totalRequests > 0 ? (t.errors / t.totalRequests) * 100 : 0,
                    rateLimitedPercentage: t.totalRequests > 0 ? (t.rateLimited / t.totalRequests) * 100 : 0
                })),
                summary: {
                    totalRequests: summary.total,
                    averageLatency: summary.avgLatency || 0,
                    p50Latency: sortedTimes[p50Index] || 0,
                    p95Latency: sortedTimes[p95Index] || 0,
                    p99Latency: sortedTimes[p99Index] || 0,
                    errorRate: summary.total > 0 ? (summary.errors / summary.total) * 100 : 0,
                    successRate: summary.total > 0 ? ((summary.total - summary.errors) / summary.total) * 100 : 100,
                    rateLimitedPercentage: summary.total > 0 ? (summary.rateLimited / summary.total) * 100 : 0
                },
                topEndpoints: topEndpoints.map(e => ({
                    endpoint: e._id,
                    count: e.count,
                    avgResponseTime: e.avgResponseTime,
                    errorRate: e.count > 0 ? (e.errors / e.count) * 100 : 0
                })),
                topUsers: topUsers.map(u => ({
                    userAddress: u._id.userAddress,
                    tier: u._id.tier,
                    requests: u.requests,
                    rateLimited: u.rateLimited
                }))
            };
        } catch (error) {
            logger.error('Failed to get performance metrics:', error);
            throw error;
        }
    }

    // ============ Alert Management ============

    /**
     * Get all alert configurations
     */
    async getAlerts(enabled?: boolean): Promise<IAlertConfig[]> {
        const query: Record<string, unknown> = {};
        if (enabled !== undefined) {
            query.enabled = enabled;
        }
        return AlertConfig.find(query).sort({ createdAt: -1 }).lean();
    }

    /**
     * Create a new alert configuration
     */
    async createAlert(alertData: Partial<IAlertConfig>): Promise<IAlertConfig> {
        const alert = new AlertConfig(alertData);
        await alert.save();
        return alert.toObject();
    }

    /**
     * Update an existing alert
     */
    async updateAlert(alertId: string, updates: Partial<IAlertConfig>): Promise<IAlertConfig | null> {
        return AlertConfig.findByIdAndUpdate(alertId, updates, { new: true }).lean();
    }

    /**
     * Delete an alert configuration
     */
    async deleteAlert(alertId: string): Promise<boolean> {
        const result = await AlertConfig.findByIdAndDelete(alertId);
        return result !== null;
    }

    /**
     * Get alert history with pagination
     */
    async getAlertHistory(
        page: number = 1,
        limit: number = 50,
        status?: string
    ): Promise<{ alerts: IAlertHistory[]; total: number; page: number; limit: number }> {
        const query: Record<string, unknown> = {};
        if (status) {
            query.status = status;
        }

        const skip = (page - 1) * limit;

        const [alerts, total] = await Promise.all([
            AlertHistory.find(query)
                .sort({ triggeredAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            AlertHistory.countDocuments(query)
        ]);

        return { alerts, total, page, limit };
    }

    /**
     * Acknowledge an alert
     */
    async acknowledgeAlert(alertHistoryId: string, acknowledgedBy: string, notes?: string): Promise<IAlertHistory | null> {
        return AlertHistory.findByIdAndUpdate(
            alertHistoryId,
            {
                status: 'acknowledged',
                acknowledgedBy,
                notes
            },
            { new: true }
        ).lean();
    }

    /**
     * Resolve an alert
     */
    async resolveAlert(alertHistoryId: string, notes?: string): Promise<IAlertHistory | null> {
        return AlertHistory.findByIdAndUpdate(
            alertHistoryId,
            {
                status: 'resolved',
                resolvedAt: new Date(),
                notes
            },
            { new: true }
        ).lean();
    }

    /**
     * Check all alerts and trigger if conditions are met
     */
    async checkAlerts(): Promise<void> {
        try {
            const enabledAlerts = await AlertConfig.find({ enabled: true });
            const realTimeMetrics = await this.getRealTimeMetrics();

            for (const alert of enabledAlerts) {
                const shouldTrigger = await this.evaluateAlertCondition(alert, realTimeMetrics);

                if (shouldTrigger) {
                    // Check cooldown
                    if (alert.lastTriggered) {
                        const cooldownMs = alert.cooldownMinutes * 60 * 1000;
                        if (Date.now() - alert.lastTriggered.getTime() < cooldownMs) {
                            continue;
                        }
                    }

                    // Create alert history entry
                    const metricValue = this.getMetricValue(alert.conditions.metric, realTimeMetrics);
                    await AlertHistory.create({
                        alertConfigId: alert._id,
                        alertName: alert.name,
                        alertType: alert.type,
                        metricValue,
                        threshold: alert.conditions.threshold,
                        message: `${alert.name}: ${alert.conditions.metric} is ${metricValue} (threshold: ${alert.conditions.threshold})`
                    });

                    // Update alert config
                    await AlertConfig.findByIdAndUpdate(alert._id, {
                        lastTriggered: new Date(),
                        $inc: { triggeredCount: 1 }
                    });

                    logger.warn('Alert triggered:', {
                        alertId: alert._id,
                        name: alert.name,
                        metricValue,
                        threshold: alert.conditions.threshold
                    });
                }
            }
        } catch (error) {
            logger.error('Failed to check alerts:', error);
        }
    }

    // ============ Helper Methods ============

    private async getRequestStats(start: Date, end: Date) {
        const stats = await ApiRequestLog.aggregate([
            {
                $match: {
                    timestamp: { $gte: start, $lte: end }
                }
            },
            {
                $group: {
                    _id: null,
                    total: { $sum: 1 },
                    avgResponseTime: { $avg: '$responseTime' },
                    errors: { $sum: { $cond: [{ $gte: ['$statusCode', 400] }, 1, 0] } },
                    rateLimited: { $sum: { $cond: ['$rateLimited', 1, 0] } },
                    uniqueUsers: { $addToSet: '$userAddress' }
                }
            }
        ]);

        const result = stats[0] || { total: 0, avgResponseTime: 0, errors: 0, rateLimited: 0, uniqueUsers: [] };

        return {
            total: result.total,
            avgResponseTime: result.avgResponseTime || 0,
            errorRate: result.total > 0 ? (result.errors / result.total) * 100 : 0,
            rateLimitedPercentage: result.total > 0 ? (result.rateLimited / result.total) * 100 : 0,
            uniqueUsers: result.uniqueUsers?.length || 0
        };
    }

    private async getStatusCodeDistribution(start: Date, end: Date): Promise<Record<string, number>> {
        const distribution = await ApiRequestLog.aggregate([
            {
                $match: {
                    timestamp: { $gte: start, $lte: end }
                }
            },
            {
                $group: {
                    _id: { $toString: '$statusCode' },
                    count: { $sum: 1 }
                }
            }
        ]);

        return distribution.reduce((acc, item) => {
            acc[item._id] = item.count;
            return acc;
        }, {} as Record<string, number>);
    }

    private async getTopEndpoints(start: Date, end: Date) {
        const endpoints = await ApiRequestLog.aggregate([
            {
                $match: {
                    timestamp: { $gte: start, $lte: end }
                }
            },
            {
                $group: {
                    _id: '$endpoint',
                    count: { $sum: 1 },
                    avgResponseTime: { $avg: '$responseTime' }
                }
            },
            { $sort: { count: -1 } },
            { $limit: 10 }
        ]);

        return endpoints.map(e => ({
            endpoint: e._id,
            count: e.count,
            avgResponseTime: e.avgResponseTime
        }));
    }

    private async getTierDistribution(start: Date, end: Date) {
        const tiers = await ApiRequestLog.aggregate([
            {
                $match: {
                    timestamp: { $gte: start, $lte: end }
                }
            },
            {
                $group: {
                    _id: '$userTier',
                    count: { $sum: 1 }
                }
            }
        ]);

        const distribution = { anonymous: 0, verified: 0, premium: 0 };
        tiers.forEach(t => {
            if (t._id in distribution) {
                distribution[t._id as keyof typeof distribution] = t.count;
            }
        });

        return distribution;
    }

    private async getCurrentRPS(): Promise<number> {
        try {
            const count = await redis.get(REDIS_KEYS.CURRENT_RPS);
            return count ? parseInt(count, 10) : 0;
        } catch {
            return 0;
        }
    }

    private async getCurrentLatency(): Promise<number> {
        try {
            const latency = await redis.get(REDIS_KEYS.CURRENT_LATENCY);
            return latency ? parseFloat(latency) : 0;
        } catch {
            return 0;
        }
    }

    private async getActiveConnections(): Promise<number> {
        try {
            const count = await redis.get(REDIS_KEYS.ACTIVE_CONNECTIONS);
            return count ? parseInt(count, 10) : 0;
        } catch {
            return 0;
        }
    }

    private async getRateLimitedCount(): Promise<number> {
        try {
            const count = await redis.get(REDIS_KEYS.RATE_LIMITED_COUNT);
            return count ? parseInt(count, 10) : 0;
        } catch {
            return 0;
        }
    }

    private async getErrorCount(): Promise<number> {
        try {
            const count = await redis.get(REDIS_KEYS.ERROR_COUNT);
            return count ? parseInt(count, 10) : 0;
        } catch {
            return 0;
        }
    }

    private async evaluateAlertCondition(alert: IAlertConfig, metrics: RealTimeMetrics): Promise<boolean> {
        const value = this.getMetricValue(alert.conditions.metric, metrics);
        const threshold = alert.conditions.threshold;

        switch (alert.conditions.operator) {
            case 'gt': return value > threshold;
            case 'gte': return value >= threshold;
            case 'lt': return value < threshold;
            case 'lte': return value <= threshold;
            case 'eq': return value === threshold;
            default: return false;
        }
    }

    private getMetricValue(metric: string, metrics: RealTimeMetrics): number {
        switch (metric) {
            case 'error_rate': return metrics.errorCount;
            case 'rate_limited_percentage': return metrics.rateLimitedRequests;
            case 'average_latency': return metrics.currentLatency;
            case 'requests_per_second': return metrics.currentRPS;
            default: return 0;
        }
    }

    /**
     * Log an API request for metrics tracking
     */
    async logRequest(data: {
        endpoint: string;
        method: string;
        userId?: string;
        userAddress?: string;
        userTier: string;
        ip: string;
        statusCode: number;
        responseTime: number;
        rateLimited: boolean;
        userAgent?: string;
        errorMessage?: string;
    }): Promise<void> {
        try {
            await ApiRequestLog.create(data);

            // Update real-time metrics in Redis
            const now = Math.floor(Date.now() / 1000);
            await Promise.all([
                redis.incr(REDIS_KEYS.CURRENT_RPS),
                redis.expire(REDIS_KEYS.CURRENT_RPS, 2),
                data.rateLimited ? redis.incr(REDIS_KEYS.RATE_LIMITED_COUNT) : Promise.resolve(),
                data.statusCode >= 400 ? redis.incr(REDIS_KEYS.ERROR_COUNT) : Promise.resolve()
            ]);
        } catch (error) {
            logger.error('Failed to log API request:', error);
        }
    }

    /**
     * Update user rate limit status
     */
    async updateUserRateLimitStatus(
        userAddress: string,
        tier: string,
        standardLimit: { current: number; max: number; windowMs: number; resetAt: Date },
        aiLimit: { current: number; max: number; windowMs: number; resetAt: Date },
        rateLimited: boolean
    ): Promise<void> {
        try {
            await UserRateLimitStatus.findOneAndUpdate(
                { userAddress },
                {
                    $set: {
                        tier,
                        standardLimit,
                        aiLimit,
                        lastRequestAt: new Date()
                    },
                    $inc: {
                        totalRequestsToday: 1,
                        rateLimitedCountToday: rateLimited ? 1 : 0
                    }
                },
                { upsert: true }
            );
        } catch (error) {
            logger.error('Failed to update user rate limit status:', error);
        }
    }
}

export const apiDashboardService = new ApiDashboardService();
