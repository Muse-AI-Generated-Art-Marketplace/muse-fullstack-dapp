# CDN Integration Testing Guide

This guide provides step-by-step instructions to test the CDN integration implementation.

## Prerequisites

- Node.js >= 18.0.0
- npm >= 9.0.0
- MongoDB running (local or Docker)
- Backend running on http://localhost:3001
- Frontend running on http://localhost:3000

## Setup Steps

### 1. Configure Environment Variables

#### Backend Setup

1. **Copy and update backend environment file:**
   ```bash
   cp apps/backend/.env.example apps/backend/.env
   ```

2. **Add CDN configuration to `apps/backend/.env`:**
   ```bash
   # CDN Configuration (Development)
   CDN_ENABLED=true
   CDN_PROVIDER=custom
   CDN_PRIMARY_URL=https://cdn.example.com
   CDN_FALLBACK_URL=https://cdn-fallback.example.com
   CDN_CORS_ORIGINS=http://localhost:3000
   CDN_COMPRESSION_ENABLED=true
   CDN_IMAGE_OPTIMIZATION=false
   CDN_CACHE_CONTROL=public, max-age=31536000, immutable
   ```

#### Frontend Setup

1. **Copy frontend environment file:**
   ```bash
   cp apps/frontend/.env.example apps/frontend/.env
   ```

2. **Ensure API URL is configured:**
   ```bash
   VITE_API_URL=http://localhost:3001
   VITE_CDN_ENABLED=true
   ```

### 2. Install Dependencies

```bash
# Install all dependencies
npm install

# Or install individually
npm install --workspace=muse-backend
npm install --workspace=muse-frontend
```

### 3. Start Services

#### Terminal 1: Start Backend
```bash
npm run dev:backend
```

Expected output:
```
✓ Server running on port 3001
✓ Connected to MongoDB
✓ Database indexes verified
```

#### Terminal 2: Start Frontend
```bash
npm run dev:frontend
```

Expected output:
```
✓ VITE v5.0.0 running at http://localhost:3000
```

## Test Suite 1: Backend API Testing

### Test 1.1: CDN Configuration Endpoint

**Test:** Get public CDN configuration

```bash
curl -X GET http://localhost:3001/api/cdn/config
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "enabled": true,
    "provider": "custom",
    "primaryUrl": "https://cdn.example.com",
    "imageOptimization": false,
    "compressionEnabled": true
  }
}
```

**✓ PASS:** Response includes all CDN configuration fields

### Test 1.2: Generate Asset URL

**Test:** Generate CDN URL for an asset

```bash
curl -X POST http://localhost:3001/api/cdn/asset-url \
  -H "Content-Type: application/json" \
  -d '{
    "assetPath": "/images/artwork.jpg",
    "options": {}
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "originalPath": "/images/artwork.jpg",
    "cdnUrl": "https://cdn.example.com/images/artwork.jpg",
    "options": {}
  }
}
```

**✓ PASS:** Asset URL correctly generated with CDN domain

### Test 1.3: Generate Image URL with Optimization

**Test:** Generate optimized image URL

```bash
curl -X POST http://localhost:3001/api/cdn/image-url \
  -H "Content-Type: application/json" \
  -d '{
    "imagePath": "/artworks/piece.jpg",
    "options": {
      "width": 800,
      "height": 600,
      "quality": 85
    }
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "originalPath": "/artworks/piece.jpg",
    "optimizedUrl": "/artworks/piece.jpg",
    "options": {
      "width": 800,
      "height": 600,
      "quality": 85
    }
  }
}
```

**✓ PASS:** Image URL generated with optimization parameters

### Test 1.4: CDN Health Check

**Test:** Check CDN availability

```bash
curl -X POST http://localhost:3001/api/cdn/health
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "healthy": true,
    "provider": "custom",
    "primaryUrl": "https://cdn.example.com"
  }
}
```

**✓ PASS:** CDN health check returns status

### Test 1.5: Invalid Request Handling

**Test:** Missing required parameter

```bash
curl -X POST http://localhost:3001/api/cdn/asset-url \
  -H "Content-Type: application/json" \
  -d '{}'
```

**Expected Response:**
```json
{
  "success": false,
  "error": "assetPath is required and must be a string"
}
```

**✓ PASS:** Proper error handling for invalid requests

## Test Suite 2: Response Headers Testing

