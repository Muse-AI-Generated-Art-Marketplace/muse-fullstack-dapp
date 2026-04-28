import { Request, Response, NextFunction } from 'express'
import { createLogger } from '@/utils/logger'

const logger = createLogger('HTTP')

/**
 * Structured request/response logger middleware.
 *
 * Logs every incoming request and its corresponding response using the
 * application's JSON logger so that all HTTP activity appears in the same
 * structured format as the rest of the application logs.
 *
 * Fields logged:
 *   - requestId   – correlation ID from requestContext middleware
 *   - method      – HTTP verb
 *   - url         – full original URL (path + query string)
 *   - ip          – client IP address
 *   - userAgent   – User-Agent header value
 *   - statusCode  – HTTP response status (response log only)
 *   - duration    – elapsed time in milliseconds (response log only)
 */
export const requestLogger = (req: Request, res: Response, next: NextFunction): void => {
  const startTime = Date.now()

  logger.info('Incoming request', {
    requestId: req.requestId,
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    userAgent: req.headers['user-agent'],
  })

  res.on('finish', () => {
    const duration = Date.now() - startTime
    const meta = {
      requestId: req.requestId,
      method: req.method,
      url: req.originalUrl,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
    }

    if (res.statusCode >= 500) {
      logger.error('Request completed', meta)
    } else if (res.statusCode >= 400) {
      logger.warn('Request completed', meta)
    } else {
      logger.info('Request completed', meta)
    }
  })

  next()
}
