import mongoose, { Schema, Document } from 'mongoose'

export interface IFollow extends Document {
  follower: string
  following: string
  status: 'active' | 'blocked' | 'pending'
  createdAt: Date
  updatedAt: Date
}

const FollowSchema = new Schema<IFollow>({
  follower: {
    type: String,
    required: true,
    trim: true,
    index: true
  },
  following: {
    type: String,
    required: true,
    trim: true,
    index: true
  },
  status: {
    type: String,
    required: true,
    enum: ['active', 'blocked', 'pending'],
    default: 'active',
    index: true
  }
}, {
  timestamps: true
})

// Compound index to prevent duplicate follows
FollowSchema.index({ follower: 1, following: 1 }, { unique: true })

// Indexes for performance optimization
FollowSchema.index({ following: 1, status: 1, createdAt: -1 })
FollowSchema.index({ follower: 1, status: 1, createdAt: -1 })
FollowSchema.index({ status: 1, createdAt: -1 })

export const Follow = mongoose.model<IFollow>('Follow', FollowSchema)
