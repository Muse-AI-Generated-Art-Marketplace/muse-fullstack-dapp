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
import {
  uploadSingle,
  uploadMultiple,
  validateUploadedFiles,
  setUploadOptions,
  handleUploadError,
} from '@/middleware/fileUploadMiddleware'

const router = Router()

// ── Single File Upload ───────────────────────────────────────────────────────
router.post(
  '/single',
  authenticate,
  setUploadOptions({ folder: 'uploads', isPublic: true }),
  uploadSingle('file'),
  validateUploadedFiles,
  uploadSingleFile
)

// ── Multiple Files Upload ──────────────────────────────────────────────────────
router.post(
  '/multiple',
  authenticate,
  setUploadOptions({ folder: 'uploads', isPublic: true }),
  uploadMultiple('files', 5),
  validateUploadedFiles,
  uploadMultipleFiles
)

// ── Artwork Image Upload (Specialized endpoint for artwork images) ───────────────
router.post(
  '/artwork-image',
  authenticate,
  setUploadOptions({ folder: 'artworks', isPublic: true }),
  uploadSingle('image'),
  validateUploadedFiles,
  uploadArtworkImage
)

// ── Public File Upload (No authentication required) ───────────────────────────
router.post(
  '/public',
  setUploadOptions({ folder: 'public', isPublic: true }),
  uploadSingle('file'),
  validateUploadedFiles,
  uploadSingleFile
)

// ── File Management ───────────────────────────────────────────────────────────

// Delete file
router.delete('/:key', authenticate, deleteFile)

// Get file metadata
router.get('/:key/metadata', optionalAuthenticate, getFileMetadata)

// Get presigned download URL
router.get('/:key/download-url', optionalAuthenticate, getPresignedDownloadUrl)

// ── Presigned URLs ─────────────────────────────────────────────────────────────

// Get presigned upload URL (for client-side uploads)
router.get('/presigned-url', authenticate, getPresignedUploadUrl)

// ── File Management (Admin/Authenticated) ───────────────────────────────────────

// List files in folder
router.get('/list', authenticate, listFiles)

// Get bucket information
router.get('/bucket-info', authenticate, getBucketInfo)

// ── Error Handling ───────────────────────────────────────────────────────────────
router.use(handleUploadError)

export default router
