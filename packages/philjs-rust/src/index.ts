/**
 * @philjs/rust - Core Rust bindings for PhilJS
 *
 * This package provides Rust-based core functionality.
 * The implementation is in Rust (.rs files).
 */

export interface RustConfig {
  wasmPath?: string;
  debug?: boolean;
}

/**
 * Initialize the Rust runtime (requires WASM module)
 */
export async function initRust(_config?: RustConfig): Promise<void> {
  throw new Error('@philjs/rust requires the Rust WASM module to be compiled');
}

/**
 * Check if Rust runtime is available
 */
export function isRustAvailable(): boolean {
  return false; // WASM not loaded
}
