import crypto from 'crypto'
import { createLogger } from './logger'

const logger = createLogger('FileSecurity')

// Magic numbers for file type validation
export const FILE_SIGNATURES = {
  'image/jpeg': [{ offset: 0, signature: Buffer.from([0xFF, 0xD8, 0xFF]) }],
  'image/png': [{ offset: 0, signature: Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]) }],
  'image/webp': [{ offset: 0, signature: Buffer.from([0x52, 0x49, 0x46, 0x46]) }, { offset: 8, signature: Buffer.from([0x57, 0x45, 0x42, 0x50]) }],
  'image/gif': [{ offset: 0, signature: Buffer.from([0x47, 0x49, 0x46, 0x38, 0x37, 0x61]) }, { offset: 0, signature: Buffer.from([0x47, 0x49, 0x46, 0x38, 0x39, 0x61]) }],
  'image/svg+xml': [
    { offset: 0, signature: Buffer.from([0x3C, 0x73, 0x76, 0x67]) },
    { offset: 0, signature: Buffer.from([0x3C, 0x3F, 0x78, 0x6D, 0x6C]) }
  ],
}

// Dangerous file extensions to block
export const DANGEROUS_EXTENSIONS = [
  '.exe', '.bat', '.cmd', '.com', '.pif', '.scr', '.vbs', '.js', '.jar',
  '.app', '.deb', '.pkg', '.dmg', '.rpm', '.msi', '.php', '.asp', '.aspx',
  '.jsp', '.py', '.rb', '.pl', '.sh', '.ps1', '.vb', '.wsf', '.reg'
]

// Malicious content patterns
export const MALICIOUS_PATTERNS = [
  /<script[^>]*>.*?<\/script>/gi,
  /javascript:/gi,
  /vbscript:/gi,
  /on\w+\s*=/gi,
  /eval\s*\(/gi,
  /exec\s*\(/gi,
  /system\s*\(/gi,
  /shell_exec\s*\(/gi,
  /passthru\s*\(/gi,
  /base64_decode\s*\(/gi,
  /file_get_contents\s*\(/gi,
  /fopen\s*\(/gi,
  /fwrite\s*\(/gi,
]

/**
 * Validate file using magic numbers (file signatures)
 */
export function validateFileSignature(buffer: Buffer, mimeType: string): boolean {
  const signatures = FILE_SIGNATURES[mimeType as keyof typeof FILE_SIGNATURES]
  
  if (!signatures) {
    logger.warn('No signature defined for MIME type', { mimeType })
    return false
  }

  return signatures.every(({ offset, signature }) => {
    if (buffer.length < offset + signature.length) {
      return false
    }
    
    const bufferSlice = buffer.slice(offset, offset + signature.length)
    return bufferSlice.equals(signature)
  })
}

/**
 * Check if file extension is dangerous
 */
export function isDangerousExtension(filename: string): boolean {
  const ext = filename.toLowerCase().substring(filename.lastIndexOf('.'))
  return DANGEROUS_EXTENSIONS.includes(ext)
}

/**
 * Scan for malicious content patterns
 */
export function scanForMaliciousContent(buffer: Buffer): {
  isClean: boolean
  threats: string[]
} {
  const content = buffer.toString('utf8', 0, Math.min(buffer.length, 1024 * 1024)) // Scan first 1MB
  const threats: string[] = []

  MALICIOUS_PATTERNS.forEach((pattern, index) => {
    if (pattern.test(content)) {
      threats.push(`Malicious pattern ${index + 1}: ${pattern.source}`)
    }
  })

  // Check for suspicious strings
  const suspiciousStrings = [
    'eval(base64',
    'document.write',
    '<iframe',
    'object data',
    'embed src',
    'link href=javascript',
    'meta http-equiv=refresh',
  ]

  suspiciousStrings.forEach(suspicious => {
    if (content.toLowerCase().includes(suspicious.toLowerCase())) {
      threats.push(`Suspicious content detected: ${suspicious}`)
    }
  })

  return {
    isClean: threats.length === 0,
    threats
  }
}

/**
 * Calculate file hash for integrity checking
 */
export function calculateFileHash(buffer: Buffer): string {
  return crypto.createHash('sha256').update(buffer).digest('hex')
}

/**
 * Validate file metadata and content
 */
export function validateFileSecurity(
  buffer: Buffer,
  originalName: string,
  mimeType: string,
  declaredSize?: number
): {
  isValid: boolean
  errors: string[]
  warnings: string[]
  metadata: {
    hash: string
    actualSize: number
    detectedType?: string
  }
} {
  const errors: string[] = []
  const warnings: string[] = []

  // 1. Check dangerous extensions
  if (isDangerousExtension(originalName)) {
    errors.push(`Dangerous file extension detected: ${originalName}`)
  }

  // 2. Validate file signature
  if (!validateFileSignature(buffer, mimeType)) {
    errors.push(`File signature does not match declared MIME type: ${mimeType}`)
  }

  // 3. Scan for malicious content
  const malwareScan = scanForMaliciousContent(buffer)
  if (!malwareScan.isClean) {
    errors.push('Malicious content detected:', ...malwareScan.threats)
  }

  // 4. Validate file size consistency
  const actualSize = buffer.length
  if (declaredSize && declaredSize !== actualSize) {
    warnings.push(`Declared size (${declaredSize}) differs from actual size (${actualSize})`)
  }

  // 5. Check for empty files
  if (actualSize === 0) {
    errors.push('File is empty')
  }

  // 6. Validate filename
  if (!originalName || originalName.length > 255) {
    errors.push('Invalid filename')
  }

  // 7. Check for path traversal attempts
  if (originalName.includes('..') || originalName.includes('/') || originalName.includes('\\')) {
    errors.push('Invalid filename characters detected')
  }

  const metadata: {
    hash: string
    actualSize: number
    detectedType?: string
  } = {
    hash: calculateFileHash(buffer),
    actualSize,
  }

  // Try to detect actual file type
  try {
    if (buffer.length >= 4) {
      const header = buffer.slice(0, 16).toString('hex')
      metadata.detectedType = detectFileTypeFromHeader(header)
    }
  } catch (error) {
    warnings.push('Could not detect file type from header')
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    metadata
  }
}

/**
 * Detect file type from header hex string
 */
function detectFileTypeFromHeader(header: string): string {
  const signatures: Record<string, string> = {
    'ffd8ffe': 'image/jpeg',
    '89504e470d0a1a0a': 'image/png',
    '474946383961': 'image/gif',
    '474946383761': 'image/gif',
    '52494646': 'image/webp',
    '3c737667': 'image/svg+xml',
    '3c3f786d6c': 'text/xml',
  }

  for (const [sig, type] of Object.entries(signatures)) {
    if (header.startsWith(sig)) {
      return type
    }
  }

  return 'unknown'
}

/**
 * Sanitize filename
 */
export function sanitizeFilename(filename: string): string {
  // Remove dangerous characters and normalize
  return filename
    .replace(/[^a-zA-Z0-9.\-_]/g, '_')
    .replace(/_{2,}/g, '_')
    .substring(0, 255)
}

/**
 * Generate secure file key
 */
export function generateSecureFileKey(originalName: string, folder: string): string {
  const sanitized = sanitizeFilename(originalName)
  const timestamp = Date.now()
  const random = crypto.randomBytes(8).toString('hex')
  const ext = sanitized.substring(sanitized.lastIndexOf('.'))
  
  return `${folder}/${timestamp}_${random}${ext}`
}
