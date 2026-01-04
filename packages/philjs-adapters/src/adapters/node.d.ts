/**
 * PhilJS Node.js Adapter
 *
 * Production-ready deployment adapter for Node.js with:
 * - Express/Fastify middleware
 * - Standalone server
 * - PM2 ecosystem file generation
 * - Clustering support
 * - Graceful shutdown
 *
 * @module philjs-adapters/adapters/node
 */
import { Server } from 'http';
import { Server as HttpsServer } from 'https';
import type { Adapter, AdapterConfig } from '../types.js';
/**
 * Configuration options for the Node.js adapter
 */
export interface NodeAdapterConfig extends AdapterConfig {
    /** Port to listen on */
    port?: number;
    /** Host to bind to */
    host?: string;
    /** Enable HTTPS */
    https?: {
        key: string;
        cert: string;
        ca?: string;
    };
    /** Enable compression */
    compression?: boolean;
    /** Request timeout in milliseconds */
    timeout?: number;
    /** Keep-alive timeout in milliseconds */
    keepAliveTimeout?: number;
    /** Headers timeout in milliseconds */
    headersTimeout?: number;
    /** Trust proxy headers */
    trustProxy?: boolean | string | number;
    /** Enable clustering */
    cluster?: boolean | ClusterConfig;
    /** Static file serving */
    serveStatic?: boolean | StaticConfig;
    /** Graceful shutdown timeout in milliseconds */
    shutdownTimeout?: number;
    /** Generate PM2 ecosystem file */
    generatePM2?: boolean;
    /** Generate Dockerfile */
    generateDockerfile?: boolean;
    /** Express middleware mode */
    express?: boolean;
    /** Fastify mode */
    fastify?: boolean;
    /** Request logging */
    logging?: boolean | LoggingConfig;
    /** Health check endpoint */
    healthCheck?: string;
    /** Metrics endpoint */
    metrics?: string;
}
/**
 * Cluster configuration
 */
export interface ClusterConfig {
    /** Number of workers (default: CPU count) */
    workers?: number;
    /** Restart workers on crash */
    restartOnCrash?: boolean;
    /** Sticky sessions */
    sticky?: boolean;
}
/**
 * Static file serving configuration
 */
export interface StaticConfig {
    /** Static assets directory */
    dir?: string;
    /** Cache-Control header value */
    cacheControl?: string;
    /** Maximum age in seconds */
    maxAge?: number;
    /** Enable etag */
    etag?: boolean;
    /** Enable last-modified */
    lastModified?: boolean;
    /** Index files */
    index?: string[];
    /** Dotfiles handling */
    dotfiles?: 'allow' | 'deny' | 'ignore';
    /** Extensions to try */
    extensions?: string[];
}
/**
 * Logging configuration
 */
export interface LoggingConfig {
    /** Log format */
    format?: 'combined' | 'common' | 'dev' | 'short' | 'tiny';
    /** Log level */
    level?: 'error' | 'warn' | 'info' | 'debug';
    /** Skip logging for paths */
    skip?: string[];
}
/**
 * Create a Node.js deployment adapter
 *
 * @example
 * ```typescript
 * import { nodeAdapter } from 'philjs-adapters/adapters/node';
 *
 * export default defineConfig({
 *   adapter: nodeAdapter({
 *     port: 3000,
 *     cluster: { workers: 4 },
 *     compression: true,
 *     serveStatic: {
 *       dir: 'public',
 *       maxAge: 31536000,
 *     },
 *     generatePM2: true,
 *   }),
 * });
 * ```
 */
export declare function nodeAdapter(config?: NodeAdapterConfig): Adapter;
/**
 * Create Express middleware
 */
export declare function createExpressMiddleware(config?: NodeAdapterConfig): (req: any, res: any, next: any) => Promise<void>;
/**
 * Create Fastify plugin
 */
export declare function createFastifyPlugin(config?: NodeAdapterConfig): (fastify: any, options: any) => Promise<void>;
/**
 * Start a standalone server
 */
export declare function startServer(config?: NodeAdapterConfig): Promise<Server | HttpsServer>;
export default nodeAdapter;
//# sourceMappingURL=node.d.ts.map