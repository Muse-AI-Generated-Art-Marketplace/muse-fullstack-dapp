# CDN Integration Setup Guide

This guide explains how to configure and use the CDN integration for faster global content delivery in the Muse DApp.

## Overview

The CDN integration provides:
- **Global Content Delivery**: Serve static assets from edge locations worldwide
- **Multiple CDN Provider Support**: Cloudflare, AWS CloudFront, Fastly, or custom CDN
- **Image Optimization**: Automatic image resizing and format conversion
- **Intelligent Caching**: Automatic cache header management for versioned and non-versioned assets
- **Cache Management**: Admin endpoints for cache purging and invalidation
- **Health Monitoring**: Built-in health checks and availability monitoring

## Environment Configuration

### Backend Environment Variables

Add these variables to `apps/backend/.env`:

```bash
# CDN Configuration
CDN_ENABLED=true
CDN_PROVIDER=cloudflare  # Options: cloudflare, aws, fastly, custom
CDN_PRIMARY_URL=https://cdn.example.com
CDN_FALLBACK_URL=https://cdn-fallback.example.com
CDN_CORS_ORIGINS=https://example.com,https://app.example.com
CDN_COMPRESSION_ENABLED=true
CDN_IMAGE_OPTIMIZATION=true
CDN_IMAGE_URL=https://images.example.com
CDN_CACHE_CONTROL=public, max-age=31536000, immutable

# Cloudflare Specific (if using Cloudflare)
CLOUDFLARE_API_TOKEN=your_cloudflare_api_token
CLOUDFLARE_ZONE_ID=your_cloudflare_zone_id

# AWS Specific (if using AWS CloudFront)
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
AWS_CLOUDFRONT_DISTRIBUTION_ID=your_distribution_id

# Fastly Specific (if using Fastly)
FASTLY_API_TOKEN=your_fastly_api_token
```

### Frontend Environment Variables

Add these variables to `apps/frontend/.env`:

```bash
# API Configuration
VITE_API_URL=http://localhost:3001

# CDN Configuration (optional, fetched from backend)
VITE_CDN_ENABLED=true
VITE_CDN_PROVIDER=cloudflare
```

## CDN Provider Setup

### Cloudflare CDN Setup

1. **Create Cloudflare Account**
   - Sign up at https://dash.cloudflare.com
   - Add your domain

2. **Configure Origin**
   - Set origin server to your backend domain
   - Enable "Full (strict)" SSL

3. **Get API Token**
   - Go to API Tokens
   - Create new token with `zone.cache_purge` permission
   - Copy token to `CLOUDFLARE_API_TOKEN`

4. **Get Zone ID**
   - Go to Overview
   - Scroll to "API" section
   - Copy Zone ID to `CLOUDFLARE_ZONE_ID`

5. **Enable Image Optimization (Optional)**
   - Go to Images > Polish
   - Enable Polish feature
   - Choose optimization level

### AWS CloudFront Setup

1. **Create CloudFront Distribution**
   ```
   - Origin: Your backend domain
   - Viewer protocol policy: Redirect HTTP to HTTPS
   - Default cache behavior TTL: 31536000 (1 year for versioned assets)
   ```

2. **Configure Lambda@Edge (Optional)**
   - For image optimization support
   - Deploy image optimization Lambda function

3. **Get Distribution Domain**
   - Copy distribution domain to `CDN_PRIMARY_URL`

4. **Configure AWS Credentials**
   - Create IAM user with `CloudFront` permissions
   - Add credentials to environment

### Fastly CDN Setup

1. **Create Fastly Account**
   - Sign up at https://www.fastly.com

2. **Create Service**
   - Create new service
   - Set origin to your backend domain
   - Configure cache settings

3. **Get API Token**
   - Go to Account > API Tokens
   - Create new token with `purge_all` permission
   - Copy token to `FASTLY_API_TOKEN`

4. **Get Service Domain**
   - Copy domain to `CDN_PRIMARY_URL`

### Custom CDN Setup

For other CDN providers:

