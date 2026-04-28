import mongoose from 'mongoose'
import { describe, it, beforeAll, afterAll, beforeEach } from '@jest/globals'
import { Artwork, User, Transaction } from '@/models'

describe('Database Indexing', () => {
  beforeAll(async () => {
    const mongoUri = process.env.MONGODB_TEST_URI || 'mongodb://localhost:27017/muse-test'
    await mongoose.connect(mongoUri)
  })

  afterAll(async () => {
    await mongoose.disconnect()
  })

  beforeEach(async () => {
    await Artwork.deleteMany({})
    await User.deleteMany({})
    await Transaction.deleteMany({})
  })

  // ─── Artwork Indexes ────────────────────────────────────────────────────────

  describe('Artwork Indexes', () => {
    it('should have creator index', async () => {
      const indexes = await Artwork.collection.getIndexes()
      expect(indexes).toHaveProperty('creator_1')
    })

    it('should have owner index', async () => {
      const indexes = await Artwork.collection.getIndexes()
      expect(indexes).toHaveProperty('owner_1')
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

    it('should have text search index on title and description', async () => {
      const indexes = await Artwork.collection.getIndexes()
      // MongoDB names the text index after all indexed fields
      const hasTextIndex = Object.keys(indexes).some(
        (k) => k.includes('title_text') && k.includes('description_text')
      )
      expect(hasTextIndex).toBe(true)
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

  // ─── User Indexes ────────────────────────────────────────────────────────────

  describe('User Indexes', () => {
    it('should have unique address index', async () => {
      const indexes = await User.collection.getIndexes()
      expect(indexes).toHaveProperty('address_1')
      expect(indexes['address_1'].unique).toBe(true)
    })

    it('should have unique sparse publicKey index', async () => {
      const indexes = await User.collection.getIndexes()
      expect(indexes).toHaveProperty('publicKey_1')
      expect(indexes['publicKey_1'].unique).toBe(true)
      expect(indexes['publicKey_1'].sparse).toBe(true)
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

  // ─── Transaction Indexes ─────────────────────────────────────────────────────

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

  // ─── Query Performance Tests ─────────────────────────────────────────────────

  describe('Query Performance Tests', () => {
    beforeEach(async () => {
      const testUser = new User({
        address: 'test-public-key',
        publicKey: 'test-public-key',
        username: 'testuser',
        email: 'test@example.com',
        stats: {
          artworksCreated: 10,
          followers: 100,
        },
      })
      await testUser.save()

      const artworks = Array.from({ length: 100 }, (_, i) => ({
        title: `Test Artwork ${i}`,
        description: `Description for artwork ${i}`,
        imageUrl: `https://example.com/image${i}.jpg`,
        price: (i * 10).toString(),
        creator: 'test-public-key',
        owner: 'test-public-key',
        category: 'abstract',
        isListed: i % 2 === 0,
        aiModel: 'stable-diffusion',
      }))
      await Artwork.insertMany(artworks)

      const insertedArtworks = await Artwork.find().lean()
      const transactions = Array.from({ length: 50 }, (_, i) => ({
        hash: `hash-${i}`,
        type: 'sale',
        artwork: insertedArtworks[i % insertedArtworks.length]._id,
        from: 'from-address',
        to: 'to-address',
        price: '100',
        currency: 'XLM',
        network: 'testnet',
        status: 'completed',
      }))
      await Transaction.insertMany(transactions)
    })

    it('should efficiently query artworks by category and listing status', async () => {
      const startTime = Date.now()

      const artworks = await Artwork.find({ category: 'abstract', isListed: true })
        .sort({ createdAt: -1 })
        .limit(20)
        .lean()

      const queryTime = Date.now() - startTime
      expect(artworks.length).toBeGreaterThan(0)
      expect(queryTime).toBeLessThan(100)
    })

    it('should efficiently query artworks by creator', async () => {
      const startTime = Date.now()

      const artworks = await Artwork.find({ creator: 'test-public-key' })
        .sort({ createdAt: -1 })
        .limit(20)
        .lean()

      const queryTime = Date.now() - startTime
      expect(artworks.length).toBeGreaterThan(0)
      expect(queryTime).toBeLessThan(100)
    })

    it('should efficiently perform text search', async () => {
      const startTime = Date.now()

      const artworks = await Artwork.find({ $text: { $search: 'Test' } })
        .sort({ score: { $meta: 'textScore' } })
        .limit(20)
        .lean()

      const queryTime = Date.now() - startTime
      expect(artworks.length).toBeGreaterThan(0)
      expect(queryTime).toBeLessThan(200)
    })

    it('should efficiently query user by address', async () => {
      const startTime = Date.now()

      const user = await User.findOne({ address: 'test-public-key' }).lean()

      const queryTime = Date.now() - startTime
      expect(user).toBeTruthy()
      expect(queryTime).toBeLessThan(50)
    })

    it('should efficiently query transactions by artwork', async () => {
      const artwork = await Artwork.findOne().lean()
      const startTime = Date.now()

      const transactions = await Transaction.find({ artwork: artwork!._id })
        .sort({ createdAt: -1 })
        .limit(20)
        .lean()

      const queryTime = Date.now() - startTime
      expect(transactions.length).toBeGreaterThan(0)
      expect(queryTime).toBeLessThan(100)
    })
  })
})
