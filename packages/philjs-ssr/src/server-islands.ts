/**
 * Server Islands SSR Module
 *
 * Provides server-side rendering for islands architecture with caching support.
 */

import type { VNode } from '@philjs/core';

// ============================================================================
// Types
// ============================================================================

export interface ServerIslandCache {
  /** Time-to-live in seconds */
  ttl: number;
  /** Stale-while-revalidate time in seconds */
  swr?: number;
  /** Cache tags for invalidation */
  tags?: string[];
  /** Custom cache key generator */
  keyGenerator?: (props: Record<string, any>) => string;
  /** Whether cache is private (per-user) */
  private?: boolean;
  /** Whether to cache at edge */
  edge?: boolean;
  /** Headers to vary cache by */
  varyBy?: string[];
}

export interface CachedIsland {
  html: string;
  timestamp: number;
  ttl: number;
  swr: number;
  tags: string[];
  props: Record<string, any>;
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

export interface ServerIslandProps {
  id?: string;
  children: VNode;
  cache?: ServerIslandCache;
  fallback?: VNode;
  defer?: 'idle' | 'visible' | 'interaction';
  priority?: number;
}

// ============================================================================
// State
// ============================================================================

let metrics: ServerIslandMetrics = {
  hits: 0,
  misses: 0,
  staleHits: 0,
  revalidations: 0,
  errors: 0,
  avgRenderTime: 0,
};

let totalRenderTime = 0;
let renderCount = 0;

let islandIdCounter = 0;

// Default in-memory cache store
class InMemoryCacheStore implements IslandCacheStore {
  private cache = new Map<string, CachedIsland>();
  private tagIndex = new Map<string, Set<string>>();

  async get(key: string): Promise<CachedIsland | null> {
    return this.cache.get(key) || null;
  }

