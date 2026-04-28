/**
 * Structured HTTP request/response logger middleware.
 *
 * Logs every incoming request and its corresponding response at the 'http'
 * log level so HTTP traffic can be filtered independently from application
 * logs.  Uses high-resolution timers for accurate duration measurement.
 *
 * Fields logged on request:
 *   requestId, method, url, ip, userAgent, contentLength, contentType
 *
 * Fields logged on response:
 *   requestId, method, url, statusCode, durationMs, responseSize
 *   + userId if the request was authenticated
 */

import { Request, Response, NextFunction } from 'express'
import { createLogger } from '@/utils/logger'

const logger = createLogger('HTTP')

/** Routes that should not be logged (health probes, etc.) */
const SKIP_PATHS = new Set(['/health', '/health/simple', '/live', '/ready'])

export const requestLogger = (req: Request, res: Response, next: NextFunction): void => {
  if (SKIP_PATHS.has(req.path)) {
    return next()
  }

  const startHr = process.hrtime.bigint()

  logger.http('Incoming request', {
    requestId: req.requestId,
    method: req.method,
    url: req.originalUrl,
    ip: req.ip ?? req.socket.remoteAddress,
    userAgent: req.headers['user-agent'],
    contentLength: req.headers['content-length'],
    contentType: req.headers['content-type'],
  })

  res.on('finish', () => {
    const durationMs = Math.round(Number(process.hrtime.bigint() - startHr) / 1_000_000 * 100) / 100

    const meta = {
      requestId: req.requestId,
      method: req.method,
      url: req.originalUrl,
      statusCode: res.statusCode,
      durationMs,
      responseSize: res.getHeader('content-length'),
      // Attach userId when available (set by authMiddleware)
      userId: (req as Request & { user?: { id?: string } }).user?.id,
    }

    if (res.statusCode >= 500) {
      logger.error('Request completed', meta)
    } else if (res.statusCode >= 400) {
      logger.warn('Request completed', meta)
    } else {
      logger.http('Request completed', meta)
    }
  })

  next()
}
