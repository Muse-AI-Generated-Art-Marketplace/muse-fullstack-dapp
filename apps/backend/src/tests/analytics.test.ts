import request from 'supertest'
import app from '@/index'
import analyticsService from '@/services/analyticsService'
import { ApiRequestAnalytics, ErrorAnalytics } from '@/models/analytics'

describe('Analytics API', () => {
  beforeEach(async () => {
    // Clean up test data
    await ApiRequestAnalytics.deleteMany({})
    await ErrorAnalytics.deleteMany({})
  })

  describe('GET /api/analytics/metrics/realtime', () => {
    it('should return real-time metrics', async () => {
      // Create some test data
      await analyticsService.recordRequest({
        timestamp: new Date(),
        method: 'GET',
        endpoint: '/test',
        statusCode: 200,
        responseTime: 100,
        ip: '127.0.0.1'
      })

      const response = await request(app)
        .get('/api/analytics/metrics/realtime')
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data).toHaveProperty('totalRequests')
      expect(response.body.data).toHaveProperty('averageResponseTime')
      expect(response.body.data).toHaveProperty('errorRate')
    })

    it('should validate time range parameter', async () => {
      const response = await request(app)
        .get('/api/analytics/metrics/realtime?timeRange=invalid')
        .expect(400)

      expect(response.body.success).toBe(false)
      expect(response.body.error).toContain('Invalid time range')
    })
  })

  describe('GET /api/analytics/daily', () => {
    it('should return daily analytics', async () => {
      const response = await request(app)
        .get('/api/analytics/daily')
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(Array.isArray(response.body.data)).toBe(true)
    })

    it('should accept date range parameters', async () => {
      const startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
      const endDate = new Date().toISOString()

      const response = await request(app)
        .get(`/api/analytics/daily?startDate=${startDate}&endDate=${endDate}`)
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(Array.isArray(response.body.data)).toBe(true)
    })
  })

  describe('GET /api/analytics/usage', () => {
    it('should return API usage statistics', async () => {
      // Create test data
      await analyticsService.recordRequest({
        timestamp: new Date(),
        method: 'GET',
        endpoint: '/api/artworks',
        statusCode: 200,
        responseTime: 150,
        ip: '127.0.0.1'
      })

      const response = await request(app)
        .get('/api/analytics/usage')
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data).toHaveProperty('totalRequests')
      expect(response.body.data).toHaveProperty('totalErrors')
      expect(response.body.data).toHaveProperty('errorRate')
      expect(response.body.data).toHaveProperty('topEndpoints')
    })

    it('should accept custom time period', async () => {
      const response = await request(app)
        .get('/api/analytics/usage?days=3')
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data.period).toBe('3 days')
    })
  })

  describe('GET /api/analytics/health', () => {
    it('should return analytics health status', async () => {
      const response = await request(app)
        .get('/api/analytics/health')
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data).toHaveProperty('status')
      expect(response.body.data).toHaveProperty('timestamp')
      expect(response.body.data).toHaveProperty('dataCollection')
      expect(response.body.data).toHaveProperty('lastHour')
    })
  })

  describe('POST /api/analytics/aggregate', () => {
    it('should trigger hourly aggregation', async () => {
      const response = await request(app)
        .post('/api/analytics/aggregate')
        .send({ type: 'hourly' })
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.message).toContain('hourly aggregation completed')
    })

    it('should trigger daily aggregation', async () => {
      const response = await request(app)
        .post('/api/analytics/aggregate')
        .send({ type: 'daily' })
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.message).toContain('daily aggregation completed')
    })

    it('should validate aggregation type', async () => {
      const response = await request(app)
        .post('/api/analytics/aggregate')
        .send({ type: 'invalid' })
        .expect(400)

      expect(response.body.success).toBe(false)
      expect(response.body.error).toContain('Invalid aggregation type')
    })
  })

  describe('POST /api/analytics/cleanup', () => {
    it('should cleanup old data', async () => {
      const response = await request(app)
        .post('/api/analytics/cleanup')
        .send({ retentionDays: 30 })
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.message).toContain('Cleaned up data older than 30 days')
    })
  })
})

