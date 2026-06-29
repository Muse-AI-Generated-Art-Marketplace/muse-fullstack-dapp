const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001'

export interface DashboardMetricsSnapshot {
    timestamp: string
    totalRequests: number
    requestsPerSecond: number
    averageResponseTime: number
    errorRate: number
    rateLimitedPercentage: number
    activeUsers: number
    topEndpoints: Array<{ endpoint: string; count: number; avgResponseTime: number }>
    tierDistribution: { anonymous: number; verified: number; premium: number }
    statusCodeDistribution: Record<string, number>
}

export interface RealTimeMetrics {
    currentRPS: number
    currentLatency: number
    activeConnections: number
    rateLimitedRequests: number
    errorCount: number
    healthStatus: 'healthy' | 'degraded' | 'unhealthy'
}

export interface UserRateLimitInfo {
    userAddress: string
    userId?: string
    tier: string
    standardUsage: number
    standardLimit: number
    aiUsage: number
    aiLimit: number
    totalRequestsToday: number
    rateLimitedToday: number
    lastRequest: string
}

export interface UserRateLimitResponse {
    users: UserRateLimitInfo[]
    total: number
    page: number
    limit: number
}

export interface SystemHealth {
    overall: 'healthy' | 'degraded' | 'unhealthy'
    components: Array<{
        name: string
        status: 'healthy' | 'degraded' | 'unhealthy'
        latency?: number
        message?: string
    }>
    uptime: number
    lastCheck: string
    metrics: {
        cpuUsage?: number
        memoryUsage?: number
        activeConnections: number
        requestsPerSecond: number
    }
}

export interface PerformanceMetrics {
    trends: Array<{
        timestamp: string
        requestsPerSecond: number
        averageLatency: number
        errorRate: number
        rateLimitedPercentage: number
    }>
    summary: {
        totalRequests: number
        averageLatency: number
        p50Latency: number
        p95Latency: number
        p99Latency: number
        errorRate: number
        successRate: number
        rateLimitedPercentage: number
    }
    topEndpoints: Array<{
        endpoint: string
        count: number
        avgResponseTime: number
        errorRate: number
    }>
    topUsers: Array<{
        userAddress: string
        tier: string
        requests: number
        rateLimited: number
    }>
}

export interface AlertConfig {
    _id: string
    name: string
    type: 'rate_limit' | 'response_time' | 'error_rate' | 'throughput' | 'custom'
    enabled: boolean
    conditions: {
        metric: string
        operator: 'gt' | 'lt' | 'gte' | 'lte' | 'eq'
        threshold: number
        duration: number
    }
    actions: {
        email?: boolean
        webhook?: string
        slack?: string
        inApp: boolean
    }
    cooldownMinutes: number
    lastTriggered?: string
    triggeredCount: number
    createdBy: string
    createdAt: string
    updatedAt: string
}

export interface AlertHistory {
    _id: string
    alertConfigId: string
    alertName: string
    alertType: string
    triggeredAt: string
    resolvedAt?: string
    status: 'triggered' | 'acknowledged' | 'resolved'
    metricValue: number
    threshold: number
    message: string
    acknowledgedBy?: string
    notes?: string
}

export interface AlertHistoryResponse {
    alerts: AlertHistory[]
    total: number
    page: number
    limit: number
}

class DashboardService {
    private authToken: string | null = null

    setAuthToken(token: string | null) {
        this.authToken = token
    }

    private getHeaders(): HeadersInit {
        const headers: HeadersInit = {
            'Content-Type': 'application/json'
        }
        if (this.authToken) {
            headers['Authorization'] = `Bearer ${this.authToken}`
        }
        return headers
    }

    private async handleResponse<T>(response: Response): Promise<T> {
        if (!response.ok) {
            const error = await response.json().catch(() => ({ message: 'Request failed' }))
            throw new Error(error.message || `HTTP error ${response.status}`)
        }
        const data = await response.json()
        return data.data as T
    }

    async getDashboardSnapshot(period?: '1h' | '6h' | '24h' | '7d' | '30d'): Promise<DashboardMetricsSnapshot> {
        const url = new URL(`${API_BASE}/api/dashboard/snapshot`)
        if (period) {
            url.searchParams.set('period', period)
        }
        const response = await fetch(url.toString(), {
            method: 'GET',
            headers: this.getHeaders()
        })
        return this.handleResponse<DashboardMetricsSnapshot>(response)
    }

    async getRealTimeMetrics(): Promise<RealTimeMetrics> {
        const response = await fetch(`${API_BASE}/api/dashboard/realtime`, {
            method: 'GET',
            headers: this.getHeaders()
        })
        return this.handleResponse<RealTimeMetrics>(response)
    }

