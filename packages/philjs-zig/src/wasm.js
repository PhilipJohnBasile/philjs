/**
 * WASM utilities for Zig-based PhilJS operations
 */
/**
 * Load and instantiate a Zig WASM module
 */
export async function loadWasmModule(source, imports = {}) {
    let bytes;
    if (typeof source === 'string') {
        const response = await fetch(source);
        bytes = await response.arrayBuffer();
    }
    else if (source instanceof Response) {
        bytes = await source.arrayBuffer();
    }
    else {
        bytes = source;
    }
    const { instance } = await WebAssembly.instantiate(bytes, imports);
    return instance;
}
/**
 * Create a streaming WASM module loader (more efficient)
 */
export async function streamWasmModule(url, imports = {}) {
    const { instance } = await WebAssembly.instantiateStreaming(fetch(url), imports);
    return instance;
}
/**
 * SIMD-accelerated operations wrapper
 */
export class SIMDOps {
    instance;
    memory;
    heap;
    constructor(instance) {
        this.instance = instance;
        this.memory = instance.exports['memory'];
        this.heap = new Float32Array(this.memory.buffer);
    }
    /**
     * Fast array sum using SIMD
     */
    sum(arr) {
        const ptr = this.allocate(arr);
        const result = this.instance.exports['simd_sum'](ptr, arr.length);
        this.reset();
        return result;
    }
    /**
     * Fast dot product using SIMD
     */
    dot(a, b) {
        if (a.length !== b.length) {
            throw new Error('Arrays must have same length');
        }
        const ptrA = this.allocate(a);
        const ptrB = this.allocate(b);
        const result = this.instance.exports['simd_dot'](ptrA, ptrB, a.length);
        this.reset();
        return result;
    }
    /**
     * Fast cosine similarity using SIMD
     */
    cosineSimilarity(a, b) {
        if (a.length !== b.length) {
            throw new Error('Arrays must have same length');
        }
        const ptrA = this.allocate(a);
        const ptrB = this.allocate(b);
        const result = this.instance.exports['cosine_similarity'](ptrA, ptrB, a.length);
        this.reset();
        return result;
    }
    /**
     * Fast string hash (FNV-1a)
     */
    hash(str) {
        const encoder = new TextEncoder();
        const bytes = encoder.encode(str);
        const ptr = this.allocateBytes(bytes);
        const result = this.instance.exports['fnv1a_hash'](ptr, bytes.length);
        this.reset();
        return BigInt(result);
    }
    allocate(arr) {
        const ptr = this.instance.exports['alloc'](arr.length * 4);
        if (ptr === 0)
            throw new Error('WASM allocation failed');
        // Refresh heap view (memory may have grown)
        this.heap = new Float32Array(this.memory.buffer);
        this.heap.set(arr, ptr / 4);
        return ptr;
    }
    allocateBytes(bytes) {
        const ptr = this.instance.exports['alloc'](bytes.length);
        if (ptr === 0)
            throw new Error('WASM allocation failed');
        const view = new Uint8Array(this.memory.buffer);
        view.set(bytes, ptr);
        return ptr;
    }
    reset() {
        this.instance.exports['reset_heap']();
    }
}
/**
 * Create SIMD operations from WASM module
 */
export async function createSIMDOps(wasmUrl) {
    const instance = await streamWasmModule(wasmUrl);
    return new SIMDOps(instance);
}
/**
 * Check if SIMD is supported
 */
export function simdSupported() {
    try {
        // Check for WASM SIMD support
        const simdTest = new Uint8Array([
            0, 97, 115, 109, 1, 0, 0, 0, 1, 5, 1, 96, 0, 1, 123, 3, 2, 1, 0, 10, 10, 1, 8, 0, 65, 0, 253,
            15, 253, 98, 11,
        ]);
        return WebAssembly.validate(simdTest);
    }
    catch {
        return false;
    }
}
//# sourceMappingURL=wasm.js.map