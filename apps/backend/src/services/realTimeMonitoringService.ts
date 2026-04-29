import WebSocket from 'ws'
import { createLogger } from '@/utils/logger'
import analyticsService from './analyticsService'
import { EventEmitter } from 'events'

const logger = createLogger('RealTimeMonitoringService')

export interface MonitoringClient {
  id: string
  ws: WebSocket
  subscriptions: Set<string>
  lastPing: Date
}

export interface RealTimeMetrics {
  timestamp: Date
  totalRequests: number
  errorRate: number
  averageResponseTime: number
  activeConnections: number
  memoryUsage: number
  cpuUsage: number
}

class RealTimeMonitoringService extends EventEmitter {
  private wss: WebSocket.Server | null = null
  private clients: Map<string, MonitoringClient> = new Map()
  private metricsInterval: ReturnType<typeof setInterval> | null = null
  private isRunning = false

  constructor() {
    super()
  }

  // Start WebSocket server for real-time monitoring
  start(port: number = 8080): void {
    if (this.isRunning) {
      logger.warn('Real-time monitoring service is already running')
      return
    }

    try {
      this.wss = new WebSocket.Server({ port })
      
      this.wss.on('connection', (ws: WebSocket, req) => {
        this.handleConnection(ws, req)
      })

      this.wss.on('error', (error) => {
        logger.error('WebSocket server error', { error: error.message })
      })

      // Start metrics broadcasting
      this.startMetricsBroadcasting()
      
      this.isRunning = true
      logger.info(`Real-time monitoring service started on port ${port}`)
    } catch (error: any) {
      logger.error('Failed to start real-time monitoring service', { error: error.message })
      throw error
    }
  }

  // Stop WebSocket server
  stop(): void {
    if (!this.isRunning) {
      return
    }

    // Stop metrics broadcasting
    if (this.metricsInterval) {
      clearInterval(this.metricsInterval)
      this.metricsInterval = null
    }

    // Close all client connections
    this.clients.forEach((client) => {
      client.ws.close()
    })
    this.clients.clear()

    // Close WebSocket server
    if (this.wss) {
      this.wss.close()
      this.wss = null
    }

    this.isRunning = false
    logger.info('Real-time monitoring service stopped')
  }

  // Handle new WebSocket connection
  private handleConnection(ws: WebSocket, req: any): void {
    const clientId = this.generateClientId()
    const client: MonitoringClient = {
      id: clientId,
      ws,
      subscriptions: new Set(),
      lastPing: new Date()
    }

    this.clients.set(clientId, client)
    logger.info('New monitoring client connected', { clientId, ip: req.socket.remoteAddress })

    // Send welcome message
    this.sendToClient(client, {
      type: 'connected',
      clientId,
      timestamp: new Date()
    })

    // Handle client messages
    ws.on('message', (data) => {
      this.handleClientMessage(client, data)
    })

    // Handle client disconnection
    ws.on('close', () => {
      this.handleDisconnection(client)
    })

    // Handle client errors
    ws.on('error', (error) => {
      logger.error('Client WebSocket error', { clientId, error: error.message })
      this.handleDisconnection(client)
    })

    // Send initial metrics
    this.sendCurrentMetrics(client)
  }

  // Handle client messages
  private handleClientMessage(client: MonitoringClient, data: WebSocket.Data): void {
    try {
      const message = JSON.parse(data.toString())
      
      switch (message.type) {
        case 'subscribe':
          this.handleSubscription(client, message.channels || [])
          break
        case 'unsubscribe':
          this.handleUnsubscription(client, message.channels || [])
          break
        case 'ping':
          client.lastPing = new Date()
          this.sendToClient(client, {
            type: 'pong',
            timestamp: new Date()
          })
          break
        default:
          logger.warn('Unknown message type from client', { 
            clientId: client.id, 
            messageType: message.type 
          })
      }
    } catch (error: any) {
      logger.error('Failed to parse client message', { 
        clientId: client.id, 
        error: error.message 
      })
    }
  }

  // Handle client subscription
  private handleSubscription(client: MonitoringClient, channels: string[]): void {
    channels.forEach(channel => {
      if (this.isValidChannel(channel)) {
        client.subscriptions.add(channel)
      }
    })

    this.sendToClient(client, {
      type: 'subscribed',
      channels: Array.from(client.subscriptions),
      timestamp: new Date()
    })

    logger.debug('Client subscribed to channels', {
      clientId: client.id,
      channels: Array.from(client.subscriptions)
    })
  }

  // Handle client unsubscription
  private handleUnsubscription(client: MonitoringClient, channels: string[]): void {
    channels.forEach(channel => {
      client.subscriptions.delete(channel)
    })

    this.sendToClient(client, {
      type: 'unsubscribed',
      channels,
      timestamp: new Date()
    })
  }

