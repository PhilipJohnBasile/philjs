/**
 * ResizeObserver Polyfill Loader
 *
 * This module provides functionality to load the ResizeObserver polyfill
 * from a CDN or npm package when the native API is not available.
 */

import type { PolyfillModule } from '../types.js';
import { isBrowser } from '../detection/feature-detect.js';

/**
 * CDN URL for the ResizeObserver polyfill
 */
export const RESIZE_OBSERVER_CDN =
  'https://cdnjs.cloudflare.com/ajax/libs/resize-observer-polyfill/1.5.1/ResizeObserver.min.js';

/**
 * Check if ResizeObserver polyfill is needed
 */
export function isResizeObserverNeeded(): boolean {
  return typeof ResizeObserver === 'undefined';
}

/**
 * Load ResizeObserver polyfill from CDN
 */
export async function loadResizeObserverFromCDN(
  cdnUrl: string = RESIZE_OBSERVER_CDN
): Promise<void> {
  if (!isBrowser()) {
    return;
  }

  if (!isResizeObserverNeeded()) {
    return;
  }

  return new Promise<void>((resolve, reject) => {
    const script = document.createElement('script');
    script.src = cdnUrl;
    script.async = true;

    script.onload = () => {
      // The polyfill exposes ResizeObserver globally
      resolve();
    };

    script.onerror = () => {
      reject(new Error(`Failed to load ResizeObserver polyfill from ${cdnUrl}`));
    };

    document.head.appendChild(script);
  });
}

/**
 * Load ResizeObserver polyfill from npm package
 * Requires 'resize-observer-polyfill' package to be installed
 */
export async function loadResizeObserverFromPackage(): Promise<void> {
  if (!isBrowser()) {
    return;
  }

  if (!isResizeObserverNeeded()) {
    return;
  }

  try {
    // Dynamic import of the polyfill package
    const module = await import('resize-observer-polyfill');
    const ResizeObserverPolyfill = module.default ?? module;

    // Install the polyfill globally
    if (typeof (window as any).ResizeObserver === 'undefined') {
      (window as any).ResizeObserver = ResizeObserverPolyfill;
    }
  } catch (error) {
    throw new Error(
      'Failed to load resize-observer-polyfill package. ' +
      'Please install it: npm install resize-observer-polyfill'
    );
  }
}

/**
 * Apply ResizeObserver polyfill
 * Tries to load from package first, falls back to CDN
 */
export async function applyResizeObserverPolyfill(useCDN: boolean = false): Promise<void> {
  if (!isResizeObserverNeeded()) {
    return;
  }

  if (useCDN) {
    await loadResizeObserverFromCDN();
  } else {
    try {
      await loadResizeObserverFromPackage();
    } catch {
      // Fallback to CDN if package is not available
      await loadResizeObserverFromCDN();
    }
  }
}

/**
 * Polyfill module definition
 */
export const resizeObserverPolyfillModule: PolyfillModule = {
  feature: 'ResizeObserver',
  isNeeded: isResizeObserverNeeded,
  apply: () => applyResizeObserverPolyfill(),
  cdnUrl: RESIZE_OBSERVER_CDN,
};
