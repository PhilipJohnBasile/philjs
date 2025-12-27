/**
 * Lazy evaluation utilities
 */

import type { LazyOptions } from './types.js';

const NOT_COMPUTED = Symbol('NOT_COMPUTED');

/**
 * Lazy value container
 */
export class LazyValue<T> {
  private value: T | typeof NOT_COMPUTED = NOT_COMPUTED;
  private readonly factory: () => T;
  private readonly shouldCache: boolean;

  constructor(factory: () => T, options: LazyOptions = {}) {
    this.factory = factory;
    this.shouldCache = options.cache !== false;
  }

  /**
   * Get the value (computing if necessary)
   */
  get(): T {
    if (this.value === NOT_COMPUTED) {
      const result = this.factory();
      if (this.shouldCache) {
        this.value = result;
      }
      return result;
    }
    return this.value as T;
  }

  /**
   * Check if value has been computed
   */
  isComputed(): boolean {
    return this.value !== NOT_COMPUTED;
  }

  /**
   * Reset to uncomputed state
   */
  reset(): void {
    this.value = NOT_COMPUTED;
  }

  /**
   * Map over the lazy value
   */
  map<U>(fn: (value: T) => U): LazyValue<U> {
    return new LazyValue(() => fn(this.get()), { cache: this.shouldCache });
  }

  /**
   * FlatMap over the lazy value
   */
  flatMap<U>(fn: (value: T) => LazyValue<U>): LazyValue<U> {
    return new LazyValue(() => fn(this.get()).get(), { cache: this.shouldCache });
  }
}

/**
 * Create a lazy value
 */
export function lazy<T>(factory: () => T, options?: LazyOptions): LazyValue<T> {
  return new LazyValue(factory, options);
}

/**
 * Create a lazy async value
 */
export function lazyAsync<T>(
  factory: () => Promise<T>,
  options?: LazyOptions
): () => Promise<T> {
  let promise: Promise<T> | null = null;
  let result: T | typeof NOT_COMPUTED = NOT_COMPUTED;
  const shouldCache = options?.cache !== false;

  return async (): Promise<T> => {
    if (result !== NOT_COMPUTED) {
      return result as T;
    }

    if (promise !== null) {
      return promise;
    }

    promise = factory();

    try {
      const value = await promise;
      if (shouldCache) {
        result = value;
      }
      return value;
    } finally {
      if (!shouldCache) {
        promise = null;
      }
    }
  };
}

/**
 * Lazy property decorator pattern
 */
export function lazyProp<T extends object, K extends keyof T>(
  target: T,
  key: K,
  factory: () => T[K]
): void {
  let value: T[K] | typeof NOT_COMPUTED = NOT_COMPUTED;

  Object.defineProperty(target, key, {
    get(): T[K] {
      if (value === NOT_COMPUTED) {
        value = factory();
      }
      return value as T[K];
    },
    configurable: true,
    enumerable: true,
  });
}

/**
 * Lazy initialization for expensive operations
 */
export function lazyInit<T>(factory: () => T): { value: T; reset: () => void } {
  let computed = false;
  let value: T;

  return {
    get value(): T {
      if (!computed) {
        value = factory();
        computed = true;
      }
      return value;
    },
    reset(): void {
      computed = false;
      value = undefined as T;
    },
  };
}
