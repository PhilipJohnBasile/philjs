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
// Default In-Memory Cache Store
// ============================================================================
class InMemoryCacheStore {
    cache = new Map();
    tagIndex = new Map();
    async get(key) {
        return this.cache.get(key) || null;
    }
    async set(key, value) {
        this.cache.set(key, value);
        // Update tag index
        for (const tag of value.tags) {
            if (!this.tagIndex.has(tag)) {
                this.tagIndex.set(tag, new Set());
            }
            this.tagIndex.get(tag).add(key);
        }
    }
    async delete(key) {
        const cached = this.cache.get(key);
        if (cached) {
            // Remove from tag index
            for (const tag of cached.tags) {
                this.tagIndex.get(tag)?.delete(key);
            }
        }
        this.cache.delete(key);
    }
    async invalidateByTag(tag) {
        const keys = this.tagIndex.get(tag);
        if (keys) {
            for (const key of keys) {
                this.cache.delete(key);
            }
            this.tagIndex.delete(tag);
        }
    }
    async clear() {
        this.cache.clear();
        this.tagIndex.clear();
    }
}
// ============================================================================
// Global State
// ============================================================================
let cacheStore = new InMemoryCacheStore();
const metrics = {
    hits: 0,
    misses: 0,
    staleHits: 0,
    revalidations: 0,
    errors: 0,
    avgRenderTime: 0,
};
const pendingRevalidations = new Map();
let renderTimeSamples = [];
// ============================================================================
// Configuration
// ============================================================================
/**
 * Set the cache store for server islands
 */
export function setIslandCacheStore(store) {
    cacheStore = store;
}
/**
 * Get the current cache store
 */
export function getIslandCacheStore() {
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
export function ServerIsland(props) {
    const { id = generateIslandId(), cache, fallback, children, props: componentProps = {}, defer = false, media, priority = 5, } = props;
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
export async function renderServerIsland(id, component, props, cacheConfig) {
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
    }
    catch (error) {
        metrics.errors++;
        throw error;
    }
}
/**
 * Revalidate a cached island in the background
 */
async function revalidateIsland(id, component, props, cacheConfig, cacheKey) {
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
    }
    catch (error) {
        // On error, keep the stale cache
        console.error(`Failed to revalidate island ${id}:`, error);
        throw error;
    }
}
/**
 * Render a component to HTML string
 */
async function renderComponent(component, props) {
    // Handle primitive types
    if (component === null || component === undefined || typeof component === 'boolean') {
        return '';
    }
    if (typeof component === 'string' || typeof component === 'number') {
        return String(component);
    }
    // Handle function components
    if (typeof component === 'function') {
        const result = component(props);
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
export async function cacheIsland(id, html, config) {
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
export async function invalidateIslandsByTag(tag) {
    await cacheStore.invalidateByTag(tag);
}
/**
 * Invalidate a specific island
 */
export async function invalidateIsland(id, props) {
    const cacheKey = props
        ? generateCacheKey(id, props)
        : `island:${id}`;
    await cacheStore.delete(cacheKey);
}
/**
 * Clear all island caches
 */
export async function clearIslandCache() {
    await cacheStore.clear();
}
/**
 * Prefetch and cache an island
 */
export async function prefetchIsland(id, component, props, cacheConfig) {
    await renderServerIsland(id, component, props, cacheConfig);
}
/**
 * Create a Redis cache adapter
 */
export function createRedisCacheAdapter(client) {
    const PREFIX = 'philjs:island:';
    const TAG_PREFIX = 'philjs:tag:';
    return {
        async get(key) {
            const data = await client.get(PREFIX + key);
            return data ? JSON.parse(data) : null;
        },
        async set(key, value) {
            const ttl = value.ttl + (value.swr || 0);
            await client.setex(PREFIX + key, ttl, JSON.stringify(value));
            // Update tag index
            for (const tag of value.tags) {
                await client.sadd(TAG_PREFIX + tag, key);
                await client.expire(TAG_PREFIX + tag, ttl);
            }
        },
        async delete(key) {
            const data = await client.get(PREFIX + key);
            if (data) {
                const cached = JSON.parse(data);
                for (const tag of cached.tags) {
                    await client.srem(TAG_PREFIX + tag, key);
                }
            }
            await client.del(PREFIX + key);
        },
        async invalidateByTag(tag) {
            const keys = await client.smembers(TAG_PREFIX + tag);
            if (keys.length > 0) {
                await client.del(...keys.map((k) => PREFIX + k));
                await client.del(TAG_PREFIX + tag);
            }
        },
        async clear() {
            const keys = await client.keys(PREFIX + '*');
            const tagKeys = await client.keys(TAG_PREFIX + '*');
            if (keys.length > 0)
                await client.del(...keys);
            if (tagKeys.length > 0)
                await client.del(...tagKeys);
        },
    };
}
/**
 * Create an edge-compatible KV cache adapter
 */
export function createKVCacheAdapter(kv) {
    const PREFIX = 'island:';
    return {
        async get(key) {
            const data = await kv.get(PREFIX + key);
            return data ? JSON.parse(data) : null;
        },
        async set(key, value) {
            const ttl = value.ttl + (value.swr || 0);
            await kv.put(PREFIX + key, JSON.stringify(value), { expirationTtl: ttl });
        },
        async delete(key) {
            await kv.delete(PREFIX + key);
        },
        async invalidateByTag(tag) {
            const list = await kv.list({ prefix: PREFIX });
            for (const key of list.keys) {
                const data = await kv.get(key.name);
                if (data) {
                    const cached = JSON.parse(data);
                    if (cached.tags.includes(tag)) {
                        await kv.delete(key.name);
                    }
                }
            }
        },
        async clear() {
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
export function getServerIslandMetrics() {
    return { ...metrics };
}
/**
 * Reset metrics
 */
export function resetServerIslandMetrics() {
    metrics.hits = 0;
    metrics.misses = 0;
    metrics.staleHits = 0;
    metrics.revalidations = 0;
    metrics.errors = 0;
    metrics.avgRenderTime = 0;
    renderTimeSamples = [];
}
function updateRenderTimeMetrics(time) {
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
function generateIslandId() {
    return `si-${++islandIdCounter}`;
}
function generateCacheKey(id, props, config) {
    if (config?.keyGenerator) {
        return config.keyGenerator(props);
    }
    const propsHash = hashObject(props);
    return `island:${id}:${propsHash}`;
}
function hashObject(obj) {
    const str = JSON.stringify(obj, Object.keys(obj).sort());
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }
    return Math.abs(hash).toString(36);
}
function generateETag(html) {
    let hash = 0;
    for (let i = 0; i < html.length; i++) {
        const char = html.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }
    return `"${Math.abs(hash).toString(36)}"`;
}
function wrapIslandHtml(id, html, meta) {
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
export function getIslandCacheHeaders(config) {
    const headers = {};
    const directives = [];
    if (config.private) {
        directives.push('private');
    }
    else {
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
//# sourceMappingURL=server-islands.js.map