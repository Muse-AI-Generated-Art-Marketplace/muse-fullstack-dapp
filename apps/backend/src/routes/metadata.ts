import { Router } from 'express'
import { getArtworkMetadata } from '@/controllers/metadataController'
import { metadataCache } from '@/middleware/cacheMiddleware'

const router = Router()

/**
 * @openapi
 * /api/metadata/artwork/{id}:
 *   get:
 *     summary: Get artwork metadata
 *     description: Retrieve SEO/Social sharing metadata for a specific artwork
 *     tags: [Metadata]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Metadata returned successfully
 */
router.get('/artwork/:id', metadataCache, getArtworkMetadata)

export default router
