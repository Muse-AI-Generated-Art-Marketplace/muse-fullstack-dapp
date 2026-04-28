# Health Check Endpoints Documentation

## Overview

The Muse Backend provides comprehensive health check endpoints for monitoring service health, database connectivity, cache status, and external service availability. These endpoints are essential for:

- **Kubernetes/Container Orchestration**: Liveness and readiness probes
- **Load Balancers**: Health checks for traffic routing
- **Monitoring Systems**: Service health monitoring and alerting
- **Debugging**: Quick service status verification

## Available Endpoints

### 1. Comprehensive Health Check

**Endpoint**: `GET /health`

**Description**: Returns detailed health status of all services including database, cache, Stellar RPC, and AI services.

**Response**:

```json
{
  "status": "healthy" | "unhealthy" | "degraded",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "service": "muse-backend",
  "version": "1.0.0",
  "uptime": 3600000,
  "checks": {
    "database": {
      "status": "healthy",
      "responseTime": 5,
      "details": {
        "readyState": 1,
        "host": "localhost:27017",
        "name": "muse"
      }
    },
    "cache": {
      "status": "healthy",
      "responseTime": 2,
      "details": {
        "useRedis": true,
        "fallbackKeys": 0,
        "fallbackStats": { ... }
      }
    },
    "stellar": {
      "status": "healthy",
      "responseTime": 150,
      "details": {
        "network": "testnet",
        "rpcUrl": "https://horizon-testnet.stellar.org"
      }
    },
    "aiServices": {
      "status": "degraded",
      "responseTime": 200,
      "details": {
        "openai": {
          "status": "healthy",
          "responseTime": 180,
          "details": {
            "status": 200,
            "modelCount": 50
          }
        },
        "stability": {
          "status": "degraded",
          "error": "Stability AI API key not configured"
        }
      }
    }
  },
  "summary": {
    "total": 4,
    "healthy": 3,
    "unhealthy": 0,
    "degraded": 1
  }
}
```

**Status Values**:
- `healthy`: All critical services are operational
- `unhealthy`: One or more critical services are down
- `degraded`: Services are operational but with warnings (e.g., missing API keys)

### 2. Simple Health Check

**Endpoint**: `GET /health/simple`

**Description**: Returns a simple health status for backward compatibility and quick checks.

**Response**:

```json
{
  "status": "OK",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "service": "muse-backend"
}
```

### 3. Readiness Check

**Endpoint**: `GET /ready`

**Description**: Checks if the service is ready to accept traffic. Only checks critical services (database and cache).

**Response** (200 OK when ready):

```json
{
  "ready": true,
  "timestamp": "2024-01-01T00:00:00.000Z",
  "checks": {
    "database": {
      "status": "healthy",
      "responseTime": 5,
      "details": { ... }
    },
    "cache": {
      "status": "healthy",
      "responseTime": 2,
      "details": { ... }
    }
  }
}
```

**Response** (503 Service Unavailable when not ready):

```json
{
  "ready": false,
  "timestamp": "2024-01-01T00:00:00.000Z",
  "checks": {
    "database": {
      "status": "unhealthy",
      "error": "Database not connected"
    },
    "cache": {
      "status": "healthy",
      "responseTime": 2
    }
  }
}
```

**Use Case**: Kubernetes readiness probe - traffic is only routed when `ready: true`.

### 4. Liveness Check

**Endpoint**: `GET /live`

**Description**: Basic check if the service is responsive. Does not check external dependencies.

**Response**:

```json
{
  "alive": true,
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

**Use Case**: Kubernetes liveness probe - restarts the container if the endpoint is unreachable.

## Service Checks

### Database Check

The database health check verifies:
- MongoDB connection state
- Database responsiveness via admin ping
- Connection host and database name

**Status Levels**:
- `healthy`: Connected and responsive
- `degraded`: Connecting (readyState = 2)
- `unhealthy`: Not connected or error

### Cache Check

The cache health check verifies:
- Redis or in-memory cache availability
- Set/get operation functionality
- Cache statistics

**Status Levels**:
- `healthy`: Cache operations working
- `unhealthy`: Cache operations failing

### Stellar RPC Check

The Stellar health check verifies:
- Stellar Horizon RPC connectivity
- Network type (testnet/mainnet)
- RPC endpoint URL

**Status Levels**:
- `healthy`: RPC endpoint responsive
- `unhealthy`: RPC endpoint unreachable
- `degraded`: Skipped in test environment

### AI Services Check

The AI services health check verifies:
- OpenAI API connectivity and authentication
- Stability AI API connectivity and authentication

**Status Levels**:
- `healthy`: All configured AI services responsive
- `unhealthy`: One or more configured services failing
- `degraded`: Some services not configured or skipped in test environment

## Usage Examples

### Using cURL

```bash
# Comprehensive health check
curl http://localhost:3001/health

# Simple health check
curl http://localhost:3001/health/simple

# Readiness check
curl http://localhost:3001/ready

# Liveness check
curl http://localhost:3001/live
```

### Kubernetes Configuration

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: muse-backend
spec:
  containers:
  - name: backend
    image: muse-backend:latest
    ports:
    - containerPort: 3001
    livenessProbe:
      httpGet:
        path: /live
        port: 3001
      initialDelaySeconds: 30
      periodSeconds: 10
    readinessProbe:
      httpGet:
        path: /ready
        port: 3001
      initialDelaySeconds: 5
      periodSeconds: 5
```

### Load Balancer Health Check

Configure your load balancer to check `/health/simple` or `/ready` every 30 seconds.

## Monitoring and Alerting

### Recommended Monitoring Metrics

1. **Endpoint Response Time**: Track response times for each endpoint
2. **Status Changes**: Alert when status changes from healthy to unhealthy
3. **Individual Service Status**: Monitor database, cache, and external services separately

### Alert Thresholds

- **Critical**: Database or cache status = unhealthy
- **Warning**: AI services status = degraded
- **Info**: Stellar RPC status = unhealthy (if non-critical for your use case)

## Testing

Health check endpoints are tested in `src/tests/health.test.ts`.

Run tests:

```bash
npm test -- src/tests/health.test.ts
```

## Troubleshooting

### Database Unhealthy

- Check MongoDB connection string in `MONGODB_URI`
- Verify MongoDB is running and accessible
- Check network connectivity to MongoDB host

### Cache Unhealthy

- Check Redis connection if using Redis
- Verify Redis is running and accessible
- Check cache service configuration

### Stellar RPC Unhealthy

- Verify Stellar Horizon RPC URL is correct
- Check network connectivity to Stellar endpoint
- Verify network type (testnet/mainnet) matches configuration

### AI Services Degraded/Unhealthy

- Verify API keys are configured in environment variables
- Check API key validity
- Verify network connectivity to API endpoints
- Check API service status pages for outages

## Security Considerations

- Health check endpoints do not require authentication
- Consider restricting access in production environments using:
  - Network policies (Kubernetes)
  - Firewall rules
  - Reverse proxy authentication
  - IP whitelisting

## Performance Impact

- Health checks are designed to be lightweight
- Database and cache checks use simple operations
- External service checks have 5-second timeout
- All checks run in parallel for minimal latency
- Typical response time: < 200ms

## Environment Variables

The following environment variables affect health checks:

- `MONGODB_URI`: MongoDB connection string
- `REDIS_URL`: Redis connection URL (if using Redis)
- `OPENAI_API_KEY`: OpenAI API key (for AI services check)
- `STABILITY_API_KEY`: Stability AI API key (for AI services check)
- `NODE_ENV`: Environment (test mode skips external checks)
