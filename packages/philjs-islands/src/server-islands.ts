/**
 * PhilJS Server Islands
 *
 * Per-component server-side rendering with intelligent caching.
 * Matches Astro 5's Server Islands capabilities.
 *
 * Features:
 * - Per-component caching with TTL
 * - Stale-while-revalidate pattern
 * - Cache invalidation by tags
 * - Dynamic personalization in static pages
 * - Edge-compatible caching
 *
 * @example
 * ```tsx
 * import { ServerIsland, cacheIsland } from 'philjs-islands/server';
 *
 * // Per-component caching
 * <ServerIsland
 *   cache={{ ttl: 3600, tags: ['user', 'products'] }}
 *   fallback={<ProductSkeleton />}
 * >
 *   <ProductRecommendations userId={user.id} />
 * </ServerIsland>
 * ```
 */

// ============================================================================
// Types
// ============================================================================

/** JSX element type */
export interface VNode {
  type: string | Function;
  props: Record<string, any>;
  key?: string | number;
  __serverRender?: () => Promise<string>;
}

/** * Type for renderable components */
export type IslandComponent<P = Record<string, unknown>> = ((props: P) => unknown) | { new(props: P): unknown };

/** * Type for renderable content */
export type RenderableContent = VNode | string | number | boolean | null | undefined;
// ============================================================================

export interface ServerIslandCache {
  /** Time-to-live in seconds */
  ttl: number;
  /** Cache tags for invalidation */
  tags?: string[];
  /** Stale-while-revalidate duration in seconds */
  swr?: number;
  /** Cache key generator */
  keyGenerator?: (props: Record<string, any>) => string;
  /** Vary by headers */
  varyBy?: string[];
  /** Private cache (per-user) */
  private?: boolean;
  /** Edge caching hint */
  edge?: boolean;
}

export interface ServerIslandProps {
  /** Unique island identifier */
  id?: string;
  /** Cache configuration */
  cache?: ServerIslandCache;
  /** Fallback while loading */
  fallback?: RenderableContent;
  /** Content to render */
  children: RenderableContent;
  /** Props to pass to the island */
  props?: Record<string, any>;
  /** Defer loading strategy */
  defer?: 'visible' | 'idle' | 'interaction' | 'media' | false;
  /** Media query for defer="media" */
  media?: string;
  /** Priority (0-10) */
  priority?: number;
}

export interface CachedIsland {
  /** Rendered HTML */
  html: string;
  /** When it was cached */
  timestamp: number;
  /** TTL in seconds */
  ttl: number;
  /** SWR duration in seconds */
  swr: number;
  /** Cache tags */
  tags: string[];
  /** Props used to render */
  props: Record<string, any>;
  /** ETag for validation */
  etag: string;
}

export interface IslandCacheStore {
  get(key: string): Promise<CachedIsland | null>;
  set(key: string, value: CachedIsland): Promise<void>;
  delete(key: string): Promise<void>;
  invalidateByTag(tag: string): Promise<void>;
  clear(): Promise<void>;
}

export interface ServerIslandMetrics {
  hits: number;
  misses: number;
  staleHits: number;
  revalidations: number;
  errors: number;
  avgRenderTime: number;
}

// ============================================================================
// Default In-Memory Cache Store
// ============================================================================

class InMemoryCacheStore implements IslandCacheStore {
  private cache = new Map<string, CachedIsland>();
  private tagIndex = new Map<string, Set<string>>();

  async get(key: string): Promise<CachedIsland | null> {
    return this.cache.get(key) || null;
  }

  async set(key: string, value: CachedIsland): Promise<void> {
    this.cache.set(key, value);

    // Update tag index
    for (const tag of value.tags) {
      if (!this.tagIndex.has(tag)) {
        this.tagIndex.set(tag, new Set());
      }
      this.tagIndex.get(tag)!.add(key);
    }
  }

  async delete(key: string): Promise<void> {
    const cached = this.cache.get(key);
    if (cached) {
      // Remove from tag index
      for (const tag of cached.tags) {
        this.tagIndex.get(tag)?.delete(key);
      }
    }
    this.cache.delete(key);
  }

  async invalidateByTag(tag: string): Promise<void> {
    const keys = this.tagIndex.get(tag);
    if (keys) {
      for (const key of keys) {
        this.cache.delete(key);
      }
      this.tagIndex.delete(tag);
    }
  }

  async clear(): Promise<void> {
    this.cache.clear();
    this.tagIndex.clear();
  }
}

