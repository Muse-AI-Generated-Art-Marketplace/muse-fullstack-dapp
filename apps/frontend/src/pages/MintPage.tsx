import { useState } from 'react'
import { MintStepper } from '@/components/MintStepper'
import { ErrorHandler, AppError } from '@/utils/errorHandler'
import { ErrorDisplay } from '@/components/ErrorDisplay'
import { OptimizedImage } from '@/components/ui/OptimizedImage'

export function MintPage() {
  const [error, setError] = useState<AppError | null>(null)

  const handleMintComplete = (data: { metadata: any; fileData: any }) => {
    console.log('Minting completed:', data)
    // Handle successful minting - redirect or show success message
    // For now, just log the data
  }

  return (
    <div>
      {error && (
        <ErrorDisplay
          error={error}
          onDismiss={() => setError(null)}
          showRetry={error.isRecoverable}
        />
      )}
      
      <MintStepper onComplete={handleMintComplete} />
    </div>
  )
}