1. **Configure Origin**
   - Point to your backend domain
   - Enable CORS headers

2. **Set CDN_PRIMARY_URL**
   - Set to your CDN domain

3. **Update CORS Origins**
   - Add your frontend domains to `CDN_CORS_ORIGINS`

## API Endpoints

### Public Endpoints

#### GET /api/cdn/config
Get public CDN configuration

**Response:**
```json
{
  "success": true,
  "data": {
    "enabled": true,
    "provider": "cloudflare",
    "primaryUrl": "https://cdn.example.com",
    "imageOptimization": true,
    "compressionEnabled": true
  }
}
```

#### POST /api/cdn/asset-url
Generate CDN URL for an asset

**Request:**
```json
{
  "assetPath": "/images/artwork.jpg",
  "options": {
    "width": 800,
    "height": 600,
    "quality": 85
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "originalPath": "/images/artwork.jpg",
    "cdnUrl": "https://cdn.example.com/images/artwork.jpg?width=800&height=600&quality=85",
    "options": {}
  }
}
```

#### POST /api/cdn/image-url
Generate optimized CDN URL for an image

**Request:**
```json
{
  "imagePath": "/artworks/piece.jpg",
  "options": {
    "width": 1024,
    "format": "webp",
    "quality": 80
  }
}
```

#### POST /api/cdn/health
Check CDN availability

**Response:**
```json
{
  "success": true,
  "data": {
    "healthy": true,
    "provider": "cloudflare",
    "primaryUrl": "https://cdn.example.com"
  }
}
```

### Admin Endpoints

#### GET /api/cdn/stats
Get CDN service statistics (admin only)

**Response:**
```json
{
  "success": true,
  "data": {
    "enabled": true,
    "provider": "cloudflare",
    "cachedUrls": 42
  }
}
```

#### POST /api/cdn/purge-cache
Purge CDN cache for specific path (admin only)

**Request:**
```json
{
  "path": "/images/artwork.jpg"
}
```

#### POST /api/cdn/clear-cache
Clear internal asset URL cache (admin only)

**Response:**
```json
{
  "success": true,
  "message": "CDN asset URL cache cleared"
}
```

## Frontend Usage

### Using CDN Utilities

```typescript
import cdnUtils from '@/utils/cdnUtils'

// Get optimized image URL
const imageUrl = await cdnUtils.getImageUrl('/images/artwork.jpg', {
  width: 800,
  height: 600,
  quality: 85,
  format: 'webp'
})

// Get asset URL
const assetUrl = await cdnUtils.getAssetUrl('/static/style.css')

// Get responsive image srcset
const srcset = await cdnUtils.getResponsiveImageSrcSet(
  '/images/artwork.jpg',
  [320, 640, 1024, 1920],
  'webp'
)

// Check CDN health
const health = await cdnUtils.checkCDNHealth()

// Get CDN configuration
const config = await cdnUtils.getCDNConfig()
```

### Using React Hooks

```typescript
import { useCDNImage, useResponsiveImage, useCDNHealth } from '@/hooks/useCDN'

function ArtworkImage() {
  const { imageUrl, loading, error } = useCDNImage(
    '/artworks/piece.jpg',
    {
      width: 800,
      height: 600,
      format: 'webp'
    }
  )

  if (loading) return <div>Loading...</div>
  if (error) return <div>Error loading image</div>

  return <img src={imageUrl} alt="Artwork" />
}

function ResponsiveArtwork() {
  const { srcset, loading } = useResponsiveImage('/artworks/piece.jpg', {
    sizes: [320, 640, 1024, 1920],
    format: 'webp'
  })

  if (loading) return <div>Loading...</div>

  return (
    <picture>
      <source srcSet={srcset} type="image/webp" />
      <img src="/artworks/piece.jpg" alt="Artwork" />
    </picture>
  )
}

function CDNStatus() {
  const { health, loading } = useCDNHealth()

  if (loading) return <div>Checking CDN...</div>

  return (
    <div>
      Status: {health?.healthy ? 'Healthy' : 'Degraded'} 
      Provider: {health?.provider}
    </div>
  )
}
```

