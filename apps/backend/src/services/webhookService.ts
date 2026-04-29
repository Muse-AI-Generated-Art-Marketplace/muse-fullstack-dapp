import axios, { AxiosRequestConfig } from 'axios'
import { randomUUID } from 'crypto'
import cacheService from './cacheService'
import { createLogger } from '@/utils/logger'

const logger = createLogger('WebhookService')

export interface Webhook {
  id: string
  url: string
  events: string[]
  secret?: string
  isActive: boolean
  userId: string
  retryConfig: RetryConfig
  headers?: Record<string, string>
  createdAt: number
  updatedAt: number
  lastTriggered?: number
  deliveryStats: DeliveryStats
}

export interface RetryConfig {
  maxRetries: number
  retryDelay: number
  backoffMultiplier: number
  maxRetryDelay: number
}

export interface DeliveryStats {
  totalDeliveries: number
  successfulDeliveries: number
  failedDeliveries: number
  lastDeliveryStatus?: 'success' | 'failed' | 'pending'
  lastDeliveryTime?: number
  averageDeliveryTime: number
}

export interface WebhookEvent {
  id: string
  type: string
  data: any
  timestamp: number
  userId?: string
  metadata?: Record<string, any>
}

export interface WebhookDelivery {
  id: string
  webhookId: string
  eventId: string
  status: 'pending' | 'success' | 'failed' | 'retrying'
  attempts: number
  maxAttempts: number
  response?: {
    statusCode: number
    headers: Record<string, string>
    body: string
  }
  error?: string
  createdAt: number
  updatedAt: number
  nextRetryAt?: number
}

export interface WebhookPayload {
  id: string
  type: string
  data: any
  timestamp: number
  signature?: string
  metadata?: Record<string, any>
}

class WebhookService {
  private webhooks: Map<string, Webhook> = new Map()
  private deliveries: Map<string, WebhookDelivery> = new Map()
  private eventQueue: WebhookEvent[] = []
  private processingInterval: NodeJS.Timeout | null = null
  private cacheKeyPrefix = 'webhook:'

  constructor() {
    this.startProcessing()
    this.loadWebhooksFromCache()
  }

  // Create a new webhook
  async createWebhook(webhookData: Omit<Webhook, 'id' | 'createdAt' | 'updatedAt' | 'deliveryStats'>): Promise<Webhook> {
    const webhook: Webhook = {
      ...webhookData,
      id: randomUUID(),
      createdAt: Date.now(),
      updatedAt: Date.now(),
      deliveryStats: {
        totalDeliveries: 0,
        successfulDeliveries: 0,
        failedDeliveries: 0,
        averageDeliveryTime: 0
      }
    }

    // Validate webhook URL
    if (!this.isValidUrl(webhook.url)) {
      throw new Error('Invalid webhook URL')
    }

    // Validate events
    if (!webhook.events || webhook.events.length === 0) {
      throw new Error('At least one event must be specified')
    }

    this.webhooks.set(webhook.id, webhook)
    await this.saveWebhookToCache(webhook)

    logger.info(`Created webhook ${webhook.id} for user ${webhook.userId}`, {
      url: webhook.url,
      events: webhook.events
    })

    return webhook
  }

  // Update a webhook
  async updateWebhook(id: string, updates: Partial<Webhook>): Promise<Webhook> {
    const webhook = this.webhooks.get(id)
    if (!webhook) {
      throw new Error('Webhook not found')
    }

    const updatedWebhook = {
      ...webhook,
      ...updates,
      updatedAt: Date.now()
    }

    // Validate URL if being updated
    if (updates.url && !this.isValidUrl(updates.url)) {
      throw new Error('Invalid webhook URL')
    }

    this.webhooks.set(id, updatedWebhook)
    await this.saveWebhookToCache(updatedWebhook)

    logger.info(`Updated webhook ${id}`)
    return updatedWebhook
  }

  // Delete a webhook
  async deleteWebhook(id: string): Promise<void> {
    const webhook = this.webhooks.get(id)
    if (!webhook) {
      throw new Error('Webhook not found')
    }

    this.webhooks.delete(id)
    await cacheService.del(this.getWebhookCacheKey(id))

    logger.info(`Deleted webhook ${id}`)
  }

  // Get webhook by ID
  async getWebhook(id: string): Promise<Webhook | null> {
    const webhook = this.webhooks.get(id)
    if (webhook) {
      return webhook
    }

    // Try to load from cache
    const cachedWebhook = await cacheService.get<Webhook>(this.getWebhookCacheKey(id))
    if (cachedWebhook) {
      this.webhooks.set(id, cachedWebhook)
      return cachedWebhook
    }

    return null
  }

  // Get webhooks for a user
  async getWebhooksForUser(userId: string): Promise<Webhook[]> {
    const userWebhooks: Webhook[] = []
    
    for (const webhook of this.webhooks.values()) {
      if (webhook.userId === userId) {
        userWebhooks.push(webhook)
      }
    }

    return userWebhooks.sort((a, b) => b.createdAt - a.createdAt)
  }

