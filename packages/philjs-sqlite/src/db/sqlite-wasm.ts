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

import type { Database as SqlJsDatabase, SqlJsStatic, QueryExecResult } from 'sql.js';

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
  run(params?: unknown[]): { changes: number; lastInsertRowid: number };
  /** Free the statement resources */
  free(): void;
  /** Bind parameters for reuse */
  bind(params?: unknown[]): PreparedStatement<T>;
}

/**
 * IndexedDB persistence helper
 */
class IndexedDBPersistence {
  private dbName: string;
  private storeName = 'sqlite_databases';
  private db: IDBDatabase | null = null;

  constructor(dbName: string) {
    this.dbName = dbName;
  }

  async open(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('philjs_sqlite_persistence', 1);

      request.onerror = () => reject(new Error('Failed to open IndexedDB'));

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(this.storeName)) {
          db.createObjectStore(this.storeName);
        }
      };

      request.onsuccess = (event) => {
        this.db = (event.target as IDBOpenDBRequest).result;
        resolve();
      };
    });
  }

  async load(): Promise<Uint8Array | null> {
    if (!this.db) await this.open();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(this.storeName, 'readonly');
      const store = transaction.objectStore(this.storeName);
      const request = store.get(this.dbName);

      request.onerror = () => reject(new Error('Failed to load from IndexedDB'));
      request.onsuccess = () => resolve(request.result ?? null);
    });
  }

  async save(data: Uint8Array): Promise<void> {
    if (!this.db) await this.open();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(this.storeName, 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.put(data, this.dbName);

      request.onerror = () => reject(new Error('Failed to save to IndexedDB'));
      request.onsuccess = () => resolve();
    });
  }

  async delete(): Promise<void> {
    if (!this.db) await this.open();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(this.storeName, 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.delete(this.dbName);

      request.onerror = () => reject(new Error('Failed to delete from IndexedDB'));
      request.onsuccess = () => resolve();
    });
  }

  close(): void {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }
}

/**
 * OPFS (Origin Private File System) persistence helper
 */
class OPFSPersistence {
  private dbName: string;
  private dirHandle: FileSystemDirectoryHandle | null = null;

  constructor(dbName: string) {
    this.dbName = dbName;
  }

  static isSupported(): boolean {
    return typeof navigator !== 'undefined' &&
           'storage' in navigator &&
           typeof (navigator.storage as { getDirectory?: () => Promise<FileSystemDirectoryHandle> }).getDirectory === 'function';
  }

  async open(): Promise<void> {
    if (!OPFSPersistence.isSupported()) {
      throw new Error('OPFS is not supported in this browser');
    }
    this.dirHandle = await (navigator.storage as { getDirectory: () => Promise<FileSystemDirectoryHandle> }).getDirectory();
  }

  async load(): Promise<Uint8Array | null> {
    if (!this.dirHandle) await this.open();

    try {
      const fileHandle = await this.dirHandle!.getFileHandle(`${this.dbName}.sqlite`, { create: false });
      const file = await fileHandle.getFile();
      const buffer = await file.arrayBuffer();
      return new Uint8Array(buffer);
    } catch (error) {
      // File doesn't exist yet
      if ((error as Error).name === 'NotFoundError') {
        return null;
      }
      throw error;
    }
  }

  async save(data: Uint8Array): Promise<void> {
    if (!this.dirHandle) await this.open();

    const fileHandle = await this.dirHandle!.getFileHandle(`${this.dbName}.sqlite`, { create: true });
    const writable = await fileHandle.createWritable();
    await writable.write(data);
    await writable.close();
  }

  async delete(): Promise<void> {
    if (!this.dirHandle) await this.open();

    try {
      await this.dirHandle!.removeEntry(`${this.dbName}.sqlite`);
    } catch {
      // File might not exist, ignore
    }
  }
}

/**
 * SQLite WASM module loader with caching
 */
let sqlJsInstance: SqlJsStatic | null = null;
let sqlJsLoadPromise: Promise<SqlJsStatic> | null = null;

