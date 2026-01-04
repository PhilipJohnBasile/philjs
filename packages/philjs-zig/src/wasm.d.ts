/**
 * WASM utilities for Zig-based PhilJS operations
 */
/**
 * Load and instantiate a Zig WASM module
 */
export declare function loadWasmModule(source: string | ArrayBuffer | Response, imports?: WebAssembly.Imports): Promise<WebAssembly.Instance>;
/**
 * Create a streaming WASM module loader (more efficient)
 */
export declare function streamWasmModule(url: string, imports?: WebAssembly.Imports): Promise<WebAssembly.Instance>;
/**
 * SIMD-accelerated operations wrapper
 */
export declare class SIMDOps {
    private instance;
    private memory;
    private heap;
    constructor(instance: WebAssembly.Instance);
    /**
     * Fast array sum using SIMD
     */
    sum(arr: Float32Array): number;
    /**
     * Fast dot product using SIMD
     */
    dot(a: Float32Array, b: Float32Array): number;
    /**
     * Fast cosine similarity using SIMD
     */
    cosineSimilarity(a: Float32Array, b: Float32Array): number;
    /**
     * Fast string hash (FNV-1a)
     */
    hash(str: string): bigint;
    private allocate;
    private allocateBytes;
    private reset;
}
/**
 * Create SIMD operations from WASM module
 */
export declare function createSIMDOps(wasmUrl: string): Promise<SIMDOps>;
/**
 * Check if SIMD is supported
 */
export declare function simdSupported(): boolean;
//# sourceMappingURL=wasm.d.ts.map