import React from 'react'
import { CheckCircle2, AlertCircle, Loader2 } from 'lucide-react'

export type TransactionStatusType = 'idle' | 'pending' | 'confirmed' | 'failed'

interface TransactionStatusProps {
    status: TransactionStatusType
    hash?: string | null
    error?: string | null
}

export function TransactionStatus({ status, hash, error }: TransactionStatusProps) {
    if (status === 'idle') return null

    const getStatusConfig = () => {
        switch (status) {
            case 'pending':
                return {
                    icon: <Loader2 className="h-6 w-6 text-primary-600 animate-spin" />,
                    title: 'Transaction Pending',
                    description: 'Waiting for blockchain confirmation...',
                    colorClass: 'text-primary-900',
                    bgColor: 'bg-primary-50',
                    borderColor: 'border-primary-200'
                }
            case 'confirmed':
                return {
                    icon: <CheckCircle2 className="h-6 w-6 text-green-600" />,
                    title: 'Transaction Confirmed',
                    description: 'Your transaction has been successfully processed.',
                    colorClass: 'text-green-900',
                    bgColor: 'bg-green-50',
                    borderColor: 'border-green-200'
                }
            case 'failed':
                return {
                    icon: <AlertCircle className="h-6 w-6 text-red-600" />,
                    title: 'Transaction Failed',
                    description: error || 'The transaction could not be completed.',
                    colorClass: 'text-red-900',
                    bgColor: 'bg-red-50',
                    borderColor: 'border-red-200'
                }
            default:
                return null
        }
    }

    const config = getStatusConfig()
    if (!config) return null

    return (
        <div className={`p-4 rounded-lg border ${config.borderColor} ${config.bgColor} mt-4`}>
            <div className="flex items-center space-x-3">
                {config.icon}
                <div>
                    <h3 className={`font-semibold ${config.colorClass}`}>
                        {config.title}
                    </h3>
                    <p className="text-sm text-secondary-600">
                        {config.description}
                    </p>
                    {hash && status === 'confirmed' && (
                        <p className="text-xs font-mono text-secondary-500 mt-1 break-all">
                            Hash: {hash}
                        </p>
                    )}
                </div>
            </div>
        </div>
    )
}
