import { Router } from 'express'
import * as artworkController from '@/controllers/artworkController'
import { artworkListCache, artworkDetailCache } from '@/middleware/cacheMiddleware'
import { authenticate } from '@/middleware/authMiddleware'

const router = Router()

// Public routes with caching
router.get('/', artworkListCache, artworkController.getArtworks)
router.get('/:id', artworkDetailCache, artworkController.getArtworkById)

// Protected routes (require auth)
router.post('/', authenticate, artworkController.createArtwork)
router.put('/:id', authenticate, artworkController.updateArtwork)
router.delete('/:id', authenticate, artworkController.deleteArtwork)

export default router
