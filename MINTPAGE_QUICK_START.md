# MintPage Quick Start Guide

## 🚀 Quick Setup

### 1. Install Dependencies
```bash
cd apps/frontend
npm install
```

### 2. Environment Variables
Create `.env` file in `apps/frontend/`:
```env
VITE_API_URL=http://localhost:3001
```

### 3. Start Development Server
```bash
npm run dev
```

## 📋 Component Usage

### Basic MintPage Integration

```tsx
import { MintPage } from '@/pages/MintPage'
import { BrowserRouter, Route, Routes } from 'react-router-dom'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/mint" element={<MintPage />} />
      </Routes>
    </BrowserRouter>
  )
}
```

### Using MintStepper Standalone

```tsx
import { MintStepper } from '@/components/MintStepper'

function CustomMintPage() {
  const handleComplete = (data) => {
    console.log('Minting:', data)
    // Handle minting logic
  }

  return (
    <MintStepper 
      onComplete={handleComplete}
      onCancel={() => navigate('/')}
      isSubmitting={false}
    />
  )
}
```

## 🎨 UI Components

### Button
```tsx
import { Button } from '@/components/ui/Button'

<Button variant="primary" size="md" isLoading={false}>
  Click Me
</Button>
```

**Variants:** `primary`, `secondary`, `outline`, `ghost`, `danger`  
**Sizes:** `sm`, `md`, `lg`

### Card
```tsx
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'

<Card variant="elevated" padding="lg">
  <CardHeader>
    <CardTitle>Title</CardTitle>
  </CardHeader>
  <CardContent>
    Content here
  </CardContent>
</Card>
```

### Input
```tsx
import { Input, Textarea, Select } from '@/components/ui/Input'

<Input 
  label="Title"
  placeholder="Enter title"
  value={value}
  onChange={(e) => setValue(e.target.value)}
  error={error}
  helperText="Helper text"
  fullWidth
/>
```

## 🔌 API Integration

### AI Service
```tsx
import aiService from '@/services/aiService'

// Generate image
const response = await aiService.generateImage({
  prompt: "A beautiful landscape",
  style: "digital-art",
  quality: "standard"
})

// Poll for completion
const result = await aiService.pollGenerationStatus(
  response.generationId,
  (status) => console.log(status.progress)
)
```

### Artwork Service
```tsx
import artworkService from '@/services/artworkService'

// Mint artwork
const result = await artworkService.mintArtwork({
  title: "My Art",
  description: "Description",
  imageUrl: "https://...",
  price: "10",
  currency: "XLM",
  category: "digital",
  creatorPublicKey: "G..."
})
```

## 🎯 Form Data Structure

```typescript
interface CreateArtworkForm {
  title: string              // Required
  description: string        // Required
  imageUrl: string          // Required (from AI generation)
  price: string             // Required (must be > 0)
  currency: string          // Required (XLM, USDC)
  category: string          // Required
  prompt?: string           // Optional (AI prompt)
  aiModel?: string          // Optional (AI style)
  attributes?: Array<{      // Optional
    trait_type: string
    value: string | number
  }>
}
```

## 🔄 Minting Flow

1. **User lands on MintPage** → Check wallet connection
2. **Step 1: Generate Art** → Enter prompt, select style, generate
3. **Step 2: Add Details** → Enter title, description, category
4. **Step 3: Set Price** → Enter price and currency
5. **Step 4: Review** → Review all data
6. **Mint** → Submit to blockchain
7. **Success** → Redirect to artwork page

## 🎨 Styling

The components use Tailwind CSS with custom color scheme:

```css
/* Primary colors */
primary-50 to primary-900

/* Secondary colors */
secondary-50 to secondary-900

/* Utility classes */
.btn, .btn-primary, .btn-secondary, .btn-outline
```

## 🐛 Common Issues

### Issue: Wallet not connecting
**Solution:** Ensure Freighter wallet is installed and unlocked

### Issue: AI generation fails
**Solution:** Check backend API is running and VITE_API_URL is correct

### Issue: TypeScript errors
**Solution:** Run `npm install` to ensure all dependencies are installed

### Issue: Styles not applying
**Solution:** Ensure Tailwind CSS is configured and imported in main.tsx

## 📝 Validation Rules

- **Title:** Required, non-empty
- **Description:** Required, non-empty
- **Image:** Required (generated or uploaded)
- **Price:** Required, must be > 0
- **Category:** Required, must be from predefined list
- **Attributes:** Optional, trait_type and value required if adding

## 🔐 Security Notes

1. Never expose private keys in frontend code
2. All transactions signed through Freighter wallet
3. Validate all inputs before submission
4. Use HTTPS in production
5. Implement rate limiting on backend

## 📱 Responsive Design

The MintPage is fully responsive:
- **Mobile:** Single column, stacked layout
- **Tablet:** Optimized spacing
- **Desktop:** Full-width with max-width constraints

## 🎯 Key Features

✅ AI art generation with multiple styles  
✅ Real-time generation progress  
✅ Multi-step form with validation  
✅ Custom metadata attributes  
✅ Price and currency selection  
✅ Wallet integration  
✅ Transaction status tracking  
✅ Error handling and recovery  
✅ Success flow with navigation  
✅ Responsive design  

## 📚 Related Documentation

- [Full Implementation Guide](./MINTPAGE_IMPLEMENTATION.md)
- [MintStepper Component](./MINT_STEPPER_README.md)
- [Error Handling](./ERROR_HANDLING.md)
- [Integration Guide](./INTEGRATION_GUIDE.md)

## 🆘 Support

For issues or questions:
1. Check the full implementation guide
2. Review error messages in console
3. Verify API endpoints are accessible
4. Check wallet connection status

## ✨ Tips for Best Results

1. **AI Prompts:** Be specific and descriptive
2. **Pricing:** Research market rates
3. **Metadata:** Add detailed descriptions
4. **Attributes:** Use meaningful trait names
5. **Testing:** Test on testnet first

---

**Ready to mint?** Navigate to `/mint` and start creating! 🎨
