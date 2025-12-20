/**
 * Edge Caching Strategies for PPR
 *
 * Provides various caching implementations optimized for edge computing:
 * - In-memory caching with LRU eviction
 * - Redis-based distributed caching
 * - CDN integration patterns
 * - Cache invalidation strategies
 */

import type {
  PPRCache,
  StaticShell,
  CacheStats,
  EdgeCachingStrategy,
} from "./ppr-types.js";

// ============================================================================
// LRU Cache Implementation
// ============================================================================

/**
 * LRU (Least Recently Used) cache for static shells
 */
export class LRUPPRCache implements PPRCache {
  private cache: Map<string, { shell: StaticShell; accessTime: number }> =
    new Map();
  private maxSize: number;
  private maxAge: number; // milliseconds
  private hits = 0;
  private misses = 0;

  constructor(options: { maxSize?: number; maxAge?: number } = {}) {
    this.maxSize = options.maxSize || 100;
    this.maxAge = options.maxAge || 3600000; // 1 hour default
  }

  async get(path: string): Promise<StaticShell | null> {
    const entry = this.cache.get(path);

    if (!entry) {
      this.misses++;
      return null;
    }

    // Check if expired
    if (Date.now() - entry.accessTime > this.maxAge) {
      this.cache.delete(path);
      this.misses++;
      return null;
    }

    // Update access time (move to end for LRU)
    this.cache.delete(path);
    this.cache.set(path, { ...entry, accessTime: Date.now() });
    this.hits++;

    return entry.shell;
  }

  async set(path: string, shell: StaticShell): Promise<void> {
    // Evict if at capacity
    if (this.cache.size >= this.maxSize) {
      const oldest = this.cache.keys().next().value;
      if (oldest) {
        this.cache.delete(oldest);
      }
    }

    this.cache.set(path, {
      shell,
      accessTime: Date.now(),
    });
  }

  async has(path: string): Promise<boolean> {
    const entry = this.cache.get(path);
    if (!entry) return false;

    // Check expiration
    if (Date.now() - entry.accessTime > this.maxAge) {
      this.cache.delete(path);
      return false;
    }

    return true;
  }

  async invalidate(path: string): Promise<void> {
    this.cache.delete(path);
  }

  async invalidateAll(): Promise<void> {
    this.cache.clear();
    this.hits = 0;
    this.misses = 0;
  }

  async stats(): Promise<CacheStats> {
    let bytes = 0;

    for (const entry of this.cache.values()) {
      bytes += new TextEncoder().encode(entry.shell.html).length;
    }

    const total = this.hits + this.misses;

    return {
      size: this.cache.size,
      bytes,
      hitRatio: total > 0 ? this.hits / total : 0,
    };
  }

  /**
   * Prune expired entries
   */
  prune(): number {
    const now = Date.now();
    let pruned = 0;

    for (const [path, entry] of this.cache) {
      if (now - entry.accessTime > this.maxAge) {
        this.cache.delete(path);
        pruned++;
      }
    }

    return pruned;
  }
}

// ============================================================================
// Redis PPR Cache
// ============================================================================

/**
 * Redis-based distributed cache for PPR shells
 */
export class RedisPPRCache implements PPRCache {
  private client: RedisClientLike;
  private keyPrefix: string;
  private ttl: number; // seconds
  private hits = 0;
  private misses = 0;

  constructor(
    client: RedisClientLike,
    options: { keyPrefix?: string; ttl?: number } = {}
  ) {
    this.client = client;
    this.keyPrefix = options.keyPrefix || "philjs:ppr:";
    this.ttl = options.ttl || 3600; // 1 hour default
  }

  private key(path: string): string {
    return `${this.keyPrefix}${path}`;
  }

  async get(path: string): Promise<StaticShell | null> {
    try {
      const data = await this.client.get(this.key(path));

      if (!data) {
        this.misses++;
        return null;
      }

      const parsed = JSON.parse(data);

      // Reconstruct Map from array
      const shell: StaticShell = {
        ...parsed,
        boundaries: new Map(parsed.boundaries),
      };

      this.hits++;
      return shell;
    } catch {
      this.misses++;
      return null;
    }
  }

