/**
 * Centralised error handling middleware.
 *
 * All errors thrown or passed via next(err) land here.  The handler:
 *  1. Logs the error with full context (requestId, method, url, userId)
 *  2. Returns a consistent JSON error response
 *  3. Hides internal details (stack traces) in production
 */

import { Request, Response, NextFunction } from 'express'
import { createLogger } from '@/utils/logger'

const logger = createLogger('ErrorHandler')

// ─── Error classes ────────────────────────────────────────────────────────────

export class AppError extends Error {
  status: number
  code?: string
  details?: unknown
  isOperational: boolean

  constructor(message: string, status = 500, code?: string, details?: unknown) {
    super(message)
    this.name = 'AppError'
    this.status = status
    this.code = code
    this.details = details
    this.isOperational = true
    Error.captureStackTrace(this, this.constructor)
  }
}

export const createError = (
  message: string,
  status = 500,
  code?: string,
  details?: unknown,
): AppError => new AppError(message, status, code, details)

export const createNotFoundError = (resource: string): AppError =>
  createError(`${resource} not found`, 404, 'NOT_FOUND')

export const createValidationError = (message: string, details?: unknown): AppError =>
  createError(message, 400, 'VALIDATION_ERROR', details)

export const createUnauthorizedError = (message = 'Unauthorized'): AppError =>
  createError(message, 401, 'UNAUTHORIZED')

export const createForbiddenError = (message = 'Forbidden'): AppError =>
  createError(message, 403, 'FORBIDDEN')

export const createExternalServiceError = (service: string, message: string): AppError =>
  createError(`${service} service error: ${message}`, 502, 'EXTERNAL_SERVICE_ERROR')

export const createDatabaseError = (message: string, details?: unknown): AppError =>
  createError(message, 500, 'DATABASE_ERROR', details)

// ─── Middleware ───────────────────────────────────────────────────────────────

export const errorHandler = (
  err: unknown,
  req: Request,
  res: Response,
  _next: NextFunction,
): void => {
  const error = err as AppError
  const status = error?.status ?? 500
  const isOperational = error?.isOperational === true

  // Build log context from the request
  const logMeta = {
    requestId: req.requestId,
    method: req.method,
    url: req.originalUrl,
    statusCode: status,
    errorName: error?.name,
    errorCode: error?.code,
    stack: error?.stack,
    isOperational,
  }

  // 5xx errors are unexpected – log at error level with full detail
  // 4xx errors are client mistakes – log at warn level
  if (status >= 500) {
    logger.error(error?.message || 'Internal Server Error', logMeta)
  } else {
    logger.warn(error?.message || 'Client error', logMeta)
  }

  const isProd = process.env.NODE_ENV === 'production'

  const response: Record<string, unknown> = {
    success: false,
    message: error?.message || 'Internal Server Error',
    code: error?.code,
    requestId: req.requestId,
  }

  // Include validation details for 4xx errors
  if (error?.details !== undefined) {
    response.details = error.details
  }

  // Expose stack traces only outside production
  if (!isProd && error?.stack) {
    response.stack = error.stack
  }

  res.status(status).json(response)
}
