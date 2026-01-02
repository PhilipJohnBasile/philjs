/**
 * PhilJS AI - Prompt Caching Layer
 *
 * High-performance caching for AI completions with multiple storage backends.
 * Reduces API costs and latency for repeated or similar prompts.
 */

import { createHash } from 'crypto';
import type { AIProvider, CompletionOptions } from './types.js';

// ============================================================================
// Types
// ============================================================================

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

// ============================================================================
// In-Memory Cache Storage
// ============================================================================

export class MemoryCacheStorage implements CacheStorage {
  private cache = new Map<string, CacheEntry>();
  private maxSize: number;

  constructor(maxSize = 1000) {
    this.maxSize = maxSize;
  }

  async get(key: string): Promise<CacheEntry | undefined> {
    const entry = this.cache.get(key);
    if (!entry) return undefined;

    // Check expiration
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return undefined;
    }

    // Update hit count
    entry.hits++;
    return entry;
  }

  async set(key: string, entry: CacheEntry): Promise<void> {
    // Evict oldest entries if at capacity
    if (this.cache.size >= this.maxSize) {
      const oldest = [...this.cache.entries()]
        .sort((a, b) => a[1].createdAt - b[1].createdAt)
        .slice(0, Math.floor(this.maxSize * 0.2));

      for (const [k] of oldest) {
        this.cache.delete(k);
      }
    }

    this.cache.set(key, entry);
  }

  async delete(key: string): Promise<boolean> {
    return this.cache.delete(key);
  }

  async clear(): Promise<void> {
    this.cache.clear();
  }

  async keys(): Promise<string[]> {
    return [...this.cache.keys()];
  }

  async size(): Promise<number> {
    return this.cache.size;
  }

  async findSimilar(embedding: number[], threshold: number): Promise<CacheEntry[]> {
    const results: Array<{ entry: CacheEntry; similarity: number }> = [];

    for (const entry of this.cache.values()) {
      if (!entry.embedding) continue;
      if (Date.now() > entry.expiresAt) continue;

      const similarity = cosineSimilarity(embedding, entry.embedding);
      if (similarity >= threshold) {
        results.push({ entry, similarity });
      }
    }

    return results
      .sort((a, b) => b.similarity - a.similarity)
      .map(r => r.entry);
  }
}

// ============================================================================
// Redis Cache Storage
// ============================================================================

export interface RedisClient {
  get(key: string): Promise<string | null>;
  set(key: string, value: string, options?: { EX?: number }): Promise<unknown>;
  del(key: string): Promise<number>;
  keys(pattern: string): Promise<string[]>;
  flushdb(): Promise<unknown>;
  dbsize(): Promise<number>;
}

export class RedisCacheStorage implements CacheStorage {
  private client: RedisClient;
  private prefix: string;

  constructor(client: RedisClient, prefix = 'philjs:ai:cache:') {
    this.client = client;
    this.prefix = prefix;
  }

  private prefixKey(key: string): string {
    return `${this.prefix}${key}`;
  }

  async get(key: string): Promise<CacheEntry | undefined> {
    const data = await this.client.get(this.prefixKey(key));
    if (!data) return undefined;

    const entry = JSON.parse(data) as CacheEntry;
    entry.hits++;
    await this.client.set(this.prefixKey(key), JSON.stringify(entry));
    return entry;
  }

  async set(key: string, entry: CacheEntry): Promise<void> {
    const ttlSeconds = Math.floor((entry.expiresAt - Date.now()) / 1000);
    if (ttlSeconds <= 0) return;

    await this.client.set(
      this.prefixKey(key),
      JSON.stringify(entry),
      { EX: ttlSeconds }
    );
  }

  async delete(key: string): Promise<boolean> {
    const deleted = await this.client.del(this.prefixKey(key));
    return deleted > 0;
  }

  async clear(): Promise<void> {
    const keys = await this.client.keys(`${this.prefix}*`);
    for (const key of keys) {
      await this.client.del(key);
    }
  }

  async keys(): Promise<string[]> {
    const keys = await this.client.keys(`${this.prefix}*`);
    return keys.map(k => k.replace(this.prefix, ''));
  }

  async size(): Promise<number> {
    const keys = await this.client.keys(`${this.prefix}*`);
    return keys.length;
  }
}

// ============================================================================
// Cached AI Provider Wrapper
// ============================================================================

export class CachedAIProvider implements AIProvider {
  name: string;
  private provider: AIProvider;
  private storage: CacheStorage;
  private ttl: number;
  private semanticMatching: boolean;
  private similarityThreshold: number;
  private embeddingProvider?: AIProvider;
  private stats: CacheStats = {
    hits: 0,
    misses: 0,
    hitRate: 0,
    size: 0,
    savedCost: 0,
    savedTokens: 0,
  };

  constructor(provider: AIProvider, config: CacheConfig) {
    this.name = `cached-${provider.name}`;
    this.provider = provider;
    this.storage = config.storage;
    this.ttl = config.ttl ?? 60 * 60 * 1000; // 1 hour default
    this.semanticMatching = config.semanticMatching ?? false;
    this.similarityThreshold = config.similarityThreshold ?? 0.95;
    this.embeddingProvider = config.embeddingProvider;
  }

  /**
   * Generate a cache key from prompt and options
   */
  private generateKey(prompt: string, options?: CompletionOptions): string {
    const keyData = JSON.stringify({
      prompt,
      model: options?.model,
      temperature: options?.temperature,
      maxTokens: options?.maxTokens,
      systemPrompt: options?.systemPrompt,
    });
    return createHash('sha256').update(keyData).digest('hex');
  }

