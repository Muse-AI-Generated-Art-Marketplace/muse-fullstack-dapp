import { z } from 'zod'

export const deleteFileSchema = z.object({
  params: z.object({
    key: z.string().min(1, 'File key is required')
  })
})

export const getFileMetadataSchema = z.object({
  params: z.object({
    key: z.string().min(1, 'File key is required')
  })
})

export const getPresignedDownloadUrlSchema = z.object({
  params: z.object({
    key: z.string().min(1, 'File key is required')
  }),
  query: z.object({
    expiresIn: z.coerce.number().int().min(60).max(3600).default(3600)
  }).optional()
})

export const getPresignedUploadUrlSchema = z.object({
  query: z.object({
    filename: z.string().min(1, 'Filename is required'),
    contentType: z.string().min(1, 'Content type is required'),
    folder: z.string().optional(),
    isPublic: z.boolean().default(false),
    expiresIn: z.coerce.number().int().min(60).max(3600).default(3600)
  })
})

export const listFilesSchema = z.object({
  query: z.object({
    folder: z.string().optional(),
    prefix: z.string().optional(),
    limit: z.coerce.number().int().min(1).max(1000).default(100),
    continuationToken: z.string().optional()
  })
})

export const uploadArtworkImageSchema = z.object({
  body: z.object({
    artworkId: z.string().min(1, 'Artwork ID is required'),
    isPrimary: z.boolean().default(true)
  }).optional()
})
