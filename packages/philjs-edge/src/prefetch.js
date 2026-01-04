/**
 * Edge Prefetching for PhilJS
 *
 * Intelligent data prefetching at the edge based on:
 * - User navigation patterns
 * - ML-based prediction
 * - Time-based patterns
 * - Geographic patterns
 */
/**
 * Edge Prefetch Manager
 */
export class EdgePrefetcher {
    cache = new Map();
    navigationPatterns = new Map();
    timePatterns = [];
    geoPatterns = [];
    accessLog = [];
    config;
    constructor(config = {}) {
        this.config = {
            maxCacheSize: config.maxCacheSize || 50 * 1024 * 1024, // 50MB
            defaultTTL: config.defaultTTL || 300000, // 5 minutes
            prefetchThreshold: config.prefetchThreshold || 0.3, // 30% probability
            enableMLPrediction: config.enableMLPrediction ?? true,
            enableGeoPrefetch: config.enableGeoPrefetch ?? true,
            enableTimePrefetch: config.enableTimePrefetch ?? true,
        };
    }
    /**
     * Get prefetch predictions for current context
     */
    getPredictions(currentPath, context) {
        const predictions = [];
        // Navigation-based predictions
        const navPatterns = this.navigationPatterns.get(currentPath) || [];
        for (const pattern of navPatterns) {
            if (pattern.probability >= this.config.prefetchThreshold) {
                predictions.push({
                    path: pattern.to,
                    probability: pattern.probability,
                    reason: 'navigation',
                });
            }
        }
        // Time-based predictions
        if (this.config.enableTimePrefetch) {
            const now = new Date();
            const hour = now.getHours();
            const dayOfWeek = now.getDay();
            for (const pattern of this.timePatterns) {
                if (pattern.hour === hour && pattern.dayOfWeek === dayOfWeek) {
                    for (const path of pattern.paths) {
                        if (pattern.probability >= this.config.prefetchThreshold) {
                            predictions.push({
                                path,
                                probability: pattern.probability,
                                reason: 'time',
                            });
                        }
                    }
                }
            }
        }
        // Geo-based predictions
        if (this.config.enableGeoPrefetch && context?.geo) {
            for (const pattern of this.geoPatterns) {
                if (pattern.country === context.geo || pattern.region === context.geo) {
                    for (const path of pattern.paths) {
                        if (pattern.probability >= this.config.prefetchThreshold) {
                            predictions.push({
                                path,
                                probability: pattern.probability,
                                reason: 'geo',
                            });
                        }
                    }
                }
            }
        }
        // ML-based predictions (simple Markov chain)
        if (this.config.enableMLPrediction && context?.sessionPaths) {
            const mlPredictions = this.predictFromSequence(context.sessionPaths);
            predictions.push(...mlPredictions);
        }
        // Deduplicate and sort by probability
        const seen = new Set();
        return predictions
            .filter(p => {
            if (seen.has(p.path))
                return false;
            seen.add(p.path);
            return true;
        })
            .sort((a, b) => b.probability - a.probability)
            .slice(0, 10);
    }
    /**
     * Record a navigation event
     */
    recordNavigation(from, to, geo) {
        // Update access log
        const logEntry = { path: to, timestamp: Date.now() };
        if (geo !== undefined) {
            logEntry.geo = geo;
        }
        this.accessLog.push(logEntry);
        if (this.accessLog.length > 10000) {
            this.accessLog = this.accessLog.slice(-5000);
        }
        // Update navigation patterns
        const patterns = this.navigationPatterns.get(from) || [];
        const existing = patterns.find(p => p.to === to);
        if (existing) {
            const timeDiff = Date.now() - (this.accessLog[this.accessLog.length - 2]?.timestamp || Date.now());
            existing.count++;
            existing.avgTimeBetween = (existing.avgTimeBetween * (existing.count - 1) + timeDiff) / existing.count;
        }
        else {
            patterns.push({
                from,
                to,
                count: 1,
                avgTimeBetween: 0,
                probability: 0,
            });
        }
        // Recalculate probabilities
        const totalCount = patterns.reduce((sum, p) => sum + p.count, 0);
        for (const pattern of patterns) {
            pattern.probability = pattern.count / totalCount;
        }
        this.navigationPatterns.set(from, patterns);
    }
    /**
     * Prefetch data for predicted paths
     */
    async prefetch(paths, fetcher) {
        const promises = paths.map(async (path) => {
            if (this.cache.has(path)) {
                const item = this.cache.get(path);
                if (item.expiresAt > Date.now()) {
                    return; // Already cached and valid
                }
            }
            try {
                const data = await fetcher(path);
                this.set(path, data);
            }
            catch (error) {
                console.warn(`Prefetch failed for ${path}:`, error);
            }
        });
        await Promise.all(promises);
    }
    /**
     * Get cached data
     */
    get(key) {
        const item = this.cache.get(key);
        if (!item)
            return null;
        if (item.expiresAt < Date.now()) {
            this.cache.delete(key);
            return null;
        }
        item.hitCount++;
        return item.data;
    }
    /**
     * Set cached data
     */
    set(key, data, ttl) {
        const size = this.estimateSize(data);
        // Evict if necessary
        this.evictIfNeeded(size);
        this.cache.set(key, {
            key,
            data,
            fetchedAt: Date.now(),
            expiresAt: Date.now() + (ttl || this.config.defaultTTL),
            hitCount: 0,
            size,
            priority: this.calculatePriority(key),
        });
    }
    /**
     * Predict from navigation sequence using Markov chain
     */
    predictFromSequence(paths) {
        if (paths.length === 0)
            return [];
        const predictions = [];
        const lastPath = paths[paths.length - 1];
        const patterns = this.navigationPatterns.get(lastPath) || [];
        for (const pattern of patterns) {
            if (pattern.probability >= this.config.prefetchThreshold * 0.5) {
                predictions.push({
                    path: pattern.to,
                    probability: pattern.probability,
                    reason: 'ml',
                });
            }
        }
        // Second-order Markov (look at last 2 paths)
        if (paths.length >= 2) {
            const secondLast = paths[paths.length - 2];
            const secondPatterns = this.navigationPatterns.get(secondLast) || [];
            for (const pattern of secondPatterns) {
                if (pattern.to === lastPath) {
                    // Find what typically comes after this sequence
                    const nextPatterns = this.navigationPatterns.get(lastPath) || [];
                    for (const next of nextPatterns) {
                        const existing = predictions.find(p => p.path === next.to);
                        if (existing) {
                            // Boost probability if confirmed by second-order
                            existing.probability = Math.min(1, existing.probability * 1.3);
                        }
                    }
                }
            }
        }
        return predictions;
    }
    /**
     * Calculate priority for cache eviction
     */
    calculatePriority(key) {
        // Higher priority for more frequently navigated paths
        let maxProbability = 0;
        for (const patterns of this.navigationPatterns.values()) {
            const pattern = patterns.find(p => p.to === key);
            if (pattern && pattern.probability > maxProbability) {
                maxProbability = pattern.probability;
            }
        }
        return maxProbability;
    }
    /**
     * Estimate memory size of data
     */
    estimateSize(data) {
        try {
            return JSON.stringify(data).length * 2; // Rough estimate
        }
        catch {
            return 1024; // Default 1KB for non-serializable
        }
    }
    /**
     * Evict items if cache is too large
     */
    evictIfNeeded(newSize) {
        let currentSize = Array.from(this.cache.values()).reduce((sum, item) => sum + item.size, 0);
        while (currentSize + newSize > this.config.maxCacheSize && this.cache.size > 0) {
            // Find lowest priority expired or lowest hit count item
            let toEvict = null;
            let lowestScore = Infinity;
            for (const [key, item] of this.cache) {
                if (item.expiresAt < Date.now()) {
                    toEvict = key;
                    break;
                }
                const score = item.hitCount * item.priority;
                if (score < lowestScore) {
                    lowestScore = score;
                    toEvict = key;
                }
            }
            if (toEvict) {
                const item = this.cache.get(toEvict);
                if (item)
                    currentSize -= item.size;
                this.cache.delete(toEvict);
            }
            else {
                break;
            }
        }
    }
    /**
     * Add time pattern
     */
    addTimePattern(pattern) {
        this.timePatterns.push(pattern);
    }
    /**
     * Add geo pattern
     */
    addGeoPattern(pattern) {
        this.geoPatterns.push(pattern);
    }
    /**
     * Learn patterns from access log
     */
    learnPatterns() {
        // Learn time patterns
        const timeGroups = new Map();
        for (const log of this.accessLog) {
            const date = new Date(log.timestamp);
            const key = `${date.getDay()}-${date.getHours()}`;
            const group = timeGroups.get(key) || { paths: [], count: 0 };
            group.paths.push(log.path);
            group.count++;
            timeGroups.set(key, group);
        }
        this.timePatterns = [];
        for (const [key, group] of timeGroups) {
            const [dayOfWeek, hour] = key.split('-').map(Number);
            const pathCounts = new Map();
            for (const path of group.paths) {
                pathCounts.set(path, (pathCounts.get(path) || 0) + 1);
            }
            const topPaths = Array.from(pathCounts.entries())
                .sort((a, b) => b[1] - a[1])
                .slice(0, 5)
                .map(([path]) => path);
            this.timePatterns.push({
                hour,
                dayOfWeek,
                paths: topPaths,
                probability: group.count / this.accessLog.length,
            });
        }
        // Learn geo patterns
        if (this.config.enableGeoPrefetch) {
            const geoGroups = new Map();
            for (const log of this.accessLog) {
                if (!log.geo)
                    continue;
                const group = geoGroups.get(log.geo) || { paths: [], count: 0 };
                group.paths.push(log.path);
                group.count++;
                geoGroups.set(log.geo, group);
            }
            this.geoPatterns = [];
            for (const [geo, group] of geoGroups) {
                const pathCounts = new Map();
                for (const path of group.paths) {
                    pathCounts.set(path, (pathCounts.get(path) || 0) + 1);
                }
                const topPaths = Array.from(pathCounts.entries())
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 5)
                    .map(([path]) => path);
                this.geoPatterns.push({
                    country: geo,
                    paths: topPaths,
                    probability: group.count / this.accessLog.length,
                });
            }
        }
    }
    /**
     * Get cache statistics
     */
    getStats() {
        const items = Array.from(this.cache.values());
        const totalHits = items.reduce((sum, item) => sum + item.hitCount, 0);
        const totalSize = items.reduce((sum, item) => sum + item.size, 0);
        return {
            cacheSize: totalSize,
            itemCount: items.length,
            hitRate: totalHits / Math.max(1, items.length),
            patternCount: this.navigationPatterns.size,
        };
    }
    /**
     * Clear cache
     */
    clear() {
        this.cache.clear();
    }
    /**
     * Export patterns for persistence
     */
    exportPatterns() {
        return {
            navigation: Array.from(this.navigationPatterns.entries()),
            time: this.timePatterns,
            geo: this.geoPatterns,
        };
    }
    /**
     * Import patterns from persistence
     */
    importPatterns(data) {
        this.navigationPatterns = new Map(data.navigation);
        this.timePatterns = data.time;
        this.geoPatterns = data.geo;
    }
}
/**
 * Create an edge prefetcher instance
 */
export function createEdgePrefetcher(config) {
    return new EdgePrefetcher(config);
}
/**
 * Link prefetch hint generator
 */
export function generatePrefetchHints(predictions) {
    return predictions
        .filter(p => p.probability >= 0.5)
        .map(p => `<link rel="prefetch" href="${p.path}">`)
        .join('\n');
}
/**
 * Preload header generator for HTTP/2 server push
 */
export function generatePreloadHeaders(predictions) {
    return predictions
        .filter(p => p.probability >= 0.7)
        .map(p => `<${p.path}>; rel=preload`)
        .join(', ');
}
//# sourceMappingURL=prefetch.js.map