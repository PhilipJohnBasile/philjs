/**
 * PhilJS Edge - Edge Computing Primitives
 *
 * Unified API for edge computing across providers:
 * - Cloudflare Workers (KV, Durable Objects, D1, Queues, R2)
 * - Vercel Edge Config
 * - Deno KV
 * - Generic adapters
 */

import { signal, memo } from 'philjs-core';

// ============================================================================
// Types
// ============================================================================

export interface EdgeKVOptions {
  namespace: string;
  provider?: 'cloudflare' | 'vercel' | 'deno' | 'memory';
}

export interface KVGetOptions {
  type?: 'text' | 'json' | 'arrayBuffer' | 'stream';
  cacheTtl?: number;
}

export interface KVPutOptions {
  expirationTtl?: number;
  expiration?: number;
  metadata?: Record<string, any>;
}

export interface KVListOptions {
  prefix?: string;
  limit?: number;
  cursor?: string;
}

export interface KVListResult {
  keys: Array<{
    name: string;
    expiration?: number;
    metadata?: Record<string, any>;
  }>;
  cursor?: string;
  complete: boolean;
}

// ============================================================================
// KV Storage Interface
// ============================================================================

export interface KVStore {
  get<T = string>(key: string, options?: KVGetOptions): Promise<T | null>;
  put(key: string, value: string | ArrayBuffer | ReadableStream, options?: KVPutOptions): Promise<void>;
  delete(key: string): Promise<void>;
  list(options?: KVListOptions): Promise<KVListResult>;
  getWithMetadata<T = string>(key: string): Promise<{ value: T | null; metadata: Record<string, any> | null }>;
}

// ============================================================================
// In-Memory KV (for development/testing)
// ============================================================================

interface StoredValue {
  value: string | ArrayBuffer;
  metadata?: Record<string, any>;
  expiration?: number;
}

export class MemoryKVStore implements KVStore {
  private store = new Map<string, StoredValue>();

  async get<T = string>(key: string, options?: KVGetOptions): Promise<T | null> {
    const stored = this.store.get(key);
    if (!stored) return null;

    if (stored.expiration && Date.now() / 1000 > stored.expiration) {
      this.store.delete(key);
      return null;
    }

    const value = stored.value;
    if (options?.type === 'json' && typeof value === 'string') {
      return JSON.parse(value) as T;
    }
    return value as T;
  }

  async put(key: string, value: string | ArrayBuffer | ReadableStream, options?: KVPutOptions): Promise<void> {
    let storedValue: string | ArrayBuffer;

    if (value instanceof ReadableStream) {
      const reader = value.getReader();
      const chunks: Uint8Array[] = [];
      while (true) {
        const { done, value: chunk } = await reader.read();
        if (done) break;
        chunks.push(chunk);
      }
      // Combine chunks into single ArrayBuffer
      const totalLength = chunks.reduce((acc, c) => acc + c.length, 0);
      const combined = new Uint8Array(totalLength);
      let offset = 0;
      for (const chunk of chunks) {
        combined.set(chunk, offset);
        offset += chunk.length;
      }
      storedValue = combined.buffer as ArrayBuffer;
    } else {
      storedValue = value;
    }

    const entry: StoredValue = {
      value: storedValue,
    };
    if (options?.metadata) {
      entry.metadata = options.metadata;
    }

    if (options?.expirationTtl) {
      entry.expiration = Date.now() / 1000 + options.expirationTtl;
    } else if (options?.expiration) {
      entry.expiration = options.expiration;
    }

    this.store.set(key, entry);
  }

  async delete(key: string): Promise<void> {
    this.store.delete(key);
  }

  async list(options?: KVListOptions): Promise<KVListResult> {
    const keys: KVListResult['keys'] = [];
    const prefix = options?.prefix || '';
    const limit = options?.limit || 1000;

    for (const [key, stored] of this.store) {
      if (key.startsWith(prefix)) {
        if (stored.expiration && Date.now() / 1000 > stored.expiration) {
          this.store.delete(key);
          continue;
        }
        const keyEntry: { name: string; expiration?: number; metadata?: Record<string, any> } = { name: key };
        if (stored.expiration !== undefined) {
          keyEntry.expiration = stored.expiration;
        }
        if (stored.metadata !== undefined) {
          keyEntry.metadata = stored.metadata;
        }
        keys.push(keyEntry);
        if (keys.length >= limit) break;
      }
    }

    return {
      keys,
      complete: keys.length < limit,
    };
  }

