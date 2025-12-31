/**
 * Object pooling for reducing GC pressure
 */
import type { PoolOptions } from './types.js';
/**
 * Generic object pool
 */
export declare class ObjectPool<T> {
    private pool;
    private readonly create;
    private readonly reset?;
    private readonly validate?;
    private readonly maxSize;
    constructor(options: PoolOptions<T>);
    /**
     * Acquire an object from the pool
     */
    acquire(): T;
    /**
     * Release an object back to the pool
     */
    release(obj: T): void;
    /**
     * Clear the pool
     */
    clear(): void;
    /**
     * Get current pool size
     */
    get size(): number;
    /**
     * Use object with automatic release
     */
    use<R>(fn: (obj: T) => R): R;
    /**
     * Use object with async automatic release
     */
    useAsync<R>(fn: (obj: T) => Promise<R>): Promise<R>;
}
/**
 * Create an object pool
 */
export declare function createPool<T>(options: PoolOptions<T>): ObjectPool<T>;
/**
 * Pool for reusable arrays
 */
export declare const arrayPool: ObjectPool<unknown[]>;
/**
 * Pool for reusable objects
 */
export declare const objectPool: ObjectPool<Record<string, unknown>>;
/**
 * Pool for reusable Maps
 */
export declare const mapPool: ObjectPool<Map<unknown, unknown>>;
/**
 * Pool for reusable Sets
 */
export declare const setPool: ObjectPool<Set<unknown>>;
//# sourceMappingURL=pool.d.ts.map