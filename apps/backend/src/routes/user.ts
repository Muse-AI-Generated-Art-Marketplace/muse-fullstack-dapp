import { Router } from 'express'
import { getUser, updateUser, getUserStats } from '@/controllers/userController'
import { authenticate } from '@/middleware/authMiddleware'

const router = Router()

router.get('/:address', getUser)
router.put('/:address', authenticate, updateUser)
router.get('/:address/stats', getUserStats)

export default router
