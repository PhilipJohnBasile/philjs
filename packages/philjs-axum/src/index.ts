/**
 * @philjs/axum - Axum Web bindings for PhilJS
 *
 * This package provides Rust-based Axum Web server operations.
 * The core implementation is in Rust (.rs files).
 */

export interface AxumConfig {
  host?: string;
  port?: number;
}

export interface Route {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  path: string;
  handler: string;
}

/**
 * Start an Axum server (requires Rust runtime)
 */
export async function serve(_config: AxumConfig): Promise<void> {
  throw new Error('@philjs/axum requires the Rust runtime');
}

/**
 * Register routes (requires Rust runtime)
 */
export function routes(_routes: Route[]): void {
  throw new Error('@philjs/axum requires the Rust runtime');
}
