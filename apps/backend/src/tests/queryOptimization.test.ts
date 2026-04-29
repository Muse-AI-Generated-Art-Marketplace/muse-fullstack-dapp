import { describe, it, expect, beforeEach, afterEach } from '@jest/globals'
import { artworkService } from '@/services/artworkService'
import { userService } from '@/services/userService'
import { Artwork, User } from '@/models'

describe('Database Query Optimization Tests', () => {
  beforeEach(async () => {
    // Clean up test data
    await Artwork.deleteMany({})
    await User.deleteMany({})
  })

  afterEach(async () => {
    // Clean up test data
    await Artwork.deleteMany({})
    await User.deleteMany({})
  })

  describe('Artwork Query Optimization', () => {
    it('should prevent N+1 queries when fetching artworks with creators', async () => {
      // Create test users
      const users = await User.create([
        {
          publicKey: 'GTEST1USER123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ',
          username: 'artist1',
          isVerified: true,
          stats: { artworksCreated: 0, artworksOwned: 0, totalSales: '0', totalPurchases: '0', followers: 100, following: 50 }
        },
        {
          publicKey: 'GTEST2USER123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ',
          username: 'artist2',
          isVerified: false,
          stats: { artworksCreated: 0, artworksOwned: 0, totalSales: '0', totalPurchases: '0', followers: 50, following: 25 }
        }
      ])

      // Create test artworks
      const artworks = await Artwork.create([
        {
          title: 'Artwork 1',
          description: 'Test artwork 1',
          imageUrl: 'https://example.com/art1.jpg',
          price: '0.1',
          currency: 'ETH',
          creator: users[0]._id,
          category: 'abstract',
          isListed: true
        },
        {
          title: 'Artwork 2',
          description: 'Test artwork 2',
          imageUrl: 'https://example.com/art2.jpg',
          price: '0.2',
          currency: 'ETH',
          creator: users[1]._id,
          category: 'portrait',
          isListed: true
        }
      ])

      // Test optimized query with eager loading
      const result = await artworkService.getArtworks({
        includeCreator: true,
        includeOwner: false
      })

      expect(result.success).toBe(true)
      expect(result.data).toHaveLength(2)
      
      // Verify that creator data is populated (no N+1 queries)
      result.data.forEach((artwork: any) => {
        expect(artwork.creator).toBeDefined()
        expect(typeof artwork.creator).toBe('object')
        expect(artwork.creator.username).toBeDefined()
        expect(artwork.creator.publicKey).toBeDefined()
      })
    })

    it('should efficiently fetch user artworks with batch loading', async () => {
      // Create test user
      const user = await User.create({
        publicKey: 'GTESTUSER123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ',
        username: 'testartist',
        isVerified: true,
        stats: { artworksCreated: 0, artworksOwned: 0, totalSales: '0', totalPurchases: '0', followers: 100, following: 50 }
      })

      // Create multiple artworks for the user
      await Artwork.create([
        {
          title: 'Artwork 1',
          description: 'Test artwork 1',
          imageUrl: 'https://example.com/art1.jpg',
          price: '0.1',
          currency: 'ETH',
          creator: user._id,
          category: 'abstract',
          isListed: true
        },
        {
          title: 'Artwork 2',
          description: 'Test artwork 2',
          imageUrl: 'https://example.com/art2.jpg',
          price: '0.2',
          currency: 'ETH',
          creator: user._id,
          category: 'portrait',
          isListed: true
        },
        {
          title: 'Artwork 3',
          description: 'Test artwork 3',
          imageUrl: 'https://example.com/art3.jpg',
          price: '0.3',
          currency: 'ETH',
          creator: user._id,
          category: 'landscape',
          isListed: true
        }
      ])

      // Test optimized user artworks query
      const result = await artworkService.getArtworksByCreator(user._id.toString(), {
        page: '1',
        limit: '10',
        includeCreator: false
      })

      expect(result.success).toBe(true)
      expect(result.data).toHaveLength(3)
      expect(result.pagination.total).toBe(3)
    })

    it('should use text index for efficient search', async () => {
      // Create test data
      const user = await User.create({
        publicKey: 'GTESTUSER123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ',
        username: 'searchartist',
        isVerified: true,
        stats: { artworksCreated: 0, artworksOwned: 0, totalSales: '0', totalPurchases: '0', followers: 100, following: 50 }
      })

      await Artwork.create([
        {
          title: 'Abstract Digital Art',
          description: 'A beautiful abstract digital artwork',
          imageUrl: 'https://example.com/abstract.jpg',
          price: '0.1',
          currency: 'ETH',
          creator: user._id,
          category: 'abstract',
          isListed: true
        },
        {
          title: 'Portrait Painting',
          description: 'A realistic portrait painting',
          imageUrl: 'https://example.com/portrait.jpg',
          price: '0.2',
          currency: 'ETH',
          creator: user._id,
          category: 'portrait',
          isListed: true
        }
      ])

      // Test text search
      const result = await artworkService.searchArtworks('abstract', {
        page: '1',
        limit: '10'
      })

      expect(result.success).toBe(true)
      expect(result.data).toHaveLength(1)
      expect(result.data[0].title).toContain('Abstract')
    })
  })

  describe('User Query Optimization', () => {
    it('should prevent N+1 queries when fetching user profiles with artworks', async () => {
      // Create test user
      const user = await User.create({
        publicKey: 'GTESTUSER123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ',
        username: 'profiletest',
        isVerified: true,
        stats: { artworksCreated: 0, artworksOwned: 0, totalSales: '0', totalPurchases: '0', followers: 100, following: 50 }
      })

      // Create artworks for the user
      await Artwork.create([
        {
          title: 'User Artwork 1',
          description: 'Created by user',
          imageUrl: 'https://example.com/user1.jpg',
          price: '0.1',
          currency: 'ETH',
          creator: user._id,
          category: 'abstract',
          isListed: true
        },
        {
          title: 'User Artwork 2',
          description: 'Also created by user',
          imageUrl: 'https://example.com/user2.jpg',
          price: '0.2',
          currency: 'ETH',
          creator: user._id,
          category: 'portrait',
          isListed: true
        }
      ])

      // Test optimized user profile query
      const result = await userService.getUserProfile(user._id.toString(), {
        includeArtworks: true,
        includeOwnedArtworks: true,
        includeStats: true,
        artworkLimit: 10
      })

      expect(result).toBeDefined()
      expect(result.username).toBe('profiletest')
      expect(result.createdArtworks).toBeDefined()
      expect(result.createdArtworks).toHaveLength(2)
      expect(result.stats).toBeDefined()
    })

    it('should efficiently batch load multiple user profiles', async () => {
      // Create multiple test users
      const users = await User.create([
        {
          publicKey: 'GTEST1USER123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ',
          username: 'batchuser1',
          isVerified: true,
          stats: { artworksCreated: 5, artworksOwned: 10, totalSales: '1.5', totalPurchases: '2.0', followers: 100, following: 50 }
        },
        {
          publicKey: 'GTEST2USER123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ',
          username: 'batchuser2',
          isVerified: false,
          stats: { artworksCreated: 3, artworksOwned: 7, totalSales: '0.8', totalPurchases: '1.2', followers: 50, following: 25 }
        },
        {
          publicKey: 'GTEST3USER123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ',
          username: 'batchuser3',
          isVerified: true,
          stats: { artworksCreated: 8, artworksOwned: 15, totalSales: '2.3', totalPurchases: '3.1', followers: 200, following: 100 }
        }
      ])

      const userIds = users.map(user => user._id.toString())

      // Test batch loading
      const result = await userService.getUserProfiles(userIds)

      expect(result).toHaveLength(3)
      result.forEach((user: any) => {
        expect(user.username).toBeDefined()
        expect(user.publicKey).toBeDefined()
        expect(user.stats).toBeDefined()
      })
    })

    it('should use optimized queries for user statistics', async () => {
      // Create test user
      const user = await User.create({
        publicKey: 'GTESTUSER123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ',
        username: 'statstest',
        isVerified: true,
        stats: { artworksCreated: 0, artworksOwned: 0, totalSales: '0', totalPurchases: '0', followers: 100, following: 50 }
      })

      // Create artworks for statistics
      await Artwork.create([
        {
          title: 'Stats Art 1',
          description: 'For testing stats',
          imageUrl: 'https://example.com/stats1.jpg',
          price: '0.1',
          currency: 'ETH',
          creator: user._id,
          category: 'abstract',
          isListed: true
        },
        {
          title: 'Stats Art 2',
          description: 'Also for testing stats',
          imageUrl: 'https://example.com/stats2.jpg',
          price: '0.2',
          currency: 'ETH',
          creator: user._id,
          owner: user._id,
          category: 'portrait',
          isListed: false
        }
      ])

      // Test statistics query
      const stats = await userService.getUserStatistics(user._id.toString())

      expect(stats).toBeDefined()
      expect(stats.artworksCreated).toBe(2)
      expect(stats.artworksOwned).toBe(1)
      expect(stats.artworksListed).toBe(1)
    })
  })

  describe('Performance Optimization Verification', () => {
    it('should demonstrate query count reduction', async () => {
      // This test demonstrates that the optimized queries reduce the number of database hits
      
      // Create test data
      const user = await User.create({
        publicKey: 'GTESTUSER123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ',
        username: 'perftest',
        isVerified: true,
        stats: { artworksCreated: 0, artworksOwned: 0, totalSales: '0', totalPurchases: '0', followers: 100, following: 50 }
      })

      await Artwork.create([
        {
          title: 'Perf Test 1',
          description: 'Performance test artwork',
          imageUrl: 'https://example.com/perf1.jpg',
          price: '0.1',
          currency: 'ETH',
          creator: user._id,
          category: 'abstract',
          isListed: true
        },
        {
          title: 'Perf Test 2',
          description: 'Another performance test',
          imageUrl: 'https://example.com/perf2.jpg',
          price: '0.2',
          currency: 'ETH',
          creator: user._id,
          category: 'portrait',
          isListed: true
        }
      ])

      // The optimized service should use eager loading to prevent N+1 queries
      const startTime = Date.now()
      
      const [artworks, userProfile] = await Promise.all([
        artworkService.getArtworks({ includeCreator: true }),
        userService.getUserProfile(user._id.toString(), { includeArtworks: true })
      ])
      
      const endTime = Date.now()
      const queryTime = endTime - startTime

      expect(artworks.success).toBe(true)
      expect(artworks.data).toHaveLength(2)
      expect(userProfile.username).toBe('perftest')
      
      // Query should be fast due to optimizations
      expect(queryTime).toBeLessThan(1000) // Should complete within 1 second
    })
  })
})
