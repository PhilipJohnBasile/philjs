/**
 * PhilJS ISR Memory Cache Adapter
 *
 * In-memory cache storage for development and single-instance deployments.
 * Note: Cache is lost on process restart and not shared between instances.
 */

import type { CacheAdapter, CacheStats } from '../cache.js';
import type { CacheEntry, CacheEntryMeta, RevalidationStatus } from '../config.js';

/**
 * Configuration for memory cache adapter
 */
export interface MemoryCacheConfig {
  /** Maximum number of entries to store */
  maxEntries?: number;
  /** Maximum total size in bytes (approximate) */
  maxSize?: number;
  /** Enable LRU eviction when limits are reached */
  enableLRU?: boolean;
}

/**
 * Internal cache entry with access tracking for LRU
 */
interface InternalCacheEntry extends CacheEntry {
  lastAccessedAt: number;
  approximateSize: number;
}

/**
 * In-memory cache adapter implementation
 */
export class MemoryCacheAdapter implements CacheAdapter {
  readonly name = 'memory';

  private cache: Map<string, InternalCacheEntry> = new Map();
  private tagIndex: Map<string, Set<string>> = new Map();
  private config: Required<MemoryCacheConfig>;
  private currentSize: number = 0;

  constructor(config: MemoryCacheConfig = {}) {
    this.config = {
      maxEntries: config.maxEntries ?? 1000,
      maxSize: config.maxSize ?? 100 * 1024 * 1024, // 100MB default
      enableLRU: config.enableLRU ?? true,
    };
  }

  async get(path: string): Promise<CacheEntry | null> {
    const entry = this.cache.get(path);
    if (!entry) {
      return null;
    }

    // Update access time for LRU
    entry.lastAccessedAt = Date.now();

    // Return without internal fields
    const result: CacheEntry = {
      html: entry.html,
      meta: entry.meta,
    };
    if (entry.props !== undefined) result.props = entry.props;
    if (entry.headers !== undefined) result.headers = entry.headers;
    return result;
  }

  async set(path: string, entry: CacheEntry): Promise<void> {
    const approximateSize = this.estimateSize(entry);

    // Check if we need to evict entries
    if (this.config.enableLRU) {
      await this.evictIfNeeded(approximateSize);
    }

    // Update tag index
    const existing = this.cache.get(path);
    if (existing) {
      // Remove from old tag indexes
      for (const tag of existing.meta.tags) {
        this.tagIndex.get(tag)?.delete(path);
      }
      this.currentSize -= existing.approximateSize;
    }

    // Add to new tag indexes
    for (const tag of entry.meta.tags) {
      if (!this.tagIndex.has(tag)) {
        this.tagIndex.set(tag, new Set());
      }
      this.tagIndex.get(tag)!.add(path);
    }

    // Store entry
    const internalEntry: InternalCacheEntry = {
      ...entry,
      lastAccessedAt: Date.now(),
      approximateSize,
    };
    this.cache.set(path, internalEntry);
    this.currentSize += approximateSize;
  }

  async delete(path: string): Promise<boolean> {
    const entry = this.cache.get(path);
    if (!entry) {
      return false;
    }

    // Remove from tag indexes
    for (const tag of entry.meta.tags) {
      this.tagIndex.get(tag)?.delete(path);
    }

    this.currentSize -= entry.approximateSize;
    return this.cache.delete(path);
  }

  async has(path: string): Promise<boolean> {
    return this.cache.has(path);
  }

  async keys(): Promise<string[]> {
    return Array.from(this.cache.keys());
  }

  async clear(): Promise<void> {
    this.cache.clear();
    this.tagIndex.clear();
    this.currentSize = 0;
  }

  async getByTag(tag: string): Promise<string[]> {
    const paths = this.tagIndex.get(tag);
    return paths ? Array.from(paths) : [];
  }

