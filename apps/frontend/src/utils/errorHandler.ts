// ── AppError class ────────────────────────────────────────────────────────────
/**
 * A first-class error type for the Muse frontend.
 * Extends `Error` so `instanceof AppError` checks work correctly in hooks and services.
 */
export class AppError extends Error {
  public readonly code: string
  public readonly userMessage: string
  public readonly statusCode?: number
  public readonly isRecoverable: boolean
  public readonly details?: unknown
  public readonly timestamp: string
  public id?: string // injected by ErrorContext for deduplication

  constructor(params: {
    code: string
    message: string
    userMessage?: string
    statusCode?: number
    isRecoverable?: boolean
    details?: unknown
  }) {
    super(params.message)
    this.name = 'AppError'
    this.code = params.code
    this.userMessage = params.userMessage ?? params.message
    this.statusCode = params.statusCode
    this.isRecoverable = params.isRecoverable ?? true
    this.details = params.details
    this.timestamp = new Date().toISOString()
    // Restore prototype chain so instanceof works after transpilation
    Object.setPrototypeOf(this, new.target.prototype)
  }
}

// ── ErrorHandler static utility class ────────────────────────────────────────
export class ErrorHandler {
  /**
   * Create a typed AppError from a code, message and optional status code.
   * Used in services that need to construct errors before throwing.
   */
  static createError(code: string, message: string, statusCode?: number): AppError {
    return new AppError({ code, message, statusCode })
  }

  /**
   * Handle any unknown error and return a normalised AppError.
   * Optionally override context label and userMessage.
   */
  static handleError(
    error: unknown,
    opts?: { context?: string; userMessage?: string }
  ): AppError {
    const appError = ErrorHandler.handle(error)
    return new AppError({
      code: appError.code,
      message: opts?.context ? `[${opts.context}] ${appError.message}` : appError.message,
      userMessage: opts?.userMessage ?? appError.userMessage,
      statusCode: appError.statusCode,
      isRecoverable: appError.isRecoverable,
      details: appError.details,
    })
  }

  /** Convert any thrown value into a normalised AppError. */
  static handle(error: unknown): AppError {
    if (error instanceof AppError) return error

    if (error instanceof Error) {
      return ErrorHandler._parseError(error)
    }

    if (typeof error === 'string') {
      return new AppError({
        code: 'UNKNOWN_ERROR',
        message: error,
        userMessage: "An unexpected error occurred. Please try again.",
        isRecoverable: true,
      })
    }

    // Plain object (e.g. { code, message, userMessage } from old usage)
    if (typeof error === 'object' && error !== null) {
      const obj = error as Record<string, unknown>
      return new AppError({
        code: (obj.code as string) ?? 'UNKNOWN_ERROR',
        message: (obj.message as string) ?? 'Unknown error',
        userMessage: (obj.userMessage as string) ?? 'An unexpected error occurred. Please try again.',
        isRecoverable: (obj.isRecoverable as boolean) ?? true,
      })
    }

    return new AppError({
      code: 'UNKNOWN_ERROR',
      message: 'Unknown error occurred',
      userMessage: 'An unexpected error occurred. Please try again.',
      isRecoverable: true,
    })
  }

  static isRecoverable(error: AppError): boolean {
    return error.isRecoverable
  }

  /** Exponential backoff — 1s, 2s, 4s, 8s, 16s (max 30s) */
  static getRetryDelay(attempt: number): number {
    return Math.min(1000 * Math.pow(2, attempt), 30_000)
  }

  // ── Private parsing helpers ─────────────────────────────────────────────

