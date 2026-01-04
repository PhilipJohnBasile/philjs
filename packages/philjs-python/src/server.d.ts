/**
 * Python Server Integration for PhilJS AI/ML
 */
import type { PythonServerConfig, PythonFunction } from './types.js';
/**
 * Python AI/ML server instance
 */
export declare class PythonServer {
    private process;
    private config;
    constructor(config?: PythonServerConfig);
    /**
     * Start the Python server
     */
    start(): Promise<void>;
    /**
     * Stop the Python server
     */
    stop(): Promise<void>;
    /**
     * Call a Python function
     */
    call<T>(fn: PythonFunction): Promise<T>;
    /**
     * Check if server is running
     */
    isRunning(): boolean;
    private waitForReady;
}
/**
 * Create and start a Python AI/ML server
 */
export declare function createPythonServer(config?: PythonServerConfig): Promise<PythonServer>;
/**
 * Initialize a Python project with AI/ML dependencies
 */
export declare function initPythonProject(dir: string): Promise<void>;
/**
 * Check if Python is installed
 */
export declare function checkPythonInstalled(): Promise<{
    installed: boolean;
    version?: string;
}>;
//# sourceMappingURL=server.d.ts.map