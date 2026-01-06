/**
 * PhilJS ISR Runtime Cache
 *
 * Runtime cache wrapper for serving cached pages and managing cache entries.
 * This module provides a simplified interface to the cache system for runtime use.
 */

import type { CacheEntry, CacheEntryMeta, ISRConfig, ISRLogger, RevalidationStatus } from '../types.js';

/**
 * Runtime cache options
 */
export interface RuntimeCacheOptions {
  /** Cache adapter instance or type */
  adapter: import('../cache.js').CacheAdapter;
  /** Default revalidation interval */
  defaultRevalidate?: number;
  /** Stale-while-revalidate window in seconds */
  staleWhileRevalidate?: number;
  /** Logger */
  logger?: ISRLogger;
}

/**
 * Cache lookup result
 */
export interface CacheLookupResult {
  /** Whether a cache entry was found */
  found: boolean;
  /** The cache entry if found */
  entry?: CacheEntry;
  /** Whether the entry is stale */
  isStale: boolean;
  /** Whether the entry can be served (within SWR window) */
  canServe: boolean;
  /** Cache status for headers */
  status: 'HIT' | 'MISS' | 'STALE' | 'EXPIRED';
}

/**
 * Simple hash function for content
 */
function hashContent(content: string): string {
  let hash = 0;
  for (let i = 0; i < content.length; i++) {
    const char = content.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return hash.toString(36);
}

/**
 * Check if an entry is stale
 */
function isEntryStale(entry: CacheEntry): boolean {
  if (entry.meta.revalidateInterval === 0) {
    return false;
  }
  const now = Date.now();
  const age = now - entry.meta.revalidatedAt;
  return age > entry.meta.revalidateInterval * 1000;
}

/**
 * Check if entry is within stale-while-revalidate window
 */
function isWithinSWR(entry: CacheEntry, swrSeconds: number): boolean {
  if (!isEntryStale(entry)) {
    return true;
  }
  const now = Date.now();
  const staleSince = entry.meta.revalidatedAt + entry.meta.revalidateInterval * 1000;
  const swrDeadline = staleSince + swrSeconds * 1000;
  return now < swrDeadline;
}

/**
 * Runtime cache class
 */
export class RuntimeCache {
  private adapter: import('../cache.js').CacheAdapter;
  private defaultRevalidate: number;
  private staleWhileRevalidate: number;
  private logger: ISRLogger;

  constructor(options: RuntimeCacheOptions) {
    this.adapter = options.adapter;
    this.defaultRevalidate = options.defaultRevalidate ?? 3600;
    this.staleWhileRevalidate = options.staleWhileRevalidate ?? 60;
    this.logger = options.logger ?? this.createDefaultLogger();
  }

  /**
   * Look up a cache entry
   */
  async lookup(path: string): Promise<CacheLookupResult> {
    const entry = await this.adapter.get(path);

    if (!entry) {
      return {
        found: false,
        isStale: false,
        canServe: false,
        status: 'MISS',
      };
    }

    const stale = isEntryStale(entry);
    const canServe = !stale || isWithinSWR(entry, this.staleWhileRevalidate);

    let status: CacheLookupResult['status'];
    if (!stale) {
      status = 'HIT';
    } else if (canServe) {
      status = 'STALE';
    } else {
      status = 'EXPIRED';
    }

    return {
      found: true,
      entry,
      isStale: stale,
      canServe,
      status,
    };
  }

  /**
   * Get a cache entry (returns null if not found or expired)
   */
  async get(path: string, includeStale = false): Promise<CacheEntry | null> {
    const result = await this.lookup(path);

    if (!result.found) {
      return null;
    }

    if (result.isStale && !includeStale && !result.canServe) {
      return null;
    }

    return result.entry ?? null;
  }

  /**
   * Store a cache entry
   */
  async set(
    path: string,
    html: string,
    options: {
      revalidate?: number;
      tags?: string[];
      props?: Record<string, unknown>;
      headers?: Record<string, string>;
    } = {}
  ): Promise<void> {
    const now = Date.now();
    const revalidateInterval = options.revalidate ?? this.defaultRevalidate;

    const entry: CacheEntry = {
      html,
      props: options.props,
      headers: options.headers,
      meta: {
        path,
        createdAt: now,
        revalidatedAt: now,
        revalidateInterval: revalidateInterval === false ? 0 : revalidateInterval,
        tags: options.tags ?? [],
        status: 'fresh',
        regenerationCount: 0,
        contentHash: hashContent(html),
      },
    };

    await this.adapter.set(path, entry);
    this.logger.debug(`Cached: ${path}`);
  }

  /**
   * Update an existing entry with new HTML
   */
  async update(path: string, html: string): Promise<boolean> {
    const existing = await this.adapter.get(path);
    if (!existing) {
      return false;
    }

    const newHash = hashContent(html);
    const contentChanged = newHash !== existing.meta.contentHash;

    const entry: CacheEntry = {
      ...existing,
      html,
      meta: {
        ...existing.meta,
        revalidatedAt: Date.now(),
        contentHash: newHash,
        status: 'fresh',
        regenerationCount: existing.meta.regenerationCount + 1,
        lastError: undefined,
      },
    };

    await this.adapter.set(path, entry);
    this.logger.debug(`Updated: ${path} (changed: ${contentChanged})`);

    return contentChanged;
  }

  /**
   * Delete a cache entry
   */
  async delete(path: string): Promise<boolean> {
    const result = await this.adapter.delete(path);
    if (result) {
      this.logger.debug(`Deleted: ${path}`);
    }
    return result;
  }

  /**
   * Delete all entries with a specific tag
   */
  async deleteByTag(tag: string): Promise<string[]> {
    const paths = await this.adapter.getByTag(tag);
    const deleted: string[] = [];

    for (const path of paths) {
      if (await this.adapter.delete(path)) {
        deleted.push(path);
      }
    }

    this.logger.debug(`Deleted ${deleted.length} entries with tag: ${tag}`);
    return deleted;
  }

  /**
   * Check if a path exists in cache
   */
  async has(path: string): Promise<boolean> {
    return this.adapter.has(path);
  }

  /**
   * Get all cached paths
   */
  async keys(): Promise<string[]> {
    return this.adapter.keys();
  }

  /**
   * Get paths by tag
   */
  async getByTag(tag: string): Promise<string[]> {
    return this.adapter.getByTag(tag);
  }

  /**
   * Mark entry as being revalidated
   */
  async markRevalidating(path: string): Promise<void> {
    await this.adapter.updateMeta(path, { status: 'revalidating' });
  }

  /**
   * Mark entry as successfully revalidated
   */
  async markFresh(path: string): Promise<void> {
    const entry = await this.adapter.get(path);
    if (entry) {
      await this.adapter.updateMeta(path, {
        status: 'fresh',
        revalidatedAt: Date.now(),
        regenerationCount: entry.meta.regenerationCount + 1,
        lastError: undefined,
      });
    }
  }

  /**
   * Mark entry as having an error
   */
  async markError(path: string, error: string): Promise<void> {
    await this.adapter.updateMeta(path, {
      status: 'error',
      lastError: error,
    });
  }

  /**
   * Get entry metadata
   */
  async getMeta(path: string): Promise<CacheEntryMeta | null> {
    return this.adapter.getMeta(path);
  }

  /**
   * Clear all cache entries
   */
  async clear(): Promise<void> {
    await this.adapter.clear();
    this.logger.info('Cache cleared');
  }

  /**
   * Get cache statistics
   */
  async getStats(): Promise<import('../types.js').CacheStats> {
    return this.adapter.getStats();
  }

  /**
   * Generate Cache-Control header value
   */
  getCacheControl(entry: CacheEntry): string {
    const maxAge = entry.meta.revalidateInterval;
    if (maxAge === 0) {
      return 'public, max-age=31536000, immutable';
    }
    return `public, s-maxage=${maxAge}, stale-while-revalidate=${this.staleWhileRevalidate}`;
  }

  /**
   * Generate ETag for entry
   */
  getETag(entry: CacheEntry): string {
    const base = `${entry.meta.contentHash}-${entry.meta.revalidatedAt}`;
    return `"${hashContent(base)}"`;
  }

  /**
   * Close the cache adapter
   */
  async close(): Promise<void> {
    await this.adapter.close();
  }

  /**
   * Get the underlying adapter
   */
  getAdapter(): import('../cache.js').CacheAdapter {
    return this.adapter;
  }

  private createDefaultLogger(): ISRLogger {
    return {
      debug: () => {},
      info: () => {},
      warn: (msg) => console.warn(`[ISR:Cache] ${msg}`),
      error: (msg) => console.error(`[ISR:Cache] ${msg}`),
    };
  }
}

/**
 * Create a runtime cache
 */
export function createRuntimeCache(options: RuntimeCacheOptions): RuntimeCache {
  return new RuntimeCache(options);
}
