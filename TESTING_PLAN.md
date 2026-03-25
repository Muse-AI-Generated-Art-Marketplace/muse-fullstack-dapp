# Image Optimization Testing Plan

## Test Environment Setup

Since Node.js is not available in the current environment, here's a comprehensive testing plan for the image optimization implementation.

## Frontend Tests

### Component Tests
```bash
# Install frontend dependencies
cd apps/frontend
npm install

# Run tests
npm test
```

#### Test Cases for OptimizedImage Component:
1. **Basic Rendering**
   - Component renders without crashing
   - Props are passed correctly
   - Default values work as expected

2. **Lazy Loading**
   - Image loads only when in viewport
   - Intersection observer triggers correctly
   - Loading state displays properly

3. **Error Handling**
   - Failed image requests show error state
   - Retry functionality works
   - Fallback placeholders display

4. **Progressive Enhancement**
   - Blur placeholders show initially
   - Smooth transition to loaded image
   - Loading states update correctly

### Integration Tests
```bash
# Test ArtworkCard integration
cd apps/frontend
npm run test:integration
```

#### Test Cases:
1. **ArtworkCard Integration**
   - OptimizedImage renders in all variants (compact, detailed, default)
   - Props cascade correctly
   - Error boundaries work

2. **Page Integration**
   - HomePage displays optimized images
   - MintPage generates and displays optimized images
   - Layout stability maintained

## Backend Tests

### API Tests
```bash
# Install backend dependencies
cd apps/backend
npm install

# Run tests
npm test
```

#### Test Cases for Image Optimizer API:

1. **Basic Functionality**
   ```http
   GET /api/image-optimizer?url=https://picsum.photos/600/600
   ```
   - Returns optimized image
   - Correct headers set
   - Proper content type

2. **Parameter Testing**
   ```http
   GET /api/image-optimizer?url=https://picsum.photos/600/600&w=300&h=300&q=80&fm=webp
   ```
   - Width/height resizing works
   - Quality adjustment applies
   - Format conversion works

3. **Error Handling**
   - Invalid URLs return 400
   - Missing URLs return 400
   - Network errors return 404/500

4. **Security Testing**
   - SSRF protection works
   - Invalid protocols rejected
   - Malicious URLs blocked

### Performance Tests
```bash
# Run performance tests
cd apps/backend
npm run test:performance
```

## Manual Testing Checklist

### Frontend Manual Tests
1. **Visual Testing**
   - [ ] Images load smoothly
   - [ ] Blur placeholders appear
   - [ ] No layout shifts
   - [ ] Error states display correctly

2. **Performance Testing**
   - [ ] Lazy loading works (scroll down)
   - [ ] Above-the-fold images load immediately
   - [ ] Network tab shows optimized requests

3. **Responsive Testing**
   - [ ] Images scale correctly on mobile
   - [ ] Images scale correctly on tablet
   - [ ] Images scale correctly on desktop

### Backend Manual Tests
1. **API Testing**
   ```bash
   # Test basic optimization
   curl "http://localhost:5000/api/image-optimizer?url=https://picsum.photos/600/600&w=300&q=75&fm=webp"
   
   # Test health endpoint
   curl "http://localhost:5000/api/image-optimizer/health"
   
   # Test cache clear
   curl -X POST "http://localhost:5000/api/image-optimizer/clear-cache"
   ```

2. **Performance Testing**
   - [ ] Response times under 2 seconds
   - [ ] Compression ratios 25%+
   - [ ] Cache hits improve performance

## Automated Testing Scripts

### Frontend Test Script
```javascript
// test-frontend.js
const puppeteer = require('puppeteer');

async function testImageOptimization() {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  // Enable request monitoring
  const requests = [];
  page.on('request', request => {
    requests.push(request.url());
  });
  
  await page.goto('http://localhost:3000');
  
  // Check for optimized image requests
  const optimizedRequests = requests.filter(url => 
    url.includes('/api/image-optimizer')
  );
  
  console.log(`Found ${optimizedRequests.length} optimized requests`);
  
  // Test lazy loading
  await page.evaluate(() => window.scrollTo(0, 1000));
  await page.waitForTimeout(1000);
  
  await browser.close();
}

testImageOptimization();
```

