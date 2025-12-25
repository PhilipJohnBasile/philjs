/**
 * Smart Edge Caching for PhilJS
 *
 * ML-based cache optimization with:
 * - Predictive cache warming
 * - Adaptive TTL based on access patterns
 * - Cache tiering (hot/warm/cold)
 * - Automatic cache invalidation
 */

export interface CacheEntry<T = unknown> {
  key: string;
  value: T;
  size: number;
  createdAt: number;
  lastAccessed: number;
  accessCount: number;
  ttl: number;
  tier: 'hot' | 'warm' | 'cold';
  tags: string[];
  metadata?: Record<string, unknown>;
}

export interface CacheConfig {
  maxSize: number;
  defaultTTL: number;
  hotTierMaxSize: number;
  warmTierMaxSize: number;
  adaptiveTTL: boolean;
  predictiveWarming: boolean;
  staleWhileRevalidate: number;
}

export interface CacheStats {
  hits: number;
  misses: number;
  hitRate: number;
  size: number;
  itemCount: number;
  tierDistribution: { hot: number; warm: number; cold: number };
  avgTTL: number;
  evictions: number;
}

export interface AccessPattern {
  key: string;
  accessTimes: number[];
  frequency: number;
  avgInterval: number;
  predictedNextAccess: number;
}

/**
 * Smart Edge Cache with ML-based optimization
 */
export class SmartCache {
  private cache: Map<string, CacheEntry> = new Map();
  private accessPatterns: Map<string, AccessPattern> = new Map();
  private config: CacheConfig;
  private stats: CacheStats;
  private revalidating: Set<string> = new Set();

  constructor(config: Partial<CacheConfig> = {}) {
    this.config = {
      maxSize: config.maxSize || 100 * 1024 * 1024, // 100MB
      defaultTTL: config.defaultTTL || 300000, // 5 minutes
      hotTierMaxSize: config.hotTierMaxSize || 20 * 1024 * 1024, // 20MB
      warmTierMaxSize: config.warmTierMaxSize || 30 * 1024 * 1024, // 30MB
      adaptiveTTL: config.adaptiveTTL ?? true,
      predictiveWarming: config.predictiveWarming ?? true,
      staleWhileRevalidate: config.staleWhileRevalidate || 60000, // 1 minute
    };

    this.stats = {
      hits: 0,
      misses: 0,
      hitRate: 0,
      size: 0,
      itemCount: 0,
      tierDistribution: { hot: 0, warm: 0, cold: 0 },
      avgTTL: 0,
      evictions: 0,
    };
  }

  /**
   * Get a value from cache
   */
  async get<T>(
    key: string,
    fetcher?: () => Promise<T>,
    options?: { ttl?: number; tags?: string[] }
  ): Promise<T | null> {
    const entry = this.cache.get(key);
    const now = Date.now();

    if (entry) {
      // Record access for pattern learning
      this.recordAccess(key);

      const isExpired = now > entry.createdAt + entry.ttl;
      const isStale = isExpired && now < entry.createdAt + entry.ttl + this.config.staleWhileRevalidate;

      if (!isExpired) {
        // Fresh cache hit
        this.stats.hits++;
        this.updateHitRate();
        entry.lastAccessed = now;
        entry.accessCount++;
        this.updateTier(entry);
        return entry.value as T;
      }

      if (isStale && fetcher && !this.revalidating.has(key)) {
        // Stale-while-revalidate: return stale and refresh in background
        this.stats.hits++;
        this.updateHitRate();
        this.revalidateInBackground(key, fetcher, options);
        return entry.value as T;
      }
    }

    // Cache miss
    this.stats.misses++;
    this.updateHitRate();

    if (fetcher) {
      const value = await fetcher();
      this.set(key, value, options);
      return value;
    }

    return null;
  }

  /**
   * Set a value in cache
   */
  set<T>(key: string, value: T, options?: { ttl?: number; tags?: string[] }): void {
    const size = this.estimateSize(value);
    const ttl = options?.ttl || this.calculateAdaptiveTTL(key);

    // Evict if necessary
    this.evictIfNeeded(size);

    const entry: CacheEntry<T> = {
      key,
      value,
      size,
      createdAt: Date.now(),
      lastAccessed: Date.now(),
      accessCount: 1,
      ttl,
      tier: 'cold',
      tags: options?.tags || [],
    };

    this.cache.set(key, entry);
    this.stats.size += size;
    this.stats.itemCount++;

    // Initialize access pattern
    if (!this.accessPatterns.has(key)) {
      this.accessPatterns.set(key, {
        key,
        accessTimes: [Date.now()],
        frequency: 0,
        avgInterval: 0,
        predictedNextAccess: 0,
      });
    }

    this.updateTierDistribution();
    this.updateAvgTTL();
  }