  async set(key: string, value: CachedIsland): Promise<void> {
    this.cache.set(key, value);
    // Index by tags
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

let cacheStore: IslandCacheStore = new InMemoryCacheStore();

// ============================================================================
// Core Functions
// ============================================================================

/**
 * Generate a cache key for an island
 */
function generateCacheKey(
  islandId: string,
  props: Record<string, any>,
  cacheConfig?: ServerIslandCache
): string {
  if (cacheConfig?.keyGenerator) {
    return `island:${cacheConfig.keyGenerator(props)}`;
  }
  const propsHash = hashObject(props);
  return `island:${islandId}:${propsHash}`;
}

/**
 * Simple hash function for objects
 */
function hashObject(obj: Record<string, any>): string {
  const str = JSON.stringify(obj);
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36);
}

/**
 * Generate ETag for cached content
 */
function generateEtag(html: string): string {
  let hash = 0;
  for (let i = 0; i < html.length; i++) {
    const char = html.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return `"${Math.abs(hash).toString(16)}"`;
}

/**
 * Escape HTML content
 */
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Render a component to HTML string
 */
async function renderComponent(
  component: any,
  props: Record<string, any>
): Promise<string> {
  if (component == null) {
    return '';
  }

  if (typeof component === 'string') {
    return escapeHtml(component);
  }

  if (typeof component === 'number') {
    return String(component);
  }

  if (typeof component === 'function') {
    const result = await component(props);
    return renderComponent(result, {});
  }

  if (typeof component === 'object' && 'type' in component) {
    const { type, props: elementProps } = component;
    if (typeof type === 'function') {
      const result = await type(elementProps);
      return renderComponent(result, {});
    }
    if (typeof type === 'string') {
      const { children, ...attrs } = elementProps || {};
      const attrsStr = Object.entries(attrs)
        .filter(([, v]) => v != null && v !== false)
        .map(([k, v]) => {
          const name = k === 'className' ? 'class' : k;
          if (v === true) return name;
          return `${name}="${escapeHtml(String(v))}"`;
        })
        .join(' ');
      const openTag = attrsStr ? `<${type} ${attrsStr}>` : `<${type}>`;
      const childrenHtml = await renderComponent(children, {});
      return `${openTag}${childrenHtml}</${type}>`;
    }
  }

  return String(component);
}

/**
 * Render a server island to HTML string
 */
export async function renderServerIsland(
  islandId: string,
  component: any,
  props: Record<string, any>,
  cacheConfig?: ServerIslandCache
): Promise<string> {
  const startTime = performance.now();

  try {
    const cacheKey = generateCacheKey(islandId, props, cacheConfig);

    // Check cache if caching is enabled
    if (cacheConfig?.ttl) {
      const cached = await cacheStore.get(cacheKey);

      if (cached) {
        const now = Date.now();
        const age = (now - cached.timestamp) / 1000;

        // Check if still fresh
        if (age < cached.ttl) {
          metrics.hits++;
          return cached.html;
        }

        // Check if within SWR window
        if (cached.swr && age < cached.ttl + cached.swr) {
          metrics.staleHits++;
          // Trigger background revalidation
          revalidateInBackground(islandId, component, props, cacheConfig, cacheKey);
          return cached.html.replace(
            `data-island-id="${islandId}"`,
            `data-island-id="${islandId}" data-stale="true"`
          );
        }
      }

      metrics.misses++;
    }

    // Render the component
    let html: string;
    try {
      html = await renderComponent(component, props);
    } catch (error) {
      metrics.errors++;
      throw error;
    }

    // Wrap with island metadata
    const wrappedHtml = `<div data-island-id="${islandId}"${
      cacheConfig?.ttl ? ' data-cached="true"' : ''
    }>${html}</div>`;

    // Cache if caching is enabled
    if (cacheConfig?.ttl) {
      const cachedIsland: CachedIsland = {
        html: wrappedHtml,
        timestamp: Date.now(),
        ttl: cacheConfig.ttl,
        swr: cacheConfig.swr || 0,
        tags: cacheConfig.tags || [],
        props,
        etag: generateEtag(wrappedHtml),
      };
      await cacheStore.set(cacheKey, cachedIsland);
    }

    // Update metrics
    const renderTime = performance.now() - startTime;
    totalRenderTime += renderTime;
    renderCount++;
    metrics.avgRenderTime = totalRenderTime / renderCount;

    return wrappedHtml;
  } catch (error) {
    metrics.errors++;
    throw error;
  }
}

/**
 * Background revalidation for stale-while-revalidate
 */
async function revalidateInBackground(
  islandId: string,
  component: any,
  props: Record<string, any>,
  cacheConfig: ServerIslandCache,
  cacheKey: string
): Promise<void> {
  metrics.revalidations++;

  try {
    const html = await renderComponent(component, props);
    const wrappedHtml = `<div data-island-id="${islandId}" data-cached="true">${html}</div>`;

    const cachedIsland: CachedIsland = {
      html: wrappedHtml,
      timestamp: Date.now(),
      ttl: cacheConfig.ttl,
      swr: cacheConfig.swr || 0,
      tags: cacheConfig.tags || [],
      props,
      etag: generateEtag(wrappedHtml),
    };

    await cacheStore.set(cacheKey, cachedIsland);
  } catch (error) {
    console.error('Background revalidation failed:', error);
  }
}

/**
 * Manually cache an island
 */
export async function cacheIsland(
  islandId: string,
  html: string,
  options: { ttl: number; tags?: string[]; swr?: number }
): Promise<void> {
  const cacheKey = `island:${islandId}`;
  const cachedIsland: CachedIsland = {
    html,
    timestamp: Date.now(),
    ttl: options.ttl,
    swr: options.swr || 0,
    tags: options.tags || [],
    props: {},
    etag: generateEtag(html),
  };
  await cacheStore.set(cacheKey, cachedIsland);
}

/**
 * Invalidate a specific island from cache
 */
export async function invalidateIsland(
  islandId: string,
  props: Record<string, any>,
  cacheConfig?: ServerIslandCache
): Promise<void> {
  const cacheKey = generateCacheKey(islandId, props, cacheConfig);
  await cacheStore.delete(cacheKey);
}

/**
 * Invalidate all islands with a specific tag
 */
export async function invalidateIslandsByTag(tag: string): Promise<void> {
  await cacheStore.invalidateByTag(tag);
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
  islandId: string,
  component: any,
  props: Record<string, any>,
  cacheConfig: ServerIslandCache
): Promise<void> {
  await renderServerIsland(islandId, component, props, cacheConfig);
}

/**
 * Get the current cache store
 */
export function getIslandCacheStore(): IslandCacheStore {
  return cacheStore;
}

/**
 * Set a custom cache store
 */
export function setIslandCacheStore(store: IslandCacheStore): void {
  cacheStore = store;
}

/**
 * Get server island metrics
 */
export function getServerIslandMetrics(): ServerIslandMetrics {
  return { ...metrics };
}

/**
 * Reset server island metrics
 */
export function resetServerIslandMetrics(): void {
  metrics = {
    hits: 0,
    misses: 0,
    staleHits: 0,
    revalidations: 0,
    errors: 0,
    avgRenderTime: 0,
  };
  totalRenderTime = 0;
  renderCount = 0;
}

/**
 * Generate cache headers for an island
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

/**
 * Create a Redis cache adapter
 */
export function createRedisCacheAdapter(redis: any): IslandCacheStore {
  const PREFIX = 'philjs:island:';
  const TAG_PREFIX = 'philjs:tag:';

  return {
    async get(key: string): Promise<CachedIsland | null> {
      const data = await redis.get(`${PREFIX}${key}`);
      return data ? JSON.parse(data) : null;
    },

    async set(key: string, value: CachedIsland): Promise<void> {
      const ttl = value.ttl + value.swr;
      await redis.setex(`${PREFIX}${key}`, ttl, JSON.stringify(value));

      // Index by tags
      for (const tag of value.tags) {
        await redis.sadd(`${TAG_PREFIX}${tag}`, key);
        await redis.expire(`${TAG_PREFIX}${tag}`, ttl);
      }
    },

    async delete(key: string): Promise<void> {
      const data = await redis.get(`${PREFIX}${key}`);
      if (data) {
        const cached = JSON.parse(data);
        for (const tag of cached.tags || []) {
          await redis.srem(`${TAG_PREFIX}${tag}`, key);
        }
      }
      await redis.del(`${PREFIX}${key}`);
    },

    async invalidateByTag(tag: string): Promise<void> {
      const keys = await redis.smembers(`${TAG_PREFIX}${tag}`);
      if (keys.length > 0) {
        await redis.del(...keys.map((k: string) => `${PREFIX}${k}`));
      }
      await redis.del(`${TAG_PREFIX}${tag}`);
    },

    async clear(): Promise<void> {
      const keys = await redis.keys(`${PREFIX}*`);
      if (keys.length > 0) {
        await redis.del(...keys);
      }
      const tagKeys = await redis.keys(`${TAG_PREFIX}*`);
      if (tagKeys.length > 0) {
        await redis.del(...tagKeys);
      }
    },
  };
}

/**
 * Create a KV (Cloudflare Workers) cache adapter
 */
export function createKVCacheAdapter(kv: any): IslandCacheStore {
  const PREFIX = 'island:';

  return {
    async get(key: string): Promise<CachedIsland | null> {
      const data = await kv.get(`${PREFIX}${key}`);
      return data ? JSON.parse(data) : null;
    },

    async set(key: string, value: CachedIsland): Promise<void> {
      const ttl = value.ttl + value.swr;
      await kv.put(`${PREFIX}${key}`, JSON.stringify(value), { expirationTtl: ttl });
    },

    async delete(key: string): Promise<void> {
      await kv.delete(`${PREFIX}${key}`);
    },

    async invalidateByTag(_tag: string): Promise<void> {
      // KV doesn't support efficient tag-based invalidation
      // Would need a separate index
      console.warn('Tag-based invalidation not supported in KV adapter');
    },

    async clear(): Promise<void> {
      const list = await kv.list({ prefix: PREFIX });
      for (const key of list.keys) {
        await kv.delete(key.name);
      }
    },
  };
}

/**
 * ServerIsland component for JSX usage
 */
export function ServerIsland(props: ServerIslandProps): { type: string; props: ServerIslandProps } {
  const id = props.id || `island-${islandIdCounter++}`;
  return {
    type: 'server-island',
    props: { ...props, id },
  };
}

// Re-export types for test file
export type { VNode };
