/**
 * SQLite Hooks
 * PhilJS hooks for SQLite database operations
 */

import {
  SQLiteDB,
  createDatabase,
  createMemoryDatabase,
  createPersistentDatabase,
  type SQLiteConfig,
  type Row,
  type PersistenceMode,
} from './db/sqlite-wasm.js';
import { ReactiveQuery, createReactiveQuery, type ReactiveQueryOptions } from './reactive/reactive-query.js';
import { SQLiteSyncEngine, createSyncEngine, type SyncConfig, type SyncResult } from './sync/sync-engine.js';

/**
 * SQLite context state
 */
export interface SQLiteContext {
  /** Database instance */
  db: SQLiteDB | null;
  /** Whether database is ready */
  ready: boolean;
  /** Error if initialization failed */
  error: Error | null;
  /** Execute SQL */
  exec: (sql: string, params?: unknown[]) => void;
  /** Query and return results */
  query: <T extends Row = Row>(sql: string, params?: unknown[]) => T[];
  /** Query and return first result */
  queryOne: <T extends Row = Row>(sql: string, params?: unknown[]) => T | undefined;
  /** Run SQL with change info */
  run: (sql: string, params?: unknown[]) => { changes: number; lastInsertRowid: number };
  /** Run in transaction */
  transaction: <T>(fn: () => T) => T;
}

/**
 * Simple state container
 */
interface StateContainer<T> {
  value: T;
  listeners: Set<() => void>;
  get(): T;
  set(value: T): void;
  subscribe(listener: () => void): () => void;
}

function createState<T>(initial: T): StateContainer<T> {
  const state: StateContainer<T> = {
    value: initial,
    listeners: new Set(),
    get() {
      return this.value;
    },
    set(value: T) {
      this.value = value;
      for (const listener of this.listeners) {
        listener();
      }
    },
    subscribe(listener: () => void) {
      this.listeners.add(listener);
      return () => this.listeners.delete(listener);
    },
  };
  return state;
}

// Global database registry
const databases: Map<string, SQLiteDB> = new Map();

/**
 * Hook for SQLite database
 *
 * @example
 * ```typescript
 * const { db, ready, query, exec } = useSQLite({
 *   dbName: 'myapp',
 *   persistenceMode: 'opfs',
 * });
 *
 * if (ready) {
 *   const users = query<User>('SELECT * FROM users');
 * }
 * ```
 */
export function useSQLite(config: SQLiteConfig): SQLiteContext {
  const dbState = createState<SQLiteDB | null>(null);
  const readyState = createState(false);
  const errorState = createState<Error | null>(null);

  // Check if database already exists
  const existingDb = databases.get(config.dbName);
  if (existingDb && existingDb.isInitialized()) {
    dbState.set(existingDb);
    readyState.set(true);
  } else {
    // Initialize database
    const db = createDatabase(config);
    databases.set(config.dbName, db);

    db.initialize()
      .then(() => {
        dbState.set(db);
        readyState.set(true);
      })
      .catch((err) => {
        errorState.set(err instanceof Error ? err : new Error(String(err)));
      });
  }

  return {
    get db() {
      return dbState.get();
    },

    get ready() {
      return readyState.get();
    },

    get error() {
      return errorState.get();
    },

    exec(sql: string, params?: unknown[]) {
      const db = dbState.get();
      if (!db) throw new Error('Database not ready');
      db.exec(sql, params);
    },

    query<T extends Row = Row>(sql: string, params?: unknown[]): T[] {
      const db = dbState.get();
      if (!db) throw new Error('Database not ready');
      return db.query<T>(sql, params);
    },

    queryOne<T extends Row = Row>(sql: string, params?: unknown[]): T | undefined {
      const db = dbState.get();
      if (!db) throw new Error('Database not ready');
      return db.queryOne<T>(sql, params);
    },

    run(sql: string, params?: unknown[]) {
      const db = dbState.get();
      if (!db) throw new Error('Database not ready');
      return db.run(sql, params);
    },

    transaction<T>(fn: () => T): T {
      const db = dbState.get();
      if (!db) throw new Error('Database not ready');
      return db.transaction(fn);
    },
  };
}

/**
 * Reactive query result
 */
export interface ReactiveQueryResult<T> {
  /** Current data */
  data: T[];
  /** Loading state */
  loading: boolean;
  /** Error if any */
  error: Error | null;
  /** Manually refresh */
  refetch: () => void;
  /** Update parameters */
  setParams: (params: unknown[]) => void;
}

/**
 * Hook for reactive SQL queries
 *
 * @example
 * ```typescript
 * const { data, loading, error, refetch } = useQuery<User>(
 *   'SELECT * FROM users WHERE role = ?',
 *   ['admin']
 * );
 *
 * // Query auto-updates when 'users' table changes
 * ```
 */
