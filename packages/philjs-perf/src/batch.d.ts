/**
 * High-performance batching utilities
 */
import type { BatchOptions } from './types.js';
type Callback = () => void;
/**
 * Microtask scheduler for batching
 */
export declare class Scheduler {
    private queue;
    private scheduled;
    schedule(callback: Callback): void;
    private flush;
    clear(): void;
}
/**
 * Batch multiple calls into a single execution
 */
export declare function batch<T extends (...args: any[]) => void>(fn: T, options?: BatchOptions): T;
/**
 * Batch async operations
 */
export declare function batchAsync<T, R>(fn: (items: T[]) => Promise<R[]>, options?: BatchOptions): (item: T) => Promise<R>;
/**
 * Create a custom batcher with shared state
 */
export declare function createBatcher<T, R>(processBatch: (items: T[]) => R[], options?: BatchOptions): {
    add: (item: T) => void;
    flush: () => R[];
    size: () => number;
};
export {};
//# sourceMappingURL=batch.d.ts.map