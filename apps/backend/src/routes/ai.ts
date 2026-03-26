import { Router } from 'express'
import { generateImage, getGenerationStatus } from '@/controllers/aiController'
import { aiStatusCache } from '@/middleware/cacheMiddleware'
import { authenticate } from '@/middleware/authMiddleware'

const router = Router()

router.post('/generate', authenticate, generateImage)
router.get('/status/:id', authenticate, aiStatusCache, getGenerationStatus)

export default router
