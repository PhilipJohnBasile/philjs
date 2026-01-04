/**
 * Feature Detection Module
 *
 * Detects browser support for various web platform features.
 */

import type { FeatureName, FeatureDetectionResult, FeatureSupportMatrix } from '../types.js';

/**
 * Check if code is running in a browser environment
 */
export function isBrowser(): boolean {
  return typeof window !== 'undefined' && typeof document !== 'undefined';
}

/**
 * Check if code is running in a Node.js environment
 */
export function isNode(): boolean {
  return typeof process !== 'undefined' && process.versions?.node != null;
}

/**
 * Check if code is running in a Web Worker
 */
export function isWebWorker(): boolean {
  return typeof self !== 'undefined' && typeof (self as any).WorkerGlobalScope !== 'undefined';
}

/**
 * Detect support for custom elements
 */
export function detectCustomElements(): FeatureDetectionResult {
  const supported = isBrowser() &&
    typeof customElements !== 'undefined' &&
    typeof customElements.define === 'function';

  return {
    name: 'customElements',
    supported,
    details: supported ? 'Native custom elements v1 supported' : 'Custom elements not supported',
  };
}

/**
 * Detect support for Shadow DOM
 */
export function detectShadowDOM(): FeatureDetectionResult {
  const supported = isBrowser() &&
    typeof Element !== 'undefined' &&
    typeof Element.prototype.attachShadow === 'function';

  return {
    name: 'shadowDOM',
    supported,
    details: supported ? 'Native Shadow DOM v1 supported' : 'Shadow DOM not supported',
  };
}

/**
 * Detect support for IntersectionObserver
 */
export function detectIntersectionObserver(): FeatureDetectionResult {
  const supported = typeof IntersectionObserver !== 'undefined';

  return {
    name: 'IntersectionObserver',
    supported,
    details: supported
      ? 'Native IntersectionObserver supported'
      : 'IntersectionObserver not supported - polyfill needed',
  };
}

/**
 * Detect support for ResizeObserver
 */
export function detectResizeObserver(): FeatureDetectionResult {
  const supported = typeof ResizeObserver !== 'undefined';

  return {
    name: 'ResizeObserver',
    supported,
    details: supported
      ? 'Native ResizeObserver supported'
      : 'ResizeObserver not supported - polyfill needed',
  };
}

/**
 * Detect support for requestIdleCallback
 */
export function detectRequestIdleCallback(): FeatureDetectionResult {
  const supported = isBrowser() && typeof requestIdleCallback === 'function';

  return {
    name: 'requestIdleCallback',
    supported,
    details: supported
      ? 'Native requestIdleCallback supported'
      : 'requestIdleCallback not supported - polyfill will use setTimeout fallback',
  };
}

/**
 * Detect support for structuredClone
 */
export function detectStructuredClone(): FeatureDetectionResult {
  const supported = typeof structuredClone === 'function';

  return {
    name: 'structuredClone',
    supported,
    details: supported
      ? 'Native structuredClone supported'
      : 'structuredClone not supported - polyfill needed',
  };
}

/**
 * Detect support for WeakRef
 */
export function detectWeakRef(): FeatureDetectionResult {
  const supported = typeof WeakRef !== 'undefined';

  return {
    name: 'WeakRef',
    supported,
    details: supported
      ? 'Native WeakRef supported'
      : 'WeakRef not supported',
  };
}

/**
 * Detect support for FinalizationRegistry
 */
export function detectFinalizationRegistry(): FeatureDetectionResult {
  const supported = typeof FinalizationRegistry !== 'undefined';

  return {
    name: 'FinalizationRegistry',
    supported,
    details: supported
      ? 'Native FinalizationRegistry supported'
      : 'FinalizationRegistry not supported',
  };
}

/**
 * Detect support for AbortController
 */
export function detectAbortController(): FeatureDetectionResult {
  const supported = typeof AbortController !== 'undefined';

  return {
    name: 'AbortController',
    supported,
  };
}

/**
 * Detect support for fetch API
 */
export function detectFetch(): FeatureDetectionResult {
  const supported = typeof fetch === 'function';

  return {
    name: 'fetch',
    supported,
  };
}

/**
 * Detect support for CSS.supports()
 */
export function detectCSSSupports(): FeatureDetectionResult {
  const supported = isBrowser() &&
    typeof CSS !== 'undefined' &&
    typeof CSS.supports === 'function';

  return {
    name: 'CSS.supports',
    supported,
  };
}

/**
 * Detect support for CSS.registerProperty()
 */
export function detectCSSRegisterProperty(): FeatureDetectionResult {
  const supported = isBrowser() &&
    typeof CSS !== 'undefined' &&
    typeof (CSS as any).registerProperty === 'function';

  return {
    name: 'CSS.registerProperty',
    supported,
  };
}

/**
 * Detect support for Service Workers
 */
