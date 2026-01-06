/**
 * PhilJS ISR Cloudflare KV Cache Adapter
 *
 * Cloudflare KV-based cache storage for edge deployments.
 * Works with Cloudflare Workers and Pages.
 */

import type { CacheAdapter, CacheStats } from '../cache.js';
import type { CacheEntry, CacheEntryMeta, RevalidationStatus } from '../config.js';

/**
 * Cloudflare KV configuration
 */
export interface CloudflareKVConfig {
  /** KV namespace binding name (when running in Workers) */
  namespace?: string;
  /** Account ID for REST API access */
  accountId?: string;
  /** Namespace ID for REST API access */
  namespaceId?: string;
  /** API token for REST API access */
  apiToken?: string;
  /** Key prefix for all cache keys */
  keyPrefix?: string;
  /** Whether to use REST API (vs direct binding) */
  useRestApi?: boolean;
}

/**
 * Cloudflare KV namespace interface
 */
interface KVNamespace {
  get(key: string, options?: { type: 'text' | 'json' | 'arrayBuffer' | 'stream' }): Promise<unknown>;
  put(key: string, value: string, options?: { expirationTtl?: number | undefined; metadata?: unknown }): Promise<void>;
  delete(key: string): Promise<void>;
  list(options?: { prefix?: string | undefined; limit?: number | undefined; cursor?: string | undefined }): Promise<{
    keys: Array<{ name: string; expiration?: number; metadata?: unknown }>;
    list_complete: boolean;
    cursor?: string | undefined;
  }>;
  getWithMetadata<T>(key: string, options?: { type: 'text' | 'json' }): Promise<{
    value: unknown;
    metadata: T | null;
  }>;
}

/**
 * Cloudflare KV cache adapter implementation
 */
export class CloudflareKVAdapter implements CacheAdapter {
  readonly name = 'cloudflare-kv';

  private config: CloudflareKVConfig;
  private namespace: KVNamespace | null = null;
  private keyPrefix: string;
  private tagPrefix: string;

  constructor(config: CloudflareKVConfig = {}) {
    this.config = {
      keyPrefix: config.keyPrefix ?? 'isr:',
      useRestApi: config.useRestApi ?? false,
      ...config,
    };
    this.keyPrefix = this.config.keyPrefix + 'page:';
    this.tagPrefix = this.config.keyPrefix + 'tag:';
  }

  /**
   * Get the KV namespace
   */
  private async getNamespace(): Promise<KVNamespace> {
    if (this.namespace) {
      return this.namespace;
    }

    // Try to get from global bindings (Workers runtime)
    if (this.config.namespace && typeof globalThis !== 'undefined') {
      const ns = (globalThis as Record<string, unknown>)[this.config.namespace];
      if (ns) {
        this.namespace = ns as KVNamespace;
        return this.namespace;
      }
    }

    // Use REST API
    if (this.config.useRestApi && this.config.accountId && this.config.namespaceId && this.config.apiToken) {
      this.namespace = this.createRestApiClient();
      return this.namespace;
    }

    throw new Error(
      '[ISR:CloudflareKV] KV namespace not available. ' +
      'Either provide a namespace binding or configure REST API access.'
    );
  }

