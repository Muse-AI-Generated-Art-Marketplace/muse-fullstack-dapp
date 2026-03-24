import { Request, Response, NextFunction } from 'express'
import { 
  createError, 
  createValidationError, 
  createNotFoundError,
  createDatabaseError,
  createExternalServiceError 
} from '@/middleware/errorHandler'

// ─── Seed Data ────────────────────────────────────────────────────────────────
const SEED_ARTWORKS = [
  {
    id: '1',
    title: 'Neon Dreamscape',
    description: 'A surreal neon-lit cityscape where bioluminescent plants intertwine with futuristic architecture, reflecting off rain-soaked streets.',
    imageUrl: 'https://images.unsplash.com/photo-1634017839464-5c339eba3df4?w=600&q=80',
    price: '2.5',
    currency: 'XLM',
    creator: 'GCXK...R7YN',
    createdAt: '2026-03-20T14:30:00Z',
    category: 'sci-fi',
    prompt: 'Neon-lit futuristic city at night with bioluminescent plants, rain reflections, cyberpunk aesthetic',
    aiModel: 'Stable Diffusion XL',
    likes: 342,
    views: 1820,
  },
  {
    id: '2',
    title: 'Celestial Bloom',
    description: 'An ethereal flower arrangement floating in outer space, with petals made of stardust and stems of pure light.',
    imageUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&q=80',
    price: '1.8',
    currency: 'XLM',
    creator: 'GDHW...P3MQ',
    createdAt: '2026-03-19T09:15:00Z',
    category: 'abstract',
    prompt: 'Cosmic flowers floating in deep space, made of stardust and light, ethereal and luminous',
    aiModel: 'DALL·E 3',
    likes: 287,
    views: 1540,
  },
  {
    id: '3',
    title: 'Digital Samurai',
    description: 'A warrior from a parallel digital dimension, clad in glitching armor that shifts between reality and code.',
    imageUrl: 'https://images.unsplash.com/photo-1633621412777-d1c2846b18f8?w=600&q=80',
    price: '4.2',
    currency: 'XLM',
    creator: 'GBFK...N8XE',
    createdAt: '2026-03-22T16:45:00Z',
    category: 'character',
    prompt: 'Digital samurai warrior with glitching holographic armor, neon accents, cyberpunk warrior',
    aiModel: 'Midjourney v6',
    likes: 512,
    views: 2930,
  },
  {
    id: '4',
    title: 'Liquid Emotions',
    description: 'Abstract visualization of human emotions as flowing liquid metals in a void — gold for joy, silver for peace, copper for passion.',
    imageUrl: 'https://images.unsplash.com/photo-1549490349-8643362247b5?w=600&q=80',
    price: '1.2',
    currency: 'XLM',
    creator: 'GCXK...R7YN',
    createdAt: '2026-03-18T11:00:00Z',
    category: 'abstract',
    prompt: 'Flowing liquid metals representing emotions, gold silver copper, abstract macro photography style',
    aiModel: 'Stable Diffusion XL',
    likes: 198,
    views: 980,
  },
  {
    id: '5',
    title: 'Ancient Future Temple',
    description: 'A temple where ancient stone architecture merges seamlessly with holographic technology and floating geometric shapes.',
    imageUrl: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=600&q=80',
    price: '3.7',
    currency: 'XLM',
    creator: 'GRMB...V4WT',
    createdAt: '2026-03-21T08:20:00Z',
    category: 'architecture',
    prompt: 'Ancient temple with holographic technology, floating geometric shapes, stone and light fusion',
    aiModel: 'Midjourney v6',
    likes: 445,
    views: 2150,
  },
  {
    id: '6',
    title: 'Prismatic Wildlife',
    description: 'A majestic wolf howling at a crystalline moon, its fur dissolving into prismatic light fragments.',
    imageUrl: 'https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?w=600&q=80',
    price: '2.9',
    currency: 'XLM',
    creator: 'GDHW...P3MQ',
    createdAt: '2026-03-17T19:30:00Z',
    category: 'nature',
    prompt: 'Wolf howling at crystal moon, prismatic light fur, magical realism, vibrant color dispersion',
    aiModel: 'DALL·E 3',
    likes: 376,
    views: 1890,
  },
  {
    id: '7',
    title: 'Synthetic Garden',
    description: 'A garden where every plant is a piece of living technology — circuit-board leaves, LED petals, and fiber-optic roots.',
    imageUrl: 'https://images.unsplash.com/photo-1614850715649-1d0106568571?w=600&q=80',
    price: '1.5',
    currency: 'XLM',
    creator: 'GBFK...N8XE',
    createdAt: '2026-03-16T13:00:00Z',
    category: 'sci-fi',
    prompt: 'Technology garden with circuit board leaves, LED flower petals, fiber optic roots, biopunk',
    aiModel: 'Stable Diffusion XL',
    likes: 231,
    views: 1120,
  },
  {
    id: '8',
    title: 'Echoes of Geometry',
    description: 'Infinite recursive geometric patterns that seem to breathe and pulse, rendered in deep indigo and electric gold.',
    imageUrl: 'https://images.unsplash.com/photo-1558591710-4b4a1ae0f04d?w=600&q=80',
    price: '0.8',
    currency: 'XLM',
    creator: 'GRMB...V4WT',
    createdAt: '2026-03-15T07:45:00Z',
    category: 'abstract',
    prompt: 'Recursive sacred geometry, breathing patterns, deep indigo and electric gold, fractal art',
    aiModel: 'Midjourney v6',
    likes: 164,
    views: 870,
  },
  {
    id: '9',
    title: 'Ocean of Stars',
    description: 'Where the sea meets the cosmos — an ocean surface reflecting not the sky but an entire galaxy, with waves of nebula dust.',
    imageUrl: 'https://images.unsplash.com/photo-1534796636912-3b95b3ab5986?w=600&q=80',
    price: '5.0',
    currency: 'XLM',
    creator: 'GCXK...R7YN',
    createdAt: '2026-03-23T20:00:00Z',
    category: 'landscape',
    prompt: 'Ocean reflecting galaxy, nebula waves, cosmic seascape, stars and water merging',
    aiModel: 'DALL·E 3',
    likes: 623,
    views: 3410,
  },
  {
    id: '10',
    title: 'Metamorphosis',
    description: 'A human figure mid-transformation into a flock of origami birds, each carrying a fragment of the person\'s memories.',
    imageUrl: 'https://images.unsplash.com/photo-1547891654-e66ed7ebb968?w=600&q=80',
    price: '3.1',
    currency: 'XLM',
    creator: 'GDHW...P3MQ',
    createdAt: '2026-03-14T15:30:00Z',
    category: 'surreal',
    prompt: 'Human transforming into origami birds, paper fragments, surreal metamorphosis, poetic',
    aiModel: 'Midjourney v6',
    likes: 489,
    views: 2580,
  },
  {
    id: '11',
    title: 'Quantum Portrait',
    description: 'A portrait where the subject exists in multiple states simultaneously — each expression a different probability captured in paint.',
    imageUrl: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=600&q=80',
    price: '2.0',
    currency: 'XLM',
    creator: 'GBFK...N8XE',
    createdAt: '2026-03-13T10:15:00Z',
    category: 'portrait',
    prompt: 'Quantum superposition portrait, multiple overlapping expressions, painterly style, glitch art',
    aiModel: 'Stable Diffusion XL',
    likes: 305,
    views: 1670,
  },
  {
    id: '12',
    title: 'Chrome Wilderness',
    description: 'A wilderness landscape where everything — trees, rivers, mountains — is crafted from reflective chrome, mirroring a sunset sky.',
    imageUrl: 'https://images.unsplash.com/photo-1617396900799-f4ec2b43c7ae?w=600&q=80',
    price: '1.9',
    currency: 'XLM',
    creator: 'GRMB...V4WT',
    createdAt: '2026-03-12T18:00:00Z',
    category: 'landscape',
    prompt: 'Chrome reflective wilderness, metallic trees and rivers, mirror landscape reflecting sunset',
    aiModel: 'DALL·E 3',
    likes: 257,
    views: 1340,
  },
]

