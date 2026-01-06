/**
 * @philjs/sqlx - SQLx Rust bindings for PhilJS
 *
 * This package provides Rust-based SQLx database operations.
 * The core implementation is in Rust (.rs files).
 * This TypeScript file provides type definitions and JS bindings.
 */

export interface SqlxConfig {
  connectionString: string;
  maxConnections?: number;
  minConnections?: number;
  connectTimeout?: number;
  idleTimeout?: number;
}

export interface QueryResult<T = unknown> {
  rows: T[];
  rowsAffected: number;
}

export interface Transaction {
  commit(): Promise<void>;
  rollback(): Promise<void>;
  query<T>(sql: string, params?: unknown[]): Promise<QueryResult<T>>;
}

export interface Pool {
  query<T>(sql: string, params?: unknown[]): Promise<QueryResult<T>>;
  execute(sql: string, params?: unknown[]): Promise<number>;
  transaction(): Promise<Transaction>;
  close(): Promise<void>;
}

/**
 * Create a new SQLx connection pool
 * Note: Actual implementation requires Rust WASM module
 */
export async function createPool(_config: SqlxConfig): Promise<Pool> {
  throw new Error('@philjs/sqlx requires the Rust WASM module to be compiled');
}

/**
 * Run database migrations
 */
export async function migrate(_pool: Pool, _migrationsDir: string): Promise<void> {
  throw new Error('@philjs/sqlx requires the Rust WASM module to be compiled');
}
