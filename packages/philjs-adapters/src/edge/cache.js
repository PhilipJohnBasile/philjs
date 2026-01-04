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
import { detectEdgePlatform } from './edge-runtime.js';
class LRUCache {
    maxEntries;
    maxSize;
    cache = new Map();
    head = null;
    tail = null;
    currentSize = 0;
    stats = {
        hits: 0,
        misses: 0,
        staleHits: 0,
        revalidations: 0,
        entries: 0,
        memoryUsage: 0,
    };
    constructor(maxEntries = 1000, maxSize = 50 * 1024 * 1024 // 50MB
    ) {
        this.maxEntries = maxEntries;
        this.maxSize = maxSize;
    }
    get(key) {
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
        }
        else {
            this.stats.hits++;
        }
        return node.entry;
    }
    set(key, entry) {
        const size = this.estimateSize(entry);
        // Check if entry already exists
        const existing = this.cache.get(key);
        if (existing) {
            this.currentSize -= existing.size;
            existing.entry = entry;
            existing.size = size;
            this.currentSize += size;
            this.moveToFront(existing);
        }
        else {
            // Evict if necessary
            while ((this.cache.size >= this.maxEntries || this.currentSize + size > this.maxSize) &&
                this.tail) {
                this.evictLRU();
            }
            const node = {
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
    delete(key) {
        const node = this.cache.get(key);
        if (!node)
            return false;
        this.removeNode(node);
        this.cache.delete(key);
        this.currentSize -= node.size;
        this.stats.entries = this.cache.size;
        this.stats.memoryUsage = this.currentSize;
        return true;
    }
    deleteByTag(tag) {
        let count = 0;
        for (const [key, node] of this.cache) {
            if (node.entry.tags?.includes(tag)) {
                this.delete(key);
                count++;
            }
        }
        return count;
    }
    clear() {
        this.cache.clear();
        this.head = null;
        this.tail = null;
        this.currentSize = 0;
        this.stats.entries = 0;
        this.stats.memoryUsage = 0;
    }
    getStats() {
        return { ...this.stats };
    }
    resetStats() {
        this.stats.hits = 0;
        this.stats.misses = 0;
        this.stats.staleHits = 0;
        this.stats.revalidations = 0;
    }
    moveToFront(node) {
        if (node === this.head)
            return;
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
    removeNode(node) {
        if (node.prev) {
            node.prev.next = node.next;
        }
        else {
            this.head = node.next;
        }
        if (node.next) {
            node.next.prev = node.prev;
        }
        else {
            this.tail = node.prev;
        }
    }
    evictLRU() {
        if (!this.tail)
            return;
        const key = this.tail.key;
        this.removeNode(this.tail);
        const node = this.cache.get(key);
        if (node) {
            this.currentSize -= node.size;
            this.cache.delete(key);
        }
    }
    estimateSize(entry) {
        // Rough estimate of memory usage
        try {
            return JSON.stringify(entry).length * 2; // UTF-16 characters
        }
        catch {
            return 1024; // Default estimate for non-serializable values
        }
    }
}
/**
 * Create a KV store adapter for Cloudflare KV
 */
function createCloudflareKVStore(namespace) {
    return {
        async get(key) {
            try {
                const value = await namespace.get(key, { type: 'json' });
                return value;
            }
            catch {
                return null;
            }
        },
        async set(key, entry) {
            const ttlSeconds = Math.max(1, Math.ceil((entry.expiresAt - Date.now()) / 1000));
            await namespace.put(key, JSON.stringify(entry), {
                expirationTtl: ttlSeconds,
            });
        },
        async delete(key) {
            await namespace.delete(key);
        },
        async deleteByPrefix(prefix) {
            let count = 0;
            let cursor;
            do {
                const listOptions = { prefix, limit: 1000 };
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
function createDenoKVStore() {
    let kvPromise = null;
    const getKV = async () => {
        if (!kvPromise) {
            kvPromise = globalThis.Deno.openKv();
        }
        return kvPromise;
    };
    return {
        async get(key) {
            try {
                const kv = await getKV();
                const result = await kv.get(['cache', key]);
                return result.value;
            }
            catch {
                return null;
            }
        },
        async set(key, entry) {
            const kv = await getKV();
            const ttlMs = entry.expiresAt - Date.now();
            await kv.set(['cache', key], entry, {
                expireIn: Math.max(1000, ttlMs),
            });
        },
        async delete(key) {
            const kv = await getKV();
            await kv.delete(['cache', key]);
        },
        async deleteByPrefix(prefix) {
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
    memoryCache;
    kvStore;
    revalidating = new Set();
    config;
    constructor(config = {}) {
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
    initKVStore() {
        const platform = detectEdgePlatform();
        if (this.config.kvNamespace) {
            if (typeof this.config.kvNamespace === 'string') {
                // Named namespace - platform specific lookup
                if (platform === 'cloudflare') {
                    const env = globalThis.env;
                    const namespace = env?.[this.config.kvNamespace];
                    if (namespace) {
                        this.kvStore = createCloudflareKVStore(namespace);
                    }
                }
            }
            else {
                // Direct namespace reference
                this.kvStore = createCloudflareKVStore(this.config.kvNamespace);
            }
        }
        else if (platform === 'deno') {
            this.kvStore = createDenoKVStore();
        }
    }
    getFullKey(key) {
        return `${this.config.keyPrefix}${key}`;
    }
    /**
     * Get a value from cache with SWR support
     */
    async get(key, revalidate) {
        const fullKey = this.getFullKey(key);
        const now = Date.now();
        // Check memory cache first
        let entry = this.memoryCache.get(fullKey);
        // Try KV store if not in memory
        if (!entry && this.kvStore) {
            entry = await this.kvStore.get(fullKey) ?? undefined;
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
                const cacheOptions = {
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
    async set(key, value, options = {}) {
        const fullKey = this.getFullKey(key);
        const now = Date.now();
        const ttl = options.ttl ?? this.config.defaultTTL;
        const swr = options.swr ?? this.config.defaultSWR;
        const entry = {
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
        }
        catch {
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
    async delete(key) {
        const fullKey = this.getFullKey(key);
        const deleted = this.memoryCache.delete(fullKey);
        if (this.kvStore) {
            await this.kvStore.delete(fullKey).catch(() => { });
        }
        return deleted;
    }
    /**
     * Invalidate cache entries by tag
     */
    async invalidateByTag(tag) {
        const count = this.memoryCache.deleteByTag(tag);
        if (this.kvStore) {
            await this.kvStore.deleteByPrefix(`${this.config.keyPrefix}tag:${tag}:`).catch(() => { });
        }
        return count;
    }
    /**
     * Clear all cache entries
     */
    async clear() {
        this.memoryCache.clear();
        if (this.kvStore) {
            await this.kvStore.deleteByPrefix(this.config.keyPrefix).catch(() => { });
        }
    }
    /**
     * Get cache statistics
     */
    getStats() {
        return this.memoryCache.getStats();
    }
    /**
     * Wrap a function with caching
     */
    wrap(fn, options = {}) {
        const keyGenerator = options.keyGenerator || ((...args) => JSON.stringify(args));
        return async (...args) => {
            const key = options.key || keyGenerator(...args);
            const { value, hit } = await this.get(key, () => fn(...args));
            if (hit && value !== undefined) {
                return value;
            }
            const result = await fn(...args);
            await this.set(key, result, options);
            return result;
        };
    }
    async generateETag(value) {
        const data = JSON.stringify(value);
        const encoder = new TextEncoder();
        const dataBuffer = encoder.encode(data);
        const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
        return `"${hashHex.substring(0, 16)}"`;
    }
}
/**
 * Create a cache key from a request
 */
export function createCacheKey(request, options = {}) {
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
export function shouldCacheResponse(request, response, options = {}) {
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
        if (cacheControl.includes('no-store') ||
            cacheControl.includes('private') ||
            cacheControl.includes('no-cache')) {
            return false;
        }
    }
    return true;
}
/**
 * Create cached response with proper headers
 */
export async function createCachedResponse(response, entry, options = {}) {
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
export function createCacheMiddleware(cache, options = {}) {
    return async (request, next) => {
        // Only cache GET requests by default
        if (request.method !== 'GET') {
            return next();
        }
        const key = createCacheKey(request, options);
        // Try to get from cache
        const { value, stale, hit } = await cache.get(key);
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
const DEFAULT_TTL_BY_TYPE = {
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
export function createAssetCache(cache, options = {}) {
    const maxAssetSize = options.maxAssetSize || 5 * 1024 * 1024; // 5MB
    const ttlByType = { ...DEFAULT_TTL_BY_TYPE, ...options.ttlByType };
    const getTTL = (contentType) => {
        for (const [type, ttl] of Object.entries(ttlByType)) {
            if (contentType.startsWith(type)) {
                return ttl;
            }
        }
        return 3600; // Default 1 hour
    };
    return {
        async get(url) {
            const { value } = await cache.get(`asset:${url}`);
            return value ?? null;
        },
        async set(url, body, contentType) {
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
        middleware(request, next) {
            return next(); // Placeholder - implement as needed
        },
    };
}
// ============================================================================
// Singleton Cache Instance
// ============================================================================
let defaultCache = null;
/**
 * Get or create the default cache instance
 */
export function getDefaultCache(config) {
    if (!defaultCache) {
        defaultCache = new EdgeCache(config);
    }
    return defaultCache;
}
/**
 * Reset the default cache (useful for testing)
 */
export function resetDefaultCache() {
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
//# sourceMappingURL=cache.js.map