  async getWithMetadata<T = string>(key: string): Promise<{ value: T | null; metadata: Record<string, any> | null }> {
    const stored = this.store.get(key);
    if (!stored) return { value: null, metadata: null };

    return {
      value: stored.value as T,
      metadata: stored.metadata || null,
    };
  }
}

// ============================================================================
// Cloudflare KV Wrapper
// ============================================================================

export function createCloudflareKV(binding: any): KVStore {
  return {
    async get<T = string>(key: string, options?: KVGetOptions): Promise<T | null> {
      return binding.get(key, options);
    },

    async put(key: string, value: string | ArrayBuffer | ReadableStream, options?: KVPutOptions): Promise<void> {
      await binding.put(key, value, options);
    },

    async delete(key: string): Promise<void> {
      await binding.delete(key);
    },

    async list(options?: KVListOptions): Promise<KVListResult> {
      const result = await binding.list(options);
      return {
        keys: result.keys,
        cursor: result.cursor,
        complete: result.list_complete,
      };
    },

    async getWithMetadata<T = string>(key: string): Promise<{ value: T | null; metadata: Record<string, any> | null }> {
      return binding.getWithMetadata(key);
    },
  };
}

// ============================================================================
// Durable Objects Pattern
// ============================================================================

export interface DurableObjectState {
  storage: DurableStorage;
  id: string;
}

export interface DurableStorage {
  get<T>(key: string): Promise<T | undefined>;
  get<T>(keys: string[]): Promise<Map<string, T>>;
  put<T>(key: string, value: T): Promise<void>;
  put<T>(entries: Record<string, T>): Promise<void>;
  delete(key: string): Promise<boolean>;
  delete(keys: string[]): Promise<number>;
  list<T>(options?: { prefix?: string; limit?: number; start?: string; end?: string }): Promise<Map<string, T>>;
  transaction<T>(closure: (txn: DurableStorage) => Promise<T>): Promise<T>;
}

export abstract class DurableObject {
  protected state: DurableObjectState;

  constructor(state: DurableObjectState) {
    this.state = state;
  }

  abstract fetch(request: Request): Promise<Response>;

  protected async alarm?(): Promise<void>;
}

// ============================================================================
// In-Memory Durable Storage
// ============================================================================

export class MemoryDurableStorage implements DurableStorage {
  private store = new Map<string, any>();

  async get<T>(keyOrKeys: string | string[]): Promise<T | Map<string, T> | undefined> {
    if (Array.isArray(keyOrKeys)) {
      const result = new Map<string, T>();
      for (const key of keyOrKeys) {
        const value = this.store.get(key);
        if (value !== undefined) {
          result.set(key, value);
        }
      }
      return result;
    }
    return this.store.get(keyOrKeys);
  }

  async put<T>(keyOrEntries: string | Record<string, T>, value?: T): Promise<void> {
    if (typeof keyOrEntries === 'string') {
      this.store.set(keyOrEntries, value);
    } else {
      for (const [k, v] of Object.entries(keyOrEntries)) {
        this.store.set(k, v);
      }
    }
  }

  async delete(key: string): Promise<boolean>;
  async delete(keys: string[]): Promise<number>;
  async delete(keyOrKeys: string | string[]): Promise<boolean | number> {
    if (Array.isArray(keyOrKeys)) {
      let count = 0;
      for (const key of keyOrKeys) {
        if (this.store.delete(key)) count++;
      }
      return count;
    }
    return this.store.delete(keyOrKeys);
  }

