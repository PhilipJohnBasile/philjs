/**
 * PhilJS Cloudflare Adapter
 *
 * Deploy to Cloudflare Workers and Pages
 */
import type { Adapter, AdapterConfig, EdgeAdapter } from '../types.js';
export interface CloudflareConfig extends AdapterConfig {
    /** Deploy as Pages (default) or Workers */
    mode?: 'pages' | 'workers';
    /** Use Workers Sites for static assets */
    sites?: boolean;
    /** KV namespace bindings */
    kv?: Array<{
        binding: string;
        id: string;
        preview_id?: string;
    }>;
    /** Durable Objects bindings */
    durableObjects?: Array<{
        binding: string;
        class_name: string;
        script_name?: string;
    }>;
    /** R2 bucket bindings */
    r2?: Array<{
        binding: string;
        bucket_name: string;
    }>;
    /** D1 database bindings */
    d1?: Array<{
        binding: string;
        database_id: string;
        database_name: string;
    }>;
    /** Environment variables */
    vars?: Record<string, string>;
    /** Compatibility date */
    compatibilityDate?: string;
    /** Compatibility flags */
    compatibilityFlags?: string[];
    /** Routes */
    routes?: string[];
}
export declare function cloudflareAdapter(config?: CloudflareConfig): Adapter & EdgeAdapter;
export declare function getCloudflareEnv<T = unknown>(): T;
export declare function getExecutionContext(): any;
export declare function waitUntil(promise: Promise<unknown>): void;
export declare function createKVHelper(namespace: KVNamespace): {
    get: (key: string) => Promise<string | null>;
    getJSON: <T>(key: string) => Promise<T | null>;
    put: (key: string, value: string, options?: KVNamespacePutOptions) => Promise<void>;
    delete: (key: string) => Promise<void>;
    list: (options?: KVNamespaceListOptions) => Promise<{
        keys: {
            name: string;
        }[];
    }>;
};
interface KVNamespace {
    get(key: string, options?: {
        type?: 'text' | 'json' | 'arrayBuffer' | 'stream';
    }): Promise<string | null>;
    get<T>(key: string, type: 'json'): Promise<T | null>;
    put(key: string, value: string, options?: KVNamespacePutOptions): Promise<void>;
    delete(key: string): Promise<void>;
    list(options?: KVNamespaceListOptions): Promise<{
        keys: {
            name: string;
        }[];
    }>;
}
interface KVNamespacePutOptions {
    expiration?: number;
    expirationTtl?: number;
    metadata?: Record<string, unknown>;
}
interface KVNamespaceListOptions {
    prefix?: string;
    limit?: number;
    cursor?: string;
}
export default cloudflareAdapter;
//# sourceMappingURL=index.d.ts.map