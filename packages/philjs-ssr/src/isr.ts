/**
 * @philjs/ssr - On-Demand ISR (Incremental Static Regeneration) API
 *
 * Inspired by Next.js revalidation API, provides fine-grained control over
 * when and how pages are regenerated.
 *
 * @example
 * ```ts
 * import { createISRHandler, revalidatePath, revalidateTag } from '@philjs/ssr/isr';
 *
 * // In your API route
 * export async function POST(request) {
 *   const { path, tag, secret } = await request.json();
 *
 *   // Verify secret token
 *   if (secret !== process.env.REVALIDATION_SECRET) {
 *     return new Response('Invalid token', { status: 401 });
 *   }
 *
 *   // Revalidate by path
 *   if (path) {
 *     await revalidatePath(path);
 *   }
 *
 *   // Revalidate by tag
 *   if (tag) {
 *     await revalidateTag(tag);
 *   }
 *
 *   return new Response('Revalidated', { status: 200 });
 * }
 * ```
 */

import { signal, type Signal } from '@philjs/core';

// Types

export interface ISRConfig {
  /** Directory for cached pages */
  cacheDir?: string;
  /** Default revalidation time in seconds */
  defaultRevalidate?: number;
  /** Enable stale-while-revalidate */
  staleWhileRevalidate?: boolean;
  /** Maximum cache age in seconds */
  maxAge?: number;
  /** Secret token for API revalidation */
  revalidationSecret?: string;
  /** Custom cache adapter */
  cacheAdapter?: CacheAdapter;
  /** Enable cache tags */
  enableTags?: boolean;
  /** Callback when revalidation occurs */
  onRevalidate?: (path: string) => void;
  /** Callback when revalidation fails */
  onRevalidateError?: (path: string, error: Error) => void;
}

export interface CacheAdapter {
  get(key: string): Promise<CacheEntry | null>;
  set(key: string, value: CacheEntry): Promise<void>;
  delete(key: string): Promise<void>;
  clear(): Promise<void>;
  keys(pattern?: string): Promise<string[]>;
}

export interface CacheEntry {
  /** Rendered HTML content */
  html: string;
  /** Page data/props */
  data?: any;
  /** Cache tags for invalidation */
  tags?: string[];
  /** Creation timestamp */
  createdAt: number;
  /** Last revalidation timestamp */
  revalidatedAt: number;
  /** Revalidation interval in seconds */
  revalidate: number;
  /** ETag for conditional requests */
  etag?: string;
  /** Headers to include in response */
  headers?: Record<string, string>;
}

export interface RevalidateOptions {
  /** Force regeneration even if cache is fresh */
  force?: boolean;
  /** Only revalidate if cache exists */
  onlyIfCached?: boolean;
  /** Custom headers for regeneration request */
  headers?: Record<string, string>;
}

export interface PageCacheConfig {
  /** Revalidation time in seconds (0 = no cache, false = never revalidate) */
  revalidate?: number | false;
  /** Cache tags for invalidation */
  tags?: string[];
  /** Dynamic params that shouldn't be cached */
  dynamicParams?: string[];
  /** Generate static params at build time */
  generateStaticParams?: () => Promise<Array<Record<string, string>>>;
}

// State

const cacheSignal: Signal<Map<string, CacheEntry>> = signal(new Map());
const tagMapSignal: Signal<Map<string, Set<string>>> = signal(new Map()); // tag -> paths
const revalidatingSignal: Signal<Set<string>> = signal(new Set());

let config: ISRConfig = {
  cacheDir: '.philjs/cache',
  defaultRevalidate: 60,
  staleWhileRevalidate: true,
  maxAge: 31536000, // 1 year
  enableTags: true,
};

let cacheAdapter: CacheAdapter | null = null;

// Core Functions

/**
 * Initializes the ISR system
 */
