import express, { Request, Response, NextFunction } from 'express'
import {
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification,
  enqueueNotificationJob
} from '@/controllers/notificationController'
import { authenticate } from '@/middleware/authMiddleware'
import {
  notificationQuerySchema,
  notificationIdSchema,
  updateNotificationReadSchema
} from '@/schemas/notificationSchemas'
import { ZodError } from 'zod'

const router = express.Router()
router.use(authenticate)

const validate = (schema: any) => (req: Request, res: Response, next: NextFunction): void => {
  try {
    const parsed = schema.parse({ params: req.params, query: req.query, body: req.body })
    req.params = parsed.params
    req.query = parsed.query
    req.body = parsed.body
    return next()
  } catch (error) {
    if (error instanceof ZodError) {
      res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: error.errors
      })
      return
    }
    res.status(400).json({ success: false, error: 'Invalid request format' })
    return
  }
}

router.get('/', validate(notificationQuerySchema), getNotifications)
router.patch('/mark-all-read', markAllNotificationsRead)
router.patch('/:id/read', validate(updateNotificationReadSchema), markNotificationRead)
router.delete('/:id', validate(notificationIdSchema), deleteNotification)
router.post('/enqueue', enqueueNotificationJob)

export default router
