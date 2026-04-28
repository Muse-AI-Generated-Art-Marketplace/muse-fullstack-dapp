import React from 'react';
import { useTransactionUpdates } from '../hooks/useTransactionUpdates';
import { Loader2, CheckCircle, XCircle, Clock, WifiOff } from 'lucide-react';

interface TransactionStatusDisplayProps {
  transactionHashes: string[];
}

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'pending':
    case 'confirming':
      return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />;
    case 'completed':
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    case 'failed':
      return <XCircle className="h-4 w-4 text-red-500" />;
    default:
      return <Clock className="h-4 w-4 text-gray-500" />;
  }
};

const getStatusText = (status: string) => {
  switch (status) {
    case 'pending':
      return 'Pending submission...';
    case 'confirming':
      return 'Confirming on network...';
    case 'completed':
      return 'Completed!';
    case 'failed':
      return 'Failed!';
    default:
      return 'Unknown status';
  }
};

export const TransactionStatusDisplay: React.FC<TransactionStatusDisplayProps> = ({ transactionHashes }) => {
  const { transactions, isWsConnected, isPolling } = useTransactionUpdates({
    initialTransactions: transactionHashes,
  });

  const activeTransactions = transactions.filter(
    (tx) => tx.status === 'pending' || tx.status === 'confirming'
  );

  if (activeTransactions.length === 0 && !isWsConnected && !isPolling) {
    return null; // Don't show anything if no active transactions and no monitoring
  }

  return (
    <div className="p-4 bg-gray-800 text-white rounded-lg shadow-lg mt-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-lg font-semibold">Transaction Status</h3>
        <span className={`text-sm flex items-center ${isWsConnected ? 'text-green-400' : 'text-yellow-400'}`}>
          {isWsConnected ? 'Real-time Connected' : isPolling ? 'Polling Fallback' : 'Disconnected'}
          {!isWsConnected && <WifiOff className="ml-1 h-4 w-4" />}
        </span>
      </div>
      {activeTransactions.length === 0 ? (
        <p className="text-gray-400">No active transactions.</p>
      ) : (
        <ul className="space-y-2">
          {activeTransactions.map((tx) => (
            <li key={tx.hash} className="flex items-center space-x-2 text-sm">
              {getStatusIcon(tx.status)}
              <span>{getStatusText(tx.status)} (Hash: {tx.hash.substring(0, 8)}...)</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};