  private static _parseError(error: Error): AppError {
    const msg = error.message.toLowerCase()

    // Network
    if (msg.includes('network') || msg.includes('fetch') || msg.includes('failed to fetch')) {
      return new AppError({
        code: 'NETWORK_ERROR',
        message: error.message,
        userMessage:
          "Network connection failed. Please check your internet connection and try again.",
        isRecoverable: true,
      })
    }

    // HTTP status codes embedded in message
    if (msg.includes('401') || msg.includes('unauthorized')) {
      return new AppError({ code: 'UNAUTHORIZED', message: error.message, userMessage: 'Please connect your wallet to continue.', statusCode: 401, isRecoverable: true })
    }
    if (msg.includes('403') || msg.includes('forbidden')) {
      return new AppError({ code: 'FORBIDDEN', message: error.message, userMessage: "You don't have permission to perform this action.", statusCode: 403, isRecoverable: false })
    }
    if (msg.includes('404') || msg.includes('not found')) {
      return new AppError({ code: 'NOT_FOUND', message: error.message, userMessage: 'The requested resource was not found.', statusCode: 404, isRecoverable: false })
    }
    if (msg.includes('429') || msg.includes('rate limit')) {
      return new AppError({ code: 'RATE_LIMIT_EXCEEDED', message: error.message, userMessage: 'Too many requests. Please wait a moment and try again.', statusCode: 429, isRecoverable: true })
    }
    if (msg.includes('500') || msg.includes('internal server')) {
      return new AppError({ code: 'INTERNAL_SERVER_ERROR', message: error.message, userMessage: 'Server error occurred. Please try again later.', statusCode: 500, isRecoverable: true })
    }

    // Wallet
    if (msg.includes('wallet') || msg.includes('freighter')) {
      return ErrorHandler._parseWalletError(error)
    }

    // Validation
    if (msg.includes('validation') || msg.includes('invalid')) {
      return new AppError({ code: 'VALIDATION_ERROR', message: error.message, userMessage: 'Please check your input and try again.', isRecoverable: true })
    }

    return new AppError({
      code: 'GENERAL_ERROR',
      message: error.message,
      userMessage: "Something went wrong. Please try again.",
      isRecoverable: true,
    })
  }

  private static _parseWalletError(error: Error): AppError {
    const msg = error.message.toLowerCase()

    if (msg.includes('user rejected') || msg.includes('declined') || msg.includes('cancelled')) {
      return new AppError({ code: 'WALLET_REJECTED', message: error.message, userMessage: 'Transaction was cancelled. You can try again when ready.', isRecoverable: true })
    }
    if (msg.includes('insufficient') || msg.includes('balance') || msg.includes('funds')) {
      return new AppError({ code: 'INSUFFICIENT_BALANCE', message: error.message, userMessage: 'Insufficient balance for this transaction. Please add funds to your wallet.', isRecoverable: false })
    }
    if (msg.includes('not connected') || msg.includes('no account')) {
      return new AppError({ code: 'WALLET_NOT_CONNECTED', message: error.message, userMessage: 'Please connect your wallet to continue.', isRecoverable: true })
    }
    if (msg.includes('timeout') || msg.includes('timed out')) {
      return new AppError({ code: 'WALLET_TIMEOUT', message: error.message, userMessage: 'Wallet connection timed out. Please try again.', isRecoverable: true })
    }
    if (msg.includes('network') && msg.includes('testnet')) {
      return new AppError({ code: 'WALLET_NETWORK_MISMATCH', message: error.message, userMessage: 'Wallet network mismatch. Please ensure your wallet is set to the correct network.', isRecoverable: true })
    }
    if (msg.includes('signature') || msg.includes('sign')) {
      return new AppError({ code: 'WALLET_SIGNATURE_ERROR', message: error.message, userMessage: 'Failed to sign transaction. Please check your wallet and try again.', isRecoverable: true })
    }
    if (msg.includes('locked') || msg.includes('unlock')) {
      return new AppError({ code: 'WALLET_LOCKED', message: error.message, userMessage: 'Wallet is locked. Please unlock your wallet and try again.', isRecoverable: true })
    }

    return new AppError({ code: 'WALLET_ERROR', message: error.message, userMessage: 'Wallet operation failed. Please check your wallet and try again.', isRecoverable: true })
  }
}

// ── Convenience exports ───────────────────────────────────────────────────────

/** React Query compatible error handler */
export const queryErrorHandler = (error: unknown): AppError => {
  const appError = ErrorHandler.handle(error)
  console.error('Query Error:', appError.userMessage)
  return appError
}

/** Wraps an async function with unified error handling */
export const withErrorHandling = async <T>(
  asyncFn: () => Promise<T>,
  onError?: (error: AppError) => void,
): Promise<T | null> => {
  try {
    return await asyncFn();
  } catch (error) {
    const appError = ErrorHandler.handle(error);
    onError?.(appError);
    return null;
  }
};