async function loadSqlJs(wasmUrl?: string): Promise<SqlJsStatic> {
  if (sqlJsInstance) return sqlJsInstance;

  if (sqlJsLoadPromise) return sqlJsLoadPromise;

  sqlJsLoadPromise = (async () => {
    // Dynamic import of sql.js
    const initSqlJs = (await import('sql.js')).default;

    // Configure WASM location
    const config: { locateFile?: (file: string) => string } = {};
    if (wasmUrl) {
      config.locateFile = () => wasmUrl;
    } else {
      // Check if running in Node.js (test environment)
      const isNode = typeof globalThis.process !== 'undefined' &&
                     globalThis.process.versions?.node;

      if (isNode) {
        // In Node.js, use the local node_modules path
        const { createRequire } = await import('module');
        const require = createRequire(import.meta.url);
        const sqlJsPath = require.resolve('sql.js');
        const wasmPath = sqlJsPath.replace(/sql-wasm\.js$/, '').replace(/dist[\\\/]index\.js$/, 'dist/');
        config.locateFile = (file: string) => wasmPath + file;
      } else {
        // In browser, use CDN location for sql.js WASM
        config.locateFile = (file: string) => `https://sql.js.org/dist/${file}`;
      }
    }

    sqlJsInstance = await initSqlJs(config);
    return sqlJsInstance;
  })();

  return sqlJsLoadPromise;
}

/**
 * SQLite Database wrapper with real sql.js implementation
 */
export class SQLiteDB {
  private db: SqlJsDatabase | null = null;
  private sqlJs: SqlJsStatic | null = null;
  private config: SQLiteConfig;
  private initialized = false;
  private changeListeners: Map<string, Set<TableChangeCallback>> = new Map();
  private globalListeners: Set<TableChangeCallback> = new Set();
  private persistence: IndexedDBPersistence | OPFSPersistence | null = null;
  private autoSaveTimer: ReturnType<typeof setInterval> | null = null;
  private dirty = false;

  constructor(config: SQLiteConfig) {
    this.config = {
      pageSize: 4096,
      cacheSize: 2000,
      walMode: false, // WAL mode not fully supported in browser
      readOnly: false,
      autoSaveInterval: 5000, // Auto-save every 5 seconds by default
      ...config,
    };
  }

  /**
   * Initialize the database
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      // Load sql.js WASM module
      this.sqlJs = await loadSqlJs(this.config.wasmUrl);

      // Setup persistence based on mode
      await this.setupPersistence();

      // Load existing data or create new database
      const existingData = await this.loadPersistedData();

      if (existingData) {
        this.db = new this.sqlJs.Database(existingData);
      } else {
        this.db = new this.sqlJs.Database();
      }

      // Configure database
      await this.configureDatabase();

      // Setup auto-save if using persistence
      if (this.config.persistenceMode !== 'memory' && this.config.autoSaveInterval) {
        this.startAutoSave();
      }

      this.initialized = true;
    } catch (error) {
      throw new Error(`Failed to initialize SQLite: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Setup persistence layer based on mode
   */
  private async setupPersistence(): Promise<void> {
    switch (this.config.persistenceMode) {
      case 'opfs':
        if (OPFSPersistence.isSupported()) {
          this.persistence = new OPFSPersistence(this.config.dbName);
        } else {
          console.warn('OPFS not supported, falling back to IndexedDB');
          this.persistence = new IndexedDBPersistence(this.config.dbName);
        }
        break;

      case 'indexeddb':
        this.persistence = new IndexedDBPersistence(this.config.dbName);
        break;

      case 'memory':
      default:
        this.persistence = null;
        break;
    }
  }

  /**
   * Load persisted data if available
   */
  private async loadPersistedData(): Promise<Uint8Array | null> {
    if (!this.persistence) return null;

    try {
      return await this.persistence.load();
    } catch {
      return null;
    }
  }

  /**
   * Configure database settings
   */
  private async configureDatabase(): Promise<void> {
    if (!this.db) return;

    // Set page size (must be done before any tables are created)
    if (this.config.pageSize) {
      this.db.run(`PRAGMA page_size = ${this.config.pageSize}`);
    }

    // Set cache size
    if (this.config.cacheSize) {
      this.db.run(`PRAGMA cache_size = ${this.config.cacheSize}`);
    }

    // Set synchronous mode for better performance
    this.db.run('PRAGMA synchronous = NORMAL');

    // Enable foreign keys
    this.db.run('PRAGMA foreign_keys = ON');

    // Use memory-mapped I/O for better performance
    this.db.run('PRAGMA mmap_size = 268435456'); // 256MB
  }

