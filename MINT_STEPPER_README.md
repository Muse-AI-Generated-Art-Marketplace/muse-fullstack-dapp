# Mint Stepper Component Documentation

## Overview
The `MintStepper` component provides a comprehensive 3-step wizard for creating NFTs with metadata input, file upload, and blockchain signing functionality.

## Features

### Step 1: Metadata Input
- **Title**: Required field for artwork name
- **Description**: Required field for artwork details
- **Category**: Dropdown selection (Digital Art, Photography, Illustration, 3D Art, Animation, Music)
- **Price**: Required field in ETH
- **Tags**: Comma-separated tag input
- **Royalty**: Percentage setting (0-50%)

### Step 2: File Upload
- **Supported formats**: PNG, JPG, GIF, WebP, MP4
- **Maximum file size**: 50MB
- **Preview functionality**: Shows image preview or video placeholder
- **Validation**: File type and size validation with error handling

### Step 3: Blockchain Signing
- **Transaction summary**: Displays all metadata and pricing details
- **Wallet connection**: Simulated wallet connection flow
- **Transaction signing**: Mock blockchain signing with transaction hash generation
- **Success confirmation**: Shows transaction hash on completion

## Component Structure

```typescript
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
```

## Usage Example

```tsx
import { MintStepper } from '@/components/MintStepper'

function MintPage() {
  const handleMintComplete = (data: { metadata: any; fileData: any }) => {
    console.log('Minting completed:', data)
    // Handle successful minting - redirect or show success message
  }

  return <MintStepper onComplete={handleMintComplete} />
}
```

## Error Handling

The component integrates with the existing `ErrorHandler` utility to provide:
- Validation errors for required fields
- File upload errors (type, size validation)
- Wallet connection errors
- Transaction signing errors

## Styling

Uses Tailwind CSS with existing design system:
- `btn-primary`, `btn-secondary` for buttons
- `input`, `card` for form elements
- Consistent color scheme with `primary-*` and `secondary-*` classes
- Responsive design with proper breakpoints

## State Management

Component uses React hooks for state management:
- `useState` for form data, step navigation, and UI states
- Form validation before step transitions
- Loading states for async operations

## Integration Points

### Error Handling
- Uses `ErrorHandler.handle()` for consistent error formatting
- Integrates with `ErrorDisplay` component for error presentation

### Blockchain Integration
- Currently uses mock implementation for wallet connection
- Ready for Stellar SDK integration (`@stellar/stellar-sdk`, `@stellar/freighter-api`)
- Placeholder for actual transaction signing logic

### File Storage
- Uses FileReader API for local preview
- Ready for IPFS or other decentralized storage integration

## Future Enhancements

1. **Real Blockchain Integration**
   - Connect to Stellar network
   - Implement actual transaction signing
   - Add network fee calculation

2. **File Storage Integration**
   - IPFS upload for decentralized storage
   - Progress indicators for large files
   - Multiple file support

3. **Enhanced Validation**
   - Real-time metadata validation
   - Duplicate content detection
   - Content moderation checks

4. **User Experience**
   - Auto-save functionality
   - Step progress persistence
   - Mobile optimization improvements

## Technical Notes

- TypeScript strict mode enabled
- Accessible form elements with proper labels
- Responsive design patterns
- Component composition with existing UI library
- Error boundary integration

## Dependencies

- React 18+ with hooks
- Lucide React for icons
- Tailwind CSS for styling
- Existing error handling utilities
- TypeScript for type safety
