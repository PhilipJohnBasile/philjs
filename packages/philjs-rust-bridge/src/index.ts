
// PhilJS Rust Bridge
// Utilities for loading WASM modules in PhilJS applications.

export interface WasmConfig {
    path: string;
    imports?: WebAssembly.Imports;
}

/**
 * Load a WASM module from a URL or path
 */
export async function loadWasmModule<T = any>(config: WasmConfig): Promise<T> {
    const { path, imports = {} } = config;

    if (typeof window !== 'undefined') {
        // Browser
        const response = await fetch(path);
        const bytes = await response.arrayBuffer();
        const result = await WebAssembly.instantiate(bytes, imports);
        return result.instance.exports as unknown as T;
    } else {
        // Node.js
        const fs = await import('fs/promises');
        const bytes = await fs.readFile(path);
        const result = await WebAssembly.instantiate(bytes, imports);
        return result.instance.exports as unknown as T;
    }
}
