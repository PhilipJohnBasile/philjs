/**
 * @philjs/actix - Actix Web bindings for PhilJS
 *
 * This package provides Rust-based Actix Web server operations.
 * The core implementation is in Rust (.rs files).
 */

export interface ActixConfig {
  host?: string;
  port?: number;
  workers?: number;
}

export interface Route {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  path: string;
  handler: string;
}

/**
 * Start an Actix server (requires Rust runtime)
 */
export async function serve(_config: ActixConfig): Promise<void> {
  throw new Error('@philjs/actix requires the Rust runtime');
}

/**
 * Register routes (requires Rust runtime)
 */
export function routes(_routes: Route[]): void {
  throw new Error('@philjs/actix requires the Rust runtime');
}
