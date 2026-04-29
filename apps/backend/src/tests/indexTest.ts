import mongoose from 'mongoose'
import { createLogger } from '@/utils/logger'
import { database } from '@/config/database'

const logger = createLogger('IndexTest')

async function testIndexes() {
  try {
    // Connect to database
    await database.connect()
    logger.info('Connected to database for index testing')

    // Get database instance
    const db = mongoose.connection.db
    
    // Test Artwork indexes
    logger.info('Testing Artwork collection indexes...')
    const artworkIndexes = await db.collection('artworks').getIndexes()
    logger.info('Artwork indexes:', artworkIndexes)
    
    // Test User indexes  
    logger.info('Testing User collection indexes...')
    const userIndexes = await db.collection('users').getIndexes()
    logger.info('User indexes:', userIndexes)
    
    // Test Transaction indexes
    logger.info('Testing Transaction collection indexes...')
    const transactionIndexes = await db.collection('transactions').getIndexes()
    logger.info('Transaction indexes:', transactionIndexes)

    // Test index statistics
    logger.info('Testing index statistics...')
    
    const artworkStats = await db.collection('artworks').aggregate([{ $indexStats: {} }]).toArray()
    logger.info('Artwork index stats:', artworkStats)
    
    const userStats = await db.collection('users').aggregate([{ $indexStats: {} }]).toArray()
    logger.info('User index stats:', userStats)
    
    const transactionStats = await db.collection('transactions').aggregate([{ $indexStats: {} }]).toArray()
    logger.info('Transaction index stats:', transactionStats)

    // Test query performance with indexes
    logger.info('Testing query performance...')
    
    // Test artwork query with category filter
    const artworkQueryStart = Date.now()
    await db.collection('artworks').find({ 
      category: 'abstract', 
      isListed: true 
    }).sort({ createdAt: -1 }).limit(20).toArray()
    const artworkQueryTime = Date.now() - artworkQueryStart
    logger.info(`Artwork query time: ${artworkQueryTime}ms`)
    
    // Test user lookup by publicKey
    const userQueryStart = Date.now()
    await db.collection('users').findOne({ publicKey: 'test-key' })
    const userQueryTime = Date.now() - userQueryStart
    logger.info(`User query time: ${userQueryTime}ms`)

    // Test text search
    const searchQueryStart = Date.now()
    await db.collection('artworks').find({ 
      $text: { $search: 'abstract art' } 
    }).toArray()
    const searchQueryTime = Date.now() - searchQueryStart
    logger.info(`Search query time: ${searchQueryTime}ms`)

    logger.info('Index testing completed successfully')
    
  } catch (error) {
    logger.error('Index testing failed:', error)
  } finally {
    await database.disconnect()
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  testIndexes()
}

export { testIndexes }