// ============================================================================
// Global State
// ============================================================================

let cacheStore: IslandCacheStore = new InMemoryCacheStore();
const metrics: ServerIslandMetrics = {
  hits: 0,
  misses: 0,
  staleHits: 0,
  revalidations: 0,
  errors: 0,
  avgRenderTime: 0,
};
const pendingRevalidations = new Map<string, Promise<string>>();
let renderTimeSamples: number[] = [];

// ============================================================================
// Configuration
// ============================================================================

/**
 * Set the cache store for server islands
 */
export function setIslandCacheStore(store: IslandCacheStore): void {
  cacheStore = store;
}

/**
 * Get the current cache store
 */
export function getIslandCacheStore(): IslandCacheStore {
  return cacheStore;
}

// ============================================================================
// Server Island Component
// ============================================================================

/**
 * Server Island with per-component caching
 *
 * @example
 * ```tsx
 * <ServerIsland
 *   id="user-recommendations"
 *   cache={{ ttl: 300, tags: ['user'] }}
 *   fallback={<Skeleton />}
 * >
 *   <Recommendations userId={userId} />
 * </ServerIsland>
 * ```
 */
export function ServerIsland(props: ServerIslandProps): RenderableContent {
  const {
    id = generateIslandId(),
    cache,
    fallback,
    children,
    props: componentProps = {},
    defer = false,
    media,
    priority = 5,
  } = props;

  return {
    type: 'server-island',
    props: {
      id,
      cache,
      fallback,
      children,
      componentProps,
      defer,
      media,
      priority,
    },
    // Server-side rendering hook
    __serverRender: async () => {
      return renderServerIsland(id, children, componentProps, cache);
    },
  };
}

// ============================================================================
// Server-Side Rendering
// ============================================================================

/**
 * Render a server island with caching
 */
export async function renderServerIsland(
  id: string,
  component: RenderableContent,
  props: Record<string, any>,
  cacheConfig?: ServerIslandCache
): Promise<string> {
  const cacheKey = generateCacheKey(id, props, cacheConfig);

  // Check cache first
  if (cacheConfig) {
    const cached = await cacheStore.get(cacheKey);

    if (cached) {
      const age = (Date.now() - cached.timestamp) / 1000;

      // Fresh hit
      if (age < cached.ttl) {
        metrics.hits++;
        return wrapIslandHtml(id, cached.html, { cached: true, age });
      }

      // Stale-while-revalidate
      if (cached.swr && age < cached.ttl + cached.swr) {
        metrics.staleHits++;

        // Start background revalidation
        if (!pendingRevalidations.has(cacheKey)) {
          const revalidation = revalidateIsland(id, component, props, cacheConfig, cacheKey);
          pendingRevalidations.set(cacheKey, revalidation);
          revalidation.finally(() => pendingRevalidations.delete(cacheKey));
        }

        return wrapIslandHtml(id, cached.html, { cached: true, stale: true, age });
      }
    }
  }

  // Cache miss - render fresh
  metrics.misses++;
  const startTime = performance.now();

  try {
    const html = await renderComponent(component, props);
    const renderTime = performance.now() - startTime;
    updateRenderTimeMetrics(renderTime);

    // Cache the result
    if (cacheConfig) {
      await cacheStore.set(cacheKey, {
        html,
        timestamp: Date.now(),
        ttl: cacheConfig.ttl,
        swr: cacheConfig.swr || 0,
        tags: cacheConfig.tags || [],
        props,
        etag: generateETag(html),
      });
    }

    return wrapIslandHtml(id, html, { cached: false, renderTime });
  } catch (error) {
    metrics.errors++;
    throw error;
  }
}

/**
 * Revalidate a cached island in the background
 */
async function revalidateIsland(
  id: string,
  component: RenderableContent,
  props: Record<string, any>,
  cacheConfig: ServerIslandCache,
  cacheKey: string
): Promise<string> {
  metrics.revalidations++;

  try {
    const html = await renderComponent(component, props);

    await cacheStore.set(cacheKey, {
      html,
      timestamp: Date.now(),
      ttl: cacheConfig.ttl,
      swr: cacheConfig.swr || 0,
      tags: cacheConfig.tags || [],
      props,
      etag: generateETag(html),
    });

    return html;
  } catch (error) {
    // On error, keep the stale cache
    console.error(`Failed to revalidate island ${id}:`, error);
    throw error;
  }
}

