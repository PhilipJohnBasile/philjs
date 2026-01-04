/**
 * PhilJS Deno Deploy Adapter
 *
 * Production-ready deployment adapter for Deno Deploy with:
 * - Edge functions support
 * - Fresh framework compatibility
 * - Deno KV integration
 * - deno.json generation
 * - Automatic region routing
 *
 * @module philjs-adapters/adapters/deno-deploy
 */
import type { Adapter, AdapterConfig, EdgeAdapter } from '../types.js';
/**
 * Configuration options for the Deno Deploy adapter
 */
export interface DenoDeployAdapterConfig extends AdapterConfig {
    /** Deno Deploy project name */
    projectName?: string;
    /** Entry point file */
    entryPoint?: string;
    /** Enable Deno KV */
    kv?: boolean | DenoKVConfig;
    /** Fresh framework compatibility mode */
    fresh?: boolean | FreshConfig;
    /** Static file directory */
    staticDir?: string;
    /** Enable compression */
    compression?: boolean;
    /** Import map configuration */
    importMap?: string | ImportMapConfig;
    /** TypeScript configuration */
    compilerOptions?: DenoCompilerOptions;
    /** Lock file */
    lock?: string | boolean;
    /** Tasks configuration */
    tasks?: Record<string, string>;
    /** Lint configuration */
    lint?: DenoLintConfig;
    /** Format configuration */
    fmt?: DenoFmtConfig;
    /** Generate deno.json */
    generateConfig?: boolean;
    /** Deployment regions (Deno Deploy specific) */
    regions?: DenoDeployRegion[];
    /** Node.js compatibility */
    nodeModulesDir?: boolean;
    /** Unstable features to enable */
    unstable?: string[];
}
/**
 * Deno Deploy regions
 */
export type DenoDeployRegion = 'gcp-asia-east1' | 'gcp-asia-east2' | 'gcp-asia-northeast1' | 'gcp-asia-northeast2' | 'gcp-asia-northeast3' | 'gcp-asia-south1' | 'gcp-asia-southeast1' | 'gcp-asia-southeast2' | 'gcp-australia-southeast1' | 'gcp-europe-north1' | 'gcp-europe-west1' | 'gcp-europe-west2' | 'gcp-europe-west3' | 'gcp-europe-west4' | 'gcp-europe-west6' | 'gcp-northamerica-northeast1' | 'gcp-southamerica-east1' | 'gcp-us-central1' | 'gcp-us-east1' | 'gcp-us-east4' | 'gcp-us-west1' | 'gcp-us-west2' | 'gcp-us-west3' | 'gcp-us-west4';
/**
 * Deno KV configuration
 */
export interface DenoKVConfig {
    /** Enable KV */
    enabled: boolean;
    /** KV database path (for local development) */
    path?: string;
    /** TTL for cache entries (ms) */
    defaultTtl?: number;
    /** Enable consistency checking */
    consistency?: 'strong' | 'eventual';
}
/**
 * Fresh framework configuration
 */
export interface FreshConfig {
    /** Enable Fresh mode */
    enabled: boolean;
    /** Fresh version */
    version?: string;
    /** Plugins to enable */
    plugins?: string[];
    /** Islands directory */
    islandsDir?: string;
    /** Routes directory */
    routesDir?: string;
}
/**
 * Import map configuration
 */
export interface ImportMapConfig {
    imports?: Record<string, string>;
    scopes?: Record<string, Record<string, string>>;
}
/**
 * Deno compiler options
 */
export interface DenoCompilerOptions {
    allowJs?: boolean;
    checkJs?: boolean;
    strict?: boolean;
    jsx?: 'react' | 'react-jsx' | 'react-jsxdev' | 'preserve';
    jsxImportSource?: string;
    lib?: string[];
    types?: string[];
    experimentalDecorators?: boolean;
    emitDecoratorMetadata?: boolean;
}
/**
 * Deno lint configuration
 */
export interface DenoLintConfig {
    include?: string[];
    exclude?: string[];
    rules?: {
        tags?: string[];
        include?: string[];
        exclude?: string[];
    };
}
/**
 * Deno format configuration
 */
export interface DenoFmtConfig {
    useTabs?: boolean;
    lineWidth?: number;
    indentWidth?: number;
    singleQuote?: boolean;
    proseWrap?: 'always' | 'never' | 'preserve';
    semiColons?: boolean;
    include?: string[];
    exclude?: string[];
}
/**
 * Create a Deno Deploy adapter
 *
 * @example
 * ```typescript
 * import { denoDeployAdapter } from 'philjs-adapters/adapters/deno-deploy';
 *
 * export default defineConfig({
 *   adapter: denoDeployAdapter({
 *     projectName: 'my-app',
 *     kv: {
 *       enabled: true,
 *       defaultTtl: 60000,
 *     },
 *     fresh: true,
 *   }),
 * });
 * ```
 */
export declare function denoDeployAdapter(config?: DenoDeployAdapterConfig): Adapter & EdgeAdapter;
export declare function getDenoKV(path?: string): Promise<DenoKVWrapper>;
/**
 * Wrapper for Deno KV with helper methods
 */
export declare class DenoKVWrapper {
    private kv;
    constructor(kv: any);
    /**
     * Get a value by key
     */
    get<T = unknown>(key: string[]): Promise<T | null>;
    /**
     * Set a value with optional TTL
     */
    set(key: string[], value: unknown, options?: {
        expireIn?: number;
    }): Promise<void>;
    /**
     * Delete a value
     */
    delete(key: string[]): Promise<void>;
    /**
     * List values by prefix
     */
    list<T = unknown>(prefix: string[], options?: {
        limit?: number;
        reverse?: boolean;
    }): Promise<Array<{
        key: string[];
        value: T;
    }>>;
    /**
     * Atomic operation
     */
    atomic(): DenoKVAtomicWrapper;
    /**
     * Watch for changes
     */
    watch(keys: string[][]): AsyncIterable<Array<{
        key: string[];
        value: unknown;
        versionstamp: string;
    }>>;
    /**
     * Close the KV connection
     */
    close(): void;
}
/**
 * Wrapper for Deno KV atomic operations
 */
export declare class DenoKVAtomicWrapper {
    private atomic;
    constructor(atomic: any);
    check(...entries: Array<{
        key: string[];
        versionstamp: string | null;
    }>): this;
    set(key: string[], value: unknown, options?: {
        expireIn?: number;
    }): this;
    delete(key: string[]): this;
    sum(key: string[], n: bigint): this;
    min(key: string[], n: bigint): this;
    max(key: string[], n: bigint): this;
    commit(): Promise<{
        ok: boolean;
        versionstamp?: string;
    }>;
}
/**
 * Check if running on Deno Deploy
 */
export declare function isDenoDeply(): boolean;
/**
 * Get Deno Deploy region
 */
export declare function getDenoDeployRegion(): string | undefined;
/**
 * Check Deno permissions
 */
export declare function checkDenoPermissions(): Promise<{
    read: boolean;
    write: boolean;
    net: boolean;
    env: boolean;
    run: boolean;
}>;
/**
 * Request a Deno permission
 */
export declare function requestDenoPermission(name: 'read' | 'write' | 'net' | 'env' | 'run', path?: string): Promise<boolean>;
export default denoDeployAdapter;
//# sourceMappingURL=deno-deploy.d.ts.map