  /**
   * Create a REST API client that implements KVNamespace interface
   */
  private createRestApiClient(): KVNamespace {
    const baseUrl = `https://api.cloudflare.com/client/v4/accounts/${this.config.accountId}/storage/kv/namespaces/${this.config.namespaceId}`;
    const headers = {
      'Authorization': `Bearer ${this.config.apiToken}`,
      'Content-Type': 'application/json',
    };

    return {
      async get(key: string, options?: { type: string }) {
        const response = await fetch(`${baseUrl}/values/${encodeURIComponent(key)}`, {
          headers,
        });
        if (!response.ok) {
          if (response.status === 404) return null;
          throw new Error(`KV get failed: ${response.status}`);
        }
        const text = await response.text();
        if (options?.type === 'json') {
          return JSON.parse(text);
        }
        return text;
      },

      async put(key: string, value: string, options?: { expirationTtl?: number; metadata?: unknown }) {
        const url = new URL(`${baseUrl}/values/${encodeURIComponent(key)}`);
        if (options?.expirationTtl) {
          url.searchParams.set('expiration_ttl', String(options.expirationTtl));
        }

        const response = await fetch(url.toString(), {
          method: 'PUT',
          headers,
          body: value,
        });

        if (!response.ok) {
          throw new Error(`KV put failed: ${response.status}`);
        }
      },

      async delete(key: string) {
        const response = await fetch(`${baseUrl}/values/${encodeURIComponent(key)}`, {
          method: 'DELETE',
          headers,
        });

        if (!response.ok && response.status !== 404) {
          throw new Error(`KV delete failed: ${response.status}`);
        }
      },

      async list(options?: { prefix?: string; limit?: number; cursor?: string }) {
        const url = new URL(`${baseUrl}/keys`);
        if (options?.prefix) {
          url.searchParams.set('prefix', options.prefix);
        }
        if (options?.limit) {
          url.searchParams.set('limit', String(options.limit));
        }
        if (options?.cursor) {
          url.searchParams.set('cursor', options.cursor);
        }

        const response = await fetch(url.toString(), { headers });
        if (!response.ok) {
          throw new Error(`KV list failed: ${response.status}`);
        }

        const data = await response.json() as {
          result: Array<{ name: string; expiration?: number; metadata?: unknown }>;
          result_info: { cursor?: string };
        };

        return {
          keys: data.result,
          list_complete: !data.result_info.cursor,
          cursor: data.result_info.cursor,
        };
      },

      async getWithMetadata<T>(key: string) {
        // REST API doesn't support metadata in a single call
        const value = await this.get(key, { type: 'text' });
        return { value, metadata: null as T | null };
      },
    };
  }

  async get(path: string): Promise<CacheEntry | null> {
    const kv = await this.getNamespace();
    const key = this.keyPrefix + path;

    try {
      const data = await kv.get(key, { type: 'text' }) as string | null;
      if (!data) {
        return null;
      }
      return JSON.parse(data);
    } catch (error) {
      console.error(`[ISR:CloudflareKV] Error getting ${path}:`, error);
      return null;
    }
  }

  async set(path: string, entry: CacheEntry): Promise<void> {
    const kv = await this.getNamespace();
    const key = this.keyPrefix + path;

    try {
      // Calculate TTL (add buffer for stale-while-revalidate)
      const ttl = entry.meta.revalidateInterval > 0
        ? entry.meta.revalidateInterval + 3600
        : undefined;

      await kv.put(key, JSON.stringify(entry), {
        expirationTtl: ttl,
        metadata: { tags: entry.meta.tags, revalidatedAt: entry.meta.revalidatedAt },
      });

      // Update tag indexes
      for (const tag of entry.meta.tags) {
        const tagKey = this.tagPrefix + tag;
        const existingPaths = await this.getTagPaths(tag);
        if (!existingPaths.includes(path)) {
          existingPaths.push(path);
          await kv.put(tagKey, JSON.stringify(existingPaths));
        }
      }
    } catch (error) {
      console.error(`[ISR:CloudflareKV] Error setting ${path}:`, error);
      throw error;
    }
  }

  async delete(path: string): Promise<boolean> {
    const kv = await this.getNamespace();

    try {
      // Get entry to remove from tag indexes
      const entry = await this.get(path);

      await kv.delete(this.keyPrefix + path);

      // Remove from tag indexes
      if (entry) {
        for (const tag of entry.meta.tags) {
          const paths = await this.getTagPaths(tag);
          const filtered = paths.filter(p => p !== path);
          if (filtered.length > 0) {
            await kv.put(this.tagPrefix + tag, JSON.stringify(filtered));
          } else {
            await kv.delete(this.tagPrefix + tag);
          }
        }
      }

      return true;
    } catch (error) {
      console.error(`[ISR:CloudflareKV] Error deleting ${path}:`, error);
      return false;
    }
  }

