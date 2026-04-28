/**
 * Logging configuration driven by environment variables.
 *
 * LOG_LEVEL        – minimum level to emit (default: 'info' in prod, 'debug' in dev)
 * LOG_FORMAT       – 'json' | 'pretty' (default: 'json' in prod, 'pretty' in dev)
 * LOG_DIR          – directory for log files (default: 'logs')
 * LOG_MAX_SIZE     – max size per file before rotation (default: '20m')
 * LOG_MAX_FILES    – how many rotated files to keep (default: '14d' = 14 days)
 * LOG_TO_FILE      – 'true' | 'false' (default: 'true' in prod, 'false' in dev/test)
 * LOG_ENABLE_HTTP  – 'true' | 'false' – whether to log every HTTP request (default: 'true')
 */

export type LogLevel = 'error' | 'warn' | 'info' | 'http' | 'verbose' | 'debug' | 'silly'
export type LogFormat = 'json' | 'pretty'

const env = process.env.NODE_ENV ?? 'development'
const isProd = env === 'production'
const isTest = env === 'test'

export interface LogConfig {
  level: LogLevel
  format: LogFormat
  dir: string
  maxSize: string
  maxFiles: string
  toFile: boolean
  enableHttp: boolean
  /** Service name stamped on every log entry */
  serviceName: string
  /** Application version stamped on every log entry */
  serviceVersion: string
}

export const logConfig: LogConfig = {
  level: (process.env.LOG_LEVEL as LogLevel) ?? (isProd ? 'info' : 'debug'),
  format: (process.env.LOG_FORMAT as LogFormat) ?? (isProd ? 'json' : 'pretty'),
  dir: process.env.LOG_DIR ?? 'logs',
  maxSize: process.env.LOG_MAX_SIZE ?? '20m',
  maxFiles: process.env.LOG_MAX_FILES ?? '14d',
  toFile: process.env.LOG_TO_FILE !== undefined
    ? process.env.LOG_TO_FILE === 'true'
    : isProd,
  enableHttp: process.env.LOG_ENABLE_HTTP !== 'false' && !isTest,
  serviceName: process.env.SERVICE_NAME ?? 'muse-backend',
  serviceVersion: process.env.npm_package_version ?? '1.0.0',
}