  /**
   * Start auto-save timer
   */
  private startAutoSave(): void {
    if (this.autoSaveTimer) return;

    this.autoSaveTimer = setInterval(async () => {
      if (this.dirty) {
        await this.persist();
      }
    }, this.config.autoSaveInterval);
  }

  /**
   * Stop auto-save timer
   */
  private stopAutoSave(): void {
    if (this.autoSaveTimer) {
      clearInterval(this.autoSaveTimer);
      this.autoSaveTimer = null;
    }
  }

  /**
   * Persist database to storage
   */
  async persist(): Promise<void> {
    if (!this.persistence || !this.db) return;

    const data = this.db.export();
    await this.persistence.save(data);
    this.dirty = false;
  }

  /**
   * Mark database as dirty (needs persistence)
   */
  private markDirty(): void {
    this.dirty = true;
  }

  /**
   * Execute SQL without returning results
   */
  exec(sql: string, params?: unknown[]): void {
    this.ensureInitialized();

    if (params && params.length > 0) {
      this.db!.run(sql, params as (string | number | null | Uint8Array)[]);
    } else {
      this.db!.exec(sql);
    }

    // Mark as dirty for persistence
    this.markDirty();

    // Detect changes and notify listeners
    this.detectAndNotifyChanges(sql);
  }

  /**
   * Execute SQL and return results
   */
  query<T extends Row = Row>(sql: string, params?: unknown[]): T[] {
    this.ensureInitialized();

    const results: QueryExecResult[] = params && params.length > 0
      ? this.db!.exec(sql, params as (string | number | null | Uint8Array)[])
      : this.db!.exec(sql);

    if (results.length === 0) return [];

    // Convert sql.js format to Row format
    const { columns, values } = results[0];
    return values.map((row) => {
      const obj: Row = {};
      columns.forEach((col, i) => {
        obj[col] = row[i];
      });
      return obj as T;
    });
  }

  /**
   * Execute SQL and return first result
   */
  queryOne<T extends Row = Row>(sql: string, params?: unknown[]): T | undefined {
    const results = this.query<T>(sql, params);
    return results[0];
  }

  /**
   * Run SQL and return change info
   */
  run(sql: string, params?: unknown[]): { changes: number; lastInsertRowid: number } {
    this.ensureInitialized();

    this.db!.run(sql, params as (string | number | null | Uint8Array)[] | undefined);

    // Get change info
    const changes = this.db!.getRowsModified();
    const lastInsertRowid = this.queryOne<{ id: number }>('SELECT last_insert_rowid() as id')?.id ?? 0;

    // Mark as dirty for persistence
    this.markDirty();

    // Detect changes and notify listeners
    this.detectAndNotifyChanges(sql);

    return { changes, lastInsertRowid };
  }

  /**
   * Create a prepared statement
   */
  prepare<T extends Row = Row>(sql: string): PreparedStatement<T> {
    this.ensureInitialized();

    const stmt = this.db!.prepare(sql);
    let boundParams: unknown[] | undefined;

    return {
      all: (params?: unknown[]): T[] => {
        const p = params ?? boundParams;
        if (p) stmt.bind(p as (string | number | null | Uint8Array)[]);

        const results: T[] = [];
        while (stmt.step()) {
          const row = stmt.getAsObject() as T;
          results.push(row);
        }
        stmt.reset();
        return results;
      },

      get: (params?: unknown[]): T | undefined => {
        const p = params ?? boundParams;
        if (p) stmt.bind(p as (string | number | null | Uint8Array)[]);

        if (stmt.step()) {
          const row = stmt.getAsObject() as T;
          stmt.reset();
          return row;
        }
        stmt.reset();
        return undefined;
      },

      run: (params?: unknown[]): { changes: number; lastInsertRowid: number } => {
        const p = params ?? boundParams;
        if (p) stmt.bind(p as (string | number | null | Uint8Array)[]);

        stmt.step();
        stmt.reset();

        const changes = this.db!.getRowsModified();
        const lastInsertRowid = this.queryOne<{ id: number }>('SELECT last_insert_rowid() as id')?.id ?? 0;

        this.markDirty();
        return { changes, lastInsertRowid };
      },

      free: (): void => {
        stmt.free();
      },

      bind: (params?: unknown[]): PreparedStatement<T> => {
        boundParams = params;
        return this as unknown as PreparedStatement<T>;
      },
    };
  }

