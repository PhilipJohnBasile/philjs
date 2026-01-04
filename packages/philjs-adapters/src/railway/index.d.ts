/**
 * PhilJS Railway Adapter
 *
 * Deploy to Railway with:
 * - Docker configuration generation
 * - Railway.toml configuration
 * - Environment variable handling
 * - Health checks
 * - Build configuration
 */
import type { Adapter, AdapterConfig } from '../types.js';
export interface RailwayConfig extends AdapterConfig {
    /** Output directory for build artifacts */
    outDir?: string;
    /** Node.js version */
    nodeVersion?: string;
    /** Port to listen on (default: from PORT env var or 3000) */
    port?: number;
    /** Enable Docker deployment (false to disable) */
    docker?: false | {
        /** Base image */
        baseImage?: string;
        /** Node version for Docker */
        nodeVersion?: string;
        /** Additional packages to install */
        packages?: string[];
        /** Build arguments */
        buildArgs?: Record<string, string>;
        /** Environment variables */
        env?: Record<string, string>;
        /** Expose additional ports */
        exposePorts?: number[];
    };
    /** Railway.toml configuration */
    railway?: {
        /** Build command */
        buildCommand?: string;
        /** Start command */
        startCommand?: string;
        /** Health check path */
        healthCheckPath?: string;
        /** Health check interval */
        healthCheckInterval?: number;
        /** Restart policy */
        restartPolicy?: 'on-failure' | 'always' | 'unless-stopped';
        /** Environment variables */
        variables?: Record<string, string>;
        /** Deployment region */
        region?: string;
    };
    /** Nixpacks configuration */
    nixpacks?: {
        /** Nixpkgs to install */
        packages?: string[];
        /** Build command override */
        buildCommand?: string;
        /** Start command override */
        startCommand?: string;
        /** Install command override */
        installCommand?: string;
    };
    /** Enable static file serving */
    staticFiles?: {
        /** Static directory */
        directory?: string;
        /** Cache control header */
        cacheControl?: string;
    };
    /** Enable compression */
    compression?: boolean;
    /** Enable graceful shutdown */
    gracefulShutdown?: {
        /** Shutdown timeout in ms */
        timeout?: number;
        /** Signals to handle */
        signals?: ('SIGTERM' | 'SIGINT')[];
    };
}
export declare function railwayAdapter(config?: RailwayConfig): Adapter;
export default railwayAdapter;
//# sourceMappingURL=index.d.ts.map