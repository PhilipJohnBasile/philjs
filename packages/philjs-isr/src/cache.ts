/**
 * PhilJS ISR Cache Storage Abstraction
 *
 * Provides a unified interface for cache storage backends.
 */

import type {
  CacheEntry,
  CacheEntryMeta,
  ISRConfig,
  ISRLogger,
  RevalidationStatus,
} from './config.js';

/**
 * Cache adapter interface that all storage backends must implement
 */
export interface CacheAdapter {
  /** Unique identifier for this adapter */
  readonly name: string;

  /**
   * Get a cached entry by path
   * @param path - The page path to retrieve
   * @returns The cached entry or null if not found
   */
  get(path: string): Promise<CacheEntry | null>;

  /**
   * Store a cache entry
   * @param path - The page path
   * @param entry - The cache entry to store
   */
  set(path: string, entry: CacheEntry): Promise<void>;

  /**
   * Delete a cache entry
   * @param path - The page path to delete
   * @returns True if entry was deleted, false if not found
   */
  delete(path: string): Promise<boolean>;

  /**
   * Check if a path exists in cache
   * @param path - The page path to check
   */
  has(path: string): Promise<boolean>;

  /**
   * Get all cached paths
   */
  keys(): Promise<string[]>;

  /**
   * Clear all cached entries
   */
  clear(): Promise<void>;

  /**
   * Get paths by tag
   * @param tag - The tag to search for
   */
  getByTag(tag: string): Promise<string[]>;

  /**
   * Update entry metadata without changing content
   * @param path - The page path
   * @param meta - Partial metadata to update
   */
  updateMeta(path: string, meta: Partial<CacheEntryMeta>): Promise<boolean>;

  /**
   * Get entry metadata without content
   * @param path - The page path
   */
  getMeta(path: string): Promise<CacheEntryMeta | null>;

  /**
   * Get cache statistics
   */
  getStats(): Promise<CacheStats>;

  /**
   * Close/cleanup the adapter
   */
  close(): Promise<void>;
}

/**
 * Cache statistics
 */
export interface CacheStats {
  /** Number of entries */
  entryCount: number;
  /** Approximate size in bytes */
  sizeBytes: number;
  /** Number of stale entries */
  staleCount: number;
  /** Oldest entry timestamp */
  oldestEntry?: number;
  /** Newest entry timestamp */
  newestEntry?: number;
  /** Entries by status */
  byStatus: Record<RevalidationStatus, number>;
}

/**
 * Options for cache operations
 */
export interface CacheGetOptions {
  /** Include stale entries */
  includeStale?: boolean;
  /** Update access time */
  updateAccessTime?: boolean;
}

/**
 * Options for cache set operations
 */
export interface CacheSetOptions {
  /** Time-to-live in seconds (overrides entry meta) */
  ttl?: number;
  /** Skip if entry already exists */
  skipIfExists?: boolean;
}

/**
 * Default logger implementation
 */
function createDefaultLogger(level: string): ISRLogger {
  const levels = ['debug', 'info', 'warn', 'error', 'silent'];
  const currentLevel = levels.indexOf(level);

  const shouldLog = (msgLevel: string) => levels.indexOf(msgLevel) >= currentLevel;

  return {
    debug: (msg, meta) => shouldLog('debug') && console.debug(`[ISR:Cache] ${msg}`, meta || ''),
    info: (msg, meta) => shouldLog('info') && console.info(`[ISR:Cache] ${msg}`, meta || ''),
    warn: (msg, meta) => shouldLog('warn') && console.warn(`[ISR:Cache] ${msg}`, meta || ''),
    error: (msg, meta) => shouldLog('error') && console.error(`[ISR:Cache] ${msg}`, meta || ''),
  };
}

/**
 * Create a new cache entry with metadata
 */
export function createCacheEntry(
  path: string,
  html: string,
  options: {
    revalidateInterval?: number;
    tags?: string[];
    props?: Record<string, unknown>;
    headers?: Record<string, string>;
  } = {}
): CacheEntry {
  const now = Date.now();
  const entry: CacheEntry = {
    html,
    meta: {
      path,
      createdAt: now,
      revalidatedAt: now,
      revalidateInterval: options.revalidateInterval ?? 3600,
      tags: options.tags ?? [],
      status: 'fresh',
      regenerationCount: 0,
      contentHash: hashContent(html),
    },
  };
  if (options.props !== undefined) entry.props = options.props;
  if (options.headers !== undefined) entry.headers = options.headers;
  return entry;
}