  /**
   * Execute multiple statements in a transaction
   */
  transaction<T>(fn: () => T): T {
    this.exec('BEGIN TRANSACTION');
    try {
      const result = fn();
      this.exec('COMMIT');
      return result;
    } catch (error) {
      this.exec('ROLLBACK');
      throw error;
    }
  }

  /**
   * Execute async operations in a transaction
   */
  async transactionAsync<T>(fn: () => Promise<T>): Promise<T> {
    this.exec('BEGIN TRANSACTION');
    try {
      const result = await fn();
      this.exec('COMMIT');
      return result;
    } catch (error) {
      this.exec('ROLLBACK');
      throw error;
    }
  }

  /**
   * Execute multiple SQL statements in a batch
   */
  batch(statements: Array<{ sql: string; params?: unknown[] }>): void {
    this.transaction(() => {
      for (const { sql, params } of statements) {
        this.run(sql, params);
      }
    });
  }

  /**
   * Subscribe to changes on a specific table
   */
  onTableChange(table: string, callback: TableChangeCallback): () => void {
    let listeners = this.changeListeners.get(table);
    if (!listeners) {
      listeners = new Set();
      this.changeListeners.set(table, listeners);
    }
    listeners.add(callback);

    return () => {
      listeners!.delete(callback);
      if (listeners!.size === 0) {
        this.changeListeners.delete(table);
      }
    };
  }

  /**
   * Subscribe to all table changes
   */
  onAnyChange(callback: TableChangeCallback): () => void {
    this.globalListeners.add(callback);
    return () => this.globalListeners.delete(callback);
  }

