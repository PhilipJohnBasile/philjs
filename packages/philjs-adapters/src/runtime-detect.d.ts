/**
 * PhilJS Runtime Detection
 *
 * Utilities for detecting the current JavaScript runtime environment
 */
export type Runtime = 'bun' | 'deno' | 'node' | 'edge' | 'browser' | 'unknown';
export interface RuntimeInfo {
    runtime: Runtime;
    version: string;
    features: RuntimeFeatures;
}
export interface RuntimeFeatures {
    /** Native fetch support */
    fetch: boolean;
    /** WebSocket support */
    webSocket: boolean;
    /** Web Crypto API */
    crypto: boolean;
    /** File system access */
    fileSystem: boolean;
    /** Native SQLite support */
    sqlite: boolean;
    /** KV storage support */
    kvStorage: boolean;
    /** Hot reload support */
    hotReload: boolean;
    /** Native HTTP server */
    httpServer: boolean;
}
/**
 * Detect the current JavaScript runtime
 */
export declare function detectRuntime(): Runtime;
/**
 * Get detailed runtime information
 */
export declare function getRuntimeInfo(): RuntimeInfo;
/**
 * Check if current runtime supports a specific feature
 */
export declare function hasFeature(feature: keyof RuntimeFeatures): boolean;
/**
 * Assert that the current runtime is one of the expected runtimes
 */
export declare function assertRuntime(...expected: Runtime[]): void;
/**
 * Check if running in Bun
 */
export declare function isBun(): boolean;
/**
 * Check if running in Deno
 */
export declare function isDeno(): boolean;
/**
 * Check if running in Node.js
 */
export declare function isNode(): boolean;
/**
 * Check if running in an edge runtime
 */
export declare function isEdge(): boolean;
/**
 * Check if running in a browser
 */
export declare function isBrowser(): boolean;
/**
 * Check if running in a server environment (not browser)
 */
export declare function isServer(): boolean;
//# sourceMappingURL=runtime-detect.d.ts.map