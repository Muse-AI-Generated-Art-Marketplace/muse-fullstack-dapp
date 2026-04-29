# API Analytics and Monitoring System

## Overview

This document describes the comprehensive API analytics and monitoring system implemented for the Muse AI Generated Art Marketplace backend. The system provides real-time visibility into API usage, performance metrics, error tracking, and automated alerting.

## Features

### 1. Request Analytics
- **API Call Tracking**: Records all API requests with method, endpoint, status code, and response time
- **Response Time Monitoring**: Tracks individual request response times and calculates aggregates
- **Error Rate Tracking**: Monitors HTTP error rates by endpoint and overall
- **User Analytics**: Tracks API usage by user ID and IP address
- **Request/Response Size**: Monitors payload sizes for bandwidth analysis

### 2. Real-time Monitoring
- **WebSocket Service**: Real-time metrics streaming to monitoring dashboards
- **Live Metrics**: Current request rates, error rates, and response times
- **Performance Monitoring**: CPU, memory, and system resource tracking
- **Alert System**: Automated alerts for high error rates, slow responses, and resource usage

### 3. Data Aggregation
- **Hourly Aggregation**: Pre-computed hourly statistics for fast querying
- **Daily Aggregation**: Daily summaries with top endpoints and errors
- **Percentile Calculations**: P95 and P99 response time tracking
- **Trend Analysis**: Historical data for performance trends

### 4. Error Tracking
- **Detailed Error Logging**: Complete error context including stack traces
- **Error Classification**: Groups errors by type and endpoint
- **Error Rate Analysis**: Tracks error patterns and frequencies
- **Alert Integration**: Real-time error notifications

## Architecture

### Data Models

#### ApiRequestAnalytics
```typescript
{
  timestamp: Date,
  method: string,
  endpoint: string,
  statusCode: number,
  responseTime: number,
  requestSize?: number,
  responseSize?: number,
  ip: string,
  userAgent?: string,
  referer?: string,
  userId?: string,
  traceId?: string,
  error?: string
}
```

#### HourlyAnalytics
```typescript
{
  hour: Date,
  endpoint: string,
  method: string,
  totalRequests: number,
  successRequests: number,
  errorRequests: number,
  averageResponseTime: number,
  minResponseTime: number,
  maxResponseTime: number,
  p95ResponseTime: number,
  p99ResponseTime: number,
  totalRequestSize: number,
  totalResponseSize: number,
  uniqueUsers: number,
  uniqueIPs: number,
  errorRate: number
}
```

#### DailyAnalytics
```typescript
{
  date: Date,
  totalRequests: number,
  successRequests: number,
  errorRequests: number,
  averageResponseTime: number,
  uniqueUsers: number,
  uniqueIPs: number,
  topEndpoints: Array<{
    endpoint: string,
    requests: number,
    averageResponseTime: number
  }>,
  topErrors: Array<{
    error: string,
    count: number,
    endpoint: string
  }>,
  trafficByHour: Array<{
    hour: number,
    requests: number
  }>
}
```

#### ErrorAnalytics
```typescript
{
  timestamp: Date,
  errorType: string,
  errorMessage: string,
  stack?: string,
  endpoint: string,
  method: string,
  statusCode: number,
  userId?: string,
  ip: string,
  userAgent?: string,
  traceId?: string,
  context?: Record<string, any>
}
```

#### PerformanceMetrics
```typescript
{
  timestamp: Date,
  metricType: 'cpu' | 'memory' | 'disk' | 'network',
  value: number,
  unit: string,
  tags?: Record<string, string>
}
```

### Components

#### 1. Analytics Middleware (`analyticsMiddleware.ts`)
- **Request Tracking**: Intercepts all API requests to collect metrics
- **Response Analysis**: Captures response times and status codes
- **Error Handling**: Records detailed error information
- **Sampling**: Configurable sampling rates for production environments

#### 2. Analytics Service (`analyticsService.ts`)
- **Data Collection**: Core service for recording analytics data
- **Aggregation Jobs**: Hourly and daily data aggregation
- **Performance Monitoring**: System resource tracking
- **Data Cleanup**: Automated cleanup of old data

