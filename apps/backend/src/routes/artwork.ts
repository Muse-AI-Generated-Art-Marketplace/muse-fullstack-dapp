import { Router } from 'express'
import {
  getArtworks,
  getArtwork,
  createArtwork,
  updateArtwork,
  deleteArtwork,
} from '@/controllers/artworkController'
import { authenticate, optionalAuthenticate } from '@/middleware/authMiddleware'

const router = Router()

router.get('/', optionalAuthenticate, getArtworks)
router.get('/:id', optionalAuthenticate, getArtwork)
router.post('/', authenticate, createArtwork)
router.put('/:id', authenticate, updateArtwork)
router.delete('/:id', authenticate, deleteArtwork)

export default router
