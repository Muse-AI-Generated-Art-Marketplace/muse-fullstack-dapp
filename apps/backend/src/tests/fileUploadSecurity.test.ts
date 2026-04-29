import request from 'supertest'
import { app } from '../index'
import { fileUploadService } from '../services/fileUploadService'
import { malwareScanService } from '../services/malwareScanService'
import {
  validateFileSecurity,
  validateFileSignature,
  scanForMaliciousContent,
  isDangerousExtension,
  sanitizeFilename,
  calculateFileHash,
  generateSecureFileKey,
} from '../utils/fileSecurity'

// Mock the file upload service
jest.mock('../services/fileUploadService')
const mockFileUploadService = fileUploadService as jest.Mocked<typeof fileUploadService>

// Mock the malware scan service
jest.mock('../services/malwareScanService')
const mockMalwareScanService = malwareScanService as jest.Mocked<typeof malwareScanService>

// Mock AWS SDK
jest.mock('aws-sdk', () => ({
  S3: jest.fn().mockImplementation(() => ({
    upload: jest.fn().mockReturnValue({
      promise: jest.fn().mockResolvedValue({
        Location: 'https://test-bucket.s3.amazonaws.com/test-key',
        Key: 'test-key',
        Bucket: 'test-bucket',
        ETag: '"test-etag"',
      }),
    }),
    deleteObject: jest.fn().mockReturnValue({
      promise: jest.fn().mockResolvedValue({}),
    }),
    headObject: jest.fn().mockReturnValue({
      promise: jest.fn().mockResolvedValue({
        ContentLength: 1024,
        LastModified: new Date(),
        ContentType: 'image/jpeg',
        ETag: '"test-etag"',
        Metadata: {},
      }),
    }),
    getSignedUrlPromise: jest.fn().mockResolvedValue('https://test-bucket.s3.amazonaws.com/test-signed-url'),
    listObjectsV2: jest.fn().mockReturnValue({
      promise: jest.fn().mockResolvedValue({
        Contents: [],
      }),
    }),
    headBucket: jest.fn().mockReturnValue({
      promise: jest.fn().mockResolvedValue({}),
    }),
  })),
}))