// ─── Platform statistics ──────────────────────────────────────────────────────
const PLATFORM_STATS = {
  totalArtworks: 12847,
  totalArtists: 3291,
  totalCollectors: 8745,
  totalVolume: '2.4M',
  volumeCurrency: 'XLM',
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function applyFilters(artworks: typeof SEED_ARTWORKS, query: any) {
  let filtered = [...artworks]
  const { category, sort, sortBy, priceRange } = query

  if (category && category !== 'all') {
    filtered = filtered.filter(a => a.category === category)
  }

  if (priceRange) {
    const [min, max] = (priceRange as string).split('-').map(Number)
    filtered = filtered.filter(a => {
      const p = parseFloat(a.price)
      if (max) return p >= min && p <= max
      return p >= min
    })
  }

  const sortKey = sort || sortBy || 'recent'
  switch (sortKey) {
    case 'popular':
      filtered.sort((a, b) => b.likes - a.likes)
      break
    case 'trending':
      filtered.sort((a, b) => b.views - a.views)
      break
    case 'price-low':
      filtered.sort((a, b) => parseFloat(a.price) - parseFloat(b.price))
      break
    case 'price-high':
      filtered.sort((a, b) => parseFloat(b.price) - parseFloat(a.price))
      break
    case 'recent':
    default:
      filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      break
  }

  return filtered
}

// ─── Controllers ──────────────────────────────────────────────────────────────

export const getArtworks = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page = '1', limit = '20', category, sort, sortBy, priceRange } = req.query
    
    const pageNum = parseInt(page as string)
    const limitNum = parseInt(limit as string)
    
    if (isNaN(pageNum) || pageNum < 1) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid page number. Must be a positive integer.',
          userMessage: 'Please enter a valid page number (1 or greater).'
        }
      })
    }
    
    if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid limit. Must be between 1 and 100.',
          userMessage: 'Please limit your results to between 1 and 100 items per page.'
        }
      })
    }

    const filtered = applyFilters(SEED_ARTWORKS, req.query)
    const start = (pageNum - 1) * limitNum
    const paged = filtered.slice(start, start + limitNum)

    res.json({
      success: true,
      data: paged,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: filtered.length,
      },
    })
  } catch (error) {
    console.error('Error in getArtworks:', error)
    
    if (error instanceof Error) {
      if (error.message.includes('database') || error.message.includes('connection')) {
        const err = createDatabaseError('Failed to fetch artworks from database')
        return next(err)
      }
      if (error.message.includes('external') || error.message.includes('api')) {
        const err = createExternalServiceError('Art service', 'Failed to fetch artwork data')
        return next(err)
      }
    }
    
    const err = createError(
      'Unable to load artworks at this time',
      500,
      'ARTWORK_FETCH_ERROR',
      { originalError: error instanceof Error ? error.message : 'Unknown error' }
    )
    next(err)
  }
}