  async set(path: string, shell: StaticShell): Promise<void> {
    // Serialize Map to array for JSON
    const data = {
      ...shell,
      boundaries: Array.from(shell.boundaries.entries()),
    };

    await this.client.setex(this.key(path), this.ttl, JSON.stringify(data));
  }

  async has(path: string): Promise<boolean> {
    return (await this.client.exists(this.key(path))) === 1;
  }

  async invalidate(path: string): Promise<void> {
    await this.client.del(this.key(path));
  }

  async invalidateAll(): Promise<void> {
    const keys = await this.client.keys(`${this.keyPrefix}*`);

    if (keys.length > 0) {
      await this.client.del(...keys);
    }

    this.hits = 0;
    this.misses = 0;
  }

  async stats(): Promise<CacheStats> {
    const keys = await this.client.keys(`${this.keyPrefix}*`);
    const total = this.hits + this.misses;

    // Approximate size by sampling
    let bytes = 0;
    const sampleSize = Math.min(10, keys.length);

    for (let i = 0; i < sampleSize; i++) {
      const data = await this.client.get(keys[i]);
      if (data) {
        bytes += new TextEncoder().encode(data).length;
      }
    }

    // Extrapolate
    if (sampleSize > 0) {
      bytes = Math.round((bytes / sampleSize) * keys.length);
    }

    return {
      size: keys.length,
      bytes,
      hitRatio: total > 0 ? this.hits / total : 0,
    };
  }

  /**
   * Invalidate by pattern (e.g., "/blog/*")
   */
  async invalidatePattern(pattern: string): Promise<number> {
    const keys = await this.client.keys(this.key(pattern));

    if (keys.length > 0) {
      await this.client.del(...keys);
    }

    return keys.length;
  }

  /**
   * Refresh TTL without refetching
   */
  async touch(path: string): Promise<boolean> {
    return (await this.client.expire(this.key(path), this.ttl)) === 1;
  }
}

// Redis client interface
interface RedisClientLike {
  get(key: string): Promise<string | null>;
  set(key: string, value: string): Promise<void>;
  setex(key: string, seconds: number, value: string): Promise<void>;
  del(...keys: string[]): Promise<number>;
  exists(key: string): Promise<number>;
  keys(pattern: string): Promise<string[]>;
  expire(key: string, seconds: number): Promise<number>;
}

// ============================================================================
// Edge Cache Controller
// ============================================================================

/**
 * Controller for edge caching strategies
 */
export class EdgeCacheController {
  private strategy: EdgeCachingStrategy;
  private cache: PPRCache;
  private staleTTL: number; // How long to serve stale content

  constructor(options: {
    strategy?: EdgeCachingStrategy;
    cache: PPRCache;
    staleTTL?: number;
  }) {
    this.strategy = options.strategy || "stale-while-revalidate";
    this.cache = options.cache;
    this.staleTTL = options.staleTTL || 60; // 60 seconds
  }

  /**
   * Get shell following the configured strategy
   */
  async get(
    path: string,
    fetcher: () => Promise<StaticShell>
  ): Promise<{ shell: StaticShell; stale: boolean; revalidating: boolean }> {
    switch (this.strategy) {
      case "cache-first":
        return await this.cacheFirst(path, fetcher);

      case "network-first":
        return await this.networkFirst(path, fetcher);

      case "cache-only":
        return await this.cacheOnly(path);

      case "stale-while-revalidate":
      default:
        return await this.staleWhileRevalidate(path, fetcher);
    }
  }

  /**
   * Stale-while-revalidate strategy
   */
  private async staleWhileRevalidate(
    path: string,
    fetcher: () => Promise<StaticShell>
  ): Promise<{ shell: StaticShell; stale: boolean; revalidating: boolean }> {
    const cached = await this.cache.get(path);

    if (cached) {
      const age = (Date.now() - cached.buildTime) / 1000;
      const isStale = age > this.staleTTL;

      if (isStale) {
        // Serve stale, revalidate in background
        this.revalidateInBackground(path, fetcher);
        return { shell: cached, stale: true, revalidating: true };
      }

      return { shell: cached, stale: false, revalidating: false };
    }

    // Cache miss - fetch and cache
    const shell = await fetcher();
    await this.cache.set(path, shell);

    return { shell, stale: false, revalidating: false };
  }