  /**
   * Detect changes from SQL and notify listeners
   */
  private detectAndNotifyChanges(sql: string): void {
    const upperSql = sql.toUpperCase().trim();

    let operation: 'INSERT' | 'UPDATE' | 'DELETE' | null = null;
    let table: string | null = null;

    if (upperSql.startsWith('INSERT')) {
      operation = 'INSERT';
      const match = sql.match(/INSERT\s+INTO\s+[`"']?(\w+)[`"']?/i);
      table = match?.[1] ?? null;
    } else if (upperSql.startsWith('UPDATE')) {
      operation = 'UPDATE';
      const match = sql.match(/UPDATE\s+[`"']?(\w+)[`"']?/i);
      table = match?.[1] ?? null;
    } else if (upperSql.startsWith('DELETE')) {
      operation = 'DELETE';
      const match = sql.match(/DELETE\s+FROM\s+[`"']?(\w+)[`"']?/i);
      table = match?.[1] ?? null;
    }

    if (operation && table) {
      const lastRowId = this.queryOne<{ id: number }>('SELECT last_insert_rowid() as id')?.id ?? 0;
      const event: TableChangeEvent = { table, operation, rowId: lastRowId };

      // Notify table-specific listeners
      const tableListeners = this.changeListeners.get(table);
      if (tableListeners) {
        for (const listener of tableListeners) {
          listener(event);
        }
      }

      // Notify global listeners
      for (const listener of this.globalListeners) {
        listener(event);
      }
    }
  }

  /**
   * Get table names
   */
  getTables(): string[] {
    const results = this.query<{ name: string }>(
      "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'"
    );
    return results.map((r) => r.name);
  }

  /**
   * Get table schema
   */
  getTableSchema(table: string): Array<{ name: string; type: string; notnull: boolean; pk: boolean }> {
    return this.query(`PRAGMA table_info(${table})`).map((row) => ({
      name: row.name as string,
      type: row.type as string,
      notnull: Boolean(row.notnull),
      pk: Boolean(row.pk),
    }));
  }

  /**
   * Check if table exists
   */
  tableExists(table: string): boolean {
    const result = this.queryOne<{ count: number }>(
      "SELECT COUNT(*) as count FROM sqlite_master WHERE type='table' AND name=?",
      [table]
    );
    return (result?.count ?? 0) > 0;
  }

  /**
   * Get row count for a table
   */
  getRowCount(table: string): number {
    const result = this.queryOne<{ count: number }>(`SELECT COUNT(*) as count FROM ${table}`);
    return result?.count ?? 0;
  }

  /**
   * Export database to bytes
   */
  export(): Uint8Array {
    this.ensureInitialized();
    return this.db!.export();
  }

  /**
   * Import database from bytes
   */
  async import(data: Uint8Array): Promise<void> {
    this.ensureInitialized();

    // Close current database
    this.db!.close();

    // Create new database from data
    this.db = new this.sqlJs!.Database(data);

    // Re-configure
    await this.configureDatabase();

    // Persist the imported data
    this.markDirty();
    await this.persist();
  }

  /**
   * Close the database
   */
  async close(): Promise<void> {
    // Stop auto-save
    this.stopAutoSave();

    // Final persist
    if (this.dirty) {
      await this.persist();
    }

    // Close database
    if (this.db) {
      this.db.close();
      this.db = null;
    }

    // Close persistence
    if (this.persistence instanceof IndexedDBPersistence) {
      this.persistence.close();
    }

    this.initialized = false;
  }

  /**
   * Delete the database (removes persisted data)
   */
  async delete(): Promise<void> {
    await this.close();

    if (this.persistence) {
      await this.persistence.delete();
    }
  }

  /**
   * Ensure database is initialized
   */
  private ensureInitialized(): void {
    if (!this.initialized || !this.db) {
      throw new Error('Database not initialized. Call initialize() first.');
    }
  }

  /**
   * Check if initialized
   */
  isInitialized(): boolean {
    return this.initialized;
  }

  /**
   * Get database name
   */
  getName(): string {
    return this.config.dbName;
  }

  /**
   * Get persistence mode
   */
  getPersistenceMode(): PersistenceMode {
    return this.config.persistenceMode;
  }

  /**
   * Get actual persistence type (may differ from config if fallback occurred)
   */
  getActualPersistenceType(): 'memory' | 'opfs' | 'indexeddb' {
    if (!this.persistence) return 'memory';
    if (this.persistence instanceof OPFSPersistence) return 'opfs';
    return 'indexeddb';
  }

  /**
   * Force persist to storage immediately
   */
  async flush(): Promise<void> {
    await this.persist();
  }

  /**
   * Vacuum the database to reclaim space
   */
  vacuum(): void {
    this.exec('VACUUM');
  }

  /**
   * Get database file size in bytes
   */
  getSize(): number {
    const data = this.export();
    return data.byteLength;
  }

  /**
   * Execute raw SQL and get raw results (sql.js format)
   */
  execRaw(sql: string): QueryExecResult[] {
    this.ensureInitialized();
    return this.db!.exec(sql);
  }
}

/**
 * Create a new SQLite database
 */
export function createDatabase(config: SQLiteConfig): SQLiteDB {
  return new SQLiteDB(config);
}

/**
 * Create an in-memory database
 */
export function createMemoryDatabase(name = 'memory'): SQLiteDB {
  return new SQLiteDB({ dbName: name, persistenceMode: 'memory' });
}

/**
 * Create a persistent database using OPFS (with IndexedDB fallback)
 */
export function createPersistentDatabase(name: string): SQLiteDB {
  return new SQLiteDB({ dbName: name, persistenceMode: 'opfs' });
}

/**
 * Create a database with IndexedDB persistence
 */
export function createIndexedDBDatabase(name: string): SQLiteDB {
  return new SQLiteDB({ dbName: name, persistenceMode: 'indexeddb' });
}

/**
 * Check if OPFS is supported in the current environment
 */
export function isOPFSSupported(): boolean {
  return OPFSPersistence.isSupported();
}

/**
 * Check if IndexedDB is supported in the current environment
 */
export function isIndexedDBSupported(): boolean {
  return typeof indexedDB !== 'undefined';
}

/**
 * Get the best available persistence mode
 */
export function getBestPersistenceMode(): PersistenceMode {
  if (isOPFSSupported()) return 'opfs';
  if (isIndexedDBSupported()) return 'indexeddb';
  return 'memory';
}
