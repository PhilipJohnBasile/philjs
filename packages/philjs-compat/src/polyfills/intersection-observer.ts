/**
 * IntersectionObserver Polyfill Loader
 *
 * This module provides functionality to load the IntersectionObserver polyfill
 * from a CDN or npm package when the native API is not available.
 */

import type { PolyfillModule } from '../types.js';
import { isBrowser } from '../detection/feature-detect.js';

/**
 * CDN URL for the IntersectionObserver polyfill
 */
export const INTERSECTION_OBSERVER_CDN =
  'https://cdnjs.cloudflare.com/ajax/libs/intersection-observer/0.12.2/intersection-observer.min.js';

/**
 * Check if IntersectionObserver polyfill is needed
 */
export function isIntersectionObserverNeeded(): boolean {
  return typeof IntersectionObserver === 'undefined';
}

/**
 * Load IntersectionObserver polyfill from CDN
 */
export async function loadIntersectionObserverFromCDN(
  cdnUrl: string = INTERSECTION_OBSERVER_CDN
): Promise<void> {
  if (!isBrowser()) {
    return;
  }

  if (!isIntersectionObserverNeeded()) {
    return;
  }

  return new Promise<void>((resolve, reject) => {
    const script = document.createElement('script');
    script.src = cdnUrl;
    script.async = true;

    script.onload = () => {
      resolve();
    };

    script.onerror = () => {
      reject(new Error(`Failed to load IntersectionObserver polyfill from ${cdnUrl}`));
    };

    document.head.appendChild(script);
  });
}

/**
 * Load IntersectionObserver polyfill from npm package
 * Requires 'intersection-observer' package to be installed
 */
export async function loadIntersectionObserverFromPackage(): Promise<void> {
  if (!isIntersectionObserverNeeded()) {
    return;
  }

  try {
    // Dynamic import of the polyfill package
    await import('intersection-observer');
  } catch (error) {
    throw new Error(
      'Failed to load intersection-observer package. ' +
      'Please install it: npm install intersection-observer'
    );
  }
}

/**
 * Apply IntersectionObserver polyfill
 * Tries to load from package first, falls back to CDN
 */
export async function applyIntersectionObserverPolyfill(useCDN: boolean = false): Promise<void> {
  if (!isIntersectionObserverNeeded()) {
    return;
  }

  if (useCDN) {
    await loadIntersectionObserverFromCDN();
  } else {
    try {
      await loadIntersectionObserverFromPackage();
    } catch {
      // Fallback to CDN if package is not available
      await loadIntersectionObserverFromCDN();
    }
  }
}

/**
 * Polyfill module definition
 */
export const intersectionObserverPolyfillModule: PolyfillModule = {
  feature: 'IntersectionObserver',
  isNeeded: isIntersectionObserverNeeded,
  apply: () => applyIntersectionObserverPolyfill(),
  cdnUrl: INTERSECTION_OBSERVER_CDN,
};
