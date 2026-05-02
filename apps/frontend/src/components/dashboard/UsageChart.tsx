import { useMemo } from 'react'
import { cn } from '@/utils/cn'

interface DataPoint {
    timestamp: string
    value: number
    label?: string
}

interface UsageChartProps {
    data: DataPoint[]
    title: string
    subtitle?: string
    valueFormatter?: (value: number) => string
    color?: 'primary' | 'success' | 'warning' | 'danger'
    height?: number
    showGrid?: boolean
    className?: string
}

export function UsageChart({
                               data,
                               title,
                               subtitle,
                               valueFormatter = (v) => v.toLocaleString(),
                               color = 'primary',
                               height = 200,
                               showGrid = true,
                               className
                           }: UsageChartProps) {
    const colorStyles = {
        primary: {
            line: 'stroke-primary-500',
            fill: 'fill-primary-500/20',
            dot: 'bg-primary-500'
        },
        success: {
            line: 'stroke-emerald-500',
            fill: 'fill-emerald-500/20',
            dot: 'bg-emerald-500'
        },
        warning: {
            line: 'stroke-amber-500',
            fill: 'fill-amber-500/20',
            dot: 'bg-amber-500'
        },
        danger: {
            line: 'stroke-red-500',
            fill: 'fill-red-500/20',
            dot: 'bg-red-500'
        }
    }

    const { path, area, maxValue, minValue, points } = useMemo(() => {
        if (data.length === 0) {
            return { path: '', area: '', maxValue: 0, minValue: 0, points: [] }
        }

        const values = data.map((d) => d.value)
        const max = Math.max(...values)
        const min = Math.min(...values)
        const range = max - min || 1

        const chartWidth = 100
        const chartHeight = 100
        const padding = 5

        const scaledPoints = data.map((d, i) => {
            const x = (i / (data.length - 1 || 1)) * (chartWidth - padding * 2) + padding
            const y = chartHeight - padding - ((d.value - min) / range) * (chartHeight - padding * 2)
            return { x, y, ...d }
        })

        const linePath = scaledPoints
            .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`)
            .join(' ')

        const areaPath = `${linePath} L ${scaledPoints[scaledPoints.length - 1]?.x || 0} ${chartHeight - padding} L ${padding} ${chartHeight - padding} Z`

        return {
            path: linePath,
            area: areaPath,
            maxValue: max,
            minValue: min,
            points: scaledPoints
        }
    }, [data])

    const gridLines = showGrid ? [0, 25, 50, 75, 100] : []

    return (
        <div className={cn('bg-white rounded-xl border border-secondary-200 p-5', className)}>
            <div className="mb-4">
                <h3 className="text-sm font-semibold text-secondary-900">{title}</h3>
                {subtitle && (
                    <p className="text-xs text-secondary-500 mt-0.5">{subtitle}</p>
                )}
            </div>

            <div className="relative" style={{ height }}>
                {data.length === 0 ? (
                    <div className="absolute inset-0 flex items-center justify-center text-secondary-400 text-sm">
                        No data available
                    </div>
                ) : (
                    <>
                        {/* Y-axis labels */}
                        <div className="absolute left-0 top-0 bottom-0 w-12 flex flex-col justify-between text-xs text-secondary-400 pr-2">
                            <span>{valueFormatter(maxValue)}</span>
                            <span>{valueFormatter((maxValue + minValue) / 2)}</span>
                            <span>{valueFormatter(minValue)}</span>
                        </div>

                        {/* Chart area */}
                        <div className="ml-12 h-full">
                            <svg
                                viewBox="0 0 100 100"
                                preserveAspectRatio="none"
                                className="w-full h-full"
                            >
                                {/* Grid lines */}
                                {showGrid && gridLines.map((y) => (
                                    <line
                                        key={y}
                                        x1="5"
                                        y1={y}
                                        x2="95"
                                        y2={y}
                                        className="stroke-secondary-100"
                                        strokeWidth="0.5"
                                    />
                                ))}

                                {/* Area fill */}
                                <path
                                    d={area}
                                    className={colorStyles[color].fill}
                                />

                                {/* Line */}
                                <path
                                    d={path}
                                    fill="none"
                                    className={colorStyles[color].line}
                                    strokeWidth="2"
                                    vectorEffect="non-scaling-stroke"
                                />

                                {/* Data points */}
                                {points.map((point, i) => (
                                    <circle
                                        key={i}
                                        cx={point.x}
                                        cy={point.y}
                                        r="1.5"
                                        className={cn(colorStyles[color].line, 'fill-white')}
                                        strokeWidth="1"
                                    />
                                ))}
                            </svg>
                        </div>

                        {/* X-axis labels */}
                        <div className="ml-12 mt-2 flex justify-between text-xs text-secondary-400">
                            {data.length > 0 && (
                                <>
                                    <span>{data[0]?.label || formatTime(data[0]?.timestamp)}</span>
                                    {data.length > 2 && (
                                        <span>
                                            {data[Math.floor(data.length / 2)]?.label ||
                                                formatTime(data[Math.floor(data.length / 2)]?.timestamp)}
                                        </span>
                                    )}
                                    <span>
                                        {data[data.length - 1]?.label ||
                                            formatTime(data[data.length - 1]?.timestamp)}
                                    </span>
                                </>
                            )}
                        </div>
                    </>
                )}
            </div>

            {/* Legend */}
            <div className="mt-4 flex items-center gap-4 text-xs">
                <div className="flex items-center gap-1.5">
                    <div className={cn('w-2 h-2 rounded-full', colorStyles[color].dot)} />
                    <span className="text-secondary-600">{title}</span>
                </div>
                {data.length > 0 && (
                    <span className="text-secondary-400">
                        Latest: {valueFormatter(data[data.length - 1]?.value || 0)}
                    </span>
                )}
            </div>
        </div>
    )
}

function formatTime(timestamp: string | undefined): string {
    if (!timestamp) return ''
    const date = new Date(timestamp)
    return date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
    })
}

// Bar Chart component for distribution data
interface BarChartProps {
    data: { label: string; value: number; color?: string }[]
    title: string
    subtitle?: string
    valueFormatter?: (value: number) => string
    className?: string
}

export function BarChart({
                             data,
                             title,
                             subtitle,
                             valueFormatter = (v) => v.toLocaleString(),
                             className
                         }: BarChartProps) {
    const maxValue = Math.max(...data.map((d) => d.value), 1)

    const defaultColors = [
        'bg-primary-500',
        'bg-emerald-500',
        'bg-amber-500',
        'bg-red-500',
        'bg-violet-500',
        'bg-cyan-500'
    ]

    return (
        <div className={cn('bg-white rounded-xl border border-secondary-200 p-5', className)}>
            <div className="mb-4">
                <h3 className="text-sm font-semibold text-secondary-900">{title}</h3>
                {subtitle && (
                    <p className="text-xs text-secondary-500 mt-0.5">{subtitle}</p>
                )}
            </div>

            <div className="space-y-3">
                {data.map((item, index) => (
                    <div key={item.label}>
                        <div className="flex items-center justify-between text-sm mb-1">
                            <span className="text-secondary-600 truncate flex-1 mr-2">
                                {item.label}
                            </span>
                            <span className="text-secondary-900 font-medium">
                                {valueFormatter(item.value)}
                            </span>
                        </div>
                        <div className="h-2 bg-secondary-100 rounded-full overflow-hidden">
                            <div
                                className={cn(
                                    'h-full rounded-full transition-all duration-500',
                                    item.color || defaultColors[index % defaultColors.length]
                                )}
                                style={{ width: `${(item.value / maxValue) * 100}%` }}
                            />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}

// Donut Chart component for percentage data
interface DonutChartProps {
    data: { label: string; value: number; color: string }[]
    title: string
    centerLabel?: string
    centerValue?: string
    className?: string
}

export function DonutChart({
                               data,
                               title,
                               centerLabel,
                               centerValue,
                               className
                           }: DonutChartProps) {
    const total = data.reduce((sum, d) => sum + d.value, 0) || 1
    let cumulativePercent = 0

    const segments = data.map((item) => {
        const percent = (item.value / total) * 100
        const startPercent = cumulativePercent
        cumulativePercent += percent

        const startAngle = (startPercent / 100) * 360
        const endAngle = (cumulativePercent / 100) * 360
        const largeArcFlag = percent > 50 ? 1 : 0

        const startRad = ((startAngle - 90) * Math.PI) / 180
        const endRad = ((endAngle - 90) * Math.PI) / 180

        const x1 = 50 + 40 * Math.cos(startRad)
        const y1 = 50 + 40 * Math.sin(startRad)
        const x2 = 50 + 40 * Math.cos(endRad)
        const y2 = 50 + 40 * Math.sin(endRad)

        return {
            ...item,
            percent,
            path: `M 50 50 L ${x1} ${y1} A 40 40 0 ${largeArcFlag} 1 ${x2} ${y2} Z`
        }
    })

    return (
        <div className={cn('bg-white rounded-xl border border-secondary-200 p-5', className)}>
            <h3 className="text-sm font-semibold text-secondary-900 mb-4">{title}</h3>

            <div className="flex items-center gap-6">
                {/* Donut */}
                <div className="relative w-32 h-32 flex-shrink-0">
                    <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                        {segments.map((segment, i) => (
                            <path
                                key={i}
                                d={segment.path}
                                className={segment.color}
                                fill="currentColor"
                            />
                        ))}
                        {/* Center hole */}
                        <circle cx="50" cy="50" r="25" fill="white" />
                    </svg>
                    {/* Center text */}
                    {(centerLabel || centerValue) && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                            {centerValue && (
                                <span className="text-lg font-bold text-secondary-900">
                                    {centerValue}
                                </span>
                            )}
                            {centerLabel && (
                                <span className="text-xs text-secondary-500">{centerLabel}</span>
                            )}
                        </div>
                    )}
                </div>

                {/* Legend */}
                <div className="flex-1 space-y-2">
                    {segments.map((segment, i) => (
                        <div key={i} className="flex items-center gap-2">
                            <div className={cn('w-3 h-3 rounded-sm', segment.color)} />
                            <span className="text-sm text-secondary-600 flex-1">
                                {segment.label}
                            </span>
                            <span className="text-sm font-medium text-secondary-900">
                                {segment.percent.toFixed(1)}%
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}

export default UsageChart
