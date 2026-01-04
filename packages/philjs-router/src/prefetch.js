/**
 * Qwik-style Speculative Prefetching Manager
 *
 * Provides intelligent prefetching with:
 * - Multiple prefetch modes (hover, visible, intent, render, none)
 * - Priority queue with visible > hover > idle ordering
 * - Network-aware prefetching (Save-Data, connection speed)
 * - Concurrent request limiting
 * - Service worker integration
 * - Data + code prefetching
 */
// Priority weights for queue ordering
const PRIORITY_WEIGHTS = {
    critical: 100,
    high: 80,
    medium: 60,
    low: 40,
    idle: 20,
};
// Mode to priority mapping
const MODE_PRIORITY = {
    render: 'critical',
    visible: 'high',
    intent: 'medium',
    hover: 'low',
    none: 'idle',
};
// Connection type speeds (approximate Mbps)
const CONNECTION_SPEEDS = {
    'slow-2g': 0.05,
    '2g': 0.15,
    '3g': 1.5,
    '4g': 10,
};
/**
 * Get current network information
 */
function getNetworkInfo() {
    const nav = typeof navigator !== 'undefined' ? navigator : null;
    const connection = nav?.connection || nav?.mozConnection || nav?.webkitConnection;
    return {
        saveData: connection?.saveData || false,
        effectiveType: connection?.effectiveType || '4g',
        downlink: connection?.downlink || 10,
        rtt: connection?.rtt || 50,
    };
}
/**
 * Check if prefetching should be allowed based on network conditions
 */
function shouldPrefetch(config) {
    const network = getNetworkInfo();
    // Respect Save-Data header
    if (config.respectSaveData && network.saveData) {
        return false;
    }
    // Check connection type
    if (config.minConnectionType) {
        const minSpeed = CONNECTION_SPEEDS[config.minConnectionType] || 0;
        const currentSpeed = CONNECTION_SPEEDS[network.effectiveType] || 10;
        if (currentSpeed < minSpeed) {
            return false;
        }
    }
    return true;
}
/**
 * Prefetch Manager - Qwik-style speculative prefetching
 */
