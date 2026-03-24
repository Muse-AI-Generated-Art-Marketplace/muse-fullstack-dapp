# Mint Stepper Integration Guide

## Quick Start

The stepper component is now integrated into your Muse DApp. Here's how to use it:

## 1. Access the Stepper

Navigate to `/mint` route in your application to access the new stepper interface.

## 2. Complete the Flow

### Step 1: Metadata
- Fill in all required fields (title, description, category, price)
- Add optional tags and set royalty percentage
- Click "Next" to proceed

### Step 2: File Upload
- Click the upload area or drag & drop your file
- Supported formats: PNG, JPG, GIF, WebP, MP4
- Maximum size: 50MB
- Preview your file and click "Next"

### Step 3: Blockchain Signing
- Review transaction summary
- Connect your wallet (simulated for demo)
- Sign and mint the NFT
- Receive transaction hash confirmation

## 3. Current Implementation Status

✅ **Completed Features:**
- Full 3-step stepper UI
- Form validation and error handling
- File upload with preview
- Mock wallet connection
- Mock transaction signing
- Responsive design
- TypeScript support

🔄 **Mock Implementations (Ready for Real Integration):**
- Wallet connection (currently simulated)
- Transaction signing (generates mock hash)
- File storage (uses local preview only)

## 4. Next Steps for Production

### Real Blockchain Integration
```typescript
// Replace mock wallet connection in MintStepper.tsx
const handleConnectWallet = async () => {
  // Real Stellar wallet connection
  const { publicKey } = await freighter.connect()
  setWalletConnected(true)
  setPublicKey(publicKey)
}
```

### Real Transaction Signing
```typescript
// Replace mock transaction signing
const handleSignTransaction = async () => {
  const transaction = new Stellar.TransactionBuilder(...)
  const signedTx = await freighter.signTransaction(transaction)
  const result = await horizon.submitTransaction(signedTx)
  setTransactionHash(result.hash)
}
```

### IPFS File Storage
```typescript
// Replace local file preview with IPFS upload
const handleFileUpload = async (file: File) => {
  const ipfsHash = await uploadToIPFS(file)
  setFileData({ file, preview: ipfsHash, type: file.type })
}
```

## 5. Testing

Run the test suite:
```bash
npm test -- MintStepper
```

## 6. Customization

### Adding New Steps
1. Update the `steps` array in MintStepper.tsx
2. Add corresponding case in `renderStepContent()`
3. Update validation logic in `handleNext()`

### Custom Validation
```typescript
const validateCustomField = (): boolean => {
  return metadata.customField.trim() !== ''
}
```

### Styling Changes
Modify Tailwind classes in the component to match your design system.

## 7. Error Handling

The stepper uses the existing ErrorHandler utility. Custom errors can be added:
```typescript
setError(ErrorHandler.handle({
  code: 'CUSTOM_ERROR',
  message: 'Detailed error message',
  userMessage: 'User-friendly message',
  isRecoverable: true
}))
```

## 8. Performance Considerations

- File uploads are processed client-side for preview
- Large files should be uploaded in chunks for production
- Consider adding progress indicators for uploads
- Implement debouncing for form validation

## 9. Security Notes

- File type validation is client-side only (add server-side validation)
- Wallet operations should be confirmed by user
- Transaction data should be sanitized before blockchain submission

## 10. Browser Support

The stepper works in all modern browsers supporting:
- ES6+ JavaScript
- File API
- FormData API
- CSS Grid and Flexbox

For older browsers, consider adding polyfills for:
- Promise
- FileReader
- Array.prototype.includes
