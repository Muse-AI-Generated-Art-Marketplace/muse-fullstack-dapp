import { Server as SocketIOServer } from 'socket.io';
import { SorobanRpc, Networks, Transaction } from 'soroban-client';
import { config } from 'dotenv';
import TransactionModel, { TransactionStatus, ITransaction } from '../models/Transaction';

config();

interface MonitoredTransaction {
  hash: string;
  status: TransactionStatus;
  retries: number;
  lastChecked: number;
  // Add any other relevant info
}

const MAX_RETRIES = 10; // Max attempts to check a transaction status
const CHECK_INTERVAL_MS = 5000; // How often to check Horizon for updates
const HORIZON_RPC_URL = process.env.STELLAR_RPC_URL || 'https://soroban-testnet.stellar.org';
const NETWORK_PASSPHRASE = process.env.STELLAR_NETWORK === 'mainnet' ? Networks.PUBLIC : Networks.TESTNET;

class TransactionMonitor {
  private io: SocketIOServer | null = null;
  private monitoredTransactions: Map<string, MonitoredTransaction> = new Map();
  private server: SorobanRpc.Server;
  private intervalId: NodeJS.Timeout | null = null;

  constructor() {
    this.server = new SorobanRpc.Server(HORIZON_RPC_URL, { allowHttp: true });
  }

  public setIo(ioInstance: SocketIOServer) {
    this.io = ioInstance;
    this.startMonitoring();
  }

  public addTransaction(hash: string, initialStatus: TransactionStatus = 'pending') {
    if (!this.monitoredTransactions.has(hash)) {
      this.monitoredTransactions.set(hash, {
        hash,
        status: initialStatus,
        retries: 0,
        lastChecked: Date.now(),
      });
      console.log(`Monitoring new transaction: ${hash} with initial status: ${initialStatus}`);
      this.emitStatusUpdate(hash, initialStatus);
    }
  }

  private startMonitoring() {
    if (this.intervalId) return; // Already running

    this.intervalId = setInterval(async () => {
      if (this.monitoredTransactions.size === 0) return;

      console.log(`Checking status for ${this.monitoredTransactions.size} transactions...`);
      for (const [hash, tx] of this.monitoredTransactions.entries()) {
        if (tx.status === 'completed' || tx.status === 'failed') {
          this.monitoredTransactions.delete(hash);
          continue;
        }

        if (tx.retries >= MAX_RETRIES) {
          console.warn(`Max retries reached for transaction ${hash}. Marking as failed.`);
          await this.updateTransactionStatusInDB(hash, 'failed', 'Max retries reached');
          this.monitoredTransactions.delete(hash);
          continue;
        }

        try {
          const transactionStatus = await this.server.getTransaction(hash);
          let newStatus: TransactionStatus = tx.status;
          if (transactionStatus.status === 'SUCCESS') {
            newStatus = 'completed';
          } else if (transactionStatus.status === 'FAILED') {
            newStatus = 'failed';
          } else if (transactionStatus.status === 'PENDING') {
            newStatus = 'confirming'; // Transaction is known to Horizon, but not yet finalized
          }

          if (newStatus !== tx.status) {
            console.log(`Transaction ${hash} status changed from ${tx.status} to ${newStatus}`);
            await this.updateTransactionStatusInDB(hash, newStatus);
            this.emitStatusUpdate(hash, newStatus);
            tx.status = newStatus;
          }
          tx.retries++;
          tx.lastChecked = Date.now();
        } catch (error: any) {
          console.error(`Error checking transaction ${hash}:`, error.message);
          tx.retries++;
          tx.lastChecked = Date.now();
        }
      }
    }, CHECK_INTERVAL_MS);
  }

  private emitStatusUpdate(hash: string, status: TransactionStatus) {
    if (this.io) {
      this.io.emit('transactionStatusUpdate', { hash, status });
    }
  }

  private async updateTransactionStatusInDB(hash: string, status: TransactionStatus, error?: string) {
    await TransactionModel.findOneAndUpdate(
      { hash },
      { status, ...(error && { error }) },
      { new: true, upsert: true } // Upsert in case it's a new hash not yet in DB
    );
  }

  public stopMonitoring() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }
}

export const transactionMonitor = new TransactionMonitor();