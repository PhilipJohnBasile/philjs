/**
 * Server Islands SSR Module
 *
 * Provides server-side rendering for islands architecture with caching support.
 */
// ============================================================================
// State
// ============================================================================
let metrics = {
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
class InMemoryCacheStore {
    cache = new Map();
    tagIndex = new Map();
    async get(key) {
        return this.cache.get(key) || null;
    }
    async set(key, value) {
        this.cache.set(key, value);
        // Index by tags
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
let cacheStore = new InMemoryCacheStore();
// ============================================================================
// Core Functions
// ============================================================================
/**
 * Generate a cache key for an island
 */
function generateCacheKey(islandId, props, cacheConfig) {
    if (cacheConfig?.keyGenerator) {
        return `island:${cacheConfig.keyGenerator(props)}`;
    }
    const propsHash = hashObject(props);
    return `island:${islandId}:${propsHash}`;
}
/**
 * Simple hash function for objects
 */
function hashObject(obj) {
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
function generateEtag(html) {
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
function escapeHtml(str) {
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
async function renderComponent(component, props) {
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
                if (v === true)
                    return name;
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
export async function renderServerIsland(islandId, component, props, cacheConfig) {
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
                    return cached.html.replace(`data-island-id="${islandId}"`, `data-island-id="${islandId}" data-stale="true"`);
                }
            }
            metrics.misses++;
        }
        // Render the component
        let html;
        try {
            html = await renderComponent(component, props);
        }
        catch (error) {
            metrics.errors++;
            throw error;
        }
        // Wrap with island metadata
        const wrappedHtml = `<div data-island-id="${islandId}"${cacheConfig?.ttl ? ' data-cached="true"' : ''}>${html}</div>`;
        // Cache if caching is enabled
        if (cacheConfig?.ttl) {
            const cachedIsland = {
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
    }
    catch (error) {
        metrics.errors++;
        throw error;
    }
}
/**
 * Background revalidation for stale-while-revalidate
 */
async function revalidateInBackground(islandId, component, props, cacheConfig, cacheKey) {
    metrics.revalidations++;
    try {
        const html = await renderComponent(component, props);
        const wrappedHtml = `<div data-island-id="${islandId}" data-cached="true">${html}</div>`;
        const cachedIsland = {
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
    catch (error) {
        console.error('Background revalidation failed:', error);
    }
}
/**
 * Manually cache an island
 */
export async function cacheIsland(islandId, html, options) {
    const cacheKey = `island:${islandId}`;
    const cachedIsland = {
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
export async function invalidateIsland(islandId, props, cacheConfig) {
    const cacheKey = generateCacheKey(islandId, props, cacheConfig);
    await cacheStore.delete(cacheKey);
}
/**
 * Invalidate all islands with a specific tag
 */
export async function invalidateIslandsByTag(tag) {
    await cacheStore.invalidateByTag(tag);
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
export async function prefetchIsland(islandId, component, props, cacheConfig) {
    await renderServerIsland(islandId, component, props, cacheConfig);
}
/**
 * Get the current cache store
 */
export function getIslandCacheStore() {
    return cacheStore;
}
/**
 * Set a custom cache store
 */
export function setIslandCacheStore(store) {
    cacheStore = store;
}
/**
 * Get server island metrics
 */
export function getServerIslandMetrics() {
    return { ...metrics };
}
/**
 * Reset server island metrics
 */
export function resetServerIslandMetrics() {
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
/**
 * Create a Redis cache adapter
 */
export function createRedisCacheAdapter(redis) {
    const PREFIX = 'philjs:island:';
    const TAG_PREFIX = 'philjs:tag:';
    return {
        async get(key) {
            const data = await redis.get(`${PREFIX}${key}`);
            return data ? JSON.parse(data) : null;
        },
        async set(key, value) {
            const ttl = value.ttl + value.swr;
            await redis.setex(`${PREFIX}${key}`, ttl, JSON.stringify(value));
            // Index by tags
            for (const tag of value.tags) {
                await redis.sadd(`${TAG_PREFIX}${tag}`, key);
                await redis.expire(`${TAG_PREFIX}${tag}`, ttl);
            }
        },
        async delete(key) {
            const data = await redis.get(`${PREFIX}${key}`);
            if (data) {
                const cached = JSON.parse(data);
                for (const tag of cached.tags || []) {
                    await redis.srem(`${TAG_PREFIX}${tag}`, key);
                }
            }
            await redis.del(`${PREFIX}${key}`);
        },
        async invalidateByTag(tag) {
            const keys = await redis.smembers(`${TAG_PREFIX}${tag}`);
            if (keys.length > 0) {
                await redis.del(...keys.map((k) => `${PREFIX}${k}`));
            }
            await redis.del(`${TAG_PREFIX}${tag}`);
        },
        async clear() {
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
export function createKVCacheAdapter(kv) {
    const PREFIX = 'island:';
    return {
        async get(key) {
            const data = await kv.get(`${PREFIX}${key}`);
            return data ? JSON.parse(data) : null;
        },
        async set(key, value) {
            const ttl = value.ttl + value.swr;
            await kv.put(`${PREFIX}${key}`, JSON.stringify(value), { expirationTtl: ttl });
        },
        async delete(key) {
            await kv.delete(`${PREFIX}${key}`);
        },
        async invalidateByTag(_tag) {
            // KV doesn't support efficient tag-based invalidation
            // Would need a separate index
            console.warn('Tag-based invalidation not supported in KV adapter');
        },
        async clear() {
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
export function ServerIsland(props) {
    const id = props.id || `island-${islandIdCounter++}`;
    return {
        type: 'server-island',
        props: { ...props, id },
    };
}
//# sourceMappingURL=server-islands.js.map