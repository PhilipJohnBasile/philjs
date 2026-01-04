/**
 * SQLite Hooks
 * PhilJS hooks for SQLite database operations
 */
import { SQLiteDB, createDatabase, createMemoryDatabase, createPersistentDatabase, } from './db/sqlite-wasm.js';
import { ReactiveQuery, createReactiveQuery } from './reactive/reactive-query.js';
import { SQLiteSyncEngine, createSyncEngine } from './sync/sync-engine.js';
function createState(initial) {
    const state = {
        value: initial,
        listeners: new Set(),
        get() {
            return this.value;
        },
        set(value) {
            this.value = value;
            for (const listener of this.listeners) {
                listener();
            }
        },
        subscribe(listener) {
            this.listeners.add(listener);
            return () => this.listeners.delete(listener);
        },
    };
    return state;
}
// Global database registry
const databases = new Map();
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
export function useSQLite(config) {
    const dbState = createState(null);
    const readyState = createState(false);
    const errorState = createState(null);
    // Check if database already exists
    const existingDb = databases.get(config.dbName);
    if (existingDb && existingDb.isInitialized()) {
        dbState.set(existingDb);
        readyState.set(true);
    }
    else {
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
        exec(sql, params) {
            const db = dbState.get();
            if (!db)
                throw new Error('Database not ready');
            db.exec(sql, params);
        },
        query(sql, params) {
            const db = dbState.get();
            if (!db)
                throw new Error('Database not ready');
            return db.query(sql, params);
        },
        queryOne(sql, params) {
            const db = dbState.get();
            if (!db)
                throw new Error('Database not ready');
            return db.queryOne(sql, params);
        },
        run(sql, params) {
            const db = dbState.get();
            if (!db)
                throw new Error('Database not ready');
            return db.run(sql, params);
        },
        transaction(fn) {
            const db = dbState.get();
            if (!db)
                throw new Error('Database not ready');
            return db.transaction(fn);
        },
    };
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
export function useQuery(sql, params, options) {
    const dbName = options?.dbName ?? 'default';
    const db = databases.get(dbName);
    if (!db || !db.isInitialized()) {
        return {
            data: [],
            loading: true,
            error: null,
            refetch: () => { },
            setParams: () => { },
        };
    }
    const queryInstance = createReactiveQuery(db, {
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
        setParams(newParams) {
            queryInstance.setParams(newParams);
        },
    };
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
export function useSync(config) {
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
            stop: () => { },
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
export function useKVStore(storeName = 'kv_store', options) {
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
        get(key) {
            if (!db?.isInitialized())
                return undefined;
            const row = db.queryOne(`SELECT value FROM ${storeName} WHERE key = ?`, [key]);
            if (!row)
                return undefined;
            try {
                return JSON.parse(row.value);
            }
            catch {
                return row.value;
            }
        },
        set(key, value) {
            if (!db?.isInitialized())
                return;
            const serialized = typeof value === 'string' ? value : JSON.stringify(value);
            db.exec(`INSERT OR REPLACE INTO ${storeName} (key, value, updated_at) VALUES (?, ?, datetime('now'))`, [key, serialized]);
        },
        delete(key) {
            if (!db?.isInitialized())
                return;
            db.exec(`DELETE FROM ${storeName} WHERE key = ?`, [key]);
        },
        keys() {
            if (!db?.isInitialized())
                return [];
            const rows = db.query(`SELECT key FROM ${storeName}`);
            return rows.map((r) => r.key);
        },
        clear() {
            if (!db?.isInitialized())
                return;
            db.exec(`DELETE FROM ${storeName}`);
        },
    };
}
/**
 * Get a database by name
 */
export function getDatabase(name) {
    return databases.get(name);
}
/**
 * Close and remove a database
 */
export function closeDatabase(name) {
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
export function closeAllDatabases() {
    for (const [name, db] of databases) {
        db.close();
    }
    databases.clear();
}
//# sourceMappingURL=hooks.js.map