export function detectServiceWorker(): FeatureDetectionResult {
  const supported = isBrowser() && 'serviceWorker' in navigator;

  return {
    name: 'ServiceWorker',
    supported,
  };
}

/**
 * Detect support for Web Workers
 */
export function detectWorker(): FeatureDetectionResult {
  const supported = typeof Worker !== 'undefined';

  return {
    name: 'Worker',
    supported,
  };
}

/**
 * Detect support for localStorage
 */
export function detectLocalStorage(): FeatureDetectionResult {
  let supported = false;
  try {
    if (isBrowser() && typeof localStorage !== 'undefined') {
      const testKey = '__philjs_test__';
      localStorage.setItem(testKey, 'test');
      localStorage.removeItem(testKey);
      supported = true;
    }
  } catch {
    supported = false;
  }

  return {
    name: 'localStorage',
    supported,
  };
}

/**
 * Detect support for IndexedDB
 */
export function detectIndexedDB(): FeatureDetectionResult {
  const supported = isBrowser() && typeof indexedDB !== 'undefined';

  return {
    name: 'IndexedDB',
    supported,
  };
}

/**
 * Detect support for WebGL
 */
export function detectWebGL(): FeatureDetectionResult {
  let supported = false;
  if (isBrowser()) {
    try {
      const canvas = document.createElement('canvas');
      supported = !!(canvas.getContext('webgl') || canvas.getContext('experimental-webgl'));
    } catch {
      supported = false;
    }
  }

  return {
    name: 'WebGL',
    supported,
  };
}

/**
 * Detect support for WebGL2
 */
export function detectWebGL2(): FeatureDetectionResult {
  let supported = false;
  if (isBrowser()) {
    try {
      const canvas = document.createElement('canvas');
      supported = !!canvas.getContext('webgl2');
    } catch {
      supported = false;
    }
  }

  return {
    name: 'WebGL2',
    supported,
  };
}

/**
 * Detect support for WebGPU
 */
export function detectWebGPU(): FeatureDetectionResult {
  const supported = isBrowser() && 'gpu' in navigator;

  return {
    name: 'WebGPU',
    supported,
  };
}

/**
 * Map of feature detection functions
 */
const detectors: Partial<Record<FeatureName, () => FeatureDetectionResult>> = {
  customElements: detectCustomElements,
  shadowDOM: detectShadowDOM,
  IntersectionObserver: detectIntersectionObserver,
  ResizeObserver: detectResizeObserver,
  requestIdleCallback: detectRequestIdleCallback,
  structuredClone: detectStructuredClone,
  WeakRef: detectWeakRef,
  FinalizationRegistry: detectFinalizationRegistry,
  AbortController: detectAbortController,
  fetch: detectFetch,
  'CSS.supports': detectCSSSupports,
  'CSS.registerProperty': detectCSSRegisterProperty,
  ServiceWorker: detectServiceWorker,
  Worker: detectWorker,
  localStorage: detectLocalStorage,
  IndexedDB: detectIndexedDB,
  WebGL: detectWebGL,
  WebGL2: detectWebGL2,
  WebGPU: detectWebGPU,
};

/**
 * Detect a specific feature
 */
export function detectFeature(feature: FeatureName): FeatureDetectionResult {
  const detector = detectors[feature];
  if (detector) {
    return detector();
  }

  // Generic detection for unknown features
  return {
    name: feature,
    supported: false,
    details: `No detector available for ${feature}`,
  };
}

/**
 * Detect multiple features
 */
export function detectFeatures(features: FeatureName[]): FeatureDetectionResult[] {
  return features.map(detectFeature);
}

/**
 * Detect all known features
 */
export function detectAllFeatures(): FeatureDetectionResult[] {
  return Object.keys(detectors).map((key) => detectFeature(key as FeatureName));
}

/**
 * Get feature support matrix
 */
export function getFeatureSupportMatrix(features?: FeatureName[]): FeatureSupportMatrix {
  const featuresToCheck = features ?? (Object.keys(detectors) as FeatureName[]);
  const matrix: FeatureSupportMatrix = {};

  for (const feature of featuresToCheck) {
    const result = detectFeature(feature);
    matrix[feature] = result.supported;
  }

  return matrix;
}

/**
 * Check if a feature is supported
 */
export function isSupported(feature: FeatureName): boolean {
  return detectFeature(feature).supported;
}

/**
 * Check if all specified features are supported
 */
export function areAllSupported(features: FeatureName[]): boolean {
  return features.every(isSupported);
}

/**
 * Check if any of the specified features are supported
 */
export function isAnySupported(features: FeatureName[]): boolean {
  return features.some(isSupported);
}

/**
 * Get list of missing features from a set
 */
export function getMissingFeatures(features: FeatureName[]): FeatureName[] {
  return features.filter((feature) => !isSupported(feature));
}

/**
 * Get list of supported features from a set
 */
export function getSupportedFeatures(features: FeatureName[]): FeatureName[] {
  return features.filter(isSupported);
}
