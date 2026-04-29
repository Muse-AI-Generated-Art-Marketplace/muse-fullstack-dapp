import localforage from 'localforage';
import { MintArtworkPayload } from './artworkService'; // Assuming this type exists

interface QueuedTransaction {
  id: string; // Unique ID for the queued transaction
  payload: MintArtworkPayload; // The actual transaction data to be sent to the backend
  timestamp: number;
  status: 'pending' | 'syncing' | 'completed' | 'failed';
  error?: string;
}

const OFFLINE_QUEUE_KEY = 'offline_transaction_queue';

class OfflineSyncService {
  private isSyncing: boolean = false;
  private listeners: Set<() => void> = new Set();

  constructor() {
    window.addEventListener('online', this.handleOnlineStatusChange);
    window.addEventListener('offline', this.handleOnlineStatusChange);
    // Attempt to sync immediately if online on service init
    if (navigator.onLine) {
      this.syncTransactions();
    }
  }

  private emitChange() {
    this.listeners.forEach(listener => listener());
  }

  public subscribe(listener: () => void) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  public isOnline(): boolean {
    return navigator.onLine;
  }

  public getIsSyncing(): boolean {
    return this.isSyncing;
  }

  public async getPendingTransactionsCount(): Promise<number> {
    const queue = await this.getQueue();
    return queue.filter(tx => tx.status === 'pending' || tx.status === 'syncing').length;
  }

  private async getQueue(): Promise<QueuedTransaction[]> {
    return (await localforage.getItem<QueuedTransaction[]>(OFFLINE_QUEUE_KEY)) || [];
  }

  private async saveQueue(queue: QueuedTransaction[]): Promise<void> {
    await localforage.setItem(OFFLINE_QUEUE_KEY, queue);
    this.emitChange();
  }

  public async queueTransaction(payload: MintArtworkPayload): Promise<string> {
    const id = `offline-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const newTransaction: QueuedTransaction = {
      id,
      payload,
      timestamp: Date.now(),
      status: 'pending',
    };
    const queue = await this.getQueue();
    queue.push(newTransaction);
    await this.saveQueue(queue);
    console.log(`Transaction ${id} queued for offline sync.`);

    // Register for background sync if supported
    if ('serviceWorker' in navigator && 'SyncManager' in window) {
      try {
        const registration = await navigator.serviceWorker.ready;
        await registration.sync.register('offline-mint-sync');
        console.log('Background sync registered.');
      } catch (e) {
        console.error('Background sync registration failed:', e);
      }
    }

    this.emitChange();
    return id;
  }

  public async syncTransactions(): Promise<void> {
    if (this.isSyncing || !navigator.onLine) {
      return;
    }

    this.isSyncing = true;
    this.emitChange();
    console.log('Starting offline transaction sync...');

    let queue = await this.getQueue();
    for (let i = 0; i < queue.length; i++) {
      let tx = queue[i];
      if (tx.status === 'completed' || tx.status === 'failed') {
        continue; // Skip already processed transactions
      }

      tx.status = 'syncing';
      await this.saveQueue(queue); // Update status in storage

      try {
        // Simulate API call to backend
        // In a real app, this would be a call to artworkService.mintArtwork(tx.payload)
        console.log(`Syncing transaction ${tx.id}...`);
        const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/artworks/mint`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            // Add auth token if necessary
          },
          body: JSON.stringify(tx.payload),
        });

        if (response.ok) {
          tx.status = 'completed';
          console.log(`Transaction ${tx.id} synced successfully.`);
        } else {
          const errorData = await response.json();
          tx.status = 'failed';
          tx.error = errorData.message || 'Unknown error during sync';
          console.error(`Transaction ${tx.id} failed to sync:`, tx.error);
        }
      } catch (error: any) {
        tx.status = 'failed';
        tx.error = error.message || 'Network error during sync';
        console.error(`Transaction ${tx.id} failed to sync due to network error:`, tx.error);
      }
      await this.saveQueue(queue); // Save final status
    }

    // Clean up completed/failed transactions from the queue
    queue = queue.filter(tx => tx.status === 'pending' || tx.status === 'syncing');
    await this.saveQueue(queue);

    this.isSyncing = false;
    this.emitChange();
    console.log('Offline transaction sync completed.');
  }

  private handleOnlineStatusChange = () => {
    if (navigator.onLine) {
      console.log('Browser is online, attempting to sync offline transactions.');
      this.syncTransactions();
    } else {
      console.log('Browser is offline.');
    }
    this.emitChange();
  };
}

export const offlineSyncService = new OfflineSyncService();