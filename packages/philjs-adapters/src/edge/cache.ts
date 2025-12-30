/**
 * PhilJS Edge Cache - Edge Caching with Stale-While-Revalidate
 *
 * Provides unified caching capabilities across edge platforms:
 * - In-memory caching with LRU eviction
 * - Stale-while-revalidate pattern
 * - Edge KV store abstraction
 * - Cache tags for invalidation
 * - Automatic asset optimization caching
 */

import { detectEdgePlatform, type EdgePlatform, type EdgeKVNamespace, type EdgeKVListOptions } from './edge-runtime.js';

// ============================================================================
// Types
// ============================================================================

export interface CacheEntry<T = unknown> {
  /** Cached value */
  value: T;
  /** When the entry was created */
  createdAt: number;
  /** When the entry expires (stale) */
  staleAt: number;
  /** When the entry should be deleted */
  expiresAt: number;
  /** Cache tags for invalidation */
  tags?: string[];
  /** ETag for conditional requests */
  etag?: string;
  /** Last modified timestamp */
  lastModified?: number;
}

export interface CacheOptions {
  /** Time-to-live in seconds (before stale) */
  ttl?: number;
  /** Stale-while-revalidate window in seconds */
  swr?: number;
  /** Cache tags for invalidation */
  tags?: string[];
  /** Custom cache key */
  key?: string;
  /** Whether to cache errors */
  cacheErrors?: boolean;
}

export interface EdgeCacheConfig {
  /** Default TTL in seconds */
  defaultTTL?: number;
  /** Default SWR window in seconds */
  defaultSWR?: number;
  /** Maximum entries in memory cache */
  maxEntries?: number;
  /** Maximum memory size in bytes */
  maxSize?: number;
  /** KV namespace for persistent cache (Cloudflare/Deno) */
  kvNamespace?: EdgeKVNamespace | string;
  /** Cache key prefix */
  keyPrefix?: string;
}

export interface CacheStats {
  /** Number of cache hits */
  hits: number;
  /** Number of cache misses */
  misses: number;
  /** Number of stale hits (SWR) */
  staleHits: number;
  /** Number of revalidations */
  revalidations: number;
  /** Current number of entries */
  entries: number;
  /** Approximate memory usage */
  memoryUsage: number;
}

// ============================================================================
// In-Memory LRU Cache
// ============================================================================

interface LRUNode<T> {
  key: string;
  entry: CacheEntry<T>;
  prev: LRUNode<T> | null;
  next: LRUNode<T> | null;
  size: number;
}

class LRUCache<T = unknown> {
  private cache = new Map<string, LRUNode<T>>();
  private head: LRUNode<T> | null = null;
  private tail: LRUNode<T> | null = null;
  private currentSize = 0;
  private stats: CacheStats = {
    hits: 0,
    misses: 0,
    staleHits: 0,
    revalidations: 0,
    entries: 0,
    memoryUsage: 0,
  };

  constructor(
    private maxEntries: number = 1000,
    private maxSize: number = 50 * 1024 * 1024 // 50MB
  ) {}

  get(key: string): CacheEntry<T> | undefined {
    const node = this.cache.get(key);
    if (!node) {
      this.stats.misses++;
      return undefined;
    }

    const now = Date.now();

    // Check if completely expired
    if (node.entry.expiresAt < now) {
      this.delete(key);
      this.stats.misses++;
      return undefined;
    }

    // Move to front (most recently used)
    this.moveToFront(node);

    // Check if stale
    if (node.entry.staleAt < now) {
      this.stats.staleHits++;
    } else {
      this.stats.hits++;
    }

    return node.entry;
  }

  set(key: string, entry: CacheEntry<T>): void {
    const size = this.estimateSize(entry);

    // Check if entry already exists
    const existing = this.cache.get(key);
    if (existing) {
      this.currentSize -= existing.size;
      existing.entry = entry;
      existing.size = size;
      this.currentSize += size;
      this.moveToFront(existing);
    } else {
      // Evict if necessary
      while (
        (this.cache.size >= this.maxEntries || this.currentSize + size > this.maxSize) &&
        this.tail
      ) {
        this.evictLRU();
      }

      const node: LRUNode<T> = {
        key,
        entry,
        prev: null,
        next: this.head,
        size,
      };

      if (this.head) {
        this.head.prev = node;
      }
      this.head = node;

      if (!this.tail) {
        this.tail = node;
      }

      this.cache.set(key, node);
      this.currentSize += size;
    }

    this.stats.entries = this.cache.size;
    this.stats.memoryUsage = this.currentSize;
  }