#### 3. Real-time Monitoring (`realTimeMonitoringService.ts`)
- **WebSocket Server**: Real-time data streaming to clients
- **Metrics Broadcasting**: Live metrics updates every 5 seconds
- **Alert System**: Configurable alert thresholds
- **Client Management**: Connection handling and subscription management

#### 4. Analytics Controller (`analyticsController.ts`)
- **REST API Endpoints**: HTTP endpoints for analytics data
- **Data Querying**: Flexible querying with date ranges and filters
- **Aggregation Triggers**: Manual aggregation endpoints
- **Health Monitoring**: Analytics system health checks

## API Endpoints

### Real-time Metrics
```
GET /api/analytics/metrics/realtime?timeRange=1h|6h|24h
```
Returns current real-time metrics for the specified time range.

### Daily Analytics
```
GET /api/analytics/daily?startDate=2024-01-01&endDate=2024-01-31&limit=30
```
Returns daily analytics summaries with optional date filtering.

### Hourly Analytics
```
GET /api/analytics/hourly?startDate=2024-01-01&endDate=2024-01-02&endpoint=/api/artworks&method=GET
```
Returns hourly analytics with filtering options.

### Error Analytics
```
GET /api/analytics/errors?startDate=2024-01-01&errorType=ValidationError&limit=50
```
Returns detailed error information with filtering.

### Performance Metrics
```
GET /api/analytics/performance?metricType=cpu&startDate=2024-01-01&limit=100
```
Returns system performance metrics.

### API Usage Statistics
```
GET /api/analytics/usage?days=7
```
Returns comprehensive API usage statistics and trends.

### Analytics Health
```
GET /api/analytics/health
```
Returns health status of the analytics system.

### Manual Aggregation
```
POST /api/analytics/aggregate
{
  "type": "hourly" | "daily",
  "date": "2024-01-01T00:00:00Z"
}
```
Triggers manual data aggregation.

### Data Cleanup
```
POST /api/analytics/cleanup
{
  "retentionDays": 90
}
```
Cleans up old analytics data.

## WebSocket API

### Connection
```
ws://localhost:8080
```

### Message Types

#### Subscribe to Channels
```json
{
  "type": "subscribe",
  "channels": ["metrics", "errors", "performance", "alerts"]
}
```

#### Unsubscribe from Channels
```json
{
  "type": "unsubscribe",
  "channels": ["errors"]
}
```

#### Ping/Pong
```json
{
  "type": "ping"
}
```

### Server Messages

#### Metrics Update
```json
{
  "channel": "metrics",
  "type": "metrics_update",
  "data": {
    "timestamp": "2024-01-01T12:00:00Z",
    "totalRequests": 1000,
    "errorRate": 2.5,
    "averageResponseTime": 150,
    "activeConnections": 5,
    "memoryUsage": 134217728,
    "cpuUsage": 0.5
  }
}
```

#### Alert Notification
```json
{
  "channel": "alerts",
  "type": "alerts",
  "data": [
    {
      "type": "high_error_rate",
      "severity": "warning",
      "message": "Error rate is 15.00%",
      "threshold": 10,
      "value": 15.0
    }
  ]
}
```

## Configuration

### Environment Variables
```bash
# Analytics Configuration
ANALYTICS_SAMPLE_RATE=0.1          # Sample rate for production (0.1 = 10%)
ANALYTICS_RETENTION_DAYS=90          # Data retention period
ANALYTICS_WS_PORT=8080              # WebSocket server port

# Alert Thresholds
ANALYTICS_ERROR_RATE_THRESHOLD=10     # Error rate % threshold
ANALYTICS_RESPONSE_TIME_THRESHOLD=2000 # Response time ms threshold
ANALYTICS_MEMORY_THRESHOLD=500       # Memory usage MB threshold
```

### Middleware Configuration
```typescript
app.use(analyticsMiddleware({
  excludePaths: ['/health', '/metrics', '/api/analytics/health'],
  sampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  includeRequestBody: false,
  includeResponseBody: false
}))
```

