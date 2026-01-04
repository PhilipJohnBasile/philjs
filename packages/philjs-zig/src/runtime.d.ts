/**
 * Zig Runtime for PhilJS - High-performance operations
 */
import type { ZigBuildConfig, RuntimeConfig } from './types.js';
/**
 * Check if Zig is installed
 */
export declare function checkZigInstalled(): Promise<{
    installed: boolean;
    version?: string;
}>;
/**
 * Build Zig project
 */
export declare function buildZig(config?: ZigBuildConfig): Promise<string>;
/**
 * Initialize Zig project for PhilJS
 */
export declare function initZigProject(dir: string, name: string): Promise<void>;
/**
 * High-performance runtime using Zig WASM
 */
export declare class ZigRuntime {
    private config;
    private instance;
    private memory;
    constructor(config?: RuntimeConfig);
    /**
     * Initialize the Zig WASM runtime
     */
    init(wasmPath: string): Promise<void>;
    /**
     * Call a Zig function
     */
    call<T>(name: string, ...args: number[]): T;
    /**
     * Get memory view
     */
    getMemory(): Float32Array;
}
//# sourceMappingURL=runtime.d.ts.map