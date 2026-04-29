import { transactionService } from '@/services/transactionService'
import { Artwork } from '@/models/Artwork'
import { Transaction } from '@/models/Transaction'
import cacheService from '@/services/cacheService'

jest.mock('@/models/Artwork', () => ({
  Artwork: {
    findById: jest.fn()
  }
}))

jest.mock('@/models/Transaction', () => ({
  Transaction: {
    findOne: jest.fn(),
    create: jest.fn(),
    findById: jest.fn(),
    find: jest.fn(),
    countDocuments: jest.fn()
  }
}))

jest.mock('@/services/cacheService', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    set: jest.fn()
  }
}))

const mockedArtwork = Artwork as jest.Mocked<typeof Artwork>
const mockedTransaction = Transaction as jest.Mocked<typeof Transaction>
const mockedCache = cacheService as jest.Mocked<typeof cacheService>

function createTransactionDocument(overrides: Record<string, any> = {}) {
  const document = {
    _id: '507f1f77bcf86cd799439011',
    hash: 'stellar_hash_1234567890',
    type: 'sale',
    artwork: '507f1f77bcf86cd799439012',
    from: 'GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF',
    to: 'GBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBXH',
    price: '25.5',
    currency: 'XLM',
    network: 'testnet',
    status: 'pending',
    statusHistory: [
      {
        status: 'pending',
        timestamp: new Date('2026-03-29T00:00:00.000Z')
      }
    ],
    metadata: {},
    updatedAt: new Date('2026-03-29T00:00:00.000Z'),
    completedAt: undefined,
    processingStartedAt: undefined,
    failureReason: undefined,
    save: jest.fn().mockResolvedValue(undefined),
    populate: jest.fn(),
    ...overrides
  }

  document.populate.mockResolvedValue(document)
  return document
}

describe('transactionService', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockedArtwork.findById.mockReset()
    mockedTransaction.findOne.mockReset()
    mockedTransaction.create.mockReset()
    mockedTransaction.findById.mockReset()
    mockedTransaction.find.mockReset()
    mockedTransaction.countDocuments.mockReset()
    mockedCache.get.mockReset()
    mockedCache.set.mockReset()
    mockedArtwork.findById.mockResolvedValue({ _id: '507f1f77bcf86cd799439012' } as any)
    mockedCache.get.mockResolvedValue(null)
    mockedCache.set.mockResolvedValue(true as never)
  })

  it('creates a pending transaction with status history', async () => {
    mockedTransaction.findOne
      .mockResolvedValueOnce(null as any)
      .mockResolvedValueOnce(null as any)

    const created = createTransactionDocument()
    mockedTransaction.create.mockResolvedValue(created as any)

    const result = await transactionService.createTransaction({
      hash: 'stellar_hash_1234567890',
      type: 'sale',
      artwork: '507f1f77bcf86cd799439012',
      from: 'GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF',
      to: 'GBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBXH',
      price: '25.5',
      currency: 'XLM',
      network: 'testnet',
      metadata: { listingId: 'listing-123' }
    })

    expect(mockedTransaction.create).toHaveBeenCalledWith(expect.objectContaining({
      status: 'pending',
      hash: 'stellar_hash_1234567890'
    }))
    expect(result.statusHistory).toHaveLength(1)
    expect(mockedCache.set).toHaveBeenCalled()
  })

  it('returns the existing idempotent transaction when idempotency key is reused', async () => {
    mockedTransaction.findOne
      .mockResolvedValueOnce(createTransactionDocument({ idempotencyKey: 'idem-12345678' }) as any)

    const result = await transactionService.createTransaction({
      hash: 'stellar_hash_9999999999',
      type: 'sale',
      artwork: '507f1f77bcf86cd799439012',
      from: 'GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF',
      to: 'GBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBXH',
      price: '25.5',
      currency: 'XLM',
      network: 'testnet',
      idempotencyKey: 'idem-12345678'
    })

    expect(mockedTransaction.create).not.toHaveBeenCalled()
    expect(result.idempotencyKey).toBe('idem-12345678')
  })

  it('processes a pending transaction through processing to completed', async () => {
    const transaction = createTransactionDocument()
    mockedTransaction.findById.mockReturnValue({
      populate: jest.fn().mockResolvedValue(transaction)
    } as any)

    const result = await transactionService.processTransaction('507f1f77bcf86cd799439011', {
      blockNumber: 12345,
      fee: '0.01'
    })

    expect(result.status).toBe('completed')
    expect(result.blockNumber).toBe(12345)
    expect(result.completedAt).toBeInstanceOf(Date)
    expect(result.statusHistory.map((entry: any) => entry.status)).toEqual([
      'pending',
      'processing',
      'completed'
    ])
  })

  it('marks a transaction as failed when processing fails', async () => {
    const transaction = createTransactionDocument()
    mockedTransaction.findById.mockReturnValue({
      populate: jest.fn().mockResolvedValue(transaction)
    } as any)

    const result = await transactionService.processTransaction('507f1f77bcf86cd799439011', {
      shouldFail: true,
      failureReason: 'Soroban simulation failed'
    })

    expect(result.status).toBe('failed')
    expect(result.failureReason).toBe('Soroban simulation failed')
    expect(result.statusHistory[result.statusHistory.length - 1]).toEqual(expect.objectContaining({
      status: 'failed',
      reason: 'Soroban simulation failed'
    }))
  })

  it('rejects invalid terminal-state transitions', async () => {
    const transaction = createTransactionDocument({
      status: 'completed',
      statusHistory: [
        { status: 'pending', timestamp: new Date('2026-03-29T00:00:00.000Z') },
        { status: 'completed', timestamp: new Date('2026-03-29T00:02:00.000Z') }
      ]
    })
    mockedTransaction.findById.mockReturnValue({
      populate: jest.fn().mockResolvedValue(transaction)
    } as any)

    await expect(
      transactionService.updateTransactionStatus('507f1f77bcf86cd799439011', {
        status: 'cancelled',
        reason: 'Too late to cancel'
      })
    ).rejects.toMatchObject({
      code: 'VALIDATION_ERROR'
    })
  })

  it('reads transaction status from cache before hitting the database', async () => {
    mockedCache.get.mockResolvedValue({
      _id: '507f1f77bcf86cd799439011',
      hash: 'stellar_hash_1234567890',
      status: 'processing',
      statusHistory: [
        { status: 'pending', timestamp: new Date('2026-03-29T00:00:00.000Z') },
        { status: 'processing', timestamp: new Date('2026-03-29T00:01:00.000Z') }
      ],
      updatedAt: new Date('2026-03-29T00:01:00.000Z')
    } as any)

    const result = await transactionService.getTransactionStatus('507f1f77bcf86cd799439011')

    expect(mockedTransaction.findById).not.toHaveBeenCalled()
    expect(result.status).toBe('processing')
    expect(result.statusHistory).toHaveLength(2)
  })
})