describe('Analytics Service', () => {
  beforeEach(async () => {
    await ApiRequestAnalytics.deleteMany({})
    await ErrorAnalytics.deleteMany({})
  })

  describe('recordRequest', () => {
    it('should record API request analytics', async () => {
      const requestData = {
        timestamp: new Date(),
        method: 'GET',
        endpoint: '/test',
        statusCode: 200,
        responseTime: 100,
        ip: '127.0.0.1'
      }

      await analyticsService.recordRequest(requestData)

      const savedRequest = await ApiRequestAnalytics.findOne({ endpoint: '/test' })
      expect(savedRequest).toBeTruthy()
      expect(savedRequest.method).toBe('GET')
      expect(savedRequest.statusCode).toBe(200)
      expect(savedRequest.responseTime).toBe(100)
    })
  })

  describe('recordError', () => {
    it('should record error analytics', async () => {
      const errorData = {
        timestamp: new Date(),
        errorType: 'ValidationError',
        errorMessage: 'Test error',
        endpoint: '/test',
        method: 'POST',
        statusCode: 400,
        ip: '127.0.0.1'
      }

      await analyticsService.recordError(errorData)

      const savedError = await ErrorAnalytics.findOne({ errorType: 'ValidationError' })
      expect(savedError).toBeTruthy()
      expect(savedError.errorMessage).toBe('Test error')
      expect(savedError.endpoint).toBe('/test')
      expect(savedError.method).toBe('POST')
    })
  })

  describe('getRealTimeMetrics', () => {
    it('should return real-time metrics for 1h', async () => {
      // Create test data
      await analyticsService.recordRequest({
        timestamp: new Date(),
        method: 'GET',
        endpoint: '/test',
        statusCode: 200,
        responseTime: 100,
        ip: '127.0.0.1'
      })

      const metrics = await analyticsService.getRealTimeMetrics('1h')

      expect(metrics).toHaveProperty('totalRequests')
      expect(metrics).toHaveProperty('averageResponseTime')
      expect(metrics).toHaveProperty('errorRate')
      expect(metrics).toHaveProperty('topEndpoints')
      expect(metrics).toHaveProperty('recentErrors')
    })

    it('should return real-time metrics for 24h', async () => {
      const metrics = await analyticsService.getRealTimeMetrics('24h')

      expect(metrics).toHaveProperty('timeRange', '24h')
    })
  })

  describe('aggregateHourlyAnalytics', () => {
    it('should aggregate hourly analytics', async () => {
      // Create test data for the current hour
      const now = new Date()
      await analyticsService.recordRequest({
        timestamp: now,
        method: 'GET',
        endpoint: '/test',
        statusCode: 200,
        responseTime: 100,
        ip: '127.0.0.1'
      })

      await analyticsService.aggregateHourlyAnalytics(now)

      // Verify aggregation was created
      const hourlyData = await require('@/models/analytics').HourlyAnalytics.findOne({
        hour: { $gte: new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours(), 0, 0, 0) }
      })

      expect(hourlyData).toBeTruthy()
      expect(hourlyData.totalRequests).toBe(1)
      expect(hourlyData.successRequests).toBe(1)
    })
  })

  describe('cleanupOldData', () => {
    it('should cleanup old analytics data', async () => {
      // Create old data
      const oldDate = new Date(Date.now() - 100 * 24 * 60 * 60 * 1000) // 100 days ago
      await analyticsService.recordRequest({
        timestamp: oldDate,
        method: 'GET',
        endpoint: '/old-test',
        statusCode: 200,
        responseTime: 100,
        ip: '127.0.0.1'
      })

      await analyticsService.cleanupOldData(90)

      // Verify old data was deleted
      const oldRequest = await ApiRequestAnalytics.findOne({ endpoint: '/old-test' })
      expect(oldRequest).toBeFalsy()
    })
  })
})
