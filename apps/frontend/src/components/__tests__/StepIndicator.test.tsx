import { render, screen } from '@testing-library/react'
import { FileText, Upload, Wallet } from 'lucide-react'
import { StepIndicator } from '../mint/StepIndicator'

const STEPS = [
  { id: 1, title: 'Metadata', icon: FileText, description: 'Add artwork details' },
  { id: 2, title: 'Upload', icon: Upload, description: 'Upload your file' },
  { id: 3, title: 'Sign', icon: Wallet, description: 'Sign transaction' },
]

describe('StepIndicator', () => {
  test('renders the correct number of steps', () => {
    render(<StepIndicator steps={STEPS} currentStep={1} />)
    expect(screen.getByText('Metadata')).toBeInTheDocument()
    expect(screen.getByText('Upload')).toBeInTheDocument()
    expect(screen.getByText('Sign')).toBeInTheDocument()
  })

  test('applies primary colour class to the active step', () => {
    render(<StepIndicator steps={STEPS} currentStep={2} />)
    const uploadLabel = screen.getByText('Upload')
    expect(uploadLabel.className).toContain('text-primary-600')
  })

  test('completed steps have a check icon (aria-hidden svg)', () => {
    const { container } = render(<StepIndicator steps={STEPS} currentStep={3} />)
    // Steps 1 & 2 are completed – each renders a Check icon (svg)
    const svgs = container.querySelectorAll('svg')
    // Steps 1 & 2 checks + step 3 icon = at least 3
    expect(svgs.length).toBeGreaterThanOrEqual(3)
  })

  test('step descriptions are rendered', () => {
    render(<StepIndicator steps={STEPS} currentStep={1} />)
    expect(screen.getByText('Add artwork details')).toBeInTheDocument()
    expect(screen.getByText('Upload your file')).toBeInTheDocument()
    expect(screen.getByText('Sign transaction')).toBeInTheDocument()
  })
})
