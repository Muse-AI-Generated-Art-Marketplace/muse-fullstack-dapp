import { useState, useEffect } from 'react';
import { offlineSyncService } from '../services/offlineSyncService';

interface OfflineStatus {
  isOnline: boolean;
  isSyncing: boolean;
  pendingTransactionsCount: number;
}

/**
 * Custom hook to provide real-time offline and sync status.
 */
export const useOfflineStatus = (): OfflineStatus => {
  const [status, setStatus] = useState<OfflineStatus>({
    isOnline: offlineSyncService.isOnline(),
    isSyncing: offlineSyncService.getIsSyncing(),
    pendingTransactionsCount: 0,
  });

  useEffect(() => {
    const updateStatus = async () => {
      setStatus({
        isOnline: offlineSyncService.isOnline(),
        isSyncing: offlineSyncService.getIsSyncing(),
        pendingTransactionsCount: await offlineSyncService.getPendingTransactionsCount(),
      });
    };

    updateStatus(); // Initial update
    const unsubscribe = offlineSyncService.subscribe(updateStatus);
    return () => unsubscribe();
  }, []);

  return status;
};