/**
 * PhilJS Edge Caching
 *
 * Edge caching utilities for optimal performance.
 * Supports Cache API, stale-while-revalidate, and cache purging.
 *
 * Features:
 * - Edge Cache API integration
 * - Cache-Control header management
 * - Stale-while-revalidate at edge
 * - Cache purging utilities
 * - Cache key generation
 * - Conditional requests (ETags, Last-Modified)
 */
// ============================================================================
// Default Cache Store (uses Cache API)
// ============================================================================
class DefaultCacheStore {
    cacheName;
    tagMap = new Map();
    constructor(cacheName = 'philjs-edge-cache') {
        this.cacheName = cacheName;
    }
    async get(key) {
        if (typeof caches === 'undefined')
            return undefined;
        const cache = await caches.open(this.cacheName);
        const response = await cache.match(key);
        if (!response)
            return undefined;
        // Check if expired
        const cachedAt = response.headers.get('X-Cached-At');
        const ttl = response.headers.get('X-Cache-TTL');
        if (cachedAt && ttl) {
            const age = Date.now() - parseInt(cachedAt, 10);
            if (age > parseInt(ttl, 10) * 1000) {
                await cache.delete(key);
                return undefined;
            }
        }
        return response;
    }
    async put(key, response, options) {
        if (typeof caches === 'undefined')
            return;
        const cache = await caches.open(this.cacheName);
        // Clone response and add cache metadata
        const headers = new Headers(response.headers);
        headers.set('X-Cached-At', Date.now().toString());
        if (options?.ttl) {
            headers.set('X-Cache-TTL', options.ttl.toString());
        }
        if (options?.tags) {
            headers.set('X-Cache-Tags', options.tags.join(','));
        }
        const cachedResponse = new Response(response.body, {
            status: response.status,
            statusText: response.statusText,
            headers,
        });
        await cache.put(key, cachedResponse);
        // Update tag map
        if (options?.tags) {
            for (const tag of options.tags) {
                if (!this.tagMap.has(tag)) {
                    this.tagMap.set(tag, new Set());
                }
                this.tagMap.get(tag).add(key);
            }
        }
    }
    async delete(key) {
        if (typeof caches === 'undefined')
            return;
        const cache = await caches.open(this.cacheName);
        await cache.delete(key);
        // Clean up tag map
        for (const [tag, keys] of this.tagMap.entries()) {
            keys.delete(key);
            if (keys.size === 0) {
                this.tagMap.delete(tag);
            }
        }
    }
    async purge(tags) {
        const keysToDelete = new Set();
        for (const tag of tags) {
            const keys = this.tagMap.get(tag);
            if (keys) {
                keys.forEach((key) => keysToDelete.add(key));
            }
        }
        for (const key of keysToDelete) {
            await this.delete(key);
        }
    }
}
// ============================================================================
// Cache Middleware
// ============================================================================
let defaultStore;
function getDefaultStore() {
    if (!defaultStore) {
        defaultStore = new DefaultCacheStore();
    }
    return defaultStore;
}
/**
 * Edge caching middleware
 */
export function edgeCacheMiddleware(options = {}) {
    const store = options.store || getDefaultStore();
    return async (context) => {
        // Skip caching for non-GET requests
        if (context.request.method !== 'GET') {
            return context.next();
        }
        // Check match condition
        if (options.match && !options.match(context)) {
            return context.next();
        }
        // Generate cache key
        const cacheKey = options.generateKey
            ? options.generateKey(context)
            : generateCacheKey(context, options);
        // Try to get from cache
        const cached = await store.get(cacheKey);
        if (cached) {
            const age = Date.now() - parseInt(cached.headers.get('X-Cached-At') || '0', 10);
            const ttl = parseInt(cached.headers.get('X-Cache-TTL') || '0', 10) * 1000;
            const swr = (options.swr || 0) * 1000;
            // Fresh cache hit
            if (age < ttl) {
                const headers = new Headers(cached.headers);
                headers.set('X-Cache', 'HIT');
                headers.set('Age', Math.floor(age / 1000).toString());
                return new Response(cached.body, {
                    status: cached.status,
                    statusText: cached.statusText,
                    headers,
                });
            }
            // Stale-while-revalidate
            if (swr > 0 && age < ttl + swr) {
                // Return stale response immediately
                const headers = new Headers(cached.headers);
                headers.set('X-Cache', 'STALE');
                headers.set('Age', Math.floor(age / 1000).toString());
                const staleResponse = new Response(cached.body, {
                    status: cached.status,
                    statusText: cached.statusText,
                    headers,
                });
                // Revalidate in background (don't await)
                revalidateInBackground(context, store, cacheKey, options);
                return staleResponse;
            }
        }
        // Cache miss - fetch and cache
        const response = await context.next();
        // Only cache successful responses
        if (response.status >= 200 && response.status < 300) {
            // Clone response for caching
            const responseClone = response.clone();
            // Cache in background (don't await)
            store.put(cacheKey, responseClone, options).catch((err) => {
                console.error('Edge cache error:', err);
            });
            const headers = new Headers(response.headers);
            headers.set('X-Cache', 'MISS');
            return new Response(response.body, {
                status: response.status,
                statusText: response.statusText,
                headers,
            });
        }
        return response;
    };
}
/**
 * Revalidate cache in background
 */
