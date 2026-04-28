import { useState, useEffect, useCallback } from 'react';
import { websocketService } from '../services/websocketService';
import { featureDetection } from '../utils/featureDetection';

interface TransactionStatus {
  hash: string;
  status: 'pending' | 'confirming' | 'completed' | 'failed';
  timestamp: number;
}

interface UseTransactionUpdatesOptions {
  initialTransactions?: string[]; // Array of transaction hashes to monitor
  pollingInterval?: number; // Interval for polling fallback in ms
}

/**
 * Custom hook for real-time transaction status updates.
 * Uses WebSockets if available, falls back to polling.
 */
export const useTransactionUpdates = ({
  initialTransactions = [],
  pollingInterval = 10000, // Default to 10 seconds
}: UseTransactionUpdatesOptions = {}) => {
  const [transactions, setTransactions] = useState<TransactionStatus[]>([]);
  const [isWsConnected, setIsWsConnected] = useState(false);
  const [isPolling, setIsPolling] = useState(false);

  const updateTransaction = useCallback((hash: string, status: TransactionStatus['status']) => {
    setTransactions((prev) => {
      const existingTx = prev.find((tx) => tx.hash === hash);
      if (existingTx) {
        // Only update if status is more "advanced" or different
        const statusOrder = ['pending', 'confirming', 'completed', 'failed'];
        if (statusOrder.indexOf(status) > statusOrder.indexOf(existingTx.status)) {
          return prev.map((tx) => (tx.hash === hash ? { ...tx, status, timestamp: Date.now() } : tx));
        }
        return prev;
      } else {
        return [...prev, { hash, status, timestamp: Date.now() }];
      }
    });
  }, []);

  // Initialize transactions from initialTransactions prop
  useEffect(() => {
    setTransactions((prev) => {
      const newTxs = initialTransactions
        .filter((hash) => !prev.some((tx) => tx.hash === hash))
        .map((hash) => ({ hash, status: 'pending', timestamp: Date.now() }));
      return [...prev, ...newTxs];
    });
  }, [initialTransactions]);

  // WebSocket logic
  useEffect(() => {
    if (featureDetection.hasWebSocketSupport()) {
      websocketService.connect();

      const handleConnect = () => setIsWsConnected(true);
      const handleDisconnect = () => setIsWsConnected(false);
      const handleStatusUpdate = (update: { hash: string; status: TransactionStatus['status'] }) => {
        updateTransaction(update.hash, update.status);
      };

      websocketService.socket?.on('connect', handleConnect);
      websocketService.socket?.on('disconnect', handleDisconnect);
      websocketService.onTransactionStatusUpdate(handleStatusUpdate);

      return () => {
        websocketService.socket?.off('connect', handleConnect);
        websocketService.socket?.off('disconnect', handleDisconnect);
        websocketService.offTransactionStatusUpdate(handleStatusUpdate);
        websocketService.disconnect();
      };
    } else {
      console.warn('WebSockets not supported, falling back to polling.');
      setIsPolling(true);
    }
  }, [updateTransaction]);

  // Polling fallback logic
  useEffect(() => {
    if (isPolling && !isWsConnected) {
      const interval = setInterval(async () => {
        // In a real app, you'd fetch transaction statuses from your backend API here
        // For now, we'll just log that polling is happening
        console.log(`Polling for transaction updates for ${transactions.length} transactions...`);
        // Example: const response = await fetch(`/api/transactions/status?hashes=${transactions.map(t => t.hash).join(',')}`);
        // const data = await response.json();
        // data.forEach(tx => updateTransaction(tx.hash, tx.status));
      }, pollingInterval);
      return () => clearInterval(interval);
    }
  }, [isPolling, isWsConnected, pollingInterval, transactions]);

  return { transactions, isWsConnected, isPolling, updateTransaction };
};