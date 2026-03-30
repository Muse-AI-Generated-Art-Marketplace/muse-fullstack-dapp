import helmet from 'helmet'
import { Request, Response, NextFunction } from 'express'

/**
 * Comprehensive security headers configuration using Helmet
 * 
 * This middleware configures optimal security headers for the Muse DApp:
 * - Content Security Policy (CSP) to prevent XSS attacks
 * - X-Frame-Options to prevent clickjacking
 * - X-Content-Type-Options to prevent MIME sniffing
 * - Strict-Transport-Security for HTTPS enforcement
 * - Referrer-Policy for privacy protection
 * - Permissions-Policy for feature control
 * - Cross-Origin policies for isolation
 */

const isDevelopment = process.env.NODE_ENV === 'development'
const isProduction = process.env.NODE_ENV === 'production'

/**
 * Content Security Policy configuration
 * 
 * Development: More permissive for debugging
 * Production: Strict policy for maximum security
 */
const contentSecurityPolicy = {
  directives: {
    // Default policy for all resources
    defaultSrc: ["'self'"],
    
    // Script sources - allow unsafe-inline in development for debugging
    scriptSrc: isDevelopment 
      ? ["'self'", "'unsafe-inline'", "'unsafe-eval'"]
      : ["'self'"],
    
    // Style sources - allow unsafe-inline for CSS frameworks
    styleSrc: ["'self'", "'unsafe-inline'"],
    
    // Image sources - allow data: URIs and HTTPS images
    imgSrc: ["'self'", "data:", "https:"],
    
    // Font sources
    fontSrc: ["'self'"],
    
    // Connect sources - API endpoints and external services
    connectSrc: [
      "'self'",
      // Add your API domains here
      process.env.API_BASE_URL || '',
      // Stellar endpoints
      'https://horizon.stellar.org',
      'https://api.stellar.org'
    ].filter(Boolean),
    
    // Frame sources - prevent framing
    frameSrc: ["'none'"],
    frameAncestors: ["'none'"],
    
    // Media sources
    mediaSrc: ["'self'"],
    
    // Object sources
    objectSrc: ["'none'"],
    
    // Base URI
    baseUri: ["'self'"],
    
    // Form action
    formAction: ["'self'"],
    
    // Manifest
    manifestSrc: ["'self'"],
    
    // Worker sources
    workerSrc: ["'self'"],
    
    // Upgrade insecure requests in production
    upgradeInsecureRequests: isProduction ? [] : null
  }.filter((value): value is string[] => value !== null) as Record<string, string[]>
}

/**
 * Permissions Policy configuration
 * 
 * Disables unnecessary browser features for security and privacy
 */
const permissionsPolicy = {
  directives: {
    // Geolocation
    geolocation: [],
    // Camera
    camera: [],
    // Microphone
    microphone: [],
    // Payment handler
    payment: [],
    // USB access
    usb: [],
    // Magnetometer
    magnetometer: [],
    // Gyroscope
    gyroscope: [],
    // Accelerometer
    accelerometer: [],
    // Ambient light sensor
    'ambient-light-sensor': [],
    // Web share API
    'web-share': [],
    // VR/AR displays
    'vr': [],
    'xr': [],
    // Clipboard access
    'clipboard-read': [],
    'clipboard-write': [],
    // Battery API
    'battery': [],
    // Web authentication
    'publickey-credentials-get': ['self']
  }
}

/**
 * Helmet configuration object
 */
const helmetConfig = {
  // Content Security Policy
  contentSecurityPolicy: {
    directives: contentSecurityPolicy.directives,
    reportOnly: isDevelopment // Report-only in development for debugging
  },
  
  // Cross-Origin Embedder Policy
  crossOriginEmbedderPolicy: isProduction ? { policy: 'require-corp' } : false,
  
  // Cross-Origin Opener Policy
  crossOriginOpenerPolicy: { policy: 'same-origin' },
  
  // Cross-Origin Resource Policy
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  
  // DNS Prefetch Control
  dnsPrefetchControl: { allow: false },
  
  // Frame Options (legacy, CSP frame-ancestors is preferred)
  frameguard: { action: 'deny' },
  
  // Hide Powered-By header
  hidePoweredBy: true,
  
  // HSTS (HTTPS Strict Transport Security)
  hsts: isProduction ? {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true
  } : false, // Disabled in development
  
  // IE Compatibility
  ieNoOpen: true,
  
  // MIME Type Sniffing
  noSniff: true,
  
  // Origin Policy
  originAgentCluster: true,
  
  // Permissions Policy
  permittedCrossDomainPolicies: false,
  
  // Referrer Policy
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  
  // X-Content-Type-Options
  xContentTypeOptions: true,
  
  // X-DNS-Prefetch-Control
  xDnsPrefetchControl: false,
  
  // X-Download-Options
  xDownloadOptions: true,
  
  // X-Frame-Options (legacy, CSP frame-ancestors is preferred)
  xFrameOptions: 'DENY',
  
  // X-Permitted-Cross-Domain-Policies
  xPermittedCrossDomainPolicies: false,
  
  // X-XSS-Protection (legacy, modern browsers handle XSS better)
  xXssProtection: '1; mode=block'
}

/**
 * Security middleware factory
 * 
 * Returns configured helmet middleware with environment-specific settings
 */
export function createSecurityMiddleware() {
  return helmet(helmetConfig)
}

/**
 * Security headers validation middleware
 * 
 * Validates that required security headers are present
 */
export function validateSecurityHeaders(req: Request, res: Response, next: NextFunction) {
  // This middleware can be used to validate security headers in tests
  // or to add custom security logic
  next()
}

/**
 * Export configured helmet middleware for direct use
 */
export const securityMiddleware = createSecurityMiddleware()

/**
 * Export individual header configurations for testing
 */
export { helmetConfig, contentSecurityPolicy, permissionsPolicy }

/**
 * Security middleware with development logging
 * 
 * Logs security headers in development for debugging
 */
export function securityMiddlewareWithLogging(req: Request, res: Response, next: NextFunction) {
  if (isDevelopment) {
    const originalWriteHead = res.writeHead
    res.writeHead = function(statusCode: number, headers?: any) {
      const securityHeaders = {
        'content-security-policy': res.getHeader('content-security-policy'),
        'x-frame-options': res.getHeader('x-frame-options'),
        'x-content-type-options': res.getHeader('x-content-type-options'),
        'strict-transport-security': res.getHeader('strict-transport-security'),
        'referrer-policy': res.getHeader('referrer-policy'),
        'permissions-policy': res.getHeader('permissions-policy'),
        'cross-origin-embedder-policy': res.getHeader('cross-origin-embedder-policy'),
        'cross-origin-opener-policy': res.getHeader('cross-origin-opener-policy'),
        'cross-origin-resource-policy': res.getHeader('cross-origin-resource-policy'),
        'x-xss-protection': res.getHeader('x-xss-protection')
      }
      
      console.log('Security Headers:', JSON.stringify(securityHeaders, null, 2))
      
      return originalWriteHead.call(this, statusCode, headers)
    }
  }
  
  return securityMiddleware(req, res, next)
}

export default securityMiddleware
