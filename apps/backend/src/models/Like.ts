import mongoose, { Schema, Document } from 'mongoose'

export interface ILike extends Document {
  artwork: mongoose.Types.ObjectId
  user: string
  createdAt: Date
  updatedAt: Date
}

const LikeSchema = new Schema<ILike>({
  artwork: {
    type: Schema.Types.ObjectId,
    ref: 'Artwork',
    required: true,
    index: true
  },
  user: {
    type: String,
    required: true,
    trim: true,
    index: true
  }
}, {
  timestamps: true
})

// Compound index to prevent duplicate likes
LikeSchema.index({ artwork: 1, user: 1 }, { unique: true })

// Indexes for performance optimization
LikeSchema.index({ user: 1, createdAt: -1 })
LikeSchema.index({ artwork: 1, createdAt: -1 })
LikeSchema.index({ createdAt: -1 })

// Virtual relationships for reverse lookups
LikeSchema.virtual('artworkInfo', {
  ref: 'Artwork',
  localField: 'artwork',
  foreignField: '_id',
  justOne: true
})

LikeSchema.virtual('userInfo', {
  ref: 'User',
  localField: 'user',
  foreignField: 'address',
  justOne: true
})

// Enable virtuals in JSON/Object output
LikeSchema.set('toJSON', { virtuals: true })
LikeSchema.set('toObject', { virtuals: true })

export const Like = mongoose.model<ILike>('Like', LikeSchema)
