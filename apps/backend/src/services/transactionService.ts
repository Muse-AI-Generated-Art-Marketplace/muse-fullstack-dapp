import mongoose from 'mongoose'
import { Artwork } from '@/models/Artwork'
import { ITransaction, Transaction } from '@/models/Transaction'
import { createError, createNotFoundError, createValidationError } from '@/middleware/errorHandler'
import cacheService from '@/services/cacheService'
import { websocketService } from '@/services/websocketService'

type TransactionStatus = ITransaction['status']

interface CreateTransactionInput {
  hash: string
  type: ITransaction['type']
  artwork: string
  from: string
  to?: string
  price: string
  currency: ITransaction['currency']
  network: ITransaction['network']
  metadata?: Record<string, any>
  idempotencyKey?: string
  externalId?: string
}

interface UpdateTransactionStatusInput {
  status: Exclude<TransactionStatus, 'pending'>
  reason?: string
  blockNumber?: number
  gasUsed?: string
  gasPrice?: string
  fee?: string
  metadata?: Record<string, any>
}

interface ProcessTransactionInput {
  shouldFail?: boolean
  blockNumber?: number
  gasUsed?: string
  gasPrice?: string
  fee?: string
  metadata?: Record<string, any>
  failureReason?: string
}

interface TransactionQuery {
  status?: TransactionStatus
  type?: ITransaction['type']
  artwork?: string
  from?: string
  to?: string
  network?: ITransaction['network']
   search?: string
  minPrice?: number
  maxPrice?: number
  startDate?: string
  endDate?: string
  page: number
  limit: number
}

class TransactionService {
  private readonly cacheTtl = 60 * 5

  async createTransaction(input: CreateTransactionInput): Promise<ITransaction> {
    await this.ensureArtworkExists(input.artwork)

    if (input.idempotencyKey) {
      const existingByKey = await Transaction.findOne({ idempotencyKey: input.idempotencyKey })
      if (existingByKey) {
        return this.cacheTransaction(existingByKey)
      }
    }

    const existingByHash = await Transaction.findOne({ hash: input.hash })
    if (existingByHash) {
      throw createValidationError('Transaction hash already exists', {
        hash: input.hash
      })
    }

    const transaction = await Transaction.create({
      ...input,
      artwork: new mongoose.Types.ObjectId(input.artwork),
      status: 'pending',
      statusHistory: [{
        status: 'pending',
        timestamp: new Date(),
        metadata: input.metadata
      }]
    })

    // Broadcast real-time update for new transaction
    try {
      await transaction.populate('artwork')
      websocketService.broadcastTransactionUpdate(transaction)
    } catch (error) {
      // Log error but don't fail the transaction creation
      console.error('Failed to broadcast transaction update:', error)
    }

    return this.cacheTransaction(transaction)
  }

  async processTransaction(id: string, input: ProcessTransactionInput = {}): Promise<ITransaction> {
    const transaction = await this.requireTransaction(id)

    if (!['pending', 'processing'].includes(transaction.status)) {
      throw createValidationError('Only pending or processing transactions can be processed', {
        currentStatus: transaction.status
      })
    }

    if (transaction.status === 'pending') {
      await this.applyStatusUpdate(transaction, {
        status: 'processing',
        reason: 'Transaction entered processing queue',
        metadata: input.metadata
      })
    }

    if (input.shouldFail) {
      return this.applyStatusUpdate(transaction, {
        status: 'failed',
        reason: input.failureReason || 'Transaction processing failed',
        blockNumber: input.blockNumber,
        gasUsed: input.gasUsed,
        gasPrice: input.gasPrice,
        fee: input.fee,
        metadata: input.metadata
      })
    }

    return this.applyStatusUpdate(transaction, {
      status: 'completed',
      reason: 'Transaction processed successfully',
      blockNumber: input.blockNumber,
      gasUsed: input.gasUsed,
      gasPrice: input.gasPrice,
      fee: input.fee,
      metadata: input.metadata
    })
  }

  async updateTransactionStatus(id: string, input: UpdateTransactionStatusInput): Promise<ITransaction> {
    const transaction = await this.requireTransaction(id)
    return this.applyStatusUpdate(transaction, input)
  }

  async getTransaction(id: string): Promise<ITransaction> {
    const cached = await cacheService.get<ITransaction>(this.getCacheKey(id))
    if (cached) {
      return cached
    }

    const transaction = await this.requireTransaction(id)
    return this.cacheTransaction(transaction)
  }

  async getTransactionStatus(id: string): Promise<Pick<ITransaction, '_id' | 'hash' | 'status' | 'statusHistory' | 'completedAt' | 'updatedAt' | 'failureReason'>> {
    const transaction = await this.getTransaction(id)

    return {
      _id: transaction._id,
      hash: transaction.hash,
      status: transaction.status,
      statusHistory: transaction.statusHistory,
      completedAt: transaction.completedAt,
      updatedAt: transaction.updatedAt,
      failureReason: transaction.failureReason
    }
  }