/**
 * Render a component to HTML string
 */
async function renderComponent(component: RenderableContent, props: Record<string, any>): Promise<string> {
  // Handle primitive types
  if (component === null || component === undefined || typeof component === 'boolean') {
    return '';
  }

  if (typeof component === 'string' || typeof component === 'number') {
    return String(component);
  }

  // Handle function components
  if (typeof component === 'function') {
    const result = (component as (props: Record<string, any>) => unknown)(props);

    // Handle async components
    if (result instanceof Promise) {
      return renderComponent(await result, {});
    }

    // Handle string result
    if (typeof result === 'string') {
      return result;
    }

    // Handle JSX result - would use renderToString
    return String(result);
  }

  // Handle VNode
  return String(component);
}

// ============================================================================
// Cache Management
// ============================================================================

/**
 * Manually cache an island
 */
export async function cacheIsland(
  id: string,
  html: string,
  config: ServerIslandCache
): Promise<void> {
  const cacheKey = `island:${id}`;

  await cacheStore.set(cacheKey, {
    html,
    timestamp: Date.now(),
    ttl: config.ttl,
    swr: config.swr || 0,
    tags: config.tags || [],
    props: {},
    etag: generateETag(html),
  });
}

/**
 * Invalidate islands by tag
 */
export async function invalidateIslandsByTag(tag: string): Promise<void> {
  await cacheStore.invalidateByTag(tag);
}

/**
 * Invalidate a specific island
 */
export async function invalidateIsland(id: string, props: Record<string, any> = {}, cacheConfig?: ServerIslandCache): Promise<void> {
  const cacheKey = generateCacheKey(id, props, cacheConfig);
  await cacheStore.delete(cacheKey);
}

/**
 * Clear all island caches
 */
export async function clearIslandCache(): Promise<void> {
  await cacheStore.clear();
}

/**
 * Prefetch and cache an island
 */
export async function prefetchIsland(
  id: string,
  component: RenderableContent,
  props: Record<string, any>,
  cacheConfig: ServerIslandCache
): Promise<void> {
  await renderServerIsland(id, component, props, cacheConfig);
}

// ============================================================================
// Cache Adapters
// ============================================================================

/**
 * Minimal Redis client interface
 */
interface RedisClient {
  get(key: string): Promise<string | null>;
  setex(key: string, seconds: number, value: string): Promise<void>;
  sadd(key: string, ...members: string[]): Promise<number>;
  expire(key: string, seconds: number): Promise<number>;
  srem(key: string, ...members: string[]): Promise<number>;
  del(...keys: string[]): Promise<number>;
  smembers(key: string): Promise<string[]>;
  keys(pattern: string): Promise<string[]>;
}

/**
 * Create a Redis cache adapter
 */
export function createRedisCacheAdapter(client: RedisClient): IslandCacheStore {
  const PREFIX = 'philjs:island:';
  const TAG_PREFIX = 'philjs:tag:';

  return {
    async get(key: string): Promise<CachedIsland | null> {
      const data = await client.get(PREFIX + key);
      return data ? JSON.parse(data) : null;
    },

    async set(key: string, value: CachedIsland): Promise<void> {
      const ttl = value.ttl + (value.swr || 0);
      await client.setex(PREFIX + key, ttl, JSON.stringify(value));

      // Update tag index
      for (const tag of value.tags) {
        await client.sadd(TAG_PREFIX + tag, key);
        await client.expire(TAG_PREFIX + tag, ttl);
      }
    },

    async delete(key: string): Promise<void> {
      const data = await client.get(PREFIX + key);
      if (data) {
        const cached: CachedIsland = JSON.parse(data);
        for (const tag of cached.tags) {
          await client.srem(TAG_PREFIX + tag, key);
        }
      }
      await client.del(PREFIX + key);
    },

    async invalidateByTag(tag: string): Promise<void> {
      const keys = await client.smembers(TAG_PREFIX + tag);
      if (keys.length > 0) {
        await client.del(...keys.map((k: string) => PREFIX + k));
        await client.del(TAG_PREFIX + tag);
      }
    },

    async clear(): Promise<void> {
      const keys = await client.keys(PREFIX + '*');
      const tagKeys = await client.keys(TAG_PREFIX + '*');
      if (keys.length > 0) await client.del(...keys);
      if (tagKeys.length > 0) await client.del(...tagKeys);
    },
  };
}

/**
 * Create an edge-compatible KV cache adapter
 */
