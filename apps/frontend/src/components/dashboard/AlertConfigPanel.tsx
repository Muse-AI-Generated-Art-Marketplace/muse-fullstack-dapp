import { useState } from 'react'
import { cn } from '@/utils/cn'
import type { AlertConfig, AlertHistory } from '@/services/dashboardService'

interface AlertConfigPanelProps {
    alerts: AlertConfig[]
    alertHistory: AlertHistory[]
    onCreateAlert: (alert: Omit<AlertConfig, '_id' | 'createdAt' | 'updatedAt' | 'createdBy' | 'lastTriggered' | 'triggeredCount'>) => Promise<void>
    onUpdateAlert: (alertId: string, updates: Partial<AlertConfig>) => Promise<void>
    onDeleteAlert: (alertId: string) => Promise<void>
    onAcknowledgeAlert: (alertHistoryId: string, notes?: string) => Promise<void>
    onResolveAlert: (alertHistoryId: string, notes?: string) => Promise<void>
    isLoading?: boolean
    className?: string
}

type AlertType = 'rate_limit' | 'response_time' | 'error_rate' | 'throughput' | 'custom'
type MetricType = 'error_rate' | 'rate_limited_percentage' | 'average_latency' | 'requests_per_second'
type OperatorType = 'gt' | 'lt' | 'gte' | 'lte' | 'eq'

const ALERT_TYPES: { value: AlertType; label: string }[] = [
    { value: 'rate_limit', label: 'Rate Limit' },
    { value: 'response_time', label: 'Response Time' },
    { value: 'error_rate', label: 'Error Rate' },
    { value: 'throughput', label: 'Throughput' },
    { value: 'custom', label: 'Custom' }
]

const METRICS: { value: MetricType; label: string }[] = [
    { value: 'error_rate', label: 'Error Rate' },
    { value: 'rate_limited_percentage', label: 'Rate Limited %' },
    { value: 'average_latency', label: 'Average Latency (ms)' },
    { value: 'requests_per_second', label: 'Requests/Second' }
]

const OPERATORS: { value: OperatorType; label: string }[] = [
    { value: 'gt', label: '>' },
    { value: 'gte', label: '>=' },
    { value: 'lt', label: '<' },
    { value: 'lte', label: '<=' },
    { value: 'eq', label: '=' }
]

