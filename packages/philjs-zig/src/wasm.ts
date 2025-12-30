/**
 * WASM utilities for Zig-based PhilJS operations
 */

import type { WasmModuleConfig, WasmType } from './types.js';

/**
 * Load and instantiate a Zig WASM module
 */
export async function loadWasmModule(
  source: string | ArrayBuffer | Response,
  imports: WebAssembly.Imports = {}
): Promise<WebAssembly.Instance> {
  let bytes: ArrayBuffer;

  if (typeof source === 'string') {
    const response = await fetch(source);
    bytes = await response.arrayBuffer();
  } else if (source instanceof Response) {
    bytes = await source.arrayBuffer();
  } else {
    bytes = source;
  }

  const { instance } = await WebAssembly.instantiate(bytes, imports);
  return instance;
}

/**
 * Create a streaming WASM module loader (more efficient)
 */
export async function streamWasmModule(
  url: string,
  imports: WebAssembly.Imports = {}
): Promise<WebAssembly.Instance> {
  const { instance } = await WebAssembly.instantiateStreaming(
    fetch(url),
    imports
  );
  return instance;
}

/**
 * SIMD-accelerated operations wrapper
 */
export class SIMDOps {
  private instance: WebAssembly.Instance;
  private memory: WebAssembly.Memory;
  private heap: Float32Array;

  constructor(instance: WebAssembly.Instance) {
    this.instance = instance;
    this.memory = instance.exports['memory'] as WebAssembly.Memory;
    this.heap = new Float32Array(this.memory.buffer);
  }

  /**
   * Fast array sum using SIMD
   */
  sum(arr: Float32Array): number {
    const ptr = this.allocate(arr);
    const result = (this.instance.exports['simd_sum'] as Function)(ptr, arr.length);
    this.reset();
    return result;
  }

  /**
   * Fast dot product using SIMD
   */
  dot(a: Float32Array, b: Float32Array): number {
    if (a.length !== b.length) {
      throw new Error('Arrays must have same length');
    }

    const ptrA = this.allocate(a);
    const ptrB = this.allocate(b);
    const result = (this.instance.exports['simd_dot'] as Function)(ptrA, ptrB, a.length);
    this.reset();
    return result;
  }

  /**
   * Fast cosine similarity using SIMD
   */
  cosineSimilarity(a: Float32Array, b: Float32Array): number {
    if (a.length !== b.length) {
      throw new Error('Arrays must have same length');
    }

    const ptrA = this.allocate(a);
    const ptrB = this.allocate(b);
    const result = (this.instance.exports['cosine_similarity'] as Function)(ptrA, ptrB, a.length);
    this.reset();
    return result;
  }

  /**
   * Fast string hash (FNV-1a)
   */
  hash(str: string): bigint {
    const encoder = new TextEncoder();
    const bytes = encoder.encode(str);
    const ptr = this.allocateBytes(bytes);
    const result = (this.instance.exports['fnv1a_hash'] as Function)(ptr, bytes.length);
    this.reset();
    return BigInt(result);
  }

  private allocate(arr: Float32Array): number {
    const ptr = (this.instance.exports['alloc'] as Function)(arr.length * 4);
    if (ptr === 0) throw new Error('WASM allocation failed');

    // Refresh heap view (memory may have grown)
    this.heap = new Float32Array(this.memory.buffer);
    this.heap.set(arr, ptr / 4);
    return ptr;
  }

  private allocateBytes(bytes: Uint8Array): number {
    const ptr = (this.instance.exports['alloc'] as Function)(bytes.length);
    if (ptr === 0) throw new Error('WASM allocation failed');

    const view = new Uint8Array(this.memory.buffer);
    view.set(bytes, ptr);
    return ptr;
  }

  private reset(): void {
    (this.instance.exports['reset_heap'] as Function)();
  }
}

/**
 * Create SIMD operations from WASM module
 */
export async function createSIMDOps(wasmUrl: string): Promise<SIMDOps> {
  const instance = await streamWasmModule(wasmUrl);
  return new SIMDOps(instance);
}

/**
 * Check if SIMD is supported
 */
export function simdSupported(): boolean {
  try {
    // Check for WASM SIMD support
    const simdTest = new Uint8Array([
      0, 97, 115, 109, 1, 0, 0, 0, 1, 5, 1, 96, 0, 1, 123, 3, 2, 1, 0, 10, 10, 1, 8, 0, 65, 0, 253,
      15, 253, 98, 11,
    ]);
    return WebAssembly.validate(simdTest);
  } catch {
    return false;
  }
}
