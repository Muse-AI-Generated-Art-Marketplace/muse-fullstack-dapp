import { Request, Response, NextFunction } from 'express'
import { fileUploadService, UploadResult } from '@/services/fileUploadService'
import { createLogger } from '@/utils/logger'
import { createValidationError, createNotFoundError, createDatabaseError } from '@/middleware/errorHandler'

const logger = createLogger('FileUploadController')

// ── POST /api/upload/single ─────────────────────────────────────────────────
export const uploadSingleFile = async (req: Request, res: Response, next: NextFunction) => {
  const log = logger.child({ requestId: req.requestId })
  
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No file provided',
        message: 'Please select a file to upload',
      })
    }

    const uploadOptions = req.uploadOptions || {}
    
    log.info('Processing single file upload', {
      filename: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
      options: uploadOptions,
    })

    // Upload file to S3
    const result: UploadResult = await fileUploadService.uploadFile(
      req.file.buffer,
      req.file.originalname,
      req.file.mimetype,
      uploadOptions
    )

    log.info('Single file uploaded successfully', {
      key: result.key,
      url: result.url,
      size: result.size,
    })

    res.status(201).json({
      success: true,
      data: {
        file: result,
        message: 'File uploaded successfully',
      },
    })
  } catch (error) {
    log.error('Failed to upload single file', { error })
    next(createValidationError('Failed to upload file'))
  }
}

// ── POST /api/upload/multiple ───────────────────────────────────────────────
export const uploadMultipleFiles = async (req: Request, res: Response, next: NextFunction) => {
  const log = logger.child({ requestId: req.requestId })
  
  try {
    const files = req.files as Express.Multer.File[] || []
    
    if (files.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No files provided',
        message: 'Please select files to upload',
      })
    }

    const uploadOptions = req.uploadOptions || {}
    
    log.info('Processing multiple file upload', {
      fileCount: files.length,
      files: files.map(f => ({ filename: f.originalname, mimetype: f.mimetype, size: f.size })),
      options: uploadOptions,
    })

    // Upload all files to S3
    const uploadPromises = files.map(async (file) => {
      return await fileUploadService.uploadFile(
        file.buffer,
        file.originalname,
        file.mimetype,
        uploadOptions
      )
    })

    const results = await Promise.all(uploadPromises)

    log.info('Multiple files uploaded successfully', {
      count: results.length,
      totalSize: results.reduce((sum, r) => sum + r.size, 0),
    })

    res.status(201).json({
      success: true,
      data: {
        files: results,
        count: results.length,
        message: `${results.length} files uploaded successfully`,
      },
    })
  } catch (error) {
    log.error('Failed to upload multiple files', { error })
    next(createValidationError('Failed to upload files'))
  }
}

// ── DELETE /api/upload/:key ────────────────────────────────────────────────────
export const deleteFile = async (req: Request, res: Response, next: NextFunction) => {
  const log = logger.child({ requestId: req.requestId })
  
  try {
    const { key } = req.params

    if (!key) {
      return res.status(400).json({
        success: false,
        error: 'Missing file key',
        message: 'File key is required',
      })
    }

    log.info('Deleting file', { key })

    // Check if file exists before deleting
    try {
      await fileUploadService.getFileMetadata(key)
    } catch (error) {
      return res.status(404).json({
        success: false,
        error: 'File not found',
        message: 'The specified file does not exist',
      })
    }

    // Delete file from S3
    await fileUploadService.deleteFile(key)

    log.info('File deleted successfully', { key })

    res.json({
      success: true,
      data: {
        key,
        message: 'File deleted successfully',
      },
    })
  } catch (error) {
    log.error('Failed to delete file', { error })
    next(createDatabaseError('Failed to delete file'))
  }
}

// ── GET /api/upload/:key/metadata ─────────────────────────────────────────────
export const getFileMetadata = async (req: Request, res: Response, next: NextFunction) => {
  const log = logger.child({ requestId: req.requestId })
  
  try {
    const { key } = req.params

    if (!key) {
      return res.status(400).json({
        success: false,
        error: 'Missing file key',
        message: 'File key is required',
      })
    }

    log.info('Getting file metadata', { key })

    const metadata = await fileUploadService.getFileMetadata(key)

    log.info('File metadata retrieved', { key, size: metadata.ContentLength })

    res.json({
      success: true,
      data: {
        key,
        metadata: {
          size: metadata.ContentLength,
          lastModified: metadata.LastModified,
          contentType: metadata.ContentType,
          etag: metadata.ETag,
          metadata: metadata.Metadata,
        },
      },
    })
  } catch (error) {
    log.error('Failed to get file metadata', { error })
    
    if (error instanceof Error && error.message.includes('404')) {
      return next(createNotFoundError('File not found'))
    }
    
    next(createDatabaseError('Failed to get file metadata'))
  }
}

// ── GET /api/upload/presigned-url ─────────────────────────────────────────────
export const getPresignedUploadUrl = async (req: Request, res: Response, next: NextFunction) => {
  const log = logger.child({ requestId: req.requestId })
  
  try {
    const { key, contentType, expiresIn = '3600' } = req.query

    if (!key || !contentType) {
      return res.status(400).json({
        success: false,
        error: 'Missing parameters',
        message: 'Key and contentType are required',
      })
    }

    log.info('Generating presigned upload URL', { key, contentType, expiresIn })

    const url = await fileUploadService.getPresignedUploadUrl(
      key as string,
      contentType as string,
      parseInt(expiresIn as string)
    )

    log.info('Presigned upload URL generated', { key })

    res.json({
      success: true,
      data: {
        url,
        key,
        contentType,
        expiresIn: parseInt(expiresIn as string),
        message: 'Presigned URL generated successfully',
      },
    })
  } catch (error) {
    log.error('Failed to generate presigned upload URL', { error })
    next(createValidationError('Failed to generate presigned URL'))
  }
}