async function revalidateInBackground(context, store, cacheKey, options) {
    try {
        const response = await context.next();
        if (response.status >= 200 && response.status < 300) {
            await store.put(cacheKey, response, options);
        }
    }
    catch (err) {
        console.error('Background revalidation error:', err);
    }
}
/**
 * Generate cache key
 */
export function generateCacheKey(context, options = {}) {
    if (options.key)
        return options.key;
    const url = context.request.url;
    let key = `${url.pathname}${url.search}`;
    // Add vary headers to key
    if (options.vary) {
        const varyParts = options.vary.map((header) => {
            const value = context.request.headers.get(header);
            return `${header}:${value || ''}`;
        });
        key += `|${varyParts.join('|')}`;
    }
    return key;
}
// ============================================================================
// Cache-Control Middleware
// ============================================================================
/**
 * Set Cache-Control headers
 */
export function cacheControlMiddleware(options) {
    return async (context) => {
        const response = await context.next();
        const headers = new Headers(response.headers);
        const directives = [];
        if (options.noCache) {
            directives.push('no-cache');
        }
        if (options.noStore) {
            directives.push('no-store');
        }
        if (options.mustRevalidate) {
            directives.push('must-revalidate');
        }
        if (options.immutable) {
            directives.push('immutable');
        }
        if (options.visibility) {
            directives.push(options.visibility);
        }
        if (options.maxAge !== undefined) {
            directives.push(`max-age=${options.maxAge}`);
        }
        if (options.sMaxAge !== undefined) {
            directives.push(`s-maxage=${options.sMaxAge}`);
        }
        if (options.staleWhileRevalidate !== undefined) {
            directives.push(`stale-while-revalidate=${options.staleWhileRevalidate}`);
        }
        if (options.staleIfError !== undefined) {
            directives.push(`stale-if-error=${options.staleIfError}`);
        }
        if (directives.length > 0) {
            headers.set('Cache-Control', directives.join(', '));
        }
        return new Response(response.body, {
            status: response.status,
            statusText: response.statusText,
            headers,
        });
    };
}
// ============================================================================
// Conditional Requests (ETag, Last-Modified)
// ============================================================================
/**
 * Generate ETag from content
 */
export function generateETag(content) {
    // Simple hash-based ETag
    let hash = 0;
    const str = typeof content === 'string' ? content : new TextDecoder().decode(content);
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = (hash << 5) - hash + char;
        hash = hash & hash;
    }
    return `"${hash.toString(36)}"`;
}
/**
 * ETag middleware for conditional requests
 */
export function etagMiddleware() {
    return async (context) => {
        const response = await context.next();
        // Only for GET requests
        if (context.request.method !== 'GET') {
            return response;
        }
        // Skip if already has ETag
        if (response.headers.has('ETag')) {
            return handleConditionalRequest(context, response);
        }
        // Generate ETag
        const body = await response.arrayBuffer();
        const etag = generateETag(body);
        const headers = new Headers(response.headers);
        headers.set('ETag', etag);
        const newResponse = new Response(body, {
            status: response.status,
            statusText: response.statusText,
            headers,
        });
        return handleConditionalRequest(context, newResponse);
    };
}
/**
 * Handle conditional request
 */
