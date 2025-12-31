/**
 * High-performance LRU Cache
 */
/**
 * LRU Cache with O(1) operations
 */
export class LRUCache {
    maxSize;
    cache;
    head = null;
    tail = null;
    constructor(maxSize) {
        this.maxSize = maxSize;
        this.cache = new Map();
    }
    /**
     * Get a value from cache
     */
    get(key) {
        const node = this.cache.get(key);
        if (node === undefined) {
            return undefined;
        }
        // Move to head (most recently used)
        this.moveToHead(node);
        return node.value;
    }
    /**
     * Set a value in cache
     */
    set(key, value) {
        const existing = this.cache.get(key);
        if (existing !== undefined) {
            existing.value = value;
            this.moveToHead(existing);
            return;
        }
        // Create new node
        const node = {
            key,
            value,
            prev: null,
            next: this.head,
        };
        if (this.head !== null) {
            this.head.prev = node;
        }
        this.head = node;
        if (this.tail === null) {
            this.tail = node;
        }
        this.cache.set(key, node);
        // Evict if over capacity
        if (this.cache.size > this.maxSize) {
            this.evictTail();
        }
    }
    /**
     * Check if key exists
     */
    has(key) {
        return this.cache.has(key);
    }
    /**
     * Delete a key
     */
    delete(key) {
        const node = this.cache.get(key);
        if (node === undefined) {
            return false;
        }
        this.removeNode(node);
        this.cache.delete(key);
        return true;
    }
    /**
     * Clear the cache
     */
    clear() {
        this.cache.clear();
        this.head = null;
        this.tail = null;
    }
    /**
     * Get cache size
     */
    get size() {
        return this.cache.size;
    }
    /**
     * Get all keys (most recent first)
     */
    keys() {
        const result = [];
        let node = this.head;
        while (node !== null) {
            result.push(node.key);
            node = node.next;
        }
        return result;
    }
    /**
     * Get all entries (most recent first)
     */
    entries() {
        const result = [];
        let node = this.head;
        while (node !== null) {
            result.push([node.key, node.value]);
            node = node.next;
        }
        return result;
    }
    moveToHead(node) {
        if (node === this.head) {
            return;
        }
        this.removeNode(node);
        node.prev = null;
        node.next = this.head;
        if (this.head !== null) {
            this.head.prev = node;
        }
        this.head = node;
        if (this.tail === null) {
            this.tail = node;
        }
    }
    removeNode(node) {
        if (node.prev !== null) {
            node.prev.next = node.next;
        }
        else {
            this.head = node.next;
        }
        if (node.next !== null) {
            node.next.prev = node.prev;
        }
        else {
            this.tail = node.prev;
        }
    }
    evictTail() {
        if (this.tail === null) {
            return;
        }
        const evicted = this.tail;
        this.cache.delete(evicted.key);
        if (evicted.prev !== null) {
            evicted.prev.next = null;
            this.tail = evicted.prev;
        }
        else {
            this.head = null;
            this.tail = null;
        }
    }
}
/**
 * Create an LRU cache
 */
export function createLRU(maxSize) {
    return new LRUCache(maxSize);
}
/**
 * Create a cached function with LRU eviction
 */
export function withLRU(fn, maxSize) {
    const cache = new LRUCache(maxSize);
    return (key) => {
        const cached = cache.get(key);
        if (cached !== undefined) {
            return cached;
        }
        const result = fn(key);
        cache.set(key, result);
        return result;
    };
}
//# sourceMappingURL=cache.js.map