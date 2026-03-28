import { render, screen, fireEvent } from '@testing-library/react'
import { FileUpload, FileData } from '../mint/FileUpload'

const emptyFileData: FileData = { file: null, preview: null, type: '' }

const filledFileData: FileData = {
  file: new File(['test'], 'artwork.png', { type: 'image/png' }),
  preview: 'data:image/png;base64,abc',
  type: 'image/png',
}

describe('FileUpload', () => {
  test('renders the drop-zone in empty state', () => {
    render(
      <FileUpload
        fileData={emptyFileData}
        onChange={jest.fn()}
        onClear={jest.fn()}
      />
    )
    expect(screen.getByText('Click to upload or drag and drop')).toBeInTheDocument()
    expect(screen.getByText(/PNG, JPG, GIF, WebP, MP4/)).toBeInTheDocument()
  })

  test('renders file requirements card', () => {
    render(
      <FileUpload
        fileData={emptyFileData}
        onChange={jest.fn()}
        onClear={jest.fn()}
      />
    )
    expect(screen.getByText('File Requirements')).toBeInTheDocument()
    expect(screen.getByText(/Maximum file size: 50MB/)).toBeInTheDocument()
  })

  test('renders preview and file name when a file is loaded', () => {
    render(
      <FileUpload
        fileData={filledFileData}
        onChange={jest.fn()}
        onClear={jest.fn()}
      />
    )
    expect(screen.getByText(/artwork\.png/)).toBeInTheDocument()
    expect(screen.getByRole('img', { name: 'Preview' })).toBeInTheDocument()
  })

  test('calls onClear when "Remove file" is clicked', () => {
    const handleClear = jest.fn()
    render(
      <FileUpload
        fileData={filledFileData}
        onChange={jest.fn()}
        onClear={handleClear}
      />
    )

    fireEvent.click(screen.getByText('Remove file'))
    expect(handleClear).toHaveBeenCalledTimes(1)
  })
})
