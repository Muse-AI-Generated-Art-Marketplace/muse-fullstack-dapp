import mongoose from 'mongoose'
import { User } from '../models/User'
import { Artwork } from '../models/Artwork'
import { Like } from '../models/Like'
import { Favorite } from '../models/Favorite'
import { Follow } from '../models/Follow'
import { Transaction } from '../models/Transaction'
import { Bid } from '../models/Bid'
import relationshipHelpers from '../utils/relationshipHelpers'

// Mock MongoDB connection for testing
beforeAll(async () => {
  const mongoUri = process.env.MONGODB_URI_TEST || 'mongodb://localhost:27017/muse-test'
  
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(mongoUri)
  }
})

afterAll(async () => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.close()
  }
})

beforeEach(async () => {
  // Clear test data before each test
  await User.deleteMany({})
  await Artwork.deleteMany({})
  await Like.deleteMany({})
  await Favorite.deleteMany({})
  await Follow.deleteMany({})
  await Transaction.deleteMany({})
  await Bid.deleteMany({})
})

describe('Relationship Helpers', () => {
  describe('Virtual Relationships', () => {
    it('should populate user created artworks', async () => {
      const userAddress = 'GABC123'
      
      // Create user
      const user = await User.create({
        address: userAddress,
        username: 'testartist'
      })
      
      // Create artworks
      await Artwork.create([
        {
          title: 'Art 1',
          description: 'Test artwork 1',
          imageUrl: 'https://example.com/1.jpg',
          price: '100',
          currency: 'XLM',
          creator: userAddress,
          owner: userAddress,
          category: 'abstract'
        },
        {
          title: 'Art 2',
          description: 'Test artwork 2',
          imageUrl: 'https://example.com/2.jpg',
          price: '200',
          currency: 'XLM',
          creator: userAddress,
          owner: userAddress,
          category: 'portrait'
        }
      ])
      
      // Populate virtual relationship
      const populatedUser = await User.findById(user._id).populate('createdArtworks') as any
      
      expect(populatedUser).toBeTruthy()
      expect(populatedUser?.createdArtworks).toBeDefined()
      expect(populatedUser?.createdArtworks).toHaveLength(2)
    })
  })

  describe('toggleLike', () => {
    it('should add like when not exists', async () => {
      const userAddress = 'GABC123'
      
      const artwork = await Artwork.create({
        title: 'Test Art',
        description: 'Test artwork',
        imageUrl: 'https://example.com/1.jpg',
        price: '100',
        currency: 'XLM',
        creator: userAddress,
        owner: userAddress,
        category: 'abstract'
      })
      
      const { liked } = await relationshipHelpers.toggleLike(userAddress, artwork._id.toString())
      
      expect(liked).toBe(true)
      
      const likeCount = await Like.countDocuments({ artwork: artwork._id })
      expect(likeCount).toBe(1)
    })
    
    it('should remove like when exists', async () => {
      const userAddress = 'GABC123'
      
      const artwork = await Artwork.create({
        title: 'Test Art',
        description: 'Test artwork',
        imageUrl: 'https://example.com/1.jpg',
        price: '100',
        currency: 'XLM',
        creator: userAddress,
        owner: userAddress,
        category: 'abstract'
      })
      
      // First toggle - add like
      await relationshipHelpers.toggleLike(userAddress, artwork._id.toString())
      
      // Second toggle - remove like
      const { liked } = await relationshipHelpers.toggleLike(userAddress, artwork._id.toString())
      
      expect(liked).toBe(false)
      
      const likeCount = await Like.countDocuments({ artwork: artwork._id })
      expect(likeCount).toBe(0)
    })
  })

  describe('toggleFavorite', () => {
    it('should add favorite and update user stats', async () => {
      const userAddress = 'GABC123'
      
      const user = await User.create({
        address: userAddress,
        username: 'testuser',
        stats: {
          created: 0,
          collected: 0,
          favorites: 0
        }
      })
      
      const artwork = await Artwork.create({
        title: 'Test Art',
        description: 'Test artwork',
        imageUrl: 'https://example.com/1.jpg',
        price: '100',
        currency: 'XLM',
        creator: userAddress,
        owner: userAddress,
        category: 'abstract'
      })
      
      const { favorited } = await relationshipHelpers.toggleFavorite(userAddress, artwork._id.toString())
      
      expect(favorited).toBe(true)
      
      const updatedUser = await User.findById(user._id)
      expect(updatedUser?.stats.favorites).toBe(1)
    })
    
    it('should remove favorite and update user stats', async () => {
      const userAddress = 'GABC123'
      
      const user = await User.create({
        address: userAddress,
        username: 'testuser',
        stats: {
          created: 0,
          collected: 0,
          favorites: 1
        }
      })
      
      const artwork = await Artwork.create({
        title: 'Test Art',
        description: 'Test artwork',
        imageUrl: 'https://example.com/1.jpg',
        price: '100',
        currency: 'XLM',
        creator: userAddress,
        owner: userAddress,
        category: 'abstract'
      })
      
      // Add favorite first
      await Favorite.create({
        artwork: artwork._id,
        user: userAddress
      })
      
      // Remove favorite
      const { favorited } = await relationshipHelpers.toggleFavorite(userAddress, artwork._id.toString())
      
      expect(favorited).toBe(false)
      
      const updatedUser = await User.findById(user._id)
      expect(updatedUser?.stats.favorites).toBe(0)
    })
  })

  describe('toggleFollow', () => {
    it('should create follow relationship and update stats', async () => {
      const followerAddress = 'GABC123'
      const followingAddress = 'GDEF456'
      
      await User.create([
        {
          address: followerAddress,
          username: 'follower',
          stats: {
            created: 0,
            collected: 0,
            favorites: 0,
            following: 0
          }
        },
        {
          address: followingAddress,
          username: 'following',
          stats: {
            created: 0,
            collected: 0,
            favorites: 0,
            followers: 0
          }
        }
      ])
      
      const { following } = await relationshipHelpers.toggleFollow(followerAddress, followingAddress)
      
      expect(following).toBe(true)
      
      const followerUser = await User.findOne({ address: followerAddress })
      const followingUser = await User.findOne({ address: followingAddress })
      
      expect(followerUser?.stats.following).toBe(1)
      expect(followingUser?.stats.followers).toBe(1)
    })
    
    it('should remove follow relationship and update stats', async () => {
      const followerAddress = 'GABC123'
      const followingAddress = 'GDEF456'
      
      await User.create([
        {
          address: followerAddress,
          username: 'follower',
          stats: {
            created: 0,
            collected: 0,
            favorites: 0,
            following: 1
          }
        },
        {
          address: followingAddress,
          username: 'following',
          stats: {
            created: 0,
            collected: 0,
            favorites: 0,
            followers: 1
          }
        }
      ])
      
      // Create follow first
      await Follow.create({
        follower: followerAddress,
        following: followingAddress,
        status: 'active'
      })
      
      // Remove follow
      const { following } = await relationshipHelpers.toggleFollow(followerAddress, followingAddress)
      
      expect(following).toBe(false)
      
      const followerUser = await User.findOne({ address: followerAddress })
      const followingUser = await User.findOne({ address: followingAddress })
      
      expect(followerUser?.stats.following).toBe(0)
      expect(followingUser?.stats.followers).toBe(0)
    })
  })

  describe('Artwork Cascade Delete', () => {
    it('should delete all related data when artwork is deleted', async () => {
      const userAddress = 'GABC123'
      
      const artwork = await Artwork.create({
        title: 'Test Art',
        description: 'Test artwork',
        imageUrl: 'https://example.com/1.jpg',
        price: '100',
        currency: 'XLM',
        creator: userAddress,
        owner: userAddress,
        category: 'abstract'
      })
      
      // Create related data
      await Like.create({ artwork: artwork._id, user: userAddress })
      await Favorite.create({ artwork: artwork._id, user: userAddress })
      await Transaction.create({
        hash: 'test-hash-123',
        type: 'mint',
        artwork: artwork._id,
        from: userAddress,
        price: '100',
        currency: 'XLM',
        network: 'testnet',
        status: 'completed'
      })
      
      // Delete artwork (should trigger cascade)
      await artwork.deleteOne()
      
      // Check that related data was deleted
      const likes = await Like.find({ artwork: artwork._id })
      const favorites = await Favorite.find({ artwork: artwork._id })
      const transactions = await Transaction.find({ artwork: artwork._id })
      
      expect(likes).toHaveLength(0)
      expect(favorites).toHaveLength(0)
      expect(transactions).toHaveLength(0)
    })
  })

  describe('Query Helpers', () => {
    it('should get user created artworks with pagination', async () => {
      const userAddress = 'GABC123'
      
      // Create 5 artworks
      for (let i = 0; i < 5; i++) {
        await Artwork.create({
          title: `Art ${i}`,
          description: `Test artwork ${i}`,
          imageUrl: `https://example.com/${i}.jpg`,
          price: '100',
          currency: 'XLM',
          creator: userAddress,
          owner: userAddress,
          category: 'abstract'
        })
      }
      
      const artworks = await relationshipHelpers.getUserCreatedArtworks(userAddress, {
        skip: 0,
        limit: 3
      })
      
      expect(artworks).toHaveLength(3)
    })
    
    it('should get artwork with all relationships', async () => {
      const userAddress = 'GABC123'
      
      const artwork = await Artwork.create({
        title: 'Test Art',
        description: 'Test artwork',
        imageUrl: 'https://example.com/1.jpg',
        price: '100',
        currency: 'XLM',
        creator: userAddress,
        owner: userAddress,
        category: 'abstract'
      })
      
      // Add related data
      await Like.create({ artwork: artwork._id, user: userAddress })
      await Favorite.create({ artwork: artwork._id, user: userAddress })
      
      const result = await relationshipHelpers.getArtworkWithRelationships(artwork._id.toString())
      
      expect(result).toBeTruthy()
      expect(result?.title).toBe('Test Art')
      expect(result?.likesCount).toBe(1)
      expect(result?.favoritesCount).toBe(1)
    })
  })

  describe('Relationship Status Checks', () => {
    it('should check if user liked artwork', async () => {
      const userAddress = 'GABC123'
      
      const artwork = await Artwork.create({
        title: 'Test Art',
        description: 'Test artwork',
        imageUrl: 'https://example.com/1.jpg',
        price: '100',
        currency: 'XLM',
        creator: userAddress,
        owner: userAddress,
        category: 'abstract'
      })
      
      await Like.create({ artwork: artwork._id, user: userAddress })
      
      const hasLiked = await relationshipHelpers.hasUserLikedArtwork(userAddress, artwork._id.toString())
      expect(hasLiked).toBe(true)
      
      const hasNotLiked = await relationshipHelpers.hasUserLikedArtwork('GXYZ999', artwork._id.toString())
      expect(hasNotLiked).toBe(false)
    })
    
    it('should check if user is following another user', async () => {
      const followerAddress = 'GABC123'
      const followingAddress = 'GDEF456'
      
      await Follow.create({
        follower: followerAddress,
        following: followingAddress,
        status: 'active'
      })
      
      const isFollowing = await relationshipHelpers.isUserFollowing(followerAddress, followingAddress)
      expect(isFollowing).toBe(true)
      
      const isNotFollowing = await relationshipHelpers.isUserFollowing('GXYZ999', followingAddress)
      expect(isNotFollowing).toBe(false)
    })
  })
})

export {}
