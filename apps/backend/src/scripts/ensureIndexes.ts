import mongoose from 'mongoose'
import { createLogger } from '@/utils/logger'
import {
  Artwork,
  User,
  Transaction,
  Collection,
  Bid,
  Notification,
  Comment,
  Auction,
  Follow,
  Like,
  Favorite,
} from '@/models'

const logger = createLogger('EnsureIndexes')

/** All registered models and their collection names. */
const MODELS = [
  { model: Artwork,      collection: 'artworks'      },
  { model: User,         collection: 'users'         },
  { model: Transaction,  collection: 'transactions'  },
  { model: Collection,   collection: 'collections'   },
  { model: Bid,          collection: 'bids'          },
  { model: Notification, collection: 'notifications' },
  { model: Comment,      collection: 'comments'      },
  { model: Auction,      collection: 'auctions'      },
  { model: Follow,       collection: 'follows'       },
  { model: Like,         collection: 'likes'         },
  { model: Favorite,     collection: 'favorites'     },
] as const

/**
 * Ensure all database indexes are created for every model.
 * Safe to call on every application startup — MongoDB is idempotent for
 * existing indexes.
 */
export const ensureIndexes = async (): Promise<void> => {
  logger.info('Starting database index creation...')

  for (const { model, collection } of MODELS) {
    try {
      await model.createIndexes()
      logger.info(`Indexes ensured for collection: ${collection}`)
    } catch (error) {
      logger.error(`Error creating indexes for collection ${collection}:`, error)
      throw error
    }
  }

  logger.info('All database indexes have been successfully created')
}

/**
 * Log index statistics for every collection.
 * Useful for diagnosing index usage in production.
 */
export const getIndexStats = async (): Promise<void> => {
  const db = mongoose.connection.db

  for (const { collection } of MODELS) {
    try {
      const stats = await db.collection(collection).stats()
      logger.info(`[${collection}] index sizes:`, stats.indexSizes)

      const indexStats = await db
        .collection(collection)
        .aggregate([{ $indexStats: {} }])
        .toArray()
      logger.info(`[${collection}] index usage stats:`, indexStats)
    } catch (error) {
      logger.warn(`Could not retrieve stats for collection ${collection}:`, error)
    }
  }
}

// Run script if called directly
if (require.main === module) {
  const connectAndRun = async () => {
    try {
      const mongoUri =
        process.env.MONGODB_URI || 'mongodb://localhost:27017/muse-marketplace'
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
