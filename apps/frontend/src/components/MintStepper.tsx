import { useState } from 'react'
import { ChevronRight, ChevronLeft, Upload, FileText, Wallet, Check, Sparkles } from 'lucide-react'
import { ErrorHandler, AppError } from '@/utils/errorHandler'
import { ErrorDisplay } from '@/components/ErrorDisplay'

interface Metadata {
  title: string
  description: string
  category: string
  tags: string[]
  price: string
  royalty: string
}

interface FileData {
  file: File | null
  preview: string | null
  type: string
}

interface StepperProps {
  onComplete?: (data: { metadata: Metadata; fileData: FileData }) => void
}

export function MintStepper({ onComplete }: StepperProps) {
  const [currentStep, setCurrentStep] = useState(1)
  const [error, setError] = useState<AppError | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  
  // Metadata state
  const [metadata, setMetadata] = useState<Metadata>({
    title: '',
    description: '',
    category: '',
    tags: [],
    price: '',
    royalty: '10'
  })
  
  // File state
  const [fileData, setFileData] = useState<FileData>({
    file: null,
    preview: null,
    type: ''
  })
  
  // Blockchain state
  const [walletConnected, setWalletConnected] = useState(false)
  const [transactionHash, setTransactionHash] = useState<string | null>(null)

  const steps = [
    { id: 1, title: 'Metadata', icon: FileText, description: 'Add artwork details' },
    { id: 2, title: 'Upload', icon: Upload, description: 'Upload your file' },
    { id: 3, title: 'Sign', icon: Wallet, description: 'Sign transaction' }
  ]

  const validateMetadata = (): boolean => {
    return !!(metadata.title.trim() && 
             metadata.description.trim() && 
             metadata.category && 
             metadata.price.trim())
  }

  const validateFile = (): boolean => {
    return !!(fileData.file && fileData.preview)
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type and size
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4']
    const maxSize = 50 * 1024 * 1024 // 50MB

    if (!allowedTypes.includes(file.type)) {
      setError(ErrorHandler.handle({
        code: 'VALIDATION_ERROR',
        message: 'Invalid file type. Please upload an image or video.',
        userMessage: 'Invalid file type. Please upload an image or video.',
        isRecoverable: false
      }))
      return
    }

    if (file.size > maxSize) {
      setError(ErrorHandler.handle({
        code: 'VALIDATION_ERROR',
        message: 'File too large. Maximum size is 50MB.',
        userMessage: 'File too large. Maximum size is 50MB.',
        isRecoverable: false
      }))
      return
    }

    const reader = new FileReader()
    reader.onload = (e) => {
      setFileData({
        file,
        preview: e.target?.result as string,
        type: file.type
      })
      setError(null)
    }
    reader.readAsDataURL(file)
  }

  const handleNext = () => {
    if (currentStep === 1 && !validateMetadata()) {
      setError(ErrorHandler.handle({
        code: 'VALIDATION_ERROR',
        message: 'Please fill in all required fields',
        userMessage: 'Please fill in all required fields',
        isRecoverable: false
      }))
      return
    }
    
    if (currentStep === 2 && !validateFile()) {
      setError(ErrorHandler.handle({
        code: 'VALIDATION_ERROR',
        message: 'Please upload a file',
        userMessage: 'Please upload a file',
        isRecoverable: false
      }))
      return
    }

    if (currentStep < 3) {
      setCurrentStep(currentStep + 1)
      setError(null)
    }
  }

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
      setError(null)
    }
  }

  const handleConnectWallet = async () => {
    setIsProcessing(true)
    try {
      // Stellar wallet connection logic would go here
      // For now, simulate connection
      await new Promise(resolve => setTimeout(resolve, 2000))
      setWalletConnected(true)
      setError(null)
    } catch (error) {
      const appError = ErrorHandler.handle(error)
      setError(appError)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleSignTransaction = async () => {
    if (!walletConnected) {
      setError(ErrorHandler.handle({
        code: 'WALLET_ERROR',
        message: 'Please connect your wallet first',
        userMessage: 'Please connect your wallet first',
        isRecoverable: false
      }))
      return
    }

    setIsProcessing(true)
    try {
      // Blockchain signing logic would go here
      // For now, simulate signing
      await new Promise(resolve => setTimeout(resolve, 3000))
      
      // Generate mock transaction hash
      const mockHash = '0x' + Array.from({length: 64}, () => Math.floor(Math.random() * 16).toString(16)).join('')
      setTransactionHash(mockHash)
      
      // Call completion callback
      onComplete?.({ metadata, fileData })
    } catch (error) {
      const appError = ErrorHandler.handle(error)
      setError(appError)
    } finally {
      setIsProcessing(false)
    }
  }

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-2">
                Title *
              </label>
              <input
                type="text"
                value={metadata.title}
                onChange={(e) => setMetadata({...metadata, title: e.target.value})}
                placeholder="Enter artwork title"
                className="input w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-2">
                Description *
              </label>
              <textarea
                value={metadata.description}
                onChange={(e) => setMetadata({...metadata, description: e.target.value})}
                placeholder="Describe your artwork..."
                className="input w-full h-32 resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">
                  Category *
                </label>
                <select
                  value={metadata.category}
                  onChange={(e) => setMetadata({...metadata, category: e.target.value})}
                  className="input w-full"
                >
                  <option value="">Select category</option>
                  <option value="digital-art">Digital Art</option>
                  <option value="photography">Photography</option>
                  <option value="illustration">Illustration</option>
                  <option value="3d-art">3D Art</option>
                  <option value="animation">Animation</option>
                  <option value="music">Music</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">
                  Price (ETH) *
                </label>
                <input
                  type="number"
                  value={metadata.price}
                  onChange={(e) => setMetadata({...metadata, price: e.target.value})}
                  placeholder="0.0"
                  step="0.01"
                  min="0"
                  className="input w-full"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-2">
                Tags
              </label>
              <input
                type="text"
                value={metadata.tags.join(', ')}
                onChange={(e) => setMetadata({...metadata, tags: e.target.value.split(',').map(tag => tag.trim()).filter(Boolean)})}
                placeholder="art, digital, creative (comma separated)"
                className="input w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-2">
                Royalty (%)
              </label>
              <input
                type="number"
                value={metadata.royalty}
                onChange={(e) => setMetadata({...metadata, royalty: e.target.value})}
                min="0"
                max="50"
                className="input w-full"
              />
            </div>
          </div>
        )

      case 2:
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-2">
                Upload File *
              </label>
              <div className="border-2 border-dashed border-secondary-300 rounded-lg p-8 text-center hover:border-primary-400 transition-colors">
                <input
                  type="file"
                  onChange={handleFileUpload}
                  accept="image/*,video/mp4"
                  className="hidden"
                  id="file-upload"
                />
                <label htmlFor="file-upload" className="cursor-pointer">
                  {fileData.preview ? (
                    <div className="space-y-4">
                      {fileData.type.startsWith('image/') ? (
                        <img 
                          src={fileData.preview} 
                          alt="Preview" 
                          className="max-h-64 mx-auto rounded-lg"
                        />
                      ) : (
                        <div className="aspect-video bg-gradient-to-br from-primary-100 to-primary-200 rounded-lg flex items-center justify-center">
                          <div className="text-center">
                            <Upload className="h-12 w-12 text-primary-400 mx-auto mb-2" />
                            <p className="text-primary-600">Video uploaded</p>
                          </div>
                        </div>
                      )}
                      <p className="text-sm text-secondary-600">
                        {fileData.file?.name} ({((fileData.file?.size || 0) / 1024 / 1024).toFixed(2)} MB)
                      </p>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault()
                          setFileData({ file: null, preview: null, type: '' })
                        }}
                        className="text-red-600 hover:text-red-700 text-sm"
                      >
                        Remove file
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <Upload className="h-12 w-12 text-secondary-400 mx-auto" />
                      <div>
                        <p className="text-secondary-600">Click to upload or drag and drop</p>
                        <p className="text-sm text-secondary-500">PNG, JPG, GIF, WebP, MP4 (MAX. 50MB)</p>
                      </div>
                    </div>
                  )}
                </label>
              </div>
            </div>

            <div className="card p-4">
              <h4 className="font-medium text-secondary-900 mb-2">File Requirements</h4>
              <ul className="text-sm text-secondary-600 space-y-1">
                <li>• Maximum file size: 50MB</li>
                <li>• Supported formats: PNG, JPG, GIF, WebP, MP4</li>
                <li>• Recommended resolution: 3000x3000 pixels for images</li>
                <li>• Video duration: Max 5 minutes</li>
              </ul>
            </div>
          </div>
        )

      case 3:
        return (
          <div className="space-y-6">
            <div className="card p-6">
              <h3 className="font-semibold text-secondary-900 mb-4">Transaction Summary</h3>
              
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-secondary-600">Artwork</span>
                  <span className="font-medium">{metadata.title}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-secondary-600">Category</span>
                  <span className="font-medium">{metadata.category}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-secondary-600">Price</span>
                  <span className="font-medium">{metadata.price} ETH</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-secondary-600">Royalty</span>
                  <span className="font-medium">{metadata.royalty}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-secondary-600">Minting Fee</span>
                  <span className="font-medium">0.01 ETH</span>
                </div>
                <div className="border-t pt-4">
                  <div className="flex justify-between font-semibold">
                    <span>Total</span>
                    <span>{(parseFloat(metadata.price || '0') + 0.01).toFixed(3)} ETH</span>
                  </div>
                </div>
              </div>
            </div>

            {!walletConnected ? (
              <button
                onClick={handleConnectWallet}
                disabled={isProcessing}
                className="btn-primary w-full py-3 flex items-center justify-center space-x-2"
              >
                {isProcessing ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                    <span>Connecting...</span>
                  </>
                ) : (
                  <>
                    <Wallet className="h-4 w-4" />
                    <span>Connect Wallet</span>
                  </>
                )}
              </button>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center space-x-2 text-green-600">
                  <Check className="h-5 w-5" />
                  <span>Wallet connected</span>
                </div>

                {!transactionHash ? (
                  <button
                    onClick={handleSignTransaction}
                    disabled={isProcessing}
                    className="btn-primary w-full py-3 flex items-center justify-center space-x-2"
                  >
                    {isProcessing ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                        <span>Signing Transaction...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4" />
                        <span>Sign & Mint NFT</span>
                      </>
                    )}
                  </button>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center space-x-2 text-green-600">
                      <Check className="h-5 w-5" />
                      <span>Transaction successful!</span>
                    </div>
                    <div className="card p-4 bg-green-50 border-green-200">
                      <p className="text-sm text-green-800">
                        Transaction Hash: {transactionHash}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold text-secondary-900 mb-8">Create NFT</h1>

      {/* Step Indicator */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-center flex-1">
              <div className="flex items-center">
                <div className={`
                  w-10 h-10 rounded-full flex items-center justify-center
                  ${currentStep >= step.id 
                    ? 'bg-primary-600 text-white' 
                    : 'bg-secondary-200 text-secondary-600'
                  }
                `}>
                  {currentStep > step.id ? (
                    <Check className="h-5 w-5" />
                  ) : (
                    <step.icon className="h-5 w-5" />
                  )}
                </div>
                <div className="ml-3">
                  <p className={`text-sm font-medium ${
                    currentStep >= step.id ? 'text-primary-600' : 'text-secondary-600'
                  }`}>
                    {step.title}
                  </p>
                  <p className="text-xs text-secondary-500">{step.description}</p>
                </div>
              </div>
              {index < steps.length - 1 && (
                <div className={`flex-1 h-0.5 mx-4 ${
                  currentStep > step.id ? 'bg-primary-600' : 'bg-secondary-200'
                }`} />
              )}
            </div>
          ))}
        </div>
      </div>

      {error && (
        <ErrorDisplay
          error={error}
          onDismiss={() => setError(null)}
          showRetry={error.isRecoverable}
        />
      )}

      {/* Step Content */}
      <div className="card p-6 mb-6">
        {renderStepContent()}
      </div>

      {/* Navigation */}
      <div className="flex justify-between">
        <button
          onClick={handlePrevious}
          disabled={currentStep === 1}
          className="btn-secondary px-6 py-2 flex items-center space-x-2 disabled:opacity-50"
        >
          <ChevronLeft className="h-4 w-4" />
          <span>Previous</span>
        </button>

        <div className="flex space-x-2">
          {currentStep < 3 && (
            <button
              onClick={handleNext}
              className="btn-primary px-6 py-2 flex items-center space-x-2"
            >
              <span>Next</span>
              <ChevronRight className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
