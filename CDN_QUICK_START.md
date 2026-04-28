# CDN Integration - Quick Start Guide

## 5-Minute Quick Start

### Step 1: Configure Environment (2 minutes)

Add to `apps/backend/.env`:
```bash
# Enable CDN
CDN_ENABLED=true
CDN_PROVIDER=custom
CDN_PRIMARY_URL=https://cdn.example.com
CDN_CORS_ORIGINS=http://localhost:3000
CDN_COMPRESSION_ENABLED=true
CDN_IMAGE_OPTIMIZATION=false
```

### Step 2: Start Services (1 minute)

```bash
# Terminal 1
npm run dev:backend

# Terminal 2  
npm run dev:frontend
```

### Step 3: Test CDN Endpoints (1 minute)

```bash
# Get CDN config
curl http://localhost:3001/api/cdn/config

# Generate asset URL
curl -X POST http://localhost:3001/api/cdn/asset-url \
  -H "Content-Type: application/json" \
  -d '{"assetPath": "/images/test.jpg"}'
```

### Step 4: Use in Frontend (1 minute)

```typescript
import cdnUtils from '@/utils/cdnUtils'

// Get image URL
const url = await cdnUtils.getImageUrl('/test.jpg')
console.log(url) // https://cdn.example.com/test.jpg
```

## Key Features

✅ **Global Content Delivery** - Serve assets from edge servers
✅ **Multiple Providers** - Cloudflare, AWS CloudFront, Fastly, custom
✅ **Image Optimization** - Automatic resizing and format conversion
✅ **Smart Caching** - Auto cache headers for versioned/non-versioned assets
✅ **Admin Tools** - Cache purging and monitoring endpoints
✅ **Health Monitoring** - Built-in CDN availability checks

## API Overview

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/cdn/config` | GET | Get CDN configuration |
| `/api/cdn/asset-url` | POST | Generate CDN URL for asset |
| `/api/cdn/image-url` | POST | Generate optimized image URL |
| `/api/cdn/health` | POST | Check CDN availability |
| `/api/cdn/stats` | GET | Get service statistics (admin) |
| `/api/cdn/purge-cache` | POST | Purge cache path (admin) |
| `/api/cdn/clear-cache` | POST | Clear cache (admin) |

## Frontend Usage

```typescript
// Option 1: Direct utility
import cdnUtils from '@/utils/cdnUtils'
const url = await cdnUtils.getImageUrl('/image.jpg', { width: 800 })

// Option 2: React Hook
import { useCDNImage } from '@/hooks/useCDN'
const { imageUrl, loading } = useCDNImage('/image.jpg', { width: 800 })

// Option 3: Responsive images
const srcset = await cdnUtils.getResponsiveImageSrcSet('/image.jpg')
```

## Environment Variables

```bash
# Required
CDN_ENABLED=true|false
CDN_PROVIDER=cloudflare|aws|fastly|custom
CDN_PRIMARY_URL=https://your-cdn.com

# Optional
CDN_FALLBACK_URL=https://fallback-cdn.com
CDN_IMAGE_OPTIMIZATION=true|false
CDN_COMPRESSION_ENABLED=true|false
CDN_CORS_ORIGINS=origin1,origin2
CDN_CACHE_CONTROL=public, max-age=31536000, immutable

# Provider-specific
CLOUDFLARE_API_TOKEN=token
CLOUDFLARE_ZONE_ID=zone_id
FASTLY_API_TOKEN=token
```

## See Also

- [Full CDN Integration Guide](./CDN_INTEGRATION_GUIDE.md) - Complete setup
- [Testing Guide](./CDN_INTEGRATION_TESTING_GUIDE.md) - Test procedures
- [Service Implementation](./apps/backend/src/services/cdnService.ts) - Source code

## Common Issues

**CDN not working?**
```bash
# Check if enabled
curl http://localhost:3001/api/cdn/config

# Check health
curl -X POST http://localhost:3001/api/cdn/health
```

**Image optimization not working?**
- Verify `CDN_IMAGE_OPTIMIZATION=true`
- Check your CDN provider supports it
- Verify provider is configured

**Frontend can't reach backend?**
- Check `VITE_API_URL` in `apps/frontend/.env`
- Verify backend is running on correct port
- Check CORS origins configuration

---

**Next:** Follow the [Full Integration Guide](./CDN_INTEGRATION_GUIDE.md) for complete setup with your CDN provider.
