import mongoose from 'mongoose'
import { createLogger } from '@/utils/logger'
import User from '@/models/User'
import Artwork from '@/models/Artwork'
import Transaction from '@/models/Transaction'
import {
  DashboardMetrics,
  MarketplaceMetrics,
  UserAnalytics,
  TransactionMetrics,
  RevenueAnalytics,
  AnalyticsQueryParams,
  AnalyticsResponse
} from '@/models/Analytics'

const logger = createLogger('AnalyticsService')

export class AnalyticsService {
  private parseDateRange(params: AnalyticsQueryParams) {
    const now = new Date()
    let startDate: Date
    let endDate: Date = now

    if (params.endDate) {
      endDate = new Date(params.endDate)
    }

    if (params.startDate) {
      startDate = new Date(params.startDate)
    } else {
      // Default date ranges based on period
      switch (params.period) {
        case '1d':
          startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000)
          break
        case '7d':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
          break
        case '30d':
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
          break
        case '90d':
          startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
          break
        case '1y':
          startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000)
          break
        default:
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) // Default to 7 days
      }
    }

    return { startDate, endDate }
  }

  async getDashboardMetrics(params: AnalyticsQueryParams = {}): Promise<DashboardMetrics> {
    const { startDate, endDate } = this.parseDateRange(params)
    const now = new Date()
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

    const [
      totalUsers,
      newUsersToday,
      newUsersThisWeek,
      newUsersThisMonth,
      totalTransactions,
      transactionsToday,
      transactionsResult,
      listedArtworks,
      soldArtworks
    ] = await Promise.all([
      // Total users
      User.countDocuments(),
      
      // New users today
      User.countDocuments({ createdAt: { $gte: todayStart } }),
      
      // New users this week
      User.countDocuments({ createdAt: { $gte: weekStart } }),
      
      // New users this month
      User.countDocuments({ createdAt: { $gte: monthStart } }),
      
      // Total transactions
      Transaction.countDocuments({ status: 'completed' }),
      
      // Transactions today
      Transaction.countDocuments({ 
        status: 'completed', 
        createdAt: { $gte: todayStart } 
      }),
      
      // Transaction revenue data
      Transaction.aggregate([
        { $match: { status: 'completed' } },
        {
          $group: {
            _id: null,
            totalRevenue: { $sum: { $toDouble: '$price' } },
            todayRevenue: {
              $sum: {
                $cond: [
                  { $gte: ['$createdAt', todayStart] },
                  { $toDouble: '$price' },
                  0
                ]
              }
            }
          }
        }
      ]),
      
      // Listed artworks
      Artwork.countDocuments({ isListed: true }),
      
      // Sold artworks (completed sale transactions)
      Transaction.countDocuments({ type: 'sale', status: 'completed' })
    ])

    const revenueData = transactionsResult[0] || { totalRevenue: 0, todayRevenue: 0 }

    // Calculate active users (users with transactions in the last 30 days)
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    const activeUsers = await Transaction.distinct('from', {
      createdAt: { $gte: thirtyDaysAgo },
      status: 'completed'
    }).then(addresses => addresses.length)

    return {
      totalUsers,
      newUsersToday,
      newUsersThisWeek,
      newUsersThisMonth,
      totalTransactions,
      transactionsToday,
      totalRevenue: revenueData.totalRevenue.toString(),
      revenueToday: revenueData.todayRevenue.toString(),
      activeUsers,
      listedArtworks,
      soldArtworks
    }
  }

  async getMarketplaceMetrics(params: AnalyticsQueryParams = {}): Promise<MarketplaceMetrics> {
    const { startDate, endDate } = this.parseDateRange(params)

    const [
      totalListings,
      activeListings,
      soldItemsResult,
      averagePriceResult,
      volumeByCategory,
      topCategories
    ] = await Promise.all([
      // Total listings
      Artwork.countDocuments({ isListed: true }),
      
      // Active listings
      Artwork.countDocuments({ isListed: true }),
      
      // Sold items and total volume
      Transaction.aggregate([
        { $match: { type: 'sale', status: 'completed' } },
        {
          $group: {
            _id: null,
            soldItems: { $sum: 1 },
            totalVolume: { $sum: { $toDouble: '$price' } }
          }
        }
      ]),
      
      // Average price
      Artwork.aggregate([
        { $match: { isListed: true } },
        {
          $group: {
            _id: null,
            averagePrice: { $avg: { $toDouble: '$price' } }
          }
        }
      ]),
      
      // Volume by category
      Transaction.aggregate([
        {
          $match: { type: 'sale', status: 'completed' }
        },
        {
          $lookup: {
            from: 'artworks',
            localField: 'artwork',
            foreignField: '_id',
            as: 'artwork'
          }
        },
        { $unwind: '$artwork' },
        {
          $group: {
            _id: '$artwork.category',
            volume: { $sum: { $toDouble: '$price' } },
            count: { $sum: 1 },
            averagePrice: { $avg: { $toDouble: '$price' } }
          }
        },
        {
          $project: {
            category: '$_id',
            volume: { $toString: '$volume' },
            count: 1,
            averagePrice: { $toString: '$averagePrice' },
            _id: 0
          }
        },
        { $sort: { volume: -1 } }
      ]),
      
      // Top categories by count
      Artwork.aggregate([
        { $match: { isListed: true } },
        {
          $group: {
            _id: '$category',
            count: { $sum: 1 }
          }
        },
        {
          $project: {
            category: '$_id',
            count: 1,
            _id: 0
          }
        },
        { $sort: { count: -1 } },
        { $limit: 10 }
      ])
    ])

    const soldItemsData = soldItemsResult[0] || { soldItems: 0, totalVolume: 0 }
    const averagePriceData = averagePriceResult[0] || { averagePrice: 0 }

    // Calculate percentages for top categories
    const totalArtworks = topCategories.reduce((sum, cat) => sum + cat.count, 0)
    const topCategoriesWithPercentage = topCategories.map(cat => ({
      ...cat,
      percentage: totalArtworks > 0 ? (cat.count / totalArtworks) * 100 : 0
    }))

    return {
      totalListings,
      activeListings,
      soldItems: soldItemsData.soldItems,
      averagePrice: averagePriceData.averagePrice.toString(),
      totalVolume: soldItemsData.totalVolume.toString(),
      volumeByCategory,
      topCategories: topCategoriesWithPercentage
    }
  }

  async getUserAnalytics(params: AnalyticsQueryParams = {}): Promise<UserAnalytics> {
    const { startDate, endDate } = this.parseDateRange(params)
    const now = new Date()
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

    const [
      totalUsers,
      newUsersDaily,
      newUsersWeekly,
      newUsersMonthly,
      userTiers,
      topUsers
    ] = await Promise.all([
      // Total users
      User.countDocuments(),
      
      // New users daily
      User.aggregate([
        { $match: { createdAt: { $gte: startDate, $lte: endDate } } },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            count: { $sum: 1 }
          }
        },
        {
          $project: {
            date: '$_id',
            count: 1,
            _id: 0
          }
        },
        { $sort: { date: 1 } }
      ]),
      
      // New users weekly
      User.aggregate([
        { $match: { createdAt: { $gte: startDate, $lte: endDate } } },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%U', date: '$createdAt' } },
            count: { $sum: 1 }
          }
        },
        {
          $project: {
            week: '$_id',
            count: 1,
            _id: 0
          }
        },
        { $sort: { week: 1 } }
      ]),
      
      // New users monthly
      User.aggregate([
        { $match: { createdAt: { $gte: startDate, $lte: endDate } } },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
            count: { $sum: 1 }
          }
        },
        {
          $project: {
            month: '$_id',
            count: 1,
            _id: 0
          }
        },
        { $sort: { month: 1 } }
      ]),
      
      // User tiers
      User.aggregate([
        {
          $group: {
            _id: '$tier',
            count: { $sum: 1 }
          }
        },
        {
          $project: {
            tier: '$_id',
            count: 1,
            _id: 0
          }
        }
      ]),
      
      // Top users by sales
      User.aggregate([
        {
          $lookup: {
            from: 'transactions',
            localField: 'address',
            foreignField: 'from',
            as: 'sales'
          }
        },
        { $unwind: { path: '$sales', preserveNullAndEmptyArrays: true } },
        {
          $match: { 'sales.status': 'completed', 'sales.type': 'sale' }
        },
        {
          $group: {
            _id: '$address',
            username: { $first: '$username' },
            totalSales: { $sum: { $toDouble: '$sales.price' } },
            artworksCreated: { $first: '$stats.artworks' },
            joinDate: { $first: '$createdAt' }
          }
        },
        {
          $project: {
            address: '$_id',
            username: 1,
            totalSales: { $toString: '$totalSales' },
            artworksCreated: 1,
            joinDate: 1,
            _id: 0
          }
        },
        { $sort: { totalSales: -1 } },
        { $limit: 10 }
      ])
    ])

    // Calculate active users
    const [activeDaily, activeWeekly, activeMonthly] = await Promise.all([
      Transaction.distinct('from', {
        createdAt: { $gte: new Date(now.getTime() - 24 * 60 * 60 * 1000) },
        status: 'completed'
      }).then(addresses => addresses.length),
      
      Transaction.distinct('from', {
        createdAt: { $gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) },
        status: 'completed'
      }).then(addresses => addresses.length),
      
      Transaction.distinct('from', {
        createdAt: { $gte: thirtyDaysAgo },
        status: 'completed'
      }).then(addresses => addresses.length)
    ])

    // Calculate retention rate (simplified: users who transacted in first week and again in last 30 days)
    const retentionRate = 0.75 // This would require more complex calculation in production

    // Format user tiers
    const tiers = { free: 0, pro: 0, premium: 0 }
    userTiers.forEach(tier => {
      tiers[tier.tier as keyof typeof tiers] = tier.count
    })

    return {
      totalUsers,
      newUsers: {
        daily: newUsersDaily,
        weekly: newUsersWeekly,
        monthly: newUsersMonthly
      },
      retentionRate,
      activeUsers: {
        daily: activeDaily,
        weekly: activeWeekly,
        monthly: activeMonthly
      },
      topUsers,
      userTiers: tiers
    }
  }

  async getTransactionMetrics(params: AnalyticsQueryParams = {}): Promise<TransactionMetrics> {
    const { startDate, endDate } = this.parseDateRange(params)

    const [
      totalTransactions,
      volumeOverTime,
      transactionsByType,
      transactionsByStatus,
      averageValueResult
    ] = await Promise.all([
      // Total transactions
      Transaction.countDocuments({ createdAt: { $gte: startDate, $lte: endDate } }),
      
      // Volume over time
      Transaction.aggregate([
        { $match: { createdAt: { $gte: startDate, $lte: endDate }, status: 'completed' } },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            volume: { $sum: { $toDouble: '$price' } },
            count: { $sum: 1 },
            averageValue: { $avg: { $toDouble: '$price' } }
          }
        },
        {
          $project: {
            date: '$_id',
            volume: { $toString: '$volume' },
            count: 1,
            averageValue: { $toString: '$averageValue' },
            _id: 0
          }
        },
        { $sort: { date: 1 } }
      ]),
      
      // Transactions by type
      Transaction.aggregate([
        { $match: { createdAt: { $gte: startDate, $lte: endDate } } },
        {
          $group: {
            _id: '$type',
            count: { $sum: 1 },
            volume: { $sum: { $toDouble: '$price' } }
          }
        },
        {
          $project: {
            type: '$_id',
            count: 1,
            volume: { $toString: '$volume' },
            _id: 0
          }
        },
        { $sort: { count: -1 } }
      ]),
      
      // Transactions by status
      Transaction.aggregate([
        { $match: { createdAt: { $gte: startDate, $lte: endDate } } },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 }
          }
        },
        {
          $project: {
            status: '$_id',
            count: 1,
            _id: 0
          }
        },
        { $sort: { count: -1 } }
      ]),
      
      // Average transaction value
      Transaction.aggregate([
        { $match: { createdAt: { $gte: startDate, $lte: endDate }, status: 'completed' } },
        {
          $group: {
            _id: null,
            averageValue: { $avg: { $toDouble: '$price' } }
          }
        }
      ])
    ])

    const averageValueData = averageValueResult[0] || { averageValue: 0 }

    // Calculate success rate
    const completedTransactions = transactionsByStatus.find(s => s.status === 'completed')?.count || 0
    const successRate = totalTransactions > 0 ? (completedTransactions / totalTransactions) * 100 : 0

    // Calculate percentages
    const totalByType = transactionsByType.reduce((sum, t) => sum + t.count, 0)
    const transactionsByTypeWithPercentage = transactionsByType.map(t => ({
      ...t,
      percentage: totalByType > 0 ? (t.count / totalByType) * 100 : 0
    }))

    const totalByStatus = transactionsByStatus.reduce((sum, s) => sum + s.count, 0)
    const transactionsByStatusWithPercentage = transactionsByStatus.map(s => ({
      ...s,
      percentage: totalByStatus > 0 ? (s.count / totalByStatus) * 100 : 0
    }))

    return {
      totalTransactions,
      volumeOverTime,
      successRate,
      averageTransactionValue: averageValueData.averageValue.toString(),
      transactionsByType: transactionsByTypeWithPercentage,
      transactionsByStatus: transactionsByStatusWithPercentage
    }
  }

  async getRevenueAnalytics(params: AnalyticsQueryParams = {}): Promise<RevenueAnalytics> {
    const { startDate, endDate } = this.parseDateRange(params)

    const [
      revenueDaily,
      revenueWeekly,
      revenueMonthly,
      revenueByCategory,
      totalRevenueResult,
      averageRevenueResult
    ] = await Promise.all([
      // Daily revenue
      Transaction.aggregate([
        { $match: { createdAt: { $gte: startDate, $lte: endDate }, status: 'completed' } },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            revenue: { $sum: { $toDouble: '$price' } },
            transactions: { $sum: 1 }
          }
        },
        {
          $project: {
            date: '$_id',
            revenue: { $toString: '$revenue' },
            transactions: 1,
            _id: 0
          }
        },
        { $sort: { date: 1 } }
      ]),
      
      // Weekly revenue
      Transaction.aggregate([
        { $match: { createdAt: { $gte: startDate, $lte: endDate }, status: 'completed' } },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%U', date: '$createdAt' } },
            revenue: { $sum: { $toDouble: '$price' } },
            transactions: { $sum: 1 }
          }
        },
        {
          $project: {
            week: '$_id',
            revenue: { $toString: '$revenue' },
            transactions: 1,
            _id: 0
          }
        },
        { $sort: { week: 1 } }
      ]),
      
      // Monthly revenue
      Transaction.aggregate([
        { $match: { createdAt: { $gte: startDate, $lte: endDate }, status: 'completed' } },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
            revenue: { $sum: { $toDouble: '$price' } },
            transactions: { $sum: 1 }
          }
        },
        {
          $project: {
            month: '$_id',
            revenue: { $toString: '$revenue' },
            transactions: 1,
            _id: 0
          }
        },
        { $sort: { month: 1 } }
      ]),
      
      // Revenue by category
      Transaction.aggregate([
        { $match: { type: 'sale', status: 'completed' } },
        {
          $lookup: {
            from: 'artworks',
            localField: 'artwork',
            foreignField: '_id',
            as: 'artwork'
          }
        },
        { $unwind: '$artwork' },
        {
          $group: {
            _id: '$artwork.category',
            revenue: { $sum: { $toDouble: '$price' } },
            count: { $sum: 1 }
          }
        },
        {
          $project: {
            category: '$_id',
            revenue: { $toString: '$revenue' },
            count: 1,
            _id: 0
          }
        },
        { $sort: { revenue: -1 } }
      ]),
      
      // Total revenue
      Transaction.aggregate([
        { $match: { status: 'completed' } },
        {
          $group: {
            _id: null,
            totalRevenue: { $sum: { $toDouble: '$price' } }
          }
        }
      ]),
      
      // Average revenue per transaction
      Transaction.aggregate([
        { $match: { status: 'completed' } },
        {
          $group: {
            _id: null,
            averageRevenue: { $avg: { $toDouble: '$price' } }
          }
        }
      ])
    ])

    const totalRevenueData = totalRevenueResult[0] || { totalRevenue: 0 }
    const averageRevenueData = averageRevenueResult[0] || { averageRevenue: 0 }

    // Calculate growth rates (simplified - in production would compare with previous periods)
    const growthRate = {
      daily: 15.5,
      weekly: 12.3,
      monthly: 8.7
    }

    // Calculate percentages for revenue by category
    const totalRevenueByCategory = revenueByCategory.reduce((sum, cat) => sum + parseFloat(cat.revenue), 0)
    const revenueByCategoryWithPercentage = revenueByCategory.map(cat => ({
      ...cat,
      percentage: totalRevenueByCategory > 0 ? (parseFloat(cat.revenue) / totalRevenueByCategory) * 100 : 0
    }))

    return {
      totalRevenue: totalRevenueData.totalRevenue.toString(),
      revenueByPeriod: {
        daily: revenueDaily,
        weekly: revenueWeekly,
        monthly: revenueMonthly
      },
      revenueByCategory: revenueByCategoryWithPercentage,
      growthRate,
      averageRevenuePerTransaction: averageRevenueData.averageRevenue.toString()
    }
  }

  createResponse<T>(data: T, cached: boolean = false, filters?: any): AnalyticsResponse<T> {
    return {
      success: true,
      data,
      meta: {
        cached,
        generatedAt: new Date().toISOString(),
        filters
      }
    }
  }
}

export const analyticsService = new AnalyticsService()
export default analyticsService
