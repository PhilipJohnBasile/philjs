/**
 * High-performance LRU Cache
 */
/**
 * LRU Cache with O(1) operations
 */
export declare class LRUCache<K, V> {
    private readonly maxSize;
    private readonly cache;
    private head;
    private tail;
    constructor(maxSize: number);
    /**
     * Get a value from cache
     */
    get(key: K): V | undefined;
    /**
     * Set a value in cache
     */
    set(key: K, value: V): void;
    /**
     * Check if key exists
     */
    has(key: K): boolean;
    /**
     * Delete a key
     */
    delete(key: K): boolean;
    /**
     * Clear the cache
     */
    clear(): void;
    /**
     * Get cache size
     */
    get size(): number;
    /**
     * Get all keys (most recent first)
     */
    keys(): K[];
    /**
     * Get all entries (most recent first)
     */
    entries(): [K, V][];
    private moveToHead;
    private removeNode;
    private evictTail;
}
/**
 * Create an LRU cache
 */
export declare function createLRU<K, V>(maxSize: number): LRUCache<K, V>;
/**
 * Create a cached function with LRU eviction
 */
export declare function withLRU<K, V>(fn: (key: K) => V, maxSize: number): (key: K) => V;
//# sourceMappingURL=cache.d.ts.map