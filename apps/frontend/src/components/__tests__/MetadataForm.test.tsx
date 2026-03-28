import { render, screen, fireEvent } from '@testing-library/react'
import { MetadataForm, Metadata } from '../mint/MetadataForm'

const baseMetadata: Metadata = {
  title: '',
  description: '',
  category: '',
  tags: [],
  price: '',
  royalty: '10',
}

describe('MetadataForm', () => {
  test('renders all required fields', () => {
    render(<MetadataForm metadata={baseMetadata} onChange={jest.fn()} />)
    expect(screen.getByPlaceholderText('Enter artwork title')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Describe your artwork...')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Select category')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('0.0')).toBeInTheDocument()
  })

  test('calls onChange with updated title when title field changes', () => {
    const handleChange = jest.fn()
    render(<MetadataForm metadata={baseMetadata} onChange={handleChange} />)

    fireEvent.change(screen.getByPlaceholderText('Enter artwork title'), {
      target: { value: 'My Art' },
    })

    expect(handleChange).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'My Art' })
    )
  })

  test('calls onChange with updated category when select changes', () => {
    const handleChange = jest.fn()
    render(<MetadataForm metadata={baseMetadata} onChange={handleChange} />)

    fireEvent.change(screen.getByDisplayValue('Select category'), {
      target: { value: 'photography' },
    })

    expect(handleChange).toHaveBeenCalledWith(
      expect.objectContaining({ category: 'photography' })
    )
  })

  test('renders tags as comma-separated string', () => {
    const meta = { ...baseMetadata, tags: ['art', 'digital'] }
    render(<MetadataForm metadata={meta} onChange={jest.fn()} />)
    expect(screen.getByDisplayValue('art, digital')).toBeInTheDocument()
  })

  test('calls onChange with parsed tags array when tags field changes', () => {
    const handleChange = jest.fn()
    render(<MetadataForm metadata={baseMetadata} onChange={handleChange} />)

    fireEvent.change(screen.getByPlaceholderText('art, digital, creative (comma separated)'), {
      target: { value: 'nft, art, creative' },
    })

    expect(handleChange).toHaveBeenCalledWith(
      expect.objectContaining({ tags: ['nft', 'art', 'creative'] })
    )
  })
})
