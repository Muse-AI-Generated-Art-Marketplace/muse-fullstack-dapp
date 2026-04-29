import request from 'supertest'
import { app } from '@/index'
import { fileUploadService } from '@/services/fileUploadService'
import Artwork from '@/models/Artwork'

// Mock the file upload service
jest.mock('@/services/fileUploadService')
const mockFileUploadService = fileUploadService as jest.Mocked<typeof fileUploadService>

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
        Contents: [
          {
            Key: 'test-key',
            Size: 1024,
            LastModified: new Date(),
            ETag: '"test-etag"',
            StorageClass: 'STANDARD',
          },
        ],
      }),
    }),
    headBucket: jest.fn().mockReturnValue({
      promise: jest.fn().mockResolvedValue({}),
    }),
  })),
}))

describe('File Upload Endpoints', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('POST /api/upload/single', () => {
    it('should upload a single file successfully', async () => {
      const mockUploadResult = {
        url: 'https://test-bucket.s3.amazonaws.com/test-key',
        key: 'test-key',
        bucket: 'test-bucket',
        contentType: 'image/jpeg',
        size: 1024,
        etag: '"test-etag"',
      }

      mockFileUploadService.uploadFile.mockResolvedValue(mockUploadResult)
      mockFileUploadService.validateFile.mockReturnValue({ isValid: true })

      const response = await request(app)
        .post('/api/upload/single')
        .set('Authorization', 'Bearer valid-token')
        .attach('file', Buffer.from('test file content'), 'test.jpg')
        .expect(201)

      expect(response.body.success).toBe(true)
      expect(response.body.data.file).toEqual(mockUploadResult)
      expect(mockFileUploadService.uploadFile).toHaveBeenCalledWith(
        expect.any(Buffer),
        'test.jpg',
        'image/jpeg',
        expect.objectContaining({
          folder: 'uploads',
          isPublic: true,
        })
      )
    })

    it('should reject upload when no file is provided', async () => {
      const response = await request(app)
        .post('/api/upload/single')
        .set('Authorization', 'Bearer valid-token')
        .expect(400)

      expect(response.body.success).toBe(false)
      expect(response.body.error).toBe('No file provided')
    })

    it('should reject upload when file validation fails', async () => {
      mockFileUploadService.validateFile.mockReturnValue({
        isValid: false,
        error: 'File type not allowed',
      })

      const response = await request(app)
        .post('/api/upload/single')
        .set('Authorization', 'Bearer valid-token')
        .attach('file', Buffer.from('test file content'), 'test.txt')
        .expect(400)

      expect(response.body.success).toBe(false)
      expect(response.body.error).toBe('File validation failed')
    })
  })

  describe('POST /api/upload/multiple', () => {
    it('should upload multiple files successfully', async () => {
      const mockUploadResult = {
        url: 'https://test-bucket.s3.amazonaws.com/test-key',
        key: 'test-key',
        bucket: 'test-bucket',
        contentType: 'image/jpeg',
        size: 1024,
        etag: '"test-etag"',
      }

      mockFileUploadService.uploadFile.mockResolvedValue(mockUploadResult)
      mockFileUploadService.validateFile.mockReturnValue({ isValid: true })

      const response = await request(app)
        .post('/api/upload/multiple')
        .set('Authorization', 'Bearer valid-token')
        .attach('files', Buffer.from('test file content 1'), 'test1.jpg')
        .attach('files', Buffer.from('test file content 2'), 'test2.jpg')
        .expect(201)

      expect(response.body.success).toBe(true)
      expect(response.body.data.files).toHaveLength(2)
      expect(response.body.data.count).toBe(2)
      expect(mockFileUploadService.uploadFile).toHaveBeenCalledTimes(2)
    })

    it('should reject upload when no files are provided', async () => {
      const response = await request(app)
        .post('/api/upload/multiple')
        .set('Authorization', 'Bearer valid-token')
        .expect(400)

      expect(response.body.success).toBe(false)
      expect(response.body.error).toBe('No files provided')
    })
  })

  describe('POST /api/upload/artwork-image', () => {
    it('should upload artwork image successfully', async () => {
      const mockUploadResult = {
        url: 'https://test-bucket.s3.amazonaws.com/artworks/test-key',
        key: 'artworks/test-key',
        bucket: 'test-bucket',
        contentType: 'image/webp',
        size: 2048,
        etag: '"test-etag"',
      }

      mockFileUploadService.uploadFile.mockResolvedValue(mockUploadResult)
      mockFileUploadService.validateFile.mockReturnValue({ isValid: true })

      const response = await request(app)
        .post('/api/upload/artwork-image')
        .set('Authorization', 'Bearer valid-token')
        .attach('image', Buffer.from('test image content'), 'artwork.jpg')
        .query({ width: 800, height: 600, quality: 90, format: 'webp' })
        .expect(201)

      expect(response.body.success).toBe(true)
      expect(response.body.data.imageUrl).toBe(mockUploadResult.url)
      expect(response.body.data.imageKey).toBe(mockUploadResult.key)
      expect(mockFileUploadService.uploadFile).toHaveBeenCalledWith(
        expect.any(Buffer),
        'artwork.jpg',
        'image/jpeg',
        expect.objectContaining({
          folder: 'artworks',
          isPublic: true,
          resize: { width: 800, height: 600, fit: 'cover' },
          quality: 90,
          format: 'webp',
        })
      )
    })

    it('should reject non-image files for artwork upload', async () => {
      const response = await request(app)
        .post('/api/upload/artwork-image')
        .set('Authorization', 'Bearer valid-token')
        .attach('image', Buffer.from('test file content'), 'document.pdf')
        .expect(400)

      expect(response.body.success).toBe(false)
      expect(response.body.error).toBe('Invalid file type')
    })
  })

  describe('DELETE /api/upload/:key', () => {
    it('should delete a file successfully', async () => {
      mockFileUploadService.getFileMetadata.mockResolvedValue({
        ContentLength: 1024,
        LastModified: new Date(),
        ContentType: 'image/jpeg',
        ETag: '"test-etag"',
        Metadata: {},
      } as any)

      mockFileUploadService.deleteFile.mockResolvedValue()

      const response = await request(app)
        .delete('/api/upload/test-key')
        .set('Authorization', 'Bearer valid-token')
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data.key).toBe('test-key')
      expect(mockFileUploadService.deleteFile).toHaveBeenCalledWith('test-key')
    })

    it('should return 404 when file does not exist', async () => {
      mockFileUploadService.getFileMetadata.mockRejectedValue(new Error('NotFound'))

      const response = await request(app)
        .delete('/api/upload/nonexistent-key')
        .set('Authorization', 'Bearer valid-token')
        .expect(404)

      expect(response.body.success).toBe(false)
      expect(response.body.error).toBe('File not found')
    })
  })

  describe('GET /api/upload/:key/metadata', () => {
    it('should get file metadata successfully', async () => {
      const mockMetadata = {
        ContentLength: 1024,
        LastModified: new Date(),
        ContentType: 'image/jpeg',
        ETag: '"test-etag"',
        Metadata: { originalName: 'test.jpg' },
      }

      mockFileUploadService.getFileMetadata.mockResolvedValue(mockMetadata as any)

      const response = await request(app)
        .get('/api/upload/test-key/metadata')
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data.metadata).toEqual({
        size: 1024,
        lastModified: mockMetadata.LastModified,
        contentType: 'image/jpeg',
        etag: '"test-etag"',
        metadata: { originalName: 'test.jpg' },
      })
    })

    it('should return 404 when file does not exist', async () => {
      mockFileUploadService.getFileMetadata.mockRejectedValue(new Error('NotFound'))

      const response = await request(app)
        .get('/api/upload/nonexistent-key/metadata')
        .expect(404)

      expect(response.body.success).toBe(false)
      expect(response.body.error).toBe('File not found')
    })
  })

  describe('GET /api/upload/presigned-url', () => {
    it('should generate presigned upload URL successfully', async () => {
      const mockUrl = 'https://test-bucket.s3.amazonaws.com/presigned-upload-url'
      mockFileUploadService.getPresignedUploadUrl.mockResolvedValue(mockUrl)

      const response = await request(app)
        .get('/api/upload/presigned-url?key=test-key&contentType=image/jpeg')
        .set('Authorization', 'Bearer valid-token')
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data.url).toBe(mockUrl)
      expect(response.body.data.key).toBe('test-key')
      expect(response.body.data.contentType).toBe('image/jpeg')
      expect(mockFileUploadService.getPresignedUploadUrl).toHaveBeenCalledWith(
        'test-key',
        'image/jpeg',
        3600
      )
    })

    it('should reject request when key or contentType is missing', async () => {
      const response = await request(app)
        .get('/api/upload/presigned-url?key=test-key')
        .set('Authorization', 'Bearer valid-token')
        .expect(400)

      expect(response.body.success).toBe(false)
      expect(response.body.error).toBe('Missing parameters')
    })
  })

  describe('GET /api/upload/:key/download-url', () => {
    it('should generate presigned download URL successfully', async () => {
      const mockUrl = 'https://test-bucket.s3.amazonaws.com/presigned-download-url'
      const mockMetadata = {
        ContentLength: 1024,
        LastModified: new Date(),
        ContentType: 'image/jpeg',
        ETag: '"test-etag"',
        Metadata: {},
      }

      mockFileUploadService.getFileMetadata.mockResolvedValue(mockMetadata as any)
      mockFileUploadService.getPresignedDownloadUrl.mockResolvedValue(mockUrl)

      const response = await request(app)
        .get('/api/upload/test-key/download-url')
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data.url).toBe(mockUrl)
      expect(response.body.data.key).toBe('test-key')
      expect(mockFileUploadService.getPresignedDownloadUrl).toHaveBeenCalledWith(
        'test-key',
        3600
      )
    })

    it('should return 404 when file does not exist', async () => {
      mockFileUploadService.getFileMetadata.mockRejectedValue(new Error('NotFound'))

      const response = await request(app)
        .get('/api/upload/nonexistent-key/download-url')
        .expect(404)

      expect(response.body.success).toBe(false)
      expect(response.body.error).toBe('File not found')
    })
  })

  describe('GET /api/upload/list', () => {
    it('should list files successfully', async () => {
      const mockFiles = [
        {
          Key: 'uploads/test1.jpg',
          Size: 1024,
          LastModified: new Date(),
          ETag: '"test-etag-1"',
          StorageClass: 'STANDARD',
        },
        {
          Key: 'uploads/test2.jpg',
          Size: 2048,
          LastModified: new Date(),
          ETag: '"test-etag-2"',
          StorageClass: 'STANDARD',
        },
      ]

      mockFileUploadService.listFiles.mockResolvedValue(mockFiles as any)

      const response = await request(app)
        .get('/api/upload/list?folder=uploads&maxKeys=100')
        .set('Authorization', 'Bearer valid-token')
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data.files).toHaveLength(2)
      expect(response.body.data.count).toBe(2)
      expect(response.body.data.folder).toBe('uploads')
      expect(mockFileUploadService.listFiles).toHaveBeenCalledWith('uploads', 100)
    })
  })

  describe('GET /api/upload/bucket-info', () => {
    it('should get bucket information successfully', async () => {
      const mockBucketInfo = {
        bucket: 'test-bucket',
        region: 'us-east-1',
        exists: true,
      }

      mockFileUploadService.getBucketInfo.mockResolvedValue(mockBucketInfo)

      const response = await request(app)
        .get('/api/upload/bucket-info')
        .set('Authorization', 'Bearer valid-token')
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data.bucket).toEqual(mockBucketInfo)
      expect(mockFileUploadService.getBucketInfo).toHaveBeenCalled()
    })
  })
})

