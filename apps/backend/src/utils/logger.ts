export type LogLevel = 'info' | 'warn' | 'error' | 'debug'

export interface LogMeta {
  requestId?: string
  [key: string]: unknown
}

interface LogEntry {
  timestamp: string
  level: LogLevel
  service: string
  message: string
  requestId?: string
  [key: string]: unknown
}

const formatEntry = (entry: LogEntry): string => JSON.stringify(entry)

const log = (level: LogLevel, service: string, message: string, meta?: LogMeta): void => {
  const entry: LogEntry = {
    timestamp: new Date().toISOString(),
    level,
    service,
    message,
    ...meta,
  }
  const formatted = formatEntry(entry)

  switch (level) {
    case 'error':
      console.error(formatted)
      break
    case 'warn':
      console.warn(formatted)
      break
    case 'debug':
      if (process.env.NODE_ENV === 'development') {
        console.debug(formatted)
      }
      break
    default:
      console.log(formatted)
  }
}

export interface Logger {
  info(message: string, meta?: LogMeta): void
  warn(message: string, meta?: LogMeta): void
  error(message: string, meta?: LogMeta | unknown): void
  debug(message: string, meta?: LogMeta): void
  /** Create a child logger pre-seeded with context (e.g. requestId) */
  child(context: LogMeta): Logger
}

export const createLogger = (service: string, defaultMeta: LogMeta = {}): Logger => ({
  info: (message, meta) => log('info', service, message, { ...defaultMeta, ...meta }),
  warn: (message, meta) => log('warn', service, message, { ...defaultMeta, ...meta }),
  error: (message, meta) => {
    const safeMeta: LogMeta =
      meta instanceof Error
        ? { ...defaultMeta, errorMessage: meta.message, stack: meta.stack }
        : meta instanceof Object
        ? { ...defaultMeta, ...(meta as LogMeta) }
        : { ...defaultMeta }
    log('error', service, message, safeMeta)
  },
  debug: (message, meta) => log('debug', service, message, { ...defaultMeta, ...meta }),
  child: (context) => createLogger(service, { ...defaultMeta, ...context }),
})

export default createLogger
