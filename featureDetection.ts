/**
 * Utility to detect browser features.
 */
class FeatureDetection {
  public hasWebSocketSupport(): boolean {
    return 'WebSocket' in window || 'MozWebSocket' in window;
  }
}

export const featureDetection = new FeatureDetection();