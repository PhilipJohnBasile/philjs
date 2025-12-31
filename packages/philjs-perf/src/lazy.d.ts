/**
 * Lazy evaluation utilities
 */
import type { LazyOptions } from './types.js';
/**
 * Lazy value container
 */
export declare class LazyValue<T> {
    private value;
    private readonly factory;
    private readonly shouldCache;
    constructor(factory: () => T, options?: LazyOptions);
    /**
     * Get the value (computing if necessary)
     */
    get(): T;
    /**
     * Check if value has been computed
     */
    isComputed(): boolean;
    /**
     * Reset to uncomputed state
     */
    reset(): void;
    /**
     * Map over the lazy value
     */
    map<U>(fn: (value: T) => U): LazyValue<U>;
    /**
     * FlatMap over the lazy value
     */
    flatMap<U>(fn: (value: T) => LazyValue<U>): LazyValue<U>;
}
/**
 * Create a lazy value
 */
export declare function lazy<T>(factory: () => T, options?: LazyOptions): LazyValue<T>;
/**
 * Create a lazy async value
 */
export declare function lazyAsync<T>(factory: () => Promise<T>, options?: LazyOptions): () => Promise<T>;
/**
 * Lazy property decorator pattern
 */
export declare function lazyProp<T extends object, K extends keyof T>(target: T, key: K, factory: () => T[K]): void;
/**
 * Lazy initialization for expensive operations
 */
export declare function lazyInit<T>(factory: () => T): {
    value: T;
    reset: () => void;
};
//# sourceMappingURL=lazy.d.ts.map