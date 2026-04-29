import mongoose, { Schema, Document } from 'mongoose'

export interface INotification extends Document {
  recipient: string
  sender?: string
  type: 'sale' | 'purchase' | 'bid' | 'follow' | 'like' | 'comment' | 'mention' | 'system' | 'price_alert'
  title: string
  message: string
  data?: {
    artworkId?: mongoose.Types.ObjectId
    transactionId?: mongoose.Types.ObjectId
    bidId?: mongoose.Types.ObjectId
    amount?: string
    currency?: string
    [key: string]: any
  }
  isRead: boolean
  priority: 'low' | 'medium' | 'high'
  category: 'transaction' | 'social' | 'system' | 'marketing'
  actionUrl?: string
  expiresAt?: Date
  createdAt: Date
  updatedAt: Date
}

const NotificationSchema = new Schema<INotification>({
  recipient: {
    type: String,
    required: true,
    trim: true,
    index: true
  },
  sender: {
    type: String,
    trim: true,
    index: true
  },
  type: {
    type: String,
    required: true,
    enum: ['sale', 'purchase', 'bid', 'follow', 'like', 'comment', 'mention', 'system', 'price_alert'],
    index: true
  },
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  message: {
    type: String,
    required: true,
    maxlength: 1000
  },
  data: {
    artworkId: {
      type: Schema.Types.ObjectId,
      ref: 'Artwork'
    },
    transactionId: {
      type: Schema.Types.ObjectId,
      ref: 'Transaction'
    },
    bidId: {
      type: Schema.Types.ObjectId,
      ref: 'Bid'
    },
    amount: String,
    currency: String
  },
  isRead: {
    type: Boolean,
    default: false,
    index: true
  },
  priority: {
    type: String,
    required: true,
    enum: ['low', 'medium', 'high'],
    default: 'medium',
    index: true
  },
  category: {
    type: String,
    required: true,
    enum: ['transaction', 'social', 'system', 'marketing'],
    default: 'system',
    index: true
  },
  actionUrl: {
    type: String,
    trim: true
  },
  expiresAt: {
    type: Date,
    index: true
  }
}, {
  timestamps: true
})

// Indexes for performance optimization
NotificationSchema.index({ recipient: 1, isRead: 1, createdAt: -1 })
NotificationSchema.index({ recipient: 1, type: 1, createdAt: -1 })
NotificationSchema.index({ recipient: 1, priority: 1, createdAt: -1 })
NotificationSchema.index({ type: 1, createdAt: -1 })
NotificationSchema.index({ category: 1, createdAt: -1 })
NotificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }) // Auto-expire notifications
NotificationSchema.index({ createdAt: -1 })

// Virtual relationships for reverse lookups
NotificationSchema.virtual('recipientInfo', {
  ref: 'User',
  localField: 'recipient',
  foreignField: 'address',
  justOne: true
})

NotificationSchema.virtual('senderInfo', {
  ref: 'User',
  localField: 'sender',
  foreignField: 'address',
  justOne: true
})

// Enable virtuals in JSON/Object output
NotificationSchema.set('toJSON', { virtuals: true })
NotificationSchema.set('toObject', { virtuals: true })

export const Notification = mongoose.model<INotification>('Notification', NotificationSchema)
