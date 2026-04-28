/**
 * Comprehensive structured logger built on Winston.
 *
 * Features:
 *  - Multiple log levels: error, warn, info, http, verbose, debug
 *  - JSON output in production, colourised pretty output in development
 *  - Daily-rotating file transports (combined + error-only)
 *  - Uncaught exception / unhandled rejection capture
 *  - Child loggers that inherit and extend context (e.g. requestId, userId)
 *  - Performance timing helpers
 *  - Environment-driven configuration via logConfig
 */

import path from 'path'
import winston from 'winston'
import DailyRotateFile from 'winston-daily-rotate-file'
import { logConfig, LogLevel } from '@/config/logConfig'

// ─── Custom log levels ────────────────────────────────────────────────────────
// Winston's default npm levels, extended with 'http' between info and verbose.
const LOG_LEVELS: Record<string, number> = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  verbose: 4,
  debug: 5,
  silly: 6,
}

const LOG_COLORS: Record<string, string> = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  verbose: 'cyan',
  debug: 'blue',
  silly: 'grey',
}

winston.addColors(LOG_COLORS)

// ─── Formats ─────────────────────────────────────────────────────────────────

/** Fields stamped on every log entry */
const baseFields = winston.format((info) => {
  info.service = logConfig.serviceName
  info.version = logConfig.serviceVersion
  info.environment = process.env.NODE_ENV ?? 'development'
  return info
})

/** Redact sensitive fields before they reach any transport */
const SENSITIVE_KEYS = new Set([
  'password', 'token', 'secret', 'authorization', 'cookie',
  'creditCard', 'ssn', 'privateKey', 'apiKey', 'api_key',
])

const redact = winston.format((info) => {
  const sanitize = (obj: Record<string, unknown>): Record<string, unknown> => {
    const result: Record<string, unknown> = {}
    for (const [key, value] of Object.entries(obj)) {
      if (SENSITIVE_KEYS.has(key.toLowerCase())) {
        result[key] = '[REDACTED]'
      } else if (value && typeof value === 'object' && !Array.isArray(value)) {
        result[key] = sanitize(value as Record<string, unknown>)
      } else {
        result[key] = value
      }
    }
    return result
  }

  return sanitize(info as unknown as Record<string, unknown>) as winston.Logform.TransformableInfo
})

/** JSON format used in production / file transports */
const jsonFormat = winston.format.combine(
  baseFields(),
  redact(),
  winston.format.timestamp({ format: 'YYYY-MM-DDTHH:mm:ss.SSSZ' }),
  winston.format.errors({ stack: true }),
  winston.format.json(),
)

/** Human-readable colourised format for local development */
const prettyFormat = winston.format.combine(
  baseFields(),
  redact(),
  winston.format.timestamp({ format: 'HH:mm:ss.SSS' }),
  winston.format.errors({ stack: true }),
  winston.format.colorize({ all: true }),
  winston.format.printf(({ timestamp, level, service, message, requestId, ...meta }) => {
    const rid = requestId ? ` [${requestId}]` : ''
    const metaStr = Object.keys(meta).length
      ? `\n  ${JSON.stringify(meta, null, 2).replace(/\n/g, '\n  ')}`
      : ''
    return `${timestamp} ${level} [${service}]${rid}: ${message}${metaStr}`
  }),
)

// ─── Transports ──────────────────────────────────────────────────────────────

function buildTransports(): winston.transport[] {
  const transports: winston.transport[] = []

  // Console transport – always present
  transports.push(
    new winston.transports.Console({
      format: logConfig.format === 'pretty' ? prettyFormat : jsonFormat,
      silent: process.env.NODE_ENV === 'test',
    }),
  )

  // File transports – enabled in production or when LOG_TO_FILE=true
  if (logConfig.toFile) {
    const logDir = path.resolve(process.cwd(), logConfig.dir)

    // All levels combined
    transports.push(
      new DailyRotateFile({
        dirname: logDir,
        filename: 'combined-%DATE%.log',
        datePattern: 'YYYY-MM-DD',
        maxSize: logConfig.maxSize,
        maxFiles: logConfig.maxFiles,
        format: jsonFormat,
        auditFile: path.join(logDir, '.audit-combined.json'),
      }),
    )

    // Errors only
    transports.push(
      new DailyRotateFile({
        dirname: logDir,
        filename: 'error-%DATE%.log',
        datePattern: 'YYYY-MM-DD',
        level: 'error',
        maxSize: logConfig.maxSize,
        maxFiles: logConfig.maxFiles,
        format: jsonFormat,
        auditFile: path.join(logDir, '.audit-error.json'),
      }),
    )

    // HTTP access log
    transports.push(
      new DailyRotateFile({
        dirname: logDir,
        filename: 'access-%DATE%.log',
        datePattern: 'YYYY-MM-DD',
        level: 'http',
        maxSize: logConfig.maxSize,
        maxFiles: logConfig.maxFiles,
        format: jsonFormat,
        auditFile: path.join(logDir, '.audit-access.json'),
      }),
    )
  }

  return transports
}

