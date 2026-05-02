import { cn } from '@/utils/cn'
import type { SystemHealth } from '@/services/dashboardService'

interface SystemHealthPanelProps {
    health: SystemHealth | null
    isLoading?: boolean
    className?: string
}

export function SystemHealthPanel({ health, isLoading = false, className }: SystemHealthPanelProps) {
    const getStatusColor = (status: 'healthy' | 'degraded' | 'unhealthy') => {
        switch (status) {
            case 'healthy':
                return 'bg-emerald-500'
            case 'degraded':
                return 'bg-amber-500'
            case 'unhealthy':
                return 'bg-red-500'
        }
    }

    const getStatusBgColor = (status: 'healthy' | 'degraded' | 'unhealthy') => {
        switch (status) {
            case 'healthy':
                return 'bg-emerald-50 border-emerald-200'
            case 'degraded':
                return 'bg-amber-50 border-amber-200'
            case 'unhealthy':
                return 'bg-red-50 border-red-200'
        }
    }

    const getStatusTextColor = (status: 'healthy' | 'degraded' | 'unhealthy') => {
        switch (status) {
            case 'healthy':
                return 'text-emerald-700'
            case 'degraded':
                return 'text-amber-700'
            case 'unhealthy':
                return 'text-red-700'
        }
    }

    const formatUptime = (ms: number) => {
        const seconds = Math.floor(ms / 1000)
        const minutes = Math.floor(seconds / 60)
        const hours = Math.floor(minutes / 60)
        const days = Math.floor(hours / 24)

        if (days > 0) {
            return `${days}d ${hours % 24}h ${minutes % 60}m`
        }
        if (hours > 0) {
            return `${hours}h ${minutes % 60}m ${seconds % 60}s`
        }
        if (minutes > 0) {
            return `${minutes}m ${seconds % 60}s`
        }
        return `${seconds}s`
    }

    if (isLoading) {
        return (
            <div className={cn('bg-white rounded-xl border border-secondary-200 p-5', className)}>
                <div className="animate-pulse space-y-4">
                    <div className="h-6 bg-secondary-200 rounded w-1/3" />
                    <div className="h-20 bg-secondary-100 rounded" />
                    <div className="space-y-3">
                        <div className="h-12 bg-secondary-100 rounded" />
                        <div className="h-12 bg-secondary-100 rounded" />
                        <div className="h-12 bg-secondary-100 rounded" />
                    </div>
                </div>
            </div>
        )
    }

    if (!health) {
        return (
            <div className={cn('bg-white rounded-xl border border-secondary-200 p-5', className)}>
                <div className="text-center py-8 text-secondary-500">
                    <svg className="w-12 h-12 mx-auto mb-3 text-secondary-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    <p>Unable to load system health</p>
                </div>
            </div>
        )
    }

    return (
        <div className={cn('bg-white rounded-xl border border-secondary-200 overflow-hidden', className)}>
            {/* Header */}
            <div className="p-5 border-b border-secondary-200">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-lg font-semibold text-secondary-900">System Health</h3>
                        <p className="text-sm text-secondary-500 mt-0.5">
                            Last checked: {new Date(health.lastCheck).toLocaleTimeString()}
                        </p>
                    </div>
                    <div className={cn(
                        'px-3 py-1.5 rounded-full border text-sm font-medium capitalize flex items-center gap-2',
                        getStatusBgColor(health.overall),
                        getStatusTextColor(health.overall)
                    )}>
                        <span className={cn('w-2 h-2 rounded-full', getStatusColor(health.overall))} />
                        {health.overall}
                    </div>
                </div>
            </div>

            {/* Uptime & Metrics */}
            <div className="p-5 border-b border-secondary-200 bg-secondary-50">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                        <p className="text-2xl font-bold text-secondary-900">{formatUptime(health.uptime)}</p>
                        <p className="text-xs text-secondary-500 mt-1">Uptime</p>
                    </div>
                    <div className="text-center">
                        <p className="text-2xl font-bold text-secondary-900">
                            {health.metrics.requestsPerSecond.toFixed(1)}
                        </p>
                        <p className="text-xs text-secondary-500 mt-1">Requests/sec</p>
                    </div>
                    <div className="text-center">
                        <p className="text-2xl font-bold text-secondary-900">
                            {health.metrics.activeConnections}
                        </p>
                        <p className="text-xs text-secondary-500 mt-1">Active Connections</p>
                    </div>
                    <div className="text-center">
                        <p className="text-2xl font-bold text-secondary-900">
                            {health.components.filter(c => c.status === 'healthy').length}/{health.components.length}
                        </p>
                        <p className="text-xs text-secondary-500 mt-1">Healthy Services</p>
                    </div>
                </div>
            </div>

            {/* Components */}
            <div className="p-5">
                <h4 className="text-sm font-semibold text-secondary-700 mb-3">Service Components</h4>
                <div className="space-y-3">
                    {health.components.map((component, index) => (
                        <div
                            key={index}
                            className={cn(
                                'flex items-center justify-between p-3 rounded-lg border transition-colors',
                                getStatusBgColor(component.status)
                            )}
                        >
                            <div className="flex items-center gap-3">
                                <span className={cn('w-2.5 h-2.5 rounded-full', getStatusColor(component.status))} />
                                <div>
                                    <p className="font-medium text-secondary-900">{component.name}</p>
                                    {component.message && (
                                        <p className="text-xs text-secondary-500">{component.message}</p>
                                    )}
                                </div>
                            </div>
                            <div className="text-right">
                                {component.latency !== undefined && (
                                    <p className="text-sm font-medium text-secondary-700">
                                        {component.latency}ms
                                    </p>
                                )}
                                <p className={cn('text-xs font-medium capitalize', getStatusTextColor(component.status))}>
                                    {component.status}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Resource Usage (if available) */}
            {(health.metrics.cpuUsage !== undefined || health.metrics.memoryUsage !== undefined) && (
                <div className="p-5 border-t border-secondary-200">
                    <h4 className="text-sm font-semibold text-secondary-700 mb-3">Resource Usage</h4>
                    <div className="space-y-3">
                        {health.metrics.cpuUsage !== undefined && (
                            <div>
                                <div className="flex items-center justify-between text-sm mb-1">
                                    <span className="text-secondary-600">CPU Usage</span>
                                    <span className="font-medium text-secondary-900">{health.metrics.cpuUsage.toFixed(1)}%</span>
                                </div>
                                <div className="h-2 bg-secondary-100 rounded-full overflow-hidden">
                                    <div
                                        className={cn(
                                            'h-full rounded-full transition-all',
                                            health.metrics.cpuUsage > 80 ? 'bg-red-500' :
                                                health.metrics.cpuUsage > 60 ? 'bg-amber-500' : 'bg-emerald-500'
                                        )}
                                        style={{ width: `${Math.min(health.metrics.cpuUsage, 100)}%` }}
                                    />
                                </div>
                            </div>
                        )}
                        {health.metrics.memoryUsage !== undefined && (
                            <div>
                                <div className="flex items-center justify-between text-sm mb-1">
                                    <span className="text-secondary-600">Memory Usage</span>
                                    <span className="font-medium text-secondary-900">{health.metrics.memoryUsage.toFixed(1)}%</span>
                                </div>
                                <div className="h-2 bg-secondary-100 rounded-full overflow-hidden">
                                    <div
                                        className={cn(
                                            'h-full rounded-full transition-all',
                                            health.metrics.memoryUsage > 80 ? 'bg-red-500' :
                                                health.metrics.memoryUsage > 60 ? 'bg-amber-500' : 'bg-emerald-500'
                                        )}
                                        style={{ width: `${Math.min(health.metrics.memoryUsage, 100)}%` }}
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}

export default SystemHealthPanel