  delete(key: string): boolean {
    const node = this.cache.get(key);
    if (!node) return false;

    this.removeNode(node);
    this.cache.delete(key);
    this.currentSize -= node.size;

    this.stats.entries = this.cache.size;
    this.stats.memoryUsage = this.currentSize;

    return true;
  }

  deleteByTag(tag: string): number {
    let count = 0;
    for (const [key, node] of this.cache) {
      if (node.entry.tags?.includes(tag)) {
        this.delete(key);
        count++;
      }
    }
    return count;
  }

  clear(): void {
    this.cache.clear();
    this.head = null;
    this.tail = null;
    this.currentSize = 0;
    this.stats.entries = 0;
    this.stats.memoryUsage = 0;
  }

  getStats(): CacheStats {
    return { ...this.stats };
  }

  resetStats(): void {
    this.stats.hits = 0;
    this.stats.misses = 0;
    this.stats.staleHits = 0;
    this.stats.revalidations = 0;
  }

  private moveToFront(node: LRUNode<T>): void {
    if (node === this.head) return;

    this.removeNode(node);

    node.prev = null;
    node.next = this.head;

    if (this.head) {
      this.head.prev = node;
    }
    this.head = node;

    if (!this.tail) {
      this.tail = node;
    }
  }

  private removeNode(node: LRUNode<T>): void {
    if (node.prev) {
      node.prev.next = node.next;
    } else {
      this.head = node.next;
    }

    if (node.next) {
      node.next.prev = node.prev;
    } else {
      this.tail = node.prev;
    }
  }

  private evictLRU(): void {
    if (!this.tail) return;

    const key = this.tail.key;
    this.removeNode(this.tail);
    const node = this.cache.get(key);
    if (node) {
      this.currentSize -= node.size;
      this.cache.delete(key);
    }
  }

  private estimateSize(entry: CacheEntry<T>): number {
    // Rough estimate of memory usage
    try {
      return JSON.stringify(entry).length * 2; // UTF-16 characters
    } catch {
      return 1024; // Default estimate for non-serializable values
    }
  }
}

// ============================================================================
// Edge KV Store Abstraction
// ============================================================================

export interface EdgeKVStore {
  get<T>(key: string): Promise<CacheEntry<T> | null>;
  set<T>(key: string, entry: CacheEntry<T>): Promise<void>;
  delete(key: string): Promise<void>;
  deleteByPrefix(prefix: string): Promise<number>;
}

/**
 * Create a KV store adapter for Cloudflare KV
 */
function createCloudflareKVStore(namespace: EdgeKVNamespace): EdgeKVStore {
  return {
    async get<T>(key: string): Promise<CacheEntry<T> | null> {
      try {
        const value = await namespace.get(key, { type: 'json' });
        return value as CacheEntry<T> | null;
      } catch {
        return null;
      }
    },

    async set<T>(key: string, entry: CacheEntry<T>): Promise<void> {
      const ttlSeconds = Math.max(1, Math.ceil((entry.expiresAt - Date.now()) / 1000));
      await namespace.put(key, JSON.stringify(entry), {
        expirationTtl: ttlSeconds,
      });
    },

    async delete(key: string): Promise<void> {
      await namespace.delete(key);
    },

    async deleteByPrefix(prefix: string): Promise<number> {
      let count = 0;
      let cursor: string | undefined;

      do {
        const listOptions: EdgeKVListOptions = { prefix, limit: 1000 };
        if (cursor !== undefined) {
          listOptions.cursor = cursor;
        }
        const result = await namespace.list(listOptions);
        const deletePromises = result.keys.map((k) => namespace.delete(k.name));
        await Promise.all(deletePromises);
        count += result.keys.length;
        cursor = result.list_complete ? undefined : result.cursor;
      } while (cursor);

      return count;
    },
  };
}

/**
 * Create a KV store adapter for Deno KV
 */
function createDenoKVStore(): EdgeKVStore {
  let kvPromise: Promise<any> | null = null;

  const getKV = async () => {
    if (!kvPromise) {
      kvPromise = (globalThis as any).Deno.openKv();
    }
    return kvPromise;
  };

  return {
    async get<T>(key: string): Promise<CacheEntry<T> | null> {
      try {
        const kv = await getKV();
        const result = await kv.get(['cache', key]);
        return result.value as CacheEntry<T> | null;
      } catch {
        return null;
      }
    },

    async set<T>(key: string, entry: CacheEntry<T>): Promise<void> {
      const kv = await getKV();
      const ttlMs = entry.expiresAt - Date.now();
      await kv.set(['cache', key], entry, {
        expireIn: Math.max(1000, ttlMs),
      });
    },

    async delete(key: string): Promise<void> {
      const kv = await getKV();
      await kv.delete(['cache', key]);
    },

    async deleteByPrefix(prefix: string): Promise<number> {
      const kv = await getKV();
      let count = 0;

      const iter = kv.list({ prefix: ['cache', prefix] });
      for await (const entry of iter) {
        await kv.delete(entry.key);
        count++;
      }

      return count;
    },
  };
}

