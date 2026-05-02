import { useState, useEffect, useCallback } from 'react'
import { cn } from '@/utils/cn'
import { MetricsCard } from '@/components/dashboard/MetricsCard'
import { UsageChart, BarChart, DonutChart } from '@/components/dashboard/UsageChart'
import { UserRateLimitTable } from '@/components/dashboard/UserRateLimitTable'
import { SystemHealthPanel } from '@/components/dashboard/SystemHealthPanel'
import { AlertConfigPanel } from '@/components/dashboard/AlertConfigPanel'
import dashboardService, {
    type DashboardMetricsSnapshot,
    type RealTimeMetrics,
    type SystemHealth,
    type PerformanceMetrics,
    type UserRateLimitInfo,
    type AlertConfig,
    type AlertHistory
} from '@/services/dashboardService'

type TimePeriod = '1h' | '6h' | '24h' | '7d' | '30d'

export function RateLimitDashboard() {
    const [period, setPeriod] = useState<TimePeriod>('1h')
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    // Data states
    const [snapshot, setSnapshot] = useState<DashboardMetricsSnapshot | null>(null)
    const [realTimeMetrics, setRealTimeMetrics] = useState<RealTimeMetrics | null>(null)
    const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null)
    const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetrics | null>(null)
    const [userRateLimits, setUserRateLimits] = useState<UserRateLimitInfo[]>([])
    const [userRateLimitsTotal, setUserRateLimitsTotal] = useState(0)
    const [userRateLimitsPage, setUserRateLimitsPage] = useState(1)
    const [userSearch, setUserSearch] = useState('')
    const [userTierFilter, setUserTierFilter] = useState<string | undefined>()
    const [alerts, setAlerts] = useState<AlertConfig[]>([])
    const [alertHistory, setAlertHistory] = useState<AlertHistory[]>([])

    // Fetch dashboard data
    const fetchDashboardData = useCallback(async () => {
        try {
            setError(null)
            const [snapshotData, realTimeData, healthData, performanceData] = await Promise.all([
                dashboardService.getDashboardSnapshot(period),
                dashboardService.getRealTimeMetrics(),
                dashboardService.getSystemHealth(),
                dashboardService.getPerformanceMetrics(period === '30d' ? '7d' : period)
            ])

            setSnapshot(snapshotData)
            setRealTimeMetrics(realTimeData)
            setSystemHealth(healthData)
            setPerformanceMetrics(performanceData)
        } catch (err) {
            console.error('Failed to fetch dashboard data:', err)
            setError(err instanceof Error ? err.message : 'Failed to load dashboard data')
        } finally {
            setIsLoading(false)
        }
    }, [period])

    // Fetch user rate limits
    const fetchUserRateLimits = useCallback(async () => {
        try {
            const data = await dashboardService.getUserRateLimits(
                userRateLimitsPage,
                50,
                userTierFilter,
                userSearch
            )
            setUserRateLimits(data.users)
            setUserRateLimitsTotal(data.total)
        } catch (err) {
            console.error('Failed to fetch user rate limits:', err)
        }
    }, [userRateLimitsPage, userTierFilter, userSearch])

    // Fetch alerts
    const fetchAlerts = useCallback(async () => {
        try {
            const [alertsData, historyData] = await Promise.all([
                dashboardService.getAlerts(),
                dashboardService.getAlertHistory(1, 50)
            ])
            setAlerts(alertsData)
            setAlertHistory(historyData.alerts)
        } catch (err) {
            console.error('Failed to fetch alerts:', err)
        }
    }, [])

    useEffect(() => {
        fetchDashboardData()
        fetchAlerts()
    }, [fetchDashboardData, fetchAlerts])

    useEffect(() => {
        fetchUserRateLimits()
    }, [fetchUserRateLimits])

    // Auto-refresh real-time metrics every 5 seconds
    useEffect(() => {
        const interval = setInterval(async () => {
            try {
                const data = await dashboardService.getRealTimeMetrics()
                setRealTimeMetrics(data)
            } catch (err) {
                console.error('Failed to refresh real-time metrics:', err)
            }
        }, 5000)

        return () => clearInterval(interval)
    }, [])

    // Alert handlers
    const handleCreateAlert = async (alertData: Parameters<typeof dashboardService.createAlert>[0]) => {
        await dashboardService.createAlert(alertData)
        await fetchAlerts()
    }

    const handleUpdateAlert = async (alertId: string, updates: Partial<AlertConfig>) => {
        await dashboardService.updateAlert(alertId, updates)
        await fetchAlerts()
    }

    const handleDeleteAlert = async (alertId: string) => {
        await dashboardService.deleteAlert(alertId)
        await fetchAlerts()
    }

    const handleAcknowledgeAlert = async (alertHistoryId: string, notes?: string) => {
        await dashboardService.acknowledgeAlert(alertHistoryId, notes)
        await fetchAlerts()
    }

    const handleResolveAlert = async (alertHistoryId: string, notes?: string) => {
        await dashboardService.resolveAlert(alertHistoryId, notes)
        await fetchAlerts()
    }

    const getHealthStatusColor = (status: string) => {
        switch (status) {
            case 'healthy': return 'success'
            case 'degraded': return 'warning'
            case 'unhealthy': return 'danger'
            default: return 'default'
        }
    }

    if (error) {
        return (
            <div className="min-h-screen bg-secondary-50 p-4 md:p-6 lg:p-8">
                <div className="max-w-7xl mx-auto">
                    <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
                        <svg className="w-12 h-12 mx-auto mb-4 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        <h2 className="text-lg font-semibold text-red-800 mb-2">Failed to Load Dashboard</h2>
                        <p className="text-red-600 mb-4">{error}</p>
                        <button
                            onClick={() => { setIsLoading(true); fetchDashboardData(); }}
                            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                        >
                            Try Again
                        </button>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-secondary-50">
            {/* Header */}
            <div className="bg-white border-b border-secondary-200 sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-4">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div>
                            <h1 className="text-2xl font-bold text-secondary-900">API Dashboard</h1>
                            <p className="text-sm text-secondary-500 mt-0.5">
                                Rate limiting, throttling & system health monitoring
                            </p>
                        </div>
                        <div className="flex items-center gap-3">
                            {/* Period Selector */}
                            <div className="flex bg-secondary-100 rounded-lg p-1">
                                {(['1h', '6h', '24h', '7d', '30d'] as TimePeriod[]).map((p) => (
                                    <button
                                        key={p}
                                        onClick={() => setPeriod(p)}
                                        className={cn(
                                            'px-3 py-1.5 text-sm font-medium rounded-md transition-colors',
                                            period === p
                                                ? 'bg-white text-secondary-900 shadow-sm'
                                                : 'text-secondary-600 hover:text-secondary-900'
                                        )}
                                    >
                                        {p}
                                    </button>
                                ))}
                            </div>
                            {/* Refresh Button */}
                            <button
                                onClick={() => { setIsLoading(true); fetchDashboardData(); }}
                                disabled={isLoading}
                                className="p-2 text-secondary-500 hover:text-secondary-700 hover:bg-secondary-100 rounded-lg transition-colors disabled:opacity-50"
                            >
                                <svg className={cn('w-5 h-5', isLoading && 'animate-spin')} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-6">
                {/* Real-time Status Bar */}
                {realTimeMetrics && (
                    <div className={cn(
                        'mb-6 p-4 rounded-xl border flex flex-wrap items-center justify-between gap-4',
                        realTimeMetrics.healthStatus === 'healthy' ? 'bg-emerald-50 border-emerald-200' :
                            realTimeMetrics.healthStatus === 'degraded' ? 'bg-amber-50 border-amber-200' :
                                'bg-red-50 border-red-200'
                    )}>
                        <div className="flex items-center gap-3">
                            <span className={cn(
                                'w-3 h-3 rounded-full animate-pulse',
                                realTimeMetrics.healthStatus === 'healthy' ? 'bg-emerald-500' :
                                    realTimeMetrics.healthStatus === 'degraded' ? 'bg-amber-500' :
                                        'bg-red-500'
                            )} />
                            <span className="font-medium text-secondary-900">
                                System Status: <span className="capitalize">{realTimeMetrics.healthStatus}</span>
                            </span>
                        </div>
                        <div className="flex flex-wrap gap-6 text-sm">
                            <div>
                                <span className="text-secondary-500">RPS:</span>{' '}
                                <span className="font-semibold text-secondary-900">{realTimeMetrics.currentRPS}</span>
                            </div>
                            <div>
                                <span className="text-secondary-500">Latency:</span>{' '}
                                <span className="font-semibold text-secondary-900">{realTimeMetrics.currentLatency}ms</span>
                            </div>
                            <div>
                                <span className="text-secondary-500">Active:</span>{' '}
                                <span className="font-semibold text-secondary-900">{realTimeMetrics.activeConnections}</span>
                            </div>
                            <div>
                                <span className="text-secondary-500">Rate Limited:</span>{' '}
                                <span className="font-semibold text-secondary-900">{realTimeMetrics.rateLimitedRequests}</span>
                            </div>
                            <div>
                                <span className="text-secondary-500">Errors:</span>{' '}
                                <span className="font-semibold text-secondary-900">{realTimeMetrics.errorCount}</span>
                            </div>
                        </div>
                    </div>
                )}

                {/* Metrics Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    <MetricsCard
                        title="Total Requests"
                        value={snapshot?.totalRequests || 0}
                        subtitle={`${snapshot?.requestsPerSecond?.toFixed(1) || 0} req/sec`}
                        icon={
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                        }
                    />
                    <MetricsCard
                        title="Avg Response Time"
                        value={`${snapshot?.averageResponseTime?.toFixed(0) || 0}ms`}
                        subtitle="Response latency"
                        variant={
                            (snapshot?.averageResponseTime || 0) > 1000 ? 'danger' :
                                (snapshot?.averageResponseTime || 0) > 500 ? 'warning' : 'default'
                        }
                        icon={
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        }
                    />
                    <MetricsCard
                        title="Error Rate"
                        value={`${snapshot?.errorRate?.toFixed(2) || 0}%`}
                        subtitle="Failed requests"
                        variant={
                            (snapshot?.errorRate || 0) > 5 ? 'danger' :
                                (snapshot?.errorRate || 0) > 2 ? 'warning' : 'success'
                        }
                        icon={
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        }
                    />
                    <MetricsCard
                        title="Rate Limited"
                        value={`${snapshot?.rateLimitedPercentage?.toFixed(2) || 0}%`}
                        subtitle="Throttled requests"
                        variant={
                            (snapshot?.rateLimitedPercentage || 0) > 10 ? 'danger' :
                                (snapshot?.rateLimitedPercentage || 0) > 5 ? 'warning' : 'default'
                        }
                        icon={
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                            </svg>
                        }
                    />
                </div>

                {/* Charts Row */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                    <UsageChart
                        title="Request Throughput"
                        subtitle="Requests per second over time"
                        data={(performanceMetrics?.trends || []).map(t => ({
                            timestamp: t.timestamp,
                            value: t.requestsPerSecond,
                            label: new Date(t.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
                        }))}
                        color="primary"
                        valueFormatter={(v) => `${v.toFixed(1)} rps`}
                        height={220}
                    />
                    <UsageChart
                        title="Response Latency"
                        subtitle="Average response time over time"
                        data={(performanceMetrics?.trends || []).map(t => ({
                            timestamp: t.timestamp,
                            value: t.averageLatency,
                            label: new Date(t.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
                        }))}
                        color={
                            (performanceMetrics?.summary?.averageLatency || 0) > 1000 ? 'danger' :
                                (performanceMetrics?.summary?.averageLatency || 0) > 500 ? 'warning' : 'success'
                        }
                        valueFormatter={(v) => `${v.toFixed(0)}ms`}
                        height={220}
                    />
                </div>

                {/* Distribution Charts */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
                    <DonutChart
                        title="Tier Distribution"
                        data={[
                            { label: 'Premium', value: snapshot?.tierDistribution?.premium || 0, color: 'text-violet-500' },
                            { label: 'Verified', value: snapshot?.tierDistribution?.verified || 0, color: 'text-emerald-500' },
                            { label: 'Anonymous', value: snapshot?.tierDistribution?.anonymous || 0, color: 'text-secondary-400' }
                        ]}
                        centerValue={`${snapshot?.activeUsers || 0}`}
                        centerLabel="Active Users"
                    />
                    <BarChart
                        title="Top Endpoints"
                        subtitle="Most requested API endpoints"
                        data={(snapshot?.topEndpoints || []).slice(0, 5).map(e => ({
                            label: e.endpoint.length > 25 ? `...${e.endpoint.slice(-22)}` : e.endpoint,
                            value: e.count
                        }))}
                        valueFormatter={(v) => v.toLocaleString()}
                    />
                    <BarChart
                        title="Status Code Distribution"
                        subtitle="HTTP response codes"
                        data={Object.entries(snapshot?.statusCodeDistribution || {})
                            .sort((a, b) => b[1] - a[1])
                            .slice(0, 5)
                            .map(([code, count]) => ({
                                label: `HTTP ${code}`,
                                value: count,
                                color: code.startsWith('2') ? 'bg-emerald-500' :
                                    code.startsWith('4') ? 'bg-amber-500' :
                                        code.startsWith('5') ? 'bg-red-500' : 'bg-secondary-500'
                            }))}
                        valueFormatter={(v) => v.toLocaleString()}
                    />
                </div>

                {/* Performance Summary */}
                {performanceMetrics?.summary && (
                    <div className="bg-white rounded-xl border border-secondary-200 p-5 mb-6">
                        <h3 className="text-lg font-semibold text-secondary-900 mb-4">Performance Summary</h3>
                        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-4">
                            <div className="text-center p-3 bg-secondary-50 rounded-lg">
                                <p className="text-2xl font-bold text-secondary-900">
                                    {performanceMetrics.summary.totalRequests.toLocaleString()}
                                </p>
                                <p className="text-xs text-secondary-500 mt-1">Total Requests</p>
                            </div>
                            <div className="text-center p-3 bg-secondary-50 rounded-lg">
                                <p className="text-2xl font-bold text-secondary-900">
                                    {performanceMetrics.summary.averageLatency.toFixed(0)}ms
                                </p>
                                <p className="text-xs text-secondary-500 mt-1">Avg Latency</p>
                            </div>
                            <div className="text-center p-3 bg-secondary-50 rounded-lg">
                                <p className="text-2xl font-bold text-secondary-900">
                                    {performanceMetrics.summary.p50Latency.toFixed(0)}ms
                                </p>
                                <p className="text-xs text-secondary-500 mt-1">P50 Latency</p>
                            </div>
                            <div className="text-center p-3 bg-secondary-50 rounded-lg">
                                <p className="text-2xl font-bold text-secondary-900">
                                    {performanceMetrics.summary.p95Latency.toFixed(0)}ms
                                </p>
                                <p className="text-xs text-secondary-500 mt-1">P95 Latency</p>
                            </div>
                            <div className="text-center p-3 bg-secondary-50 rounded-lg">
                                <p className="text-2xl font-bold text-secondary-900">
                                    {performanceMetrics.summary.p99Latency.toFixed(0)}ms
                                </p>
                                <p className="text-xs text-secondary-500 mt-1">P99 Latency</p>
                            </div>
                            <div className="text-center p-3 bg-emerald-50 rounded-lg">
                                <p className="text-2xl font-bold text-emerald-600">
                                    {performanceMetrics.summary.successRate.toFixed(1)}%
                                </p>
                                <p className="text-xs text-secondary-500 mt-1">Success Rate</p>
                            </div>
                            <div className="text-center p-3 bg-red-50 rounded-lg">
                                <p className="text-2xl font-bold text-red-600">
                                    {performanceMetrics.summary.errorRate.toFixed(2)}%
                                </p>
                                <p className="text-xs text-secondary-500 mt-1">Error Rate</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Two Column Layout: System Health & Alerts */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                    <SystemHealthPanel
                        health={systemHealth}
                        isLoading={isLoading}
                    />
                    <AlertConfigPanel
                        alerts={alerts}
                        alertHistory={alertHistory}
                        onCreateAlert={handleCreateAlert}
                        onUpdateAlert={handleUpdateAlert}
                        onDeleteAlert={handleDeleteAlert}
                        onAcknowledgeAlert={handleAcknowledgeAlert}
                        onResolveAlert={handleResolveAlert}
                        isLoading={isLoading}
                    />
                </div>

                {/* User Rate Limits Table */}
                <UserRateLimitTable
                    users={userRateLimits}
                    total={userRateLimitsTotal}
                    page={userRateLimitsPage}
                    limit={50}
                    onPageChange={setUserRateLimitsPage}
                    onSearch={setUserSearch}
                    onTierFilter={setUserTierFilter}
                    isLoading={isLoading}
                />
            </div>
        </div>
    )
}

export default RateLimitDashboard
