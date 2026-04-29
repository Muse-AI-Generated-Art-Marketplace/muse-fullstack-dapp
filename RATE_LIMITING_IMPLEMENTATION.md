# Advanced Rate Limiting Implementation

## Overview

This implementation provides a comprehensive tier-based rate limiting system with Redis-based distributed rate limiting, user verification through wallet signatures, and admin management capabilities.

## Features Implemented

### ✅ Tier-Based Rate Limiting
- **Anonymous users**: 5 requests per 15 minutes
- **Verified users**: 15 requests per 15 minutes  
- **Premium users**: 50 requests per 15 minutes
- **AI Generation limits**: Anonymous (1/day), Verified (5/day), Premium (20/day)

### ✅ User Verification System
- Stellar wallet signature verification
- Challenge-based authentication with nonce
- Automatic user creation and tier assignment
- JWT token generation for authenticated sessions

### ✅ Redis-Based Distributed Rate Limiting
- Sliding window algorithm using Redis sorted sets
- Memory fallback when Redis is unavailable
- Automatic cleanup of expired entries
- Real-time rate limit status tracking

### ✅ Rate Limit Status API
- `/api/rate-limit/status` endpoint for checking current limits
- Detailed information about remaining requests and reset times
- Support for both authenticated and anonymous users

### ✅ Admin Dashboard for Tier Management
- User listing with pagination and search
- Tier modification capabilities
- Rate limit statistics and monitoring
- Individual user rate limit reset functionality

## Architecture

### Core Components

1. **Rate Limit Configuration** (`src/config/rateLimitConfig.ts`)
   - Defines tier limits and messages
   - Centralized configuration management

2. **Redis Connection** (`src/config/redis.ts`)
   - Redis client management with reconnection logic
   - Health monitoring and metrics collection

3. **Rate Limit Service** (`src/services/rateLimitService.ts`)
   - Core rate limiting logic
   - Redis and memory-based implementations
   - Sliding window algorithm

4. **Verification Service** (`src/services/verificationService.ts`)
   - Stellar wallet signature verification
   - Challenge generation and validation
   - User creation and management

5. **Rate Limit Middleware** (`src/middleware/rateLimitMiddleware.ts`)
   - Express middleware for API rate limiting
   - Dynamic tier-based limit application
   - Rate limit header management

6. **Admin Controllers** (`src/controllers/adminRateLimitController.ts`)
   - User management endpoints
   - Tier modification functionality
   - Rate limit statistics and monitoring

## API Endpoints

### Rate Limit Status
```
GET /api/rate-limit/status
```
Returns current rate limit status for the user.

**Response:**
```json
{
  "success": true,
  "data": {
    "standard": {
      "allowed": true,
      "remaining": 14,
      "limit": 15,
      "resetTime": "2024-01-01T12:15:00.000Z",
      "windowMs": 900000,
      "tier": "verified"
    },
    "ai": {
      "allowed": true,
      "remaining": 4,
      "limit": 5,
      "resetTime": "2024-01-02T00:00:00.000Z",
      "windowMs": 86400000,
      "tier": "verified"
    }
  }
}
```

### Authentication
```
GET /api/auth/challenge?address=<stellar_address>
POST /api/auth/login
```

### Admin Endpoints
```
GET /api/admin/users?page=1&limit=50&tier=verified&search=username
PUT /api/admin/users/:userId/tier
GET /api/admin/rate-limit/stats
POST /api/admin/users/:userId/reset-rate-limits?limitType=all
GET /api/admin/users/:userId/rate-limit-status
```

## Environment Variables

Add these to your `.env` file:

```env
# Redis Configuration
REDIS_URL=redis://localhost:6379
REDIS_PASSWORD=your_redis_password
REDIS_CONNECT_TIMEOUT_MS=10000

# Rate Limiting (optional overrides)
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_ANONYMOUS_LIMIT=5
RATE_LIMIT_VERIFIED_LIMIT=15
RATE_LIMIT_PREMIUM_LIMIT=50
```

## Setup Instructions

### 1. Redis Setup
```bash
# Install Redis
brew install redis  # macOS
# or
sudo apt-get install redis-server  # Ubuntu

# Start Redis
redis-server

# Verify Redis is running
redis-cli ping
```

### 2. Database Migration
The User model has been updated to support the new tier system. Existing users will be automatically updated to the 'verified' tier.

### 3. Update Frontend Integration
Update your frontend to:
1. Use the new authentication flow with wallet signatures
2. Handle rate limit headers in API responses
3. Display user tier information
4. Implement proper error handling for rate limit exceeded responses

## Rate Limit Headers

All API responses include rate limit headers:

- `X-RateLimit-Limit`: Maximum requests for the current window
- `X-RateLimit-Remaining`: Remaining requests in the current window
- `X-RateLimit-Reset`: Unix timestamp when the window resets
- `X-RateLimit-Tier`: Current user tier

## Testing

Run the comprehensive test suite:

```bash
npm test -- rateLimit.test.ts
```

The tests cover:
- Anonymous rate limiting
- Verified user rate limiting
- Premium user rate limiting
- AI generation rate limiting
- Rate limit headers
- Redis integration

## Monitoring and Metrics

### Redis Health Check
```bash
curl http://localhost:3001/health
```

### Rate Limit Statistics
```bash
curl -H "Authorization: Bearer <admin_token>" \
     http://localhost:3001/api/admin/rate-limit/stats
```

## Security Considerations

1. **Signature Verification**: All wallet signatures are cryptographically verified
2. **Challenge Expiration**: Authentication challenges expire after 5 minutes
3. **Rate Limit Fail-Open**: System allows requests if rate limiting fails
4. **Admin Authentication**: All admin endpoints require admin authentication
5. **Input Validation**: All inputs are validated using Zod schemas

## Performance Considerations

1. **Redis Sliding Window**: Efficient O(log N) operations for rate limit checks
2. **Memory Fallback**: Graceful degradation when Redis is unavailable
3. **Batch Operations**: Redis pipelines for multiple operations
4. **Connection Pooling**: Redis connection reuse for optimal performance

## Troubleshooting

### Common Issues

1. **Redis Connection Failed**
   - Check Redis server is running
   - Verify REDIS_URL environment variable
   - System will fall back to memory-based rate limiting

2. **Rate Limits Not Applied**
   - Verify middleware is properly applied to routes
   - Check user authentication status
   - Review rate limit configuration

3. **Signature Verification Failed**
   - Ensure Stellar wallet is signing the exact challenge message
   - Check that the signature is base64 encoded
   - Verify the correct public key is being used

## Future Enhancements

1. **Dynamic Rate Limits**: API-based limit configuration
2. **Burst Rate Limiting**: Allow short bursts within limits
3. **Geographic Rate Limiting**: Different limits by region
4. **Advanced Analytics**: Detailed rate limit usage analytics
5. **Webhook Notifications**: Rate limit exceeded alerts

## Migration Notes

- Existing users will be automatically assigned 'verified' tier
- Old rate limiting configuration is preserved for backward compatibility
- Database indexes are automatically created on startup
- Redis is optional - system works with memory-based rate limiting

---

This implementation provides a production-ready, scalable rate limiting system that meets all the requirements specified in issue #143.