// ============================================================================
// Edge Cache Implementation
// ============================================================================

export class EdgeCache {
  private memoryCache: LRUCache;
  private kvStore?: EdgeKVStore;
  private revalidating = new Set<string>();
  private config: Required<EdgeCacheConfig>;

  constructor(config: EdgeCacheConfig = {}) {
    this.config = {
      defaultTTL: config.defaultTTL ?? 60,
      defaultSWR: config.defaultSWR ?? 60,
      maxEntries: config.maxEntries ?? 1000,
      maxSize: config.maxSize ?? 50 * 1024 * 1024,
      kvNamespace: config.kvNamespace ?? '',
      keyPrefix: config.keyPrefix ?? 'philjs:',
    };

    this.memoryCache = new LRUCache(this.config.maxEntries, this.config.maxSize);

    // Initialize KV store based on platform
    this.initKVStore();
  }

  private initKVStore(): void {
    const platform = detectEdgePlatform();

    if (this.config.kvNamespace) {
      if (typeof this.config.kvNamespace === 'string') {
        // Named namespace - platform specific lookup
        if (platform === 'cloudflare') {
          const env = (globalThis as any).env;
          const namespace = env?.[this.config.kvNamespace];
          if (namespace) {
            this.kvStore = createCloudflareKVStore(namespace);
          }
        }
      } else {
        // Direct namespace reference
        this.kvStore = createCloudflareKVStore(this.config.kvNamespace);
      }
    } else if (platform === 'deno') {
      this.kvStore = createDenoKVStore();
    }
  }

  private getFullKey(key: string): string {
    return `${this.config.keyPrefix}${key}`;
  }

  /**
   * Get a value from cache with SWR support
   */
  async get<T>(
    key: string,
    revalidate?: () => Promise<T>
  ): Promise<{ value: T | undefined; stale: boolean; hit: boolean }> {
    const fullKey = this.getFullKey(key);
    const now = Date.now();

    // Check memory cache first
    let entry = this.memoryCache.get(fullKey) as CacheEntry<T> | undefined;

    // Try KV store if not in memory
    if (!entry && this.kvStore) {
      entry = await this.kvStore.get<T>(fullKey) ?? undefined;
      if (entry) {
        // Populate memory cache
        this.memoryCache.set(fullKey, entry);
      }
    }

    if (!entry) {
      return { value: undefined, stale: false, hit: false };
    }

    const isStale = entry.staleAt < now;
    const isExpired = entry.expiresAt < now;

    if (isExpired) {
      this.delete(key);
      return { value: undefined, stale: false, hit: false };
    }

    // Trigger background revalidation for stale entries
    if (isStale && revalidate && !this.revalidating.has(fullKey)) {
      this.revalidating.add(fullKey);

      // Background revalidation
      revalidate()
        .then((newValue) => {
          const cacheOptions: CacheOptions = {
            ttl: this.config.defaultTTL,
            swr: this.config.defaultSWR,
          };
          if (entry?.tags !== undefined) {
            cacheOptions.tags = entry.tags;
          }
          this.set(key, newValue, cacheOptions);
        })
        .catch((error) => {
          console.error(`Revalidation failed for ${key}:`, error);
        })
        .finally(() => {
          this.revalidating.delete(fullKey);
        });
    }

    return { value: entry.value, stale: isStale, hit: true };
  }

  /**
   * Set a value in cache
   */
  async set<T>(key: string, value: T, options: CacheOptions = {}): Promise<void> {
    const fullKey = this.getFullKey(key);
    const now = Date.now();

    const ttl = options.ttl ?? this.config.defaultTTL;
    const swr = options.swr ?? this.config.defaultSWR;

    const entry: CacheEntry<T> = {
      value,
      createdAt: now,
      staleAt: now + ttl * 1000,
      expiresAt: now + (ttl + swr) * 1000,
      lastModified: now,
    };

    if (options.tags !== undefined) {
      entry.tags = options.tags;
    }

    // Generate ETag
    try {
      const hash = await this.generateETag(value);
      entry.etag = hash;
    } catch {
      // ETag generation failed, continue without it
    }

    // Set in memory cache
    this.memoryCache.set(fullKey, entry);

    // Set in KV store (non-blocking)
    if (this.kvStore) {
      this.kvStore.set(fullKey, entry).catch((error) => {
        console.error(`KV set failed for ${key}:`, error);
      });
    }
  }

