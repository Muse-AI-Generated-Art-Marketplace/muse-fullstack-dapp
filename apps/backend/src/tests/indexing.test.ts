import mongoose from 'mongoose'
import { describe, it, beforeAll, afterAll, beforeEach } from '@jest/globals'
import { Artwork, User, Transaction } from '@/models'

describe('Database Indexing', () => {
  beforeAll(async () => {
    // Connect to test database
    const mongoUri = process.env.MONGODB_TEST_URI || 'mongodb://localhost:27017/muse-test'
    await mongoose.connect(mongoUri)
  })

  afterAll(async () => {
    await mongoose.disconnect()
  })

  beforeEach(async () => {
    // Clean up collections before each test
    await Artwork.deleteMany({})
    await User.deleteMany({})
    await Transaction.deleteMany({})
  })

  describe('Artwork Indexes', () => {
    it('should have creator index', async () => {
      const indexes = await Artwork.collection.getIndexes()
      expect(indexes).toHaveProperty('creator_1')
    })

    it('should have compound creator and createdAt index', async () => {
      const indexes = await Artwork.collection.getIndexes()
      expect(indexes).toHaveProperty('creator_1_createdAt_-1')
    })

    it('should have category, isListed, and createdAt compound index', async () => {
      const indexes = await Artwork.collection.getIndexes()
      expect(indexes).toHaveProperty('category_1_isListed_1_createdAt_-1')
    })

    it('should have owner and isListed compound index', async () => {
      const indexes = await Artwork.collection.getIndexes()
      expect(indexes).toHaveProperty('owner_1_isListed_1')
    })

    it('should have price index', async () => {
      const indexes = await Artwork.collection.getIndexes()
      expect(indexes).toHaveProperty('price_1')
    })

    it('should have createdAt index', async () => {
      const indexes = await Artwork.collection.getIndexes()
      expect(indexes).toHaveProperty('createdAt_-1')
    })

    it('should have text search index', async () => {
      const indexes = await Artwork.collection.getIndexes()
      expect(indexes).toHaveProperty('title_text_description_text')
    })

    it('should have aiModel and createdAt compound index', async () => {
      const indexes = await Artwork.collection.getIndexes()
      expect(indexes).toHaveProperty('aiModel_1_createdAt_-1')
    })

    it('should have blockchainData.network index', async () => {
      const indexes = await Artwork.collection.getIndexes()
      expect(indexes).toHaveProperty('blockchainData.network_1')
    })

    it('should have sparse blockchainData.tokenId index', async () => {
      const indexes = await Artwork.collection.getIndexes()
      expect(indexes).toHaveProperty('blockchainData.tokenId_1')
      expect(indexes['blockchainData.tokenId_1'].sparse).toBe(true)
    })
  })

  describe('User Indexes', () => {
    it('should have unique publicKey index', async () => {
      const indexes = await User.collection.getIndexes()
      expect(indexes).toHaveProperty('publicKey_1')
      expect(indexes['publicKey_1'].unique).toBe(true)
    })

    it('should have unique sparse username index', async () => {
      const indexes = await User.collection.getIndexes()
      expect(indexes).toHaveProperty('username_1')
      expect(indexes['username_1'].unique).toBe(true)
      expect(indexes['username_1'].sparse).toBe(true)
    })

    it('should have unique sparse email index', async () => {
      const indexes = await User.collection.getIndexes()
      expect(indexes).toHaveProperty('email_1')
      expect(indexes['email_1'].unique).toBe(true)
      expect(indexes['email_1'].sparse).toBe(true)
    })

    it('should have isVerified and createdAt compound index', async () => {
      const indexes = await User.collection.getIndexes()
      expect(indexes).toHaveProperty('isVerified_1_createdAt_-1')
    })

    it('should have stats.artworksCreated index', async () => {
      const indexes = await User.collection.getIndexes()
      expect(indexes).toHaveProperty('stats.artworksCreated_-1')
    })

    it('should have stats.followers index', async () => {
      const indexes = await User.collection.getIndexes()
      expect(indexes).toHaveProperty('stats.followers_-1')
    })

    it('should have createdAt index', async () => {
      const indexes = await User.collection.getIndexes()
      expect(indexes).toHaveProperty('createdAt_-1')
    })
  })

  describe('Transaction Indexes', () => {
    it('should have unique hash index', async () => {
      const indexes = await Transaction.collection.getIndexes()
      expect(indexes).toHaveProperty('hash_1')
      expect(indexes['hash_1'].unique).toBe(true)
    })

    it('should have artwork and createdAt compound index', async () => {
      const indexes = await Transaction.collection.getIndexes()
      expect(indexes).toHaveProperty('artwork_1_createdAt_-1')
    })

    it('should have from and createdAt compound index', async () => {
      const indexes = await Transaction.collection.getIndexes()
      expect(indexes).toHaveProperty('from_1_createdAt_-1')
    })

    it('should have to and createdAt compound index', async () => {
      const indexes = await Transaction.collection.getIndexes()
      expect(indexes).toHaveProperty('to_1_createdAt_-1')
    })

    it('should have type, status, and createdAt compound index', async () => {
      const indexes = await Transaction.collection.getIndexes()
      expect(indexes).toHaveProperty('type_1_status_1_createdAt_-1')
    })

    it('should have network, status, and createdAt compound index', async () => {
      const indexes = await Transaction.collection.getIndexes()
      expect(indexes).toHaveProperty('network_1_status_1_createdAt_-1')
    })

    it('should have status and createdAt compound index', async () => {
      const indexes = await Transaction.collection.getIndexes()
      expect(indexes).toHaveProperty('status_1_createdAt_-1')
    })

    it('should have blockNumber index', async () => {
      const indexes = await Transaction.collection.getIndexes()
      expect(indexes).toHaveProperty('blockNumber_1')
    })

    it('should have price index', async () => {
      const indexes = await Transaction.collection.getIndexes()
      expect(indexes).toHaveProperty('price_1')
    })
  })

  describe('Query Performance Tests', () => {
    beforeEach(async () => {
      // Create test data for performance testing
      const testUser = new User({
        publicKey: 'test-public-key',
        username: 'testuser',
        email: 'test@example.com',
        stats: {
          artworksCreated: 10,
          followers: 100
        }
      })
      await testUser.save()

      // Create test artworks
      const artworks = Array.from({ length: 100 }, (_, i) => ({
        title: `Test Artwork ${i}`,
        description: `Description for artwork ${i}`,
        imageUrl: `https://example.com/image${i}.jpg`,
        price: (i * 10).toString(),
        creator: testUser.publicKey,
        category: 'abstract',
        isListed: i % 2 === 0,
        aiModel: 'stable-diffusion'
      }))
      await Artwork.insertMany(artworks)

      // Create test transactions
      const transactions = Array.from({ length: 50 }, (_, i) => ({
        hash: `hash-${i}`,
        type: 'sale',
        artwork: artworks[i % artworks.length]._id,
        from: 'from-address',
        to: 'to-address',
        price: '100',
        network: 'testnet',
        status: 'completed'
      }))
      await Transaction.insertMany(transactions)
    })

    it('should efficiently query artworks by category and listing status', async () => {
      const startTime = Date.now()
      
      const query = { category: 'abstract', isListed: true }
      const artworks = await Artwork.find(query)
        .sort({ createdAt: -1 })
        .limit(20)
        .lean()
      
      const endTime = Date.now()
      const queryTime = endTime - startTime
      
      expect(artworks.length).toBeGreaterThan(0)
      expect(queryTime).toBeLessThan(100) // Should complete in less than 100ms
    })

    it('should efficiently query artworks by creator', async () => {
      const startTime = Date.now()
      
      const artworks = await Artwork.find({ creator: 'test-public-key' })
        .sort({ createdAt: -1 })
        .limit(20)
        .lean()
      
      const endTime = Date.now()
      const queryTime = endTime - startTime
      
      expect(artworks.length).toBeGreaterThan(0)
      expect(queryTime).toBeLessThan(100)
    })

    it('should efficiently perform text search', async () => {
      const startTime = Date.now()
      
      const artworks = await Artwork.find({ $text: { $search: 'Test' } })
        .sort({ score: { $meta: 'textScore' } })
        .limit(20)
        .lean()
      
      const endTime = Date.now()
      const queryTime = endTime - startTime
      
      expect(artworks.length).toBeGreaterThan(0)
      expect(queryTime).toBeLessThan(200) // Text search might be slightly slower
    })

    it('should efficiently query user by publicKey', async () => {
      const startTime = Date.now()
      
      const user = await User.findOne({ publicKey: 'test-public-key' }).lean()
      
      const endTime = Date.now()
      const queryTime = endTime - startTime
      
      expect(user).toBeTruthy()
      expect(queryTime).toBeLessThan(50)
    })

    it('should efficiently query transactions by artwork', async () => {
      const artwork = await Artwork.findOne()
      const startTime = Date.now()
      
      const transactions = await Transaction.find({ artwork: artwork!._id })
        .sort({ createdAt: -1 })
        .limit(20)
        .lean()
      
      const endTime = Date.now()
      const queryTime = endTime - startTime
      
      expect(transactions.length).toBeGreaterThan(0)
      expect(queryTime).toBeLessThan(100)
    })
  })
})