  async list<T>(options?: { prefix?: string; limit?: number; start?: string; end?: string }): Promise<Map<string, T>> {
    const result = new Map<string, T>();
    const prefix = options?.prefix || '';
    const limit = options?.limit || Infinity;

    let count = 0;
    for (const [key, value] of this.store) {
      if (count >= limit) break;
      if (!key.startsWith(prefix)) continue;
      if (options?.start && key < options.start) continue;
      if (options?.end && key >= options.end) continue;
      result.set(key, value);
      count++;
    }

    return result;
  }

  async transaction<T>(closure: (txn: DurableStorage) => Promise<T>): Promise<T> {
    // Simple implementation - no true atomicity in memory
    return closure(this);
  }
}

// ============================================================================
// Queue System
// ============================================================================

export interface QueueMessage<T = any> {
  id: string;
  body: T;
  timestamp: number;
  retries: number;
}

export interface QueueOptions {
  maxRetries?: number;
  retryDelay?: number;
  deadLetterQueue?: EdgeQueue<any>;
}

export interface EdgeQueue<T = any> {
  send(message: T): Promise<void>;
  sendBatch(messages: T[]): Promise<void>;
  consume(handler: (batch: QueueMessage<T>[]) => Promise<void>): void;
}

export class MemoryQueue<T = any> implements EdgeQueue<T> {
  private queue: QueueMessage<T>[] = [];
  private handler?: (batch: QueueMessage<T>[]) => Promise<void>;
  private options: QueueOptions;
  private processing = false;

  constructor(options: QueueOptions = {}) {
    this.options = {
      maxRetries: options.maxRetries || 3,
      retryDelay: options.retryDelay || 1000,
    };
    if (options.deadLetterQueue) {
      this.options.deadLetterQueue = options.deadLetterQueue;
    }
  }

  async send(message: T): Promise<void> {
    this.queue.push({
      id: Math.random().toString(36).slice(2),
      body: message,
      timestamp: Date.now(),
      retries: 0,
    });
    this.process();
  }

  async sendBatch(messages: T[]): Promise<void> {
    for (const message of messages) {
      await this.send(message);
    }
  }

  consume(handler: (batch: QueueMessage<T>[]) => Promise<void>): void {
    this.handler = handler;
    this.process();
  }

  private async process(): Promise<void> {
    if (this.processing || !this.handler || this.queue.length === 0) return;

    this.processing = true;

    try {
      const batch = this.queue.splice(0, 10); // Process in batches of 10

      try {
        await this.handler(batch);
      } catch (error) {
        // Retry failed messages
        for (const msg of batch) {
          if (msg.retries < (this.options.maxRetries || 3)) {
            msg.retries++;
            setTimeout(() => {
              this.queue.push(msg);
              this.process();
            }, this.options.retryDelay || 1000);
          } else if (this.options.deadLetterQueue) {
            await this.options.deadLetterQueue.send(msg.body);
          }
        }
      }
    } finally {
      this.processing = false;
      if (this.queue.length > 0) {
        setTimeout(() => this.process(), 0);
      }
    }
  }
}

// ============================================================================
// Cron / Scheduled Tasks
// ============================================================================

export interface CronJob {
  id: string;
  schedule: string;
  handler: () => Promise<void>;
  enabled: boolean;
  lastRun?: Date;
  nextRun?: Date;
}

export class CronScheduler {
  private jobs = new Map<string, CronJob>();
  private timers = new Map<string, ReturnType<typeof setTimeout>>();

  register(id: string, schedule: string, handler: () => Promise<void>): void {
    this.jobs.set(id, {
      id,
      schedule,
      handler,
      enabled: true,
    });
    this.scheduleNext(id);
  }

  unregister(id: string): void {
    this.jobs.delete(id);
    const timer = this.timers.get(id);
    if (timer) clearTimeout(timer);
    this.timers.delete(id);
  }

  enable(id: string): void {
    const job = this.jobs.get(id);
    if (job) {
      job.enabled = true;
      this.scheduleNext(id);
    }
  }

  disable(id: string): void {
    const job = this.jobs.get(id);
    if (job) {
      job.enabled = false;
      const timer = this.timers.get(id);
      if (timer) clearTimeout(timer);
      this.timers.delete(id);
    }
  }

