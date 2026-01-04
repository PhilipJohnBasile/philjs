/**
 * PhilJS Cloudflare Pages Adapter
 *
 * Full-featured Cloudflare Pages deployment with:
 * - KV bindings support
 * - D1 database support
 * - R2 storage support
 * - Durable Objects support
 * - Static asset handling
 */
import type { Adapter, AdapterConfig, EdgeAdapter } from '../types.js';
export interface CloudflarePagesConfig extends AdapterConfig {
    /** Output directory for build artifacts */
    outDir?: string;
    /** KV namespace bindings */
    kv?: Array<{
        binding: string;
        id: string;
        preview_id?: string;
    }>;
    /** D1 database bindings */
    d1?: Array<{
        binding: string;
        database_id: string;
        database_name: string;
        preview_database_id?: string;
    }>;
    /** R2 bucket bindings */
    r2?: Array<{
        binding: string;
        bucket_name: string;
        preview_bucket_name?: string;
    }>;
    /** Durable Objects bindings */
    durableObjects?: Array<{
        binding: string;
        class_name: string;
        script_name?: string;
        environment?: string;
    }>;
    /** Service bindings */
    services?: Array<{
        binding: string;
        service: string;
        environment?: string;
    }>;
    /** Queue bindings */
    queues?: {
        producers?: Array<{
            binding: string;
            queue: string;
        }>;
        consumers?: Array<{
            queue: string;
            max_batch_size?: number;
            max_batch_timeout?: number;
            max_retries?: number;
            dead_letter_queue?: string;
        }>;
    };
    /** Analytics Engine bindings */
    analytics?: Array<{
        binding: string;
        dataset?: string;
    }>;
    /** Environment variables */
    vars?: Record<string, string>;
    /** Compatibility date */
    compatibilityDate?: string;
    /** Compatibility flags */
    compatibilityFlags?: string[];
    /** Static asset patterns to exclude from routing */
    excludeAssets?: string[];
    /** Custom _routes.json configuration */
    routes?: {
        include?: string[];
        exclude?: string[];
    };
    /** Enable Wrangler configuration generation */
    generateWranglerConfig?: boolean;
}
export declare function cloudflarePagesAdapter(config?: CloudflarePagesConfig): Adapter & EdgeAdapter;
export declare function getCloudflareEnv<T = any>(): T;
export declare function getExecutionContext(): ExecutionContext | undefined;
export declare function waitUntil(promise: Promise<any>): void;
export declare function passThroughOnException(): void;
export declare function createKVNamespace<T = any>(namespace: KVNamespace): {
    get: (key: string) => Promise<string | null>;
    getJSON: <V = T>(key: string) => Promise<V | null>;
    getText: (key: string) => Promise<string | null>;
    getArrayBuffer: (key: string) => Promise<ArrayBuffer | null>;
    getStream: (key: string) => Promise<ReadableStream<any> | null>;
    put: (key: string, value: string | ArrayBuffer | ReadableStream, options?: KVNamespacePutOptions) => Promise<void>;
    delete: (key: string) => Promise<void>;
    list: (options?: KVNamespaceListOptions) => Promise<KVNamespaceListResult>;
};
export declare function createD1Database(database: D1Database): {
    prepare: (query: string) => D1PreparedStatement;
    exec: (query: string) => Promise<D1ExecResult>;
    batch: <T = any>(statements: D1PreparedStatement[]) => Promise<D1Result<T>[]>;
    dump: () => Promise<ArrayBuffer>;
};
export declare function createR2Bucket(bucket: R2Bucket): {
    get: (key: string, options?: R2GetOptions) => Promise<R2ObjectBody | null>;
    put: (key: string, value: ReadableStream | ArrayBuffer | string, options?: R2PutOptions) => Promise<R2Object>;
    delete: (keys: string | string[]) => Promise<void>;
    list: (options?: R2ListOptions) => Promise<R2Objects>;
    head: (key: string) => Promise<R2Object | null>;
};
export interface KVNamespace {
    get(key: string): Promise<string | null>;
    get(key: string, type: 'text'): Promise<string | null>;
    get(key: string, type: 'json'): Promise<any>;
    get(key: string, type: 'arrayBuffer'): Promise<ArrayBuffer | null>;
    get(key: string, type: 'stream'): Promise<ReadableStream | null>;
    get(key: string, options: {
        type: 'text';
    }): Promise<string | null>;
    get(key: string, options: {
        type: 'json';
    }): Promise<any>;
    get(key: string, options: {
        type: 'arrayBuffer';
    }): Promise<ArrayBuffer | null>;
    get(key: string, options: {
        type: 'stream';
    }): Promise<ReadableStream | null>;
    get<T>(key: string, type: 'json'): Promise<T | null>;
    put(key: string, value: string | ArrayBuffer | ReadableStream, options?: KVNamespacePutOptions): Promise<void>;
    delete(key: string): Promise<void>;
    list(options?: KVNamespaceListOptions): Promise<KVNamespaceListResult>;
}
export interface KVNamespacePutOptions {
    expiration?: number;
    expirationTtl?: number;
    metadata?: any;
}
export interface KVNamespaceListOptions {
    prefix?: string;
    limit?: number;
    cursor?: string;
}
export interface KVNamespaceListResult {
    keys: Array<{
        name: string;
        expiration?: number;
        metadata?: any;
    }>;
    list_complete: boolean;
    cursor?: string;
}
export interface D1Database {
    prepare(query: string): D1PreparedStatement;
    exec(query: string): Promise<D1ExecResult>;
    batch<T = any>(statements: D1PreparedStatement[]): Promise<D1Result<T>[]>;
    dump(): Promise<ArrayBuffer>;
}
export interface D1PreparedStatement {
    bind(...values: any[]): D1PreparedStatement;
    first<T = any>(colName?: string): Promise<T | null>;
    run<T = any>(): Promise<D1Result<T>>;
    all<T = any>(): Promise<D1Result<T>>;
    raw<T = any>(): Promise<T[]>;
}
export interface D1Result<T = any> {
    results?: T[];
    success: boolean;
    meta: {
        duration: number;
        rows_read: number;
        rows_written: number;
    };
}
export interface D1ExecResult {
    count: number;
    duration: number;
}
export interface R2Bucket {
    get(key: string, options?: R2GetOptions): Promise<R2ObjectBody | null>;
    put(key: string, value: ReadableStream | ArrayBuffer | string, options?: R2PutOptions): Promise<R2Object>;
    delete(keys: string | string[]): Promise<void>;
    list(options?: R2ListOptions): Promise<R2Objects>;
    head(key: string): Promise<R2Object | null>;
}
export interface R2GetOptions {
    onlyIf?: R2Conditional;
    range?: R2Range;
}
export interface R2PutOptions {
    httpMetadata?: R2HTTPMetadata;
    customMetadata?: Record<string, string>;
    md5?: ArrayBuffer | string;
    sha1?: ArrayBuffer | string;
    sha256?: ArrayBuffer | string;
    sha384?: ArrayBuffer | string;
    sha512?: ArrayBuffer | string;
}
export interface R2ListOptions {
    limit?: number;
    prefix?: string;
    cursor?: string;
    delimiter?: string;
    include?: ('httpMetadata' | 'customMetadata')[];
}
export interface R2Object {
    key: string;
    version: string;
    size: number;
    etag: string;
    httpEtag: string;
    uploaded: Date;
    httpMetadata?: R2HTTPMetadata;
    customMetadata?: Record<string, string>;
    range?: R2Range;
    checksums: {
        md5?: ArrayBuffer;
        sha1?: ArrayBuffer;
        sha256?: ArrayBuffer;
        sha384?: ArrayBuffer;
        sha512?: ArrayBuffer;
    };
}
export interface R2ObjectBody extends R2Object {
    body: ReadableStream;
    bodyUsed: boolean;
    arrayBuffer(): Promise<ArrayBuffer>;
    text(): Promise<string>;
    json<T = any>(): Promise<T>;
    blob(): Promise<Blob>;
}
export interface R2Objects {
    objects: R2Object[];
    truncated: boolean;
    cursor?: string;
    delimitedPrefixes: string[];
}
export interface R2HTTPMetadata {
    contentType?: string;
    contentLanguage?: string;
    contentDisposition?: string;
    contentEncoding?: string;
    cacheControl?: string;
    cacheExpiry?: Date;
}
export interface R2Conditional {
    etagMatches?: string;
    etagDoesNotMatch?: string;
    uploadedBefore?: Date;
    uploadedAfter?: Date;
}
export interface R2Range {
    offset?: number;
    length?: number;
    suffix?: number;
}
export interface ExecutionContext {
    waitUntil(promise: Promise<any>): void;
    passThroughOnException(): void;
}
export default cloudflarePagesAdapter;
//# sourceMappingURL=index.d.ts.map