/**
 * Edge Caching Strategies for PPR
 *
 * Provides various caching implementations optimized for edge computing:
 * - In-memory caching with LRU eviction
 * - Redis-based distributed caching
 * - CDN integration patterns
 * - Cache invalidation strategies
 */
// ============================================================================
// LRU Cache Implementation
// ============================================================================
/**
 * LRU (Least Recently Used) cache for static shells
 */
export class LRUPPRCache {
    cache = new Map();
    maxSize;
    maxAge; // milliseconds
    hits = 0;
    misses = 0;
    constructor(options = {}) {
        this.maxSize = options.maxSize || 100;
        this.maxAge = options.maxAge || 3600000; // 1 hour default
    }
    async get(path) {
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
    async set(path, shell) {
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
    async has(path) {
        const entry = this.cache.get(path);
        if (!entry)
            return false;
        // Check expiration
        if (Date.now() - entry.accessTime > this.maxAge) {
            this.cache.delete(path);
            return false;
        }
        return true;
    }
    async invalidate(path) {
        this.cache.delete(path);
    }
    async invalidateAll() {
        this.cache.clear();
        this.hits = 0;
        this.misses = 0;
    }
    async stats() {
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
    prune() {
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
export class RedisPPRCache {
    client;
    keyPrefix;
    ttl; // seconds
    hits = 0;
    misses = 0;
    constructor(client, options = {}) {
        this.client = client;
        this.keyPrefix = options.keyPrefix || "philjs:ppr:";
        this.ttl = options.ttl || 3600; // 1 hour default
    }
    key(path) {
        return `${this.keyPrefix}${path}`;
    }
    async get(path) {
        try {
            const data = await this.client.get(this.key(path));
            if (!data) {
                this.misses++;
                return null;
            }
            const parsed = JSON.parse(data);
            // Reconstruct Map from array
            const shell = {
                ...parsed,
                boundaries: new Map(parsed.boundaries),
            };
            this.hits++;
            return shell;
        }
        catch {
            this.misses++;
            return null;
        }
    }
    async set(path, shell) {
        // Serialize Map to array for JSON
        const data = {
            ...shell,
            boundaries: Array.from(shell.boundaries.entries()),
        };
        await this.client.setex(this.key(path), this.ttl, JSON.stringify(data));
    }
    async has(path) {
        return (await this.client.exists(this.key(path))) === 1;
    }
    async invalidate(path) {
        await this.client.del(this.key(path));
    }
    async invalidateAll() {
        const keys = await this.client.keys(`${this.keyPrefix}*`);
        if (keys.length > 0) {
            await this.client.del(...keys);
        }
        this.hits = 0;
        this.misses = 0;
    }
    async stats() {
        const keys = await this.client.keys(`${this.keyPrefix}*`);
        const total = this.hits + this.misses;
        // Approximate size by sampling
        let bytes = 0;
        const sampleSize = Math.min(10, keys.length);
        for (let i = 0; i < sampleSize; i++) {
            const key = keys[i];
            if (key !== undefined) {
                const data = await this.client.get(key);
                if (data) {
                    bytes += new TextEncoder().encode(data).length;
                }
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
    async invalidatePattern(pattern) {
        const keys = await this.client.keys(this.key(pattern));
        if (keys.length > 0) {
            await this.client.del(...keys);
        }
        return keys.length;
    }
    /**
     * Refresh TTL without refetching
     */
    async touch(path) {
        return (await this.client.expire(this.key(path), this.ttl)) === 1;
    }
}
// ============================================================================
// Edge Cache Controller
// ============================================================================
/**
 * Controller for edge caching strategies
 */
export class EdgeCacheController {
    strategy;
    cache;
    staleTTL; // How long to serve stale content
    constructor(options) {
        this.strategy = options.strategy || "stale-while-revalidate";
        this.cache = options.cache;
        this.staleTTL = options.staleTTL || 60; // 60 seconds
    }
    /**
     * Get shell following the configured strategy
     */
    async get(path, fetcher) {
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
    async staleWhileRevalidate(path, fetcher) {
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
    async cacheFirst(path, fetcher) {
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
    async networkFirst(path, fetcher) {
        try {
            const shell = await fetcher();
            await this.cache.set(path, shell);
            return { shell, stale: false, revalidating: false };
        }
        catch {
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
    async cacheOnly(path) {
        const cached = await this.cache.get(path);
        if (!cached) {
            throw new Error(`No cache entry for ${path}`);
        }
        return { shell: cached, stale: false, revalidating: false };
    }
    /**
     * Revalidate in background (non-blocking)
     */
    revalidateInBackground(path, fetcher) {
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
    async invalidate(path) {
        await this.cache.invalidate(path);
    }
    /**
     * Warm cache with multiple paths
     */
    async warmCache(paths, fetcher, concurrency = 5) {
        let success = 0;
        let failed = 0;
        const queue = [...paths];
        const inFlight = [];
        while (queue.length > 0 || inFlight.length > 0) {
            while (queue.length > 0 && inFlight.length < concurrency) {
                const path = queue.shift();
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
                    if (index !== -1)
                        inFlight.splice(index, 1);
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
export function generateCacheHeaders(shell, options = {}) {
    const headers = {};
    const maxAge = options.maxAge || 3600;
    const swr = options.staleWhileRevalidate || 60;
    const sie = options.staleIfError || 3600;
    const isPrivate = options.private || false;
    // Base cache control
    const directives = [];
    if (isPrivate) {
        directives.push("private");
    }
    else {
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
export function parseConditionalRequest(request) {
    const result = {};
    const ifNoneMatch = request.headers.get("If-None-Match");
    if (ifNoneMatch) {
        result.ifNoneMatch = ifNoneMatch;
    }
    const ifModifiedSince = request.headers.get("If-Modified-Since");
    if (ifModifiedSince) {
        result.ifModifiedSince = new Date(ifModifiedSince);
    }
    return result;
}
/**
 * Check if a 304 Not Modified response should be sent
 */
export function shouldReturn304(shell, conditional) {
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
export function create304Response(shell) {
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
    tags = new Map(); // tag -> paths
    pathTags = new Map(); // path -> tags
    /**
     * Associate tags with a path
     */
    tag(path, tags) {
        // Store path -> tags
        if (!this.pathTags.has(path)) {
            this.pathTags.set(path, new Set());
        }
        for (const t of tags) {
            this.pathTags.get(path).add(t);
        }
        // Store tag -> paths
        for (const t of tags) {
            if (!this.tags.has(t)) {
                this.tags.set(t, new Set());
            }
            this.tags.get(t).add(path);
        }
    }
    /**
     * Get all paths for a tag
     */
    getPathsForTag(tag) {
        return Array.from(this.tags.get(tag) || []);
    }
    /**
     * Get all tags for a path
     */
    getTagsForPath(path) {
        return Array.from(this.pathTags.get(path) || []);
    }
    /**
     * Invalidate all paths with a tag
     */
    async invalidateTag(tag, cache) {
        const paths = this.getPathsForTag(tag);
        for (const path of paths) {
            await cache.invalidate(path);
        }
        return paths.length;
    }
    /**
     * Remove a path from tracking
     */
    remove(path) {
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
    clear() {
        this.tags.clear();
        this.pathTags.clear();
    }
}
//# sourceMappingURL=ppr-cache.js.map