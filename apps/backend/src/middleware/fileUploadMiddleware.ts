import { Request, Response, NextFunction } from 'express'
import multer from 'multer'
import { createLogger } from '@/utils/logger'
import { fileUploadService } from '@/services/fileUploadService'

const logger = createLogger('FileUploadMiddleware')

// Configure multer for memory storage
const storage = multer.memoryStorage()

// File filter function
const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  try {
    // Get allowed file types from environment
    const allowedTypes = process.env.ALLOWED_FILE_TYPES?.split(',') || [
      'image/jpeg',
      'image/png',
      'image/webp',
      'image/gif',
      'image/svg+xml',
    ]

    // Check if file type is allowed
    if (!allowedTypes.includes(file.mimetype)) {
      const error = new Error(`File type ${file.mimetype} is not allowed. Allowed types: ${allowedTypes.join(', ')}`)
      return cb(error as any)
    }

    // Additional validation for file extension
    const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.svg']
    const fileExtension = file.originalname.toLowerCase().substring(file.originalname.lastIndexOf('.'))
    
    if (!allowedExtensions.includes(fileExtension)) {
      const error = new Error(`File extension ${fileExtension} is not allowed`)
      return cb(error as any)
    }

    cb(null, true)
  } catch (error) {
    logger.error('File filter error', { error, filename: file.originalname })
    cb(error as any)
  }
}

// Create multer instance
export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760'), // 10MB default
    files: 5, // Maximum 5 files per request
  },
})

// Middleware for single file upload
export const uploadSingle = (fieldName: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const singleUpload = upload.single(fieldName)
    
    singleUpload(req, res, (error) => {
      if (error) {
        logger.error('Single file upload error', { error, fieldName })
        
        if (error instanceof multer.MulterError) {
          switch (error.code) {
            case 'LIMIT_FILE_SIZE':
              return res.status(413).json({
                success: false,
                error: 'File too large',
                message: `File size exceeds maximum allowed size of ${parseInt(process.env.MAX_FILE_SIZE || '10485760') / 1024 / 1024}MB`,
              })
            case 'LIMIT_FILE_COUNT':
              return res.status(413).json({
                success: false,
                error: 'Too many files',
                message: 'Only one file is allowed for this upload',
              })
            case 'LIMIT_UNEXPECTED_FILE':
              return res.status(400).json({
                success: false,
                error: 'Unexpected file field',
                message: `Expected field name: ${fieldName}`,
              })
            default:
              return res.status(400).json({
                success: false,
                error: 'Upload error',
                message: error.message,
              })
          }
        }
        
        return res.status(400).json({
          success: false,
          error: 'File validation failed',
          message: error instanceof Error ? error.message : 'Unknown error',
        })
      }
      
      next()
    })
  }
}

// Middleware for multiple file upload
export const uploadMultiple = (fieldName: string, maxCount: number = 5) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const multipleUpload = upload.array(fieldName, maxCount)
    
    multipleUpload(req, res, (error) => {
      if (error) {
        logger.error('Multiple file upload error', { error, fieldName, maxCount })
        
        if (error instanceof multer.MulterError) {
          switch (error.code) {
            case 'LIMIT_FILE_SIZE':
              return res.status(413).json({
                success: false,
                error: 'File too large',
                message: `One or more files exceed the maximum allowed size of ${parseInt(process.env.MAX_FILE_SIZE || '10485760') / 1024 / 1024}MB`,
              })
            case 'LIMIT_FILE_COUNT':
              return res.status(413).json({
                success: false,
                error: 'Too many files',
                message: `Maximum ${maxCount} files allowed`,
              })
            case 'LIMIT_UNEXPECTED_FILE':
              return res.status(400).json({
                success: false,
                error: 'Unexpected file field',
                message: `Expected field name: ${fieldName}`,
              })
            default:
              return res.status(400).json({
                success: false,
                error: 'Upload error',
                message: error.message,
              })
          }
        }
        
        return res.status(400).json({
          success: false,
          error: 'File validation failed',
          message: error instanceof Error ? error.message : 'Unknown error',
        })
      }
      
      next()
    })
  }
}

// Middleware to validate uploaded files with the file upload service
export const validateUploadedFiles = (req: Request, res: Response, next: NextFunction) => {
  try {
    const files = req.files as Express.Multer.File[] || []
    const file = req.file as Express.Multer.File || null

    // Validate single file
    if (file) {
      const validation = fileUploadService.validateFile(
        file.buffer,
        file.originalname,
        file.mimetype
      )

      if (!validation.isValid) {
        return res.status(400).json({
          success: false,
          error: 'File validation failed',
          message: validation.error,
        })
      }
    }

    // Validate multiple files
    if (files.length > 0) {
      for (const uploadedFile of files) {
        const validation = fileUploadService.validateFile(
          uploadedFile.buffer,
          uploadedFile.originalname,
          uploadedFile.mimetype
        )

        if (!validation.isValid) {
          return res.status(400).json({
            success: false,
            error: 'File validation failed',
            message: `File "${uploadedFile.originalname}": ${validation.error}`,
          })
        }
      }
    }

    next()
  } catch (error) {
    logger.error('File validation middleware error', { error })
    res.status(500).json({
      success: false,
      error: 'File validation error',
      message: 'An error occurred during file validation',
    })
  }
}

// Middleware to add upload options to request
export const setUploadOptions = (defaultOptions: any = {}) => {
  return (req: Request, res: Response, next: NextFunction) => {
    // Extract upload options from query parameters or body
    const uploadOptions = {
      folder: req.query.folder as string || req.body.folder || defaultOptions.folder || 'uploads',
      isPublic: req.query.public === 'true' || req.body.public === true || defaultOptions.isPublic !== false,
      resize: req.query.resize || req.body.resize || defaultOptions.resize,
      quality: req.query.quality ? parseInt(req.query.quality as string) : req.body.quality || defaultOptions.quality,
      format: req.query.format as string || req.body.format || defaultOptions.format,
      metadata: {
        uploadedBy: req.user?.address || 'anonymous',
        uploadSource: 'muse-api',
        ...defaultOptions.metadata,
        ...req.body.metadata,
      },
    }

    // Attach upload options to request
    req.uploadOptions = uploadOptions
    
    next()
  }
}

// Extend Request interface to include upload options
declare global {
  namespace Express {
    interface Request {
      uploadOptions?: {
        folder?: string
        isPublic?: boolean
        resize?: any
        quality?: number
        format?: string
        metadata?: Record<string, string>
      }
    }
  }
}

// Error handling middleware for file uploads
export const handleUploadError = (error: Error, req: Request, res: Response, next: NextFunction) => {
  logger.error('Upload error handler', { error, url: req.url, method: req.method })
  
  if (error instanceof multer.MulterError) {
    return res.status(400).json({
      success: false,
      error: 'Upload error',
      message: error.message,
      code: error.code,
    })
  }
  
  res.status(500).json({
    success: false,
    error: 'Upload failed',
    message: 'An unexpected error occurred during file upload',
  })
}

export default {
  upload,
  uploadSingle,
  uploadMultiple,
  validateUploadedFiles,
  setUploadOptions,
  handleUploadError,
}
