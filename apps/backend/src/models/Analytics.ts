// Analytics data types and interfaces

export interface DashboardMetrics {
  totalUsers: number
  newUsersToday: number
  newUsersThisWeek: number
  newUsersThisMonth: number
  totalTransactions: number
  transactionsToday: number
  totalRevenue: string
  revenueToday: string
  activeUsers: number
  listedArtworks: number
  soldArtworks: number
}

export interface MarketplaceMetrics {
  totalListings: number
  activeListings: number
  soldItems: number
  averagePrice: string
  totalVolume: string
  volumeByCategory: Array<{
    category: string
    volume: string
    count: number
    averagePrice: string
  }>
  topCategories: Array<{
    category: string
    count: number
    percentage: number
  }>
}

export interface UserAnalytics {
  totalUsers: number
  newUsers: {
    daily: Array<{
      date: string
      count: number
    }>
    weekly: Array<{
      week: string
      count: number
    }>
    monthly: Array<{
      month: string
      count: number
    }>
  }
  retentionRate: number
  activeUsers: {
    daily: number
    weekly: number
    monthly: number
  }
  topUsers: Array<{
    address: string
    username?: string
    totalSales: string
    artworksCreated: number
    joinDate: Date
  }>
  userTiers: {
    free: number
    pro: number
    premium: number
  }
}

export interface TransactionMetrics {
  totalTransactions: number
  volumeOverTime: Array<{
    date: string
    volume: string
    count: number
    averageValue: string
  }>
  successRate: number
  averageTransactionValue: string
  transactionsByType: Array<{
    type: 'mint' | 'sale' | 'transfer' | 'bid' | 'cancel'
    count: number
    volume: string
    percentage: number
  }>
  transactionsByStatus: Array<{
    status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled'
    count: number
    percentage: number
  }>
}

export interface RevenueAnalytics {
  totalRevenue: string
  revenueByPeriod: {
    daily: Array<{
      date: string
      revenue: string
      transactions: number
    }>
    weekly: Array<{
      week: string
      revenue: string
      transactions: number
    }>
    monthly: Array<{
      month: string
      revenue: string
      transactions: number
    }>
  }
  revenueByCategory: Array<{
    category: string
    revenue: string
    percentage: number
    count: number
  }>
  growthRate: {
    daily: number
    weekly: number
    monthly: number
  }
  averageRevenuePerTransaction: string
}

export interface AnalyticsResponse<T> {
  success: boolean
  data: T
  meta: {
    cached: boolean
    generatedAt: string
    period?: string
    filters?: {
      startDate?: string
      endDate?: string
    }
  }
}

export interface AnalyticsQueryParams {
  startDate?: string
  endDate?: string
  period?: '1d' | '7d' | '30d' | '90d' | '1y'
  category?: string
  limit?: number
  offset?: number
}

export interface CacheEntry<T> {
  data: T
  timestamp: number
  ttl: number
}
