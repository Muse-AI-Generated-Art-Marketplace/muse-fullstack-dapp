import request from 'supertest'
import { createApp } from '../index'
import { helmetConfig, contentSecurityPolicy } from '../middleware/security'

describe('Security Headers', () => {
  let app: any

  beforeAll(() => {
    // Set test environment
    process.env.NODE_ENV = 'test'
    app = createApp()
  })

  describe('Basic Security Headers', () => {
    test('should set X-Frame-Options to DENY', async () => {
      const res = await request(app).get('/health/simple')
      expect(res.headers['x-frame-options']).toBe('DENY')
    })

    test('should set X-Content-Type-Options to nosniff', async () => {
      const res = await request(app).get('/health/simple')
      expect(res.headers['x-content-type-options']).toBe('nosniff')
    })

    test('should set X-XSS-Protection', async () => {
      const res = await request(app).get('/health/simple')
      expect(res.headers['x-xss-protection']).toBe('1; mode=block')
    })

    test('should set Referrer-Policy', async () => {
      const res = await request(app).get('/health/simple')
      expect(res.headers['referrer-policy']).toBe('strict-origin-when-cross-origin')
    })

    test('should hide X-Powered-By header', async () => {
      const res = await request(app).get('/health/simple')
      expect(res.headers['x-powered-by']).toBeUndefined()
    })
  })

  describe('Content Security Policy', () => {
    test('should set Content-Security-Policy header', async () => {
      const res = await request(app).get('/health/simple')
      expect(res.headers['content-security-policy']).toBeDefined()
    })

    test('should include default-src self in CSP', async () => {
      const res = await request(app).get('/health/simple')
      const csp = res.headers['content-security-policy']
      expect(csp).toContain("default-src 'self'")
    })

    test('should include script-src directives in CSP', async () => {
      const res = await request(app).get('/health/simple')
      const csp = res.headers['content-security-policy']
      expect(csp).toContain("script-src 'self'")
    })

    test('should include style-src with unsafe-inline in CSP', async () => {
      const res = await request(app).get('/health/simple')
      const csp = res.headers['content-security-policy']
      expect(csp).toContain("style-src 'self' 'unsafe-inline'")
    })

    test('should include img-src directives in CSP', async () => {
      const res = await request(app).get('/health/simple')
      const csp = res.headers['content-security-policy']
      expect(csp).toContain("img-src 'self' data: https:")
    })

    test('should include font-src directives in CSP', async () => {
      const res = await request(app).get('/health/simple')
      const csp = res.headers['content-security-policy']
      expect(csp).toContain("font-src 'self'")
    })

    test('should include connect-src directives in CSP', async () => {
      const res = await request(app).get('/health/simple')
      const csp = res.headers['content-security-policy']
      expect(csp).toContain("connect-src 'self'")
    })

    test('should set frame-ancestors to none in CSP', async () => {
      const res = await request(app).get('/health/simple')
      const csp = res.headers['content-security-policy']
      expect(csp).toContain("frame-ancestors 'none'")
    })

    test('should set object-src to none in CSP', async () => {
      const res = await request(app).get('/health/simple')
      const csp = res.headers['content-security-policy']
      expect(csp).toContain("object-src 'none'")
    })
  })

  describe('Cross-Origin Policies', () => {
    test('should set Cross-Origin-Opener-Policy', async () => {
      const res = await request(app).get('/health/simple')
      expect(res.headers['cross-origin-opener-policy']).toBe('same-origin')
    })

    test('should set Cross-Origin-Resource-Policy', async () => {
      const res = await request(app).get('/health/simple')
      expect(res.headers['cross-origin-resource-policy']).toBe('cross-origin')
    })
  })

  describe('Permissions Policy', () => {
    test('should set Permissions-Policy header', async () => {
      const res = await request(app).get('/health/simple')
      expect(res.headers['permissions-policy']).toBeDefined()
    })

    test('should disable geolocation in Permissions-Policy', async () => {
      const res = await request(app).get('/health/simple')
      const permissionsPolicy = res.headers['permissions-policy']
      expect(permissionsPolicy).toContain('geolocation=()')
    })

    test('should disable camera in Permissions-Policy', async () => {
      const res = await request(app).get('/health/simple')
      const permissionsPolicy = res.headers['permissions-policy']
      expect(permissionsPolicy).toContain('camera=()')
    })

    test('should disable microphone in Permissions-Policy', async () => {
      const res = await request(app).get('/health/simple')
      const permissionsPolicy = res.headers['permissions-policy']
      expect(permissionsPolicy).toContain('microphone=()')
    })
  })

  describe('Environment-Specific Headers', () => {
    describe('Development Environment', () => {
      beforeAll(() => {
        process.env.NODE_ENV = 'development'
        app = createApp()
      })

      test('should use report-only CSP in development', async () => {
        const res = await request(app).get('/health/simple')
        expect(res.headers['content-security-policy-report-only']).toBeDefined()
        expect(res.headers['content-security-policy']).toBeUndefined()
      })

      test('should not set HSTS in development', async () => {
        const res = await request(app).get('/health/simple')
        expect(res.headers['strict-transport-security']).toBeUndefined()
      })

      test('should allow unsafe-inline scripts in development', async () => {
        const res = await request(app).get('/health/simple')
        const csp = res.headers['content-security-policy-report-only']
        expect(csp).toContain("'unsafe-inline'")
        expect(csp).toContain("'unsafe-eval'")
      })
    })

    describe('Production Environment', () => {
      beforeAll(() => {
        process.env.NODE_ENV = 'production'
        app = createApp()
      })

      test('should set HSTS in production', async () => {
        const res = await request(app).get('/health/simple')
        expect(res.headers['strict-transport-security']).toBeDefined()
        expect(res.headers['strict-transport-security']).toContain('max-age=31536000')
        expect(res.headers['strict-transport-security']).toContain('includeSubDomains')
        expect(res.headers['strict-transport-security']).toContain('preload')
      })

      test('should use enforce CSP in production', async () => {
        const res = await request(app).get('/health/simple')
        expect(res.headers['content-security-policy']).toBeDefined()
        expect(res.headers['content-security-policy-report-only']).toBeUndefined()
      })

      test('should not allow unsafe-inline scripts in production', async () => {
        const res = await request(app).get('/health/simple')
        const csp = res.headers['content-security-policy']
        expect(csp).not.toContain("'unsafe-inline'")
        expect(csp).not.toContain("'unsafe-eval'")
      })

      test('should set Cross-Origin-Embedder-Policy in production', async () => {
        const res = await request(app).get('/health/simple')
        expect(res.headers['cross-origin-embedder-policy']).toBe('require-corp')
      })
    })
  })

  describe('API Endpoints Security', () => {
    test('should apply security headers to health endpoint', async () => {
      const res = await request(app).get('/health')
      expect(res.headers['x-frame-options']).toBe('DENY')
      expect(res.headers['content-security-policy']).toBeDefined()
    })

    test('should apply security headers to API routes', async () => {
      const res = await request(app).get('/api/health')
      expect(res.status).toBe(404) // Route doesn't exist, but should still have headers
      expect(res.headers['x-frame-options']).toBe('DENY')
      expect(res.headers['content-security-policy']).toBeDefined()
    })

    test('should apply security headers to all response types', async () => {
      // Test JSON response
      const jsonRes = await request(app).get('/health/simple')
      expect(jsonRes.headers['x-frame-options']).toBe('DENY')

      // Test error response
      const errorRes = await request(app).get('/nonexistent')
      expect(errorRes.headers['x-frame-options']).toBe('DENY')
    })
  })

  describe('Security Configuration Validation', () => {
    test('should have correct helmet configuration structure', () => {
      expect(helmetConfig).toBeDefined()
      expect(helmetConfig.contentSecurityPolicy).toBeDefined()
      expect(helmetConfig.frameguard).toBeDefined()
      expect(helmetConfig.hsts).toBeDefined()
      expect(helmetConfig.referrerPolicy).toBeDefined()
    })

    test('should have correct CSP directives structure', () => {
      expect(contentSecurityPolicy).toBeDefined()
      expect(contentSecurityPolicy.directives).toBeDefined()
      expect(contentSecurityPolicy.directives.defaultSrc).toContain("'self'")
      expect(contentSecurityPolicy.directives.frameAncestors).toContain("'none'")
    })

    test('should handle API_BASE_URL environment variable', async () => {
      const originalApiUrl = process.env.API_BASE_URL
      process.env.API_BASE_URL = 'https://api.example.com'
      process.env.NODE_ENV = 'production'
      
      const testApp = createApp()
      const res = await request(testApp).get('/health/simple')
      const csp = res.headers['content-security-policy']
      expect(csp).toContain('https://api.example.com')
      
      process.env.API_BASE_URL = originalApiUrl
    })
  })

  describe('Security Headers Integration', () => {
    test('should not interfere with CORS headers', async () => {
      const res = await request(app)
        .get('/health/simple')
        .set('Origin', 'http://localhost:3000')
      
      expect(res.headers['x-frame-options']).toBe('DENY')
      expect(res.headers['content-security-policy']).toBeDefined()
    })

    test('should work with compression middleware', async () => {
      const res = await request(app)
        .get('/health/simple')
        .set('Accept-Encoding', 'gzip')
      
      expect(res.headers['x-frame-options']).toBe('DENY')
      expect(res.headers['content-security-policy']).toBeDefined()
    })

    test('should work with JSON parsing middleware', async () => {
      const res = await request(app)
        .post('/api/test')
        .send({ test: 'data' })
      
      // Should get 404 but still have security headers
      expect(res.status).toBe(404)
      expect(res.headers['x-frame-options']).toBe('DENY')
    })
  })
})
