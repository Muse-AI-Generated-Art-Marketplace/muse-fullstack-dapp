import { Request, Response, NextFunction } from 'express'
import User from '@/models/User'
import {
  createNotFoundError,
  createDatabaseError,
  createValidationError,
} from '@/middleware/errorHandler'
import { createLogger } from '@/utils/logger'

const logger = createLogger('UserController')

// ── GET /api/users/:address ──────────────────────────────────────────────────
export const getUser = async (req: Request, res: Response, next: NextFunction) => {
  const log = logger.child({ requestId: req.requestId })
  try {
    const { address } = req.params
    if (!address?.trim()) {
      return next(createValidationError('Wallet address is required'))
    }

    const user = await User.findOne({ address }).lean()
    if (!user) {
      return next(createNotFoundError('User'))
    }

    log.info('User fetched', { address })
    res.json({ success: true, data: user })
  } catch (error) {
    log.error('Failed to fetch user', { address: req.params.address, error })
    next(createDatabaseError('Failed to fetch user'))
  }
}

// ── PUT /api/users/:address ──────────────────────────────────────────────────
export const updateUser = async (req: Request, res: Response, next: NextFunction) => {
  const log = logger.child({ requestId: req.requestId })
  try {
    const { address } = req.params
    const callerAddress = (req as any).user?.address

    if (callerAddress !== address) {
      return next(createValidationError('You can only update your own profile'))
    }

    const allowedUpdates = ['username', 'bio', 'profileImage', 'avatar', 'banner', 'preferences']
    const updates: Record<string, unknown> = {}
    allowedUpdates.forEach((field) => {
      if (req.body[field] !== undefined) updates[field] = req.body[field]
    })

    if (Object.keys(updates).length === 0) {
      return next(createValidationError('No valid fields provided for update'))
    }

    const user = await User.findOneAndUpdate({ address }, updates, { new: true, runValidators: true })
    if (!user) {
      return next(createNotFoundError('User'))
    }

    log.info('User updated', { address })
    res.json({ success: true, data: user })
  } catch (error) {
    log.error('Failed to update user', { address: req.params.address, error })
    next(createDatabaseError('Failed to update user'))
  }
}

// ── GET /api/users/:address/stats ────────────────────────────────────────────
export const getUserStats = async (req: Request, res: Response, next: NextFunction) => {
  const log = logger.child({ requestId: req.requestId })
  try {
    const { address } = req.params
    const user = await User.findOne({ address }, 'stats').lean()
    if (!user) {
      return next(createNotFoundError('User'))
    }

    log.info('User stats fetched', { address })
    res.json({ success: true, data: user.stats ?? {} })
  } catch (error) {
    log.error('Failed to fetch user stats', { address: req.params.address, error })
    next(createDatabaseError('Failed to fetch user stats'))
  }
}