export function createKVCacheAdapter(kv: {
  get: (key: string) => Promise<string | null>;
  put: (key: string, value: string, options?: { expirationTtl?: number }) => Promise<void>;
  delete: (key: string) => Promise<void>;
  list: (options?: { prefix?: string }) => Promise<{ keys: { name: string }[] }>;
}): IslandCacheStore {
  const PREFIX = 'island:';

  return {
    async get(key: string): Promise<CachedIsland | null> {
      const data = await kv.get(PREFIX + key);
      return data ? JSON.parse(data) : null;
    },

    async set(key: string, value: CachedIsland): Promise<void> {
      const ttl = value.ttl + (value.swr || 0);
      await kv.put(PREFIX + key, JSON.stringify(value), { expirationTtl: ttl });
    },

    async delete(key: string): Promise<void> {
      await kv.delete(PREFIX + key);
    },

    async invalidateByTag(tag: string): Promise<void> {
      const list = await kv.list({ prefix: PREFIX });
      for (const key of list.keys) {
        const data = await kv.get(key.name);
        if (data) {
          const cached: CachedIsland = JSON.parse(data);
          if (cached.tags.includes(tag)) {
            await kv.delete(key.name);
          }
        }
      }
    },

    async clear(): Promise<void> {
      const list = await kv.list({ prefix: PREFIX });
      for (const key of list.keys) {
        await kv.delete(key.name);
      }
    },
  };
}

// ============================================================================
// Metrics
// ============================================================================

/**
 * Get server island metrics
 */
export function getServerIslandMetrics(): ServerIslandMetrics {
  return { ...metrics };
}

/**
 * Reset metrics
 */
export function resetServerIslandMetrics(): void {
  metrics.hits = 0;
  metrics.misses = 0;
  metrics.staleHits = 0;
  metrics.revalidations = 0;
  metrics.errors = 0;
  metrics.avgRenderTime = 0;
  renderTimeSamples = [];
}

function updateRenderTimeMetrics(time: number): void {
  renderTimeSamples.push(time);
  if (renderTimeSamples.length > 100) {
    renderTimeSamples.shift();
  }
  metrics.avgRenderTime = renderTimeSamples.reduce((a, b) => a + b, 0) / renderTimeSamples.length;
}

// ============================================================================
// Utilities
// ============================================================================

let islandIdCounter = 0;

function generateIslandId(): string {
  return `si-${++islandIdCounter}`;
}

function generateCacheKey(
  id: string,
  props: Record<string, any>,
  config?: ServerIslandCache
): string {
  if (config?.keyGenerator) {
    return config.keyGenerator(props);
  }

  const propsHash = hashObject(props);
  return `island:${id}:${propsHash}`;
}

function hashObject(obj: Record<string, any>): string {
  const str = JSON.stringify(obj, Object.keys(obj).sort());
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36);
}

function generateETag(html: string): string {
  let hash = 0;
  for (let i = 0; i < html.length; i++) {
    const char = html.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return `"${Math.abs(hash).toString(36)}"`;
}

function wrapIslandHtml(
  id: string,
  html: string,
  meta: { cached: boolean; stale?: boolean; age?: number; renderTime?: number }
): string {
  const attrs = [
    `data-island-id="${id}"`,
    meta.cached ? 'data-cached="true"' : '',
    meta.stale ? 'data-stale="true"' : '',
    meta.age !== undefined ? `data-age="${Math.round(meta.age)}"` : '',
    meta.renderTime !== undefined ? `data-render-time="${Math.round(meta.renderTime)}"` : '',
  ].filter(Boolean).join(' ');

  return `<div ${attrs}>${html}</div>`;
}

// ============================================================================
// HTTP Headers
// ============================================================================

/**
 * Generate cache-control headers for an island
 */
export function getIslandCacheHeaders(config: ServerIslandCache): Record<string, string> {
  const headers: Record<string, string> = {};

  const directives: string[] = [];

  if (config.private) {
    directives.push('private');
  } else {
    directives.push('public');
  }

  directives.push(`max-age=${config.ttl}`);

  if (config.swr) {
    directives.push(`stale-while-revalidate=${config.swr}`);
  }

  headers['Cache-Control'] = directives.join(', ');

  if (config.varyBy && config.varyBy.length > 0) {
    headers['Vary'] = config.varyBy.join(', ');
  }

  if (config.edge) {
    headers['CDN-Cache-Control'] = `max-age=${config.ttl}`;
  }

  return headers;
}
