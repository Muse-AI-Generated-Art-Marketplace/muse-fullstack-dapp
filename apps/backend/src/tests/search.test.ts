import request from 'supertest'
import { app } from '@/index'
import { Artwork } from '@/models/Artwork'
import { User } from '@/models/User'

// Mock MongoDB responses
jest.mock('@/models/Artwork')
jest.mock('@/models/User')

const mockArtwork = {
  _id: 'artwork123',
  title: 'Sunset Painting',
  description: 'A beautiful sunset over the ocean',
  imageUrl: 'https://example.com/sunset.jpg',
  price: '100',
  currency: 'XLM',
  creator: 'user123',
  owner: 'user123',
  category: 'painting',
  isListed: true,
  createdAt: new Date('2024-01-15'),
  updatedAt: new Date('2024-01-15'),
  toObject: jest.fn().mockReturnValue({
    _id: 'artwork123',
    title: 'Sunset Painting',
    description: 'A beautiful sunset over the ocean',
    imageUrl: 'https://example.com/sunset.jpg',
    price: '100',
    currency: 'XLM',
    creator: 'user123',
    owner: 'user123',
    category: 'painting',
    isListed: true,
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-15'),
    relevanceScore: 0.95
  })
}

const mockUser = {
  _id: 'user123',
  address: '0x1234567890123456789012345678901234567890',
  username: 'johndoe',
  email: 'john@example.com',
  bio: 'Digital artist and creator',
  profileImage: 'https://example.com/avatar.jpg',
  tier: 'free',
  isVerified: false,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  toObject: jest.fn().mockReturnValue({
    _id: 'user123',
    address: '0x1234567890123456789012345678901234567890',
    username: 'johndoe',
    email: 'john@example.com',
    bio: 'Digital artist and creator',
    profileImage: 'https://example.com/avatar.jpg',
    tier: 'free',
    isVerified: false,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    relevanceScore: 0.88
  })
}

