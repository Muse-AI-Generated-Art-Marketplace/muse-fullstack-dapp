import mongoose, { Schema, Document } from 'mongoose'

export interface IComment extends Document {
  artwork: mongoose.Types.ObjectId
  author: string
  content: string
  parentComment?: mongoose.Types.ObjectId
  replies: mongoose.Types.ObjectId[]
  likes: string[]
  isEdited: boolean
  isDeleted: boolean
  editedAt?: Date
  deletedAt?: Date
  moderationStatus: 'pending' | 'approved' | 'rejected' | 'hidden'
  reportedBy: string[]
  metadata?: {
    ipAddress?: string
    userAgent?: string
    [key: string]: any
  }
  createdAt: Date
  updatedAt: Date
}

const CommentSchema = new Schema<IComment>({
  artwork: {
    type: Schema.Types.ObjectId,
    ref: 'Artwork',
    required: true,
    index: true
  },
  author: {
    type: String,
    required: true,
    trim: true,
    index: true
  },
  content: {
    type: String,
    required: true,
    trim: true,
    maxlength: 1000,
    minlength: 1
  },
  parentComment: {
    type: Schema.Types.ObjectId,
    ref: 'Comment',
    index: true
  },
  replies: [{
    type: Schema.Types.ObjectId,
    ref: 'Comment'
  }],
  likes: [{
    type: String,
    trim: true
  }],
  isEdited: {
    type: Boolean,
    default: false
  },
  isDeleted: {
    type: Boolean,
    default: false,
    index: true
  },
  editedAt: {
    type: Date
  },
  deletedAt: {
    type: Date,
    index: true
  },
  moderationStatus: {
    type: String,
    required: true,
    enum: ['pending', 'approved', 'rejected', 'hidden'],
    default: 'approved',
    index: true
  },
  reportedBy: [{
    type: String,
    trim: true
  }],
  metadata: {
    ipAddress: String,
    userAgent: String
  }
}, {
  timestamps: true
})

// Indexes for performance optimization
CommentSchema.index({ artwork: 1, moderationStatus: 1, createdAt: -1 })
CommentSchema.index({ author: 1, isDeleted: 1, createdAt: -1 })
CommentSchema.index({ parentComment: 1, createdAt: 1 })
CommentSchema.index({ moderationStatus: 1, createdAt: -1 })
CommentSchema.index({ createdAt: -1 })
CommentSchema.index({ content: 'text' }) // For content search

// Pre-save middleware to handle edit timestamps
CommentSchema.pre('save', function(this: IComment, next: any) {
  if (this.isModified('content') && !this.isNew) {
    this.isEdited = true
    this.editedAt = new Date()
  }
  next()
})

// Virtual for reply count
CommentSchema.virtual('replyCount', {
  ref: 'Comment',
  localField: '_id',
  foreignField: 'parentComment',
  count: true
})

// Virtual for like count
CommentSchema.virtual('likeCount').get(function(this: IComment) {
  return this.likes.length
})

// Virtual relationships for reverse lookups
CommentSchema.virtual('artworkInfo', {
  ref: 'Artwork',
  localField: 'artwork',
  foreignField: '_id',
  justOne: true
})

CommentSchema.virtual('authorInfo', {
  ref: 'User',
  localField: 'author',
  foreignField: 'address',
  justOne: true
})

CommentSchema.virtual('parentCommentInfo', {
  ref: 'Comment',
  localField: 'parentComment',
  foreignField: '_id',
  justOne: true
})

CommentSchema.virtual('replyDetails', {
  ref: 'Comment',
  localField: 'replies',
  foreignField: '_id',
  justOne: false
})

CommentSchema.virtual('likerInfos', {
  ref: 'User',
  localField: 'likes',
  foreignField: 'address',
  justOne: false
})

CommentSchema.virtual('reporterInfos', {
  ref: 'User',
  localField: 'reportedBy',
  foreignField: 'address',
  justOne: false
})

// Ensure virtuals are included in JSON
CommentSchema.set('toJSON', { virtuals: true })
CommentSchema.set('toObject', { virtuals: true })

export const Comment = mongoose.model<IComment>('Comment', CommentSchema)
