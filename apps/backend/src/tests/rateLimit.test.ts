import request from 'supertest';
import { app } from '../index';
import User from '@/models/User';
import { redis } from '@/config/redis';
import { rateLimitService } from '@/services/rateLimitService';

describe('Rate Limiting System', () => {
  let testUser: any;
  let authToken: string;
  let testAddress: string;

  beforeAll(async () => {
    // Connect to Redis for testing
    try {
      await redis.connect();
    } catch (error) {
      console.warn('Redis not available for testing, using memory fallback');
    }

    // Create a test user
    testAddress = 'GD5DJQD7K5LRZP7MFN5U6GZ7A4FQ3Y5Z2FQ3Y5Z2FQ3Y5Z2FQ3Y5Z2FQ';
    testUser = await User.create({
      address: testAddress,
      username: 'testuser',
      tier: 'verified',
      isVerified: true
    });

    // Get auth token
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        address: testAddress,
        signature: 'test-signature',
        username: 'testuser'
      });

    authToken = loginResponse.body.data.token;
  });

  afterAll(async () => {
    // Clean up test data
    await User.deleteOne({ address: testAddress });
    
    // Reset rate limits for test user
    await rateLimitService.resetRateLimit(testAddress, 'standard');
    await rateLimitService.resetRateLimit(testAddress, 'ai');

    // Disconnect Redis
    try {
      await redis.disconnect();
    } catch (error) {
      console.warn('Redis disconnect error:', error);
    }
  });

  describe('Anonymous Rate Limiting', () => {
    it('should allow anonymous requests within limit', async () => {
      const response = await request(app)
        .get('/api/rate-limit/status')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.standard.tier).toBe('anonymous');
      expect(response.body.data.standard.limit).toBe(5);
    });

    it('should enforce anonymous rate limits', async () => {
      // Make multiple requests to exceed limit
      const promises = Array(7).fill(null).map(() =>
        request(app).get('/api/rate-limit/status')
      );

      const responses = await Promise.all(promises);
      
      // First 5 should succeed
      for (let i = 0; i < 5; i++) {
        expect(responses[i].status).toBe(200);
      }
      
      // Last 2 should be rate limited
      for (let i = 5; i < 7; i++) {
        expect(responses[i].status).toBe(429);
        expect(responses[i].body.message).toContain('Anonymous limit reached');
      }
    });
  });

  describe('Verified User Rate Limiting', () => {
    it('should allow verified user requests within limit', async () => {
      const response = await request(app)
        .get('/api/rate-limit/status')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.standard.tier).toBe('verified');
      expect(response.body.data.standard.limit).toBe(15);
    });

    it('should enforce verified user rate limits', async () => {
      // Make multiple requests to exceed limit
      const promises = Array(17).fill(null).map(() =>
        request(app)
          .get('/api/rate-limit/status')
          .set('Authorization', `Bearer ${authToken}`)
      );

      const responses = await Promise.all(promises);
      
      // First 15 should succeed
      for (let i = 0; i < 15; i++) {
        expect(responses[i].status).toBe(200);
      }
      
      // Last 2 should be rate limited
      for (let i = 15; i < 17; i++) {
        expect(responses[i].status).toBe(429);
        expect(responses[i].body.message).toContain('Verified user limit reached');
      }
    });
  });

  describe('Premium User Rate Limiting', () => {
    let premiumToken: string;
    let premiumAddress: string;

    beforeAll(async () => {
      // Create a premium user
      premiumAddress = 'GD5DJQD7K5LRZP7MFN5U6GZ7A4FQ3Y5Z2FQ3Y5Z2FQ3Y5Z2FQ3Y5Z2FP';
      const premiumUser = await User.create({
        address: premiumAddress,
        username: 'premiumuser',
        tier: 'premium',
        isVerified: true
      });

      // Get auth token for premium user
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          address: premiumAddress,
          signature: 'test-signature',
          username: 'premiumuser'
        });

      premiumToken = loginResponse.body.data.token;
    });

    afterAll(async () => {
      // Clean up premium user
      await User.deleteOne({ address: premiumAddress });
      
      // Reset rate limits
      await rateLimitService.resetRateLimit(premiumAddress, 'standard');
      await rateLimitService.resetRateLimit(premiumAddress, 'ai');
    });

    it('should allow premium user requests within limit', async () => {
      const response = await request(app)
        .get('/api/rate-limit/status')
        .set('Authorization', `Bearer ${premiumToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.standard.tier).toBe('premium');
      expect(response.body.data.standard.limit).toBe(50);
    });

    it('should enforce premium user rate limits', async () => {
      // Make multiple requests to exceed limit
      const promises = Array(52).fill(null).map(() =>
        request(app)
          .get('/api/rate-limit/status')
          .set('Authorization', `Bearer ${premiumToken}`)
      );

      const responses = await Promise.all(promises);
      
      // First 50 should succeed
      for (let i = 0; i < 50; i++) {
        expect(responses[i].status).toBe(200);
      }
      
      // Last 2 should be rate limited
      for (let i = 50; i < 52; i++) {
        expect(responses[i].status).toBe(429);
        expect(responses[i].body.message).toContain('Premium tier limit reached');
      }
    });
  });

  describe('AI Generation Rate Limiting', () => {
    it('should apply different limits for AI generation endpoints', async () => {
      const response = await request(app)
        .get('/api/rate-limit/status')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.ai.tier).toBe('verified');
      expect(response.body.data.ai.limit).toBe(5); // Verified users get 5 AI generations per day
    });

    it('should have stricter limits for anonymous users on AI endpoints', async () => {
      const response = await request(app)
        .get('/api/rate-limit/status')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.ai.tier).toBe('anonymous');
      expect(response.body.data.ai.limit).toBe(1); // Anonymous users get 1 AI generation per day
    });
  });

  describe('Rate Limit Headers', () => {
    it('should include rate limit headers in responses', async () => {
      const response = await request(app)
        .get('/api/rate-limit/status')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.headers['x-ratelimit-limit']).toBeDefined();
      expect(response.headers['x-ratelimit-remaining']).toBeDefined();
      expect(response.headers['x-ratelimit-reset']).toBeDefined();
      expect(response.headers['x-ratelimit-tier']).toBe('verified');
    });
  });

  describe('Rate Limit Status API', () => {
    it('should return current rate limit status', async () => {
      const response = await request(app)
        .get('/api/rate-limit/status')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('standard');
      expect(response.body.data).toHaveProperty('ai');
      
      const standard = response.body.data.standard;
      expect(standard).toHaveProperty('allowed');
      expect(standard).toHaveProperty('remaining');
      expect(standard).toHaveProperty('limit');
      expect(standard).toHaveProperty('resetTime');
      expect(standard).toHaveProperty('windowMs');
      expect(standard).toHaveProperty('tier');
    });
  });

  describe('Redis Integration', () => {
    it('should use Redis for distributed rate limiting when available', async () => {
      const stats = await rateLimitService.getRateLimitStats();
      
      if (stats.redisConnected) {
        console.log('✅ Redis is connected and being used for distributed rate limiting');
      } else {
        console.log('⚠️ Redis not available, using memory fallback');
      }
      
      expect(stats).toHaveProperty('redisConnected');
      expect(stats).toHaveProperty('memoryStoreSize');
      expect(stats).toHaveProperty('totalTrackedIdentifiers');
    });
  });
});
