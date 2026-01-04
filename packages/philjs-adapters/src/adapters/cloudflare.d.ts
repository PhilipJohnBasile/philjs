/**
 * PhilJS Cloudflare Adapter
 *
 * Production-ready deployment adapter for Cloudflare with:
 * - Workers support
 * - Pages deployment
 * - KV storage integration
 * - D1 database integration
 * - Durable Objects support
 * - R2 object storage
 * - Queues integration
 * - wrangler.toml generation
 *
 * @module philjs-adapters/adapters/cloudflare
 */
import type { Adapter, AdapterConfig, EdgeAdapter } from '../types.js';
/**
 * Configuration options for the Cloudflare adapter
 */
export interface CloudflareAdapterConfig extends AdapterConfig {
    /** Deployment mode: 'workers' for Workers, 'pages' for Pages */
    mode?: 'workers' | 'pages';
    /** Account ID (for programmatic deployment) */
    accountId?: string;
    /** Worker/Pages project name */
    projectName?: string;
    /** Compatibility date */
    compatibilityDate?: string;
    /** Compatibility flags */
    compatibilityFlags?: string[];
    /** KV namespace bindings */
    kv?: KVNamespaceBinding[];
    /** D1 database bindings */
    d1?: D1DatabaseBinding[];
    /** Durable Objects bindings */
    durableObjects?: DurableObjectBinding[];
    /** R2 bucket bindings */
    r2?: R2BucketBinding[];
    /** Queue bindings */
    queues?: QueueBinding[];
    /** Service bindings */
    services?: ServiceBinding[];
    /** Analytics Engine bindings */
    analyticsEngine?: AnalyticsEngineBinding[];
    /** Environment variables */
    vars?: Record<string, string>;
    /** Secrets (names only - values set via wrangler) */
    secrets?: string[];
    /** Routes for Workers (not Pages) */
    routes?: RouteConfig[];
    /** Custom domains */
    customDomains?: string[];
    /** Workers Sites configuration (legacy) */
    site?: SiteConfig;
    /** Usage model: 'bundled' or 'unbound' */
    usageModel?: 'bundled' | 'unbound';
    /** Enable Cron Triggers */
    triggers?: CronTrigger[];
    /** Enable Smart Placement */
    placement?: PlacementConfig;
    /** Node.js compatibility mode */
    nodeCompat?: boolean;
    /** Generate wrangler.toml */
    generateConfig?: boolean;
    /** Build configuration */
    build?: BuildConfig;
    /** Development configuration */
    dev?: DevConfig;
}
/**
 * KV namespace binding configuration
 */
export interface KVNamespaceBinding {
    /** Binding name to use in code */
    binding: string;
    /** KV namespace ID */
    id: string;
    /** Preview namespace ID (for local dev) */
    previewId?: string;
}
/**
 * D1 database binding configuration
 */
export interface D1DatabaseBinding {
    /** Binding name to use in code */
    binding: string;
    /** D1 database ID */
    databaseId: string;
    /** Database name */
    databaseName: string;
    /** Enable migrations */
    migrationsDir?: string;
}
/**
 * Durable Object binding configuration
 */
export interface DurableObjectBinding {
    /** Binding name to use in code */
    binding: string;
    /** Durable Object class name */
    className: string;
    /** Script name (for external DO) */
    scriptName?: string;
    /** Environment (for external DO) */
    environment?: string;
}
/**
 * R2 bucket binding configuration
 */
export interface R2BucketBinding {
    /** Binding name to use in code */
    binding: string;
    /** R2 bucket name */
    bucketName: string;
    /** Preview bucket name */
    previewBucketName?: string;
    /** Jurisdiction */
    jurisdiction?: string;
}
/**
 * Queue binding configuration
 */
export interface QueueBinding {
    /** Binding name to use in code */
    binding: string;
    /** Queue name */
    queue: string;
    /** Delivery delay in seconds */
    deliveryDelay?: number;
}
/**
 * Service binding configuration
 */
