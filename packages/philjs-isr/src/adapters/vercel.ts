/**
 * PhilJS ISR Vercel KV Cache Adapter
 *
 * Vercel KV-based cache storage for Vercel deployments.
 * Uses Vercel's built-in Redis-compatible KV store.
 */

import type { CacheAdapter, CacheStats } from '../cache.js';
import type { CacheEntry, CacheEntryMeta, RevalidationStatus } from '../config.js';

/**
 * Vercel KV configuration
 */
export interface VercelKVConfig {
  /** Vercel KV REST URL (defaults to VERCEL_KV_URL env var) */
  url?: string | undefined;
  /** Vercel KV REST API token (defaults to VERCEL_KV_REST_API_TOKEN env var) */
  token?: string | undefined;
  /** Key prefix for all cache keys */
  keyPrefix?: string | undefined;
  /** Enable automatic fetch retries */
  enableRetries?: boolean | undefined;
  /** Request timeout in ms */
  timeout?: number | undefined;
}

/**
 * Vercel KV client interface
 */
interface VercelKVClient {
  get<T = string>(key: string): Promise<T | null>;
  set(key: string, value: unknown, options?: { ex?: number }): Promise<void>;
  del(...keys: string[]): Promise<number>;
  exists(...keys: string[]): Promise<number>;
  keys(pattern: string): Promise<string[]>;
  smembers(key: string): Promise<string[]>;
  sadd(key: string, ...members: string[]): Promise<number>;
  srem(key: string, ...members: string[]): Promise<number>;
  scan(cursor: number, options?: { match?: string; count?: number }): Promise<[string, string[]]>;
}

/**
 * Vercel KV cache adapter implementation
 */
export class VercelKVAdapter implements CacheAdapter {
  readonly name = 'vercel';

  private config: VercelKVConfig;
  private client: VercelKVClient | null = null;
  private keyPrefix: string;
  private tagPrefix: string;
  private metaPrefix: string;

  constructor(config: VercelKVConfig = {}) {
    this.config = {
      ...config,
      keyPrefix: config.keyPrefix ?? 'philjs:isr:',
      enableRetries: config.enableRetries ?? true,
      timeout: config.timeout ?? 5000,
    };
    // Set url and token separately to avoid type issues
    if (!this.config.url) {
      this.config.url = process.env['KV_REST_API_URL'] ?? process.env['VERCEL_KV_URL'];
    }
    if (!this.config.token) {
      this.config.token = process.env['KV_REST_API_TOKEN'] ?? process.env['VERCEL_KV_REST_API_TOKEN'];
    }

    const prefix = this.config.keyPrefix ?? 'philjs:isr:';
    this.keyPrefix = prefix + 'page:';
    this.tagPrefix = prefix + 'tag:';
    this.metaPrefix = prefix + 'meta:';
  }

  /**
   * Get or create the Vercel KV client
   */
  private async getClient(): Promise<VercelKVClient> {
    if (this.client) {
      return this.client;
    }

    // Try to use @vercel/kv if available
    try {
      // @ts-expect-error - @vercel/kv is an optional dependency
      const vercelKV = await import('@vercel/kv');
      this.client = vercelKV.kv as unknown as VercelKVClient;
      return this.client;
    } catch {
      // Fall back to REST API client
    }

    // Create REST API client
    if (!this.config.url || !this.config.token) {
      throw new Error(
        '[ISR:VercelKV] Vercel KV credentials not found. ' +
        'Either install @vercel/kv or provide url and token in config.'
      );
    }

    this.client = this.createRestClient();
    return this.client;
  }

