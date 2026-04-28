import { createLogger } from '@/utils/logger'
import { User, IUser } from '@/models/User'
import { Notification } from '@/models/Notification'
import { JobType, jobQueueService } from './jobQueueService'

const logger = createLogger('EmailService')

export interface EmailTemplate {
  subject: string
  html: string
  text?: string
}

export interface EmailData {
  to: string
  template: EmailTemplate
  metadata?: Record<string, any>
}

export interface EmailProvider {
  sendEmail(data: EmailData): Promise<boolean>
}

class SMTPProvider implements EmailProvider {
  private nodemailer: any
  private transporter: any

  constructor() {
    try {
      // Dynamic import to avoid TypeScript errors
      const nodemailerModule = eval('require')('nodemailer')
      this.nodemailer = nodemailerModule.default || nodemailerModule
    } catch (error) {
      logger.warn('Nodemailer not available, SMTP emails will be logged only')
    }
  }

  async sendEmail(data: EmailData): Promise<boolean> {
    if (!this.nodemailer) {
      logger.info('SMTP Email (mock):', { to: data.to, subject: data.template.subject })
      return true
    }

    try {
      if (!this.transporter) {
        this.transporter = this.nodemailer.createTransport({
          host: process.env.SMTP_HOST,
          port: parseInt(process.env.SMTP_PORT || '587'),
          secure: process.env.SMTP_SECURE === 'true',
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS
          }
        })
      }

      const mailOptions = {
        from: process.env.SMTP_FROM || process.env.SMTP_USER,
        to: data.to,
        subject: data.template.subject,
        html: data.template.html,
        text: data.template.text
      }

      await this.transporter.sendMail(mailOptions)
      logger.info('Email sent successfully via SMTP', { to: data.to })
      return true
    } catch (error) {
      logger.error('Failed to send email via SMTP:', error)
      return false
    }
  }
}

class SendGridProvider implements EmailProvider {
  private sendGrid: any

  constructor() {
    try {
      // Dynamic import to avoid TypeScript errors
      const sendGridModule = eval('require')('@sendgrid/mail')
      this.sendGrid = sendGridModule.default || sendGridModule
      this.sendGrid.setApiKey(process.env.SENDGRID_API_KEY)
    } catch (error) {
      logger.warn('SendGrid not available')
    }
  }

  async sendEmail(data: EmailData): Promise<boolean> {
    if (!this.sendGrid || !process.env.SENDGRID_API_KEY) {
      logger.info('SendGrid Email (mock):', { to: data.to, subject: data.template.subject })
      return true
    }

    try {
      const msg = {
        to: data.to,
        from: process.env.SENDGRID_FROM || 'noreply@muse.art',
        subject: data.template.subject,
        html: data.template.html,
        text: data.template.text
      }

      await this.sendGrid.send(msg)
      logger.info('Email sent successfully via SendGrid', { to: data.to })
      return true
    } catch (error) {
      logger.error('Failed to send email via SendGrid:', error)
      return false
    }
  }
}

class EmailService {
  private provider: EmailProvider
  private initialized = false

  constructor() {
    const provider = process.env.EMAIL_PROVIDER?.toLowerCase()
    
    switch (provider) {
      case 'sendgrid':
        this.provider = new SendGridProvider()
        break
      case 'smtp':
      default:
        this.provider = new SMTPProvider()
        break
    }
  }

  async initialize(): Promise<void> {
    if (this.initialized) return

    try {
      // Register email job processor
      await jobQueueService.processJob(JobType.EMAIL_NOTIFICATION, async (job) => {
        const { recipient, type, data } = job.data
        return await this.processEmailJob(recipient, type, data)
      })

      this.initialized = true
      logger.info('Email service initialized successfully')
    } catch (error) {
      logger.error('Failed to initialize email service:', error)
      throw error
    }
  }