  /**
   * Delete a value from cache
   */
  delete(key: string): boolean {
    const entry = this.cache.get(key);
    if (entry) {
      this.stats.size -= entry.size;
      this.stats.itemCount--;
      this.cache.delete(key);
      this.updateTierDistribution();
      return true;
    }
    return false;
  }

  /**
   * Invalidate by tags
   */
  invalidateByTags(tags: string[]): number {
    const tagSet = new Set(tags);
    let count = 0;

    for (const [key, entry] of this.cache) {
      if (entry.tags.some(t => tagSet.has(t))) {
        this.delete(key);
        count++;
      }
    }

    return count;
  }

  /**
   * Clear all cache
   */
  clear(): void {
    this.cache.clear();
    this.stats.size = 0;
    this.stats.itemCount = 0;
    this.stats.tierDistribution = { hot: 0, warm: 0, cold: 0 };
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    return { ...this.stats };
  }

  /**
   * Get predicted cache entries to warm
   */
  getPredictedWarmingList(): string[] {
    if (!this.config.predictiveWarming) return [];

    const now = Date.now();
    const predictions: Array<{ key: string; score: number }> = [];

    for (const pattern of this.accessPatterns.values()) {
      if (pattern.predictedNextAccess > 0 && pattern.predictedNextAccess <= now + 60000) {
        // Predicted to be accessed in next minute
        const score = pattern.frequency / Math.max(1, pattern.predictedNextAccess - now);
        predictions.push({ key: pattern.key, score });
      }
    }

    return predictions
      .sort((a, b) => b.score - a.score)
      .slice(0, 10)
      .map(p => p.key);
  }

  /**
   * Warm cache with predicted entries
   */
  async warmPredicted(fetcher: (key: string) => Promise<unknown>): Promise<void> {
    const keys = this.getPredictedWarmingList();

    await Promise.all(
      keys.map(async key => {
        if (!this.cache.has(key)) {
          try {
            const value = await fetcher(key);
            this.set(key, value);
          } catch {
            // Warming failure is not critical
          }
        }
      })
    );
  }

  /**
   * Calculate adaptive TTL based on access patterns
   */
  private calculateAdaptiveTTL(key: string): number {
    if (!this.config.adaptiveTTL) {
      return this.config.defaultTTL;
    }

    const pattern = this.accessPatterns.get(key);
    if (!pattern || pattern.accessTimes.length < 3) {
      return this.config.defaultTTL;
    }

    // If accessed frequently, use shorter TTL (fresher data)
    // If accessed rarely, use longer TTL (reduce fetches)
    const avgInterval = pattern.avgInterval;

    if (avgInterval < 10000) {
      // Very frequent (< 10s) - short TTL
      return Math.max(5000, avgInterval * 2);
    } else if (avgInterval < 60000) {
      // Frequent (< 1min) - medium TTL
      return Math.max(30000, avgInterval);
    } else if (avgInterval < 300000) {
      // Moderate (< 5min) - default TTL
      return this.config.defaultTTL;
    } else {
      // Infrequent - longer TTL
      return Math.min(this.config.defaultTTL * 3, avgInterval);
    }
  }

  /**
   * Record access for pattern learning
   */
  private recordAccess(key: string): void {
    const now = Date.now();
    let pattern = this.accessPatterns.get(key);

    if (!pattern) {
      pattern = {
        key,
        accessTimes: [],
        frequency: 0,
        avgInterval: 0,
        predictedNextAccess: 0,
      };
      this.accessPatterns.set(key, pattern);
    }

    pattern.accessTimes.push(now);

    // Keep last 100 access times
    if (pattern.accessTimes.length > 100) {
      pattern.accessTimes = pattern.accessTimes.slice(-100);
    }

    // Calculate frequency and average interval
    if (pattern.accessTimes.length >= 2) {
      const intervals: number[] = [];
      for (let i = 1; i < pattern.accessTimes.length; i++) {
        intervals.push(pattern.accessTimes[i] - pattern.accessTimes[i - 1]);
      }

      pattern.avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
      pattern.frequency = 3600000 / pattern.avgInterval; // Accesses per hour

      // Predict next access using exponential smoothing
      const alpha = 0.3;
      const lastInterval = intervals[intervals.length - 1];
      const smoothedInterval = alpha * lastInterval + (1 - alpha) * pattern.avgInterval;
      pattern.predictedNextAccess = now + smoothedInterval;
    }
  }

