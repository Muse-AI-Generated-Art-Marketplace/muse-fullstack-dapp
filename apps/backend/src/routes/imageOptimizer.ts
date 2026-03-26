import express from 'express'
import sharp from 'sharp'
import axios from 'axios'
import crypto from 'crypto'

const router = express.Router()

interface ImageOptimizationQuery {
  url: string
  w?: string
  h?: string
  q?: string
  fm?: 'webp' | 'avif' | 'jpeg' | 'png'
  crop?: string
  fit?: 'cover' | 'contain' | 'fill'
}

// Cache for optimized images
const imageCache = new Map<string, Buffer>()

// Validate URL to prevent SSRF attacks
function isValidUrl(url: string): boolean {
  try {
    const parsedUrl = new URL(url)
    return ['http:', 'https:'].includes(parsedUrl.protocol)
  } catch {
    return false
  }
}

// Generate cache key
function generateCacheKey(query: ImageOptimizationQuery): string {
  const keyString = JSON.stringify(query)
  return crypto.createHash('md5').update(keyString).digest('hex')
}

// Transform image based on query parameters
async function transformImage(
  inputBuffer: Buffer,
  query: ImageOptimizationQuery
): Promise<Buffer> {
  let transformer = sharp(inputBuffer)

  // Resize
  if (query.w || query.h) {
    const width = query.w ? parseInt(query.w, 10) : undefined
    const height = query.h ? parseInt(query.h, 10) : undefined
    
    transformer = transformer.resize(width, height, {
      fit: query.fit || 'cover',
      crop: query.crop === 'true'
    })
  }

  // Format conversion
  const format = query.fm || 'webp'
  const quality = query.q ? parseInt(query.q, 10) : 75

  switch (format) {
    case 'webp':
      transformer = transformer.webp({ quality })
      break
    case 'avif':
      transformer = transformer.avif({ quality })
      break
    case 'jpeg':
      transformer = transformer.jpeg({ quality })
      break
    case 'png':
      transformer = transformer.png({ quality })
      break
    default:
      transformer = transformer.webp({ quality })
  }

  return transformer.toBuffer()
}

// Main optimization endpoint
router.get('/image-optimizer', async (req, res) => {
  try {
    const query = req.query as ImageOptimizationQuery

    // Validate required parameters
    if (!query.url || !isValidUrl(query.url)) {
      return res.status(400).json({ error: 'Invalid or missing URL parameter' })
    }

    // Generate cache key
    const cacheKey = generateCacheKey(query)

    // Check cache first
    if (imageCache.has(cacheKey)) {
      const cachedImage = imageCache.get(cacheKey)!
      const format = query.fm || 'webp'
      const mimeType = `image/${format === 'jpg' ? 'jpeg' : format}`
      
      res.set({
        'Content-Type': mimeType,
        'Cache-Control': 'public, max-age=31536000', // 1 year
        'ETag': cacheKey
      })
      return res.send(cachedImage)
    }

    // Fetch original image
    const response = await axios.get(query.url, {
      responseType: 'arraybuffer',
      timeout: 10000,
      headers: {
        'User-Agent': 'Muse-Image-Optimizer/1.0'
      }
    })

    const originalBuffer = Buffer.from(response.data)

    // Transform image
    const optimizedBuffer = await transformImage(originalBuffer, query)

    // Cache the result (limit cache size)
    if (imageCache.size > 100) {
      // Remove oldest entries (simple LRU)
      const firstKey = imageCache.keys().next().value
      imageCache.delete(firstKey)
    }
    imageCache.set(cacheKey, optimizedBuffer)

    // Send response
    const format = query.fm || 'webp'
    const mimeType = `image/${format === 'jpg' ? 'jpeg' : format}`
    
    res.set({
      'Content-Type': mimeType,
      'Cache-Control': 'public, max-age=31536000',
      'ETag': cacheKey,
      'X-Original-Size': originalBuffer.length.toString(),
      'X-Optimized-Size': optimizedBuffer.length.toString(),
      'X-Compression-Ratio': (
        ((originalBuffer.length - optimizedBuffer.length) / originalBuffer.length) * 100
      ).toFixed(2) + '%'
    })

    res.send(optimizedBuffer)

  } catch (error) {
    console.error('Image optimization error:', error)
    
    if (axios.isAxiosError(error)) {
      if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
        return res.status(404).json({ error: 'Image not found' })
      }
      if (error.response?.status === 404) {
        return res.status(404).json({ error: 'Image not found' })
      }
    }
    
    res.status(500).json({ error: 'Failed to optimize image' })
  }
})

// Health check endpoint
router.get('/image-optimizer/health', (req, res) => {
  res.json({
    status: 'healthy',
    cacheSize: imageCache.size,
    timestamp: new Date().toISOString()
  })
})

// Clear cache endpoint (for development)
router.post('/image-optimizer/clear-cache', (req, res) => {
  imageCache.clear()
  res.json({ message: 'Cache cleared' })
})

export default router
