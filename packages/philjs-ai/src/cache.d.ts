/**
 * PhilJS AI - Prompt Caching Layer
 *
 * High-performance caching for AI completions with multiple storage backends.
 * Reduces API costs and latency for repeated or similar prompts.
 */
import type { AIProvider, CompletionOptions } from './types.js';
export interface CacheConfig {
    /** Cache storage backend */
    storage: CacheStorage;
    /** Default TTL in milliseconds (default: 1 hour) */
    ttl?: number;
    /** Maximum cache size in entries (default: 1000) */
    maxSize?: number;
    /** Enable semantic similarity matching (requires embeddings) */
    semanticMatching?: boolean;
    /** Similarity threshold for semantic matching (0-1, default: 0.95) */
    similarityThreshold?: number;
    /** Provider for generating embeddings (required for semantic matching) */
    embeddingProvider?: AIProvider;
}
export interface CacheEntry {
    key: string;
    value: string;
    createdAt: number;
    expiresAt: number;
    hits: number;
    metadata?: {
        model?: string;
        promptTokens?: number;
        completionTokens?: number;
        cost?: number;
    };
    embedding?: number[];
}
export interface CacheStats {
    hits: number;
    misses: number;
    hitRate: number;
    size: number;
    savedCost: number;
    savedTokens: number;
}
export interface CacheStorage {
    get(key: string): Promise<CacheEntry | undefined>;
    set(key: string, entry: CacheEntry): Promise<void>;
    delete(key: string): Promise<boolean>;
    clear(): Promise<void>;
    keys(): Promise<string[]>;
    size(): Promise<number>;
    /** Optional: find similar entries by embedding */
    findSimilar?(embedding: number[], threshold: number): Promise<CacheEntry[]>;
}
export declare class MemoryCacheStorage implements CacheStorage {
    private cache;
    private maxSize;
    constructor(maxSize?: number);
    get(key: string): Promise<CacheEntry | undefined>;
    set(key: string, entry: CacheEntry): Promise<void>;
    delete(key: string): Promise<boolean>;
    clear(): Promise<void>;
    keys(): Promise<string[]>;
    size(): Promise<number>;
    findSimilar(embedding: number[], threshold: number): Promise<CacheEntry[]>;
}
export interface RedisClient {
    get(key: string): Promise<string | null>;
    set(key: string, value: string, options?: {
        EX?: number;
    }): Promise<unknown>;
    del(key: string): Promise<number>;
    keys(pattern: string): Promise<string[]>;
    flushdb(): Promise<unknown>;
    dbsize(): Promise<number>;
}
export declare class RedisCacheStorage implements CacheStorage {
    private client;
    private prefix;
    constructor(client: RedisClient, prefix?: string);
    private prefixKey;
    get(key: string): Promise<CacheEntry | undefined>;
    set(key: string, entry: CacheEntry): Promise<void>;
    delete(key: string): Promise<boolean>;
    clear(): Promise<void>;
    keys(): Promise<string[]>;
    size(): Promise<number>;
}
export declare class CachedAIProvider implements AIProvider {
    name: string;
    private provider;
    private storage;
    private ttl;
    private semanticMatching;
    private similarityThreshold;
    private embeddingProvider?;
    private stats;
    constructor(provider: AIProvider, config: CacheConfig);
    /**
     * Generate a cache key from prompt and options
     */
    private generateKey;
    /**
     * Try to find a cached response
     */
    private findCached;
    generateCompletion(prompt: string, options?: CompletionOptions): Promise<string>;
    generateStreamCompletion(prompt: string, options?: CompletionOptions): AsyncIterableIterator<string>;
    private updateHitRate;
    /**
     * Get cache statistics
     */
    getStats(): Promise<CacheStats>;
    /**
     * Clear the cache
     */
    clearCache(): Promise<void>;
    /**
     * Invalidate a specific prompt
     */
    invalidate(prompt: string, options?: CompletionOptions): Promise<boolean>;
    /**
     * Get the underlying provider
     */
    getProvider(): AIProvider;
}
/**
 * Create a cached AI provider
 *
 * @example
 * ```typescript
 * const cachedProvider = createCachedProvider(anthropicProvider, {
 *   storage: new MemoryCacheStorage(),
 *   ttl: 30 * 60 * 1000, // 30 minutes
 * });
 *
 * // First call hits the API
 * const result1 = await cachedProvider.generateCompletion('Hello');
 *
 * // Second call returns cached response
 * const result2 = await cachedProvider.generateCompletion('Hello');
 *
 * // Check stats
 * const stats = await cachedProvider.getStats();
 * console.log(`Hit rate: ${(stats.hitRate * 100).toFixed(1)}%`);
 * ```
 */
export declare function createCachedProvider(provider: AIProvider, config: CacheConfig): CachedAIProvider;
/**
 * Create in-memory cache storage
 */
export declare function createMemoryCache(maxSize?: number): MemoryCacheStorage;
/**
 * Create Redis cache storage
 */
export declare function createRedisCache(client: RedisClient, prefix?: string): RedisCacheStorage;
/**
 * Prompt cache decorator for functions
 *
 * @example
 * ```typescript
 * const summarize = withCache(
 *   async (text: string) => provider.generateCompletion(`Summarize: ${text}`),
 *   { storage: new MemoryCacheStorage() }
 * );
 * ```
 */
export declare function withCache<T extends (...args: unknown[]) => Promise<string>>(fn: T, config: Omit<CacheConfig, 'storage'> & {
    storage: CacheStorage;
}): T;
//# sourceMappingURL=cache.d.ts.map