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

// Virtual relationships for reverse lookups
FollowSchema.virtual('followerInfo', {
  ref: 'User',
  localField: 'follower',
  foreignField: 'address',
  justOne: true
})

FollowSchema.virtual('followingInfo', {
  ref: 'User',
  localField: 'following',
  foreignField: 'address',
  justOne: true
})

// Enable virtuals in JSON/Object output
FollowSchema.set('toJSON', { virtuals: true })
FollowSchema.set('toObject', { virtuals: true })

export const Follow = mongoose.model<IFollow>('Follow', FollowSchema)
