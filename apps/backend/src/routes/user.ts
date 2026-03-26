import { Router } from 'express'
import { getUserProfile, updateUserProfile } from '@/controllers/userController'
import { userProfileCache } from '@/middleware/cacheMiddleware'
import { authenticate } from '@/middleware/authMiddleware'

const router = Router()

router.get('/profile/:address', userProfileCache, getUserProfile)
router.put('/profile/:address', authenticate, updateUserProfile)

export default router
