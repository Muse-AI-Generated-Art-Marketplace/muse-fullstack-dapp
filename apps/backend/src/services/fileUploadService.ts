import AWS from 'aws-sdk'
import { v4 as uuidv4 } from 'uuid'
import sharp from 'sharp'
import path from 'path'
import mime from 'mime-types'
import { createLogger } from '@/utils/logger'

const logger = createLogger('FileUploadService')

export interface UploadResult {
  url: string
  key: string
  bucket: string
  contentType: string
  size: number
  etag?: string
}

export interface UploadOptions {
  folder?: string
  isPublic?: boolean
  metadata?: Record<string, string>
  resize?: {
    width?: number
    height?: number
    fit?: 'cover' | 'contain' | 'fill' | 'inside' | 'outside'
  }
  quality?: number
  format?: 'jpeg' | 'png' | 'webp' | 'gif'
}

class FileUploadService {
  private s3: AWS.S3
  private bucketName: string
  private region: string

  constructor() {
    this.region = process.env.AWS_REGION || 'us-east-1'
    this.bucketName = process.env.AWS_S3_BUCKET || 'muse-artwork-uploads'

    // Initialize AWS S3
    this.s3 = new AWS.S3({
      region: this.region,
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      // Optional: for S3-compatible services like DigitalOcean Spaces
      ...(process.env.AWS_S3_ENDPOINT && {
        endpoint: process.env.AWS_S3_ENDPOINT,
        s3ForcePathStyle: true,
      }),
    })

    logger.info('FileUploadService initialized', {
      bucket: this.bucketName,
      region: this.region,
    })
  }

