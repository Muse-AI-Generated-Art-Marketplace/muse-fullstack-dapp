# Error Boundary Implementation

This directory contains the enhanced error boundary system for the Muse frontend application. The implementation provides comprehensive error handling with user-friendly error messages and recovery options.

## Components

### EnhancedErrorBoundary

The main error boundary class component with advanced features:

- **Multiple error levels**: `page`, `component`, `critical`
- **Retry functionality**: Configurable retry attempts with exponential backoff
- **Custom error messages**: Context-specific error messaging
- **Development mode**: Detailed error information in development
- **Accessibility**: ARIA labels and semantic HTML
- **Network status**: Automatic retry when connection is restored

### AsyncErrorBoundary

Specialized error boundary for async operations:

- **Network error detection**: Identifies network-related failures
- **Auto-retry**: Automatic retry with exponential backoff
- **Connection monitoring**: Listens for online/offline events
- **Async error handling**: Catches errors from async operations

### Convenience Wrappers

- **PageErrorBoundary**: For page-level error handling
- **ComponentErrorBoundary**: For component-level error handling  
- **CriticalErrorBoundary**: For critical system components

## Usage Examples

### Basic Usage

```tsx
import { ComponentErrorBoundary } from '@/components/error'

function MyComponent() {
  return (
    <ComponentErrorBoundary name="MyComponent">
      <YourComponent />
    </ComponentErrorBoundary>
  )
}
```

### Advanced Configuration

```tsx
<ComponentErrorBoundary 
  name="CriticalComponent"
  level="critical"
  showRetry={true}
  showHome={true}
  showBack={false}
  maxRetries={3}
  customMessage="This component failed to load. Please try again."
  onError={(error, errorInfo) => {
    // Custom error logging
    console.error('Component error:', error, errorInfo)
  }}
>
  <CriticalComponent />
</ComponentErrorBoundary>
```

### Async Operations

```tsx
import { AsyncErrorBoundary } from '@/components/error'

<AsyncErrorBoundary 
  maxRetries={5}
  retryDelay={1000}
  showNetworkStatus={true}
>
  <AsyncComponent />
</AsyncErrorBoundary>
```

## Error Levels

### Page Level
- Full-page error display
- Navigation options (home, back)
- Used for entire page failures

### Component Level  
- Inline error display
- Retry functionality
- Used for individual component failures

### Critical Level
- Prominent error display
- Limited recovery options
- Used for critical system components

## Error Types Handled

The error boundaries automatically categorize and handle:

- **Network Errors**: Connection failures, API errors
- **Wallet Errors**: Connection issues, transaction failures
- **Validation Errors**: Input validation failures
- **Rendering Errors**: Component rendering failures
- **Async Errors**: Promise rejections, timeout errors
- **Unknown Errors**: Fallback for unexpected errors

## Integration with Existing Error Handling

The error boundaries work seamlessly with:

- **ErrorContext**: Global error state management
- **ErrorHandler**: Error normalization and categorization
- **ErrorDisplay**: Consistent error UI components
- **ErrorLogger**: Centralized error logging

## Testing

Use the built-in test suite to verify error boundary functionality:

1. Navigate to `/error-test`
2. Select error type and test mode
3. Trigger errors to see boundary behavior
4. Test retry and recovery functionality

## Best Practices

### Placement Strategy

1. **App Level**: Wrap entire application with PageErrorBoundary
2. **Page Level**: Wrap individual pages with ComponentErrorBoundary
3. **Component Level**: Wrap complex components with ComponentErrorBoundary
4. **Critical Components**: Use CriticalErrorBoundary for navigation, auth, etc.

### Error Recovery

1. **Provide Context**: Use descriptive error messages
2. **Offer Recovery**: Include retry buttons when appropriate
3. **Fallback Options**: Provide navigation alternatives
4. **Preserve State**: Maintain user data when possible

### Performance

1. **Granular Boundaries**: Use multiple small boundaries
2. **Avoid Over-wrapping**: Don't nest boundaries unnecessarily
3. **Lazy Loading**: Wrap lazy-loaded components
4. **Error Isolation**: Prevent error cascading

## Configuration Options

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `children` | `ReactNode` | - | Child components to wrap |
| `name` | `string` | - | Component name for debugging |
| `level` | `'page' \| 'component' \| 'critical'` | `'component'` | Error boundary level |
| `showRetry` | `boolean` | `true` | Show retry button |
| `showHome` | `boolean` | `true` | Show home navigation |
| `showBack` | `boolean` | `false` | Show back navigation |
| `customMessage` | `string` | - | Custom error message |
| `maxRetries` | `number` | `3` | Maximum retry attempts |
| `onError` | `function` | - | Custom error handler |

### AsyncErrorBoundary Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `maxRetries` | `number` | `5` | Maximum retry attempts |
| `retryDelay` | `number` | `1000` | Initial retry delay (ms) |
| `showNetworkStatus` | `boolean` | `false` | Show connection status |

## Error Logging

All errors are automatically logged with:

- Error message and stack trace
- Component name and error level
- Retry count and timestamp
- User agent and environment info

## Accessibility

- Semantic HTML structure
- ARIA labels and roles
- Keyboard navigation support
- Screen reader compatibility
- High contrast mode support

## Browser Support

- Modern browsers (ES2018+)
- React 18+
- TypeScript support
- Mobile responsive design

## Troubleshooting

### Common Issues

1. **Errors not caught**: Ensure boundary wraps throwing component
2. **Infinite retries**: Check `isRecoverable` flag on errors
3. **Missing styles**: Verify Tailwind CSS is loaded
4. **Type errors**: Ensure proper TypeScript configuration

### Debug Mode

Enable development mode to see:
- Detailed error information
- Component stack traces
- Error boundary hierarchy
- Retry attempt history

## Migration Guide

### From Basic ErrorBoundary

```tsx
// Before
<ErrorBoundary>
  <Component />
</ErrorBoundary>

// After
<ComponentErrorBoundary name="Component">
  <Component />
</ComponentErrorBoundary>
```

### Adding to Existing Components

1. Import appropriate boundary type
2. Wrap component with boundary
3. Add name for debugging
4. Configure recovery options
5. Test error scenarios

## Future Enhancements

- Error reporting service integration
- Performance monitoring
- User feedback collection
- Error analytics dashboard
- Automated error categorization
