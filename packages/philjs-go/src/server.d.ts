/**
 * Go Server Integration for PhilJS
 *
 * Manages Go server lifecycle and communication with PhilJS.
 */
import type { GoServerConfig, GoBuildOptions, GoProjectConfig } from './types.js';
/**
 * Go server instance
 */
export declare class GoServer {
    private process;
    private config;
    private binaryPath;
    constructor(config: GoServerConfig, binaryPath?: string);
    /**
     * Start the Go server
     */
    start(): Promise<void>;
    /**
     * Stop the Go server
     */
    stop(): Promise<void>;
    /**
     * Restart the Go server
     */
    restart(): Promise<void>;
    /**
     * Check if server is running
     */
    isRunning(): boolean;
    /**
     * Wait for server to be ready
     */
    private waitForReady;
}
/**
 * Create and start a Go server
 */
export declare function createGoServer(config: GoServerConfig): Promise<GoServer>;
/**
 * Build Go server binary
 */
export declare function buildGoServer(options?: GoBuildOptions): Promise<string>;
/**
 * Initialize a new Go project for PhilJS
 */
export declare function initGoProject(dir: string, config: GoProjectConfig): Promise<void>;
/**
 * Check if Go is installed
 */
export declare function checkGoInstalled(): Promise<{
    installed: boolean;
    version?: string | undefined;
}>;
//# sourceMappingURL=server.d.ts.map