/**
 * Performance utility types
 */

export interface MemoOptions {
  /** Max cache size (default: 1000) */
  maxSize?: number;
  /** TTL in ms (default: Infinity) */
  ttl?: number;
  /** Custom cache key generator */
  keyFn?: (...args: unknown[]) => string;
}

export interface BatchOptions {
  /** Max wait time in ms (default: 0 = microtask) */
  wait?: number;
  /** Max batch size (default: Infinity) */
  maxSize?: number;
  /** Leading edge execution */
  leading?: boolean;
}

export interface PoolOptions<T> {
  /** Initial pool size */
  initialSize?: number;
  /** Max pool size */
  maxSize?: number;
  /** Factory function */
  create: () => T;
  /** Reset function for recycling */
  reset?: (obj: T) => void;
  /** Validation before reuse */
  validate?: (obj: T) => boolean;
}

export interface LazyOptions {
  /** Cache the result */
  cache?: boolean;
}