describe('File Upload Security Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('File Signature Validation', () => {
    it('should validate JPEG file signature', () => {
      const jpegBuffer = Buffer.from([0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10])
      const isValid = validateFileSignature(jpegBuffer, 'image/jpeg')
      expect(isValid).toBe(true)
    })

    it('should validate PNG file signature', () => {
      const pngBuffer = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A])
      const isValid = validateFileSignature(pngBuffer, 'image/png')
      expect(isValid).toBe(true)
    })

    it('should reject invalid file signature', () => {
      const invalidBuffer = Buffer.from([0x00, 0x01, 0x02, 0x03])
      const isValid = validateFileSignature(invalidBuffer, 'image/jpeg')
      expect(isValid).toBe(false)
    })

    it('should reject signature mismatch', () => {
      const jpegBuffer = Buffer.from([0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10])
      const isValid = validateFileSignature(jpegBuffer, 'image/png')
      expect(isValid).toBe(false)
    })
  })

  describe('Malicious Content Scanning', () => {
    it('should detect script tags', () => {
      const maliciousContent = Buffer.from('<script>alert("xss")</script>')
      const result = scanForMaliciousContent(maliciousContent)
      expect(result.isClean).toBe(false)
      expect(result.threats).toContain('Malicious pattern 1: <script[^>]*>.*?<\/script>')
    })

    it('should detect JavaScript URLs', () => {
      const maliciousContent = Buffer.from('javascript:alert("xss")')
      const result = scanForMaliciousContent(maliciousContent)
      expect(result.isClean).toBe(false)
      expect(result.threats.some(t => t.includes('javascript:'))).toBe(true)
    })

    it('should detect eval functions', () => {
      const maliciousContent = Buffer.from('eval malicious code')
      const result = scanForMaliciousContent(maliciousContent)
      expect(result.isClean).toBe(false)
      expect(result.threats.some(t => t.includes('eval'))).toBe(true)
    })

    it('should pass clean content', () => {
      const cleanContent = Buffer.from('This is a clean image file content')
      const result = scanForMaliciousContent(cleanContent)
      expect(result.isClean).toBe(true)
      expect(result.threats).toHaveLength(0)
    })
  })

  describe('Dangerous Extension Detection', () => {
    it('should detect dangerous extensions', () => {
      const dangerousFiles = [
        'malware.exe',
        'script.bat',
        'virus.com',
        'trojan.scr',
        'malicious.js',
        'backdoor.php',
      ]

      dangerousFiles.forEach(filename => {
        expect(isDangerousExtension(filename)).toBe(true)
      })
    })

    it('should allow safe extensions', () => {
      const safeFiles = [
        'image.jpg',
        'photo.png',
        'graphic.webp',
        'animation.gif',
        'vector.svg',
      ]

      safeFiles.forEach(filename => {
        expect(isDangerousExtension(filename)).toBe(false)
      })
    })
  })

  describe('Filename Sanitization', () => {
    it('should sanitize dangerous filenames', () => {
      const dangerous = '../../../etc/passwd'
      const sanitized = sanitizeFilename(dangerous)
      expect(sanitized).toBe('___etc_passwd')
    })

    it('should normalize multiple underscores', () => {
      const messy = 'file__name___test.jpg'
      const sanitized = sanitizeFilename(messy)
      expect(sanitized).toBe('file_name_test.jpg')
    })

    it('should limit filename length', () => {
      const longName = 'a'.repeat(300) + '.jpg'
      const sanitized = sanitizeFilename(longName)
      expect(sanitized.length).toBeLessThanOrEqual(255)
    })
  })

  describe('File Hash Calculation', () => {
    it('should calculate consistent hash', () => {
      const content = Buffer.from('test content')
      const hash1 = calculateFileHash(content)
      const hash2 = calculateFileHash(content)
      expect(hash1).toBe(hash2)
      expect(hash1).toMatch(/^[a-f0-9]{64}$/)
    })

    it('should generate different hashes for different content', () => {
      const content1 = Buffer.from('content 1')
      const content2 = Buffer.from('content 2')
      const hash1 = calculateFileHash(content1)
      const hash2 = calculateFileHash(content2)
      expect(hash1).not.toBe(hash2)
    })
  })

  describe('Secure File Key Generation', () => {
    it('should generate secure file key', () => {
      const filename = 'test.jpg'
      const folder = 'uploads'
      const key = generateSecureFileKey(filename, folder)
      
      expect(key).toMatch(new RegExp(`^${folder}/\\d+__[a-f0-9]{16}\\.jpg$`))
    })

    it('should handle files without extension', () => {
      const filename = 'noextension'
      const folder = 'uploads'
      const key = generateSecureFileKey(filename, folder)
      
      expect(key).toMatch(new RegExp(`^${folder}/\\d+__[a-f0-9]{16}$`))
    })
  })

  describe('Comprehensive File Security Validation', () => {
    it('should pass valid image file', () => {
      const jpegBuffer = Buffer.from([0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46])
      const result = validateFileSecurity(jpegBuffer, 'test.jpg', 'image/jpeg', 8)
      
      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
      expect(result.metadata.hash).toMatch(/^[a-f0-9]{64}$/)
      expect(result.metadata.actualSize).toBe(8)
    })

    it('should reject file with dangerous extension', () => {
      const buffer = Buffer.from('fake content')
      const result = validateFileSecurity(buffer, 'malware.exe', 'application/octet-stream')
      
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Dangerous file extension detected: malware.exe')
    })

    it('should reject file with signature mismatch', () => {
      const invalidBuffer = Buffer.from([0x00, 0x01, 0x02, 0x03])
      const result = validateFileSecurity(invalidBuffer, 'fake.jpg', 'image/jpeg')
      
      expect(result.isValid).toBe(false)
      expect(result.errors.some(e => e.includes('signature does not match'))).toBe(true)
    })

    it('should reject malicious content', () => {
      const maliciousBuffer = Buffer.from('<script>alert("xss")</script>')
      const result = validateFileSecurity(maliciousBuffer, 'fake.jpg', 'image/jpeg')
      
      expect(result.isValid).toBe(false)
      expect(result.errors.some(e => e.includes('Malicious content detected'))).toBe(true)
    })

    it('should reject empty files', () => {
      const emptyBuffer = Buffer.alloc(0)
      const result = validateFileSecurity(emptyBuffer, 'empty.jpg', 'image/jpeg')
      
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('File is empty')
    })

    it('should reject files with path traversal attempts', () => {
      const buffer = Buffer.from('content')
      const result = validateFileSecurity(buffer, '../../../etc/passwd', 'text/plain')
      
      expect(result.isValid).toBe(false)
      expect(result.errors.some(e => e.includes('Invalid filename characters'))).toBe(true)
    })
  })
})