// ─── Root Winston instance ────────────────────────────────────────────────────

const winstonLogger = winston.createLogger({
  levels: LOG_LEVELS,
  level: logConfig.level,
  transports: buildTransports(),
  exitOnError: false,
})

// Capture uncaught exceptions and unhandled rejections into the error log
if (process.env.NODE_ENV !== 'test') {
  winstonLogger.exceptions.handle(
    new winston.transports.Console({
      format: logConfig.format === 'pretty' ? prettyFormat : jsonFormat,
    }),
  )

  winstonLogger.rejections.handle(
    new winston.transports.Console({
      format: logConfig.format === 'pretty' ? prettyFormat : jsonFormat,
    }),
  )
}

// ─── Public Logger interface ──────────────────────────────────────────────────

export interface LogMeta {
  requestId?: string
  userId?: string
  traceId?: string
  spanId?: string
  [key: string]: unknown
}

/** Accepts anything as the second argument to logger methods */
type AnyMeta = LogMeta | Error | unknown

export interface Logger {
  error(message: string, meta?: AnyMeta): void
  warn(message: string, meta?: AnyMeta): void
  info(message: string, meta?: AnyMeta): void
  http(message: string, meta?: AnyMeta): void
  verbose(message: string, meta?: AnyMeta): void
  debug(message: string, meta?: AnyMeta): void
  /** Create a child logger pre-seeded with context (e.g. requestId, userId) */
  child(context: LogMeta): Logger
  /** Start a performance timer; call the returned function to log elapsed time */
  startTimer(label: string, meta?: LogMeta): () => void
}

// ─── Factory ─────────────────────────────────────────────────────────────────

export const createLogger = (service: string, defaultMeta: LogMeta = {}): Logger => {
  const child = winstonLogger.child({ service, ...defaultMeta })

  const normaliseErrorMeta = (meta?: AnyMeta): LogMeta => {
    if (!meta) return defaultMeta
    if (meta instanceof Error) {
      return {
        ...defaultMeta,
        errorName: meta.name,
        errorMessage: meta.message,
        stack: meta.stack,
      }
    }
    if (Array.isArray(meta)) {
      return { ...defaultMeta, data: meta }
    }
    if (typeof meta === 'object') {
      return { ...defaultMeta, ...(meta as LogMeta) }
    }
    return defaultMeta
  }

  const logger: Logger = {
    error: (message, meta) => child.error(message, normaliseErrorMeta(meta)),
    warn: (message, meta) => child.warn(message, normaliseErrorMeta(meta)),
    info: (message, meta) => child.info(message, normaliseErrorMeta(meta)),
    http: (message, meta) => child.log('http', message, normaliseErrorMeta(meta)),
    verbose: (message, meta) => child.verbose(message, normaliseErrorMeta(meta)),
    debug: (message, meta) => child.debug(message, normaliseErrorMeta(meta)),

    child: (context) => createLogger(service, { ...defaultMeta, ...context }),

    startTimer: (label, meta) => {
      const start = process.hrtime.bigint()
      return () => {
        const durationMs = Number(process.hrtime.bigint() - start) / 1_000_000
        child.info(`${label} completed`, {
          ...defaultMeta,
          ...meta,
          label,
          durationMs: Math.round(durationMs * 100) / 100,
        })
      }
    },
  }

  return logger
}

export default createLogger

// ─── Convenience re-export of the root logger ─────────────────────────────────
export const rootLogger = createLogger('root')
