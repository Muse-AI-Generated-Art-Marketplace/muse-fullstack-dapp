import React from 'react';
import { useOfflineStatus } from '../hooks/useOfflineStatus';
import { WifiOff, Cloud, CheckCircle2, Loader2 } from 'lucide-react';

export const OfflineSyncIndicator: React.FC = () => {
  const { isOnline, isSyncing, pendingTransactionsCount } = useOfflineStatus();

  if (isOnline && !isSyncing && pendingTransactionsCount === 0) {
    return null; // Don't show anything if online, not syncing, and no pending transactions
  }

  let icon;
  let message;
  let bgColor;

  if (!isOnline) {
    icon = <WifiOff className="h-4 w-4" />;
    message = 'You are offline.';
    bgColor = 'bg-red-500';
  } else if (isSyncing) {
    icon = <Loader2 className="h-4 w-4 animate-spin" />;
    message = `Syncing transactions... (${pendingTransactionsCount} pending)`;
    bgColor = 'bg-blue-500';
  } else if (pendingTransactionsCount > 0) {
    icon = <Cloud className="h-4 w-4" />;
    message = `Online, but ${pendingTransactionsCount} transactions pending sync.`;
    bgColor = 'bg-yellow-500';
  } else {
    icon = <CheckCircle2 className="h-4 w-4" />;
    message = 'All transactions synced!';
    bgColor = 'bg-green-500';
  }

  return (
    <div className={`fixed bottom-4 left-1/2 -translate-x-1/2 p-3 rounded-lg shadow-lg text-white flex items-center space-x-2 z-50 ${bgColor}`}>
      {icon}
      <span className="text-sm font-medium">{message}</span>
    </div>
  );
};