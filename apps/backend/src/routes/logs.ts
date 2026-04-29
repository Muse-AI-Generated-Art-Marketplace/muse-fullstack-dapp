/**
 * /logs  – Frontend error ingestion and log query endpoints.
 *
 * POST /logs        – Accepts client-side error reports (browser, React error boundaries)
 * GET  /logs        – Query recent log entries from file (admin only, non-production)
 */

import fs from 'fs'
import path from 'path'
import readline from 'readline'
import { Router, Request, Response, NextFunction } from 'express'
import { createLogger } from '@/utils/logger'
import { logConfig } from '@/config/logConfig'

const router = Router()
const logger = createLogger('LogsRoute')

// ─── Types ────────────────────────────────────────────────────────────────────

interface FrontendErrorBody {
  message: string
  stack?: string
  componentStack?: string
  source?: string
  lineno?: number
  colno?: number
  userAgent?: string
  url?: string
  timestamp?: string
  /** Optional correlation ID from the frontend */
  requestId?: string
  /** Optional user identifier */
  userId?: string
  /** Severity level reported by the client */
  level?: 'error' | 'warn' | 'info'
}

// ─── POST /logs – ingest frontend errors ─────────────────────────────────────

router.post('/', (req: Request<object, object, FrontendErrorBody>, res: Response) => {
  const {
    message,
    stack,
    componentStack,
    source,
    lineno,
    colno,
    userAgent,
    url,
    timestamp,
    requestId,
    userId,
    level = 'error',
  } = req.body

  if (!message) {
    res.status(400).json({ success: false, message: 'message is required' })
    return
  }

  const meta = {
    origin: 'frontend',
    source,
    url,
    lineno,
    colno,
    componentStack,
    userAgent,
    clientTimestamp: timestamp,
    requestId: requestId ?? req.requestId,
    userId,
    stack,
  }

  if (level === 'warn') {
    logger.warn(`[Frontend] ${message}`, meta)
  } else if (level === 'info') {
    logger.info(`[Frontend] ${message}`, meta)
  } else {
    logger.error(`[Frontend] ${message}`, meta)
  }

  res.status(200).json({ success: true })
})

// ─── GET /logs – query recent log entries (non-production / admin only) ───────

router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  // Only expose log file contents outside production
  if (process.env.NODE_ENV === 'production') {
    res.status(403).json({
      success: false,
      message: 'Log file access is disabled in production. Use your log aggregation service.',
    })
    return
  }

  try {
    const {
      level,
      service,
      limit = '100',
      since,
    } = req.query as Record<string, string>

    const logDir = path.resolve(process.cwd(), logConfig.dir)
    const today = new Date().toISOString().slice(0, 10)
    const logFile = path.join(logDir, `combined-${today}.log`)

    if (!fs.existsSync(logFile)) {
      res.json({ success: true, logs: [], message: 'No log file found for today' })
      return
    }

    const maxLines = Math.min(parseInt(limit, 10) || 100, 1000)
    const sinceDate = since ? new Date(since) : null

    const entries: object[] = []

    await new Promise<void>((resolve, reject) => {
      const rl = readline.createInterface({
        input: fs.createReadStream(logFile, { encoding: 'utf8' }),
        crlfDelay: Infinity,
      })

      rl.on('line', (line) => {
        if (!line.trim()) return
        try {
          const entry = JSON.parse(line) as Record<string, unknown>

          // Apply filters
          if (level && entry.level !== level) return
          if (service && entry.service !== service) return
          if (sinceDate && new Date(entry.timestamp as string) < sinceDate) return

          entries.push(entry)
        } catch {
          // Skip malformed lines
        }
      })

      rl.on('close', resolve)
      rl.on('error', reject)
    })

    // Return the most recent N entries
    const logs = entries.slice(-maxLines)

    res.json({
      success: true,
      count: logs.length,
      filters: { level, service, since, limit: maxLines },
      logs,
    })
  } catch (error) {
    next(error)
  }
})

export default router
