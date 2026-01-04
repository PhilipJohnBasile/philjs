/**
 * PhilJS Bun Adapter
 *
 * Deploy PhilJS applications using Bun's native server
 *
 * Features:
 * - Native Bun.serve() integration
 * - Bun's fast file serving
 * - SQLite support via Bun
 * - WebSocket support
 * - Hot reload in dev
 */
import type { Adapter, AdapterConfig } from '../types.js';
export interface BunConfig extends AdapterConfig {
    /** Port to listen on */
    port?: number;
    /** Host to bind to */
    hostname?: string;
    /** Enable development mode with hot reload */
    development?: boolean;
    /** Static file directory */
    staticDir?: string;
    /** Enable compression */
    compression?: boolean;
    /** SQLite database path */
    sqlite?: string;
    /** WebSocket configuration */
    websocket?: BunWebSocketConfig;
    /** TLS configuration */
    tls?: {
        key: string;
        cert: string;
    };
    /** Maximum request body size */
    maxRequestBodySize?: number;
    /** Request timeout in milliseconds */
    idleTimeout?: number;
}
export interface BunWebSocketConfig {
    /** Enable WebSocket support */
    enabled?: boolean;
    /** Maximum message size */
    maxPayloadLength?: number;
    /** Idle timeout for connections */
    idleTimeout?: number;
    /** Backpressure limit */
    backpressureLimit?: number;
    /** Close on backpressure limit */
    closeOnBackpressureLimit?: boolean;
}
export interface BunServerHandler {
    /** Bun.serve compatible fetch handler */
    fetch: (request: Request, server: BunServer) => Promise<Response> | Response;
    /** WebSocket handlers (if enabled) */
    websocket?: BunWebSocketHandlers;
    /** Start the server directly */
    start: () => BunServer;
    /** Port configuration */
    port: number;
    /** Hostname configuration */
    hostname: string;
}
export interface BunServer {
    port: number;
    hostname: string;
    development: boolean;
    stop: () => void;
    reload: (config: any) => void;
    upgrade: (request: Request, options?: any) => boolean;
    publish: (topic: string, data: string | ArrayBuffer | Uint8Array) => void;
}
export interface BunWebSocketHandlers {
    message: (ws: BunWebSocket, message: string | ArrayBuffer) => void;
    open?: (ws: BunWebSocket) => void;
    close?: (ws: BunWebSocket, code: number, reason: string) => void;
    drain?: (ws: BunWebSocket) => void;
    error?: (ws: BunWebSocket, error: Error) => void;
}
export interface BunWebSocket {
    send: (data: string | ArrayBuffer | Uint8Array, compress?: boolean) => number;
    close: (code?: number, reason?: string) => void;
    subscribe: (topic: string) => void;
    unsubscribe: (topic: string) => void;
    publish: (topic: string, data: string | ArrayBuffer | Uint8Array) => void;
    isSubscribed: (topic: string) => boolean;
    cork: (callback: () => void) => void;
    data: unknown;
    readyState: number;
    remoteAddress: string;
}
/**
 * Create a Bun adapter for PhilJS
 *
 * @example
 * ```typescript
 * import { createBunAdapter } from 'philjs-adapters/bun';
 *
 * const handler = createBunAdapter({
 *   app: philJSApp,
 *   port: 3000,
 * });
 *
 * // Bun.serve compatible
 * export default handler;
 *
 * // Or start directly
 * handler.start();
 * ```
 */
export declare function createBunAdapter(config?: BunConfig): BunServerHandler;
/**
 * Create SQLite helpers for Bun
 */
export declare function createBunSQLite(path?: string): {
    db: any;
    query: <T = any>(sql: string, params?: any[]) => T[];
    run: (sql: string, params?: any[]) => void;
    get: <T = any>(sql: string, params?: any[]) => T | undefined;
    close: () => void;
};
/**
 * Bun adapter factory for PhilJS build system
 */
export declare function bunAdapter(config?: BunConfig): Adapter;
/**
 * Register a WebSocket message handler
 */
export declare function onWebSocketMessage(handler: BunServerHandler, callback: (ws: BunWebSocket, message: string | ArrayBuffer) => void): void;
/**
 * Register a WebSocket connection handler
 */
export declare function onWebSocketOpen(handler: BunServerHandler, callback: (ws: BunWebSocket) => void): void;
/**
 * Register a WebSocket close handler
 */
export declare function onWebSocketClose(handler: BunServerHandler, callback: (ws: BunWebSocket, code: number, reason: string) => void): void;
export default createBunAdapter;
//# sourceMappingURL=index.d.ts.map