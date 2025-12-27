/**
 * High-performance batching utilities
 */

import type { BatchOptions } from './types.js';

type Callback = () => void;

/**
 * Microtask scheduler for batching
 */
export class Scheduler {
  private queue: Callback[] = [];
  private scheduled = false;

  schedule(callback: Callback): void {
    this.queue.push(callback);

    if (!this.scheduled) {
      this.scheduled = true;
      queueMicrotask(() => this.flush());
    }
  }

  private flush(): void {
    this.scheduled = false;
    const callbacks = this.queue;
    this.queue = [];

    for (let i = 0; i < callbacks.length; i++) {
      callbacks[i]!();
    }
  }

  clear(): void {
    this.queue = [];
    this.scheduled = false;
  }
}

// Global scheduler instance
const globalScheduler = new Scheduler();

/**
 * Batch multiple calls into a single execution
 */
export function batch<T extends (...args: any[]) => void>(
  fn: T,
  options: BatchOptions = {}
): T {
  const { wait = 0, maxSize = Infinity, leading = false } = options;

  let queue: Parameters<T>[] = [];
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  let lastCallTime = 0;

  const flush = () => {
    timeoutId = null;
    const items = queue;
    queue = [];

    if (items.length > 0) {
      // Execute with all batched args
      fn(...items[items.length - 1]!);
    }
  };

  const batched = function (this: unknown, ...args: Parameters<T>): void {
    const now = Date.now();
    queue.push(args);

    // Leading edge
    if (leading && queue.length === 1 && now - lastCallTime > wait) {
      lastCallTime = now;
      flush();
      return;
    }

    // Max size reached
    if (queue.length >= maxSize) {
      if (timeoutId !== null) {
        clearTimeout(timeoutId);
      }
      flush();
      return;
    }

    // Schedule flush
    if (timeoutId === null) {
      if (wait === 0) {
        globalScheduler.schedule(flush);
      } else {
        timeoutId = setTimeout(flush, wait);
      }
    }
  } as T;

  // Attach flush method
  (batched as any).flush = flush;

  return batched;
}

/**
 * Batch async operations
 */
export function batchAsync<T, R>(
  fn: (items: T[]) => Promise<R[]>,
  options: BatchOptions = {}
): (item: T) => Promise<R> {
  const { wait = 0, maxSize = Infinity } = options;

  type PendingItem = {
    item: T;
    resolve: (value: R) => void;
    reject: (error: Error) => void;
  };

  let queue: PendingItem[] = [];
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  const flush = async () => {
    timeoutId = null;
    const items = queue;
    queue = [];

    if (items.length === 0) return;

    try {
      const results = await fn(items.map(p => p.item));

      for (let i = 0; i < items.length; i++) {
        items[i]!.resolve(results[i]!);
      }
    } catch (error) {
      for (const pending of items) {
        pending.reject(error as Error);
      }
    }
  };

  return (item: T): Promise<R> => {
    return new Promise((resolve, reject) => {
      queue.push({ item, resolve, reject });

      if (queue.length >= maxSize) {
        if (timeoutId !== null) {
          clearTimeout(timeoutId);
        }
        flush();
        return;
      }

      if (timeoutId === null) {
        if (wait === 0) {
          globalScheduler.schedule(flush);
        } else {
          timeoutId = setTimeout(flush, wait);
        }
      }
    });
  };
}

/**
 * Create a custom batcher with shared state
 */
export function createBatcher<T, R>(
  processBatch: (items: T[]) => R[],
  options: BatchOptions = {}
): {
  add: (item: T) => void;
  flush: () => R[];
  size: () => number;
} {
  const { maxSize = Infinity } = options;

  let queue: T[] = [];

  return {
    add(item: T): void {
      queue.push(item);
      if (queue.length >= maxSize) {
        this.flush();
      }
    },

    flush(): R[] {
      const items = queue;
      queue = [];
      return processBatch(items);
    },

    size(): number {
      return queue.length;
    },
  };
}