describe('Search API', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GET /api/search/artworks', () => {
    test('GET /api/search/artworks?q=sunset returns matches', async () => {
      const mockFind = Artwork.find as jest.MockedFunction<typeof Artwork.find>
      const mockCount = Artwork.countDocuments as jest.MockedFunction<typeof Artwork.countDocuments>
      
      const mockQuery = {
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        populate: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([mockArtwork])
      }
      
      mockFind.mockReturnValue(mockQuery as any)
      mockCount.mockResolvedValue(1)

      const res = await request(app)
        .get('/api/search/artworks?q=sunset')

      expect(res.status).toBe(200)
      expect(res.body.success).toBe(true)
      expect(res.body.data.length).toBeGreaterThan(0)
      expect(res.body.data[0].title).toBe('Sunset Painting')
      expect(res.body.pagination.total).toBe(1)
    })

    test('Search artworks with filters correctly narrows results', async () => {
      const mockFind = Artwork.find as jest.MockedFunction<typeof Artwork.find>
      const mockCount = Artwork.countDocuments as jest.MockedFunction<typeof Artwork.countDocuments>
      
      const mockQuery = {
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        populate: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([mockArtwork])
      }
      
      mockFind.mockReturnValue(mockQuery as any)
      mockCount.mockResolvedValue(1)

      const res = await request(app)
        .get('/api/search/artworks?q=painting&category=painting&priceMax=500')

      expect(res.status).toBe(200)
      expect(res.body.success).toBe(true)
      expect(Artwork.find).toHaveBeenCalledWith(
        expect.objectContaining({
          $text: { $search: 'painting' },
          category: 'painting',
          price: { $lte: '500' }
        })
      )
    })

    test('Sorting changes result order', async () => {
      const mockFind = Artwork.find as jest.MockedFunction<typeof Artwork.find>
      const mockCount = Artwork.countDocuments as jest.MockedFunction<typeof Artwork.countDocuments>
      
      const mockQuery = {
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        populate: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([mockArtwork])
      }
      
      mockFind.mockReturnValue(mockQuery as any)
      mockCount.mockResolvedValue(1)

      await request(app)
        .get('/api/search/artworks?sort=price_asc')

      expect(mockQuery.sort).toHaveBeenCalledWith({ price: 1 })
    })

    test('Pagination returns correct page', async () => {
      const mockFind = Artwork.find as jest.MockedFunction<typeof Artwork.find>
      const mockCount = Artwork.countDocuments as jest.MockedFunction<typeof Artwork.countDocuments>
      
      const mockQuery = {
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        populate: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([mockArtwork])
      }
      
      mockFind.mockReturnValue(mockQuery as any)
      mockCount.mockResolvedValue(50)

      const res = await request(app)
        .get('/api/search/artworks?page=2&limit=10')

      expect(res.status).toBe(200)
      expect(res.body.pagination.page).toBe(2)
      expect(res.body.pagination.limit).toBe(10)
      expect(res.body.pagination.totalPages).toBe(5)
      expect(mockQuery.skip).toHaveBeenCalledWith(10) // (page-1) * limit
    })

    test('Empty query returns all results', async () => {
      const mockFind = Artwork.find as jest.MockedFunction<typeof Artwork.find>
      const mockCount = Artwork.countDocuments as jest.MockedFunction<typeof Artwork.countDocuments>
      
      const mockQuery = {
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        populate: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([mockArtwork])
      }
      
      mockFind.mockReturnValue(mockQuery as any)
      mockCount.mockResolvedValue(1)

      const res = await request(app)
        .get('/api/search/artworks')

      expect(res.status).toBe(200)
      expect(res.body.success).toBe(true)
      expect(Artwork.find).toHaveBeenCalledWith({})
    })

    test('Invalid filter returns 400', async () => {
      const res = await request(app)
        .get('/api/search/artworks?priceMin=-100')

      expect(res.status).toBe(400)
      expect(res.body.success).toBe(false)
      expect(res.body.error).toContain('priceMin must be a non-negative number')
    })

    test('Invalid sort returns 400', async () => {
      const res = await request(app)
        .get('/api/search/artworks?sort=invalid_sort')

      expect(res.status).toBe(400)
      expect(res.body.success).toBe(false)
      expect(res.body.error).toContain('Invalid sort option')
    })

    test('Invalid page returns 400', async () => {
      const res = await request(app)
        .get('/api/search/artworks?page=0')

      expect(res.status).toBe(400)
      expect(res.body.success).toBe(false)
      expect(res.body.error).toContain('Page must be a positive integer')
    })

    test('Invalid limit returns 400', async () => {
      const res = await request(app)
        .get('/api/search/artworks?limit=101')

      expect(res.status).toBe(400)
      expect(res.body.success).toBe(false)
      expect(res.body.error).toContain('Limit must be between 1 and 100')
    })
  })

  describe('GET /api/search/users', () => {
    test('Search users by username works', async () => {
      const mockFind = User.find as jest.MockedFunction<typeof User.find>
      const mockCount = User.countDocuments as jest.MockedFunction<typeof User.countDocuments>
      
      const mockQuery = {
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([mockUser])
      }
      
      mockFind.mockReturnValue(mockQuery as any)
      mockCount.mockResolvedValue(1)

      const res = await request(app)
        .get('/api/search/users?q=john')

      expect(res.status).toBe(200)
      expect(res.body.success).toBe(true)
      expect(res.body.data.length).toBeGreaterThan(0)
      expect(res.body.data[0].username).toBe('johndoe')
      expect(res.body.pagination.total).toBe(1)
    })

    test('Search users with filters correctly narrows results', async () => {
      const mockFind = User.find as jest.MockedFunction<typeof User.find>
      const mockCount = User.countDocuments as jest.MockedFunction<typeof User.countDocuments>
      const mockDistinct = Artwork.distinct as jest.MockedFunction<typeof Artwork.distinct>
      
      const mockQuery = {
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([mockUser])
      }
      
      mockFind.mockReturnValue(mockQuery as any)
      mockCount.mockResolvedValue(1)
      mockDistinct.mockResolvedValue(['user123'])

      const res = await request(app)
        .get('/api/search/users?role=free&hasListings=true')

      expect(res.status).toBe(200)
      expect(res.body.success).toBe(true)
      expect(User.find).toHaveBeenCalledWith(
        expect.objectContaining({
          tier: 'free',
          address: { $in: ['user123'] }
        })
      )
    })

    test('Search users with date filters works', async () => {
      const mockFind = User.find as jest.MockedFunction<typeof User.find>
      const mockCount = User.countDocuments as jest.MockedFunction<typeof User.countDocuments>
      
      const mockQuery = {
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([mockUser])
      }
      
      mockFind.mockReturnValue(mockQuery as any)
      mockCount.mockResolvedValue(1)

      const res = await request(app)
        .get('/api/search/users?joinedAfter=2024-01-01&joinedBefore=2024-12-31')

      expect(res.status).toBe(200)
      expect(res.body.success).toBe(true)
      expect(User.find).toHaveBeenCalledWith(
        expect.objectContaining({
          createdAt: {
            $gte: new Date('2024-01-01'),
            $lte: new Date('2024-12-31')
          }
        })
      )
    })

    test('Invalid role filter returns 400', async () => {
      const res = await request(app)
        .get('/api/search/users?role=invalid_role')

      expect(res.status).toBe(400)
      expect(res.body.success).toBe(false)
      expect(res.body.error).toContain('Role must be one of: free, pro, premium')
    })

    test('Invalid hasListings filter returns 400', async () => {
      const res = await request(app)
        .get('/api/search/users?hasListings=maybe')

      expect(res.status).toBe(400)
      expect(res.body.success).toBe(false)
      expect(res.body.error).toContain('hasListings must be true or false')
    })

    test('Invalid date filter returns 400', async () => {
      const res = await request(app)
        .get('/api/search/users?joinedAfter=invalid_date')

      expect(res.status).toBe(400)
      expect(res.body.success).toBe(false)
      expect(res.body.error).toContain('joinedAfter must be a valid date')
    })
  })

  describe('Error handling', () => {
    test('Database error returns 500', async () => {
      const mockFind = Artwork.find as jest.MockedFunction<typeof Artwork.find>
      
      const mockQuery = {
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        populate: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        exec: jest.fn().mockRejectedValue(new Error('Database connection failed'))
      }
      
      mockFind.mockReturnValue(mockQuery as any)

      const res = await request(app)
        .get('/api/search/artworks?q=test')

      expect(res.status).toBe(500)
      expect(res.body.success).toBe(false)
      expect(res.body.error).toBe('Internal server error')
    })
  })
})
