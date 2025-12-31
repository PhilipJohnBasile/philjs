/**
 * SQLite Hooks
 * PhilJS hooks for SQLite database operations
 */
import { SQLiteDB, type SQLiteConfig, type Row } from './db/sqlite-wasm.js';
import { type SyncConfig, type SyncResult } from './sync/sync-engine.js';
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
    run: (sql: string, params?: unknown[]) => {
        changes: number;
        lastInsertRowid: number;
    };
    /** Run in transaction */
    transaction: <T>(fn: () => T) => T;
}
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
export declare function useSQLite(config: SQLiteConfig): SQLiteContext;
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
export declare function useQuery<T extends Row = Row>(sql: string, params?: unknown[], options?: {
    /** Database name (uses default if not specified) */
    dbName?: string;
    /** Table dependencies (auto-detected if not specified) */
    dependencies?: string[];
    /** Debounce updates in ms */
    debounce?: number;
    /** Transform results */
    transform?: (rows: Row[]) => T[];
}): ReactiveQueryResult<T>;
/**
 * Sync hook result
 */
export interface SyncHookResult {
    /** Current sync status */
    status: {
        pendingChanges: number;
        lastSync: number;
        syncing: boolean;
    };
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
export declare function useSync(config: SyncConfig & {
    dbName?: string;
}): SyncHookResult;
/**
 * Hook for a simple key-value store in SQLite
 */
export declare function useKVStore(storeName?: string, options?: {
    dbName?: string;
}): {
    get: <T>(key: string) => T | undefined;
    set: <T>(key: string, value: T) => void;
    delete: (key: string) => void;
    keys: () => string[];
    clear: () => void;
};
/**
 * Get a database by name
 */
export declare function getDatabase(name: string): SQLiteDB | undefined;
/**
 * Close and remove a database
 */
export declare function closeDatabase(name: string): boolean;
/**
 * Close all databases
 */
export declare function closeAllDatabases(): void;
//# sourceMappingURL=hooks.d.ts.map