// ── GET /api/upload/:key/download-url ───────────────────────────────────────────
export const getPresignedDownloadUrl = async (req: Request, res: Response, next: NextFunction) => {
  const log = logger.child({ requestId: req.requestId })
  
  try {
    const { key } = req.params
    const { expiresIn = '3600' } = req.query

    if (!key) {
      return res.status(400).json({
        success: false,
        error: 'Missing file key',
        message: 'File key is required',
      })
    }

    log.info('Generating presigned download URL', { key, expiresIn })

    // Check if file exists
    try {
      await fileUploadService.getFileMetadata(key)
    } catch (error) {
      return res.status(404).json({
        success: false,
        error: 'File not found',
        message: 'The specified file does not exist',
      })
    }

    const url = await fileUploadService.getPresignedDownloadUrl(
      key,
      parseInt(expiresIn as string)
    )

    log.info('Presigned download URL generated', { key })

    res.json({
      success: true,
      data: {
        url,
        key,
        expiresIn: parseInt(expiresIn as string),
        message: 'Presigned download URL generated successfully',
      },
    })
  } catch (error) {
    log.error('Failed to generate presigned download URL', { error })
    next(createValidationError('Failed to generate presigned download URL'))
  }
}

// ── GET /api/upload/list ───────────────────────────────────────────────────────
export const listFiles = async (req: Request, res: Response, next: NextFunction) => {
  const log = logger.child({ requestId: req.requestId })
  
  try {
    const { folder = 'uploads', maxKeys = '100' } = req.query

    log.info('Listing files', { folder, maxKeys })

    const files = await fileUploadService.listFiles(
      folder as string,
      parseInt(maxKeys as string)
    )

    const fileList = files.map(file => ({
      key: file.Key,
      size: file.Size,
      lastModified: file.LastModified,
      etag: file.ETag,
      storageClass: file.StorageClass,
    }))

    log.info('Files listed successfully', { count: fileList.length, folder })

    res.json({
      success: true,
      data: {
        files: fileList,
        count: fileList.length,
        folder,
        message: `${fileList.length} files found`,
      },
    })
  } catch (error) {
    log.error('Failed to list files', { error })
    next(createDatabaseError('Failed to list files'))
  }
}

// ── GET /api/upload/bucket-info ───────────────────────────────────────────────
export const getBucketInfo = async (req: Request, res: Response, next: NextFunction) => {
  const log = logger.child({ requestId: req.requestId })
  
  try {
    log.info('Getting bucket information')

    const bucketInfo = await fileUploadService.getBucketInfo()

    log.info('Bucket information retrieved', bucketInfo)

    res.json({
      success: true,
      data: {
        bucket: bucketInfo,
        message: 'Bucket information retrieved successfully',
      },
    })
  } catch (error) {
    log.error('Failed to get bucket information', { error })
    next(createDatabaseError('Failed to get bucket information'))
  }
}

// ── POST /api/upload/artwork-image ─────────────────────────────────────────────
export const uploadArtworkImage = async (req: Request, res: Response, next: NextFunction) => {
  const log = logger.child({ requestId: req.requestId })
  
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No image file provided',
        message: 'Please select an image file to upload',
      })
    }

    // Validate that it's an image
    if (!req.file.mimetype.startsWith('image/')) {
      return res.status(400).json({
        success: false,
        error: 'Invalid file type',
        message: 'Only image files are allowed for artwork uploads',
      })
    }

    // Set artwork-specific upload options
    const uploadOptions = {
      folder: 'artworks',
      isPublic: true,
      resize: {
        width: req.query.width ? parseInt(req.query.width as string) : undefined,
        height: req.query.height ? parseInt(req.query.height as string) : undefined,
        fit: req.query.fit as any || 'cover',
      },
      quality: req.query.quality ? parseInt(req.query.quality as string) : 85,
      format: req.query.format as any || 'webp',
      metadata: {
        type: 'artwork-image',
        uploadedBy: req.user?.address || 'anonymous',
        uploadSource: 'muse-artwork-upload',
        ...req.uploadOptions?.metadata,
      },
    }

    log.info('Processing artwork image upload', {
      filename: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
      options: uploadOptions,
    })

    // Upload image to S3
    const result: UploadResult = await fileUploadService.uploadFile(
      req.file.buffer,
      req.file.originalname,
      req.file.mimetype,
      uploadOptions
    )

    log.info('Artwork image uploaded successfully', {
      key: result.key,
      url: result.url,
      size: result.size,
    })

    res.status(201).json({
      success: true,
      data: {
        imageUrl: result.url,
        imageKey: result.key,
        imageMetadata: {
          size: result.size,
          contentType: result.contentType,
          etag: result.etag,
        },
        message: 'Artwork image uploaded successfully',
      },
    })
  } catch (error) {
    log.error('Failed to upload artwork image', { error })
    next(createValidationError('Failed to upload artwork image'))
  }
}

export default {
  uploadSingleFile,
  uploadMultipleFiles,
  deleteFile,
  getFileMetadata,
  getPresignedUploadUrl,
  getPresignedDownloadUrl,
  listFiles,
  getBucketInfo,
  uploadArtworkImage,
}