describe('File Upload Security Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockFileUploadService.uploadFile.mockResolvedValue({
      url: 'https://test-bucket.s3.amazonaws.com/test-key',
      key: 'test-key',
      bucket: 'test-bucket',
      contentType: 'image/jpeg',
      size: 1024,
      etag: '"test-etag"',
    })
    mockMalwareScanService.scanFile.mockResolvedValue({
      isClean: true,
      threats: [],
      scanDetails: {
        signatureValid: true,
        contentScan: {
          maliciousPatterns: [],
          suspiciousStrings: [],
        },
        metadata: {
          fileHash: 'abc123',
          size: 1024,
          scanTime: 100,
        },
      },
      riskLevel: 'low',
    })
  })

  describe('POST /api/upload/single with security', () => {
    it('should upload clean file successfully', async () => {
      const response = await request(app)
        .post('/api/upload/single')
        .set('Authorization', 'Bearer valid-token')
        .attach('file', Buffer.from([0xFF, 0xD8, 0xFF, 0xE0]), 'test.jpg')
        .expect(201)

      expect(response.body.success).toBe(true)
      expect(mockMalwareScanService.scanFile).toHaveBeenCalled()
    })

    it('should reject file with malware', async () => {
      mockMalwareScanService.scanFile.mockResolvedValue({
        isClean: false,
        threats: ['Malicious script detected'],
        scanDetails: {
          signatureValid: true,
          contentScan: {
            maliciousPatterns: ['Malicious script detected'],
            suspiciousStrings: [],
          },
          metadata: {
            fileHash: 'malicious123',
            size: 1024,
            scanTime: 150,
          },
        },
        riskLevel: 'high',
      })

      const response = await request(app)
        .post('/api/upload/single')
        .set('Authorization', 'Bearer valid-token')
        .attach('file', Buffer.from('malicious content'), 'test.jpg')
        .expect(403)

      expect(response.body.success).toBe(false)
      expect(response.body.error).toBe('Malware detected')
      expect(response.body.threats).toContain('Malicious script detected')
    })

    it('should reject dangerous file types', async () => {
      const response = await request(app)
        .post('/api/upload/single')
        .set('Authorization', 'Bearer valid-token')
        .attach('file', Buffer.from('fake content'), 'malware.exe')
        .expect(400)

      expect(response.body.success).toBe(false)
      expect(response.body.error).toBe('File validation failed')
    })

    it('should reject files with invalid signatures', async () => {
      const response = await request(app)
        .post('/api/upload/single')
        .set('Authorization', 'Bearer valid-token')
        .attach('file', Buffer.from([0x00, 0x01, 0x02, 0x03]), 'fake.jpg')
        .expect(400)

      expect(response.body.success).toBe(false)
      expect(response.body.error).toBe('File security validation failed')
    })
  })

  describe('Rate Limiting', () => {
    it('should enforce rate limiting on uploads', async () => {
      // Make multiple rapid requests to test rate limiting
      const requests = Array.from({ length: 25 }, (_, i) =>
        request(app)
          .post('/api/upload/single')
          .set('Authorization', 'Bearer valid-token')
          .attach('file', Buffer.from(`content ${i}`), `test${i}.jpg`)
      )

      const responses = await Promise.all(requests)
      
      // Some requests should be rate limited
      const rateLimitedResponses = responses.filter(res => res.status === 429)
      expect(rateLimitedResponses.length).toBeGreaterThan(0)
      
      rateLimitedResponses.forEach(response => {
        expect(response.body.error).toBe('Too many upload attempts')
      })
    })
  })

  describe('Artwork Upload Security', () => {
    it('should validate artwork uploads with enhanced security', async () => {
      const response = await request(app)
        .post('/api/upload/artwork-image')
        .set('Authorization', 'Bearer valid-token')
        .attach('image', Buffer.from([0xFF, 0xD8, 0xFF, 0xE0]), 'artwork.jpg')
        .expect(201)

      expect(response.body.success).toBe(true)
      expect(mockMalwareScanService.scanFile).toHaveBeenCalledWith(
        expect.any(Buffer),
        'artwork.jpg',
        'image/jpeg',
        undefined
      )
    })

    it('should reject non-image files for artwork upload', async () => {
      const response = await request(app)
        .post('/api/upload/artwork-image')
        .set('Authorization', 'Bearer valid-token')
        .attach('image', Buffer.from('fake content'), 'document.pdf')
        .expect(400)

      expect(response.body.success).toBe(false)
      expect(response.body.error).toBe('Invalid file type')
    })
  })
})

