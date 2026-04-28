// Enhanced Error Boundaries
export {
  EnhancedErrorBoundary,
  PageErrorBoundary,
  ComponentErrorBoundary,
  CriticalErrorBoundary
} from './EnhancedErrorBoundary'

export {
  AsyncErrorBoundary,
  useAsyncErrorBoundary
} from './AsyncErrorBoundary'

// Legacy exports for backward compatibility
export { default as ErrorBoundary } from '../ErrorBoundary'