/**
 * Simple hash function for content change detection
 */
export function hashContent(content: string): string {
  let hash = 0;
  for (let i = 0; i < content.length; i++) {
    const char = content.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return hash.toString(36);
}

/**
 * Check if a cache entry is stale
 */
export function isStale(entry: CacheEntry): boolean {
  if (entry.meta.revalidateInterval === 0) {
    return false; // Never stale if revalidate is 0 (static forever)
  }
  const now = Date.now();
  const age = now - entry.meta.revalidatedAt;
  return age > entry.meta.revalidateInterval * 1000;
}

/**
 * Check if entry is within stale-while-revalidate window
 */
export function isWithinSWRWindow(entry: CacheEntry, swrSeconds: number): boolean {
  if (!isStale(entry)) {
    return true; // Not stale yet
  }
  const now = Date.now();
  const staleSince = entry.meta.revalidatedAt + entry.meta.revalidateInterval * 1000;
  const swrDeadline = staleSince + swrSeconds * 1000;
  return now < swrDeadline;
}

/**
 * Generate cache-control header value
 */
export function generateCacheControl(entry: CacheEntry, swrSeconds: number = 60): string {
  const maxAge = entry.meta.revalidateInterval;
  if (maxAge === 0) {
    return 'public, max-age=31536000, immutable';
  }
  return `public, s-maxage=${maxAge}, stale-while-revalidate=${swrSeconds}`;
}

/**
 * Generate ETag for a cache entry
 */
export function generateETag(entry: CacheEntry): string {
  const base = `${entry.meta.contentHash}-${entry.meta.revalidatedAt}`;
  return `"${hashContent(base)}"`;
}

/**
 * Cache manager that wraps adapters with common functionality
 */
export class CacheManager {
  private adapter: CacheAdapter;
  private logger: ISRLogger;
  private config: ISRConfig;
  private tagIndex: Map<string, Set<string>> = new Map();

  constructor(adapter: CacheAdapter, config: ISRConfig) {
    this.adapter = adapter;
    this.config = config;
    this.logger = config.logger ?? createDefaultLogger(config.logLevel ?? 'info');
  }

  /**
   * Get entry from cache with staleness check
   */
  async get(path: string, options: CacheGetOptions = {}): Promise<CacheEntry | null> {
    try {
      const entry = await this.adapter.get(path);
      if (!entry) {
        this.logger.debug(`Cache miss: ${path}`);
        return null;
      }

      // Check if stale and caller doesn't want stale entries
      if (isStale(entry) && !options.includeStale) {
        this.logger.debug(`Cache stale: ${path}`);
        return null;
      }

      this.logger.debug(`Cache hit: ${path}`, { stale: isStale(entry) });
      return entry;
    } catch (error) {
      this.logger.error(`Cache get error: ${path}`, { error });
      return null;
    }
  }

  /**
   * Get entry including stale (for stale-while-revalidate)
   */
  async getWithStale(path: string): Promise<{ entry: CacheEntry | null; isStale: boolean }> {
    const entry = await this.adapter.get(path);
    if (!entry) {
      return { entry: null, isStale: false };
    }
    return { entry, isStale: isStale(entry) };
  }

  /**
   * Store entry in cache
   */
  async set(path: string, entry: CacheEntry, options: CacheSetOptions = {}): Promise<void> {
    try {
      // Check skip if exists
      if (options.skipIfExists && await this.adapter.has(path)) {
        this.logger.debug(`Cache skip (exists): ${path}`);
        return;
      }

      // Apply TTL override
      if (options.ttl !== undefined) {
        entry.meta.revalidateInterval = options.ttl;
      }

      // Update internal tag index
      for (const tag of entry.meta.tags) {
        if (!this.tagIndex.has(tag)) {
          this.tagIndex.set(tag, new Set());
        }
        this.tagIndex.get(tag)!.add(path);
      }

      // Generate ETag
      entry.meta.etag = generateETag(entry);

      await this.adapter.set(path, entry);
      this.logger.info(`Cache set: ${path}`, { tags: entry.meta.tags });
    } catch (error) {
      this.logger.error(`Cache set error: ${path}`, { error });
      throw error;
    }
  }

  /**
   * Delete entry from cache
   */
  async delete(path: string): Promise<boolean> {
    try {
      // Get entry first to update tag index
      const entry = await this.adapter.get(path);
      if (entry) {
        for (const tag of entry.meta.tags) {
          this.tagIndex.get(tag)?.delete(path);
        }
      }

      const result = await this.adapter.delete(path);
      this.logger.info(`Cache delete: ${path}`, { success: result });
      return result;
    } catch (error) {
      this.logger.error(`Cache delete error: ${path}`, { error });
      return false;
    }
  }

  /**
   * Get all paths with a specific tag
   */
  async getByTag(tag: string): Promise<string[]> {
    // First check internal index for quick lookup
    const indexedPaths = this.tagIndex.get(tag);
    if (indexedPaths && indexedPaths.size > 0) {
      return Array.from(indexedPaths);
    }

    // Fall back to adapter
    return this.adapter.getByTag(tag);
  }

  /**
   * Mark entry as being revalidated
   */
  async markRevalidating(path: string): Promise<void> {
    await this.adapter.updateMeta(path, {
      status: 'revalidating',
    });
  }

  /**
   * Mark entry as revalidated with new timestamp
   */
  async markRevalidated(path: string): Promise<void> {
    const entry = await this.adapter.get(path);
    if (entry) {
      const updateMeta: Partial<CacheEntryMeta> = {
        status: 'fresh',
        revalidatedAt: Date.now(),
        regenerationCount: entry.meta.regenerationCount + 1,
      };
      // Clear lastError by not including it in update
      await this.adapter.updateMeta(path, updateMeta);
    }
  }

  /**
   * Mark entry as failed revalidation
   */
  async markError(path: string, error: string): Promise<void> {
    await this.adapter.updateMeta(path, {
      status: 'error',
      lastError: error,
    });
  }

  /**
   * Clear all entries
   */
  async clear(): Promise<void> {
    await this.adapter.clear();
    this.tagIndex.clear();
    this.logger.info('Cache cleared');
  }

  /**
   * Get all cached paths
   */
  async keys(): Promise<string[]> {
    return this.adapter.keys();
  }

  /**
   * Get cache statistics
   */
  async getStats(): Promise<CacheStats> {
    return this.adapter.getStats();
  }

  /**
   * Cleanup and close
   */
  async close(): Promise<void> {
    await this.adapter.close();
    this.tagIndex.clear();
  }

  /**
   * Get the underlying adapter
   */
  getAdapter(): CacheAdapter {
    return this.adapter;
  }

  /**
   * Rebuild tag index from adapter
   */
  async rebuildTagIndex(): Promise<void> {
    this.tagIndex.clear();
    const keys = await this.adapter.keys();
    for (const key of keys) {
      const meta = await this.adapter.getMeta(key);
      if (meta) {
        for (const tag of meta.tags) {
          if (!this.tagIndex.has(tag)) {
            this.tagIndex.set(tag, new Set());
          }
          this.tagIndex.get(tag)!.add(key);
        }
      }
    }
    this.logger.info('Tag index rebuilt', { tagCount: this.tagIndex.size });
  }
}

/**
 * Create cache manager from config
 */
export async function createCacheManager(config: ISRConfig): Promise<CacheManager> {
  let adapter: CacheAdapter;

  if (typeof config.cache === 'string') {
    // Import and create built-in adapter
    switch (config.cache) {
      case 'memory': {
        const { MemoryCacheAdapter } = await import('./adapters/memory.js');
        adapter = new MemoryCacheAdapter();
        break;
      }
      case 'redis': {
        const { RedisCacheAdapter } = await import('./adapters/redis.js');
        adapter = new RedisCacheAdapter(config.redis);
        break;
      }
      case 'filesystem': {
        const { FilesystemCacheAdapter } = await import('./adapters/filesystem.js');
        adapter = new FilesystemCacheAdapter(config.filesystem);
        break;
      }
      case 'cloudflare-kv': {
        const { CloudflareKVAdapter } = await import('./adapters/cloudflare-kv.js');
        adapter = new CloudflareKVAdapter(config.cloudflareKV);
        break;
      }
      case 'vercel': {
        const { VercelKVAdapter } = await import('./adapters/vercel.js');
        adapter = new VercelKVAdapter(config.vercelKV);
        break;
      }
      default:
        throw new Error(`[ISR] Unknown cache adapter: ${config.cache}`);
    }
  } else {
    // Use provided adapter instance
    adapter = config.cache;
  }

  const manager = new CacheManager(adapter, config);

  // Rebuild tag index on startup
  await manager.rebuildTagIndex();

  return manager;
}
