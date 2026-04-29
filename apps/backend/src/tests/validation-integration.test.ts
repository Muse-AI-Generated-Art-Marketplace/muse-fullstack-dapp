import request from 'supertest'
import app from '../index'

describe('Validation Integration Tests', () => {
  describe('Health Check Validation', () => {
    it('should return health status without validation errors', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200)

      expect(response.body).toHaveProperty('status')
      expect(response.body).toHaveProperty('timestamp')
    })

    it('should return simple health status', async () => {
      const response = await request(app)
        .get('/health/simple')
        .expect(200)

      expect(response.body).toHaveProperty('status', 'OK')
    })
  })

  describe('Search Validation', () => {
    it('should reject search with missing query parameter', async () => {
      const response = await request(app)
        .get('/api/search/artworks')
        .query({}) // Missing 'q' parameter
        .expect(400)

      expect(response.body).toHaveProperty('error')
      expect(response.body.error.message).toContain('Validation failed')
    })

    it('should accept search with valid parameters', async () => {
      const response = await request(app)
        .get('/api/search/artworks')
        .query({
          q: 'landscape',
          category: 'digital-art',
          minPrice: '10',
          maxPrice: '1000',
          page: '1',
          limit: '20'
        })
        .expect(200) // Should pass validation, even if no data found

      // The request should pass validation even if no results are found
      expect(response.body).toBeDefined()
    })

    it('should reject search with invalid price format', async () => {
      const response = await request(app)
        .get('/api/search/artworks')
        .query({
          q: 'landscape',
          minPrice: 'invalid-price', // Invalid price format
          maxPrice: '1000'
        })
        .expect(400)

      expect(response.body).toHaveProperty('error')
      expect(response.body.error.message).toContain('Validation failed')
    })
  })

  describe('Parameter Validation', () => {
    it('should handle invalid UUID parameters', async () => {
      // Test with an endpoint that expects UUID parameters
      const response = await request(app)
        .get('/api/artworks/invalid-uuid')
        .expect(400) // Should fail validation for invalid UUID

      expect(response.body).toHaveProperty('error')
      expect(response.body.error.message).toContain('Validation failed')
    })

    it('should handle invalid pagination parameters', async () => {
      const response = await request(app)
        .get('/api/search/artworks')
        .query({
          q: 'test',
          page: '0', // Invalid page number (must be >= 1)
          limit: '1000' // Invalid limit (must be <= 100)
        })
        .expect(400)

      expect(response.body).toHaveProperty('error')
      expect(response.body.error.message).toContain('Validation failed')
    })

    it('should accept valid pagination parameters', async () => {
      const response = await request(app)
        .get('/api/search/artworks')
        .query({
          q: 'test',
          page: '1',
          limit: '20'
        })
        .expect(200) // Should pass validation

      expect(response.body).toBeDefined()
    })
  })

  describe('Auth Challenge Validation', () => {
    it('should reject auth challenge without address', async () => {
      const response = await request(app)
        .get('/api/auth/challenge')
        .query({}) // Missing address parameter
        .expect(400)

      expect(response.body).toHaveProperty('error')
      expect(response.body.error.message).toContain('Validation failed')
    })

    it('should reject auth challenge with invalid address format', async () => {
      const response = await request(app)
        .get('/api/auth/challenge')
        .query({
          address: 'invalid-address' // Invalid Stellar address format
        })
        .expect(400)

      expect(response.body).toHaveProperty('error')
      expect(response.body.error.message).toContain('Validation failed')
    })

    it('should accept auth challenge with valid address format', async () => {
      const validStellarAddress = 'GABCD1234567890ABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890'
      const response = await request(app)
        .get('/api/auth/challenge')
        .query({
          address: validStellarAddress
        })
        .expect(200) // Should pass validation

      expect(response.body).toBeDefined()
    })
  })

  describe('File Upload Parameter Validation', () => {
    it('should reject presigned URL request without required parameters', async () => {
      const response = await request(app)
        .get('/api/file-upload/presigned-url')
        .query({}) // Missing required parameters
        .expect(400)

      expect(response.body).toHaveProperty('error')
      expect(response.body.error.message).toContain('Validation failed')
    })

    it('should reject presigned URL request with invalid expiration time', async () => {
      const response = await request(app)
        .get('/api/file-upload/presigned-url')
        .query({
          filename: 'test.jpg',
          contentType: 'image/jpeg',
          expiresIn: '30' // Too short (minimum 60 seconds)
        })
        .expect(400)

      expect(response.body).toHaveProperty('error')
      expect(response.body.error.message).toContain('Validation failed')
    })

    it('should accept presigned URL request with valid parameters', async () => {
      const response = await request(app)
        .get('/api/file-upload/presigned-url')
        .query({
          filename: 'test.jpg',
          contentType: 'image/jpeg',
          expiresIn: '3600' // Valid expiration time
        })
        .expect(401) // Should pass validation but fail auth (expected)

      // The important thing is that it passed validation
      expect(response.body).toBeDefined()
    })
  })
})
