/**
 * PhilJS Compat Types
 *
 * Type definitions for browser compatibility and feature detection.
 */

/**
 * All detectable browser features
 */
export type FeatureName =
  | 'customElements'
  | 'shadowDOM'
  | 'IntersectionObserver'
  | 'ResizeObserver'
  | 'requestIdleCallback'
  | 'structuredClone'
  | 'WeakRef'
  | 'FinalizationRegistry'
  | 'CSS.supports'
  | 'CSS.registerProperty'
  | 'AbortController'
  | 'fetch'
  | 'Promise'
  | 'Proxy'
  | 'Symbol'
  | 'Map'
  | 'Set'
  | 'WeakMap'
  | 'WeakSet'
  | 'Reflect'
  | 'BigInt'
  | 'globalThis'
  | 'queueMicrotask'
  | 'TextEncoder'
  | 'TextDecoder'
  | 'URL'
  | 'URLSearchParams'
  | 'Intl'
  | 'PointerEvents'
  | 'TouchEvents'
  | 'WebAnimations'
  | 'WebGL'
  | 'WebGL2'
  | 'WebGPU'
  | 'SharedArrayBuffer'
  | 'Atomics'
  | 'BroadcastChannel'
  | 'ServiceWorker'
  | 'WebSocket'
  | 'Worker'
  | 'localStorage'
  | 'sessionStorage'
  | 'IndexedDB'
  | 'Clipboard'
  | 'Geolocation'
  | 'Notifications'
  | 'Permissions'
  | 'MediaDevices'
  | 'WebRTC';

/**
 * Feature detection result
 */
export interface FeatureDetectionResult {
  /** Feature name */
  name: FeatureName;
  /** Whether the feature is supported */
  supported: boolean;
  /** Any additional details about the support */
  details?: string;
}

/**
 * Browser information
 */
export interface BrowserInfo {
  /** Browser name (Chrome, Firefox, Safari, Edge, etc.) */
  name: string;
  /** Browser version string */
  version: string;
  /** Major version number */
  majorVersion: number;
  /** Engine name (Blink, Gecko, WebKit) */
  engine: string;
  /** Engine version */
  engineVersion: string;
  /** Operating system */
  os: string;
  /** Operating system version */
  osVersion: string;
  /** Whether this is a mobile browser */
  isMobile: boolean;
  /** Whether this is a tablet */
  isTablet: boolean;
  /** Whether this is a desktop browser */
  isDesktop: boolean;
  /** Whether this is a bot/crawler */
  isBot: boolean;
  /** User agent string */
  userAgent: string;
}

/**
 * Auto-polyfill options
 */
export interface AutoPolyfillOptions {
  /** Features to polyfill (defaults to all missing) */
  features?: FeatureName[];
  /** Whether to load polyfills from CDN */
  useCDN?: boolean;
  /** Custom CDN URL (defaults to cdnjs) */
  cdnUrl?: string;
  /** Whether to load polyfills lazily */
  lazy?: boolean;
  /** Callback when polyfills are loaded */
  onLoad?: (loadedFeatures: FeatureName[]) => void;
  /** Callback on error */
  onError?: (feature: FeatureName, error: Error) => void;
  /** Skip features that have native support */
  skipNative?: boolean;
}

/**
 * Polyfill loader result
 */
export interface PolyfillLoadResult {
  /** Features that were loaded */
  loaded: FeatureName[];
  /** Features that failed to load */
  failed: Array<{ feature: FeatureName; error: Error }>;
  /** Features that were skipped (already supported) */
  skipped: FeatureName[];
  /** Total load time in milliseconds */
  loadTime: number;
}

/**
 * Polyfill module interface
 */
export interface PolyfillModule {
  /** Feature name this polyfill provides */
  feature: FeatureName;
  /** Check if polyfill is needed */
  isNeeded(): boolean;
  /** Apply the polyfill */
  apply(): void | Promise<void>;
  /** CDN URL for external polyfill (optional) */
  cdnUrl?: string;
}

/**
 * Feature support matrix
 */
export type FeatureSupportMatrix = {
  [K in FeatureName]?: boolean;
};
