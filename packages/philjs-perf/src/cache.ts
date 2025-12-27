/**
 * High-performance LRU Cache
 */

interface CacheNode<K, V> {
  key: K;
  value: V;
  prev: CacheNode<K, V> | null;
  next: CacheNode<K, V> | null;
}

/**
 * LRU Cache with O(1) operations
 */
export class LRUCache<K, V> {
  private readonly maxSize: number;
  private readonly cache: Map<K, CacheNode<K, V>>;
  private head: CacheNode<K, V> | null = null;
  private tail: CacheNode<K, V> | null = null;

  constructor(maxSize: number) {
    this.maxSize = maxSize;
    this.cache = new Map();
  }

  /**
   * Get a value from cache
   */
  get(key: K): V | undefined {
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
  set(key: K, value: V): void {
    const existing = this.cache.get(key);

    if (existing !== undefined) {
      existing.value = value;
      this.moveToHead(existing);
      return;
    }

    // Create new node
    const node: CacheNode<K, V> = {
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
  has(key: K): boolean {
    return this.cache.has(key);
  }

  /**
   * Delete a key
   */
  delete(key: K): boolean {
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
  clear(): void {
    this.cache.clear();
    this.head = null;
    this.tail = null;
  }

  /**
   * Get cache size
   */
  get size(): number {
    return this.cache.size;
  }

  /**
   * Get all keys (most recent first)
   */
  keys(): K[] {
    const result: K[] = [];
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
  entries(): [K, V][] {
    const result: [K, V][] = [];
    let node = this.head;
    while (node !== null) {
      result.push([node.key, node.value]);
      node = node.next;
    }
    return result;
  }

  private moveToHead(node: CacheNode<K, V>): void {
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

  private removeNode(node: CacheNode<K, V>): void {
    if (node.prev !== null) {
      node.prev.next = node.next;
    } else {
      this.head = node.next;
    }

    if (node.next !== null) {
      node.next.prev = node.prev;
    } else {
      this.tail = node.prev;
    }
  }

  private evictTail(): void {
    if (this.tail === null) {
      return;
    }

    const evicted = this.tail;
    this.cache.delete(evicted.key);

    if (evicted.prev !== null) {
      evicted.prev.next = null;
      this.tail = evicted.prev;
    } else {
      this.head = null;
      this.tail = null;
    }
  }
}

/**
 * Create an LRU cache
 */
export function createLRU<K, V>(maxSize: number): LRUCache<K, V> {
  return new LRUCache(maxSize);
}

/**
 * Create a cached function with LRU eviction
 */
export function withLRU<K, V>(
  fn: (key: K) => V,
  maxSize: number
): (key: K) => V {
  const cache = new LRUCache<K, V>(maxSize);

  return (key: K): V => {
    const cached = cache.get(key);
    if (cached !== undefined) {
      return cached;
    }

    const result = fn(key);
    cache.set(key, result);
    return result;
  };
}
