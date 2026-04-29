import { Router } from 'express'
import {
  uploadSingleFile,
  uploadMultipleFiles,
  deleteFile,
  getFileMetadata,
  getPresignedUploadUrl,
  getPresignedDownloadUrl,
  listFiles,
  getBucketInfo,
  uploadArtworkImage,
} from '@/controllers/fileUploadController'
import { authenticate, optionalAuthenticate } from '@/middleware/authMiddleware'
import { validate } from '@/middleware/validate'
import {
  deleteFileSchema,
  getFileMetadataSchema,
  getPresignedDownloadUrlSchema,
  getPresignedUploadUrlSchema,
  listFilesSchema
} from '@/schemas'
import {
  uploadSingle,
  uploadMultiple,
  validateUploadedFiles,
  setUploadOptions,
  handleUploadError,
  uploadRateLimit,
} from '@/middleware/fileUploadMiddleware'

const router = Router()

// ── Single File Upload ───────────────────────────────────────────────────────
router.post(
  '/single',
  uploadRateLimit,
  authenticate,
  setUploadOptions({ folder: 'uploads', isPublic: true }),
  uploadSingle('file'),
  validateUploadedFiles,
  uploadSingleFile
)

// ── Multiple Files Upload ──────────────────────────────────────────────────────
router.post(
  '/multiple',
  uploadRateLimit,
  authenticate,
  setUploadOptions({ folder: 'uploads', isPublic: true }),
  uploadMultiple('files', 5),
  validateUploadedFiles,
  uploadMultipleFiles
)

// ── Artwork Image Upload (Specialized endpoint for artwork images) ───────────────
router.post(
  '/artwork-image',
  uploadRateLimit,
  authenticate,
  setUploadOptions({ folder: 'artworks', isPublic: true }),
  uploadSingle('image'),
  validateUploadedFiles,
  uploadArtworkImage
)

// ── Public File Upload (No authentication required) ───────────────────────────
router.post(
  '/public',
  uploadRateLimit,
  setUploadOptions({ folder: 'public', isPublic: true }),
  uploadSingle('file'),
  validateUploadedFiles,
  uploadSingleFile
)

// ── File Management ───────────────────────────────────────────────────────────

// Delete file
router.delete('/:key', authenticate, validate(deleteFileSchema), deleteFile)

// Get file metadata
router.get('/:key/metadata', optionalAuthenticate, validate(getFileMetadataSchema), getFileMetadata)

// Get presigned download URL
router.get('/:key/download-url', optionalAuthenticate, validate(getPresignedDownloadUrlSchema), getPresignedDownloadUrl)

// ── Presigned URLs ─────────────────────────────────────────────────────────────

// Get presigned upload URL (for client-side uploads)
router.get('/presigned-url', authenticate, validate(getPresignedUploadUrlSchema), getPresignedUploadUrl)

// ── File Management (Admin/Authenticated) ───────────────────────────────────────

// List files in folder
router.get('/list', authenticate, validate(listFilesSchema), listFiles)

// Get bucket information
router.get('/bucket-info', authenticate, getBucketInfo)

// ── Error Handling ───────────────────────────────────────────────────────────────
router.use(handleUploadError)

export default router
