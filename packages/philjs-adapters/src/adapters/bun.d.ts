/**
 * PhilJS Bun Adapter
 *
 * Production-ready deployment adapter for Bun with:
 * - Native Bun.serve() integration
 * - Fast file serving
 * - SQLite support
 * - WebSocket support
 * - Hot reload
 *
 * @module philjs-adapters/adapters/bun
 */
import type { Adapter, AdapterConfig } from '../types.js';
/**
 * Configuration options for the Bun adapter
 */
export interface BunAdapterConfig extends AdapterConfig {
    /** Port to listen on */
    port?: number;
    /** Hostname to bind to */
    hostname?: string;
    /** Enable development mode */
    development?: boolean;
    /** Static file directory */
    staticDir?: string;
    /** Enable compression */
    compression?: boolean;
    /** SQLite database path */
    sqlite?: string | SQLiteConfig;
    /** WebSocket configuration */
    websocket?: WebSocketConfig;
    /** TLS configuration */
    tls?: {
        key: string;
        cert: string;
        ca?: string;
        passphrase?: string;
    };
    /** Maximum request body size */
    maxRequestBodySize?: number;
    /** Idle timeout in seconds */
    idleTimeout?: number;
    /** Enable hot reload */
    hotReload?: boolean;
    /** Generate bunfig.toml */
    generateConfig?: boolean;
    /** Generate Dockerfile */
    generateDockerfile?: boolean;
    /** Bun-specific optimizations */
    optimizations?: BunOptimizations;
}
/**
 * SQLite configuration
 */
export interface SQLiteConfig {
    /** Database path */
    path: string;
    /** Create if not exists */
    create?: boolean;
    /** Read-only mode */
    readonly?: boolean;
    /** WAL mode */
    wal?: boolean;
}
/**
 * WebSocket configuration
 */
export interface WebSocketConfig {
    /** Enable WebSocket support */
    enabled: boolean;
    /** Maximum message size */
    maxPayloadLength?: number;
    /** Idle timeout in seconds */
    idleTimeout?: number;
    /** Backpressure limit */
    backpressureLimit?: number;
    /** Close on backpressure limit */
    closeOnBackpressureLimit?: boolean;
    /** Per-message deflate */
    perMessageDeflate?: boolean;
    /** Publish to client limit */
    publishToSelf?: boolean;
}
/**
 * Bun-specific optimizations
 */
export interface BunOptimizations {
    /** Use Bun's native fetch */
    nativeFetch?: boolean;
    /** Use Bun's native crypto */
    nativeCrypto?: boolean;
    /** Use Bun's native file I/O */
    nativeFileIO?: boolean;
    /** Inline small assets */
    inlineAssets?: boolean;
    /** Asset size threshold for inlining */
    inlineThreshold?: number;
}
/**
 * Create a Bun deployment adapter
 *
 * @example
 * ```typescript
 * import { bunAdapter } from 'philjs-adapters/adapters/bun';
 *
 * export default defineConfig({
 *   adapter: bunAdapter({
 *     port: 3000,
 *     compression: true,
 *     websocket: {
 *       enabled: true,
 *       maxPayloadLength: 16 * 1024 * 1024,
 *     },
 *     sqlite: './data.db',
 *   }),
 * });
 * ```
 */
export declare function bunAdapter(config?: BunAdapterConfig): Adapter;
/**
 * Check if running in Bun
 */
export declare function isBun(): boolean;
/**
 * Create Bun SQLite helpers
 */
export declare function createBunSQLite(path?: string): {
    db: any;
    query<T = any>(sql: string, params?: any[]): T[];
    run(sql: string, params?: any[]): void;
    get<T = any>(sql: string, params?: any[]): T | undefined;
    exec(sql: string): void;
    transaction<T>(fn: () => T): T;
    close(): void;
};
/**
 * Create Bun file helper
 */
export declare function bunFile(path: string): any;
/**
 * Bun password hashing
 */
export declare function bunHash(password: string): Promise<string>;
/**
 * Bun password verification
 */
export declare function bunVerify(password: string, hash: string): Promise<boolean>;
/**
 * Create a Bun-native handler for use with Bun.serve()
 */
export declare function createBunHandler(config?: BunAdapterConfig): (request: Request, context?: unknown) => Response | Promise<Response>;
export default bunAdapter;
//# sourceMappingURL=bun.d.ts.map