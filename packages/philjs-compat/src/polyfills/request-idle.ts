/**
 * requestIdleCallback Polyfill
 *
 * Provides a fallback implementation using setTimeout for browsers
 * that don't support requestIdleCallback.
 */

import type { PolyfillModule } from '../types.js';
import { isBrowser } from '../detection/feature-detect.js';

/**
 * IdleDeadline interface
 */
interface IdleDeadline {
  readonly didTimeout: boolean;
  timeRemaining(): number;
}

/**
 * IdleRequestOptions interface
 */
interface IdleRequestOptions {
  timeout?: number;
}

/**
 * IdleRequestCallback type
 */
type IdleRequestCallback = (deadline: IdleDeadline) => void;

/**
 * Simulated frame time in milliseconds
 * Targets 60fps (16.67ms per frame)
 */
const FRAME_TIME = 16;

/**
 * Time available for idle work per frame (1ms)
 */
const IDLE_TIME = 1;

/**
 * Pending idle callbacks
 */
const pendingCallbacks = new Map<number, {
  callback: IdleRequestCallback;
  timeoutId?: ReturnType<typeof setTimeout>;
  startTime: number;
  timeout?: number;
}>();

/**
 * Next callback handle
 */
let nextHandle = 1;

/**
 * Create an IdleDeadline object
 */
function createDeadline(didTimeout: boolean, startTime: number): IdleDeadline {
  return {
    didTimeout,
    timeRemaining(): number {
      if (didTimeout) {
        return 0;
      }
      const elapsed = performance.now() - startTime;
      const remaining = Math.max(0, IDLE_TIME - elapsed);
      return remaining;
    },
  };
}

/**
 * requestIdleCallback polyfill implementation
 */
function requestIdleCallbackPolyfill(
  callback: IdleRequestCallback,
  options?: IdleRequestOptions
): number {
  const handle = nextHandle++;
  const startTime = performance.now();

  // Schedule the callback to run in the next "idle" period
  // We use setTimeout with a small delay to allow the browser to do other work
  const timeoutId = setTimeout(() => {
    const entry = pendingCallbacks.get(handle);
    if (entry) {
      pendingCallbacks.delete(handle);
      const deadline = createDeadline(false, performance.now());
      callback(deadline);
    }
  }, FRAME_TIME);

  // If a timeout is specified, set up a timeout handler
  let forcedTimeoutId: ReturnType<typeof setTimeout> | undefined;
  if (options?.timeout != null && options.timeout > 0) {
    forcedTimeoutId = setTimeout(() => {
      const entry = pendingCallbacks.get(handle);
      if (entry) {
        pendingCallbacks.delete(handle);
        // Clear the regular timeout
        if (entry.timeoutId != null) {
          clearTimeout(entry.timeoutId);
        }
        const deadline = createDeadline(true, startTime);
        callback(deadline);
      }
    }, options.timeout);
  }

  pendingCallbacks.set(handle, {
    callback,
    timeoutId,
    startTime,
    timeout: options?.timeout,
  });

  return handle;
}

/**
 * cancelIdleCallback polyfill implementation
 */
function cancelIdleCallbackPolyfill(handle: number): void {
  const entry = pendingCallbacks.get(handle);
  if (entry) {
    if (entry.timeoutId != null) {
      clearTimeout(entry.timeoutId);
    }
    pendingCallbacks.delete(handle);
  }
}

/**
 * Check if requestIdleCallback polyfill is needed
 */
export function isRequestIdleCallbackNeeded(): boolean {
  return isBrowser() && typeof requestIdleCallback === 'undefined';
}

/**
 * Apply requestIdleCallback polyfill
 */
export function applyRequestIdleCallbackPolyfill(): void {
  if (!isBrowser()) {
    return;
  }

  if (typeof requestIdleCallback === 'undefined') {
    (window as any).requestIdleCallback = requestIdleCallbackPolyfill;
  }

  if (typeof cancelIdleCallback === 'undefined') {
    (window as any).cancelIdleCallback = cancelIdleCallbackPolyfill;
  }
}

/**
 * Get the requestIdleCallback function (native or polyfilled)
 */
export function getRequestIdleCallback(): typeof requestIdleCallback {
  if (typeof requestIdleCallback !== 'undefined') {
    return requestIdleCallback;
  }
  return requestIdleCallbackPolyfill;
}

/**
 * Get the cancelIdleCallback function (native or polyfilled)
 */
export function getCancelIdleCallback(): typeof cancelIdleCallback {
  if (typeof cancelIdleCallback !== 'undefined') {
    return cancelIdleCallback;
  }
  return cancelIdleCallbackPolyfill;
}

/**
 * Polyfill module definition
 */
export const requestIdleCallbackPolyfillModule: PolyfillModule = {
  feature: 'requestIdleCallback',
  isNeeded: isRequestIdleCallbackNeeded,
  apply: applyRequestIdleCallbackPolyfill,
};
