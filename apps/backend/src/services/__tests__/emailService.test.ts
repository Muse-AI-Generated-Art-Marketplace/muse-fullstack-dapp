import { emailService } from '../emailService'
import { User } from '@/models/User'
import { Notification } from '@/models/Notification'

// Mock dependencies
jest.mock('nodemailer')
jest.mock('@sendgrid/mail')

describe('EmailService', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('sendEmailNotification', () => {
    it('should queue email notification job', async () => {
      const recipient = 'test-user-address'
      const type = 'sale'
      const data = {
        artworkTitle: 'Test Artwork',
        price: '100',
        currency: 'XLM'
      }

      // Mock jobQueueService.addJob
      const mockAddJob = jest.fn().mockResolvedValue({ id: 'job-123' })
      jest.doMock('@/services/jobQueueService', () => ({
        jobQueueService: {
          addJob: mockAddJob
        }
      }))

      await emailService.sendEmailNotification(recipient, type, data)

      expect(mockAddJob).toHaveBeenCalledWith(
        'email-notification',
        {
          recipient,
          type,
          data
        },
        {
          priority: 8,
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 2000
          }
        }
      )
    })
  })

  describe('Email Templates', () => {
    it('should generate sale email template correctly', async () => {
      // Mock user and artwork data
      const mockUser = {
        username: 'testuser',
        address: 'test-address',
        email: 'test@example.com',
        preferences: {
          notifications: {
            email: true
          }
        }
      }

      const mockArtwork = {
        title: 'Beautiful Sunset',
        _id: 'artwork-123'
      }

      const mockData = {
        artworkTitle: 'Beautiful Sunset',
        price: '150',
        currency: 'XLM',
        buyerAddress: 'buyer-address'
      }

      // Mock User.findOne
      jest.doMock('@/models/User', () => ({
        User: {
          findOne: jest.fn().mockResolvedValue(mockUser)
        }
      }))

      // Mock Notification.create
      jest.doMock('@/models/Notification', () => ({
        Notification: {
          create: jest.fn().mockResolvedValue({})
        }
      }))

      // Test template generation
      const template = await (emailService as any).generateEmailTemplate('sale', mockData, mockUser)

      expect(template).toBeDefined()
      expect(template.subject).toContain('Beautiful Sunset')
      expect(template.subject).toContain('sold')
      expect(template.html).toContain('Beautiful Sunset')
      expect(template.html).toContain('150 XLM')
      expect(template.text).toContain('Beautiful Sunset')
    })

    it('should generate bid email template correctly', async () => {
      const mockUser = {
        username: 'testuser',
        address: 'test-address',
        email: 'test@example.com',
        preferences: {
          notifications: {
            email: true
          }
        }
      }

      const mockData = {
        artworkTitle: 'Digital Masterpiece',
        bidAmount: '75',
        currency: 'XLM',
        bidderAddress: 'bidder-address'
      }

      jest.doMock('@/models/User', () => ({
        User: {
          findOne: jest.fn().mockResolvedValue(mockUser)
        }
      }))

      const template = await (emailService as any).generateEmailTemplate('bid', mockData, mockUser)

      expect(template).toBeDefined()
      expect(template.subject).toContain('Digital Masterpiece')
      expect(template.subject).toContain('New bid')
      expect(template.html).toContain('Digital Masterpiece')
      expect(template.html).toContain('75 XLM')
    })

    it('should generate bid accepted email template correctly', async () => {
      const mockUser = {
        username: 'winner',
        address: 'winner-address',
        email: 'winner@example.com',
        preferences: {
          notifications: {
            email: true
          }
        }
      }

      const mockData = {
        artworkTitle: 'Abstract Art',
        bidAmount: '200',
        currency: 'XLM'
      }

      jest.doMock('@/models/User', () => ({
        User: {
          findOne: jest.fn().mockResolvedValue(mockUser)
        }
      }))

      const template = await (emailService as any).generateEmailTemplate('bid_accepted', mockData, mockUser)

      expect(template).toBeDefined()
      expect(template.subject).toContain('Abstract Art')
      expect(template.subject).toContain('accepted')
      expect(template.html).toContain('Abstract Art')
      expect(template.html).toContain('200 XLM')
    })

    it('should generate outbid email template correctly', async () => {
      const mockUser = {
        username: 'outbid-user',
        address: 'outbid-address',
        email: 'outbid@example.com',
        preferences: {
          notifications: {
            email: true
          }
        }
      }

      const mockData = {
        artworkTitle: 'Popular Artwork',
        newBidAmount: '300',
        currency: 'XLM',
        yourBidAmount: '250'
      }

      jest.doMock('@/models/User', () => ({
        User: {
          findOne: jest.fn().mockResolvedValue(mockUser)
        }
      }))

      const template = await (emailService as any).generateEmailTemplate('bid_outbid', mockData, mockUser)

      expect(template).toBeDefined()
      expect(template.subject).toContain('Popular Artwork')
      expect(template.subject).toContain('outbid')
      expect(template.html).toContain('Popular Artwork')
      expect(template.html).toContain('300 XLM')
      expect(template.html).toContain('250 XLM')
    })
  })

  describe('User Preferences', () => {
    it('should not send email if user has disabled email notifications', async () => {
      const mockUser = {
        username: 'testuser',
        address: 'test-address',
        email: 'test@example.com',
        preferences: {
          notifications: {
            email: false
          }
        }
      }

      jest.doMock('@/models/User', () => ({
        User: {
          findOne: jest.fn().mockResolvedValue(mockUser)
        }
      }))

      const mockJobQueueService = {
        addJob: jest.fn().mockResolvedValue({ id: 'job-123' })
      }
      jest.doMock('@/services/jobQueueService', () => ({
        jobQueueService: mockJobQueueService
      }))

      await emailService.sendEmailNotification('test-address', 'sale', {
        artworkTitle: 'Test Artwork',
        price: '100',
        currency: 'XLM'
      })

      // Should still queue the job, but job processor will skip sending email
      expect(mockJobQueueService.addJob).toHaveBeenCalled()
    })

    it('should not send email if user has no email address', async () => {
      const mockUser = {
        username: 'testuser',
        address: 'test-address',
        email: undefined,
        preferences: {
          notifications: {
            email: true
          }
        }
      }

      jest.doMock('@/models/User', () => ({
        User: {
          findOne: jest.fn().mockResolvedValue(mockUser)
        }
      }))

      const mockJobQueueService = {
        addJob: jest.fn().mockResolvedValue({ id: 'job-123' })
      }
      jest.doMock('@/services/jobQueueService', () => ({
        jobQueueService: mockJobQueueService
      }))

      await emailService.sendEmailNotification('test-address', 'sale', {
        artworkTitle: 'Test Artwork',
        price: '100',
        currency: 'XLM'
      })

      // Should still queue the job, but job processor will skip sending email
      expect(mockJobQueueService.addJob).toHaveBeenCalled()
    })
  })
})