function handleConditionalRequest(context, response) {
    const etag = response.headers.get('ETag');
    const lastModified = response.headers.get('Last-Modified');
    const ifNoneMatch = context.request.headers.get('If-None-Match');
    const ifModifiedSince = context.request.headers.get('If-Modified-Since');
    // Check If-None-Match
    if (ifNoneMatch && etag) {
        const tags = ifNoneMatch.split(',').map((tag) => tag.trim());
        if (tags.includes(etag) || tags.includes('*')) {
            return new Response(null, {
                status: 304,
                headers: response.headers,
            });
        }
    }
    // Check If-Modified-Since
    if (ifModifiedSince && lastModified) {
        const ifModifiedSinceDate = new Date(ifModifiedSince);
        const lastModifiedDate = new Date(lastModified);
        if (lastModifiedDate <= ifModifiedSinceDate) {
            return new Response(null, {
                status: 304,
                headers: response.headers,
            });
        }
    }
    return response;
}
/**
 * Last-Modified middleware
 */
export function lastModifiedMiddleware(getLastModified) {
    return async (context) => {
        const response = await context.next();
        const lastModified = getLastModified(context);
        const headers = new Headers(response.headers);
        headers.set('Last-Modified', lastModified.toUTCString());
        const newResponse = new Response(response.body, {
            status: response.status,
            statusText: response.statusText,
            headers,
        });
        return handleConditionalRequest(context, newResponse);
    };
}
// ============================================================================
// Cache Purging
// ============================================================================
/**
 * Purge cache by tags
 */
export async function purgeCacheTags(tags, store) {
    const cacheStore = store || getDefaultStore();
    await cacheStore.purge(tags);
}
/**
 * Purge cache by key
 */
export async function purgeCacheKey(key, store) {
    const cacheStore = store || getDefaultStore();
    await cacheStore.delete(key);
}
/**
 * Purge all caches
 */
export async function purgeAllCache(cacheName = 'philjs-edge-cache') {
    if (typeof caches === 'undefined')
        return;
    await caches.delete(cacheName);
}
/**
 * Cloudflare cache middleware
 */
export function cloudflareCacheMiddleware(options = {}) {
    return async (context) => {
        const request = context.request.raw;
        // Create cache options with Cloudflare-specific properties
        const cacheOptions = {
            cf: {
                cacheEverything: options.cacheEverything,
                cacheTtl: options.cacheTtl,
                cacheTtlByStatus: options.cacheTtlByStatus,
                cacheKey: options.cacheKey || request.url,
            },
        };
        // Fetch with cache options
        const response = await fetch(request, cacheOptions);
        return response;
    };
}
// ============================================================================
// Vary Header Utilities
// ============================================================================
/**
 * Add Vary headers middleware
 */
export function varyMiddleware(headers) {
    return async (context) => {
        const response = await context.next();
        const responseHeaders = new Headers(response.headers);
        const existingVary = responseHeaders.get('Vary');
        const varyHeaders = existingVary ? existingVary.split(',').map((h) => h.trim()) : [];
        headers.forEach((header) => {
            if (!varyHeaders.includes(header)) {
                varyHeaders.push(header);
            }
        });
        responseHeaders.set('Vary', varyHeaders.join(', '));
        return new Response(response.body, {
            status: response.status,
            statusText: response.statusText,
            headers: responseHeaders,
        });
    };
}
// ============================================================================
// Cache Presets
// ============================================================================
/**
 * Static asset caching preset
 */
export function staticAssetCache() {
    return edgeCacheMiddleware({
        ttl: 31536000, // 1 year
        match: (context) => {
            const pathname = context.request.url.pathname;
            return /\.(js|css|png|jpg|jpeg|gif|svg|woff|woff2|ttf|eot|ico|webp|avif)$/.test(pathname);
        },
    });
}
/**
 * API response caching preset
 */
export function apiCache(ttl = 60, swr = 300) {
    return edgeCacheMiddleware({
        ttl,
        swr,
        vary: ['Accept', 'Authorization'],
        match: (context) => {
            const pathname = context.request.url.pathname;
            return pathname.startsWith('/api/');
        },
    });
}
/**
 * Page caching preset with SWR
 */
export function pageCache(ttl = 300, swr = 3600) {
    return edgeCacheMiddleware({
        ttl,
        swr,
        vary: ['Cookie', 'Accept-Language'],
        match: (context) => {
            // Cache HTML pages
            return context.request.headers.get('Accept')?.includes('text/html') || false;
        },
    });
}
//# sourceMappingURL=edge-cache.js.map