### Backend Load Test
```javascript
// load-test-backend.js
const axios = require('axios');
const { performance } = require('perf_hooks');

async function loadTest() {
  const testUrl = 'https://picsum.photos/600/600';
  const iterations = 100;
  
  const startTime = performance.now();
  
  const promises = Array.from({ length: iterations }, (_, i) =>
    axios.get(`http://localhost:5000/api/image-optimizer?url=${testUrl}&w=300&q=75`)
  );
  
  const results = await Promise.allSettled(promises);
  const endTime = performance.now();
  
  const successful = results.filter(r => r.status === 'fulfilled').length;
  const failed = results.filter(r => r.status === 'rejected').length;
  
  console.log(`Load test completed:`);
  console.log(`- Total requests: ${iterations}`);
  console.log(`- Successful: ${successful}`);
  console.log(`- Failed: ${failed}`);
  console.log(`- Total time: ${(endTime - startTime).toFixed(2)}ms`);
  console.log(`- Average time per request: ${((endTime - startTime) / iterations).toFixed(2)}ms`);
}

loadTest();
```

## Performance Benchmarks

### Expected Performance Improvements
- **File Size Reduction**: 25-60% smaller
- **Load Time**: 30-50% faster
- **Bandwidth Usage**: 40-70% reduction
- **User Experience**: Eliminated layout shifts

### Metrics to Monitor
1. **Frontend Metrics**
   - Largest Contentful Paint (LCP)
   - Cumulative Layout Shift (CLS)
   - First Contentful Paint (FCP)

2. **Backend Metrics**
   - Response times
   - Compression ratios
   - Cache hit rates
   - Memory usage

## Browser Compatibility Testing

### Supported Browsers
- Chrome 80+
- Firefox 75+
- Safari 13+
- Edge 80+

### Feature Detection Tests
```javascript
// Test WebP support
const supportsWebP = () => {
  const canvas = document.createElement('canvas');
  return canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
};

// Test AVIF support
const supportsAVIF = () => {
  const canvas = document.createElement('canvas');
  return canvas.toDataURL('image/avif').indexOf('data:image/avif') === 0;
};

// Test Intersection Observer
const supportsIntersectionObserver = () => {
  return 'IntersectionObserver' in window;
};
```

## Deployment Testing

### Production Environment Tests
1. **Environment Variables**
   - [ ] FRONTEND_URL configured
   - [ ] PORT configured
   - [ ] Cache settings optimized

2. **CDN Integration**
   - [ ] Static assets served via CDN
   - [ ] API endpoints accessible
   - [ ] CORS headers configured

3. **Monitoring Setup**
   - [ ] Performance monitoring enabled
   - [ ] Error tracking configured
   - [ ] Health checks working

## Security Testing

### Security Checklist
- [ ] URL validation works
- [ ] Rate limiting active
- [ ] SSRF protection enabled
- [ ] Input sanitization working
- [ ] Headers properly configured

## Documentation Testing

### Documentation Verification
- [ ] API documentation accurate
- [ ] Component props documented
- [ ] Setup instructions clear
- [ ] Troubleshooting guide helpful

## Rollback Plan

### Rollback Procedures
1. **Frontend Rollback**
   - Revert to original `<img>` tags
   - Remove optimization dependencies
   - Update component imports

2. **Backend Rollback**
   - Remove image optimizer routes
   - Uninstall Sharp and Axios
   - Restore original package.json

### Rollback Testing
- [ ] Original functionality restored
- [ ] No breaking changes
- [ ] Performance acceptable

## Conclusion

This comprehensive testing plan ensures the image optimization implementation works correctly across all scenarios. The combination of automated tests, manual verification, and performance monitoring provides confidence in the solution's reliability and effectiveness.

Regular testing and monitoring should be implemented to ensure continued performance benefits as the platform scales.