export const getFeaturedArtworks = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    // Featured = hand-picked top-liked artworks
    const featured = [...SEED_ARTWORKS]
      .sort((a, b) => b.likes - a.likes)
      .slice(0, 6)

    res.json({
      success: true,
      data: featured,
    })
  } catch (error) {
    console.error('Error in getFeaturedArtworks:', error)
    const err = createError('Unable to load featured artworks', 500, 'FEATURED_FETCH_ERROR')
    next(err)
  }
}

export const getTrendingArtworks = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    // Trending = sorted by views in the last period
    const trending = [...SEED_ARTWORKS]
      .sort((a, b) => b.views - a.views)
      .slice(0, 8)

    res.json({
      success: true,
      data: trending,
    })
  } catch (error) {
    console.error('Error in getTrendingArtworks:', error)
    const err = createError('Unable to load trending artworks', 500, 'TRENDING_FETCH_ERROR')
    next(err)
  }
}

export const getStats = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    res.json({
      success: true,
      data: PLATFORM_STATS,
    })
  } catch (error) {
    console.error('Error in getStats:', error)
    const err = createError('Unable to load platform stats', 500, 'STATS_FETCH_ERROR')
    next(err)
  }
}

export const getArtworkById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params
    
    if (!id || id.trim() === '') {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Artwork ID is required',
          userMessage: 'Please provide a valid artwork ID.'
        }
      })
    }
    
    const artwork = SEED_ARTWORKS.find((a: any) => a.id === id)

    if (!artwork) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: `Artwork with ID ${id} not found`,
          userMessage: 'The artwork you are looking for does not exist.'
        }
      })
    }

    res.json({
      success: true,
      data: artwork,
    })
  } catch (error) {
    console.error('Error in getArtworkById:', error)
    
    const err = createError(
      'Unable to load artwork details',
      500,
      'ARTWORK_DETAILS_ERROR',
      { artworkId: req.params.id }
    )
    next(err)
  }
}

export const createArtwork = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { title, description, imageUrl, price, prompt, aiModel } = req.body
    
    const validationErrors: string[] = []
    
    if (!title || (title as string).trim() === '') {
      validationErrors.push('Title is required')
    }
    
    if (!description || (description as string).trim() === '') {
      validationErrors.push('Description is required')
    }
    
    if (!imageUrl || (imageUrl as string).trim() === '') {
      validationErrors.push('Image URL is required')
    }
    
    if (!price || (price as string).trim() === '') {
      validationErrors.push('Price is required')
    }
    
    if (price && isNaN(parseFloat(price as string))) {
      validationErrors.push('Price must be a valid number')
    }
    
    if (validationErrors.length > 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Validation failed',
          userMessage: 'Please check all required fields and try again.',
          details: { validationErrors }
        }
      })
    }
    
    const artwork = {
      id: Date.now().toString(),
      title: (title as string).trim(),
      description: (description as string).trim(),
      imageUrl: (imageUrl as string).trim(),
      price: (price as string).trim(),
      currency: 'XLM',
      creator: '0x1234...5678',
      createdAt: new Date().toISOString(),
      category: 'ai-generated',
      prompt: (prompt as string)?.trim() || '',
      aiModel: (aiModel as string)?.trim() || 'Unknown',
      likes: 0,
      views: 0,
    }

    res.status(201).json({
      success: true,
      data: artwork,
    })
  } catch (error) {
    console.error('Error in createArtwork:', error)
    
    const err = createError(
      'Unable to create artwork at this time',
      500,
      'ARTWORK_CREATION_ERROR',
      { requestBody: req.body }
    )
    next(err)
  }
}