  /**
   * Cache-first strategy
   */
  private async cacheFirst(
    path: string,
    fetcher: () => Promise<StaticShell>
  ): Promise<{ shell: StaticShell; stale: boolean; revalidating: boolean }> {
    const cached = await this.cache.get(path);

    if (cached) {
      return { shell: cached, stale: false, revalidating: false };
    }

    const shell = await fetcher();
    await this.cache.set(path, shell);

    return { shell, stale: false, revalidating: false };
  }

  /**
   * Network-first strategy
   */
  private async networkFirst(
    path: string,
    fetcher: () => Promise<StaticShell>
  ): Promise<{ shell: StaticShell; stale: boolean; revalidating: boolean }> {
    try {
      const shell = await fetcher();
      await this.cache.set(path, shell);
      return { shell, stale: false, revalidating: false };
    } catch {
      // Fall back to cache
      const cached = await this.cache.get(path);

      if (cached) {
        return { shell: cached, stale: true, revalidating: false };
      }

      throw new Error(`Network failed and no cache for ${path}`);
    }
  }

  /**
   * Cache-only strategy
   */
  private async cacheOnly(
    path: string
  ): Promise<{ shell: StaticShell; stale: boolean; revalidating: boolean }> {
    const cached = await this.cache.get(path);

    if (!cached) {
      throw new Error(`No cache entry for ${path}`);
    }

    return { shell: cached, stale: false, revalidating: false };
  }

  /**
   * Revalidate in background (non-blocking)
   */
  private revalidateInBackground(
    path: string,
    fetcher: () => Promise<StaticShell>
  ): void {
    // Don't await - run in background
    fetcher()
      .then((shell) => this.cache.set(path, shell))
      .catch((error) => {
        console.error(`[PPR Cache] Revalidation failed for ${path}:`, error);
      });
  }

  /**
   * Invalidate cached shell
   */
  async invalidate(path: string): Promise<void> {
    await this.cache.invalidate(path);
  }

  /**
   * Warm cache with multiple paths
   */
  async warmCache(
    paths: string[],
    fetcher: (path: string) => Promise<StaticShell>,
    concurrency = 5
  ): Promise<{ success: number; failed: number }> {
    let success = 0;
    let failed = 0;

    const queue = [...paths];
    const inFlight: Promise<void>[] = [];

    while (queue.length > 0 || inFlight.length > 0) {
      while (queue.length > 0 && inFlight.length < concurrency) {
        const path = queue.shift()!;
        const promise = fetcher(path)
          .then(async (shell) => {
            await this.cache.set(path, shell);
            success++;
          })
          .catch(() => {
            failed++;
          })
          .finally(() => {
            const index = inFlight.indexOf(promise);
            if (index !== -1) inFlight.splice(index, 1);
          });

        inFlight.push(promise);
      }

      if (inFlight.length > 0) {
        await Promise.race(inFlight);
      }
    }

    return { success, failed };
  }
}

// ============================================================================
// CDN Integration
// ============================================================================

/**
 * Generate cache-control headers for CDN caching
 */
