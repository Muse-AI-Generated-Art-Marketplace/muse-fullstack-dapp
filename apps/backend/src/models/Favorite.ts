import mongoose, { Schema, Document } from 'mongoose'

export interface IFavorite extends Document {
  artwork: mongoose.Types.ObjectId
  user: string
  createdAt: Date
  updatedAt: Date
}

const FavoriteSchema = new Schema<IFavorite>({
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

// Compound index to prevent duplicate favorites
FavoriteSchema.index({ artwork: 1, user: 1 }, { unique: true })

// Indexes for performance optimization
FavoriteSchema.index({ user: 1, createdAt: -1 })
FavoriteSchema.index({ artwork: 1, createdAt: -1 })
FavoriteSchema.index({ createdAt: -1 })

// Virtual relationships for reverse lookups
FavoriteSchema.virtual('artworkInfo', {
  ref: 'Artwork',
  localField: 'artwork',
  foreignField: '_id',
  justOne: true
})

FavoriteSchema.virtual('userInfo', {
  ref: 'User',
  localField: 'user',
  foreignField: 'address',
  justOne: true
})

// Enable virtuals in JSON/Object output
FavoriteSchema.set('toJSON', { virtuals: true })
FavoriteSchema.set('toObject', { virtuals: true })

export const Favorite = mongoose.model<IFavorite>('Favorite', FavoriteSchema)
