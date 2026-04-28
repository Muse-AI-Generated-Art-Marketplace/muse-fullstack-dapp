import { Router } from 'express'
import {
  getArtworks,
  getArtwork,
  createArtwork,
  updateArtwork,
  deleteArtwork,
} from '@/controllers/artworkController'
import { authenticate, optionalAuthenticate } from '@/middleware/authMiddleware'
import { validate } from '@/middleware/validate'
import {
  createArtworkSchema,
  updateArtworkSchema,
  getArtworkSchema,
  artworkQuerySchema
} from '@/schemas'

const router = Router()

router.get('/', optionalAuthenticate, validate(artworkQuerySchema), getArtworks)
router.get('/:id', optionalAuthenticate, validate(getArtworkSchema), getArtwork)
router.post('/', authenticate, validate(createArtworkSchema), createArtwork)
router.put('/:id', authenticate, validate(updateArtworkSchema), updateArtwork)
router.delete('/:id', authenticate, validate(getArtworkSchema), deleteArtwork)

export default router
