/**
 * PhilJS Deno 2 Adapter
 *
 * Deploy PhilJS applications using Deno's native server
 *
 * Features:
 * - Deno.serve() integration
 * - Deno KV for caching
 * - Deno Deploy ready
 * - Permission-aware
 * - npm compatibility mode
 */
import type { Adapter, AdapterConfig } from '../types.js';
export interface DenoConfig extends AdapterConfig {
    /** Port to listen on */
    port?: number;
    /** Hostname to bind to */
    hostname?: string;
    /** Enable Deno KV for caching */
    kv?: boolean | string;
    /** Static file directory */
    staticDir?: string;
    /** Enable compression */
    compression?: boolean;
    /** Deno Deploy specific options */
    deploy?: DenoDeployConfig;
    /** TLS configuration */
    tls?: {
        key: string;
        cert: string;
    };
    /** Signal for graceful shutdown */
    signal?: AbortSignal;
    /** Callback when server starts listening */
    onListen?: (params: {
        hostname: string;
        port: number;
    }) => void;
    /** Handler for errors */
    onError?: (error: Error) => Response | Promise<Response>;
}
export interface DenoDeployConfig {
    /** Project name for Deno Deploy */
    project?: string;
    /** Enable edge caching */
    edgeCache?: boolean;
    /** KV database name */
    kvDatabase?: string;
}
export interface DenoServeHandler {
    (request: Request, info?: DenoServeHandlerInfo): Promise<Response> | Response;
}
export interface DenoServeHandlerInfo {
    remoteAddr: {
        hostname: string;
        port: number;
        transport: 'tcp' | 'udp';
    };
}
export interface DenoKv {
    get: <T = unknown>(key: string[]) => Promise<{
        value: T | null;
        versionstamp: string | null;
    }>;
    set: (key: string[], value: unknown) => Promise<{
        ok: boolean;
        versionstamp: string;
    }>;
    delete: (key: string[]) => Promise<void>;
    list: <T = unknown>(selector: {
        prefix: string[];
    }) => AsyncIterable<{
        key: string[];
        value: T;
        versionstamp: string;
    }>;
    atomic: () => DenoKvAtomic;
    close: () => void;
}
export interface DenoKvAtomic {
    check: (entry: {
        key: string[];
        versionstamp: string | null;
    }) => DenoKvAtomic;
    set: (key: string[], value: unknown) => DenoKvAtomic;
    delete: (key: string[]) => DenoKvAtomic;
    commit: () => Promise<{
        ok: boolean;
        versionstamp?: string;
    }>;
}
/**
 * Create a Deno adapter handler for PhilJS
 *
 * @example
 * ```typescript
 * import { createDenoAdapter } from 'philjs-adapters/deno';
 *
 * const handler = createDenoAdapter({
 *   app: philJSApp,
 *   port: 8000,
 * });
 *
 * // Deno.serve compatible
 * Deno.serve(handler);
 * ```
 */
export declare function createDenoAdapter(config?: DenoConfig): DenoServeHandler;
/**
 * Start a Deno server with the PhilJS adapter
 *
 * @example
 * ```typescript
 * import { startDenoServer } from 'philjs-adapters/deno';
 *
 * startDenoServer({
 *   port: 8000,
 *   kv: true,
 * });
 * ```
 */
export declare function startDenoServer(config?: DenoConfig): void;
/**
 * Create Deno KV helpers for caching and state management
 *
 * @example
 * ```typescript
 * import { createDenoKV } from 'philjs-adapters/deno';
 *
 * const kv = await createDenoKV();
 *
 * // Set a value
 * await kv.set(['users', 'user-1'], { name: 'John' });
 *
 * // Get a value
 * const user = await kv.get(['users', 'user-1']);
 *
 * // Cache with TTL
 * await kv.setWithTTL(['cache', 'api-response'], data, 60000); // 60 seconds
 * ```
 */
export declare function createDenoKV(path?: string): Promise<{
    kv: DenoKv;
    /**
     * Get a value by key
     */
    get<T = unknown>(key: string[]): Promise<T | null>;
    /**
     * Set a value by key
     */
    set(key: string[], value: unknown): Promise<void>;
    /**
     * Set a value with TTL (time-to-live)
     */
    setWithTTL(key: string[], value: unknown, ttlMs: number): Promise<void>;
    /**
     * Get a value with TTL check
     */
    getWithTTL<T = unknown>(key: string[]): Promise<T | null>;
    /**
     * Delete a value by key
     */
    delete(key: string[]): Promise<void>;
    /**
     * List values by prefix
     * ES2024: Uses Array.fromAsync for cleaner async collection
     */
    list<T = unknown>(prefix: string[]): Promise<Array<{
        key: string[];
        value: T;
    }>>;
    /**
     * Atomic transaction
     */
    atomic(): DenoKvAtomic;
    /**
     * Close the KV connection
     */
    close(): void;
}>;
/**
 * Check Deno permissions
 *
 * @example
 * ```typescript
 * import { checkPermissions } from 'philjs-adapters/deno';
 *
 * const perms = await checkPermissions();
 * if (!perms.net) {
 *   console.log('Network permission required');
 * }
 * ```
 */
export declare function checkPermissions(): Promise<{
    read: boolean;
    write: boolean;
    net: boolean;
    env: boolean;
    run: boolean;
}>;
/**
 * Request a Deno permission
 */
export declare function requestPermission(name: 'read' | 'write' | 'net' | 'env' | 'run', path?: string): Promise<boolean>;
/**
 * Deno adapter factory for PhilJS build system
 */
export declare function denoAdapter(config?: DenoConfig): Adapter;
/**
 * Helper to check if running on Deno Deploy
 */
export declare function isDenoDeply(): boolean;
/**
 * Get Deno Deploy region
 */
export declare function getDenoDeployRegion(): string | undefined;
export default createDenoAdapter;
//# sourceMappingURL=index.d.ts.map