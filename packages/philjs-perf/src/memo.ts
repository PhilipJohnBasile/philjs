/**
 * High-performance memoization utilities
 */

import type { MemoOptions } from './types.js';

interface CacheEntry<T> {
  value: T;
  expires: number;
}

const defaultKeyFn = (...args: unknown[]): string => {
  if (args.length === 0) return '';
  if (args.length === 1) {
    const arg = args[0];
    if (arg === null) return 'null';
    if (arg === undefined) return 'undefined';
    if (typeof arg === 'string' || typeof arg === 'number' || typeof arg === 'boolean') {
      return String(arg);
    }
  }
  return JSON.stringify(args);
};

/**
 * Memoize a function with LRU cache
 */
export function memo<T extends (...args: any[]) => any>(
  fn: T,
  options: MemoOptions = {}
): T {
  const {
    maxSize = 1000,
    ttl = Infinity,
    keyFn = defaultKeyFn,
  } = options;

  const cache = new Map<string, CacheEntry<ReturnType<T>>>();
  const keys: string[] = [];

  const memoized = function (this: unknown, ...args: Parameters<T>): ReturnType<T> {
    const key = keyFn(...args);
    const now = Date.now();

    const cached = cache.get(key);
    if (cached !== undefined) {
      if (cached.expires > now) {
        // Move to end (most recently used)
        const idx = keys.indexOf(key);
        if (idx > -1) {
          keys.splice(idx, 1);
          keys.push(key);
        }
        return cached.value;
      }
      // Expired
      cache.delete(key);
      const idx = keys.indexOf(key);
      if (idx > -1) keys.splice(idx, 1);
    }

    const result = fn.apply(this, args);

    // Evict oldest if at capacity
    if (keys.length >= maxSize) {
      const oldest = keys.shift();
      if (oldest !== undefined) cache.delete(oldest);
    }

    cache.set(key, {
      value: result,
      expires: now + ttl,
    });
    keys.push(key);

    return result;
  } as T;

  // Attach cache control methods
  (memoized as any).clear = () => {
    cache.clear();
    keys.length = 0;
  };
  (memoized as any).size = () => cache.size;

  return memoized;
}

/**
 * Memoize using WeakMap for object arguments (no memory leaks)
 */
export function memoWeak<K extends object, V>(
  fn: (key: K) => V
): (key: K) => V {
  const cache = new WeakMap<K, V>();

  return (key: K): V => {
    if (cache.has(key)) {
      return cache.get(key)!;
    }
    const result = fn(key);
    cache.set(key, result);
    return result;
  };
}

/**
 * Memoize async function with deduplication
 */
export function memoAsync<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  options: MemoOptions = {}
): T {
  const {
    maxSize = 1000,
    ttl = Infinity,
    keyFn = defaultKeyFn,
  } = options;

  const cache = new Map<string, CacheEntry<ReturnType<T>>>();
  const pending = new Map<string, Promise<any>>();

  const memoized = async function (this: unknown, ...args: Parameters<T>): Promise<Awaited<ReturnType<T>>> {
    const key = keyFn(...args);
    const now = Date.now();

    // Check cache
    const cached = cache.get(key);
    if (cached !== undefined && cached.expires > now) {
      return cached.value as Awaited<ReturnType<T>>;
    }

    // Check pending requests (deduplication)
    const pendingReq = pending.get(key);
    if (pendingReq !== undefined) {
      return pendingReq;
    }

    // Execute
    const promise = fn.apply(this, args);
    pending.set(key, promise);

    try {
      const result = await promise;

      // Evict if at capacity
      if (cache.size >= maxSize) {
        const firstKey = cache.keys().next().value;
        if (firstKey !== undefined) cache.delete(firstKey);
      }

      cache.set(key, {
        value: result,
        expires: now + ttl,
      });

      return result;
    } finally {
      pending.delete(key);
    }
  } as T;

  return memoized;
}

/**
 * Clear all memo caches (for testing)
 */
export function clearMemoCache(memoizedFn: unknown): void {
  if (typeof (memoizedFn as any)?.clear === 'function') {
    (memoizedFn as any).clear();
  }
}
