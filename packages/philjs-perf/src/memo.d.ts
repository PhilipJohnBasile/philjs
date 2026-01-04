/**
 * High-performance memoization utilities
 */
import type { MemoOptions } from './types.js';
/**
 * Memoize a function with LRU cache
 */
export declare function memo<T extends (...args: any[]) => any>(fn: T, options?: MemoOptions): T;
/**
 * Memoize using WeakMap for object arguments (no memory leaks)
 */
export declare function memoWeak<K extends object, V>(fn: (key: K) => V): (key: K) => V;
/**
 * Memoize async function with deduplication
 */
export declare function memoAsync<T extends (...args: any[]) => Promise<any>>(fn: T, options?: MemoOptions): T;
/**
 * Clear all memo caches (for testing)
 */
export declare function clearMemoCache(memoizedFn: unknown): void;
//# sourceMappingURL=memo.d.ts.map