export function useQuery<T extends Row = Row>(
  sql: string,
  params?: unknown[],
  options?: {
    /** Database name (uses default if not specified) */
    dbName?: string;
    /** Table dependencies (auto-detected if not specified) */
    dependencies?: string[];
    /** Debounce updates in ms */
    debounce?: number;
    /** Transform results */
    transform?: (rows: Row[]) => T[];
  }
): ReactiveQueryResult<T> {
  const dbName = options?.dbName ?? 'default';
  const db = databases.get(dbName);

  if (!db || !db.isInitialized()) {
    return {
      data: [],
      loading: true,
      error: null,
      refetch: () => {},
      setParams: () => {},
    };
  }

  const queryInstance = createReactiveQuery<T>(db, {
    sql,
    params,
    dependencies: options?.dependencies,
    debounce: options?.debounce,
    transform: options?.transform,
  });

  return {
    get data() {
      return queryInstance.data;
    },

    get loading() {
      return queryInstance.loading;
    },

    get error() {
      return queryInstance.error;
    },

    refetch() {
      queryInstance.refresh();
    },

    setParams(newParams: unknown[]) {
      queryInstance.setParams(newParams);
    },
  };
}

/**
 * Sync hook result
 */
export interface SyncHookResult {
  /** Current sync status */
  status: { pendingChanges: number; lastSync: number; syncing: boolean };
  /** Manually trigger sync */
  sync: () => Promise<SyncResult>;
  /** Stop auto-sync */
  stop: () => void;
}

/**
 * Hook for database synchronization
 *
 * @example
 * ```typescript
 * const { status, sync, stop } = useSync({
 *   endpoint: 'https://api.example.com/sync',
 *   tables: ['users', 'posts'],
 *   conflictStrategy: 'last-write-wins',
 *   syncInterval: 30000,
 * });
 *
 * // Manually trigger sync
 * await sync();
 * ```
 */
export function useSync(config: SyncConfig & { dbName?: string }): SyncHookResult {
  const dbName = config.dbName ?? 'default';
  const db = databases.get(dbName);

  if (!db || !db.isInitialized()) {
    return {
      status: { pendingChanges: 0, lastSync: 0, syncing: false },
      sync: async () => ({
        success: false,
        pushed: 0,
        pulled: 0,
        conflicts: 0,
        errors: ['Database not ready'],
        duration: 0,
      }),
      stop: () => {},
    };
  }

  const engine = createSyncEngine(db, config);

  // Initialize sync engine
  engine.initialize().catch(console.error);

  return {
    get status() {
      return engine.getStatus();
    },

    async sync() {
      return engine.sync();
    },

    stop() {
      engine.dispose();
    },
  };
}

/**
 * Hook for a simple key-value store in SQLite
 */
export function useKVStore(
  storeName = 'kv_store',
  options?: { dbName?: string }
): {
  get: <T>(key: string) => T | undefined;
  set: <T>(key: string, value: T) => void;
  delete: (key: string) => void;
  keys: () => string[];
  clear: () => void;
} {
  const dbName = options?.dbName ?? 'default';
  const db = databases.get(dbName);

  // Create table if needed
  if (db?.isInitialized()) {
    db.exec(`
      CREATE TABLE IF NOT EXISTS ${storeName} (
        key TEXT PRIMARY KEY,
        value TEXT,
        updated_at TEXT DEFAULT (datetime('now'))
      )
    `);
  }

  return {
    get<T>(key: string): T | undefined {
      if (!db?.isInitialized()) return undefined;
      const row = db.queryOne<{ value: string }>(`SELECT value FROM ${storeName} WHERE key = ?`, [key]);
      if (!row) return undefined;
      try {
        return JSON.parse(row.value) as T;
      } catch {
        return row.value as unknown as T;
      }
    },

    set<T>(key: string, value: T) {
      if (!db?.isInitialized()) return;
      const serialized = typeof value === 'string' ? value : JSON.stringify(value);
      db.exec(
        `INSERT OR REPLACE INTO ${storeName} (key, value, updated_at) VALUES (?, ?, datetime('now'))`,
        [key, serialized]
      );
    },

    delete(key: string) {
      if (!db?.isInitialized()) return;
      db.exec(`DELETE FROM ${storeName} WHERE key = ?`, [key]);
    },

    keys(): string[] {
      if (!db?.isInitialized()) return [];
      const rows = db.query<{ key: string }>(`SELECT key FROM ${storeName}`);
      return rows.map((r) => r.key);
    },

    clear() {
      if (!db?.isInitialized()) return;
      db.exec(`DELETE FROM ${storeName}`);
    },
  };
}

/**
 * Get a database by name
 */
export function getDatabase(name: string): SQLiteDB | undefined {
  return databases.get(name);
}

/**
 * Close and remove a database
 */
export function closeDatabase(name: string): boolean {
  const db = databases.get(name);
  if (db) {
    db.close();
    databases.delete(name);
    return true;
  }
  return false;
}

/**
 * Close all databases
 */
export function closeAllDatabases(): void {
  for (const [name, db] of databases) {
    db.close();
  }
  databases.clear();
}
