import * as StellarSdk from 'stellar-sdk'
import { Networks } from 'stellar-sdk'
import { AppError, createExternalServiceError } from '@/middleware/errorHandler'
import { createLogger } from '@/utils/logger'

const logger = createLogger('StellarService')

export interface StellarConfig {
  network: 'testnet' | 'mainnet' | 'standalone'
  rpcUrl: string
  contractId?: string
}

/** Wrap raw errors from Stellar SDK into typed AppErrors */
const wrapStellarError = (context: string, error: unknown): AppError => {
  const message = error instanceof Error ? error.message : String(error)
  logger.error(`[${context}] ${message}`)
  return createExternalServiceError('Stellar', `${context}: ${message}`)
}

export class StellarService {
  private server: StellarSdk.SorobanRpc.Server
  private network: 'testnet' | 'mainnet' | 'standalone'
  private contractId?: string

  constructor(config: StellarConfig) {
    this.network = config.network
    this.server = new StellarSdk.SorobanRpc.Server(config.rpcUrl)
    this.contractId = config.contractId
  }

  getNetworkPassphrase(): string {
    switch (this.network) {
      case 'testnet':
        return Networks.TESTNET
      case 'mainnet':
        return Networks.PUBLIC
      case 'standalone':
        return 'Standalone Network ; February 2017'
      default:
        throw createExternalServiceError('Stellar', `Unsupported network: ${this.network}`)
    }
  }

  async getAccount(publicKey: string): Promise<StellarSdk.Account> {
    try {
      return await this.server.getAccount(publicKey)
    } catch (error) {
      throw wrapStellarError(`getAccount(${publicKey})`, error)
    }
  }

  async getAccountBalance(publicKey: string): Promise<string> {
    try {
      const account = await this.getAccount(publicKey)
      const balance =
        ((account as any).balances as any[] | undefined)?.find((b: any) => b.asset_type === 'native')?.balance ?? '0'
      return balance
    } catch (error) {
      if (error instanceof AppError) throw error
      throw wrapStellarError('getAccountBalance', error)
    }
  }

  async submitTransaction(transaction: StellarSdk.Transaction): Promise<{
    hash: string
    status: 'success' | 'pending' | 'error'
    error?: string
  }> {
    try {
      const result = await this.server.sendTransaction(transaction)

      if (result.status === 'PENDING') {
        await this.server.getTransaction(result.hash)
        return { hash: result.hash, status: 'success' }
      }

      return { hash: result.hash, status: 'error', error: result.status }
    } catch (error) {
      if (error instanceof AppError) throw error
      throw wrapStellarError('submitTransaction', error)
    }
  }

  createContractCall(
    contractId: string,
    method: string,
    params: any[] = [],
    publicKey: string
  ): StellarSdk.Transaction {
    const contract = new StellarSdk.Contract(contractId)
    const account = new StellarSdk.Account(publicKey, '-1')
    const operation = contract.call(method, ...params)

    return new StellarSdk.TransactionBuilder(account, {
      fee: StellarSdk.BASE_FEE,
      networkPassphrase: this.getNetworkPassphrase(),
    })
      .addOperation(operation)
      .setTimeout(30)
      .build()
  }

  async callContractMethod(
    contractId: string,
    method: string,
    params: any[] = [],
    publicKey: string
  ): Promise<any> {
    try {
      const transaction = this.createContractCall(contractId, method, params, publicKey)
      const result = await this.server.simulateTransaction(transaction) as any

      // stellar-sdk v11: success response has 'results' array
      if (result.results && Array.isArray(result.results) && result.results.length > 0) {
        const callResult = result.results[0]
        if (callResult.xdr) {
          const scVal = StellarSdk.xdr.ScVal.fromXDR(callResult.xdr, 'base64')
          return this.parseScVal(scVal)
        }
      }

      throw createExternalServiceError('Stellar', `No result returned from contract method ${method}`)
    } catch (error) {
      if (error instanceof AppError) throw error
      throw wrapStellarError(`callContractMethod(${method})`, error)
    }
  }