export function AlertConfigPanel({
                                     alerts,
                                     alertHistory,
                                     onCreateAlert,
                                     onUpdateAlert,
                                     onDeleteAlert,
                                     onAcknowledgeAlert,
                                     onResolveAlert,
                                     isLoading = false,
                                     className
                                 }: AlertConfigPanelProps) {
    const [activeTab, setActiveTab] = useState<'configs' | 'history'>('configs')
    const [showCreateForm, setShowCreateForm] = useState(false)
    const [editingAlert, setEditingAlert] = useState<AlertConfig | null>(null)
    const [formData, setFormData] = useState({
        name: '',
        type: 'error_rate' as AlertType,
        enabled: true,
        metric: 'error_rate' as MetricType,
        operator: 'gt' as OperatorType,
        threshold: 5,
        duration: 5,
        cooldownMinutes: 15,
        emailEnabled: false,
        inAppEnabled: true,
        webhook: '',
        slack: ''
    })
    const [isSubmitting, setIsSubmitting] = useState(false)

    const resetForm = () => {
        setFormData({
            name: '',
            type: 'error_rate',
            enabled: true,
            metric: 'error_rate',
            operator: 'gt',
            threshold: 5,
            duration: 5,
            cooldownMinutes: 15,
            emailEnabled: false,
            inAppEnabled: true,
            webhook: '',
            slack: ''
        })
        setEditingAlert(null)
        setShowCreateForm(false)
    }

    const handleEdit = (alert: AlertConfig) => {
        setEditingAlert(alert)
        setFormData({
            name: alert.name,
            type: alert.type,
            enabled: alert.enabled,
            metric: alert.conditions.metric as MetricType,
            operator: alert.conditions.operator,
            threshold: alert.conditions.threshold,
            duration: alert.conditions.duration,
            cooldownMinutes: alert.cooldownMinutes,
            emailEnabled: alert.actions.email || false,
            inAppEnabled: alert.actions.inApp,
            webhook: alert.actions.webhook || '',
            slack: alert.actions.slack || ''
        })
        setShowCreateForm(true)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsSubmitting(true)

        try {
            const alertData = {
                name: formData.name,
                type: formData.type,
                enabled: formData.enabled,
                conditions: {
                    metric: formData.metric,
                    operator: formData.operator,
                    threshold: formData.threshold,
                    duration: formData.duration
                },
                actions: {
                    email: formData.emailEnabled,
                    inApp: formData.inAppEnabled,
                    webhook: formData.webhook || undefined,
                    slack: formData.slack || undefined
                },
                cooldownMinutes: formData.cooldownMinutes
            }

            if (editingAlert) {
                await onUpdateAlert(editingAlert._id, alertData)
            } else {
                await onCreateAlert(alertData)
            }
            resetForm()
        } catch (error) {
            console.error('Failed to save alert:', error)
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleToggleEnabled = async (alert: AlertConfig) => {
        try {
            await onUpdateAlert(alert._id, { enabled: !alert.enabled })
        } catch (error) {
            console.error('Failed to toggle alert:', error)
        }
    }

    const getStatusBadgeStyles = (status: string) => {
        switch (status) {
            case 'triggered':
                return 'bg-red-100 text-red-700 border-red-200'
            case 'acknowledged':
                return 'bg-amber-100 text-amber-700 border-amber-200'
            case 'resolved':
                return 'bg-emerald-100 text-emerald-700 border-emerald-200'
            default:
                return 'bg-secondary-100 text-secondary-700 border-secondary-200'
        }
    }

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })
    }

    return (
        <div className={cn('bg-white rounded-xl border border-secondary-200 overflow-hidden', className)}>
            {/* Tabs */}
            <div className="flex border-b border-secondary-200">
                <button
                    onClick={() => setActiveTab('configs')}
                    className={cn(
                        'flex-1 px-4 py-3 text-sm font-medium transition-colors',
                        activeTab === 'configs'
                            ? 'text-primary-600 border-b-2 border-primary-500 bg-primary-50'
                            : 'text-secondary-600 hover:text-secondary-900 hover:bg-secondary-50'
                    )}
                >
                    Alert Configurations
                </button>
                <button
                    onClick={() => setActiveTab('history')}
                    className={cn(
                        'flex-1 px-4 py-3 text-sm font-medium transition-colors relative',
                        activeTab === 'history'
                            ? 'text-primary-600 border-b-2 border-primary-500 bg-primary-50'
                            : 'text-secondary-600 hover:text-secondary-900 hover:bg-secondary-50'
                    )}
                >
                    Alert History
                    {alertHistory.filter(a => a.status === 'triggered').length > 0 && (
                        <span className="absolute top-2 right-4 w-2 h-2 bg-red-500 rounded-full" />
                    )}
                </button>
            </div>

            {/* Content */}
            <div className="p-5">
                {activeTab === 'configs' ? (
                    <>
                        {/* Create/Edit Form */}
                        {showCreateForm ? (
                            <form onSubmit={handleSubmit} className="space-y-4 mb-6 p-4 bg-secondary-50 rounded-lg border border-secondary-200">
                                <div className="flex items-center justify-between">
                                    <h4 className="font-semibold text-secondary-900">
                                        {editingAlert ? 'Edit Alert' : 'Create New Alert'}
                                    </h4>
                                    <button
                                        type="button"
                                        onClick={resetForm}
                                        className="text-secondary-500 hover:text-secondary-700"
                                    >
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-secondary-700 mb-1">
                                            Alert Name
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            className="w-full px-3 py-2 text-sm border border-secondary-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                                            placeholder="e.g., High Error Rate Alert"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-secondary-700 mb-1">
                                            Alert Type
                                        </label>
                                        <select
                                            value={formData.type}
                                            onChange={(e) => setFormData({ ...formData, type: e.target.value as AlertType })}
                                            className="w-full px-3 py-2 text-sm border border-secondary-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
                                        >
                                            {ALERT_TYPES.map(type => (
                                                <option key={type.value} value={type.value}>{type.label}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-secondary-700 mb-1">
                                            Metric
                                        </label>
                                        <select
                                            value={formData.metric}
                                            onChange={(e) => setFormData({ ...formData, metric: e.target.value as MetricType })}
                                            className="w-full px-3 py-2 text-sm border border-secondary-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
                                        >
                                            {METRICS.map(metric => (
                                                <option key={metric.value} value={metric.value}>{metric.label}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-secondary-700 mb-1">
                                            Operator
                                        </label>
                                        <select
                                            value={formData.operator}
                                            onChange={(e) => setFormData({ ...formData, operator: e.target.value as OperatorType })}
                                            className="w-full px-3 py-2 text-sm border border-secondary-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
                                        >
                                            {OPERATORS.map(op => (
                                                <option key={op.value} value={op.value}>{op.label}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-secondary-700 mb-1">
                                            Threshold
                                        </label>
                                        <input
                                            type="number"
                                            value={formData.threshold}
                                            onChange={(e) => setFormData({ ...formData, threshold: Number(e.target.value) })}
                                            className="w-full px-3 py-2 text-sm border border-secondary-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                                            min="0"
                                            step="any"
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-secondary-700 mb-1">
                                            Duration (minutes)
                                        </label>
                                        <input
                                            type="number"
                                            value={formData.duration}
                                            onChange={(e) => setFormData({ ...formData, duration: Number(e.target.value) })}
                                            className="w-full px-3 py-2 text-sm border border-secondary-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                                            min="1"
                                            max="1440"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-secondary-700 mb-1">
                                            Cooldown (minutes)
                                        </label>
                                        <input
                                            type="number"
                                            value={formData.cooldownMinutes}
                                            onChange={(e) => setFormData({ ...formData, cooldownMinutes: Number(e.target.value) })}
                                            className="w-full px-3 py-2 text-sm border border-secondary-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                                            min="1"
                                            max="1440"
                                        />
                                    </div>
                                </div>

                                <div className="flex flex-wrap gap-4">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={formData.inAppEnabled}
                                            onChange={(e) => setFormData({ ...formData, inAppEnabled: e.target.checked })}
                                            className="w-4 h-4 text-primary-500 border-secondary-300 rounded focus:ring-primary-500"
                                        />
                                        <span className="text-sm text-secondary-700">In-App Notification</span>
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={formData.emailEnabled}
                                            onChange={(e) => setFormData({ ...formData, emailEnabled: e.target.checked })}
                                            className="w-4 h-4 text-primary-500 border-secondary-300 rounded focus:ring-primary-500"
                                        />
                                        <span className="text-sm text-secondary-700">Email Notification</span>
                                    </label>
                                </div>

                                <div className="flex justify-end gap-3 pt-2">
                                    <button
                                        type="button"
                                        onClick={resetForm}
                                        className="px-4 py-2 text-sm font-medium text-secondary-700 bg-white border border-secondary-200 rounded-lg hover:bg-secondary-50 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className="px-4 py-2 text-sm font-medium text-white bg-primary-500 rounded-lg hover:bg-primary-600 transition-colors disabled:opacity-50"
                                    >
                                        {isSubmitting ? 'Saving...' : editingAlert ? 'Update Alert' : 'Create Alert'}
                                    </button>
                                </div>
                            </form>
                        ) : (
                            <button
                                onClick={() => setShowCreateForm(true)}
                                className="w-full mb-4 px-4 py-3 border-2 border-dashed border-secondary-300 rounded-lg text-secondary-600 hover:border-primary-400 hover:text-primary-600 hover:bg-primary-50 transition-colors flex items-center justify-center gap-2"
                            >
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                </svg>
                                Create New Alert
                            </button>
                        )}

                        {/* Alert List */}
                        {isLoading ? (
                            <div className="space-y-3">
                                {[1, 2, 3].map(i => (
                                    <div key={i} className="animate-pulse h-16 bg-secondary-100 rounded-lg" />
                                ))}
                            </div>
                        ) : alerts.length === 0 ? (
                            <div className="text-center py-8 text-secondary-500">
                                <svg className="w-12 h-12 mx-auto mb-3 text-secondary-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                                </svg>
                                <p>No alerts configured</p>
                                <p className="text-sm mt-1">Create your first alert to get started</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {alerts.map(alert => (
                                    <div
                                        key={alert._id}
                                        className={cn(
                                            'p-4 rounded-lg border transition-colors',
                                            alert.enabled
                                                ? 'bg-white border-secondary-200'
                                                : 'bg-secondary-50 border-secondary-200 opacity-60'
                                        )}
                                    >
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <h4 className="font-medium text-secondary-900 truncate">{alert.name}</h4>
                                                    <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-secondary-100 text-secondary-600 capitalize">
                                                        {alert.type.replace('_', ' ')}
                                                    </span>
                                                </div>
                                                <p className="text-sm text-secondary-600">
                                                    {alert.conditions.metric.replace('_', ' ')} {OPERATORS.find(o => o.value === alert.conditions.operator)?.label} {alert.conditions.threshold}
                                                </p>
                                                {alert.lastTriggered && (
                                                    <p className="text-xs text-secondary-500 mt-1">
                                                        Last triggered: {formatDate(alert.lastTriggered)} ({alert.triggeredCount} times)
                                                    </p>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => handleToggleEnabled(alert)}
                                                    className={cn(
                                                        'relative w-10 h-5 rounded-full transition-colors',
                                                        alert.enabled ? 'bg-emerald-500' : 'bg-secondary-300'
                                                    )}
                                                >
                                                    <span
                                                        className={cn(
                                                            'absolute top-0.5 w-4 h-4 bg-white rounded-full transition-transform shadow-sm',
                                                            alert.enabled ? 'left-5' : 'left-0.5'
                                                        )}
                                                    />
                                                </button>
                                                <button
                                                    onClick={() => handleEdit(alert)}
                                                    className="p-1.5 text-secondary-500 hover:text-secondary-700 hover:bg-secondary-100 rounded transition-colors"
                                                >
                                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                    </svg>
                                                </button>
                                                <button
                                                    onClick={() => onDeleteAlert(alert._id)}
                                                    className="p-1.5 text-secondary-500 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                                                >
                                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                    </svg>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </>
                ) : (
                    /* Alert History Tab */
                    <div>
                        {isLoading ? (
                            <div className="space-y-3">
                                {[1, 2, 3].map(i => (
                                    <div key={i} className="animate-pulse h-20 bg-secondary-100 rounded-lg" />
                                ))}
                            </div>
                        ) : alertHistory.length === 0 ? (
                            <div className="text-center py-8 text-secondary-500">
                                <svg className="w-12 h-12 mx-auto mb-3 text-secondary-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                </svg>
                                <p>No alert history</p>
                                <p className="text-sm mt-1">Triggered alerts will appear here</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {alertHistory.map(history => (
                                    <div
                                        key={history._id}
                                        className="p-4 rounded-lg border border-secondary-200 bg-white"
                                    >
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <h4 className="font-medium text-secondary-900">{history.alertName}</h4>
                                                    <span className={cn(
                                                        'px-2 py-0.5 text-xs font-medium rounded-full border capitalize',
                                                        getStatusBadgeStyles(history.status)
                                                    )}>
                                                        {history.status}
                                                    </span>
                                                </div>
                                                <p className="text-sm text-secondary-600">{history.message}</p>
                                                <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs text-secondary-500">
                                                    <span>Triggered: {formatDate(history.triggeredAt)}</span>
                                                    {history.resolvedAt && (
                                                        <span>Resolved: {formatDate(history.resolvedAt)}</span>
                                                    )}
                                                    {history.acknowledgedBy && (
                                                        <span>By: {history.acknowledgedBy}</span>
                                                    )}
                                                </div>
                                                {history.notes && (
                                                    <p className="text-sm text-secondary-500 mt-2 italic">"{history.notes}"</p>
                                                )}
                                            </div>
                                            {history.status !== 'resolved' && (
                                                <div className="flex gap-2">
                                                    {history.status === 'triggered' && (
                                                        <button
                                                            onClick={() => onAcknowledgeAlert(history._id)}
                                                            className="px-3 py-1.5 text-xs font-medium text-amber-700 bg-amber-50 border border-amber-200 rounded-lg hover:bg-amber-100 transition-colors"
                                                        >
                                                            Acknowledge
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={() => onResolveAlert(history._id)}
                                                        className="px-3 py-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg hover:bg-emerald-100 transition-colors"
                                                    >
                                                        Resolve
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}

export default AlertConfigPanel