  /**
   * Update cache tier based on access patterns
   */
  private updateTier(entry: CacheEntry): void {
    const pattern = this.accessPatterns.get(entry.key);
    if (!pattern) return;

    // Hot: > 10 accesses/hour, accessed in last 5 minutes
    // Warm: > 1 access/hour, accessed in last 30 minutes
    // Cold: everything else

    const now = Date.now();
    const recency = now - entry.lastAccessed;

    if (pattern.frequency > 10 && recency < 300000) {
      entry.tier = 'hot';
    } else if (pattern.frequency > 1 && recency < 1800000) {
      entry.tier = 'warm';
    } else {
      entry.tier = 'cold';
    }

    this.updateTierDistribution();
  }

  /**
   * Update tier distribution stats
   */
  private updateTierDistribution(): void {
    const distribution = { hot: 0, warm: 0, cold: 0 };

    for (const entry of this.cache.values()) {
      distribution[entry.tier] += entry.size;
    }

    this.stats.tierDistribution = distribution;
  }

  /**
   * Update average TTL stats
   */
  private updateAvgTTL(): void {
    if (this.cache.size === 0) {
      this.stats.avgTTL = 0;
      return;
    }

    let totalTTL = 0;
    for (const entry of this.cache.values()) {
      totalTTL += entry.ttl;
    }
    this.stats.avgTTL = totalTTL / this.cache.size;
  }

  /**
   * Update hit rate stats
   */
  private updateHitRate(): void {
    const total = this.stats.hits + this.stats.misses;
    this.stats.hitRate = total > 0 ? this.stats.hits / total : 0;
  }

  /**
   * Revalidate cache entry in background
   */
  private async revalidateInBackground<T>(
    key: string,
    fetcher: () => Promise<T>,
    options?: { ttl?: number; tags?: string[] }
  ): Promise<void> {
    this.revalidating.add(key);

    try {
      const value = await fetcher();
      this.set(key, value, options);
    } catch (error) {
      console.warn(`Background revalidation failed for ${key}:`, error);
    } finally {
      this.revalidating.delete(key);
    }
  }

  /**
   * Evict entries if cache is too large
   */
  private evictIfNeeded(newSize: number): void {
    while (this.stats.size + newSize > this.config.maxSize && this.cache.size > 0) {
      // Evict using tiered LRU:
      // 1. First evict cold entries
      // 2. Then warm entries
      // 3. Finally hot entries

      let evicted = false;

      // Try to evict from cold tier
      for (const entry of this.cache.values()) {
        if (entry.tier === 'cold') {
          this.delete(entry.key);
          this.stats.evictions++;
          evicted = true;
          break;
        }
      }

      if (evicted) continue;

      // Try to evict from warm tier
      for (const entry of this.cache.values()) {
        if (entry.tier === 'warm') {
          this.delete(entry.key);
          this.stats.evictions++;
          evicted = true;
          break;
        }
      }

      if (evicted) continue;

      // Evict LRU from hot tier
      let oldest: CacheEntry | null = null;
      for (const entry of this.cache.values()) {
        if (!oldest || entry.lastAccessed < oldest.lastAccessed) {
          oldest = entry;
        }
      }

      if (oldest) {
        this.delete(oldest.key);
        this.stats.evictions++;
      } else {
        break;
      }
    }
  }

  /**
   * Estimate memory size of value
   */
  private estimateSize(value: unknown): number {
    try {
      return JSON.stringify(value).length * 2;
    } catch {
      return 1024;
    }
  }
}

/**
 * Create a smart cache instance
 */
export function createSmartCache(config?: Partial<CacheConfig>): SmartCache {
  return new SmartCache(config);
}

/**
 * Cache decorator for functions
 */
export function cached<T extends (...args: unknown[]) => Promise<unknown>>(
  cache: SmartCache,
  keyFn: (...args: Parameters<T>) => string,
  options?: { ttl?: number; tags?: string[] }
) {
  return function decorator(fn: T): T {
    return (async (...args: Parameters<T>) => {
      const key = keyFn(...args);
      return cache.get(key, () => fn(...args), options);
    }) as T;
  };
}
