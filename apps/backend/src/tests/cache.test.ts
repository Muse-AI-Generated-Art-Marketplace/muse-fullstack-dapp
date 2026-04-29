import cacheService from '@/services/cacheService'
import { invalidateCache } from '@/middleware/cache'
import { invalidateArtworkCache, invalidateUserCache } from '@/middleware/cacheMiddleware'
import { Request, Response, NextFunction } from 'express'

// Mock cacheService
jest.mock('@/services/cacheService', () => ({
  get: jest.fn(),
  set: jest.fn(),
  del: jest.fn(),
  delPattern: jest.fn(),
  flush: jest.fn(),
  getOrSet: jest.fn(),
  getCacheStats: jest.fn(() => ({ useRedis: false, fallbackKeys: 0, fallbackStats: {} })),
  disconnect: jest.fn(),
}))

const mockCache = cacheService as jest.Mocked<typeof cacheService>

function makeRes(statusCode = 200) {
  const res: Partial<Response> = {
    statusCode,
    json: jest.fn().mockReturnThis(),
  }
  return res as Response
}

function makeReq(params: Record<string, string> = {}) {
  return { params, method: 'POST' } as unknown as Request
}

describe('invalidateCache middleware (cache.ts)', () => {
  beforeEach(() => jest.clearAllMocks())

  it('calls delPattern for each pattern on successful JSON response', async () => {
    mockCache.delPattern.mockResolvedValue(true)

    const req = makeReq()
    const res = makeRes(200)
    const next: NextFunction = jest.fn()

    const middleware = invalidateCache(['artworks:list:*', 'artwork:detail:*'])
    await middleware(req, res, next)

    expect(next).toHaveBeenCalled()

    // Trigger the intercepted res.json
    await res.json({ success: true })

    expect(mockCache.delPattern).toHaveBeenCalledWith('artworks:list:*')
    expect(mockCache.delPattern).toHaveBeenCalledWith('artwork:detail:*')
  })

  it('does NOT call delPattern on error response', async () => {
    const req = makeReq()
    const res = makeRes(400)
    const next: NextFunction = jest.fn()

    const middleware = invalidateCache(['artworks:list:*'])
    await middleware(req, res, next)
    await res.json({ error: 'bad request' })

    expect(mockCache.delPattern).not.toHaveBeenCalled()
  })
})

describe('invalidateArtworkCache', () => {
  beforeEach(() => jest.clearAllMocks())

  it('invalidates specific artwork keys when artworkId provided', async () => {
    mockCache.del.mockResolvedValue(true)
    mockCache.delPattern.mockResolvedValue(true)

    await invalidateArtworkCache('abc123')

    expect(mockCache.del).toHaveBeenCalledWith('artwork:detail:abc123')
    expect(mockCache.del).toHaveBeenCalledWith('metadata:abc123')
    expect(mockCache.delPattern).toHaveBeenCalledWith('artworks:list:*')
  })

  it('invalidates all artwork keys when no artworkId provided', async () => {
    mockCache.delPattern.mockResolvedValue(true)

    await invalidateArtworkCache()

    expect(mockCache.delPattern).toHaveBeenCalledWith('artwork:detail:*')
    expect(mockCache.delPattern).toHaveBeenCalledWith('artworks:list:*')
    expect(mockCache.delPattern).toHaveBeenCalledWith('metadata:*')
  })
})

describe('invalidateUserCache', () => {
  beforeEach(() => jest.clearAllMocks())

  it('invalidates profile, stats, and activity keys for a user', async () => {
    mockCache.del.mockResolvedValue(true)
    mockCache.delPattern.mockResolvedValue(true)

    await invalidateUserCache('GADDR123')

    expect(mockCache.del).toHaveBeenCalledWith('user:profile:GADDR123')
    expect(mockCache.del).toHaveBeenCalledWith('user:stats:GADDR123')
    expect(mockCache.delPattern).toHaveBeenCalledWith('user:activity:GADDR123:*')
  })
})

describe('getUserStats caching via cacheService.getOrSet', () => {
  beforeEach(() => jest.clearAllMocks())

  it('uses getOrSet with user:stats key and 300s TTL', async () => {
    // Import controller after mocks are set up
    const { getUserStats } = await import('@/controllers/userController')

    const fetched = {
      created: 5, collected: 3, favorites: 10,
      followers: 100, following: 50,
      totalSales: '500', totalPurchases: '200',
    }
    mockCache.getOrSet.mockImplementation(async (key, fetcher, ttl) => fetched)

    const req = { params: { address: 'GADDR123' }, requestId: 'test' } as unknown as Request
    const res = makeRes(200)
    const next: NextFunction = jest.fn()

    await getUserStats(req, res, next)

    expect(mockCache.getOrSet).toHaveBeenCalledWith(
      'user:stats:GADDR123',
      expect.any(Function),
      300,
    )
    expect(res.json).toHaveBeenCalledWith({ success: true, data: fetched })
    expect(next).not.toHaveBeenCalled()
  })

  it('calls next with 404 when getOrSet returns null (user not found)', async () => {
    const { getUserStats } = await import('@/controllers/userController')

    mockCache.getOrSet.mockResolvedValue(null)

    const req = { params: { address: 'UNKNOWN' }, requestId: 'test' } as unknown as Request
    const res = makeRes(200)
    const next: NextFunction = jest.fn()

    await getUserStats(req, res, next)

    expect(next).toHaveBeenCalledWith(expect.objectContaining({ status: 404 }))
  })
})