  async has(path: string): Promise<boolean> {
    const entry = await this.get(path);
    return entry !== null;
  }

  async keys(): Promise<string[]> {
    const kv = await this.getNamespace();
    const allKeys: string[] = [];

    try {
      let cursor: string | undefined;
      do {
        const result = await kv.list({
          prefix: this.keyPrefix,
          limit: 1000,
          cursor,
        });

        allKeys.push(
          ...result.keys.map(k => k.name.replace(this.keyPrefix, ''))
        );

        cursor = result.cursor;
      } while (cursor);

      return allKeys;
    } catch (error) {
      console.error('[ISR:CloudflareKV] Error listing keys:', error);
      return [];
    }
  }

  async clear(): Promise<void> {
    const kv = await this.getNamespace();

    try {
      // List and delete all keys with our prefix
      let cursor: string | undefined;
      do {
        const result = await kv.list({
          prefix: this.config.keyPrefix,
          limit: 1000,
          cursor,
        });

        await Promise.all(
          result.keys.map(k => kv.delete(k.name))
        );

        cursor = result.cursor;
      } while (cursor);
    } catch (error) {
      console.error('[ISR:CloudflareKV] Error clearing cache:', error);
    }
  }

  async getByTag(tag: string): Promise<string[]> {
    return this.getTagPaths(tag);
  }

  async updateMeta(path: string, meta: Partial<CacheEntryMeta>): Promise<boolean> {
    try {
      const entry = await this.get(path);
      if (!entry) {
        return false;
      }

      // Handle tag changes
      if (meta.tags && JSON.stringify(meta.tags) !== JSON.stringify(entry.meta.tags)) {
        // Remove from old tags
        for (const tag of entry.meta.tags) {
          const paths = await this.getTagPaths(tag);
          const filtered = paths.filter(p => p !== path);
          const kv = await this.getNamespace();
          if (filtered.length > 0) {
            await kv.put(this.tagPrefix + tag, JSON.stringify(filtered));
          } else {
            await kv.delete(this.tagPrefix + tag);
          }
        }
      }

      entry.meta = { ...entry.meta, ...meta };
      await this.set(path, entry);

      return true;
    } catch (error) {
      console.error(`[ISR:CloudflareKV] Error updating meta for ${path}:`, error);
      return false;
    }
  }

  async getMeta(path: string): Promise<CacheEntryMeta | null> {
    const entry = await this.get(path);
    return entry?.meta ?? null;
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
      const sampleSize = Math.min(keys.length, 50);
      const sampleKeys = keys.slice(0, sampleSize);

      for (const key of sampleKeys) {
        const entry = await this.get(key);
        if (entry) {
          byStatus[entry.meta.status]++;

          if (!oldestEntry || entry.meta.createdAt < oldestEntry) {
            oldestEntry = entry.meta.createdAt;
          }
          if (!newestEntry || entry.meta.createdAt > newestEntry) {
            newestEntry = entry.meta.createdAt;
          }

          const now = Date.now();
          const age = now - entry.meta.revalidatedAt;
          if (age > entry.meta.revalidateInterval * 1000) {
            staleCount++;
          }
        }
      }

      const stats: CacheStats = {
        entryCount: keys.length,
        sizeBytes: 0, // KV doesn't expose size info
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
    this.namespace = null;
  }

  /**
   * Get paths for a tag from the tag index
   */
  private async getTagPaths(tag: string): Promise<string[]> {
    const kv = await this.getNamespace();
    const tagKey = this.tagPrefix + tag;

    try {
      const data = await kv.get(tagKey, { type: 'text' }) as string | null;
      if (!data) {
        return [];
      }
      return JSON.parse(data);
    } catch {
      return [];
    }
  }

  /**
   * Bind a KV namespace directly (for Workers runtime)
   */
  bindNamespace(namespace: KVNamespace): void {
    this.namespace = namespace;
  }
}

/**
 * Create a Cloudflare KV cache adapter
 */
export function createCloudflareKVCache(config?: CloudflareKVConfig): CloudflareKVAdapter {
  return new CloudflareKVAdapter(config);
}