  async updateMeta(path: string, meta: Partial<CacheEntryMeta>): Promise<boolean> {
    const entry = this.cache.get(path);
    if (!entry) {
      return false;
    }

    // Handle tag changes
    if (meta.tags) {
      // Remove from old tag indexes
      for (const tag of entry.meta.tags) {
        this.tagIndex.get(tag)?.delete(path);
      }
      // Add to new tag indexes
      for (const tag of meta.tags) {
        if (!this.tagIndex.has(tag)) {
          this.tagIndex.set(tag, new Set());
        }
        this.tagIndex.get(tag)!.add(path);
      }
    }

    entry.meta = { ...entry.meta, ...meta };
    return true;
  }

  async getMeta(path: string): Promise<CacheEntryMeta | null> {
    const entry = this.cache.get(path);
    return entry?.meta ?? null;
  }

  async getStats(): Promise<CacheStats> {
    const entries = Array.from(this.cache.values());
    const byStatus: Record<RevalidationStatus, number> = {
      fresh: 0,
      stale: 0,
      revalidating: 0,
      error: 0,
    };

    let oldestEntry: number | undefined;
    let newestEntry: number | undefined;
    let staleCount = 0;

    for (const entry of entries) {
      byStatus[entry.meta.status]++;

      if (!oldestEntry || entry.meta.createdAt < oldestEntry) {
        oldestEntry = entry.meta.createdAt;
      }
      if (!newestEntry || entry.meta.createdAt > newestEntry) {
        newestEntry = entry.meta.createdAt;
      }

      // Check if stale
      const now = Date.now();
      const age = now - entry.meta.revalidatedAt;
      if (age > entry.meta.revalidateInterval * 1000) {
        staleCount++;
      }
    }

    const stats: CacheStats = {
      entryCount: this.cache.size,
      sizeBytes: this.currentSize,
      staleCount,
      byStatus,
    };
    if (oldestEntry !== undefined) stats.oldestEntry = oldestEntry;
    if (newestEntry !== undefined) stats.newestEntry = newestEntry;
    return stats;
  }

  async close(): Promise<void> {
    this.cache.clear();
    this.tagIndex.clear();
    this.currentSize = 0;
  }

  /**
   * Estimate the size of a cache entry in bytes
   */
  private estimateSize(entry: CacheEntry): number {
    let size = entry.html.length * 2; // UTF-16

    if (entry.props) {
      size += JSON.stringify(entry.props).length * 2;
    }

    if (entry.headers) {
      size += JSON.stringify(entry.headers).length * 2;
    }

    // Metadata overhead estimate
    size += 500;

    return size;
  }

  /**
   * Evict entries if limits are exceeded
   */
  private async evictIfNeeded(incomingSize: number): Promise<void> {
    // Check entry count limit
    if (this.cache.size >= this.config.maxEntries) {
      await this.evictLRU(1);
    }

    // Check size limit
    while (this.currentSize + incomingSize > this.config.maxSize && this.cache.size > 0) {
      await this.evictLRU(1);
    }
  }

  /**
   * Evict least recently used entries
   */
  private async evictLRU(count: number): Promise<void> {
    if (this.cache.size === 0) {
      return;
    }

    // Get entries sorted by last access time
    const entries = Array.from(this.cache.entries())
      .sort((a, b) => a[1].lastAccessedAt - b[1].lastAccessedAt);

    // Evict the oldest entries
    for (let i = 0; i < Math.min(count, entries.length); i++) {
      const entry = entries[i];
      if (entry) {
        const [path] = entry;
        await this.delete(path);
      }
    }
  }

  /**
   * Get entries sorted by access time (for debugging/monitoring)
   */
  getEntriesByAccessTime(): Array<{ path: string; lastAccessedAt: number }> {
    return Array.from(this.cache.entries())
      .map(([path, entry]) => ({
        path,
        lastAccessedAt: entry.lastAccessedAt,
      }))
      .sort((a, b) => b.lastAccessedAt - a.lastAccessedAt);
  }

  /**
   * Get current memory usage info
   */
  getMemoryInfo(): { currentSize: number; maxSize: number; usage: number } {
    return {
      currentSize: this.currentSize,
      maxSize: this.config.maxSize,
      usage: this.currentSize / this.config.maxSize,
    };
  }
}

/**
 * Create a memory cache adapter with default settings
 */
export function createMemoryCache(config?: MemoryCacheConfig): MemoryCacheAdapter {
  return new MemoryCacheAdapter(config);
}
