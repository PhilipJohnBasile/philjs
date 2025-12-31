/**
 * SQLite WASM Database
 * Full SQL power in the browser via WebAssembly using sql.js
 *
 * Features:
 * - Real SQLite database in the browser
 * - OPFS (Origin Private File System) persistence when available
 * - IndexedDB fallback persistence
 * - In-memory mode for testing
 * - Prepared statements support
 * - Transaction support
 * - Change tracking and notifications
 */
import type { QueryExecResult } from 'sql.js';
/**
 * Persistence mode for the database
 */
export type PersistenceMode = 'memory' | 'opfs' | 'indexeddb';
/**
 * SQLite configuration
 */
export interface SQLiteConfig {
    /** Database name */
    dbName: string;
    /** Custom WASM URL (optional) */
    wasmUrl?: string;
    /** Persistence mode */
    persistenceMode: PersistenceMode;
    /** Page size in bytes */
    pageSize?: number;
    /** Cache size in pages */
    cacheSize?: number;
    /** Enable WAL mode */
    walMode?: boolean;
    /** Read-only mode */
    readOnly?: boolean;
    /** Auto-save interval in ms (for persistence modes) */
    autoSaveInterval?: number;
}
/**
 * Query result row type
 */
export type Row = Record<string, unknown>;
/**
 * Table change event
 */
export interface TableChangeEvent {
    table: string;
    operation: 'INSERT' | 'UPDATE' | 'DELETE';
    rowId: number;
}
/**
 * Table change callback
 */
export type TableChangeCallback = (event: TableChangeEvent) => void;
/**
 * Prepared statement wrapper
 */
export interface PreparedStatement<T extends Row = Row> {
    /** Execute and return all results */
    all(params?: unknown[]): T[];
    /** Execute and return first result */
    get(params?: unknown[]): T | undefined;
    /** Execute without returning results */
    run(params?: unknown[]): {
        changes: number;
        lastInsertRowid: number;
    };
    /** Free the statement resources */
    free(): void;
    /** Bind parameters for reuse */
    bind(params?: unknown[]): PreparedStatement<T>;
}
/**
 * SQLite Database wrapper with real sql.js implementation
 */
export declare class SQLiteDB {
    private db;
    private sqlJs;
    private config;
    private initialized;
    private changeListeners;
    private globalListeners;
    private persistence;
    private autoSaveTimer;
    private dirty;
    constructor(config: SQLiteConfig);
    /**
     * Initialize the database
     */
    initialize(): Promise<void>;
    /**
     * Setup persistence layer based on mode
     */
    private setupPersistence;
    /**
     * Load persisted data if available
     */
    private loadPersistedData;
    /**
     * Configure database settings
     */
    private configureDatabase;
    /**
     * Start auto-save timer
     */
    private startAutoSave;
    /**
     * Stop auto-save timer
     */
    private stopAutoSave;
    /**
     * Persist database to storage
     */
    persist(): Promise<void>;
    /**
     * Mark database as dirty (needs persistence)
     */
    private markDirty;
    /**
     * Execute SQL without returning results
     */
    exec(sql: string, params?: unknown[]): void;
    /**
     * Execute SQL and return results
     */
    query<T extends Row = Row>(sql: string, params?: unknown[]): T[];
    /**
     * Execute SQL and return first result
     */
    queryOne<T extends Row = Row>(sql: string, params?: unknown[]): T | undefined;
    /**
     * Run SQL and return change info
     */
    run(sql: string, params?: unknown[]): {
        changes: number;
        lastInsertRowid: number;
    };
    /**
     * Create a prepared statement
     */
    prepare<T extends Row = Row>(sql: string): PreparedStatement<T>;
    /**
     * Execute multiple statements in a transaction
     */
    transaction<T>(fn: () => T): T;
    /**
     * Execute async operations in a transaction
     */
    transactionAsync<T>(fn: () => Promise<T>): Promise<T>;
    /**
     * Execute multiple SQL statements in a batch
     */
    batch(statements: Array<{
        sql: string;
        params?: unknown[];
    }>): void;
    /**
     * Subscribe to changes on a specific table
     */
    onTableChange(table: string, callback: TableChangeCallback): () => void;
    /**
     * Subscribe to all table changes
     */
    onAnyChange(callback: TableChangeCallback): () => void;
    /**
     * Detect changes from SQL and notify listeners
     */
    private detectAndNotifyChanges;
    /**
     * Get table names
     */
    getTables(): string[];
    /**
     * Get table schema
     */
    getTableSchema(table: string): Array<{
        name: string;
        type: string;
        notnull: boolean;
        pk: boolean;
    }>;
    /**
     * Check if table exists
     */
    tableExists(table: string): boolean;
    /**
     * Get row count for a table
     */
    getRowCount(table: string): number;
    /**
     * Export database to bytes
     */
    export(): Uint8Array;
    /**
     * Import database from bytes
     */
    import(data: Uint8Array): Promise<void>;
    /**
     * Close the database
     */
    close(): Promise<void>;
    /**
     * Delete the database (removes persisted data)
     */
    delete(): Promise<void>;
    /**
     * Ensure database is initialized
     */
    private ensureInitialized;
    /**
     * Check if initialized
     */
    isInitialized(): boolean;
    /**
     * Get database name
     */
    getName(): string;
    /**
     * Get persistence mode
     */
    getPersistenceMode(): PersistenceMode;
    /**
     * Get actual persistence type (may differ from config if fallback occurred)
     */
    getActualPersistenceType(): 'memory' | 'opfs' | 'indexeddb';
    /**
     * Force persist to storage immediately
     */
    flush(): Promise<void>;
    /**
     * Vacuum the database to reclaim space
     */
    vacuum(): void;
    /**
     * Get database file size in bytes
     */
    getSize(): number;
    /**
     * Execute raw SQL and get raw results (sql.js format)
     */
    execRaw(sql: string): QueryExecResult[];
}
/**
 * Create a new SQLite database
 */
export declare function createDatabase(config: SQLiteConfig): SQLiteDB;
/**
 * Create an in-memory database
 */
export declare function createMemoryDatabase(name?: string): SQLiteDB;
/**
 * Create a persistent database using OPFS (with IndexedDB fallback)
 */
export declare function createPersistentDatabase(name: string): SQLiteDB;
/**
 * Create a database with IndexedDB persistence
 */
export declare function createIndexedDBDatabase(name: string): SQLiteDB;
/**
 * Check if OPFS is supported in the current environment
 */
export declare function isOPFSSupported(): boolean;
/**
 * Check if IndexedDB is supported in the current environment
 */
export declare function isIndexedDBSupported(): boolean;
/**
 * Get the best available persistence mode
 */
export declare function getBestPersistenceMode(): PersistenceMode;
//# sourceMappingURL=sqlite-wasm.d.ts.map