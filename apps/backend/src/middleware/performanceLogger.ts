/**
 * Performance logging middleware.
 *
 * Attaches a high-resolution timer to each request and logs a warning when
 * a response takes longer than the configured threshold.  This helps surface
 * slow endpoints without requiring an external APM tool.
 *
 * Environment variables:
 *   PERF_WARN_THRESHOLD_MS  – warn threshold in ms (default: 1000)
 *   PERF_ERROR_THRESHOLD_MS – error threshold in ms (default: 5000)
 */

import { Request, Response, NextFunction } from 'express'
import { createLogger } from '@/utils/logger'

const logger = createLogger('Performance')

const WARN_THRESHOLD = parseInt(process.env.PERF_WARN_THRESHOLD_MS ?? '1000', 10)
const ERROR_THRESHOLD = parseInt(process.env.PERF_ERROR_THRESHOLD_MS ?? '5000', 10)

export const performanceLogger = (req: Request, res: Response, next: NextFunction): void => {
  const startHr = process.hrtime.bigint()

  res.on('finish', () => {
    const durationMs = Math.round(Number(process.hrtime.bigint() - startHr) / 1_000_000 * 100) / 100

    if (durationMs >= ERROR_THRESHOLD) {
      logger.error('Slow request detected', {
        requestId: req.requestId,
        method: req.method,
        url: req.originalUrl,
        statusCode: res.statusCode,
        durationMs,
        threshold: ERROR_THRESHOLD,
      })
    } else if (durationMs >= WARN_THRESHOLD) {
      logger.warn('Slow request detected', {
        requestId: req.requestId,
        method: req.method,
        url: req.originalUrl,
        statusCode: res.statusCode,
        durationMs,
        threshold: WARN_THRESHOLD,
      })
    }
  })

  next()
}
