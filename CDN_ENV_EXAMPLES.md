# CDN Integration - Example Environment Configuration

This file shows example CDN configuration for different providers and scenarios.

## Basic Configuration (Development)

```bash
# Basic CDN setup for local development
CDN_ENABLED=true
CDN_PROVIDER=custom
CDN_PRIMARY_URL=https://cdn.example.com
CDN_FALLBACK_URL=
CDN_CORS_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
CDN_COMPRESSION_ENABLED=true
CDN_IMAGE_OPTIMIZATION=false
CDN_CACHE_CONTROL=public, max-age=3600, must-revalidate
```

## Cloudflare Configuration

```bash
# Cloudflare CDN Provider
CDN_ENABLED=true
CDN_PROVIDER=cloudflare
CDN_PRIMARY_URL=https://d123456.cloudfront.com
CDN_FALLBACK_URL=https://muse.example.com
CDN_CORS_ORIGINS=https://example.com,https://app.example.com
CDN_COMPRESSION_ENABLED=true
CDN_IMAGE_OPTIMIZATION=true
CDN_IMAGE_URL=https://images.example.com
CDN_CACHE_CONTROL=public, max-age=31536000, immutable

# Cloudflare API Credentials
CLOUDFLARE_API_TOKEN=your_cloudflare_api_token_here
CLOUDFLARE_ZONE_ID=your_zone_id_here
```

## AWS CloudFront Configuration

```bash
# AWS CloudFront CDN Provider
CDN_ENABLED=true
CDN_PROVIDER=aws
CDN_PRIMARY_URL=https://d1a2b3c4.cloudfront.net
CDN_FALLBACK_URL=https://muse.example.com
CDN_CORS_ORIGINS=https://example.com,https://app.example.com,https://admin.example.com
CDN_COMPRESSION_ENABLED=true
CDN_IMAGE_OPTIMIZATION=true
CDN_IMAGE_URL=https://images.example.com
CDN_CACHE_CONTROL=public, max-age=31536000, immutable

# AWS Credentials
AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE
AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
AWS_REGION=us-east-1
AWS_CLOUDFRONT_DISTRIBUTION_ID=E2EXAMPLE
```

## Fastly Configuration

```bash
# Fastly CDN Provider
CDN_ENABLED=true
CDN_PROVIDER=fastly
CDN_PRIMARY_URL=https://example.fastly.net
CDN_FALLBACK_URL=https://muse.example.com
CDN_CORS_ORIGINS=https://example.com,https://app.example.com
CDN_COMPRESSION_ENABLED=true
CDN_IMAGE_OPTIMIZATION=true
CDN_IMAGE_URL=https://images.example.com
CDN_CACHE_CONTROL=public, max-age=31536000, immutable

# Fastly API Credentials
FASTLY_API_TOKEN=your_fastly_api_token_here
FASTLY_SERVICE_ID=your_service_id_here
```

## Production Configuration - High Performance

```bash
# Production with aggressive caching and optimization
CDN_ENABLED=true
CDN_PROVIDER=cloudflare
CDN_PRIMARY_URL=https://cdn.example.com
CDN_FALLBACK_URL=https://cdn2.example.com
CDN_CORS_ORIGINS=https://example.com,https://app.example.com
CDN_COMPRESSION_ENABLED=true
CDN_IMAGE_OPTIMIZATION=true
CDN_IMAGE_URL=https://images.example.com
CDN_CACHE_CONTROL=public, max-age=31536000, immutable

# Enable all provider integrations
CLOUDFLARE_API_TOKEN=prod_cloudflare_token
CLOUDFLARE_ZONE_ID=prod_zone_id

# Additional optimization
CDN_PURGE_ENABLED=true
CDN_ANALYTICS_ENABLED=true
```

## Staging Configuration

```bash
# Staging environment configuration
CDN_ENABLED=true
CDN_PROVIDER=cloudflare
CDN_PRIMARY_URL=https://staging-cdn.example.com
CDN_FALLBACK_URL=https://staging.example.com
CDN_CORS_ORIGINS=https://staging.example.com,https://staging-app.example.com
CDN_COMPRESSION_ENABLED=true
CDN_IMAGE_OPTIMIZATION=true
CDN_CACHE_CONTROL=public, max-age=86400, must-revalidate

CLOUDFLARE_API_TOKEN=staging_cloudflare_token
CLOUDFLARE_ZONE_ID=staging_zone_id
```

