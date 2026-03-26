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

export const Like = mongoose.model<ILike>('Like', LikeSchema)
