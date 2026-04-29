// Centralized validation schemas export
// This file provides a single import point for all validation schemas

// Auth schemas
export {
  loginSchema,
  challengeSchema
} from './authSchemas'

// Artwork schemas
export {
  createArtworkSchema,
  updateArtworkSchema,
  getArtworkSchema,
  artworkQuerySchema
} from './artworkSchemas'

// User schemas
export {
  updateProfileSchema,
  getProfileSchema,
  updatePreferencesSchema,
  userActivitySchema,
  searchUsersSchema,
  leaderboardSchema,
  stellarAddressRegex
} from './userSchemas'

// Transaction schemas
export {
  createTransactionSchema,
  processTransactionSchema,
  transactionIdParamSchema,
  transactionQuerySchema,
  updateTransactionStatusSchema
} from './transactionSchemas'

// AI schemas
export {
  generateImageSchema,
  getGenerationStatusSchema
} from './aiSchemas'

// Bid schemas
export {
  createBidSchema,
  updateBidStatusSchema,
  getArtworkBidsSchema,
  getUserBidsSchema,
  expireBidsSchema,
  checkAuctionEndingsSchema
} from './bidSchemas'

// Search schemas
export {
  searchArtworksSchema
} from './searchSchemas'

// File upload schemas
export {
  deleteFileSchema,
  getFileMetadataSchema,
  getPresignedDownloadUrlSchema,
  getPresignedUploadUrlSchema,
  listFilesSchema,
  uploadArtworkImageSchema
} from './fileUploadSchemas'

// Admin schemas
export {
  getUserManagementSchema,
  updateUserStatusSchema,
  getSystemStatsSchema,
  getContentModerationSchema,
  moderateContentSchema
} from './adminSchemas'

// Cache schemas
export {
  clearCacheSchema,
  getCacheStatsSchema,
  warmupCacheSchema,
  setCacheConfigSchema
} from './cacheSchemas'

// Analytics schemas
export {
  getAnalyticsSchema,
  getUserAnalyticsSchema,
  getArtworkAnalyticsSchema,
  getTopArtworksSchema,
  exportAnalyticsSchema
} from './analyticsSchemas'

// Notification schemas
export {
  notificationQuerySchema,
  notificationIdSchema,
  updateNotificationReadSchema,
  notificationMarkAllReadSchema
} from './notificationSchemas'