  private async processEmailJob(recipient: string, type: string, data: any): Promise<{ success: boolean; error?: string }> {
    try {
      const user = await User.findOne({ address: recipient })
      if (!user || !user.email) {
        logger.warn('User not found or no email address', { recipient })
        return { success: false, error: 'User not found or no email address' }
      }

      // Check user preferences
      if (!user.preferences?.notifications?.email) {
        logger.info('User has disabled email notifications', { recipient })
        return { success: true }
      }

      const template = await this.generateEmailTemplate(type, data, user)
      if (!template) {
        return { success: false, error: 'No template available for email type' }
      }

      const emailData: EmailData = {
        to: user.email,
        template,
        metadata: data
      }

      const success = await this.provider.sendEmail(emailData)
      
      if (success) {
        // Create notification record
        await Notification.create({
          recipient,
          type: type as any,
          title: template.subject,
          message: template.text || template.subject,
          category: 'transaction',
          priority: 'medium',
          data: {
            ...data,
            emailSent: true
          }
        })
      }

      return { success }
    } catch (error) {
      logger.error('Error processing email job:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  }

  private async generateEmailTemplate(type: string, data: any, user: IUser): Promise<EmailTemplate | null> {
    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000'
    const userName = user.username || user.address

    switch (type) {
      case 'sale':
        return this.generateSaleTemplate(data, userName, baseUrl)
      case 'purchase':
        return this.generatePurchaseTemplate(data, userName, baseUrl)
      case 'bid':
        return this.generateBidTemplate(data, userName, baseUrl)
      case 'bid_accepted':
        return this.generateBidAcceptedTemplate(data, userName, baseUrl)
      case 'bid_outbid':
        return this.generateBidOutbidTemplate(data, userName, baseUrl)
      case 'auction_ending':
        return this.generateAuctionEndingTemplate(data, userName, baseUrl)
      default:
        logger.warn('Unknown email template type:', type)
        return null
    }
  }

  private generateSaleTemplate(data: any, userName: string, baseUrl: string): EmailTemplate {
    const { artworkTitle, price, currency, buyerAddress } = data
    
    return {
      subject: `🎉 Your artwork "${artworkTitle}" has been sold!`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="margin: 0; font-size: 28px;">🎉 Sale Completed!</h1>
            <p style="margin: 10px 0 0 0; opacity: 0.9;">Your artwork has found a new home</p>
          </div>
          
          <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
            <h2 style="color: #333; margin-top: 0;">Congratulations ${userName}!</h2>
            <p style="color: #666; line-height: 1.6;">
              Your artwork <strong>"${artworkTitle}"</strong> has been successfully sold for 
              <strong>${price} ${currency}</strong>.
            </p>
            
            <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea;">
              <h3 style="margin: 0 0 10px 0; color: #333;">Transaction Details</h3>
              <p style="margin: 5px 0; color: #666;"><strong>Artwork:</strong> ${artworkTitle}</p>
              <p style="margin: 5px 0; color: #666;"><strong>Price:</strong> ${price} ${currency}</p>
              <p style="margin: 5px 0; color: #666;"><strong>Buyer:</strong> ${buyerAddress}</p>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${baseUrl}/portfolio" 
                 style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                        color: white; padding: 12px 30px; text-decoration: none; 
                        border-radius: 25px; font-weight: bold; display: inline-block;">
                View Your Portfolio
              </a>
            </div>
          </div>
          
          <div style="text-align: center; padding: 20px; color: #999; font-size: 12px;">
            <p>This is an automated notification from Muse Art Marketplace.</p>
            <p>If you didn't expect this email, please contact support.</p>
          </div>
        </div>
      `,
      text: `Your artwork "${artworkTitle}" has been sold for ${price} ${currency}. View your portfolio at ${baseUrl}/portfolio`
    }
  }

  private generatePurchaseTemplate(data: any, userName: string, baseUrl: string): EmailTemplate {
    const { artworkTitle, price, currency, sellerAddress } = data
    
    return {
      subject: `🎨 You now own "${artworkTitle}"!`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="margin: 0; font-size: 28px;">🎨 Purchase Successful!</h1>
            <p style="margin: 10px 0 0 0; opacity: 0.9;">You've acquired a new artwork</p>
          </div>
          
          <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
            <h2 style="color: #333; margin-top: 0;">Congratulations ${userName}!</h2>
            <p style="color: #666; line-height: 1.6;">
              You are now the proud owner of <strong>"${artworkTitle}"</strong> for 
              <strong>${price} ${currency}</strong>.
            </p>
            
            <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea;">
              <h3 style="margin: 0 0 10px 0; color: #333;">Purchase Details</h3>
              <p style="margin: 5px 0; color: #666;"><strong>Artwork:</strong> ${artworkTitle}</p>
              <p style="margin: 5px 0; color: #666;"><strong>Price:</strong> ${price} ${currency}</p>
              <p style="margin: 5px 0; color: #666;"><strong>Seller:</strong> ${sellerAddress}</p>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${baseUrl}/collection" 
                 style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                        color: white; padding: 12px 30px; text-decoration: none; 
                        border-radius: 25px; font-weight: bold; display: inline-block;">
                View Your Collection
              </a>
            </div>
          </div>
          
          <div style="text-align: center; padding: 20px; color: #999; font-size: 12px;">
            <p>This is an automated notification from Muse Art Marketplace.</p>
            <p>If you didn't expect this email, please contact support.</p>
          </div>
        </div>
      `,
      text: `You have successfully purchased "${artworkTitle}" for ${price} ${currency}. View your collection at ${baseUrl}/collection`
    }
  }

  private generateBidTemplate(data: any, userName: string, baseUrl: string): EmailTemplate {
    const { artworkTitle, bidAmount, currency, bidderAddress } = data
    
    return {
      subject: `🎯 New bid received for "${artworkTitle}"`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="margin: 0; font-size: 28px;">🎯 New Bid!</h1>
            <p style="margin: 10px 0 0 0; opacity: 0.9;">Someone is interested in your artwork</p>
          </div>
          
          <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
            <h2 style="color: #333; margin-top: 0;">Hi ${userName}!</h2>
            <p style="color: #666; line-height: 1.6;">
              You've received a new bid of <strong>${bidAmount} ${currency}</strong> for your artwork 
              <strong>"${artworkTitle}"</strong>.
            </p>
            
            <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea;">
              <h3 style="margin: 0 0 10px 0; color: #333;">Bid Details</h3>
              <p style="margin: 5px 0; color: #666;"><strong>Artwork:</strong> ${artworkTitle}</p>
              <p style="margin: 5px 0; color: #666;"><strong>Bid Amount:</strong> ${bidAmount} ${currency}</p>
              <p style="margin: 5px 0; color: #666;"><strong>Bidder:</strong> ${bidderAddress}</p>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${baseUrl}/artwork/${data.artworkId}" 
                 style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                        color: white; padding: 12px 30px; text-decoration: none; 
                        border-radius: 25px; font-weight: bold; display: inline-block;">
                Review Bid
              </a>
            </div>
          </div>
          
          <div style="text-align: center; padding: 20px; color: #999; font-size: 12px;">
            <p>This is an automated notification from Muse Art Marketplace.</p>
            <p>If you didn't expect this email, please contact support.</p>
          </div>
        </div>
      `,
      text: `You received a new bid of ${bidAmount} ${currency} for "${artworkTitle}". Review the bid at ${baseUrl}/artwork/${data.artworkId}`
    }
  }

  private generateBidAcceptedTemplate(data: any, userName: string, baseUrl: string): EmailTemplate {
    const { artworkTitle, bidAmount, currency } = data
    
    return {
      subject: `✅ Your bid for "${artworkTitle}" has been accepted!`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="margin: 0; font-size: 28px;">✅ Bid Accepted!</h1>
            <p style="margin: 10px 0 0 0; opacity: 0.9;">Your offer was successful</p>
          </div>
          
          <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
            <h2 style="color: #333; margin-top: 0;">Congratulations ${userName}!</h2>
            <p style="color: #666; line-height: 1.6;">
              Your bid of <strong>${bidAmount} ${currency}</strong> for <strong>"${artworkTitle}"</strong> 
              has been accepted by the seller.
            </p>
            
            <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea;">
              <h3 style="margin: 0 0 10px 0; color: #333;">Accepted Bid Details</h3>
              <p style="margin: 5px 0; color: #666;"><strong>Artwork:</strong> ${artworkTitle}</p>
              <p style="margin: 5px 0; color: #666;"><strong>Your Bid:</strong> ${bidAmount} ${currency}</p>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${baseUrl}/artwork/${data.artworkId}" 
                 style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                        color: white; padding: 12px 30px; text-decoration: none; 
                        border-radius: 25px; font-weight: bold; display: inline-block;">
                Complete Purchase
              </a>
            </div>
          </div>
          
          <div style="text-align: center; padding: 20px; color: #999; font-size: 12px;">
            <p>This is an automated notification from Muse Art Marketplace.</p>
            <p>If you didn't expect this email, please contact support.</p>
          </div>
        </div>
      `,
      text: `Your bid of ${bidAmount} ${currency} for "${artworkTitle}" has been accepted! Complete your purchase at ${baseUrl}/artwork/${data.artworkId}`
    }
  }

  private generateBidOutbidTemplate(data: any, userName: string, baseUrl: string): EmailTemplate {
    const { artworkTitle, newBidAmount, currency, yourBidAmount } = data
    
    return {
      subject: `⚠️ You've been outbid for "${artworkTitle}"`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="margin: 0; font-size: 28px;">⚠️ Outbid!</h1>
            <p style="margin: 10px 0 0 0; opacity: 0.9;">Someone placed a higher bid</p>
          </div>
          
          <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
            <h2 style="color: #333; margin-top: 0;">Hi ${userName}!</h2>
            <p style="color: #666; line-height: 1.6;">
              You've been outbid for <strong>"${artworkTitle}"</strong>. 
              The new bid is <strong>${newBidAmount} ${currency}</strong> (your bid was ${yourBidAmount} ${currency}).
            </p>
            
            <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f5576c;">
              <h3 style="margin: 0 0 10px 0; color: #333;">Bid Update</h3>
              <p style="margin: 5px 0; color: #666;"><strong>Artwork:</strong> ${artworkTitle}</p>
              <p style="margin: 5px 0; color: #666;"><strong>New Bid:</strong> ${newBidAmount} ${currency}</p>
              <p style="margin: 5px 0; color: #666;"><strong>Your Bid:</strong> ${yourBidAmount} ${currency}</p>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${baseUrl}/artwork/${data.artworkId}" 
                 style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); 
                        color: white; padding: 12px 30px; text-decoration: none; 
                        border-radius: 25px; font-weight: bold; display: inline-block;">
                Place New Bid
              </a>
            </div>
          </div>
          
          <div style="text-align: center; padding: 20px; color: #999; font-size: 12px;">
            <p>This is an automated notification from Muse Art Marketplace.</p>
            <p>If you didn't expect this email, please contact support.</p>
          </div>
        </div>
      `,
      text: `You've been outbid for "${artworkTitle}". New bid: ${newBidAmount} ${currency}. Place a new bid at ${baseUrl}/artwork/${data.artworkId}`
    }
  }

  private generateAuctionEndingTemplate(data: any, userName: string, baseUrl: string): EmailTemplate {
    const { artworkTitle, currentBid, currency, timeRemaining } = data
    
    return {
      subject: `⏰ Auction ending soon for "${artworkTitle}"!`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #fa709a 0%, #fee140 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="margin: 0; font-size: 28px;">⏰ Time Running Out!</h1>
            <p style="margin: 10px 0 0 0; opacity: 0.9;">Auction ending soon</p>
          </div>
          
          <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
            <h2 style="color: #333; margin-top: 0;">Hi ${userName}!</h2>
            <p style="color: #666; line-height: 1.6;">
              The auction for <strong>"${artworkTitle}"</strong> is ending in <strong>${timeRemaining}</strong>!
              Current bid: <strong>${currentBid} ${currency}</strong>
            </p>
            
            <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #fa709a;">
              <h3 style="margin: 0 0 10px 0; color: #333;">Auction Status</h3>
              <p style="margin: 5px 0; color: #666;"><strong>Artwork:</strong> ${artworkTitle}</p>
              <p style="margin: 5px 0; color: #666;"><strong>Current Bid:</strong> ${currentBid} ${currency}</p>
              <p style="margin: 5px 0; color: #666;"><strong>Time Remaining:</strong> ${timeRemaining}</p>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${baseUrl}/artwork/${data.artworkId}" 
                 style="background: linear-gradient(135deg, #fa709a 0%, #fee140 100%); 
                        color: white; padding: 12px 30px; text-decoration: none; 
                        border-radius: 25px; font-weight: bold; display: inline-block;">
                Place Final Bid
              </a>
            </div>
          </div>
          
          <div style="text-align: center; padding: 20px; color: #999; font-size: 12px;">
            <p>This is an automated notification from Muse Art Marketplace.</p>
            <p>If you didn't expect this email, please contact support.</p>
          </div>
        </div>
      `,
      text: `Auction for "${artworkTitle}" ending in ${timeRemaining}! Current bid: ${currentBid} ${currency}. Place your final bid at ${baseUrl}/artwork/${data.artworkId}`
    }
  }

  async sendEmailNotification(recipient: string, type: string, data: any): Promise<void> {
    try {
      await jobQueueService.addJob(JobType.EMAIL_NOTIFICATION, {
        recipient,
        type,
        data
      }, {
        priority: 8,
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000
        }
      })

      logger.info('Email notification queued', { recipient, type })
    } catch (error) {
      logger.error('Failed to queue email notification:', error)
      throw error
    }
  }
}

export const emailService = new EmailService()
