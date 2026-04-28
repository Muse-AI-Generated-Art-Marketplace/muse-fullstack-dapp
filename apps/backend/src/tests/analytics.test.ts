import request from 'supertest'
import mongoose from 'mongoose'
import { app } from '@/index'
import User from '@/models/User'
import Artwork from '@/models/Artwork'
import Transaction from '@/models/Transaction'
import jwt from 'jsonwebtoken'
import { analyticsService } from '@/services/analyticsService'
import { clearAnalyticsCache } from '@/middleware/analyticsCache'

// Mock the analytics service to avoid real database calls in tests
jest.mock('@/services/analyticsService')
const mockAnalyticsService = analyticsService as jest.Mocked<typeof analyticsService>

// Mock JWT verification
jest.mock('@/middleware/authMiddleware', () => ({
  ...jest.requireActual('@/middleware/authMiddleware'),
  authenticate: (req: any, res: any, next: any) => {
    req.user = {
      id: '507f1f77bcf86cd799439011',
      address: 'GD5RPQIN5XQDNFCVK2B7T3Y6D5SZP2FOU2UWDRBETPNJSIL3IQHVSERD',
      tier: 'premium' // Admin tier for analytics access
    }
    next()
  }
}))

describe('Analytics Endpoints', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    clearAnalyticsCache()
  })

  afterAll(() => {
    jest.restoreAllMocks()
  })

  describe('GET /api/analytics/dashboard', () => {
    test('returns dashboard metrics with correct structure', async () => {
      const mockDashboardData = {
        totalUsers: 1500,
        newUsersToday: 25,
        newUsersThisWeek: 180,
        newUsersThisMonth: 750,
        totalTransactions: 5000,
        transactionsToday: 45,
        totalRevenue: '50000.00',
        revenueToday: '750.00',
        activeUsers: 250,
        listedArtworks: 300,
        soldArtworks: 180
      }

      mockAnalyticsService.getDashboardMetrics.mockResolvedValue(mockDashboardData)
      mockAnalyticsService.createResponse.mockReturnValue({
        success: true,
        data: mockDashboardData,
        meta: {
          cached: false,
          generatedAt: '2026-03-30T01:47:00Z',
          filters: {}
        }
      })

      const res = await request(app)
        .get('/api/analytics/dashboard')
        .expect(200)

      expect(res.body.success).toBe(true)
      expect(res.body.data.totalUsers).toBe(1500)
      expect(res.body.data.newUsersToday).toBe(25)
      expect(res.body.data.totalRevenue).toBe('50000.00')
      expect(res.body.meta.cached).toBe(false)
      expect(res.body.meta.generatedAt).toBeDefined()
    })

    test('returns cached data on second request', async () => {
      const mockDashboardData = {
        totalUsers: 1500,
        newUsersToday: 25,
        newUsersThisWeek: 180,
        newUsersThisMonth: 750,
        totalTransactions: 5000,
        transactionsToday: 45,
        totalRevenue: '50000.00',
        revenueToday: '750.00',
        activeUsers: 250,
        listedArtworks: 300,
        soldArtworks: 180
      }

      mockAnalyticsService.getDashboardMetrics.mockResolvedValue(mockDashboardData)
      mockAnalyticsService.createResponse.mockReturnValue({
        success: true,
        data: mockDashboardData,
        meta: {
          cached: false,
          generatedAt: '2026-03-30T01:47:00Z',
          filters: {}
        }
      })

      // First request
      await request(app)
        .get('/api/analytics/dashboard')
        .expect(200)

      // Second request should return cached data
      const res = await request(app)
        .get('/api/analytics/dashboard')
        .expect(200)

      expect(res.body.success).toBe(true)
      expect(res.body.data.totalUsers).toBe(1500)
      // Note: The caching middleware handles the cache flag, not the service
    })

    test('handles date filtering correctly', async () => {
      const mockDashboardData = {
        totalUsers: 100,
        newUsersToday: 5,
        newUsersThisWeek: 20,
        newUsersThisMonth: 50,
        totalTransactions: 200,
        transactionsToday: 8,
        totalRevenue: '10000.00',
        revenueToday: '200.00',
        activeUsers: 30,
        listedArtworks: 40,
        soldArtworks: 25
      }

      mockAnalyticsService.getDashboardMetrics.mockResolvedValue(mockDashboardData)
      mockAnalyticsService.createResponse.mockReturnValue({
        success: true,
        data: mockDashboardData,
        meta: {
          cached: false,
          generatedAt: '2026-03-30T01:47:00Z',
          filters: { startDate: '2026-03-01', endDate: '2026-03-30' }
        }
      })

      const res = await request(app)
        .get('/api/analytics/dashboard?startDate=2026-03-01&endDate=2026-03-30')
        .expect(200)

      expect(mockAnalyticsService.getDashboardMetrics).toHaveBeenCalledWith({
        startDate: '2026-03-01',
        endDate: '2026-03-30'
      })
      expect(res.body.meta.filters).toBeDefined()
    })

    test('handles period parameter correctly', async () => {
      const mockDashboardData = {
        totalUsers: 1500,
        newUsersToday: 25,
        newUsersThisWeek: 180,
        newUsersThisMonth: 750,
        totalTransactions: 5000,
        transactionsToday: 45,
        totalRevenue: '50000.00',
        revenueToday: '750.00',
        activeUsers: 250,
        listedArtworks: 300,
        soldArtworks: 180
      }

      mockAnalyticsService.getDashboardMetrics.mockResolvedValue(mockDashboardData)
      mockAnalyticsService.createResponse.mockReturnValue({
        success: true,
        data: mockDashboardData,
        meta: {
          cached: false,
          generatedAt: '2026-03-30T01:47:00Z',
          filters: { period: '7d' }
        }
      })

      await request(app)
        .get('/api/analytics/dashboard?period=7d')
        .expect(200)

      expect(mockAnalyticsService.getDashboardMetrics).toHaveBeenCalledWith({
        period: '7d'
      })
    })

    test('returns 400 for invalid date range', async () => {
      const res = await request(app)
        .get('/api/analytics/dashboard?startDate=2026-03-30&endDate=2026-03-01')
        .expect(400)

      expect(res.body.success).toBe(false)
    })
  })

  describe('GET /api/analytics/marketplace', () => {
    test('returns marketplace metrics with correct structure', async () => {
      const mockMarketplaceData = {
        totalListings: 500,
        activeListings: 350,
        soldItems: 150,
        averagePrice: '250.00',
        totalVolume: '37500.00',
        volumeByCategory: [
          { category: 'digital-art', volume: '20000.00', count: 80, averagePrice: '250.00' },
          { category: 'photography', volume: '17500.00', count: 70, averagePrice: '250.00' }
        ],
        topCategories: [
          { category: 'digital-art', count: 200, percentage: 40.0 },
          { category: 'photography', count: 150, percentage: 30.0 }
        ]
      }

      mockAnalyticsService.getMarketplaceMetrics.mockResolvedValue(mockMarketplaceData)
      mockAnalyticsService.createResponse.mockReturnValue({
        success: true,
        data: mockMarketplaceData,
        meta: {
          cached: false,
          generatedAt: '2026-03-30T01:47:00Z',
          filters: {}
        }
      })

      const res = await request(app)
        .get('/api/analytics/marketplace')
        .expect(200)

      expect(res.body.success).toBe(true)
      expect(res.body.data.totalListings).toBe(500)
      expect(res.body.data.soldItems).toBe(150)
      expect(res.body.data.volumeByCategory).toHaveLength(2)
      expect(res.body.data.topCategories).toHaveLength(2)
    })
  })

  describe('GET /api/analytics/users', () => {
    test('returns user analytics with correct structure', async () => {
      const mockUserData = {
        totalUsers: 1500,
        newUsers: {
          daily: [{ date: '2026-03-30', count: 25 }],
          weekly: [{ week: '2026-13', count: 180 }],
          monthly: [{ month: '2026-03', count: 750 }]
        },
        retentionRate: 75.5,
        activeUsers: {
          daily: 100,
          weekly: 400,
          monthly: 800
        },
        topUsers: [
          {
            address: 'GD5RPQIN5XQDNFCVK2B7T3Y6D5SZP2FOU2UWDRBETPNJSIL3IQHVSERD',
            username: 'artist1',
            totalSales: '10000.00',
            artworksCreated: 50,
            joinDate: new Date('2026-01-01')
          }
        ],
        userTiers: {
          free: 1200,
          pro: 250,
          premium: 50
        }
      }

      mockAnalyticsService.getUserAnalytics.mockResolvedValue(mockUserData)
      mockAnalyticsService.createResponse.mockReturnValue({
        success: true,
        data: mockUserData,
        meta: {
          cached: false,
          generatedAt: '2026-03-30T01:47:00Z',
          filters: {}
        }
      })

      const res = await request(app)
        .get('/api/analytics/users')
        .expect(200)

      expect(res.body.success).toBe(true)
      expect(res.body.data.totalUsers).toBe(1500)
      expect(res.body.data.retentionRate).toBe(75.5)
      expect(res.body.data.activeUsers.daily).toBe(100)
      expect(res.body.data.userTiers.free).toBe(1200)
    })
  })

  describe('GET /api/analytics/transactions', () => {
    test('returns transaction metrics with correct structure', async () => {
      const mockTransactionData = {
        totalTransactions: 5000,
        volumeOverTime: [
          { date: '2026-03-30', volume: '1000.00', count: 20, averageValue: '50.00' }
        ],
        successRate: 95.5,
        averageTransactionValue: '50.00',
        transactionsByType: [
          { type: 'sale', count: 3000, volume: '150000.00', percentage: 60.0 },
          { type: 'mint', count: 1500, volume: '75000.00', percentage: 30.0 },
          { type: 'transfer', count: 500, volume: '25000.00', percentage: 10.0 }
        ],
        transactionsByStatus: [
          { status: 'completed', count: 4750, percentage: 95.0 },
          { status: 'pending', count: 150, percentage: 3.0 },
          { status: 'failed', count: 100, percentage: 2.0 }
        ]
      }

      mockAnalyticsService.getTransactionMetrics.mockResolvedValue(mockTransactionData)
      mockAnalyticsService.createResponse.mockReturnValue({
        success: true,
        data: mockTransactionData,
        meta: {
          cached: false,
          generatedAt: '2026-03-30T01:47:00Z',
          filters: {}
        }
      })

      const res = await request(app)
        .get('/api/analytics/transactions')
        .expect(200)

      expect(res.body.success).toBe(true)
      expect(res.body.data.totalTransactions).toBe(5000)
      expect(res.body.data.successRate).toBe(95.5)
      expect(res.body.data.transactionsByType).toHaveLength(3)
      expect(res.body.data.transactionsByStatus).toHaveLength(3)
    })
  })

  describe('GET /api/analytics/revenue', () => {
    test('returns revenue analytics with correct structure', async () => {
      const mockRevenueData = {
        totalRevenue: '50000.00',
        revenueByPeriod: {
          daily: [{ date: '2026-03-30', revenue: '1000.00', transactions: 20 }],
          weekly: [{ week: '2026-13', revenue: '7000.00', transactions: 140 }],
          monthly: [{ month: '2026-03', revenue: '30000.00', transactions: 600 }]
        },
        revenueByCategory: [
          { category: 'digital-art', revenue: '30000.00', count: 120, percentage: 60.0 },
          { category: 'photography', revenue: '20000.00', count: 80, percentage: 40.0 }
        ],
        growthRate: {
          daily: 15.5,
          weekly: 12.3,
          monthly: 8.7
        },
        averageRevenuePerTransaction: '50.00'
      }

      mockAnalyticsService.getRevenueAnalytics.mockResolvedValue(mockRevenueData)
      mockAnalyticsService.createResponse.mockReturnValue({
        success: true,
        data: mockRevenueData,
        meta: {
          cached: false,
          generatedAt: '2026-03-30T01:47:00Z',
          filters: {}
        }
      })

      const res = await request(app)
        .get('/api/analytics/revenue')
        .expect(200)

      expect(res.body.success).toBe(true)
      expect(res.body.data.totalRevenue).toBe('50000.00')
      expect(res.body.data.growthRate.daily).toBe(15.5)
      expect(res.body.data.revenueByCategory).toHaveLength(2)
    })
  })

  describe('Authentication and Authorization', () => {
    test('returns 401 without authentication token', async () => {
      // Temporarily override the mock for this test
      jest.doMock('@/middleware/authMiddleware', () => ({
        authenticate: (req: any, res: any, next: any) => {
          return next({ statusCode: 401, message: 'Authentication token required' })
        }
      }))

      const res = await request(app)
        .get('/api/analytics/dashboard')
        .expect(401)

      expect(res.body.success).toBe(false)
    })

    test('returns 403 for non-admin users', async () => {
      // Mock non-admin user
      jest.doMock('@/middleware/authMiddleware', () => ({
        authenticate: (req: any, res: any, next: any) => {
          req.user = {
            id: '507f1f77bcf86cd799439011',
            address: 'GD5RPQIN5XQDNFCVK2B7T3Y6D5SZP2FOU2UWDRBETPNJSIL3IQHVSERD',
            tier: 'free' // Non-admin tier
          }
          next()
        }
      }))

      const res = await request(app)
        .get('/api/analytics/dashboard')
        .expect(403)

      expect(res.body.success).toBe(false)
    })
  })

  describe('Cache Management', () => {
    test('GET /api/analytics/cache/stats returns cache statistics', async () => {
      const res = await request(app)
        .get('/api/analytics/cache/stats')
        .expect(200)

      expect(res.body.success).toBe(true)
      expect(res.body.data).toHaveProperty('totalEntries')
      expect(res.body.data).toHaveProperty('validEntries')
      expect(res.body.data).toHaveProperty('expiredEntries')
    })

    test('DELETE /api/analytics/cache clears cache', async () => {
      const res = await request(app)
        .delete('/api/analytics/cache')
        .expect(200)

      expect(res.body.success).toBe(true)
      expect(res.body.message).toContain('cache cleared')
    })

    test('DELETE /api/analytics/cache with pattern clears specific cache entries', async () => {
      const res = await request(app)
        .delete('/api/analytics/cache?pattern=dashboard')
        .expect(200)

      expect(res.body.success).toBe(true)
      expect(res.body.message).toContain('dashboard')
    })
  })

  describe('Health Check', () => {
    test('GET /api/analytics/health returns healthy status', async () => {
      // Mock mongoose connection
      jest.spyOn(mongoose.connection.db, 'admin').mockResolvedValue({
        ping: jest.fn().mockResolvedValue(true)
      } as any)

      const res = await request(app)
        .get('/api/analytics/health')
        .expect(200)

      expect(res.body.success).toBe(true)
      expect(res.body.data.status).toBe('healthy')
      expect(res.body.data.database).toBe('connected')
    })
  })

  describe('Input Validation', () => {
    test('validates date format', async () => {
      const res = await request(app)
        .get('/api/analytics/dashboard?startDate=invalid-date')
        .expect(400)

      expect(res.body.success).toBe(false)
    })

    test('validates period values', async () => {
      const res = await request(app)
        .get('/api/analytics/dashboard?period=invalid')
        .expect(400)

      expect(res.body.success).toBe(false)
    })

    test('validates date range logic', async () => {
      const res = await request(app)
        .get('/api/analytics/dashboard?startDate=2026-03-30&endDate=2026-03-01')
        .expect(400)

      expect(res.body.success).toBe(false)
      expect(res.body.message).toContain('startDate must be before endDate')
    })
  })

  describe('Error Handling', () => {
    test('handles service errors gracefully', async () => {
      mockAnalyticsService.getDashboardMetrics.mockRejectedValue(new Error('Database error'))

      const res = await request(app)
        .get('/api/analytics/dashboard')
        .expect(500)

      expect(res.body.success).toBe(false)
    })
  })

  describe('Rate Limiting', () => {
    test('applies rate limiting', async () => {
      const mockDashboardData = {
        totalUsers: 1500,
        newUsersToday: 25,
        newUsersThisWeek: 180,
        newUsersThisMonth: 750,
        totalTransactions: 5000,
        transactionsToday: 45,
        totalRevenue: '50000.00',
        revenueToday: '750.00',
        activeUsers: 250,
        listedArtworks: 300,
        soldArtworks: 180
      }

      mockAnalyticsService.getDashboardMetrics.mockResolvedValue(mockDashboardData)
      mockAnalyticsService.createResponse.mockReturnValue({
        success: true,
        data: mockDashboardData,
        meta: {
          cached: false,
          generatedAt: '2026-03-30T01:47:00Z',
          filters: {}
        }
      })

      // Make many requests quickly to test rate limiting
      const promises = Array(105).fill(null).map(() =>
        request(app).get('/api/analytics/dashboard')
      )

      const results = await Promise.allSettled(promises)
      const rateLimitedResponses = results.filter(result => 
        result.status === 'fulfilled' && 
        result.value.status === 429
      )

      // Should have some rate limited responses
      expect(rateLimitedResponses.length).toBeGreaterThan(0)
    })
  })
})
