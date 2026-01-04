/**
 * @philjs/compat
 *
 * Polyfills and compatibility layer for legacy browsers
 */

import { initSignalsPolyfill, needsSignalsPolyfill } from './signals.js';
import { initDOMPolyfills, needsDOMPolyfills } from './dom.js';

// Export all polyfills
export * from './signals.js';
export * from './dom.js';

/**
 * Initialize all polyfills
 */
export function initPolyfills(): void {
  initSignalsPolyfill();
  initDOMPolyfills();
}

/**
 * Check if the current environment needs polyfills
 */
export function needsPolyfills(): boolean {
  return needsSignalsPolyfill() || needsDOMPolyfills();
}