### Test 2.1: Cache Headers for Static Assets

**Test:** Check cache control headers

```bash
curl -I -X GET http://localhost:3001/api/cdn/config
```

**Expected Headers:**
- Should include `Cache-Control` header
- Should include `Content-Encoding` header if compression enabled

**✓ PASS:** Proper cache headers included in response

### Test 2.2: CORS Headers

**Test:** Check CORS headers in response

```bash
curl -X OPTIONS http://localhost:3001/api/cdn/config \
  -H "Origin: http://localhost:3000" \
  -v
```

**Expected Headers:**
- `Access-Control-Allow-Origin: http://localhost:3000`
- `Access-Control-Allow-Methods: GET, HEAD, OPTIONS`

**✓ PASS:** CORS headers correctly set

## Test Suite 3: Frontend Integration Testing

### Test 3.1: Frontend CDN Utils Initialization

**Test:** Open browser console in http://localhost:3000

```javascript
// In browser console
import cdnUtils from './src/utils/cdnUtils.js'
cdnUtils.getCDNConfig().then(config => console.log(config))
```

**Expected Output:**
```javascript
{
  enabled: true,
  provider: "custom",
  primaryUrl: "https://cdn.example.com",
  imageOptimization: false,
  compressionEnabled: true
}
```

**✓ PASS:** Frontend can fetch CDN configuration from backend

### Test 3.2: Generate Image URL from Frontend

```javascript
// In browser console
cdnUtils.getImageUrl('/images/test.jpg', { width: 400, height: 300 })
  .then(url => console.log('Image URL:', url))
```

**Expected Output:**
```
Image URL: https://cdn.example.com/images/test.jpg
```

**✓ PASS:** Frontend successfully generates CDN image URLs

### Test 3.3: Check CDN Health from Frontend

```javascript
// In browser console
cdnUtils.checkCDNHealth().then(health => console.log(health))
```

**Expected Output:**
```javascript
{
  healthy: true,
  provider: "custom"
}
```

**✓ PASS:** Frontend can check CDN health

### Test 3.4: React Hook Usage

**Test:** Create a test component using CDN hooks

Create `apps/frontend/src/components/TestCDN.tsx`:

```typescript
import { useCDNImage, useCDNHealth, useCDNConfig } from '@/hooks/useCDN'

export function TestCDN() {
  const { imageUrl, loading: imgLoading } = useCDNImage('/test.jpg')
  const { health, loading: healthLoading } = useCDNHealth()
  const { config, loading: configLoading } = useCDNConfig()

  return (
    <div>
      <h2>CDN Test</h2>
      <p>Image URL: {imageUrl}</p>
      <p>CDN Status: {health?.healthy ? 'Healthy' : 'Unhealthy'}</p>
      <p>Provider: {config?.provider}</p>
    </div>
  )
}
```

**✓ PASS:** React hooks properly manage CDN data

## Test Suite 4: Cache Management

### Test 4.1: CDN Statistics (Admin Only)

**Test:** Get CDN service statistics

```bash
# First, get admin token (implementation specific)
curl -X GET http://localhost:3001/api/cdn/stats \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "enabled": true,
    "provider": "custom",
    "cachedUrls": 0
  }
}
```

**✓ PASS:** Statistics endpoint returns service data

### Test 4.2: Clear Internal Cache (Admin Only)

**Test:** Clear CDN asset URL cache

```bash
curl -X POST http://localhost:3001/api/cdn/clear-cache \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

**Expected Response:**
```json
{
  "success": true,
  "message": "CDN asset URL cache cleared"
}
```

**✓ PASS:** Cache successfully cleared

## Test Suite 5: Edge Cases and Error Scenarios

### Test 5.1: Disabled CDN

**Test:** Set CDN_ENABLED=false and test behavior

1. Update `apps/backend/.env`:
   ```bash
   CDN_ENABLED=false
   ```

2. Restart backend

3. Test configuration endpoint:
   ```bash
   curl http://localhost:3001/api/cdn/config
   ```

**Expected:**
- `enabled: false`
- Asset URLs should return original paths

**✓ PASS:** System gracefully handles disabled CDN

### Test 5.2: Missing CDN Primary URL

**Test:** Set CDN_ENABLED=true but no CDN_PRIMARY_URL

**Expected:**
- Warning logged to console
- CDN features limited but system continues

**✓ PASS:** System handles missing configuration gracefully

### Test 5.3: Concurrent Asset URL Requests

**Test:** Simulate multiple concurrent requests

```bash
for i in {1..10}; do
  curl -X POST http://localhost:3001/api/cdn/asset-url \
    -H "Content-Type: application/json" \
    -d "{\"assetPath\": \"/image$i.jpg\"}" &