## Cache Management

### Automatic Cache Headers

The system automatically applies cache headers based on asset type:

**Versioned Assets** (e.g., `main.a1b2c3d4.js`)
- Cache-Control: `public, max-age=31536000, immutable` (1 year)
- Best for build artifacts with content hashes

**Non-Versioned Assets** (e.g., `index.html`)
- Cache-Control: `public, max-age=3600, must-revalidate` (1 hour)
- Best for files that may change

### Manual Cache Purging

**Via API (Admin):**
```bash
curl -X POST http://localhost:3001/api/cdn/purge-cache \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"path": "/images/artwork.jpg"}'
```

**Via Frontend:**
```typescript
import cdnUtils from '@/utils/cdnUtils'

await cdnUtils.clearCDNCache(adminToken)
```

## Performance Optimization Tips

1. **Use Versioned Filenames**
   - Build tool should hash filenames
   - Enable aggressive caching (1 year+)

2. **Optimize Images**
   - Enable `CDN_IMAGE_OPTIMIZATION=true`
   - Use WebP format for modern browsers
   - Set appropriate quality levels (75-85 for photos)

3. **Enable Compression**
   - Keep `CDN_COMPRESSION_ENABLED=true`
   - Use gzip for text assets

4. **Leverage Browser Caching**
   - Use HTTP cache headers
   - Implement service workers for offline support

5. **Monitor Performance**
   - Check CDN health regularly
   - Monitor cache hit rates
   - Analyze performance metrics

## Troubleshooting

### CDN Not Working

1. **Check if enabled**
   ```bash
   curl http://localhost:3001/api/cdn/config
   ```

2. **Verify credentials**
   - Check `CDN_PRIMARY_URL` is correct
   - Verify API tokens for your provider

3. **Check CORS settings**
   - Ensure frontend domain in `CDN_CORS_ORIGINS`

4. **Test connectivity**
   ```bash
   curl https://your-cdn-domain.com
   ```

### Cache Not Updating

1. **Clear internal cache**
   ```bash
   curl -X POST http://localhost:3001/api/cdn/clear-cache \
     -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
   ```

2. **Purge provider cache**
   - Use provider's dashboard
   - Or use `/api/cdn/purge-cache` endpoint

3. **Check asset versioning**
   - Use versioned filenames for consistent cache busting

### Image Optimization Not Working

1. **Verify provider supports it**
   - Cloudflare, AWS, Fastly all support image optimization
   - Custom CDN may not

2. **Check configuration**
   ```bash
   CDN_IMAGE_OPTIMIZATION=true
   ```

3. **Verify parameters**
   - Width, height, format, quality all optional
   - Provider may have limits on optimization

## Monitoring

### Health Checks

The system includes automatic health monitoring:

```typescript
// Check CDN health
POST /api/cdn/health

// Response includes:
// - healthy: boolean
// - provider: string
// - primaryUrl: string
```

### Metrics

View CDN service metrics (admin only):

```bash
curl http://localhost:3001/api/cdn/stats \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

Response includes:
- CDN enabled status
- Provider in use
- Cached URLs count

## Security Considerations

1. **Admin Endpoints Protected**
   - Cache purging requires admin authentication
   - Cache clearing requires admin authentication

2. **CORS Configuration**
   - Set specific origins instead of wildcard when possible
   - Restricts who can access CDN resources

3. **API Tokens**
   - Store securely in environment variables
   - Rotate regularly
   - Use minimal permission tokens

4. **Content Security**
   - CDN respects security headers
   - HTTPS enforcement on production
   - Content validation on origin

## Next Steps

1. Choose your CDN provider
2. Set up account and get credentials
3. Configure environment variables
4. Test with development environment
5. Monitor performance improvements
6. Deploy to production

For more information, see:
- [Backend CDN Service Documentation](./services/cdnService.ts)
- [Frontend CDN Utilities](./src/utils/cdnUtils.ts)
- [CDN Middleware](./middleware/cdnMiddleware.ts)
