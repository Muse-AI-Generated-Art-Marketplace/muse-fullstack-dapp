import { Router } from 'express'
import { login, getChallenge } from '@/controllers/authController'

const router = Router()

/**
 * @route   GET /api/auth/challenge
 * @desc    Get a challenge/nonce for signing
 * @access  Public
 */
router.get('/challenge', getChallenge)

/**
 * @route   POST /api/auth/login
 * @desc    Verify signature and issue JWT
 * @access  Public
 */
router.post('/login', login)

export default router