  // Handle client disconnection
  private handleDisconnection(client: MonitoringClient): void {
    this.clients.delete(client.id)
    logger.info('Monitoring client disconnected', { clientId: client.id })
  }

  // Validate channel name
  private isValidChannel(channel: string): boolean {
    const validChannels = [
      'metrics',
      'requests',
      'errors',
      'performance',
      'alerts'
    ]
    return validChannels.includes(channel)
  }

  // Send message to specific client
  private sendToClient(client: MonitoringClient, message: any): void {
    if (client.ws.readyState === WebSocket.OPEN) {
      try {
        client.ws.send(JSON.stringify(message))
      } catch (error: any) {
        logger.error('Failed to send message to client', {
          clientId: client.id,
          error: error.message
        })
      }
    }
  }

  // Broadcast message to all subscribed clients
  private broadcast(channel: string, message: any): void {
    this.clients.forEach((client) => {
      if (client.subscriptions.has(channel) || client.subscriptions.has('*')) {
        this.sendToClient(client, {
          channel,
          ...message,
          timestamp: new Date()
        })
      }
    })
  }

  // Send current metrics to a specific client
  private async sendCurrentMetrics(client: MonitoringClient): Promise<void> {
    try {
      const metrics = await analyticsService.getRealTimeMetrics('1h')
      
      this.sendToClient(client, {
        type: 'metrics',
        data: metrics
      })
    } catch (error: any) {
      logger.error('Failed to send current metrics', {
        clientId: client.id,
        error: error.message
      })
    }
  }

  // Start broadcasting metrics
  private startMetricsBroadcasting(): void {
    this.metricsInterval = setInterval(async () => {
      try {
        const metrics = await this.collectMetrics()
        
        // Broadcast to clients subscribed to metrics
        this.broadcast('metrics', {
          type: 'metrics_update',
          data: metrics
        })

        // Check for alerts
        this.checkAlerts(metrics)

      } catch (error: any) {
        logger.error('Failed to broadcast metrics', { error: error.message })
      }
    }, 5000) // Broadcast every 5 seconds
  }

  // Collect current metrics
  private async collectMetrics(): Promise<RealTimeMetrics> {
    try {
      const realtimeData = await analyticsService.getRealTimeMetrics('1h')
      const memoryUsage = process.memoryUsage()
      
      return {
        timestamp: new Date(),
        totalRequests: realtimeData.totalRequests,
        errorRate: realtimeData.errorRate,
        averageResponseTime: realtimeData.averageResponseTime,
        activeConnections: this.clients.size,
        memoryUsage: memoryUsage.heapUsed,
        cpuUsage: 0 // Would need additional monitoring for CPU
      }
    } catch (error: any) {
      logger.error('Failed to collect metrics', { error: error.message })
      return {
        timestamp: new Date(),
        totalRequests: 0,
        errorRate: 0,
        averageResponseTime: 0,
        activeConnections: this.clients.size,
        memoryUsage: 0,
        cpuUsage: 0
      }
    }
  }

  // Check for alerts and broadcast if needed
  private checkAlerts(metrics: RealTimeMetrics): void {
    const alerts = []

    // High error rate alert
    if (metrics.errorRate > 10) {
      alerts.push({
        type: 'high_error_rate',
        severity: 'warning',
        message: `Error rate is ${metrics.errorRate.toFixed(2)}%`,
        threshold: 10,
        value: metrics.errorRate
      })
    }

    // High response time alert
    if (metrics.averageResponseTime > 2000) {
      alerts.push({
        type: 'high_response_time',
        severity: 'warning',
        message: `Average response time is ${metrics.averageResponseTime}ms`,
        threshold: 2000,
        value: metrics.averageResponseTime
      })
    }

    // High memory usage alert
    const memoryUsageMB = metrics.memoryUsage / (1024 * 1024)
    if (memoryUsageMB > 500) {
      alerts.push({
        type: 'high_memory_usage',
        severity: 'critical',
        message: `Memory usage is ${memoryUsageMB.toFixed(2)}MB`,
        threshold: 500,
        value: memoryUsageMB
      })
    }

    // Broadcast alerts if any
    if (alerts.length > 0) {
      this.broadcast('alerts', {
        type: 'alerts',
        data: alerts
      })
    }
  }

  // Generate unique client ID
  private generateClientId(): string {
    return `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  // Get service status
  getStatus(): any {
    return {
      isRunning: this.isRunning,
      connectedClients: this.clients.size,
      uptime: this.isRunning ? process.uptime() : 0,
      port: this.wss?.address()?.port || null
    }
  }

  // Get connected clients info
  getConnectedClients(): any[] {
    return Array.from(this.clients.values()).map(client => ({
      id: client.id,
      subscriptions: Array.from(client.subscriptions),
      connectedSince: client.lastPing,
      readyState: client.ws.readyState
    }))
  }
}

const realTimeMonitoringService = new RealTimeMonitoringService()
export default realTimeMonitoringService