export interface ServiceBinding {
    /** Binding name to use in code */
    binding: string;
    /** Service name */
    service: string;
    /** Environment */
    environment?: string;
}
/**
 * Analytics Engine binding
 */
export interface AnalyticsEngineBinding {
    /** Binding name to use in code */
    binding: string;
    /** Dataset name */
    dataset: string;
}
/**
 * Route configuration for Workers
 */
export interface RouteConfig {
    /** Route pattern */
    pattern: string;
    /** Zone ID (optional) */
    zoneId?: string;
    /** Zone name (optional) */
    zoneName?: string;
    /** Custom domain */
    customDomain?: boolean;
}
/**
 * Workers Sites configuration
 */
export interface SiteConfig {
    /** Bucket path for static assets */
    bucket: string;
    /** Include patterns */
    include?: string[];
    /** Exclude patterns */
    exclude?: string[];
}
/**
 * Cron trigger configuration
 */
export interface CronTrigger {
    /** Cron expression */
    cron: string;
}
/**
 * Smart Placement configuration
 */
export interface PlacementConfig {
    /** Placement mode */
    mode: 'smart';
}
/**
 * Build configuration
 */
export interface BuildConfig {
    /** Build command */
    command?: string;
    /** Watch directories */
    watch?: string[];
    /** Upload rules */
    upload?: {
        include?: string[];
        exclude?: string[];
    };
}
/**
 * Development configuration
 */
export interface DevConfig {
    /** Local port */
    port?: number;
    /** Local host */
    host?: string;
    /** Inspector port */
    inspectorPort?: number;
    /** Local protocol */
    localProtocol?: 'http' | 'https';
}
/**
 * Create a Cloudflare deployment adapter
 *
 * @example
 * ```typescript
 * import { cloudflareAdapter } from 'philjs-adapters/adapters/cloudflare';
 *
 * export default defineConfig({
 *   adapter: cloudflareAdapter({
 *     mode: 'pages',
 *     d1: [{
 *       binding: 'DB',
 *       databaseId: 'xxxx-xxxx-xxxx',
 *       databaseName: 'my-database',
 *     }],
 *     kv: [{
 *       binding: 'CACHE',
 *       id: 'xxxx-xxxx-xxxx',
 *     }],
 *   }),
 * });
 * ```
 */
export declare function cloudflareAdapter(config?: CloudflareAdapterConfig): Adapter & EdgeAdapter;
/**
 * Get Cloudflare environment bindings
 */
export declare function getCloudflareEnv<T = unknown>(): T;
/**
 * Get the execution context
 */
export declare function getExecutionContext(): {
    waitUntil: (promise: Promise<unknown>) => void;
    passThroughOnException: () => void;
} | undefined;
/**
 * Execute a promise in the background
 */
export declare function waitUntil(promise: Promise<unknown>): void;
/**
 * Create a KV helper with type safety
 */
export declare function createKVHelper<T = unknown>(namespace: KVNamespace): KVHelper<T>;
/**
 * Create a D1 helper with type safety
 */
export declare function createD1Helper(database: D1Database): D1Helper;
/**
 * Create an R2 helper with type safety
 */
export declare function createR2Helper(bucket: R2Bucket): R2Helper;
/**
 * Get a Durable Object stub
 */