    async getUserRateLimits(
        page: number = 1,
        limit: number = 50,
        tier?: string,
        search?: string
    ): Promise<UserRateLimitResponse> {
        const url = new URL(`${API_BASE}/api/dashboard/users/rate-limits`)
        url.searchParams.set('page', page.toString())
        url.searchParams.set('limit', limit.toString())
        if (tier) url.searchParams.set('tier', tier)
        if (search) url.searchParams.set('search', search)

        const response = await fetch(url.toString(), {
            method: 'GET',
            headers: this.getHeaders()
        })
        return this.handleResponse<UserRateLimitResponse>(response)
    }

    async getSystemHealth(): Promise<SystemHealth> {
        const response = await fetch(`${API_BASE}/api/dashboard/health`, {
            method: 'GET',
            headers: this.getHeaders()
        })
        return this.handleResponse<SystemHealth>(response)
    }

    async getPerformanceMetrics(period?: '1h' | '6h' | '24h' | '7d'): Promise<PerformanceMetrics> {
        const url = new URL(`${API_BASE}/api/dashboard/performance`)
        if (period) {
            url.searchParams.set('period', period)
        }
        const response = await fetch(url.toString(), {
            method: 'GET',
            headers: this.getHeaders()
        })
        return this.handleResponse<PerformanceMetrics>(response)
    }

    // Alert Management
    async getAlerts(enabled?: boolean): Promise<AlertConfig[]> {
        const url = new URL(`${API_BASE}/api/dashboard/alerts`)
        if (enabled !== undefined) {
            url.searchParams.set('enabled', enabled.toString())
        }
        const response = await fetch(url.toString(), {
            method: 'GET',
            headers: this.getHeaders()
        })
        return this.handleResponse<AlertConfig[]>(response)
    }

    async createAlert(alertData: Omit<AlertConfig, '_id' | 'createdAt' | 'updatedAt' | 'createdBy' | 'lastTriggered' | 'triggeredCount'>): Promise<AlertConfig> {
        const response = await fetch(`${API_BASE}/api/dashboard/alerts`, {
            method: 'POST',
            headers: this.getHeaders(),
            body: JSON.stringify(alertData)
        })
        return this.handleResponse<AlertConfig>(response)
    }

    async updateAlert(alertId: string, updates: Partial<AlertConfig>): Promise<AlertConfig> {
        const response = await fetch(`${API_BASE}/api/dashboard/alerts/${alertId}`, {
            method: 'PUT',
            headers: this.getHeaders(),
            body: JSON.stringify(updates)
        })
        return this.handleResponse<AlertConfig>(response)
    }

    async deleteAlert(alertId: string): Promise<void> {
        const response = await fetch(`${API_BASE}/api/dashboard/alerts/${alertId}`, {
            method: 'DELETE',
            headers: this.getHeaders()
        })
        if (!response.ok) {
            const error = await response.json().catch(() => ({ message: 'Delete failed' }))
            throw new Error(error.message)
        }
    }

    async getAlertHistory(
        page: number = 1,
        limit: number = 50,
        status?: 'triggered' | 'acknowledged' | 'resolved'
    ): Promise<AlertHistoryResponse> {
        const url = new URL(`${API_BASE}/api/dashboard/alerts/history`)
        url.searchParams.set('page', page.toString())
        url.searchParams.set('limit', limit.toString())
        if (status) url.searchParams.set('status', status)

        const response = await fetch(url.toString(), {
            method: 'GET',
            headers: this.getHeaders()
        })
        return this.handleResponse<AlertHistoryResponse>(response)
    }

    async acknowledgeAlert(alertHistoryId: string, notes?: string): Promise<AlertHistory> {
        const response = await fetch(`${API_BASE}/api/dashboard/alerts/history/${alertHistoryId}/acknowledge`, {
            method: 'POST',
            headers: this.getHeaders(),
            body: JSON.stringify({ notes })
        })
        return this.handleResponse<AlertHistory>(response)
    }

    async resolveAlert(alertHistoryId: string, notes?: string): Promise<AlertHistory> {
        const response = await fetch(`${API_BASE}/api/dashboard/alerts/history/${alertHistoryId}/resolve`, {
            method: 'POST',
            headers: this.getHeaders(),
            body: JSON.stringify({ notes })
        })
        return this.handleResponse<AlertHistory>(response)
    }

    async triggerAlertCheck(): Promise<void> {
        const response = await fetch(`${API_BASE}/api/dashboard/alerts/check`, {
            method: 'POST',
            headers: this.getHeaders()
        })
        if (!response.ok) {
            const error = await response.json().catch(() => ({ message: 'Alert check failed' }))
            throw new Error(error.message)
        }
    }
}

export const dashboardService = new DashboardService()
export default dashboardService