export function generateCacheHeaders(
  shell: StaticShell,
  options: {
    strategy?: EdgeCachingStrategy;
    maxAge?: number;
    staleWhileRevalidate?: number;
    staleIfError?: number;
    private?: boolean;
  } = {}
): Record<string, string> {
  const headers: Record<string, string> = {};

  const maxAge = options.maxAge || 3600;
  const swr = options.staleWhileRevalidate || 60;
  const sie = options.staleIfError || 3600;
  const isPrivate = options.private || false;

  // Base cache control
  const directives: string[] = [];

  if (isPrivate) {
    directives.push("private");
  } else {
    directives.push("public");
  }

  directives.push(`max-age=${maxAge}`);

  // Strategy-specific directives
  switch (options.strategy) {
    case "stale-while-revalidate":
      directives.push(`stale-while-revalidate=${swr}`);
      directives.push(`stale-if-error=${sie}`);
      break;

    case "cache-only":
      directives.push("immutable");
      break;

    case "network-first":
      directives.push("must-revalidate");
      break;
  }

  headers["Cache-Control"] = directives.join(", ");

  // ETag based on content hash
  headers["ETag"] = `"${shell.contentHash}"`;

  // Vary header for personalization
  headers["Vary"] = "Accept-Encoding, Cookie";

  // CDN-specific headers
  headers["CDN-Cache-Control"] = `max-age=${maxAge}`;
  headers["Surrogate-Control"] = `max-age=${maxAge * 2}`;

  // PPR metadata
  headers["X-PPR-Shell-Time"] = shell.buildTime.toString();
  headers["X-PPR-Boundaries"] = shell.boundaries.size.toString();

  return headers;
}

/**
 * Parse request for conditional caching
 */
export function parseConditionalRequest(request: Request): {
  ifNoneMatch?: string;
  ifModifiedSince?: Date;
} {
  return {
    ifNoneMatch: request.headers.get("If-None-Match") || undefined,
    ifModifiedSince: request.headers.get("If-Modified-Since")
      ? new Date(request.headers.get("If-Modified-Since")!)
      : undefined,
  };
}

/**
 * Check if a 304 Not Modified response should be sent
 */
export function shouldReturn304(
  shell: StaticShell,
  conditional: ReturnType<typeof parseConditionalRequest>
): boolean {
  if (conditional.ifNoneMatch) {
    return conditional.ifNoneMatch === `"${shell.contentHash}"`;
  }

  if (conditional.ifModifiedSince) {
    return shell.buildTime <= conditional.ifModifiedSince.getTime();
  }

  return false;
}

/**
 * Create a 304 Not Modified response
 */
export function create304Response(shell: StaticShell): Response {
  return new Response(null, {
    status: 304,
    statusText: "Not Modified",
    headers: {
      ETag: `"${shell.contentHash}"`,
      "Cache-Control": "public, max-age=3600",
    },
  });
}

// ============================================================================
// Cache Tag System
// ============================================================================

/**
 * Manage cache invalidation with tags
 */
export class CacheTagManager {
  private tags: Map<string, Set<string>> = new Map(); // tag -> paths
  private pathTags: Map<string, Set<string>> = new Map(); // path -> tags

  /**
   * Associate tags with a path
   */
  tag(path: string, tags: string[]): void {
    // Store path -> tags
    if (!this.pathTags.has(path)) {
      this.pathTags.set(path, new Set());
    }
    for (const t of tags) {
      this.pathTags.get(path)!.add(t);
    }

    // Store tag -> paths
    for (const t of tags) {
      if (!this.tags.has(t)) {
        this.tags.set(t, new Set());
      }
      this.tags.get(t)!.add(path);
    }
  }

  /**
   * Get all paths for a tag
   */
  getPathsForTag(tag: string): string[] {
    return Array.from(this.tags.get(tag) || []);
  }

  /**
   * Get all tags for a path
   */
  getTagsForPath(path: string): string[] {
    return Array.from(this.pathTags.get(path) || []);
  }

  /**
   * Invalidate all paths with a tag
   */
  async invalidateTag(tag: string, cache: PPRCache): Promise<number> {
    const paths = this.getPathsForTag(tag);

    for (const path of paths) {
      await cache.invalidate(path);
    }

    return paths.length;
  }

  /**
   * Remove a path from tracking
   */
  remove(path: string): void {
    const tags = this.pathTags.get(path);

    if (tags) {
      for (const t of tags) {
        this.tags.get(t)?.delete(path);
      }
    }

    this.pathTags.delete(path);
  }

  /**
   * Clear all tag associations
   */
  clear(): void {
    this.tags.clear();
    this.pathTags.clear();
  }
}

// ============================================================================
// Exports
// ============================================================================

export type { PPRCache, CacheStats, EdgeCachingStrategy } from "./ppr-types.js";
