import { CorsOptions } from 'cors'

/**
 * CORS Configuration
 * 
 * Defines the whitelist of origins allowed to access the API.
 * In production, this should be restricted to the frontend URL.
 */
export function getCorsOptions(): CorsOptions {
  const allowedOrigins = process.env.CORS_ORIGINS
    ? process.env.CORS_ORIGINS.split(',').map((origin) => origin.trim())
    : [process.env.FRONTEND_URL || 'http://localhost:3000']

  return {
    origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
      // Allow requests with no origin (like mobile apps or curl)
      if (!origin) {
        return callback(null, true)
      }

      // Allow if origin is in the whitelist or if wildcard is used
      if (allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
        return callback(null, true)
      }

      callback(new Error('Not allowed by CORS'))
    },
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Origin',
      'X-Requested-With',
      'Content-Type',
      'Accept',
      'Authorization',
      'X-API-Key',
      'X-Request-ID',
      'X-Client-Version'
    ],
    exposedHeaders: ['X-Total-Count', 'Content-Disposition'],
    credentials: true,
    maxAge: 86400, // 24 hours
    optionsSuccessStatus: 204
  }
}

export const corsOptions = getCorsOptions()

export default corsOptions
