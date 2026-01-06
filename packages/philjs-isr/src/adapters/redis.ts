/**
 * PhilJS ISR Redis Cache Adapter
 *
 * Redis-based cache storage for distributed deployments.
 * Supports Redis, Redis Cluster, and Redis Sentinel.
 */

import type { CacheAdapter, CacheStats } from '../cache.js';
import type { CacheEntry, CacheEntryMeta, RevalidationStatus } from '../config.js';

/**
 * Redis connection configuration
 */
export interface RedisConfig {
  /** Redis connection URL */
  url?: string;
  /** Redis host */
  host?: string;
  /** Redis port */
  port?: number;
  /** Redis password */
  password?: string;
  /** Redis database number */
  db?: number;
  /** Key prefix for all cache keys */
  keyPrefix?: string;
  /** Enable TLS */
  tls?: boolean;
  /** Connection timeout in ms */
  connectTimeout?: number;
  /** Command timeout in ms */
  commandTimeout?: number;
  /** Max retries on connection failure */
  maxRetries?: number;
}

/**
 * Redis client interface (compatible with ioredis)
 */
interface RedisClient {
  get(key: string): Promise<string | null>;
  set(key: string, value: string, ...args: unknown[]): Promise<unknown>;
  del(...keys: string[]): Promise<number>;
  exists(...keys: string[]): Promise<number>;
  keys(pattern: string): Promise<string[]>;
  smembers(key: string): Promise<string[]>;
  sadd(key: string, ...members: string[]): Promise<number>;
  srem(key: string, ...members: string[]): Promise<number>;
  hset(key: string, field: string, value: string): Promise<number>;
  hget(key: string, field: string): Promise<string | null>;
  hgetall(key: string): Promise<Record<string, string>>;
  scan(cursor: string | number, ...args: unknown[]): Promise<[string, string[]]>;
  dbsize(): Promise<number>;
  info(section?: string): Promise<string>;
  quit(): Promise<void>;
}

/**
 * Serialized cache entry for Redis storage
 */
interface SerializedEntry {
  html: string;
  meta: CacheEntryMeta;
  props?: string | undefined; // JSON stringified
  headers?: string | undefined; // JSON stringified
}

/**
 * Redis cache adapter implementation
 */
export class RedisCacheAdapter implements CacheAdapter {
  readonly name = 'redis';

  private client: RedisClient | null = null;
  private config: Required<Omit<RedisConfig, 'url' | 'password' | 'tls'>> & RedisConfig;
  private keyPrefix: string;
  private tagPrefix: string;
  private metaPrefix: string;

  constructor(config: RedisConfig = {}) {
    this.config = {
      host: config.host ?? 'localhost',
      port: config.port ?? 6379,
      db: config.db ?? 0,
      keyPrefix: config.keyPrefix ?? 'philjs:isr:',
      connectTimeout: config.connectTimeout ?? 5000,
      commandTimeout: config.commandTimeout ?? 5000,
      maxRetries: config.maxRetries ?? 3,
      ...config,
    };

    this.keyPrefix = this.config.keyPrefix + 'page:';
    this.tagPrefix = this.config.keyPrefix + 'tag:';
    this.metaPrefix = this.config.keyPrefix + 'meta:';
  }

  /**
   * Initialize the Redis connection
   */
  private async getClient(): Promise<RedisClient> {
    if (this.client) {
      return this.client;
    }

    // Dynamically import ioredis
    try {
      // @ts-expect-error - ioredis is an optional peer dependency
      const Redis = (await import('ioredis')).default;

      const options: Record<string, unknown> = {
        host: this.config.host,
        port: this.config.port,
        password: this.config.password,
        db: this.config.db,
        connectTimeout: this.config.connectTimeout,
        commandTimeout: this.config.commandTimeout,
        maxRetriesPerRequest: this.config.maxRetries,
        retryDelayOnFailover: 100,
        enableReadyCheck: true,
        lazyConnect: true,
      };

      if (this.config.url) {
        this.client = new Redis(this.config.url, options) as unknown as RedisClient;
      } else {
        if (this.config.tls) {
          options['tls'] = {};
        }
        this.client = new Redis(options) as unknown as RedisClient;
      }

      return this.client;
    } catch (error) {
      throw new Error(
        '[ISR:Redis] ioredis is required for Redis cache adapter. ' +
        'Install it with: npm install ioredis'
      );
    }
  }

  async get(path: string): Promise<CacheEntry | null> {
    const client = await this.getClient();
    const key = this.keyPrefix + path;

    try {
      const data = await client.get(key);
      if (!data) {
        return null;
      }

      const serialized: SerializedEntry = JSON.parse(data);
      return {
        html: serialized.html,
        meta: serialized.meta,
        props: serialized.props ? JSON.parse(serialized.props) : undefined,
        headers: serialized.headers ? JSON.parse(serialized.headers) : undefined,
      };
    } catch (error) {
      console.error(`[ISR:Redis] Error getting ${path}:`, error);
      return null;
    }
  }