  /**
   * Upload a file buffer to S3
   */
  async uploadFile(
    buffer: Buffer,
    originalName: string,
    contentType: string,
    options: UploadOptions = {}
  ): Promise<UploadResult> {
    const log = logger.child({ originalName, contentType })
    
    try {
      // Generate unique filename
      const fileExtension = path.extname(originalName)
      const baseName = path.basename(originalName, fileExtension)
      const uniqueId = uuidv4()
      const folder = options.folder || 'uploads'
      const filename = `${folder}/${baseName}-${uniqueId}${fileExtension}`

      // Process image if needed
      let processedBuffer = buffer
      let finalContentType = contentType

      if (contentType.startsWith('image/') && (options.resize || options.quality || options.format)) {
        processedBuffer = await this.processImage(buffer, options)
        
        // Update content type if format changed
        if (options.format) {
          finalContentType = `image/${options.format}`
        }
      }

      // Upload to S3
      const uploadParams: AWS.S3.PutObjectRequest = {
        Bucket: this.bucketName,
        Key: filename,
        Body: processedBuffer,
        ContentType: finalContentType,
        ACL: options.isPublic ? 'public-read' : 'private',
        Metadata: {
          originalName,
          uploadTime: new Date().toISOString(),
          ...options.metadata,
        },
      }

      const result = await this.s3.upload(uploadParams).promise()

      const uploadResult: UploadResult = {
        url: result.Location,
        key: result.Key,
        bucket: result.Bucket,
        contentType: finalContentType,
        size: processedBuffer.length,
        etag: result.ETag,
      }

      log.info('File uploaded successfully', {
        key: result.Key,
        size: processedBuffer.length,
        url: result.Location,
      })

      return uploadResult
    } catch (error) {
      log.error('Failed to upload file', { error })
      throw new Error(`File upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Delete a file from S3
   */
  async deleteFile(key: string): Promise<void> {
    const log = logger.child({ key })
    
    try {
      await this.s3.deleteObject({
        Bucket: this.bucketName,
        Key: key,
      }).promise()

      log.info('File deleted successfully')
    } catch (error) {
      log.error('Failed to delete file', { error })
      throw new Error(`File deletion failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Get file metadata from S3
   */
  async getFileMetadata(key: string): Promise<AWS.S3.HeadObjectOutput> {
    try {
      return await this.s3.headObject({
        Bucket: this.bucketName,
        Key: key,
      }).promise()
    } catch (error) {
      logger.error('Failed to get file metadata', { key, error })
      throw new Error(`Failed to get file metadata: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Generate a presigned URL for file upload
   */
  async getPresignedUploadUrl(
    key: string,
    contentType: string,
    expiresIn: number = 3600
  ): Promise<string> {
    try {
      return await this.s3.getSignedUrlPromise('putObject', {
        Bucket: this.bucketName,
        Key: key,
        ContentType: contentType,
        ExpiresIn: expiresIn,
        ACL: 'public-read',
      })
    } catch (error) {
      logger.error('Failed to generate presigned URL', { key, contentType, error })
      throw new Error(`Failed to generate presigned URL: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Generate a presigned URL for file download
   */
  async getPresignedDownloadUrl(
    key: string,
    expiresIn: number = 3600
  ): Promise<string> {
    try {
      return await this.s3.getSignedUrlPromise('getObject', {
        Bucket: this.bucketName,
        Key: key,
        ExpiresIn: expiresIn,
      })
    } catch (error) {
      logger.error('Failed to generate presigned download URL', { key, error })
      throw new Error(`Failed to generate presigned download URL: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * List files in a folder
   */
  async listFiles(folder: string, maxKeys: number = 1000): Promise<AWS.S3.ObjectList> {
    try {
      const result = await this.s3.listObjectsV2({
        Bucket: this.bucketName,
        Prefix: folder,
        MaxKeys: maxKeys,
      }).promise()

      return result.Contents || []
    } catch (error) {
      logger.error('Failed to list files', { folder, error })
      throw new Error(`Failed to list files: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Process image with Sharp
   */
  private async processImage(
    buffer: Buffer,
    options: UploadOptions
  ): Promise<Buffer> {
    let image = sharp(buffer)

    // Apply resize if specified
    if (options.resize) {
      image = image.resize(options.resize.width, options.resize.height, {
        fit: options.resize.fit || 'cover',
      })
    }

    // Apply format and quality
    const format = options.format || 'jpeg'
    const quality = options.quality || 80

    switch (format) {
      case 'jpeg':
        image = image.jpeg({ quality })
        break
      case 'png':
        image = image.png({ quality })
        break
      case 'webp':
        image = image.webp({ quality })
        break
      case 'gif':
        image = image.gif()
        break
      default:
        image = image.jpeg({ quality })
    }

    return await image.toBuffer()
  }

  /**
   * Validate file type and size
   */
  validateFile(buffer: Buffer, originalName: string, contentType: string): {
    isValid: boolean
    error?: string
  } {
    const maxSize = parseInt(process.env.MAX_FILE_SIZE || '10485760') // 10MB default
    const maxImageSize = parseInt(process.env.MAX_IMAGE_SIZE || '20971520') // 20MB default
    const allowedTypes = process.env.ALLOWED_FILE_TYPES?.split(',') || [
      'image/jpeg',
      'image/png',
      'image/webp',
      'image/gif',
      'image/svg+xml',
    ]

    // Check file size
    if (contentType.startsWith('image/') && buffer.length > maxImageSize) {
      return {
        isValid: false,
        error: `Image size exceeds maximum allowed size of ${maxImageSize / 1024 / 1024}MB`,
      }
    }

    if (buffer.length > maxSize) {
      return {
        isValid: false,
        error: `File size exceeds maximum allowed size of ${maxSize / 1024 / 1024}MB`,
      }
    }

    // Check content type
    if (!allowedTypes.includes(contentType)) {
      return {
        isValid: false,
        error: `File type ${contentType} is not allowed. Allowed types: ${allowedTypes.join(', ')}`,
      }
    }

    // Validate actual file content matches the declared content type
    const detectedType = mime.lookup(originalName)
    if (detectedType && !allowedTypes.includes(detectedType)) {
      return {
        isValid: false,
        error: `File extension suggests type ${detectedType}, which is not allowed`,
      }
    }

    return { isValid: true }
  }

  /**
   * Get S3 bucket info
   */
  async getBucketInfo(): Promise<{ bucket: string; region: string; exists: boolean }> {
    try {
      await this.s3.headBucket({ Bucket: this.bucketName }).promise()
      return {
        bucket: this.bucketName,
        region: this.region,
        exists: true,
      }
    } catch (error) {
      return {
        bucket: this.bucketName,
        region: this.region,
        exists: false,
      }
    }
  }
}

export const fileUploadService = new FileUploadService()
export default fileUploadService