  // Trigger an event
  async triggerEvent(eventType: string, data: any, userId?: string, metadata?: Record<string, any>): Promise<void> {
    const event: WebhookEvent = {
      id: randomUUID(),
      type: eventType,
      data,
      timestamp: Date.now(),
      userId,
      metadata
    }

    this.eventQueue.push(event)
    logger.debug(`Queued event ${event.type} for delivery`, { eventId: event.id })
  }

  // Get webhook deliveries
  async getWebhookDeliveries(webhookId: string, limit: number = 50): Promise<WebhookDelivery[]> {
    const deliveries: WebhookDelivery[] = []
    
    for (const delivery of this.deliveries.values()) {
      if (delivery.webhookId === webhookId) {
        deliveries.push(delivery)
      }
    }

    return deliveries
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, limit)
  }

  // Test webhook delivery
  async testWebhook(webhookId: string, testEvent?: { type: string; data: any }): Promise<{
    success: boolean
    response?: any
    error?: string
  }> {
    const webhook = await this.getWebhook(webhookId)
    if (!webhook) {
      throw new Error('Webhook not found')
    }

    const testEventData = testEvent || {
      type: 'webhook.test',
      data: {
        message: 'This is a test webhook delivery',
        timestamp: Date.now()
      }
    }

    try {
      const payload = this.createPayload(testEventData, webhook.secret)
      const response = await this.deliverWebhook(webhook.url, payload, webhook.headers)
      
      return {
        success: true,
        response: {
          status: response.status,
          statusText: response.statusText,
          headers: response.headers
        }
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  // Get webhook statistics
  async getWebhookStats(userId?: string): Promise<{
    totalWebhooks: number
    activeWebhooks: number
    totalDeliveries: number
    successfulDeliveries: number
    failedDeliveries: number
    averageDeliveryTime: number
    topEvents: Array<{ event: string; count: number }>
  }> {
    let webhooks = Array.from(this.webhooks.values())
    if (userId) {
      webhooks = webhooks.filter(w => w.userId === userId)
    }

    const totalDeliveries = webhooks.reduce((sum, w) => sum + w.deliveryStats.totalDeliveries, 0)
    const successfulDeliveries = webhooks.reduce((sum, w) => sum + w.deliveryStats.successfulDeliveries, 0)
    const failedDeliveries = webhooks.reduce((sum, w) => sum + w.deliveryStats.failedDeliveries, 0)

    // Calculate average delivery time
    const avgDeliveryTimes = webhooks.map(w => w.deliveryStats.averageDeliveryTime).filter(t => t > 0)
    const averageDeliveryTime = avgDeliveryTimes.length > 0 
      ? avgDeliveryTimes.reduce((sum, t) => sum + t, 0) / avgDeliveryTimes.length 
      : 0

    // Count events
    const eventCounts = new Map<string, number>()
    for (const webhook of webhooks) {
      for (const event of webhook.events) {
        eventCounts.set(event, (eventCounts.get(event) || 0) + 1)
      }
    }

    const topEvents = Array.from(eventCounts.entries())
      .map(([event, count]) => ({ event, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)

    return {
      totalWebhooks: webhooks.length,
      activeWebhooks: webhooks.filter(w => w.isActive).length,
      totalDeliveries,
      successfulDeliveries,
      failedDeliveries,
      averageDeliveryTime,
      topEvents
    }
  }

  // Private methods
  private async processEventQueue(): Promise<void> {
    while (this.eventQueue.length > 0) {
      const event = this.eventQueue.shift()
      if (!event) continue

      await this.processEvent(event)
    }
  }

  private async processEvent(event: WebhookEvent): Promise<void> {
    const matchingWebhooks = Array.from(this.webhooks.values()).filter(webhook => 
      webhook.isActive && 
      webhook.events.includes(event.type) &&
      (!event.userId || webhook.userId === event.userId)
    )

    logger.debug(`Processing event ${event.type} for ${matchingWebhooks.length} webhooks`)

    const deliveryPromises = matchingWebhooks.map(webhook => 
      this.deliverEventToWebhook(event, webhook)
    )

    await Promise.allSettled(deliveryPromises)
  }

  private async deliverEventToWebhook(event: WebhookEvent, webhook: Webhook): Promise<void> {
    const deliveryId = randomUUID()
    const startTime = Date.now()

    const delivery: WebhookDelivery = {
      id: deliveryId,
      webhookId: webhook.id,
      eventId: event.id,
      status: 'pending',
      attempts: 0,
      maxAttempts: webhook.retryConfig.maxRetries + 1,
      createdAt: startTime,
      updatedAt: startTime
    }

    this.deliveries.set(deliveryId, delivery)

    try {
      const payload = this.createPayload(event, webhook.secret)
      const response = await this.deliverWebhook(webhook.url, payload, webhook.headers)

      // Update delivery on success
      delivery.status = 'success'
      delivery.response = {
        statusCode: response.status,
        headers: response.headers as Record<string, string>,
        body: typeof response.data === 'string' ? response.data : JSON.stringify(response.data)
      }
      delivery.updatedAt = Date.now()

      // Update webhook stats
      webhook.deliveryStats.totalDeliveries++
      webhook.deliveryStats.successfulDeliveries++
      webhook.deliveryStats.lastDeliveryStatus = 'success'
      webhook.deliveryStats.lastDeliveryTime = delivery.updatedAt
      webhook.lastTriggered = delivery.updatedAt

      const deliveryTime = delivery.updatedAt - startTime
      this.updateAverageDeliveryTime(webhook, deliveryTime)

      logger.info(`Successfully delivered webhook ${webhook.id}`, {
        eventId: event.id,
        deliveryId,
        status: response.status
      })

    } catch (error) {
      // Update delivery on failure
      delivery.status = delivery.attempts < delivery.maxAttempts - 1 ? 'retrying' : 'failed'
      delivery.error = error instanceof Error ? error.message : 'Unknown error'
      delivery.updatedAt = Date.now()

      if (delivery.status === 'retrying') {
        delivery.nextRetryAt = Date.now() + this.calculateRetryDelay(webhook.retryConfig, delivery.attempts)
      }

      // Update webhook stats
      webhook.deliveryStats.totalDeliveries++
      webhook.deliveryStats.failedDeliveries++
      webhook.deliveryStats.lastDeliveryStatus = 'failed'
      webhook.deliveryStats.lastDeliveryTime = delivery.updatedAt

      logger.error(`Failed to deliver webhook ${webhook.id}`, {
        eventId: event.id,
        deliveryId,
        error: delivery.error,
        attempt: delivery.attempts + 1
      })
    }

    // Save updated webhook and delivery
    await this.saveWebhookToCache(webhook)
  }

  private async deliverWebhook(url: string, payload: WebhookPayload, headers?: Record<string, string>): Promise<any> {
    const config: AxiosRequestConfig = {
      method: 'POST',
      url,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Muse-Webhook-Service/1.0',
        ...headers
      },
      data: payload,
      timeout: 30000, // 30 seconds timeout
      validateStatus: (status) => status >= 200 && status < 300
    }

    return await axios(config)
  }

  private createPayload(event: WebhookEvent, secret?: string): WebhookPayload {
    const payload: WebhookPayload = {
      id: event.id,
      type: event.type,
      data: event.data,
      timestamp: event.timestamp,
      metadata: event.metadata
    }

    if (secret) {
      payload.signature = this.generateSignature(payload, secret)
    }

    return payload
  }

  private generateSignature(payload: WebhookPayload, secret: string): string {
    const crypto = require('crypto')
    const payloadString = JSON.stringify(payload)
    return crypto
      .createHmac('sha256', secret)
      .update(payloadString)
      .digest('hex')
  }

  private calculateRetryDelay(retryConfig: RetryConfig, attempt: number): number {
    const delay = retryConfig.retryDelay * Math.pow(retryConfig.backoffMultiplier, attempt)
    return Math.min(delay, retryConfig.maxRetryDelay)
  }

  private updateAverageDeliveryTime(webhook: Webhook, deliveryTime: number): void {
    const stats = webhook.deliveryStats
    const totalDeliveries = stats.totalDeliveries
    
    if (totalDeliveries === 1) {
      stats.averageDeliveryTime = deliveryTime
    } else {
      stats.averageDeliveryTime = ((stats.averageDeliveryTime * (totalDeliveries - 1)) + deliveryTime) / totalDeliveries
    }
  }

  private isValidUrl(url: string): boolean {
    try {
      new URL(url)
      return true
    } catch {
      return false
    }
  }

  private startProcessing(): void {
    this.processingInterval = setInterval(() => {
      this.processEventQueue().catch(error => {
        logger.error('Error processing webhook queue:', error)
      })
    }, 1000) // Process every second
  }

  private async loadWebhooksFromCache(): Promise<void> {
    try {
      // This would typically load webhooks from a database
      // For now, we'll just initialize with empty data
      logger.info('Webhook service initialized')
    } catch (error) {
      logger.error('Error loading webhooks from cache:', error)
    }
  }

  private async saveWebhookToCache(webhook: Webhook): Promise<void> {
    await cacheService.set(this.getWebhookCacheKey(webhook.id), webhook, 86400) // 24 hours
  }

  private getWebhookCacheKey(id: string): string {
    return `${this.cacheKeyPrefix}${id}`
  }

  // Cleanup old deliveries
  cleanup(maxAge: number = 7 * 24 * 60 * 60 * 1000): void {
    const cutoff = Date.now() - maxAge
    let cleaned = 0

    for (const [id, delivery] of this.deliveries) {
      if (delivery.createdAt < cutoff) {
        this.deliveries.delete(id)
        cleaned++
      }
    }

    if (cleaned > 0) {
      logger.info(`Cleaned up ${cleaned} old webhook deliveries`)
    }
  }

  // Shutdown the service
  shutdown(): void {
    if (this.processingInterval) {
      clearInterval(this.processingInterval)
      this.processingInterval = null
    }
    logger.info('Webhook service shutdown')
  }
}

// Create singleton instance
const webhookService = new WebhookService()

export default webhookService
export { WebhookService }
