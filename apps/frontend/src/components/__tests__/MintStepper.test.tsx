import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MintStepper } from '../MintStepper'

// Mock the errorHandler
jest.mock('@/utils/errorHandler', () => ({
  ErrorHandler: {
    handle: jest.fn((error) => ({
      code: 'TEST_ERROR',
      message: error.message || 'Test error',
      userMessage: 'Test error message',
      isRecoverable: true
    }))
  },
  AppError: {} as any
}))

// Mock ErrorDisplay
jest.mock('../ErrorDisplay', () => ({
  ErrorDisplay: ({ error, onDismiss }: any) => (
    <div data-testid="error-display">
      <span>{error.userMessage}</span>
      <button onClick={onDismiss}>Dismiss</button>
    </div>
  )
}))

describe('MintStepper', () => {
  const mockOnComplete = jest.fn()

  beforeEach(() => {
    mockOnComplete.mockClear()
  })

  test('renders stepper with 3 steps', () => {
    render(<MintStepper onComplete={mockOnComplete} />)
    
    expect(screen.getByText('Metadata')).toBeInTheDocument()
    expect(screen.getByText('Upload')).toBeInTheDocument()
    expect(screen.getByText('Sign')).toBeInTheDocument()
  })

  test('validates required metadata fields', async () => {
    render(<MintStepper onComplete={mockOnComplete} />)
    
    // Try to proceed without filling required fields
    const nextButton = screen.getByText('Next')
    fireEvent.click(nextButton)
    
    // Should show validation error
    await waitFor(() => {
      expect(screen.getByTestId('error-display')).toBeInTheDocument()
    })
  })

  test('allows navigation between steps', async () => {
    render(<MintStepper onComplete={mockOnComplete} />)
    
    // Fill required metadata
    fireEvent.change(screen.getByPlaceholderText('Enter artwork title'), {
      target: { value: 'Test Artwork' }
    })
    fireEvent.change(screen.getByPlaceholderText('Describe your artwork...'), {
      target: { value: 'Test description' }
    })
    fireEvent.change(screen.getByDisplayValue('Select category'), {
      target: { value: 'digital-art' }
    })
    fireEvent.change(screen.getByPlaceholderText('0.0'), {
      target: { value: '1.5' }
    })
    
    // Proceed to next step
    const nextButton = screen.getByText('Next')
    fireEvent.click(nextButton)
    
    await waitFor(() => {
      expect(screen.getByText('Upload File')).toBeInTheDocument()
    })
    
    // Go back to previous step
    const prevButton = screen.getByText('Previous')
    fireEvent.click(prevButton)
    
    await waitFor(() => {
      expect(screen.getByDisplayValue('Test Artwork')).toBeInTheDocument()
    })
  })

  test('handles file upload', async () => {
    render(<MintStepper onComplete={mockOnComplete} />)
    
    // Fill metadata and proceed to upload step
    fireEvent.change(screen.getByPlaceholderText('Enter artwork title'), {
      target: { value: 'Test Artwork' }
    })
    fireEvent.change(screen.getByPlaceholderText('Describe your artwork...'), {
      target: { value: 'Test description' }
    })
    fireEvent.change(screen.getByDisplayValue('Select category'), {
      target: { value: 'digital-art' }
    })
    fireEvent.change(screen.getByPlaceholderText('0.0'), {
      target: { value: '1.5' }
    })
    
    fireEvent.click(screen.getByText('Next'))
    
    await waitFor(() => {
      expect(screen.getByText('Upload File')).toBeInTheDocument()
    })
    
    // Create a test file
    const file = new File(['test'], 'test.png', { type: 'image/png' })
    const input = screen.getByLabelText(/upload file/i) || screen.getByRole('button')
    
    // Simulate file upload
    fireEvent.change(input, { target: { files: [file] } })
    
    await waitFor(() => {
      expect(screen.getByText('test.png')).toBeInTheDocument()
    })
  })

  test('completes the full flow', async () => {
    render(<MintStepper onComplete={mockOnComplete} />)
    
    // Step 1: Fill metadata
    fireEvent.change(screen.getByPlaceholderText('Enter artwork title'), {
      target: { value: 'Test Artwork' }
    })
    fireEvent.change(screen.getByPlaceholderText('Describe your artwork...'), {
      target: { value: 'Test description' }
    })
    fireEvent.change(screen.getByDisplayValue('Select category'), {
      target: { value: 'digital-art' }
    })
    fireEvent.change(screen.getByPlaceholderText('0.0'), {
      target: { value: '1.5' }
    })
    
    fireEvent.click(screen.getByText('Next'))
    
    // Step 2: Upload file
    await waitFor(() => {
      expect(screen.getByText('Upload File')).toBeInTheDocument()
    })
    
    const file = new File(['test'], 'test.png', { type: 'image/png' })
    const input = screen.getByLabelText(/upload file/i) || screen.getByRole('button')
    fireEvent.change(input, { target: { files: [file] } })
    
    await waitFor(() => {
      expect(screen.getByText('test.png')).toBeInTheDocument()
    })
    
    fireEvent.click(screen.getByText('Next'))
    
    // Step 3: Sign transaction
    await waitFor(() => {
      expect(screen.getByText('Transaction Summary')).toBeInTheDocument()
    })
    
    // Connect wallet
    fireEvent.click(screen.getByText('Connect Wallet'))
    
    await waitFor(() => {
      expect(screen.getByText('Wallet connected')).toBeInTheDocument()
    })
    
    // Sign transaction
    fireEvent.click(screen.getByText('Sign & Mint NFT'))
    
    await waitFor(() => {
      expect(screen.getByText('Transaction successful!')).toBeInTheDocument()
    }, { timeout: 4000 })
    
    // Check if onComplete was called
    expect(mockOnComplete).toHaveBeenCalledWith(
      expect.objectContaining({
        metadata: expect.objectContaining({
          title: 'Test Artwork',
          description: 'Test description',
          category: 'digital-art',
          price: '1.5'
        }),
        fileData: expect.objectContaining({
          file: expect.any(File),
          preview: expect.any(String)
        })
      })
    )
  })
})
