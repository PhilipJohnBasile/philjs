/**
 * Zig/WASM type definitions for high-performance operations
 */
export interface ZigBuildConfig {
    /**
     * Build target
     */
    target?: 'native' | 'wasm32-wasi' | 'wasm32-freestanding' | 'x86_64-linux' | 'aarch64-macos';
    /**
     * Optimization mode
     */
    optimize?: 'Debug' | 'ReleaseSafe' | 'ReleaseFast' | 'ReleaseSmall';
    /**
     * Enable SIMD
     */
    simd?: boolean;
    /**
     * Output directory
     */
    outDir?: string;
    /**
     * Link libc
     */
    linkLibc?: boolean;
}
export interface WasmModuleConfig {
    /**
     * Module name
     */
    name: string;
    /**
     * Memory configuration
     */
    memory?: {
        initial: number;
        maximum?: number;
        shared?: boolean;
    };
    /**
     * Export functions
     */
    exports: WasmExport[];
    /**
     * Import functions from JS
     */
    imports?: WasmImport[];
}
export interface WasmExport {
    name: string;
    params: WasmType[];
    returns: WasmType[];
}
export interface WasmImport {
    module: string;
    name: string;
    params: WasmType[];
    returns: WasmType[];
}
export type WasmType = 'i32' | 'i64' | 'f32' | 'f64' | 'v128' | 'funcref' | 'externref';
export interface RuntimeConfig {
    /**
     * Worker pool size
     */
    workers?: number;
    /**
     * Enable shared memory
     */
    sharedMemory?: boolean;
    /**
     * Stack size in bytes
     */
    stackSize?: number;
    /**
     * Heap size in bytes
     */
    heapSize?: number;
}
export interface SIMDConfig {
    /**
     * Enable 128-bit SIMD
     */
    simd128?: boolean;
    /**
     * Enable relaxed SIMD (faster, less portable)
     */
    relaxedSimd?: boolean;
}
//# sourceMappingURL=types.d.ts.map