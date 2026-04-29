import type { Artwork, ArtworksFilters } from '../services/artworkService'

export const MOCK_ARTWORKS: Artwork[] = [
  {
    id: '1',
    title: 'Neon Dreamscape',
    description:
      'A surreal neon-lit cityscape where bioluminescent plants intertwine with futuristic architecture, reflecting off rain-soaked streets.',
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
    description:
      'An ethereal flower arrangement floating in outer space, with petals made of stardust and stems of pure light.',
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
    description:
      'A warrior from a parallel digital dimension, clad in glitching armor that shifts between reality and code.',
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
    description:
      'Abstract visualization of human emotions as flowing liquid metals in a void — gold for joy, silver for peace, copper for passion.',
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
    description:
      'A temple where ancient stone architecture merges seamlessly with holographic technology and floating geometric shapes.',
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
    description:
      'A majestic wolf howling at a crystalline moon, its fur dissolving into prismatic light fragments.',
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
    description:
      'A garden where every plant is a piece of living technology — circuit-board leaves, LED petals, and fiber-optic roots.',
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
    description:
      'Infinite recursive geometric patterns that seem to breathe and pulse, rendered in deep indigo and electric gold.',
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
    description:
      'Where the sea meets the cosmos — an ocean surface reflecting not the sky but an entire galaxy, with waves of nebula dust.',
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
    description:
      "A human figure mid-transformation into a flock of origami birds, each carrying a fragment of the person's memories.",
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
    description:
      'A portrait where the subject exists in multiple states simultaneously — each expression a different probability captured in paint.',
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
    description:
      'A wilderness landscape where everything — trees, rivers, mountains — is crafted from reflective chrome, mirroring a sunset sky.',
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

/**
 * Mirrors the Express backend's filter + sort logic.
 * Uses the exact ArtworksFilters shape from artworkService:
 *   { category?, priceRange?, sortBy? }
 */
export function getFilteredMockArtworks(filters: ArtworksFilters): Artwork[] {
  let result = [...MOCK_ARTWORKS]

  if (filters.category && filters.category !== 'all') {
    result = result.filter((a) => a.category === filters.category)
  }

  if (filters.priceRange) {
    const [min, max] = filters.priceRange.split('-').map(Number)
    result = result.filter((a) => {
      const p = parseFloat(a.price)
      return max ? p >= min && p <= max : p >= min
    })
  }

  // artworkService passes filters directly as URLSearchParams, the backend
  // reads `sortBy` — so we use the same key here.
  switch (filters.sortBy) {
    case 'popular':
      result.sort((a, b) => (b.likes ?? 0) - (a.likes ?? 0))
      break
    case 'trending':
      result.sort((a, b) => (b.views ?? 0) - (a.views ?? 0))
      break
    case 'price-low':
      result.sort((a, b) => parseFloat(a.price) - parseFloat(b.price))
      break
    case 'price-high':
      result.sort((a, b) => parseFloat(b.price) - parseFloat(a.price))
      break
    default: // 'recent' or undefined
      result.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      )
  }

  return result
}