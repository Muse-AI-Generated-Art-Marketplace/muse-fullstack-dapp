import { Request, Response, NextFunction } from 'express'
import { createError } from '@/middleware/errorHandler'
import { createLogger } from '@/utils/logger'
import { getUserNotifications } from '@/utils/relationshipHelpers'
import { Notification } from '@/models/Notification'
import { JobType, jobQueueService } from '@/services/jobQueueService'
import { AuthRequest } from '@/middleware/authMiddleware'

const logger = createLogger('NotificationController')

export const getNotifications = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userAddress = req.user?.address
    if (!userAddress) {
      return next(createError('Authentication required to fetch notifications', 401))
    }

    const unreadOnly = String(req.query.unreadOnly).toLowerCase() === 'true'
    const skip = Number(req.query.skip ?? 0)
    const limit = Number(req.query.limit ?? 20)

    const notifications = await getUserNotifications(userAddress, {
      skip,
      limit,
      unreadOnly
    })

    logger.info('Fetched user notifications', { userAddress, count: notifications.length })

    res.json({
      success: true,
      data: notifications
    })
  } catch (error) {
    logger.error('Error fetching notifications:', error)
    next(createError('Failed to fetch notifications', 500))
  }
}

export const markNotificationRead = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userAddress = (req as any).user?.address
    if (!userAddress) {
      return next(createError('Authentication required to update notifications', 401))
    }

    const { id } = req.params
    const { isRead } = req.body

    const notification = await Notification.findOneAndUpdate(
      { _id: id, recipient: userAddress },
      { $set: { isRead } },
      { new: true }
    )

    if (!notification) {
      return next(createError('Notification not found', 404))
    }

    logger.info('Updated notification read state', { id, userAddress, isRead })

    res.json({
      success: true,
      data: notification
    })
  } catch (error) {
    logger.error('Error marking notification read:', error)
    next(createError('Failed to update notification', 500))
  }
}

export const markAllNotificationsRead = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userAddress = (req as any).user?.address
    if (!userAddress) {
      return next(createError('Authentication required to update notifications', 401))
    }

    const result = await Notification.updateMany(
      { recipient: userAddress, isRead: false },
      { $set: { isRead: true } }
    )

    logger.info('Marked all notifications read', { userAddress, modifiedCount: result.modifiedCount })

    res.json({
      success: true,
      data: {
        modifiedCount: result.modifiedCount
      }
    })
  } catch (error) {
    logger.error('Error marking all notifications read:', error)
    next(createError('Failed to update notifications', 500))
  }
}

export const deleteNotification = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userAddress = (req as any).user?.address
    if (!userAddress) {
      return next(createError('Authentication required to delete notifications', 401))
    }

    const { id } = req.params
    const notification = await Notification.findOneAndDelete({ _id: id, recipient: userAddress })

    if (!notification) {
      return next(createError('Notification not found', 404))
    }

    logger.info('Deleted notification', { id, userAddress })

    res.json({
      success: true,
      message: 'Notification deleted successfully'
    })
  } catch (error) {
    logger.error('Error deleting notification:', error)
    next(createError('Failed to delete notification', 500))
  }
}

export const enqueueNotificationJob = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userAddress = req.user?.address
    if (!userAddress) {
      return next(createError('Authentication required to enqueue notification jobs', 401))
    }

    const { type, payload, options } = req.body as {
      type: JobType
      payload: Record<string, any>
      options?: Record<string, any>
    }

    if (!type || typeof payload !== 'object' || payload === null) {
      return next(createError('Invalid notification job request', 400))
    }

    const job = await jobQueueService.addJob(type, payload, options)

    logger.info('Enqueued notification job', { type, jobId: job.id, userAddress })

    res.status(201).json({
      success: true,
      data: {
        id: job.id,
        type: job.name,
        status: 'waiting'
      }
    })
  } catch (error) {
    logger.error('Error enqueuing notification job:', error)
    next(createError('Failed to enqueue notification job', 500))
  }
}
