import { useState } from 'react'
import { cn } from '@/utils/cn'
import type { UserRateLimitInfo } from '@/services/dashboardService'

interface UserRateLimitTableProps {
    users: UserRateLimitInfo[]
    total: number
    page: number
    limit: number
    onPageChange: (page: number) => void
    onSearch: (search: string) => void
    onTierFilter: (tier: string | undefined) => void
    isLoading?: boolean
    className?: string
}

export function UserRateLimitTable({
                                       users,
                                       total,
                                       page,
                                       limit,
                                       onPageChange,
                                       onSearch,
                                       onTierFilter,
                                       isLoading = false,
                                       className
                                   }: UserRateLimitTableProps) {
    const [searchValue, setSearchValue] = useState('')
    const [selectedTier, setSelectedTier] = useState<string>('')

    const totalPages = Math.ceil(total / limit)

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault()
        onSearch(searchValue)
    }

    const handleTierChange = (tier: string) => {
        setSelectedTier(tier)
        onTierFilter(tier || undefined)
    }

    const getTierBadgeStyles = (tier: string) => {
        switch (tier) {
            case 'premium':
                return 'bg-violet-100 text-violet-700 border-violet-200'
            case 'verified':
                return 'bg-emerald-100 text-emerald-700 border-emerald-200'
            default:
                return 'bg-secondary-100 text-secondary-700 border-secondary-200'
        }
    }

    const getUsageBarColor = (current: number, max: number) => {
        const percentage = (current / max) * 100
        if (percentage >= 90) return 'bg-red-500'
        if (percentage >= 70) return 'bg-amber-500'
        return 'bg-emerald-500'
    }

    const formatAddress = (address: string) => {
        if (address.length <= 12) return address
        return `${address.slice(0, 6)}...${address.slice(-4)}`
    }

    const formatDate = (dateString: string) => {
        const date = new Date(dateString)
        return date.toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })
    }

    return (
        <div className={cn('bg-white rounded-xl border border-secondary-200', className)}>
            {/* Header & Filters */}
            <div className="p-5 border-b border-secondary-200">
                <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                    <div>
                        <h3 className="text-lg font-semibold text-secondary-900">
                            User Rate Limits
                        </h3>
                        <p className="text-sm text-secondary-500 mt-0.5">
                            {total} total users
                        </p>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                        {/* Search */}
                        <form onSubmit={handleSearch} className="flex gap-2">
                            <input
                                type="text"
                                placeholder="Search address..."
                                value={searchValue}
                                onChange={(e) => setSearchValue(e.target.value)}
                                className="px-3 py-2 text-sm border border-secondary-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent w-full sm:w-48"
                            />
                            <button
                                type="submit"
                                className="px-3 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
                            >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                            </button>
                        </form>

                        {/* Tier Filter */}
                        <select
                            value={selectedTier}
                            onChange={(e) => handleTierChange(e.target.value)}
                            className="px-3 py-2 text-sm border border-secondary-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white"
                        >
                            <option value="">All Tiers</option>
                            <option value="anonymous">Anonymous</option>
                            <option value="verified">Verified</option>
                            <option value="premium">Premium</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead className="bg-secondary-50 border-b border-secondary-200">
                    <tr>
                        <th className="px-5 py-3 text-left text-xs font-semibold text-secondary-600 uppercase tracking-wider">
                            User
                        </th>
                        <th className="px-5 py-3 text-left text-xs font-semibold text-secondary-600 uppercase tracking-wider">
                            Tier
                        </th>
                        <th className="px-5 py-3 text-left text-xs font-semibold text-secondary-600 uppercase tracking-wider">
                            Standard API
                        </th>
                        <th className="px-5 py-3 text-left text-xs font-semibold text-secondary-600 uppercase tracking-wider">
                            AI API
                        </th>
                        <th className="px-5 py-3 text-left text-xs font-semibold text-secondary-600 uppercase tracking-wider">
                            Today
                        </th>
                        <th className="px-5 py-3 text-left text-xs font-semibold text-secondary-600 uppercase tracking-wider">
                            Last Request
                        </th>
                    </tr>
                    </thead>
                    <tbody className="divide-y divide-secondary-100">
                    {isLoading ? (
                        <tr>
                            <td colSpan={6} className="px-5 py-8 text-center">
                                <div className="flex items-center justify-center gap-2 text-secondary-500">
                                    <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                    </svg>
                                    Loading...
                                </div>
                            </td>
                        </tr>
                    ) : users.length === 0 ? (
                        <tr>
                            <td colSpan={6} className="px-5 py-8 text-center text-secondary-500">
                                No users found
                            </td>
                        </tr>
                    ) : (
                        users.map((user) => (
                            <tr key={user.userAddress} className="hover:bg-secondary-50 transition-colors">
                                <td className="px-5 py-4">
                                    <div>
                                            <span className="font-mono text-sm text-secondary-900">
                                                {formatAddress(user.userAddress)}
                                            </span>
                                        {user.userId && (
                                            <p className="text-xs text-secondary-500 mt-0.5">
                                                {user.userId}
                                            </p>
                                        )}
                                    </div>
                                </td>
                                <td className="px-5 py-4">
                                        <span className={cn(
                                            'px-2 py-1 text-xs font-medium rounded-full border capitalize',
                                            getTierBadgeStyles(user.tier)
                                        )}>
                                            {user.tier}
                                        </span>
                                </td>
                                <td className="px-5 py-4">
                                    <div className="space-y-1">
                                        <div className="flex items-center justify-between text-xs">
                                                <span className="text-secondary-600">
                                                    {user.standardUsage} / {user.standardLimit}
                                                </span>
                                            <span className="text-secondary-400">
                                                    {((user.standardUsage / user.standardLimit) * 100).toFixed(0)}%
                                                </span>
                                        </div>
                                        <div className="h-1.5 bg-secondary-100 rounded-full overflow-hidden">
                                            <div
                                                className={cn('h-full rounded-full transition-all', getUsageBarColor(user.standardUsage, user.standardLimit))}
                                                style={{ width: `${Math.min((user.standardUsage / user.standardLimit) * 100, 100)}%` }}
                                            />
                                        </div>
                                    </div>
                                </td>
                                <td className="px-5 py-4">
                                    <div className="space-y-1">
                                        <div className="flex items-center justify-between text-xs">
                                                <span className="text-secondary-600">
                                                    {user.aiUsage} / {user.aiLimit}
                                                </span>
                                            <span className="text-secondary-400">
                                                    {((user.aiUsage / user.aiLimit) * 100).toFixed(0)}%
                                                </span>
                                        </div>
                                        <div className="h-1.5 bg-secondary-100 rounded-full overflow-hidden">
                                            <div
                                                className={cn('h-full rounded-full transition-all', getUsageBarColor(user.aiUsage, user.aiLimit))}
                                                style={{ width: `${Math.min((user.aiUsage / user.aiLimit) * 100, 100)}%` }}
                                            />
                                        </div>
                                    </div>
                                </td>
                                <td className="px-5 py-4">
                                    <div className="text-sm">
                                            <span className="text-secondary-900 font-medium">
                                                {user.totalRequestsToday.toLocaleString()}
                                            </span>
                                        {user.rateLimitedToday > 0 && (
                                            <span className="text-red-500 text-xs ml-1">
                                                    ({user.rateLimitedToday} blocked)
                                                </span>
                                        )}
                                    </div>
                                </td>
                                <td className="px-5 py-4 text-sm text-secondary-600">
                                    {formatDate(user.lastRequest)}
                                </td>
                            </tr>
                        ))
                    )}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="px-5 py-4 border-t border-secondary-200 flex items-center justify-between">
                    <div className="text-sm text-secondary-500">
                        Showing {((page - 1) * limit) + 1} to {Math.min(page * limit, total)} of {total}
                    </div>
                    <div className="flex gap-1">
                        <button
                            onClick={() => onPageChange(page - 1)}
                            disabled={page === 1}
                            className="px-3 py-1.5 text-sm rounded-md border border-secondary-200 hover:bg-secondary-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            Previous
                        </button>
                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                            let pageNum
                            if (totalPages <= 5) {
                                pageNum = i + 1
                            } else if (page <= 3) {
                                pageNum = i + 1
                            } else if (page >= totalPages - 2) {
                                pageNum = totalPages - 4 + i
                            } else {
                                pageNum = page - 2 + i
                            }
                            return (
                                <button
                                    key={pageNum}
                                    onClick={() => onPageChange(pageNum)}
                                    className={cn(
                                        'px-3 py-1.5 text-sm rounded-md border transition-colors',
                                        page === pageNum
                                            ? 'bg-primary-500 text-white border-primary-500'
                                            : 'border-secondary-200 hover:bg-secondary-50'
                                    )}
                                >
                                    {pageNum}
                                </button>
                            )
                        })}
                        <button
                            onClick={() => onPageChange(page + 1)}
                            disabled={page === totalPages}
                            className="px-3 py-1.5 text-sm rounded-md border border-secondary-200 hover:bg-secondary-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            Next
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}

export default UserRateLimitTable