export class PrefetchManager {
    queue = [];
    queueStart = 0;
    loading = new Map();
    loaded = new Map();
    failed = new Set();
    config;
    stats = {
        queued: 0,
        loading: 0,
        loaded: 0,
        failed: 0,
        cacheHits: 0,
        cacheMisses: 0,
        networkSaved: 0,
    };
    // Route module registry for data prefetching
    routeModules = new Map();
    dataCache = new Map();
    // Service worker communication channel
    swChannel = null;
    constructor(config = {}) {
        this.config = {
            maxConcurrent: config.maxConcurrent ?? 3,
            hoverDelay: config.hoverDelay ?? 100,
            intentThreshold: config.intentThreshold ?? 0.6,
            respectSaveData: config.respectSaveData ?? true,
            minConnectionType: config.minConnectionType ?? '3g',
            useServiceWorker: config.useServiceWorker ?? true,
            cacheTTL: config.cacheTTL ?? 5 * 60 * 1000, // 5 minutes
            prefetchData: config.prefetchData ?? true,
            fetchOptions: config.fetchOptions ?? {},
        };
        this.initServiceWorkerChannel();
    }
    /**
     * Initialize service worker communication
     */
    initServiceWorkerChannel() {
        if (typeof window === 'undefined')
            return;
        if (!this.config.useServiceWorker)
            return;
        try {
            this.swChannel = new BroadcastChannel('philjs-prefetch');
            this.swChannel.onmessage = (event) => {
                this.handleServiceWorkerMessage(event.data);
            };
        }
        catch {
            // BroadcastChannel not supported
        }
    }
    /**
     * Handle messages from service worker
     */
    handleServiceWorkerMessage(message) {
        if (message.type === 'PREFETCH_COMPLETE') {
            const { url, success, cached } = message;
            if (success && cached) {
                this.stats.cacheHits++;
            }
        }
    }
    /**
     * Register a route module for data prefetching
     */
    registerRouteModule(path, module) {
        this.routeModules.set(path, module);
    }
    /**
     * Prefetch a route (code only)
     */
    prefetchRoute(url, mode = 'hover') {
        return this.prefetch(url, { mode, withData: false });
    }
    /**
     * Prefetch a route with its data loader
     */
    prefetchRouteWithData(url, options = {}) {
        const prefetchOptions = {
            mode: options.preload ? 'render' : 'intent',
            withData: true,
        };
        if (options.params !== undefined) {
            prefetchOptions.params = options.params;
        }
        return this.prefetch(url, prefetchOptions);
    }
    /**
     * Main prefetch method
     */
    async prefetch(url, options = {}) {
        const mode = options.mode ?? 'hover';
        const withData = options.withData ?? false;
        const priority = options.priority ?? MODE_PRIORITY[mode];
        // Skip if mode is 'none'
        if (mode === 'none') {
            return { url, success: false, cached: false };
        }
        // Check network conditions
        if (!shouldPrefetch(this.config)) {
            return { url, success: false, cached: false };
        }
        // Check cache first
        const cached = this.loaded.get(url);
        if (cached && Date.now() - cached.timestamp < this.config.cacheTTL) {
            this.stats.cacheHits++;
            return cached.result;
        }
        // Check if already loading
        const existing = this.loading.get(url);
        if (existing) {
            return existing;
        }
        // Check if failed recently (skip for 30 seconds)
        if (this.failed.has(url)) {
            return { url, success: false, cached: false };
        }
        // Add to queue
        const item = {
            url,
            priority,
            mode,
            timestamp: Date.now(),
            withData,
            retryCount: 0,
        };
        this.addToQueue(item);
        this.stats.queued++;
        // Process queue
        return this.processQueue(url, options.params);
    }
    /**
     * Add item to priority queue
     */
    addToQueue(item) {
        this.compactQueue();
        // Remove existing entry for same URL
        this.queue = this.queue.filter((q) => q.url !== item.url);
        // Add new item
        this.queue.push(item);
        // Sort by priority (higher weight first), then by timestamp (older first)
        this.queue.sort((a, b) => {
            const priorityDiff = PRIORITY_WEIGHTS[b.priority] - PRIORITY_WEIGHTS[a.priority];
            if (priorityDiff !== 0)
                return priorityDiff;
            return a.timestamp - b.timestamp;
        });
    }
    /**
     * Process the prefetch queue
     */
    async processQueue(targetUrl, params) {
        // Track the result for the target URL
        let targetResult;
        while (this.queueStart < this.queue.length && this.loading.size < this.config.maxConcurrent) {
            const item = this.queue[this.queueStart++];
            if (!item)
                break;
            this.stats.queued--;
            const fetchPromise = this.executePrefetch(item, params);
            this.loading.set(item.url, fetchPromise);
            this.stats.loading++;
            if (item.url === targetUrl) {
                targetResult = fetchPromise;
            }
            // Don't await - let it process in parallel
            fetchPromise.finally(() => {
                this.loading.delete(item.url);
                this.stats.loading--;
                // Continue processing queue
                this.processQueue();
            });
        }
        if (this.queueStart >= this.queue.length) {
            this.queue = [];
            this.queueStart = 0;
        }
        // If we're waiting for a specific URL
        if (targetUrl) {
            const existing = this.loading.get(targetUrl);
            if (existing) {
                return existing;
            }
            if (targetResult) {
                return targetResult;
            }
            // URL might already be loaded
            const cached = this.loaded.get(targetUrl);
            if (cached) {
                return cached.result;
            }
        }
        return { url: targetUrl || '', success: true, cached: false };
    }
    compactQueue() {
        if (this.queueStart === 0)
            return;
        this.queue = this.queue.slice(this.queueStart);
        this.queueStart = 0;
    }
    /**
     * Execute a single prefetch
     */
    async executePrefetch(item, params) {
        const startTime = performance.now();
        try {
            // Try service worker first
            if (this.config.useServiceWorker && this.swChannel) {
                this.swChannel.postMessage({
                    type: 'PREFETCH_REQUEST',
                    url: item.url,
                    priority: item.priority,
                });
            }
            // Prefetch the route code using link prefetch
            await this.prefetchCode(item.url);
            // Prefetch data if requested
            let data;
            if (item.withData && this.config.prefetchData) {
                data = await this.prefetchData(item.url, params || {});
            }
            const timing = performance.now() - startTime;
            const result = {
                url: item.url,
                success: true,
                cached: false,
                data,
                timing,
            };
            // Cache the result
            this.loaded.set(item.url, { result, timestamp: Date.now() });
            this.stats.loaded++;
            this.stats.cacheMisses++;
            return result;
        }
        catch (error) {
            const timing = performance.now() - startTime;
            // Retry logic
            if ((item.retryCount ?? 0) < 2) {
                item.retryCount = (item.retryCount ?? 0) + 1;
                // Add back to queue with lower priority
                item.priority = 'low';
                this.addToQueue(item);
                return { url: item.url, success: false, cached: false, timing };
            }
            // Mark as failed
            this.failed.add(item.url);
            this.stats.failed++;
            // Clear failed status after 30 seconds
            setTimeout(() => this.failed.delete(item.url), 30000);
            return {
                url: item.url,
                success: false,
                cached: false,
                error: error instanceof Error ? error : new Error(String(error)),
                timing,
            };
        }
    }
    /**
     * Prefetch route code using link prefetch
     */
    async prefetchCode(url) {
        if (typeof document === 'undefined')
            return;
        // Check if already prefetched
        const existingLink = document.querySelector(`link[rel="prefetch"][href="${url}"]`);
        if (existingLink)
            return;
        // Create prefetch link
        const link = document.createElement('link');
        link.rel = 'prefetch';
        link.href = url;
        link.as = 'document';
        // Add to document
        document.head.appendChild(link);
        // Also do a fetch for more control
        try {
            const response = await fetch(url, {
                method: 'GET',
                credentials: 'same-origin',
                headers: {
                    'X-Prefetch': 'true',
                },
                ...this.config.fetchOptions,
            });
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            // Estimate network savings
            const contentLength = response.headers.get('content-length');
            if (contentLength) {
                this.stats.networkSaved += parseInt(contentLength, 10);
            }
        }
        catch (error) {
            // Remove failed prefetch link
            link.remove();
            throw error;
        }
    }
    /**
     * Prefetch route data (run loader)
     */
    async prefetchData(url, params) {
        // Check data cache first
        const cached = this.dataCache.get(url);
        if (cached && Date.now() - cached.timestamp < this.config.cacheTTL) {
            return cached.data;
        }
        // Find route module
        const resolvedUrl = new URL(url, typeof window !== 'undefined' ? window.location.origin : 'http://localhost');
        const match = this.findRouteModule(resolvedUrl.pathname);
        if (!match?.module.loader) {
            return undefined;
        }
        // Execute loader
        const request = new Request(resolvedUrl.toString(), { method: 'GET' });
        const loaderParams = Object.keys(params).length > 0 ? params : match.params;
        const data = await match.module.loader({ params: loaderParams, request });
        // Cache data
        this.dataCache.set(url, { data, timestamp: Date.now() });
        return data;
    }
    /**
     * Find route module for a path
     */
    findRouteModule(pathname) {
        // Try exact match first
        const direct = this.routeModules.get(pathname);
        if (direct) {
            return { module: direct, params: {} };
        }
        // Try pattern matching
        for (const [pattern, module] of this.routeModules) {
            const params = this.matchAndExtractParams(pattern, pathname);
            if (params) {
                return { module, params };
            }
        }
        return undefined;
    }
    /**
     * Simple path pattern matching
     */
    matchPath(pattern, pathname) {
        return this.matchAndExtractParams(pattern, pathname) !== null;
    }
    matchAndExtractParams(pattern, pathname) {
        const patternParts = pattern.split('/').filter(Boolean);
        const pathParts = pathname.split('/').filter(Boolean);
        const hasCatchAll = patternParts.includes('*');
        if (!hasCatchAll && patternParts.length !== pathParts.length)
            return null;
        if (patternParts.length > pathParts.length)
            return null;
        const params = {};
        for (let i = 0; i < patternParts.length; i++) {
            const segment = patternParts[i];
            const pathSegment = pathParts[i];
            if (segment === undefined)
                continue;
            if (segment === '*') {
                params['*'] = decodeURIComponent(pathParts.slice(i).join('/'));
                return params;
            }
            if (segment.startsWith(':')) {
                params[segment.slice(1)] = decodeURIComponent(pathSegment ?? '');
                continue;
            }
            if (segment !== pathSegment) {
                return null;
            }
        }
        if (patternParts.length !== pathParts.length && !hasCatchAll) {
            return null;
        }
        return params;
    }
    /**
     * Cancel a pending prefetch
     */
    cancel(url) {
        this.compactQueue();
        const before = this.queue.length;
        this.queue = this.queue.filter((item) => item.url !== url);
        const removed = before - this.queue.length;
        if (removed > 0) {
            this.stats.queued = Math.max(0, this.stats.queued - removed);
        }
    }
    /**
     * Cancel all pending prefetches
     */
    cancelAll() {
        this.queue = [];
        this.queueStart = 0;
        this.stats.queued = 0;
    }
    /**
     * Get prefetch statistics
     */
    getStats() {
        return { ...this.stats };
    }
    /**
     * Check if a URL is prefetched
     */
    isPrefetched(url) {
        const cached = this.loaded.get(url);
        return cached !== undefined && Date.now() - cached.timestamp < this.config.cacheTTL;
    }
    /**
     * Check if a URL is currently loading
     */
    isLoading(url) {
        return this.loading.has(url);
    }
    /**
     * Get cached data for a URL
     */
    getCachedData(url) {
        const cached = this.dataCache.get(url);
        if (cached && Date.now() - cached.timestamp < this.config.cacheTTL) {
            return cached.data;
        }
        return undefined;
    }
    /**
     * Clear all caches
     */
    clear() {
        this.queue = [];
        this.queueStart = 0;
        this.loading.clear();
        this.loaded.clear();
        this.failed.clear();
        this.dataCache.clear();
        this.stats = {
            queued: 0,
            loading: 0,
            loaded: 0,
            failed: 0,
            cacheHits: 0,
            cacheMisses: 0,
            networkSaved: 0,
        };
    }
    /**
     * Destroy the prefetch manager
     */
    destroy() {
        this.clear();
        this.routeModules.clear();
        this.swChannel?.close();
        this.swChannel = null;
    }
}
// ============================================================================
// Global Prefetch Manager Instance
// ============================================================================
let globalPrefetchManager = null;
/**
 * Initialize the global prefetch manager
 */
export function initPrefetchManager(config) {
    if (globalPrefetchManager) {
        globalPrefetchManager.destroy();
    }
    globalPrefetchManager = new PrefetchManager(config);
    return globalPrefetchManager;
}
/**
 * Get the global prefetch manager
 */
export function getPrefetchManager() {
    return globalPrefetchManager;
}
/**
 * Prefetch a route (convenience function)
 */
export function prefetchRoute(url, mode) {
    const manager = globalPrefetchManager || initPrefetchManager();
    return manager.prefetchRoute(url, mode);
}
/**
 * Prefetch a route with data (convenience function)
 */
export function prefetchRouteWithData(url, options) {
    const manager = globalPrefetchManager || initPrefetchManager();
    return manager.prefetchRouteWithData(url, options);
}
//# sourceMappingURL=prefetch.js.map