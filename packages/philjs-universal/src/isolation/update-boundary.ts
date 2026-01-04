/**
 * Update Boundary Implementation
 * Isolates framework updates to prevent cascading re-renders.
 */

import { batch } from '@philjs/core';
import type { UpdateBoundary } from '../types.js';

/**
 * Track isolation depth
 */
let isolationDepth = 0;

/**
 * Pending scheduled updates
 */
const scheduledUpdates = new Set<() => void>();
let isFlushScheduled = false;

/**
 * Implementation of UpdateBoundary
 */
class UpdateBoundaryImpl implements UpdateBoundary {
  private name: string;

  constructor(name: string = 'default') {
    this.name = name;
  }

  /**
   * Run a function in an isolated update context.
   * Updates within this context won't trigger parent component updates.
   */
  isolate<T>(fn: () => T): T {
    isolationDepth++;
    try {
      return fn();
    } finally {
      isolationDepth--;
    }
  }

  /**
   * Batch multiple updates into a single render cycle.
   */
  batch<T>(fn: () => T): T {
    return batch(fn);
  }

  /**
   * Schedule an update for the next frame.
   */
  schedule(fn: () => void): void {
    scheduledUpdates.add(fn);

    if (!isFlushScheduled) {
      isFlushScheduled = true;
      scheduleFlush();
    }
  }

  /**
   * Flush all pending scheduled updates immediately.
   */
  flush(): void {
    flushScheduledUpdates();
  }

  /**
   * Check if we're currently inside an isolated context
   */
  isIsolated(): boolean {
    return isolationDepth > 0;
  }

  /**
   * Get isolation depth (for debugging)
   */
  getIsolationDepth(): number {
    return isolationDepth;
  }
}

/**
 * Schedule the flush using the best available method
 */
function scheduleFlush(): void {
  if (typeof queueMicrotask === 'function') {
    queueMicrotask(flushScheduledUpdates);
  } else if (typeof requestAnimationFrame === 'function') {
    requestAnimationFrame(flushScheduledUpdates);
  } else {
    setTimeout(flushScheduledUpdates, 0);
  }
}

/**
 * Flush all scheduled updates
 */
function flushScheduledUpdates(): void {
  isFlushScheduled = false;
  const updates = Array.from(scheduledUpdates);
  scheduledUpdates.clear();

  // Run updates in a batch to minimize re-renders
  batch(() => {
    for (const update of updates) {
      try {
        update();
      } catch (error) {
        console.error('[UpdateBoundary] Scheduled update error:', error);
      }
    }
  });
}

/**
 * Global update boundary instance
 */
let globalBoundary: UpdateBoundaryImpl | null = null;

export function getGlobalUpdateBoundary(): UpdateBoundaryImpl {
  if (!globalBoundary) {
    globalBoundary = new UpdateBoundaryImpl('global');
  }
  return globalBoundary;
}

/**
 * Create a named update boundary
 */
export function createUpdateBoundary(name: string): UpdateBoundary {
  return new UpdateBoundaryImpl(name);
}

/**
 * Run a function in isolation
 */
export function isolate<T>(fn: () => T): T {
  return getGlobalUpdateBoundary().isolate(fn);
}

/**
 * Batch updates
 */
export function batchUpdates<T>(fn: () => T): T {
  return getGlobalUpdateBoundary().batch(fn);
}

/**
 * Schedule an update
 */
export function scheduleUpdate(fn: () => void): void {
  getGlobalUpdateBoundary().schedule(fn);
}

/**
 * Flush pending updates
 */
export function flushUpdates(): void {
  getGlobalUpdateBoundary().flush();
}

/**
 * Check if currently isolated
 */
export function isIsolated(): boolean {
  return getGlobalUpdateBoundary().isIsolated();
}

/**
 * Wrapper to run framework updates in isolation.
 * Use this when calling into React/Vue/etc. to prevent
 * their updates from triggering PhilJS updates.
 */
export function withIsolation<T>(fn: () => T): T {
  return isolate(fn);
}

/**
 * Create an isolated callback.
 * Wraps a callback so it always runs in isolation.
 */
export function createIsolatedCallback<Args extends unknown[], Return>(
  fn: (...args: Args) => Return
): (...args: Args) => Return {
  return (...args: Args) => isolate(() => fn(...args));
}

/**
 * Debounce updates within a time window.
 * Useful for high-frequency updates like scroll/resize.
 */
export function debounceUpdate(
  fn: () => void,
  delay: number = 16
): { update: () => void; cancel: () => void } {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  return {
    update: () => {
      if (timeoutId !== null) {
        clearTimeout(timeoutId);
      }
      timeoutId = setTimeout(() => {
        timeoutId = null;
        fn();
      }, delay);
    },
    cancel: () => {
      if (timeoutId !== null) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
    },
  };
}

/**
 * Throttle updates to at most once per time window.
 */
export function throttleUpdate(
  fn: () => void,
  limit: number = 16
): { update: () => void; cancel: () => void } {
  let lastRun = 0;
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  return {
    update: () => {
      const now = Date.now();
      const timeSinceLastRun = now - lastRun;

      if (timeSinceLastRun >= limit) {
        lastRun = now;
        fn();
      } else if (timeoutId === null) {
        timeoutId = setTimeout(() => {
          timeoutId = null;
          lastRun = Date.now();
          fn();
        }, limit - timeSinceLastRun);
      }
    },
    cancel: () => {
      if (timeoutId !== null) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
    },
  };
}