  /**
   * Delete a value from cache
   */
  async delete(key: string): Promise<boolean> {
    const fullKey = this.getFullKey(key);

    const deleted = this.memoryCache.delete(fullKey);

    if (this.kvStore) {
      await this.kvStore.delete(fullKey).catch(() => {});
    }

    return deleted;
  }

  /**
   * Invalidate cache entries by tag
   */
  async invalidateByTag(tag: string): Promise<number> {
    const count = this.memoryCache.deleteByTag(tag);

    if (this.kvStore) {
      await this.kvStore.deleteByPrefix(`${this.config.keyPrefix}tag:${tag}:`).catch(() => {});
    }

    return count;
  }

  /**
   * Clear all cache entries
   */
  async clear(): Promise<void> {
    this.memoryCache.clear();

    if (this.kvStore) {
      await this.kvStore.deleteByPrefix(this.config.keyPrefix).catch(() => {});
    }
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    return this.memoryCache.getStats();
  }

  /**
   * Wrap a function with caching
   */
  wrap<T, A extends unknown[]>(
    fn: (...args: A) => Promise<T>,
    options: CacheOptions & {
      keyGenerator?: (...args: A) => string;
    } = {}
  ): (...args: A) => Promise<T> {
    const keyGenerator = options.keyGenerator || ((...args) => JSON.stringify(args));

    return async (...args: A): Promise<T> => {
      const key = options.key || keyGenerator(...args);

      const { value, hit } = await this.get<T>(key, () => fn(...args));

      if (hit && value !== undefined) {
        return value;
      }

      const result = await fn(...args);
      await this.set(key, result, options);

      return result;
    };
  }

  private async generateETag(value: unknown): Promise<string> {
    const data = JSON.stringify(value);
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(data);

    const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');

    return `"${hashHex.substring(0, 16)}"`;
  }
}

// ============================================================================
// Response Caching Utilities
// ============================================================================

export interface ResponseCacheOptions extends CacheOptions {
  /** Cache based on these headers */
  varyHeaders?: string[];
  /** Only cache specific status codes */
  statusCodes?: number[];
  /** Skip caching for these paths */
  excludePaths?: string[];
}

/**
 * Create a cache key from a request
 */
export function createCacheKey(request: Request, options: ResponseCacheOptions = {}): string {
  const url = new URL(request.url);
  let key = `${request.method}:${url.pathname}${url.search}`;

  // Add vary headers to key
  if (options.varyHeaders) {
    for (const header of options.varyHeaders) {
      const value = request.headers.get(header);
      if (value) {
        key += `:${header}=${value}`;
      }
    }
  }

  return key;
}

/**
 * Check if a response should be cached
 */
export function shouldCacheResponse(
  request: Request,
  response: Response,
  options: ResponseCacheOptions = {}
): boolean {
  // Only cache GET and HEAD
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    return false;
  }

  // Check status code
  const statusCodes = options.statusCodes || [200, 203, 300, 301, 302, 404, 410];
  if (!statusCodes.includes(response.status)) {
    return false;
  }

  // Check excluded paths
  if (options.excludePaths) {
    const url = new URL(request.url);
    for (const path of options.excludePaths) {
      if (url.pathname.startsWith(path)) {
        return false;
      }
    }
  }

  // Check Cache-Control header
  const cacheControl = response.headers.get('Cache-Control');
  if (cacheControl) {
    if (
      cacheControl.includes('no-store') ||
      cacheControl.includes('private') ||
      cacheControl.includes('no-cache')
    ) {
      return false;
    }
  }

  return true;
}

/**
 * Create cached response with proper headers
 */
