/**
 * PhilJS Edge - Edge Computing Primitives
 *
 * Unified API for edge computing across providers:
 * - Cloudflare Workers (KV, Durable Objects, D1, Queues, R2)
 * - Vercel Edge Config
 * - Deno KV
 * - Generic adapters
 */
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
export interface KVStore {
    get<T = string>(key: string, options?: KVGetOptions): Promise<T | null>;
    put(key: string, value: string | ArrayBuffer | ReadableStream, options?: KVPutOptions): Promise<void>;
    delete(key: string): Promise<void>;
    list(options?: KVListOptions): Promise<KVListResult>;
    getWithMetadata<T = string>(key: string): Promise<{
        value: T | null;
        metadata: Record<string, any> | null;
    }>;
}
export declare class MemoryKVStore implements KVStore {
    private store;
    get<T = string>(key: string, options?: KVGetOptions): Promise<T | null>;
    put(key: string, value: string | ArrayBuffer | ReadableStream, options?: KVPutOptions): Promise<void>;
    delete(key: string): Promise<void>;
    list(options?: KVListOptions): Promise<KVListResult>;
    getWithMetadata<T = string>(key: string): Promise<{
        value: T | null;
        metadata: Record<string, any> | null;
    }>;
}
export declare function createCloudflareKV(binding: any): KVStore;
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
    list<T>(options?: {
        prefix?: string;
        limit?: number;
        start?: string;
        end?: string;
    }): Promise<Map<string, T>>;
    transaction<T>(closure: (txn: DurableStorage) => Promise<T>): Promise<T>;
}
export declare abstract class DurableObject {
    protected state: DurableObjectState;
    constructor(state: DurableObjectState);
    abstract fetch(request: Request): Promise<Response>;
    protected alarm?(): Promise<void>;
}
export declare class MemoryDurableStorage implements DurableStorage {
    private store;
    get<T>(keyOrKeys: string | string[]): Promise<T | Map<string, T> | undefined>;
    put<T>(keyOrEntries: string | Record<string, T>, value?: T): Promise<void>;
    delete(key: string): Promise<boolean>;
    delete(keys: string[]): Promise<number>;
    list<T>(options?: {
        prefix?: string;
        limit?: number;
        start?: string;
        end?: string;
    }): Promise<Map<string, T>>;
    transaction<T>(closure: (txn: DurableStorage) => Promise<T>): Promise<T>;
}
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
export declare class MemoryQueue<T = any> implements EdgeQueue<T> {
    private queue;
    private handler?;
    private options;
    private processing;
    constructor(options?: QueueOptions);
    send(message: T): Promise<void>;
    sendBatch(messages: T[]): Promise<void>;
    consume(handler: (batch: QueueMessage<T>[]) => Promise<void>): void;
    private process;
}
export interface CronJob {
    id: string;
    schedule: string;
    handler: () => Promise<void>;
    enabled: boolean;
    lastRun?: Date;
    nextRun?: Date;
}
export declare class CronScheduler {
    private jobs;
    private timers;
    register(id: string, schedule: string, handler: () => Promise<void>): void;
    unregister(id: string): void;
    enable(id: string): void;
    disable(id: string): void;
    private scheduleNext;
    private parseSchedule;
    getJobs(): CronJob[];
}
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
export declare function useEdgeKV<T = any>(store: KVStore, key: string): {
    data: () => T | null;
    isLoading: () => boolean;
    error: () => Error | null;
    fetch: () => Promise<void>;
    set: (value: T) => Promise<void>;
    remove: () => Promise<void>;
};
export * from './geo-routing.js';
export * from './prefetch.js';
export * from './streaming.js';
export * from './state-replication.js';
export * from './smart-cache.js';
export * from './rate-limiter.js';
export * from './edge-functions.js';
//# sourceMappingURL=index.d.ts.map