done
wait
```

**Expected:**
- All requests complete successfully
- No race conditions
- URLs cached properly

**✓ PASS:** Concurrent requests handled correctly

## Test Suite 6: Performance Verification

### Test 6.1: Response Time

**Test:** Measure CDN endpoint response time

```bash
time curl http://localhost:3001/api/cdn/config
```

**Expected:**
- Response time < 100ms
- Faster on subsequent calls due to caching

**✓ PASS:** Performance is acceptable

### Test 6.2: Memory Usage

**Test:** Monitor memory during heavy usage

```bash
# Generate 1000 asset URLs and check memory
for i in {1..1000}; do
  curl -s -X POST http://localhost:3001/api/cdn/asset-url \
    -H "Content-Type: application/json" \
    -d "{\"assetPath\": \"/image$i.jpg\"}"
done
```

Monitor server memory - should not grow excessively

**✓ PASS:** Memory usage reasonable

## Test Suite 7: Integration with Existing Systems

### Test 7.1: Compatibility with Security Middleware

**Test:** Verify security headers are still applied

```bash
curl -I http://localhost:3001/api/cdn/config
```

**Expected Headers:**
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `Content-Security-Policy: ...`

**✓ PASS:** Security headers intact

### Test 7.2: Compatibility with Rate Limiting

**Test:** Verify rate limiting still applies

```bash
# Send many requests quickly
for i in {1..100}; do
  curl -s http://localhost:3001/api/cdn/config &
done
wait
```

**Expected:**
- Some requests may return 429 (Too Many Requests)
- Rate limiting properly applied

**✓ PASS:** Rate limiting works with CDN

## Test Suite 8: Documentation Verification

### Test 8.1: Check Documentation

Verify the following documentation files exist and are complete:

- [ ] `/CDN_INTEGRATION_GUIDE.md` - Complete setup guide
- [ ] `/apps/backend/src/services/cdnService.ts` - Well documented
- [ ] `/apps/backend/src/middleware/cdnMiddleware.ts` - Clear comments
- [ ] `/apps/backend/src/routes/cdn.ts` - API endpoints documented
- [ ] `/apps/frontend/src/utils/cdnUtils.ts` - Usage examples
- [ ] `/apps/frontend/src/hooks/useCDN.ts` - React hooks documented

**✓ PASS:** All documentation complete and clear

## Summary Checklist

After completing all tests, verify:

- [ ] Backend CDN service initialized correctly
- [ ] All CDN API endpoints functioning
- [ ] Response headers properly configured
- [ ] Frontend utilities working
- [ ] React hooks operational
- [ ] Cache management operational
- [ ] Error handling robust
- [ ] Security maintained
- [ ] Performance acceptable
- [ ] Documentation complete

## Troubleshooting

### Tests Failing?

1. **Check backend is running:**
   ```bash
   curl http://localhost:3001/health
   ```

2. **Check environment variables:**
   ```bash
   cat apps/backend/.env | grep CDN
   ```

3. **Check logs:**
   ```bash
   # Watch backend logs for errors
   npm run dev:backend 2>&1 | grep -i cdn
   ```

4. **Test MongoDB:**
   ```bash
   curl http://localhost:3001/health
   ```

### Common Issues

**Issue:** "CDN_ENABLED is not defined"
- **Solution:** Add `CDN_ENABLED=true` to `.env`

**Issue:** Network request timeout
- **Solution:** Ensure backend is running on correct port

**Issue:** CORS errors
- **Solution:** Verify `CDN_CORS_ORIGINS` includes your frontend URL

## Next Steps

1. ✓ Complete all tests above
2. ✓ Deploy to staging environment
3. ✓ Configure real CDN provider (Cloudflare, AWS, etc.)
4. ✓ Monitor performance metrics
5. ✓ Gather user feedback
6. ✓ Deploy to production

## Support

For issues or questions:
- Check CDN_INTEGRATION_GUIDE.md for configuration help
- Review service/middleware/route source code for implementation details
- Check backend logs for error messages
- Verify environment variables are set correctly