## Performance Considerations

### Data Collection
- **Sampling**: Use sampling in production to reduce overhead
- **Async Processing**: All analytics operations are non-blocking
- **Batch Operations**: Bulk writes for better performance
- **Indexes**: Database indexes optimized for query patterns

### Storage Optimization
- **Data Retention**: Automatic cleanup of old data
- **Compression**: Data compression for long-term storage
- **Aggregation**: Pre-computed aggregates for fast queries
- **Partitioning**: Time-based partitioning for large datasets

### Memory Management
- **Connection Pooling**: Efficient database connection management
- **Cache Usage**: Redis caching for frequently accessed data
- **Garbage Collection**: Regular cleanup of WebSocket connections
- **Resource Monitoring**: Real-time resource usage tracking

## Monitoring and Alerting

### Alert Types
1. **High Error Rate**: Triggers when error rate exceeds threshold
2. **High Response Time**: Triggers when average response time exceeds threshold
3. **High Memory Usage**: Triggers when memory usage exceeds threshold
4. **Service Health**: Triggers when analytics service is unhealthy

### Alert Channels
- **WebSocket**: Real-time alerts to connected monitoring clients
- **Logs**: Detailed alert information in application logs
- **Metrics**: Alert counts and severity tracking

## Deployment

### Database Setup
```javascript
// Create indexes for optimal performance
db.api_request_analytics.createIndex({ timestamp: -1 })
db.api_request_analytics.createIndex({ endpoint: 1, timestamp: -1 })
db.api_request_analytics.createIndex({ statusCode: 1, timestamp: -1 })
db.hourly_analytics.createIndex({ hour: -1 })
db.daily_analytics.createIndex({ date: -1 })
```

### Service Configuration
```typescript
// Start analytics services
analyticsService.startPerformanceMonitoring(60000)
realTimeMonitoringService.start(8080)

// Schedule aggregation jobs
setInterval(() => {
  analyticsService.aggregateHourlyAnalytics(new Date())
}, 60 * 60 * 1000) // Every hour

setInterval(() => {
  analyticsService.aggregateDailyAnalytics(new Date())
}, 24 * 60 * 60 * 1000) // Every day
```

## Security Considerations

### Data Privacy
- **PII Protection**: No personal data stored in analytics
- **IP Anonymization**: Optional IP address anonymization
- **Data Retention**: Configurable data retention policies
- **Access Control**: Role-based access to analytics data

### Performance Impact
- **Minimal Overhead**: Async processing prevents API slowdown
- **Sampling**: Reduces impact in production environments
- **Resource Limits**: Configurable limits on data collection
- **Error Isolation**: Analytics failures don't affect main API

## Troubleshooting

### Common Issues

1. **High Memory Usage**
   - Check data retention settings
   - Verify aggregation jobs are running
   - Monitor WebSocket connection count

2. **Missing Data**
   - Verify middleware is properly configured
   - Check database connection
   - Review sampling rate settings

3. **Slow Queries**
   - Verify database indexes
   - Check aggregation job performance
   - Monitor query patterns

### Debug Mode
```typescript
// Enable debug logging
app.use(analyticsMiddleware({
  sampleRate: 1.0, // 100% sampling
  includeRequestBody: true,
  includeResponseBody: true
}))
```

## Future Enhancements

### Planned Features
1. **Machine Learning**: Anomaly detection and predictive analytics
2. **Custom Dashboards**: User-configurable monitoring dashboards
3. **Integration**: Third-party monitoring service integration
4. **Advanced Alerts**: Multi-condition alert rules
5. **Export Features**: Data export and reporting capabilities

### Scalability Improvements
1. **Distributed Analytics**: Multi-instance analytics aggregation
2. **Stream Processing**: Real-time data streaming architecture
3. **Time Series Database**: Specialized analytics storage
4. **Edge Analytics**: Client-side analytics processing

## Support

For questions or issues related to the analytics system:
- Check application logs for detailed error information
- Review health endpoint: `/api/analytics/health`
- Monitor WebSocket connections and data flow
- Verify database connectivity and performance