describe('File Upload Integration with Artwork', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Artwork creation with file upload', () => {
    it('should create artwork with file upload metadata', async () => {
      const mockUploadResult = {
        url: 'https://test-bucket.s3.amazonaws.com/artworks/artwork-key',
        key: 'artworks/artwork-key',
        bucket: 'test-bucket',
        contentType: 'image/webp',
        size: 2048,
        etag: '"artwork-etag"',
      }

      mockFileUploadService.uploadFile.mockResolvedValue(mockUploadResult)
      mockFileUploadService.validateFile.mockReturnValue({ isValid: true })

      // First upload the image
      const uploadResponse = await request(app)
        .post('/api/upload/artwork-image')
        .set('Authorization', 'Bearer valid-token')
        .attach('image', Buffer.from('test artwork image'), 'artwork.jpg')
        .expect(201)

      expect(uploadResponse.body.success).toBe(true)

      // Then create artwork with the uploaded image
      const artworkData = {
        title: 'Test Artwork',
        description: 'Test Description',
        imageUrl: uploadResponse.body.data.imageUrl,
        price: '100',
        currency: 'XLM',
        category: 'digital-art',
        fileUpload: {
          key: uploadResponse.body.data.imageKey,
          bucket: 'test-bucket',
          contentType: uploadResponse.body.data.imageMetadata.contentType,
          size: uploadResponse.body.data.imageMetadata.size,
          etag: uploadResponse.body.data.imageMetadata.etag,
          originalName: 'artwork.jpg',
          uploadDate: new Date(),
        },
        images: {
          original: uploadResponse.body.data.imageUrl,
          webp: uploadResponse.body.data.imageUrl,
        },
      }

      // Mock Artwork.create
      const mockArtwork = {
        _id: 'artwork-id',
        ...artworkData,
        creator: '0x123456789',
        owner: '0x123456789',
        isListed: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      jest.spyOn(Artwork, 'create').mockResolvedValue(mockArtwork as any)

      const response = await request(app)
        .post('/api/artworks')
        .set('Authorization', 'Bearer valid-token')
        .send(artworkData)
        .expect(201)

      expect(response.body.success).toBe(true)
      expect(response.body.data.fileUpload).toEqual(artworkData.fileUpload)
      expect(response.body.data.images).toEqual(artworkData.images)
    })
  })

  describe('Artwork deletion with file cleanup', () => {
    it('should delete artwork and associated files', async () => {
      const mockArtwork = {
        _id: 'artwork-id',
        title: 'Test Artwork',
        creator: '0x123456789',
        fileUpload: {
          key: 'artworks/artwork-key',
          bucket: 'test-bucket',
        },
        images: {
          original: 'https://test-bucket.s3.amazonaws.com/artworks/original.jpg',
          webp: 'https://test-bucket.s3.amazonaws.com/artworks/webp.webp',
        },
      }

      mockFileUploadService.deleteFile.mockResolvedValue()
      jest.spyOn(Artwork, 'findById').mockResolvedValue(mockArtwork as any)
      jest.spyOn(Artwork, 'findByIdAndDelete').mockResolvedValue(mockArtwork as any)

      const response = await request(app)
        .delete('/api/artworks/artwork-id')
        .set('Authorization', 'Bearer valid-token')
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data.message).toBe('Artwork and associated files deleted successfully')
      expect(mockFileUploadService.deleteFile).toHaveBeenCalledWith('artworks/artwork-key')
      expect(mockFileUploadService.deleteFile).toHaveBeenCalledTimes(3) // 1 for fileUpload.key + 2 for images
    })
  })
})
