import mongoose from 'mongoose'
import { createLogger } from '@/utils/logger'
import { Artwork, User, Transaction } from '@/models'

const logger = createLogger('EnsureIndexes')

/**
 * Script to ensure all database indexes are properly created
 * This script should be run during application startup or as a separate migration
 */
export const ensureIndexes = async (): Promise<void> => {
  try {
    logger.info('Starting database index creation...')

    // Ensure Artwork indexes
    await Artwork.createIndexes()
    logger.info('Artwork indexes ensured')

    // Ensure User indexes
    await User.createIndexes()
    logger.info('User indexes ensured')

    // Ensure Transaction indexes
    await Transaction.createIndexes()
    logger.info('Transaction indexes ensured')

    logger.info('All database indexes have been successfully created')
  } catch (error) {
    logger.error('Error creating database indexes:', error)
    throw error
  }
}

/**
 * Get statistics about current indexes
 */
export const getIndexStats = async (): Promise<void> => {
  try {
    const db = mongoose.connection.db
    
    // Get artwork collection stats
    const artworkStats = await db.collection('artworks').stats()
    logger.info('Artwork collection index sizes:', artworkStats.indexSizes)

    // Get user collection stats
    const userStats = await db.collection('users').stats()
    logger.info('User collection index sizes:', userStats.indexSizes)

    // Get transaction collection stats
    const transactionStats = await db.collection('transactions').stats()
    logger.info('Transaction collection index sizes:', transactionStats.indexSizes)

    // Get index usage statistics
    const artworkIndexStats = await db.collection('artworks').aggregate([{ $indexStats: {} }]).toArray()
    const userIndexStats = await db.collection('users').aggregate([{ $indexStats: {} }]).toArray()
    const transactionIndexStats = await db.collection('transactions').aggregate([{ $indexStats: {} }]).toArray()

    logger.info('Artwork index usage stats:', artworkIndexStats)
    logger.info('User index usage stats:', userIndexStats)
    logger.info('Transaction index usage stats:', transactionIndexStats)
  } catch (error) {
    logger.error('Error getting index statistics:', error)
    throw error
  }
}

// Run script if called directly
if (require.main === module) {
  const connectAndRun = async () => {
    try {
      // Connect to MongoDB (make sure MONGODB_URI is set)
      const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/muse-marketplace'
      await mongoose.connect(mongoUri)
      
      await ensureIndexes()
      await getIndexStats()
      
      await mongoose.disconnect()
      process.exit(0)
    } catch (error) {
      logger.error('Script failed:', error)
      process.exit(1)
    }
  }

  connectAndRun()
}