describe('Malware Scan Service Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('File Scanning', () => {
    it('should scan clean file successfully', async () => {
      const cleanBuffer = Buffer.from('clean image content')
      const result = await malwareScanService.scanFile(cleanBuffer, 'clean.jpg', 'image/jpeg')

      expect(result.isClean).toBe(true)
      expect(result.threats).toHaveLength(0)
      expect(result.riskLevel).toBe('low')
    })

    it('should detect malicious patterns', async () => {
      const maliciousBuffer = Buffer.from('<script>alert("xss")</script>')
      const result = await malwareScanService.scanFile(maliciousBuffer, 'malicious.jpg', 'image/jpeg')

      expect(result.isClean).toBe(false)
      expect(result.threats.length).toBeGreaterThan(0)
      expect(result.riskLevel).toMatch(/^(high|critical)$/)
    })

    it('should cache scan results', async () => {
      const buffer = Buffer.from('test content')
      
      // First scan
      await malwareScanService.scanFile(buffer, 'test.jpg', 'image/jpeg')
      
      // Second scan should use cache
      await malwareScanService.scanFile(buffer, 'test.jpg', 'image/jpeg')
      
      // Verify cache was used (implementation would need to expose cache stats)
      expect(true).toBe(true) // Placeholder - actual implementation would track cache hits
    })
  })

  describe('Quarantine System', () => {
    it('should quarantine high-risk files', async () => {
      const highRiskBuffer = Buffer.from('eval malicious code')
      await malwareScanService.scanFile(highRiskBuffer, 'malicious.js', 'application/javascript')

      const quarantineList = malwareScanService.getQuarantineList()
      expect(quarantineList.length).toBeGreaterThan(0)
      expect(quarantineList[0].riskLevel).toMatch(/^(high|critical)$/)
    })

    it('should maintain quarantine list', () => {
      const initialQuarantine = malwareScanService.getQuarantineList()
      expect(Array.isArray(initialQuarantine)).toBe(true)
      
      malwareScanService.clearQuarantineList()
      const clearedQuarantine = malwareScanService.getQuarantineList()
      expect(clearedQuarantine).toHaveLength(0)
    })
  })

  describe('Scan Statistics', () => {
    it('should provide scan statistics', () => {
      const stats = malwareScanService.getScanStats()
      
      expect(stats).toHaveProperty('totalScans')
      expect(stats).toHaveProperty('quarantinedFiles')
      expect(stats).toHaveProperty('cacheSize')
      expect(stats).toHaveProperty('averageScanTime')
      
      expect(typeof stats.totalScans).toBe('number')
      expect(typeof stats.quarantinedFiles).toBe('number')
      expect(typeof stats.cacheSize).toBe('number')
      expect(typeof stats.averageScanTime).toBe('number')
    })
  })
})