  /**
   * Create a REST API client
   */
  private createRestClient(): VercelKVClient {
    const baseUrl = this.config.url!;
    const token = this.config.token!;
    const timeout = this.config.timeout!;

    const fetchWithTimeout = async (url: string, options: RequestInit = {}): Promise<Response> => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      try {
        const response = await fetch(url, {
          ...options,
          signal: controller.signal,
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            ...options.headers,
          },
        });
        return response;
      } finally {
        clearTimeout(timeoutId);
      }
    };

    const executeCommand = async (command: string[]): Promise<unknown> => {
      const response = await fetchWithTimeout(baseUrl, {
        method: 'POST',
        body: JSON.stringify(command),
      });

      if (!response.ok) {
        throw new Error(`Vercel KV error: ${response.status}`);
      }

      const data = await response.json() as { result: unknown };
      return data.result;
    };

    return {
      async get<T = string>(key: string): Promise<T | null> {
        const result = await executeCommand(['GET', key]);
        if (result === null) return null;
        try {
          return JSON.parse(result as string) as T;
        } catch {
          return result as T;
        }
      },

      async set(key: string, value: unknown, options?: { ex?: number }): Promise<void> {
        const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
        const command = ['SET', key, stringValue];
        if (options?.ex) {
          command.push('EX', String(options.ex));
        }
        await executeCommand(command);
      },

      async del(...keys: string[]): Promise<number> {
        if (keys.length === 0) return 0;
        const result = await executeCommand(['DEL', ...keys]);
        return result as number;
      },

      async exists(...keys: string[]): Promise<number> {
        const result = await executeCommand(['EXISTS', ...keys]);
        return result as number;
      },

      async keys(pattern: string): Promise<string[]> {
        const result = await executeCommand(['KEYS', pattern]);
        return result as string[];
      },

      async smembers(key: string): Promise<string[]> {
        const result = await executeCommand(['SMEMBERS', key]);
        return result as string[];
      },

      async sadd(key: string, ...members: string[]): Promise<number> {
        const result = await executeCommand(['SADD', key, ...members]);
        return result as number;
      },

      async srem(key: string, ...members: string[]): Promise<number> {
        const result = await executeCommand(['SREM', key, ...members]);
        return result as number;
      },

      async scan(cursor: number, options?: { match?: string; count?: number }): Promise<[string, string[]]> {
        const command = ['SCAN', String(cursor)];
        if (options?.match) {
          command.push('MATCH', options.match);
        }
        if (options?.count) {
          command.push('COUNT', String(options.count));
        }
        const result = await executeCommand(command) as [string, string[]];
        return result;
      },
    };
  }

  async get(path: string): Promise<CacheEntry | null> {
    const client = await this.getClient();
    const key = this.keyPrefix + path;

    try {
      const data = await client.get<CacheEntry>(key);
      return data;
    } catch (error) {
      console.error(`[ISR:VercelKV] Error getting ${path}:`, error);
      return null;
    }
  }

  async set(path: string, entry: CacheEntry): Promise<void> {
    const client = await this.getClient();
    const key = this.keyPrefix + path;

    try {
      // Calculate TTL
      const ttl = entry.meta.revalidateInterval > 0
        ? entry.meta.revalidateInterval + 3600
        : undefined;

      await client.set(key, entry, ttl ? { ex: ttl } : undefined);

      // Store metadata separately
      await client.set(
        this.metaPrefix + path,
        entry.meta,
        ttl ? { ex: ttl } : undefined
      );

      // Update tag indexes
      for (const tag of entry.meta.tags) {
        await client.sadd(this.tagPrefix + tag, path);
      }
    } catch (error) {
      console.error(`[ISR:VercelKV] Error setting ${path}:`, error);
      throw error;
    }
  }

  async delete(path: string): Promise<boolean> {
    const client = await this.getClient();

    try {
      // Get entry to remove from tag indexes
      const entry = await this.get(path);
      if (entry) {
        for (const tag of entry.meta.tags) {
          await client.srem(this.tagPrefix + tag, path);
        }
      }

      const result = await client.del(
        this.keyPrefix + path,
        this.metaPrefix + path
      );
      return result > 0;
    } catch (error) {
      console.error(`[ISR:VercelKV] Error deleting ${path}:`, error);
      return false;
    }
  }

  async has(path: string): Promise<boolean> {
    const client = await this.getClient();
    const result = await client.exists(this.keyPrefix + path);
    return result > 0;
  }

  async keys(): Promise<string[]> {
    const client = await this.getClient();
    const pattern = this.keyPrefix + '*';
    const allKeys: string[] = [];

    try {
      let cursor = 0;
      do {
        const [newCursor, keys] = await client.scan(cursor, {
          match: pattern,
          count: 100,
        });
        cursor = parseInt(newCursor, 10);
        allKeys.push(...keys.map(k => k.replace(this.keyPrefix, '')));
      } while (cursor !== 0);

      return allKeys;
    } catch {
      // Fallback to KEYS command (less efficient but more compatible)
      const keys = await client.keys(pattern);
      return keys.map(k => k.replace(this.keyPrefix, ''));
    }
  }

  async clear(): Promise<void> {
    const client = await this.getClient();

    try {
      const pageKeys = await client.keys(this.keyPrefix + '*');
      const tagKeys = await client.keys(this.tagPrefix + '*');
      const metaKeys = await client.keys(this.metaPrefix + '*');

      const allKeys = [...pageKeys, ...tagKeys, ...metaKeys];
      if (allKeys.length > 0) {
        // Delete in batches
        const batchSize = 100;
        for (let i = 0; i < allKeys.length; i += batchSize) {
          const batch = allKeys.slice(i, i + batchSize);
          await client.del(...batch);
        }
      }
    } catch (error) {
      console.error('[ISR:VercelKV] Error clearing cache:', error);
    }
  }

  async getByTag(tag: string): Promise<string[]> {
    const client = await this.getClient();
    return client.smembers(this.tagPrefix + tag);
  }

  async updateMeta(path: string, meta: Partial<CacheEntryMeta>): Promise<boolean> {
    const client = await this.getClient();

    try {
      const entry = await this.get(path);
      if (!entry) {
        return false;
      }

      // Handle tag changes
      if (meta.tags && JSON.stringify(meta.tags) !== JSON.stringify(entry.meta.tags)) {
        // Remove from old tags
        for (const tag of entry.meta.tags) {
          await client.srem(this.tagPrefix + tag, path);
        }
        // Add to new tags
        for (const tag of meta.tags) {
          await client.sadd(this.tagPrefix + tag, path);
        }
      }

      entry.meta = { ...entry.meta, ...meta };
      await this.set(path, entry);

      return true;
    } catch (error) {
      console.error(`[ISR:VercelKV] Error updating meta for ${path}:`, error);
      return false;
    }
  }

  async getMeta(path: string): Promise<CacheEntryMeta | null> {
    const client = await this.getClient();

    try {
      const meta = await client.get<CacheEntryMeta>(this.metaPrefix + path);
      return meta;
    } catch {
      return null;
    }
  }

  async getStats(): Promise<CacheStats> {
    try {
      const keys = await this.keys();
      const byStatus: Record<RevalidationStatus, number> = {
        fresh: 0,
        stale: 0,
        revalidating: 0,
        error: 0,
      };

      let staleCount = 0;
      let oldestEntry: number | undefined;
      let newestEntry: number | undefined;

      // Sample entries for stats
      const sampleSize = Math.min(keys.length, 100);
      const sampleKeys = keys.slice(0, sampleSize);

      for (const key of sampleKeys) {
        const meta = await this.getMeta(key);
        if (meta) {
          byStatus[meta.status]++;

          if (!oldestEntry || meta.createdAt < oldestEntry) {
            oldestEntry = meta.createdAt;
          }
          if (!newestEntry || meta.createdAt > newestEntry) {
            newestEntry = meta.createdAt;
          }

          const now = Date.now();
          const age = now - meta.revalidatedAt;
          if (age > meta.revalidateInterval * 1000) {
            staleCount++;
          }
        }
      }

      const stats: CacheStats = {
        entryCount: keys.length,
        sizeBytes: 0, // Vercel KV doesn't expose size
        staleCount: Math.round((staleCount / sampleSize) * keys.length),
        byStatus,
      };
      if (oldestEntry !== undefined) stats.oldestEntry = oldestEntry;
      if (newestEntry !== undefined) stats.newestEntry = newestEntry;
      return stats;
    } catch {
      return {
        entryCount: 0,
        sizeBytes: 0,
        staleCount: 0,
        byStatus: { fresh: 0, stale: 0, revalidating: 0, error: 0 },
      };
    }
  }

  async close(): Promise<void> {
    this.client = null;
  }
}

/**
 * Create a Vercel KV cache adapter
 */
export function createVercelKVCache(config?: VercelKVConfig): VercelKVAdapter {
  return new VercelKVAdapter(config);
}
