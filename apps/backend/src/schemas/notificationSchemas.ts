import { z } from 'zod'

export const notificationQuerySchema = z.object({
  query: z.object({
    unreadOnly: z.coerce.boolean().optional(),
    skip: z.coerce.number().int().min(0).default(0),
    limit: z.coerce.number().int().min(1).max(100).default(20)
  })
})

export const notificationIdSchema = z.object({
  params: z.object({
    id: z.string().min(1)
  })
})

export const updateNotificationReadSchema = z.object({
  params: z.object({
    id: z.string().min(1)
  }),
  body: z.object({
    isRead: z.boolean()
  })
})

export const notificationMarkAllReadSchema = z.object({})