export declare function getDurableObject<T = unknown>(namespace: DurableObjectNamespace, id: string | DurableObjectId): DurableObjectStub;
interface KVNamespace {
    get(key: string, type?: 'text' | 'json' | 'arrayBuffer' | 'stream'): Promise<any>;
    getWithMetadata(key: string, type?: 'text' | 'json' | 'arrayBuffer' | 'stream'): Promise<any>;
    put(key: string, value: string | ArrayBuffer | ReadableStream, options?: KVPutOptions): Promise<void>;
    delete(key: string): Promise<void>;
    list(options?: KVListOptions): Promise<KVListResult>;
}
interface KVPutOptions {
    expiration?: number;
    expirationTtl?: number;
    metadata?: Record<string, unknown>;
}
interface KVListOptions {
    prefix?: string;
    limit?: number;
    cursor?: string;
}
interface KVListResult {
    keys: Array<{
        name: string;
        expiration?: number;
        metadata?: unknown;
    }>;
    list_complete: boolean;
    cursor?: string;
}
interface KVHelper<T> {
    get(key: string): Promise<T | null>;
    getText(key: string): Promise<string | null>;
    getWithMetadata(key: string): Promise<{
        value: T | null;
        metadata: unknown;
    }>;
    put(key: string, value: T, options?: KVPutOptions): Promise<void>;
    delete(key: string): Promise<void>;
    list(options?: KVListOptions): Promise<KVListResult>;
}
interface D1Database {
    prepare(sql: string): D1PreparedStatement;
    batch<T>(statements: D1PreparedStatement[]): Promise<D1Result<T>[]>;
}
interface D1PreparedStatement {
    bind(...params: unknown[]): D1PreparedStatement;
    first<T>(column?: string): Promise<T | null>;
    all<T>(): Promise<D1Result<T>>;
    run(): Promise<D1RunResult>;
}
interface D1Result<T> {
    results: T[];
    success: boolean;
    meta: Record<string, unknown>;
}
interface D1RunResult {
    success: boolean;
    meta: {
        changes: number;
        last_row_id: number;
        duration: number;
    };
}
interface D1Helper {
    query<T = unknown>(sql: string, ...params: unknown[]): Promise<T[]>;
    queryFirst<T = unknown>(sql: string, ...params: unknown[]): Promise<T | null>;
    run(sql: string, ...params: unknown[]): Promise<D1RunResult>;
    batch<T = unknown>(statements: D1PreparedStatement[]): Promise<D1Result<T>[]>;
    prepare(sql: string): D1PreparedStatement;
}
interface R2Bucket {
    get(key: string): Promise<R2ObjectBody | null>;
    put(key: string, value: ReadableStream | ArrayBuffer | string, options?: R2PutOptions): Promise<R2Object>;
    delete(key: string): Promise<void>;
    list(options?: R2ListOptions): Promise<R2Objects>;
    head(key: string): Promise<R2Object | null>;
}
interface R2Object {
    key: string;
    size: number;
    etag: string;
    httpEtag: string;
    uploaded: Date;
    httpMetadata?: Record<string, string>;
    customMetadata?: Record<string, string>;
}
interface R2ObjectBody extends R2Object {
    body: ReadableStream;
    arrayBuffer(): Promise<ArrayBuffer>;
    text(): Promise<string>;
    json<T>(): Promise<T>;
}
interface R2PutOptions {
    httpMetadata?: Record<string, string>;
    customMetadata?: Record<string, string>;
    md5?: string;
}
interface R2ListOptions {
    prefix?: string;
    limit?: number;
    cursor?: string;
    delimiter?: string;
    include?: ('httpMetadata' | 'customMetadata')[];
}
interface R2Objects {
    objects: R2Object[];
    truncated: boolean;
    cursor?: string;
    delimitedPrefixes: string[];
}
interface R2Helper {
    get(key: string): Promise<R2ObjectBody | null>;
    put(key: string, value: ReadableStream | ArrayBuffer | string, options?: R2PutOptions): Promise<R2Object>;
    delete(key: string): Promise<void>;
    list(options?: R2ListOptions): Promise<R2Objects>;
    head(key: string): Promise<R2Object | null>;
}
interface DurableObjectNamespace {
    idFromName(name: string): DurableObjectId;
    idFromString(id: string): DurableObjectId;
    newUniqueId(): DurableObjectId;
    get(id: DurableObjectId): DurableObjectStub;
}
interface DurableObjectId {
    toString(): string;
}
interface DurableObjectStub {
    fetch(request: Request | string, init?: RequestInit): Promise<Response>;
}
export default cloudflareAdapter;
//# sourceMappingURL=cloudflare.d.ts.map