  private parseScVal(scVal: StellarSdk.xdr.ScVal): any {
    const switchVal = (scVal.switch as any)()
    const T = StellarSdk.xdr.ScValType
    switch (switchVal) {
      case T.scvVoid(): return null
      case T.scvBool(): return (scVal as any).bool()
      case T.scvI32(): return (scVal as any).i32()
      case T.scvI64(): return (scVal as any).i64().toString()
      case T.scvU32(): return (scVal as any).u32()
      case T.scvU64(): return (scVal as any).u64().toString()
      case T.scvString(): return (scVal as any).str().toString()
      case T.scvSymbol(): return (scVal as any).sym().toString()
      case T.scvAddress(): return (scVal as any).address().toString()
      case T.scvMap(): {
        const map = new Map()
        ;(scVal as any).map()?.forEach((entry: any) => {
          map.set(this.parseScVal(entry.key()), this.parseScVal(entry.val()))
        })
        return map
      }
      case T.scvVec():
        return (scVal as any).vec()?.map((val: any) => this.parseScVal(val)) ?? []
      default:
        return scVal
    }
  }

  async getArtworks(contractId: string): Promise<any[]> {
    try {
      const result = await this.callContractMethod(contractId, 'get_active_listings', [], '')
      return Array.isArray(result) ? result : []
    } catch (error) {
      logger.error('Failed to get artworks from contract', { error })
      return []
    }
  }

  async getArtwork(contractId: string, artworkId: number): Promise<any> {
    try {
      return await this.callContractMethod(contractId, 'get_artwork', [artworkId], '')
    } catch (error) {
      if (error instanceof AppError) throw error
      throw wrapStellarError(`getArtwork(${artworkId})`, error)
    }
  }

  async getUserArtworks(contractId: string, publicKey: string): Promise<any[]> {
    try {
      const result = await this.callContractMethod(contractId, 'get_user_artworks', [publicKey], publicKey)
      return Array.isArray(result) ? result : []
    } catch (error) {
      logger.error('Failed to get user artworks from contract', { publicKey, error })
      return []
    }
  }

  async createArtwork(
    contractId: string, creator: string, title: string, description: string,
    imageUrl: string, prompt: string, aiModel: string, price: string, royaltyBps: number
  ): Promise<string> {
    try {
      const tx = this.createContractCall(
        contractId, 'create_artwork',
        [creator, title, description, imageUrl, prompt, aiModel, price, royaltyBps],
        creator
      )
      const result = await this.submitTransaction(tx)
      return result.hash
    } catch (error) {
      if (error instanceof AppError) throw error
      throw wrapStellarError('createArtwork', error)
    }
  }

  async listArtwork(
    contractId: string, seller: string, artworkId: number, price: string, duration: number
  ): Promise<string> {
    try {
      const tx = this.createContractCall(contractId, 'list_artwork', [seller, artworkId, price, duration], seller)
      const result = await this.submitTransaction(tx)
      return result.hash
    } catch (error) {
      if (error instanceof AppError) throw error
      throw wrapStellarError('listArtwork', error)
    }
  }

  async buyArtwork(contractId: string, buyer: string, listingId: number, amount: string): Promise<string> {
    try {
      const tx = this.createContractCall(contractId, 'buy_artwork', [buyer, listingId, amount], buyer)
      const result = await this.submitTransaction(tx)
      return result.hash
    } catch (error) {
      if (error instanceof AppError) throw error
      throw wrapStellarError('buyArtwork', error)
    }
  }

  async makeOffer(
    contractId: string, offeror: string, listingId: number, amount: string, duration: number
  ): Promise<string> {
    try {
      const tx = this.createContractCall(contractId, 'make_offer', [offeror, listingId, amount, duration], offeror)
      const result = await this.submitTransaction(tx)
      return result.hash
    } catch (error) {
      if (error instanceof AppError) throw error
      throw wrapStellarError('makeOffer', error)
    }
  }

  async acceptOffer(contractId: string, seller: string, listingId: number, offerIndex: number): Promise<string> {
    try {
      const tx = this.createContractCall(contractId, 'accept_offer', [seller, listingId, offerIndex], seller)
      const result = await this.submitTransaction(tx)
      return result.hash
    } catch (error) {
      if (error instanceof AppError) throw error
      throw wrapStellarError('acceptOffer', error)
    }
  }
}

// Singleton
let stellarService: StellarService

export function getStellarService(): StellarService {
  if (!stellarService) {
    const config: StellarConfig = {
      network: (process.env.STELLAR_NETWORK as 'testnet' | 'mainnet') || 'testnet',
      rpcUrl: process.env.STELLAR_RPC_URL || 'https://soroban-testnet.stellar.org',
      contractId: process.env.STELLAR_CONTRACT_ID,
    }
    stellarService = new StellarService(config)
  }
  return stellarService
}
