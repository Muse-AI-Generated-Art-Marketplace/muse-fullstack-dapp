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

/**
 * @openapi
 * /api/notifications:
 *   get:
 *     summary: Get user notifications
 *     description: Retrieve paginated list of notifications for the authenticated user
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *       - in: query
 *         name: unreadOnly
 *         schema:
 *           type: boolean
 *           default: false
 *     responses:
 *       200:
 *         description: Notifications returned
 *       401:
 *         description: Authentication required
 */
router.get('/', validate(notificationQuerySchema), getNotifications)

/**
 * @openapi
 * /api/notifications/mark-all-read:
 *   patch:
 *     summary: Mark all notifications as read
 *     description: Mark all unread notifications as read for the authenticated user
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: All notifications marked as read
 *       401:
 *         description: Authentication required
 */
router.patch('/mark-all-read', markAllNotificationsRead)

/**
 * @openapi
 * /api/notifications/{id}/read:
 *   patch:
 *     summary: Mark notification as read
 *     description: Mark a specific notification as read
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Notification marked as read
 *       401:
 *         description: Authentication required
 *       404:
 *         description: Notification not found
 */
router.patch('/:id/read', validate(updateNotificationReadSchema), markNotificationRead)

/**
 * @openapi
 * /api/notifications/{id}:
 *   delete:
 *     summary: Delete notification
 *     description: Delete a specific notification
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       204:
 *         description: Notification deleted
 *       401:
 *         description: Authentication required
 *       404:
 *         description: Notification not found
 */
router.delete('/:id', validate(notificationIdSchema), deleteNotification)

/**
 * @openapi
 * /api/notifications/enqueue:
 *   post:
 *     summary: Enqueue notification
 *     description: Add a notification to the job queue for processing
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               recipient:
 *                 type: string
 *                 description: Recipient wallet address
 *               type:
 *                 type: string
 *                 enum: [sale, like, follow, comment, system]
 *               title:
 *                 type: string
 *               message:
 *                 type: string
 *               data:
 *                 type: object
 *     responses:
 *       202:
 *         description: Notification queued for processing
 *       401:
 *         description: Authentication required
 */
router.post('/enqueue', enqueueNotificationJob)

export default router