  async set(path: string, entry: CacheEntry): Promise<void> {
    const client = await this.getClient();
    const key = this.keyPrefix + path;

    try {
      // Serialize entry
      const serialized: SerializedEntry = {
        html: entry.html,
        meta: entry.meta,
        props: entry.props ? JSON.stringify(entry.props) : undefined,
        headers: entry.headers ? JSON.stringify(entry.headers) : undefined,
      };

      // Calculate TTL (add buffer for stale-while-revalidate)
      const ttl = entry.meta.revalidateInterval > 0
        ? entry.meta.revalidateInterval + 3600 // 1 hour buffer
        : 0;

      // Store entry
      if (ttl > 0) {
        await client.set(key, JSON.stringify(serialized), 'EX', ttl);
      } else {
        await client.set(key, JSON.stringify(serialized));
      }

      // Update tag indexes
      for (const tag of entry.meta.tags) {
        await client.sadd(this.tagPrefix + tag, path);
      }

      // Store metadata separately for quick access
      await client.set(
        this.metaPrefix + path,
        JSON.stringify(entry.meta),
        ...(ttl > 0 ? ['EX', ttl] : [])
      );
    } catch (error) {
      console.error(`[ISR:Redis] Error setting ${path}:`, error);
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
      console.error(`[ISR:Redis] Error deleting ${path}:`, error);
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

    // Use SCAN to avoid blocking on large datasets
    let cursor = '0';
    do {
      const [newCursor, keys] = await client.scan(cursor, 'MATCH', pattern, 'COUNT', 100);
      cursor = newCursor;
      allKeys.push(
        ...keys.map((key: string) => key.replace(this.keyPrefix, ''))
      );
    } while (cursor !== '0');

    return allKeys;
  }

  async clear(): Promise<void> {
    const client = await this.getClient();

    // Get all keys with our prefix
    const pageKeys = await this.keys();
    const tagKeys = await client.keys(this.tagPrefix + '*');
    const metaKeys = await client.keys(this.metaPrefix + '*');

    // Delete all
    const allKeys = [
      ...pageKeys.map(k => this.keyPrefix + k),
      ...tagKeys,
      ...metaKeys,
    ];

    if (allKeys.length > 0) {
      // Delete in batches
      const batchSize = 100;
      for (let i = 0; i < allKeys.length; i += batchSize) {
        const batch = allKeys.slice(i, i + batchSize);
        await client.del(...batch);
      }
    }
  }

  async getByTag(tag: string): Promise<string[]> {
    const client = await this.getClient();
    return client.smembers(this.tagPrefix + tag);
  }

  async updateMeta(path: string, meta: Partial<CacheEntryMeta>): Promise<boolean> {
    const client = await this.getClient();

    try {
      // Get current entry
      const entry = await this.get(path);
      if (!entry) {
        return false;
      }

      // Handle tag changes
      if (meta.tags && meta.tags !== entry.meta.tags) {
        // Remove from old tags
        for (const tag of entry.meta.tags) {
          await client.srem(this.tagPrefix + tag, path);
        }
        // Add to new tags
        for (const tag of meta.tags) {
          await client.sadd(this.tagPrefix + tag, path);
        }
      }

      // Update entry with new meta
      entry.meta = { ...entry.meta, ...meta };
      await this.set(path, entry);

      return true;
    } catch (error) {
      console.error(`[ISR:Redis] Error updating meta for ${path}:`, error);
      return false;
    }
  }

  async getMeta(path: string): Promise<CacheEntryMeta | null> {
    const client = await this.getClient();

    try {
      const data = await client.get(this.metaPrefix + path);
      if (!data) {
        return null;
      }
      return JSON.parse(data);
    } catch (error) {
      console.error(`[ISR:Redis] Error getting meta for ${path}:`, error);
      return null;
    }
  }

  async getStats(): Promise<CacheStats> {
    const client = await this.getClient();

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

      // Sample entries for stats (don't scan all in large caches)
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

      // Get Redis memory info
      let sizeBytes = 0;
      try {
        const info = await client.info('memory');
        const match = info.match(/used_memory:(\d+)/);
        if (match) {
          // Approximate - this is total Redis memory, not just our keys
          sizeBytes = parseInt(match[1], 10);
        }
      } catch {
        // Ignore memory info errors
      }

      const stats: CacheStats = {
        entryCount: keys.length,
        sizeBytes,
        staleCount: Math.round((staleCount / sampleSize) * keys.length),
        byStatus,
      };
      if (oldestEntry !== undefined) stats.oldestEntry = oldestEntry;
      if (newestEntry !== undefined) stats.newestEntry = newestEntry;
      return stats;
    } catch (error) {
      console.error('[ISR:Redis] Error getting stats:', error);
      return {
        entryCount: 0,
        sizeBytes: 0,
        staleCount: 0,
        byStatus: { fresh: 0, stale: 0, revalidating: 0, error: 0 },
      };
    }
  }

  async close(): Promise<void> {
    if (this.client) {
      await this.client.quit();
      this.client = null;
    }
  }

  /**
   * Ping Redis to check connection
   */
  async ping(): Promise<boolean> {
    try {
      const client = await this.getClient();
      const result = await (client as unknown as { ping: () => Promise<string> }).ping();
      return result === 'PONG';
    } catch {
      return false;
    }
  }
}

/**
 * Create a Redis cache adapter
 */
export function createRedisCache(config?: RedisConfig): RedisCacheAdapter {
  return new RedisCacheAdapter(config);
}