export async function createCachedResponse(
  response: Response,
  entry: CacheEntry<ArrayBuffer>,
  options: ResponseCacheOptions = {}
): Promise<Response> {
  const headers = new Headers(response.headers);

  // Add cache headers
  const age = Math.floor((Date.now() - entry.createdAt) / 1000);
  headers.set('Age', age.toString());

  if (entry.etag) {
    headers.set('ETag', entry.etag);
  }

  if (entry.lastModified) {
    headers.set('Last-Modified', new Date(entry.lastModified).toUTCString());
  }

  // Add X-Cache header
  const stale = entry.staleAt < Date.now();
  headers.set('X-Cache', stale ? 'STALE' : 'HIT');

  return new Response(entry.value, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

/**
 * Create a caching middleware for edge handlers
 */
export function createCacheMiddleware(
  cache: EdgeCache,
  options: ResponseCacheOptions = {}
): (
  request: Request,
  next: () => Promise<Response>
) => Promise<Response> {
  return async (request: Request, next: () => Promise<Response>): Promise<Response> => {
    // Only cache GET requests by default
    if (request.method !== 'GET') {
      return next();
    }

    const key = createCacheKey(request, options);

    // Try to get from cache
    const { value, stale, hit } = await cache.get<{
      body: ArrayBuffer;
      status: number;
      headers: [string, string][];
    }>(key);

    if (hit && value) {
      const headers = new Headers(value.headers);
      headers.set('X-Cache', stale ? 'STALE' : 'HIT');

      // If stale, trigger background revalidation
      if (stale) {
        // Non-blocking revalidation
        next()
          .then(async (response) => {
            if (shouldCacheResponse(request, response, options)) {
              const body = await response.arrayBuffer();
              await cache.set(key, {
                body,
                status: response.status,
                headers: Array.from(response.headers.entries()),
              }, options);
            }
          })
          .catch(console.error);
      }

      return new Response(value.body, {
        status: value.status,
        headers,
      });
    }

    // Execute handler
    const response = await next();

    // Cache response if applicable
    if (shouldCacheResponse(request, response, options)) {
      const body = await response.clone().arrayBuffer();
      await cache.set(key, {
        body,
        status: response.status,
        headers: Array.from(response.headers.entries()),
      }, options);
    }

    return response;
  };
}

// ============================================================================
// Asset Optimization Cache
// ============================================================================

export interface AssetCacheOptions {
  /** Maximum asset size to cache (bytes) */
  maxAssetSize?: number;
  /** TTL for different asset types */
  ttlByType?: Record<string, number>;
  /** Transform function for assets */
  transform?: (asset: ArrayBuffer, contentType: string) => Promise<ArrayBuffer>;
}

const DEFAULT_TTL_BY_TYPE: Record<string, number> = {
  'image/': 86400 * 30, // 30 days
  'font/': 86400 * 365, // 1 year
  'text/css': 86400 * 7, // 7 days
  'text/javascript': 86400 * 7,
  'application/javascript': 86400 * 7,
  'application/json': 3600, // 1 hour
};

/**
 * Create an asset caching layer
 */
export function createAssetCache(
  cache: EdgeCache,
  options: AssetCacheOptions = {}
): {
  get: (url: string) => Promise<{ body: ArrayBuffer; contentType: string } | null>;
  set: (url: string, body: ArrayBuffer, contentType: string) => Promise<void>;
  middleware: (request: Request, next: () => Promise<Response>) => Promise<Response>;
} {
  const maxAssetSize = options.maxAssetSize || 5 * 1024 * 1024; // 5MB
  const ttlByType = { ...DEFAULT_TTL_BY_TYPE, ...options.ttlByType };

  const getTTL = (contentType: string): number => {
    for (const [type, ttl] of Object.entries(ttlByType)) {
      if (contentType.startsWith(type)) {
        return ttl;
      }
    }
    return 3600; // Default 1 hour
  };

  return {
    async get(url: string) {
      const { value } = await cache.get<{ body: ArrayBuffer; contentType: string }>(
        `asset:${url}`
      );
      return value ?? null;
    },

    async set(url: string, body: ArrayBuffer, contentType: string) {
      if (body.byteLength > maxAssetSize) {
        return; // Skip large assets
      }

      let finalBody = body;
      if (options.transform) {
        finalBody = await options.transform(body, contentType);
      }

      const ttl = getTTL(contentType);
      await cache.set(`asset:${url}`, { body: finalBody, contentType }, {
        ttl,
        swr: ttl * 0.1, // 10% of TTL for SWR
        tags: ['assets'],
      });
    },

    middleware(request: Request, next: () => Promise<Response>) {
      return next(); // Placeholder - implement as needed
    },
  };
}

// ============================================================================
// Singleton Cache Instance
// ============================================================================

let defaultCache: EdgeCache | null = null;

/**
 * Get or create the default cache instance
 */
export function getDefaultCache(config?: EdgeCacheConfig): EdgeCache {
  if (!defaultCache) {
    defaultCache = new EdgeCache(config);
  }
  return defaultCache;
}

/**
 * Reset the default cache (useful for testing)
 */
export function resetDefaultCache(): void {
  if (defaultCache) {
    defaultCache.clear();
  }
  defaultCache = null;
}

// ============================================================================
// Exports
// ============================================================================

export default {
  EdgeCache,
  createCacheKey,
  shouldCacheResponse,
  createCachedResponse,
  createCacheMiddleware,
  createAssetCache,
  getDefaultCache,
  resetDefaultCache,
};