export function initISR(cfg: ISRConfig = {}): void {
  config = { ...config, ...cfg };
  cacheAdapter = cfg.cacheAdapter || createMemoryCacheAdapter();
}

/**
 * Creates the ISR API handler
 */
export function createISRHandler(options: {
  secret?: string;
  allowedPaths?: string[];
  rateLimit?: number;
}) {
  const rateLimitMap = new Map<string, number>();

  return async function handler(request: Request): Promise<Response> {
    // Verify method
    if (request.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 });
    }

    // Parse body
    let body: { path?: string; tag?: string; secret?: string };
    try {
      body = await request.json();
    } catch {
      return new Response('Invalid JSON', { status: 400 });
    }

    // Verify secret
    const secret = options.secret || config.revalidationSecret;
    if (secret && body.secret !== secret) {
      return new Response('Invalid token', { status: 401 });
    }

    // Rate limiting
    if (options.rateLimit) {
      const ip = request.headers.get('x-forwarded-for') || 'unknown';
      const lastRequest = rateLimitMap.get(ip) || 0;
      const now = Date.now();

      if (now - lastRequest < options.rateLimit) {
        return new Response('Rate limited', { status: 429 });
      }
      rateLimitMap.set(ip, now);
    }

    // Check allowed paths
    if (options.allowedPaths && body.path) {
      const isAllowed = options.allowedPaths.some((pattern) =>
        new RegExp(pattern.replace('*', '.*')).test(body.path!)
      );
      if (!isAllowed) {
        return new Response('Path not allowed', { status: 403 });
      }
    }

    try {
      const results: { path?: string; tag?: string; success: boolean; error?: string }[] = [];

      if (body.path) {
        await revalidatePath(body.path);
        results.push({ path: body.path, success: true });
      }

      if (body.tag) {
        const paths = await revalidateTag(body.tag);
        results.push({ tag: body.tag, success: true });
      }

      return new Response(
        JSON.stringify({ revalidated: true, results }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    } catch (error) {
      return new Response(
        JSON.stringify({ revalidated: false, error: (error as Error).message }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }
  };
}

/**
 * Revalidates a specific path
 */
export async function revalidatePath(path: string, options: RevalidateOptions = {}): Promise<void> {
  const normalizedPath = normalizePath(path);

  // Check if already revalidating
  if (revalidatingSignal().has(normalizedPath) && !options.force) {
    return;
  }

  // Mark as revalidating
  const revalidating = new Set(revalidatingSignal());
  revalidating.add(normalizedPath);
  revalidatingSignal.set(revalidating);

  try {
    // Get current cache entry
    const cached = await getCacheEntry(normalizedPath);

    if (options.onlyIfCached && !cached) {
      return;
    }

    // Trigger regeneration
    await regeneratePage(normalizedPath, options);

    // Call callback
    config.onRevalidate?.(normalizedPath);
  } catch (error) {
    config.onRevalidateError?.(normalizedPath, error as Error);
    throw error;
  } finally {
    // Remove from revalidating set
    const revalidating = new Set(revalidatingSignal());
    revalidating.delete(normalizedPath);
    revalidatingSignal.set(revalidating);
  }
}

/**
 * Revalidates all paths with a specific tag
 */
export async function revalidateTag(tag: string): Promise<string[]> {
  const tagMap = tagMapSignal();
  const paths = tagMap.get(tag) || new Set();

  const results: string[] = [];

  for (const path of paths) {
    try {
      await revalidatePath(path);
      results.push(path);
    } catch (error) {
      console.error(`Failed to revalidate ${path}:`, error);
    }
  }

  return results;
}

/**
 * Gets a cached page entry
 */
export async function getCacheEntry(path: string): Promise<CacheEntry | null> {
  const normalizedPath = normalizePath(path);

  if (cacheAdapter) {
    return cacheAdapter.get(normalizedPath);
  }

  return cacheSignal().get(normalizedPath) || null;
}

/**
 * Sets a cache entry for a path
 */
export async function setCacheEntry(
  path: string,
  html: string,
  options: {
    data?: any;
    tags?: string[];
    revalidate?: number;
    headers?: Record<string, string>;
  } = {}
): Promise<void> {
  const normalizedPath = normalizePath(path);
  const now = Date.now();

  const entry: CacheEntry = {
    html,
    data: options.data,
    tags: options.tags,
    createdAt: now,
    revalidatedAt: now,
    revalidate: options.revalidate ?? config.defaultRevalidate ?? 60,
    etag: generateETag(html),
    headers: options.headers,
  };

  // Store in cache
  if (cacheAdapter) {
    await cacheAdapter.set(normalizedPath, entry);
  } else {
    const cache = new Map(cacheSignal());
    cache.set(normalizedPath, entry);
    cacheSignal.set(cache);
  }

  // Update tag map
  if (options.tags && config.enableTags) {
    const tagMap = new Map(tagMapSignal());
    for (const tag of options.tags) {
      if (!tagMap.has(tag)) {
        tagMap.set(tag, new Set());
      }
      tagMap.get(tag)!.add(normalizedPath);
    }
    tagMapSignal.set(tagMap);
  }
}

/**
 * Clears cache for a path
 */
export async function clearCache(path: string): Promise<void> {
  const normalizedPath = normalizePath(path);

  if (cacheAdapter) {
    await cacheAdapter.delete(normalizedPath);
  } else {
    const cache = new Map(cacheSignal());
    cache.delete(normalizedPath);
    cacheSignal.set(cache);
  }

  // Remove from tag map
  const tagMap = new Map(tagMapSignal());
  for (const [tag, paths] of tagMap) {
    paths.delete(normalizedPath);
    if (paths.size === 0) {
      tagMap.delete(tag);
    }
  }
  tagMapSignal.set(tagMap);
}

/**
 * Clears all cache
 */
export async function clearAllCache(): Promise<void> {
  if (cacheAdapter) {
    await cacheAdapter.clear();
  } else {
    cacheSignal.set(new Map());
  }
  tagMapSignal.set(new Map());
}

/**
 * Checks if a cache entry is stale
 */
export function isStale(entry: CacheEntry): boolean {
  if (entry.revalidate === 0) return true;
  if (entry.revalidate === false) return false;

  const age = (Date.now() - entry.revalidatedAt) / 1000;
  return age > entry.revalidate;
}

/**
 * Checks if a cache entry is expired (beyond stale-while-revalidate window)
 */
export function isExpired(entry: CacheEntry): boolean {
  const age = (Date.now() - entry.createdAt) / 1000;
  return age > (config.maxAge || 31536000);
}

// Middleware

/**
 * Creates ISR middleware for SSR
 */
export function createISRMiddleware(options: {
  renderPage: (path: string) => Promise<{ html: string; data?: any }>;
  getPageConfig?: (path: string) => PageCacheConfig;
}) {
  return async function middleware(request: Request): Promise<Response | null> {
    const url = new URL(request.url);
    const path = normalizePath(url.pathname);

    // Get cache entry
    const cached = await getCacheEntry(path);

    // Check conditional request
    if (cached && request.headers.get('if-none-match') === cached.etag) {
      return new Response(null, { status: 304 });
    }

    // Return cached if fresh
    if (cached && !isStale(cached) && !isExpired(cached)) {
      return createCacheResponse(cached);
    }

    // Stale-while-revalidate: return stale but revalidate in background
    if (cached && config.staleWhileRevalidate && !isExpired(cached)) {
      // Trigger background revalidation
      revalidatePath(path).catch(console.error);
      return createCacheResponse(cached, true);
    }

    // Generate fresh content
    try {
      const pageConfig = options.getPageConfig?.(path) || {};
      const { html, data } = await options.renderPage(path);

      // Cache the result
      await setCacheEntry(path, html, {
        data,
        tags: pageConfig.tags,
        revalidate: pageConfig.revalidate as number,
      });

      const entry = await getCacheEntry(path);
      return createCacheResponse(entry!);
    } catch (error) {
      // If we have stale content, serve it
      if (cached) {
        return createCacheResponse(cached, true);
      }
      throw error;
    }
  };
}

// Helper Functions

function normalizePath(path: string): string {
  // Remove trailing slash, normalize query strings
  return path.replace(/\/$/, '') || '/';
}

function generateETag(content: string): string {
  let hash = 0;
  for (let i = 0; i < content.length; i++) {
    const char = content.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return `"${Math.abs(hash).toString(16)}"`;
}

function createCacheResponse(entry: CacheEntry, stale: boolean = false): Response {
  const headers: Record<string, string> = {
    'Content-Type': 'text/html; charset=utf-8',
    'Cache-Control': stale
      ? 'public, max-age=0, must-revalidate'
      : `public, s-maxage=${entry.revalidate}, stale-while-revalidate=${config.maxAge}`,
    'X-PhilJS-Cache': stale ? 'STALE' : 'HIT',
    ...entry.headers,
  };

  if (entry.etag) {
    headers['ETag'] = entry.etag;
  }

  return new Response(entry.html, { headers });
}

async function regeneratePage(path: string, options: RevalidateOptions): Promise<void> {
  // This would be implemented based on the rendering system
  // For now, just clear the cache to force regeneration on next request
  await clearCache(path);
}

// Cache Adapters

function createMemoryCacheAdapter(): CacheAdapter {
  const cache = new Map<string, CacheEntry>();

  return {
    async get(key) {
      return cache.get(key) || null;
    },
    async set(key, value) {
      cache.set(key, value);
    },
    async delete(key) {
      cache.delete(key);
    },
    async clear() {
      cache.clear();
    },
    async keys(pattern) {
      const allKeys = Array.from(cache.keys());
      if (!pattern) return allKeys;
      const regex = new RegExp(pattern.replace('*', '.*'));
      return allKeys.filter((key) => regex.test(key));
    },
  };
}

/**
 * Creates a file-based cache adapter
 */
export function createFileCacheAdapter(options: { dir: string }): CacheAdapter {
  // File-based implementation would use fs
  return createMemoryCacheAdapter(); // Fallback for now
}

/**
 * Creates a Redis cache adapter
 */
export function createRedisCacheAdapter(options: {
  url: string;
  prefix?: string;
}): CacheAdapter {
  const prefix = options.prefix || 'philjs:isr:';

  return {
    async get(key) {
      // Redis implementation
      return null;
    },
    async set(key, value) {
      // Redis implementation
    },
    async delete(key) {
      // Redis implementation
    },
    async clear() {
      // Redis implementation
    },
    async keys(pattern) {
      // Redis implementation
      return [];
    },
  };
}

/**
 * Creates a KV cache adapter (Cloudflare, Vercel, etc.)
 */
export function createKVCacheAdapter(kv: {
  get: (key: string) => Promise<string | null>;
  put: (key: string, value: string) => Promise<void>;
  delete: (key: string) => Promise<void>;
  list: (options?: { prefix?: string }) => Promise<{ keys: { name: string }[] }>;
}): CacheAdapter {
  return {
    async get(key) {
      const data = await kv.get(key);
      return data ? JSON.parse(data) : null;
    },
    async set(key, value) {
      await kv.put(key, JSON.stringify(value));
    },
    async delete(key) {
      await kv.delete(key);
    },
    async clear() {
      const { keys } = await kv.list();
      await Promise.all(keys.map((k) => kv.delete(k.name)));
    },
    async keys(pattern) {
      const { keys } = await kv.list({ prefix: pattern });
      return keys.map((k) => k.name);
    },
  };
}

// Export types
export type { ISRConfig, CacheAdapter, CacheEntry, PageCacheConfig, RevalidateOptions };
