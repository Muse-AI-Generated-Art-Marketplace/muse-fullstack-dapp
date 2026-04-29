import helmet from 'helmet'
import { Request, Response, NextFunction } from 'express'

const isDevelopment = process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test'
const isProduction = process.env.NODE_ENV === 'production'

/**
 * Content Security Policy configuration
 */
export const contentSecurityPolicy = {
  directives: {
    defaultSrc: ["'self'"],
    scriptSrc: isProduction 
      ? ["'self'"] 
      : ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
    styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
    imgSrc: ["'self'", "data:", "https:", "https://*.amazonaws.com"],
    fontSrc: ["'self'", "https://fonts.gstatic.com"],
    connectSrc: [
      "'self'", 
      process.env.API_BASE_URL || '',
      "https://horizon.stellar.org",
      "https://horizon-testnet.stellar.org"
    ].filter(Boolean),
    frameSrc: ["'none'"],
    frameAncestors: ["'none'"],
    objectSrc: ["'none'"],
    upgradeInsecureRequests: isProduction ? [] : null
  }
}

/**
 * Helmet configuration
 */
export const helmetConfig = {
  contentSecurityPolicy: isProduction ? contentSecurityPolicy : {
    directives: contentSecurityPolicy.directives,
    reportOnly: true
  },
  crossOriginEmbedderPolicy: isProduction ? { policy: 'require-corp' } : false,
  crossOriginOpenerPolicy: { policy: 'same-origin' },
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  dnsPrefetchControl: { allow: false },
  frameguard: { action: 'deny' },
  hidePoweredBy: true,
  hsts: isProduction ? {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  } : false,
  ieNoOpen: true,
  noSniff: true,
  originAgentCluster: true,
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  xssFilter: true
}

/**
 * Security middleware using Helmet
 */
export function createSecurityMiddleware() {
  return helmet(helmetConfig as any)
}

/**
 * Custom middleware to add additional security headers not covered by Helmet
 */
export function additionalSecurityHeaders(req: Request, res: Response, next: NextFunction) {
  // Permissions Policy
  res.setHeader(
    'Permissions-Policy',
    'geolocation=(), camera=(), microphone=(), payment=(), usb=(), fullscreen=(self)'
  )

  // X-XSS-Protection (Legacy, but still good for older browsers)
  res.setHeader('X-XSS-Protection', '1; mode=block')

  next()
}

/**
 * Validation middleware for security headers (optional)
 */
export function validateSecurityHeaders(req: Request, res: Response, next: NextFunction) {
  next()
}

export const securityMiddleware = [
  createSecurityMiddleware(),
  additionalSecurityHeaders
]

export default securityMiddleware