  async listTransactions(query: TransactionQuery) {
  const filters: Record<string, any> = {}

  if (query.status) {
    filters.status = Array.isArray(query.status)
      ? { $in: query.status }
      : query.status
  }

  if (query.type) {
    filters.type = Array.isArray(query.type)
      ? { $in: query.type }
      : query.type
  }

  if (query.artwork) filters.artwork = query.artwork
  if (query.from) filters.from = query.from
  if (query.to) filters.to = query.to
  if (query.network) filters.network = query.network

  // full-text search across multiple fields (hash, from, to, externalId, failureReason)
  if (query.search) {
    filters.$text = { $search: query.search }
  }

  //  PRICE RANGE FILTER (price is string → convert safely) 
  if (query.minPrice || query.maxPrice) {
    filters.$expr = {
      $and: [
        query.minPrice
          ? { $gte: [{ $toDouble: '$price' }, query.minPrice] }
          : {},
        query.maxPrice
          ? { $lte: [{ $toDouble: '$price' }, query.maxPrice] }
          : {},
      ].filter(Boolean),
    }
  }

  if (query.startDate || query.endDate) {
    filters.createdAt = {}
    if (query.startDate) {
      filters.createdAt.$gte = new Date(query.startDate)
    }
    if (query.endDate) {
      filters.createdAt.$lte = new Date(query.endDate)
    }
  }

  const skip = (query.page - 1) * query.limit


  const sort: Record<string, any> = query.search
    ? { score: { $meta: 'textScore' }, createdAt: -1 }
    : { createdAt: -1 }

  const projection = query.search
    ? { score: { $meta: 'textScore' } }
    : {}

  const [data, total] = await Promise.all([
    Transaction.find(filters, projection)
      .populate('artwork')
      .sort(sort)
      .skip(skip)
      .limit(query.limit),
    Transaction.countDocuments(filters),
  ])

  return {
    data,
    pagination: {
      page: query.page,
      limit: query.limit,
      total,
      totalPages: Math.ceil(total / query.limit),
      hasNextPage: skip + data.length < total,
      hasPrevPage: query.page > 1,
    },
  }
}

  private async applyStatusUpdate(transaction: ITransaction, input: UpdateTransactionStatusInput): Promise<ITransaction> {
    const now = new Date()
    const nextStatus = input.status

    if (!this.isValidTransition(transaction.status, nextStatus)) {
      throw createValidationError('Invalid transaction status transition', {
        currentStatus: transaction.status,
        nextStatus
      })
    }

    transaction.status = nextStatus
    transaction.blockNumber = input.blockNumber ?? transaction.blockNumber
    transaction.gasUsed = input.gasUsed ?? transaction.gasUsed
    transaction.gasPrice = input.gasPrice ?? transaction.gasPrice
    transaction.fee = input.fee ?? transaction.fee
    transaction.failureReason = nextStatus === 'failed' ? input.reason : undefined
    transaction.processingStartedAt = nextStatus === 'processing'
      ? transaction.processingStartedAt || now
      : transaction.processingStartedAt
    transaction.completedAt = ['completed', 'failed', 'cancelled'].includes(nextStatus)
      ? now
      : undefined
    transaction.metadata = {
      ...(transaction.metadata || {}),
      ...(input.metadata || {})
    }
    transaction.statusHistory.push({
      status: nextStatus,
      timestamp: now,
      reason: input.reason,
      metadata: input.metadata
    })

    await transaction.save()
    
    // Broadcast real-time update for status change
    try {
      await transaction.populate('artwork')
      websocketService.broadcastTransactionUpdate(transaction)
    } catch (error) {
      // Log error but don't fail the status update
      console.error('Failed to broadcast transaction status update:', error)
    }
    
    return this.cacheTransaction(transaction)
  }

  private isValidTransition(currentStatus: TransactionStatus, nextStatus: TransactionStatus): boolean {
    const transitions: Record<TransactionStatus, TransactionStatus[]> = {
      pending: ['processing', 'completed', 'failed', 'cancelled'],
      processing: ['completed', 'failed', 'cancelled'],
      completed: [],
      failed: [],
      cancelled: []
    }

    return transitions[currentStatus].includes(nextStatus)
  }

  private async ensureArtworkExists(artworkId: string): Promise<void> {
    const artwork = await Artwork.findById(artworkId)
    if (!artwork) {
      throw createNotFoundError('Artwork')
    }
  }

  private async requireTransaction(id: string): Promise<ITransaction> {
    const transaction = await Transaction.findById(id).populate('artwork')
    if (!transaction) {
      throw createNotFoundError('Transaction')
    }

    return transaction
  }

  private async cacheTransaction(transaction: ITransaction): Promise<ITransaction> {
    if (!transaction?._id) {
      throw createError('Transaction cache key is missing', 500)
    }

    await cacheService.set(this.getCacheKey(transaction._id.toString()), transaction, this.cacheTtl)
    return transaction
  }

  private getCacheKey(id: string): string {
    return `transaction:${id}`
  }
}

export const transactionService = new TransactionService()
