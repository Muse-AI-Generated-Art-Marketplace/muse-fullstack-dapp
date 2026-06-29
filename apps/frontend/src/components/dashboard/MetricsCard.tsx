import { cn } from '@/utils/cn'

interface MetricsCardProps {
    title: string
    value: string | number
    subtitle?: string
    icon?: React.ReactNode
    trend?: {
        value: number
        isPositive: boolean
    }
    variant?: 'default' | 'success' | 'warning' | 'danger'
    className?: string
}

export function MetricsCard({
                                title,
                                value,
                                subtitle,
                                icon,
                                trend,
                                variant = 'default',
                                className
                            }: MetricsCardProps) {
    const variantStyles = {
        default: 'bg-white border-secondary-200',
        success: 'bg-emerald-50 border-emerald-200',
        warning: 'bg-amber-50 border-amber-200',
        danger: 'bg-red-50 border-red-200'
    }

    const iconStyles = {
        default: 'bg-secondary-100 text-secondary-600',
        success: 'bg-emerald-100 text-emerald-600',
        warning: 'bg-amber-100 text-amber-600',
        danger: 'bg-red-100 text-red-600'
    }

    return (
        <div
            className={cn(
                'rounded-xl border p-5 transition-all duration-200 hover:shadow-md',
                variantStyles[variant],
                className
            )}
        >
            <div className="flex items-start justify-between">
                <div className="flex-1">
                    <p className="text-sm font-medium text-secondary-500 mb-1">
                        {title}
                    </p>
                    <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-bold text-secondary-900">
                            {typeof value === 'number' ? value.toLocaleString() : value}
                        </span>
                        {trend && (
                            <span
                                className={cn(
                                    'text-sm font-medium flex items-center gap-0.5',
                                    trend.isPositive ? 'text-emerald-600' : 'text-red-600'
                                )}
                            >
                                <svg
                                    className={cn('w-4 h-4', !trend.isPositive && 'rotate-180')}
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M5 10l7-7m0 0l7 7m-7-7v18"
                                    />
                                </svg>
                                {Math.abs(trend.value)}%
                            </span>
                        )}
                    </div>
                    {subtitle && (
                        <p className="text-xs text-secondary-400 mt-1">
                            {subtitle}
                        </p>
                    )}
                </div>
                {icon && (
                    <div
                        className={cn(
                            'w-10 h-10 rounded-lg flex items-center justify-center',
                            iconStyles[variant]
                        )}
                    >
                        {icon}
                    </div>
                )}
            </div>
        </div>
    )
}

export default MetricsCard