  private scheduleNext(id: string): void {
    const job = this.jobs.get(id);
    if (!job || !job.enabled) return;

    const nextRun = this.parseSchedule(job.schedule);
    job.nextRun = nextRun;

    const delay = nextRun.getTime() - Date.now();
    if (delay <= 0) return;

    const timer = setTimeout(async () => {
      job.lastRun = new Date();
      try {
        await job.handler();
      } catch (error) {
        console.error(`Cron job ${id} failed:`, error);
      }
      this.scheduleNext(id);
    }, delay);

    this.timers.set(id, timer);
  }

  private parseSchedule(schedule: string): Date {
    // Simple implementation - for production use a proper cron parser
    const parts = schedule.split(' ');
    const now = new Date();

    if (parts.length === 1 && parts[0]!.endsWith('s')) {
      // Simple interval: "30s", "60s"
      const seconds = parseInt(parts[0]!);
      return new Date(now.getTime() + seconds * 1000);
    }

    if (parts.length === 1 && parts[0]!.endsWith('m')) {
      const minutes = parseInt(parts[0]!);
      return new Date(now.getTime() + minutes * 60 * 1000);
    }

    if (parts.length === 1 && parts[0]!.endsWith('h')) {
      const hours = parseInt(parts[0]!);
      return new Date(now.getTime() + hours * 60 * 60 * 1000);
    }

    // Default: run in 1 minute
    return new Date(now.getTime() + 60 * 1000);
  }

  getJobs(): CronJob[] {
    return Array.from(this.jobs.values());
  }
}

// ============================================================================
// D1 Database (SQLite at the edge)
// ============================================================================

export interface D1Database {
  prepare(query: string): D1PreparedStatement;
  batch<T = unknown>(statements: D1PreparedStatement[]): Promise<D1Result<T>[]>;
  exec(query: string): Promise<D1ExecResult>;
}

export interface D1PreparedStatement {
  bind(...values: any[]): D1PreparedStatement;
  first<T = unknown>(column?: string): Promise<T | null>;
  all<T = unknown>(): Promise<D1Result<T>>;
  raw<T = unknown>(): Promise<T[]>;
  run(): Promise<D1Result>;
}

export interface D1Result<T = unknown> {
  results: T[];
  success: boolean;
  meta: {
    duration: number;
    changes: number;
    last_row_id: number;
  };
}

export interface D1ExecResult {
  count: number;
  duration: number;
}

// ============================================================================
// useEdgeKV Hook
// ============================================================================

export function useEdgeKV<T = any>(store: KVStore, key: string) {
  const data = signal<T | null>(null);
  const isLoading = signal(false);
  const error = signal<Error | null>(null);

  const fetch = async () => {
    isLoading.set(true);
    error.set(null);

    try {
      const value = await store.get<T>(key, { type: 'json' });
      data.set(value);
    } catch (e) {
      error.set(e instanceof Error ? e : new Error(String(e)));
    } finally {
      isLoading.set(false);
    }
  };

  const set = async (value: T) => {
    isLoading.set(true);
    error.set(null);

    try {
      await store.put(key, JSON.stringify(value));
      data.set(value);
    } catch (e) {
      error.set(e instanceof Error ? e : new Error(String(e)));
    } finally {
      isLoading.set(false);
    }
  };

  const remove = async () => {
    isLoading.set(true);
    error.set(null);

    try {
      await store.delete(key);
      data.set(null);
    } catch (e) {
      error.set(e instanceof Error ? e : new Error(String(e)));
    } finally {
      isLoading.set(false);
    }
  };

  return {
    data: () => data(),
    isLoading: () => isLoading(),
    error: () => error(),
    fetch,
    set,
    remove,
  };
}

// ============================================================================
// Re-exports from specialized modules
// ============================================================================

export * from './geo-routing.js';
export * from './prefetch.js';
export * from './streaming.js';
export * from './state-replication.js';
export * from './smart-cache.js';
export * from './rate-limiter.js';
export * from './edge-functions.js';

// ============================================================================
// Exports - All types and classes defined above are already exported inline
// ============================================================================
