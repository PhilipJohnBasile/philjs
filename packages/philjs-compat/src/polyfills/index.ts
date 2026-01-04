/**
 * Polyfills Module Exports
 */

export * from './intersection-observer.js';
export * from './resize-observer.js';
export * from './request-idle.js';
export * from './structured-clone.js';

// Re-export all polyfill modules for easy access
import { intersectionObserverPolyfillModule } from './intersection-observer.js';
import { resizeObserverPolyfillModule } from './resize-observer.js';
import { requestIdleCallbackPolyfillModule } from './request-idle.js';
import { structuredClonePolyfillModule } from './structured-clone.js';

import type { PolyfillModule, FeatureName } from '../types.js';

/**
 * All available polyfill modules
 */
export const polyfillModules: Record<string, PolyfillModule> = {
  IntersectionObserver: intersectionObserverPolyfillModule,
  ResizeObserver: resizeObserverPolyfillModule,
  requestIdleCallback: requestIdleCallbackPolyfillModule,
  structuredClone: structuredClonePolyfillModule,
};

/**
 * Get a polyfill module by feature name
 */
export function getPolyfillModule(feature: FeatureName): PolyfillModule | undefined {
  return polyfillModules[feature];
}

/**
 * Check if a polyfill is available for a feature
 */
export function hasPolyfill(feature: FeatureName): boolean {
  return feature in polyfillModules;
}

/**
 * Get all available polyfill features
 */
export function getAvailablePolyfills(): FeatureName[] {
  return Object.keys(polyfillModules) as FeatureName[];
}
