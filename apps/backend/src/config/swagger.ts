import swaggerJsdoc from 'swagger-jsdoc'
import swaggerUi from 'swagger-ui-express'
import { Express } from 'express'
import { createLogger } from '@/utils/logger'

const logger = createLogger('Swagger')

const swaggerOptions: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Muse API',
      version: '1.0.0',
      description: 'AI Art Marketplace API on Stellar blockchain'
    },
    servers: [
      { url: 'http://localhost:3001/api', description: 'Development' },
      { url: 'https://api.muse.art/api', description: 'Production' }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      },
      schemas: {
        Artwork: {
          type: 'object',
          properties: {
            id: { type: 'string', example: '507f1f77bcf86cd799439011' },
            title: { type: 'string', example: 'Cosmic Dreams' },
            description: { type: 'string', example: 'A surrealist exploration' },
            imageUrl: { type: 'string', example: 'https://cdn.muse.art/artworks/cosmic-dreams.png' },
            creator: { type: 'string', example: 'GDAT5H2I...' },
            style: { type: 'string', enum: ['digital-art', 'abstract', 'realistic'], example: 'digital-art' },
            prompt: { type: 'string', example: 'A dreamlike cosmic landscape' },
            price: { type: 'number', example: 100.50 },
            status: { type: 'string', enum: ['draft', 'active', 'sold', 'archived'], example: 'active' },
            createdAt: { type: 'string', format: 'date-time' }
          },
          required: ['title', 'creator', 'imageUrl', 'prompt']
        },
        User: {
          type: 'object',
          properties: {
            id: { type: 'string', example: '507f1f77bcf86cd799439011' },
            walletAddress: { type: 'string', example: 'GDAT5H2I...' },
            displayName: { type: 'string', example: 'CryptoArtist' },
            bio: { type: 'string', example: 'Digital artist exploring AI' },
            avatar: { type: 'string', example: 'https://cdn.muse.art/avatars/user123.png' },
            createdAt: { type: 'string', format: 'date-time' }
          },
          required: ['walletAddress', 'displayName']
        },
        Transaction: {
          type: 'object',
          properties: {
            id: { type: 'string', example: '507f1f77bcf86cd799439011' },
            artworkId: { type: 'string', example: '507f1f77bcf86cd799439012' },
            buyer: { type: 'string', example: 'GDAT5H2I...' },
            seller: { type: 'string', example: 'GABC3DEF...' },
            amount: { type: 'number', example: 100.50 },
            status: { type: 'string', enum: ['pending', 'processing', 'completed', 'failed'], example: 'completed' },
            createdAt: { type: 'string', format: 'date-time' }
          },
          required: ['artworkId', 'buyer', 'seller', 'amount']
        },
        Error: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            error: { type: 'string', example: 'Invalid request parameters' }
          }
        }
      }
    },
    tags: [
      { name: 'Auth', description: 'Authentication with Stellar wallet' },
      { name: 'Artworks', description: 'Artwork management' },
      { name: 'Users', description: 'User profiles and activity' },
      { name: 'Search', description: 'Search and discovery' },
      { name: 'AI', description: 'AI art generation' },
      { name: 'Transactions', description: 'Stellar blockchain transactions' },
      { name: 'Favorites', description: 'User favorites' },
      { name: 'Notifications', description: 'User notifications' },
      { name: 'Metadata', description: 'SEO and social metadata' },
      { name: 'Health', description: 'Service health monitoring' }
    ]
  },
  apis: ['./src/routes/**/*.ts', './src/index.ts']
}

export const swaggerSpec = swaggerJsdoc(swaggerOptions)

export function setupSwagger(app: Express): void {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
    explorer: true,
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'Muse API Documentation'
  }))

  app.get('/api-docs.json', (_req: any, res: any) => {
    res.setHeader('Content-Type', 'application/json')
    res.send(swaggerSpec)
  })

  logger.info('Swagger documentation available at /api-docs')
}

export default swaggerSpec
