/**
 * Object pooling for reducing GC pressure
 */

import type { PoolOptions } from './types.js';

/**
 * Generic object pool
 */
export class ObjectPool<T> {
  private pool: T[] = [];
  private readonly create: () => T;
  private readonly reset?: ((obj: T) => void) | undefined;
  private readonly validate?: ((obj: T) => boolean) | undefined;
  private readonly maxSize: number;

  constructor(options: PoolOptions<T>) {
    this.create = options.create;
    this.reset = options.reset;
    this.validate = options.validate;
    this.maxSize = options.maxSize ?? 100;

    // Pre-populate pool
    const initialSize = options.initialSize ?? 0;
    for (let i = 0; i < initialSize; i++) {
      this.pool.push(this.create());
    }
  }

  /**
   * Acquire an object from the pool
   */
  acquire(): T {
    while (this.pool.length > 0) {
      const obj = this.pool.pop()!;

      // Validate if validator provided
      if (this.validate && !this.validate(obj)) {
        continue; // Skip invalid objects
      }

      return obj;
    }

    // Pool empty, create new
    return this.create();
  }

  /**
   * Release an object back to the pool
   */
  release(obj: T): void {
    if (this.pool.length >= this.maxSize) {
      return; // Pool full, let GC handle it
    }

    // Reset object state
    if (this.reset) {
      this.reset(obj);
    }

    this.pool.push(obj);
  }

  /**
   * Clear the pool
   */
  clear(): void {
    this.pool.length = 0;
  }

  /**
   * Get current pool size
   */
  get size(): number {
    return this.pool.length;
  }

  /**
   * Use object with automatic release
   */
  use<R>(fn: (obj: T) => R): R {
    const obj = this.acquire();
    try {
      return fn(obj);
    } finally {
      this.release(obj);
    }
  }

  /**
   * Use object with async automatic release
   */
  async useAsync<R>(fn: (obj: T) => Promise<R>): Promise<R> {
    const obj = this.acquire();
    try {
      return await fn(obj);
    } finally {
      this.release(obj);
    }
  }
}

/**
 * Create an object pool
 */
export function createPool<T>(options: PoolOptions<T>): ObjectPool<T> {
  return new ObjectPool(options);
}

// Pre-built pools for common cases

/**
 * Pool for reusable arrays
 */
export const arrayPool = createPool<unknown[]>({
  create: () => [],
  reset: (arr) => { arr.length = 0; },
  maxSize: 50,
});

/**
 * Pool for reusable objects
 */
export const objectPool = createPool<Record<string, unknown>>({
  create: () => ({}),
  reset: (obj) => {
    for (const key in obj) {
      delete obj[key];
    }
  },
  maxSize: 50,
});

/**
 * Pool for reusable Maps
 */
export const mapPool = createPool<Map<unknown, unknown>>({
  create: () => new Map(),
  reset: (map) => map.clear(),
  maxSize: 20,
});

/**
 * Pool for reusable Sets
 */
export const setPool = createPool<Set<unknown>>({
  create: () => new Set(),
  reset: (set) => set.clear(),
  maxSize: 20,
});