## Development Configuration - Fast Iteration

```bash
# Development setup with shorter cache times
CDN_ENABLED=true
CDN_PROVIDER=custom
CDN_PRIMARY_URL=http://localhost:8080
CDN_CORS_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
CDN_COMPRESSION_ENABLED=false
CDN_IMAGE_OPTIMIZATION=false
CDN_CACHE_CONTROL=no-cache, no-store, must-revalidate

# Local CDN server (optional)
# Run: npx http-server dist -p 8080
```

## Testing Configuration

```bash
# Testing configuration with disabled CDN caching
CDN_ENABLED=true
CDN_PROVIDER=custom
CDN_PRIMARY_URL=https://test-cdn.example.com
CDN_CORS_ORIGINS=http://localhost:3000,http://localhost:3001
CDN_COMPRESSION_ENABLED=false
CDN_IMAGE_OPTIMIZATION=false
CDN_CACHE_CONTROL=no-cache, no-store, must-revalidate
```

## Multi-Region Configuration

```bash
# Setup for multi-region CDN with primary and fallback
CDN_ENABLED=true
CDN_PROVIDER=cloudflare
CDN_PRIMARY_URL=https://cdn-us.example.com
CDN_FALLBACK_URL=https://cdn-eu.example.com
CDN_CORS_ORIGINS=https://example.com,https://app.example.com,https://api.example.com
CDN_COMPRESSION_ENABLED=true
CDN_IMAGE_OPTIMIZATION=true
CDN_CACHE_CONTROL=public, max-age=31536000, immutable

# Region-specific optimization could be added here
CLOUDFLARE_API_TOKEN=multi_region_token
CLOUDFLARE_ZONE_ID=multi_region_zone
```

## Configuration Notes

### Cache Control Values Explained

```bash
# Aggressive caching (for versioned/hashed files)
max-age=31536000, immutable
# Files are cached for 1 year and never revalidated

# Moderate caching (for regular static assets)
max-age=86400, must-revalidate
# Files cached for 24 hours, revalidated after

# Short caching (for HTML/dynamic content)
max-age=3600, must-revalidate
# Files cached for 1 hour, revalidated after

# No caching
no-cache, no-store, must-revalidate
# Files never cached, always fetched fresh
```

### CORS Origins Best Practices

```bash
# Development (allow localhost)
CDN_CORS_ORIGINS=http://localhost:3000

# Staging (allow staging domains)
CDN_CORS_ORIGINS=https://staging.example.com,https://app-staging.example.com

# Production (specific domains only, no wildcards)
CDN_CORS_ORIGINS=https://example.com,https://app.example.com

# Emergency (if needed, but not recommended)
CDN_CORS_ORIGINS=*
```

### Image Optimization Parameters

When `CDN_IMAGE_OPTIMIZATION=true`, you can use these parameters:

```bash
# Width parameter (in pixels)
width=800

# Height parameter (in pixels)
height=600

# Quality parameter (1-100)
quality=85

# Format parameter
format=webp|avif|jpg|png
```

Example optimized URL:
```
https://cdn.example.com/images/artwork.jpg?width=800&height=600&quality=85&format=webp
```

## Validation Checklist

When setting up CDN configuration, verify:

- [ ] `CDN_ENABLED` is set to `true` or `false`
- [ ] `CDN_PROVIDER` is valid (cloudflare, aws, fastly, custom)
- [ ] `CDN_PRIMARY_URL` is valid HTTPS URL
- [ ] `CDN_CORS_ORIGINS` includes your frontend domains
- [ ] API tokens are secure and not committed to git
- [ ] Provider-specific credentials are set correctly
- [ ] Cache control values are appropriate for environment
- [ ] Image optimization is enabled only if supported

## Security Reminders

⚠️ **DO NOT commit this file with actual credentials**

Use `.gitignore` to exclude `.env` files:
```bash
# .gitignore
*.env
*.env.local
*.env.*.local
!.env.example
```

Use secure secret management:
- **Development:** Local `.env` file (gitignored)
- **Staging/Production:** Use platform secrets (GitHub Actions, Vercel, etc.)
- **Enterprise:** Use HashiCorp Vault or similar

## Related Documentation

- [CDN Integration Guide](./CDN_INTEGRATION_GUIDE.md)
- [Quick Start Guide](./CDN_QUICK_START.md)
- [Testing Guide](./CDN_INTEGRATION_TESTING_GUIDE.md)