  /**
   * Try to find a cached response
   */
  private async findCached(
    prompt: string,
    options?: CompletionOptions
  ): Promise<CacheEntry | undefined> {
    const key = this.generateKey(prompt, options);

    // Try exact match first
    const exactMatch = await this.storage.get(key);
    if (exactMatch) return exactMatch;

    // Try semantic matching if enabled
    if (this.semanticMatching && this.embeddingProvider?.embed && this.storage.findSimilar) {
      const [embedding] = await this.embeddingProvider.embed([prompt]);
      if (embedding) {
        const similar = await this.storage.findSimilar(embedding, this.similarityThreshold);
        if (similar.length > 0) {
          return similar[0];
        }
      }
    }

    return undefined;
  }

  async generateCompletion(prompt: string, options?: CompletionOptions): Promise<string> {
    // Try cache first
    const cached = await this.findCached(prompt, options);
    if (cached) {
      this.stats.hits++;
      this.stats.savedTokens += (cached.metadata?.promptTokens || 0) + (cached.metadata?.completionTokens || 0);
      this.stats.savedCost += cached.metadata?.cost || 0;
      this.updateHitRate();
      return cached.value;
    }

    // Cache miss - call provider
    this.stats.misses++;
    this.updateHitRate();

    const result = await this.provider.generateCompletion(prompt, options);

    // Store in cache
    const key = this.generateKey(prompt, options);
    const entry: CacheEntry = {
      key,
      value: result,
      createdAt: Date.now(),
      expiresAt: Date.now() + this.ttl,
      hits: 0,
      metadata: {
        model: options?.model,
      },
    };

    // Add embedding for semantic matching
    if (this.semanticMatching && this.embeddingProvider?.embed) {
      const [embedding] = await this.embeddingProvider.embed([prompt]);
      entry.embedding = embedding;
    }

    await this.storage.set(key, entry);

    return result;
  }

  async *generateStreamCompletion(
    prompt: string,
    options?: CompletionOptions
  ): AsyncIterableIterator<string> {
    // Check cache for exact match (don't stream from cache for simplicity)
    const cached = await this.findCached(prompt, options);
    if (cached) {
      this.stats.hits++;
      this.updateHitRate();
      yield cached.value;
      return;
    }

    // Cache miss - stream from provider and collect for caching
    this.stats.misses++;
    this.updateHitRate();

    if (!this.provider.generateStreamCompletion) {
      throw new Error('Provider does not support streaming');
    }

    const chunks: string[] = [];
    for await (const chunk of this.provider.generateStreamCompletion(prompt, options)) {
      chunks.push(chunk);
      yield chunk;
    }

    // Store completed response in cache
    const result = chunks.join('');
    const key = this.generateKey(prompt, options);
    const entry: CacheEntry = {
      key,
      value: result,
      createdAt: Date.now(),
      expiresAt: Date.now() + this.ttl,
      hits: 0,
      metadata: { model: options?.model },
    };

    await this.storage.set(key, entry);
  }

  private updateHitRate(): void {
    const total = this.stats.hits + this.stats.misses;
    this.stats.hitRate = total > 0 ? this.stats.hits / total : 0;
  }

  /**
   * Get cache statistics
   */
  async getStats(): Promise<CacheStats> {
    this.stats.size = await this.storage.size();
    return { ...this.stats };
  }

  /**
   * Clear the cache
   */
  async clearCache(): Promise<void> {
    await this.storage.clear();
    this.stats = {
      hits: 0,
      misses: 0,
      hitRate: 0,
      size: 0,
      savedCost: 0,
      savedTokens: 0,
    };
  }

  /**
   * Invalidate a specific prompt
   */
  async invalidate(prompt: string, options?: CompletionOptions): Promise<boolean> {
    const key = this.generateKey(prompt, options);
    return this.storage.delete(key);
  }

  /**
   * Get the underlying provider
   */
  getProvider(): AIProvider {
    return this.provider;
  }
}

// ============================================================================
// Factory Functions
// ============================================================================

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
export function createCachedProvider(
  provider: AIProvider,
  config: CacheConfig
): CachedAIProvider {
  return new CachedAIProvider(provider, config);
}

/**
 * Create in-memory cache storage
 */
export function createMemoryCache(maxSize = 1000): MemoryCacheStorage {
  return new MemoryCacheStorage(maxSize);
}

/**
 * Create Redis cache storage
 */
export function createRedisCache(
  client: RedisClient,
  prefix = 'philjs:ai:cache:'
): RedisCacheStorage {
  return new RedisCacheStorage(client, prefix);
}

// ============================================================================
// Utilities
// ============================================================================

function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) return 0;

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i]! * b[i]!;
    normA += a[i]! * a[i]!;
    normB += b[i]! * b[i]!;
  }

  const magnitude = Math.sqrt(normA) * Math.sqrt(normB);
  return magnitude === 0 ? 0 : dotProduct / magnitude;
}

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
export function withCache<T extends (...args: unknown[]) => Promise<string>>(
  fn: T,
  config: Omit<CacheConfig, 'storage'> & { storage: CacheStorage }
): T {
  const cache = config.storage;
  const ttl = config.ttl ?? 60 * 60 * 1000;

  return (async (...args: Parameters<T>) => {
    const key = createHash('sha256')
      .update(JSON.stringify(args))
      .digest('hex');

    const cached = await cache.get(key);
    if (cached) {
      return cached.value;
    }

    const result = await fn(...args);

    await cache.set(key, {
      key,
      value: result,
      createdAt: Date.now(),
      expiresAt: Date.now() + ttl,
      hits: 0,
    });

    return result;
  }) as T;
}
