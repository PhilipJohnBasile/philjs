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
/**
 * IndexedDB persistence helper
 */
class IndexedDBPersistence {
    dbName;
    storeName = 'sqlite_databases';
    db = null;
    constructor(dbName) {
        this.dbName = dbName;
    }
    async open() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open('philjs_sqlite_persistence', 1);
            request.onerror = () => reject(new Error('Failed to open IndexedDB'));
            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                if (!db.objectStoreNames.contains(this.storeName)) {
                    db.createObjectStore(this.storeName);
                }
            };
            request.onsuccess = (event) => {
                this.db = event.target.result;
                resolve();
            };
        });
    }
    async load() {
        if (!this.db)
            await this.open();
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(this.storeName, 'readonly');
            const store = transaction.objectStore(this.storeName);
            const request = store.get(this.dbName);
            request.onerror = () => reject(new Error('Failed to load from IndexedDB'));
            request.onsuccess = () => resolve(request.result ?? null);
        });
    }
    async save(data) {
        if (!this.db)
            await this.open();
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(this.storeName, 'readwrite');
            const store = transaction.objectStore(this.storeName);
            const request = store.put(data, this.dbName);
            request.onerror = () => reject(new Error('Failed to save to IndexedDB'));
            request.onsuccess = () => resolve();
        });
    }
    async delete() {
        if (!this.db)
            await this.open();
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(this.storeName, 'readwrite');
            const store = transaction.objectStore(this.storeName);
            const request = store.delete(this.dbName);
            request.onerror = () => reject(new Error('Failed to delete from IndexedDB'));
            request.onsuccess = () => resolve();
        });
    }
    close() {
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
    dbName;
    dirHandle = null;
    constructor(dbName) {
        this.dbName = dbName;
    }
    static isSupported() {
        return typeof navigator !== 'undefined' &&
            'storage' in navigator &&
            typeof navigator.storage.getDirectory === 'function';
    }
    async open() {
        if (!OPFSPersistence.isSupported()) {
            throw new Error('OPFS is not supported in this browser');
        }
        this.dirHandle = await navigator.storage.getDirectory();
    }
    async load() {
        if (!this.dirHandle)
            await this.open();
        try {
            const fileHandle = await this.dirHandle.getFileHandle(`${this.dbName}.sqlite`, { create: false });
            const file = await fileHandle.getFile();
            const buffer = await file.arrayBuffer();
            return new Uint8Array(buffer);
        }
        catch (error) {
            // File doesn't exist yet
            if (error.name === 'NotFoundError') {
                return null;
            }
            throw error;
        }
    }
    async save(data) {
        if (!this.dirHandle)
            await this.open();
        const fileHandle = await this.dirHandle.getFileHandle(`${this.dbName}.sqlite`, { create: true });
        const writable = await fileHandle.createWritable();
        await writable.write(data);
        await writable.close();
    }
    async delete() {
        if (!this.dirHandle)
            await this.open();
        try {
            await this.dirHandle.removeEntry(`${this.dbName}.sqlite`);
        }
        catch {
            // File might not exist, ignore
        }
    }
}
/**
 * SQLite WASM module loader with caching
 */
let sqlJsInstance = null;
let sqlJsLoadPromise = null;
async function loadSqlJs(wasmUrl) {
    if (sqlJsInstance)
        return sqlJsInstance;
    if (sqlJsLoadPromise)
        return sqlJsLoadPromise;
    sqlJsLoadPromise = (async () => {
        // Dynamic import of sql.js
        const initSqlJs = (await import('sql.js')).default;
        // Configure WASM location
        const config = {};
        if (wasmUrl) {
            config.locateFile = () => wasmUrl;
        }
        else {
            // Check if running in Node.js (test environment)
            const isNode = typeof globalThis.process !== 'undefined' &&
                globalThis.process.versions?.node;
            if (isNode) {
                // In Node.js, use the local node_modules path
                const { createRequire } = await import('module');
                const require = createRequire(import.meta.url);
                const sqlJsPath = require.resolve('sql.js');
                const wasmPath = sqlJsPath.replace(/sql-wasm\.js$/, '').replace(/dist[\\\/]index\.js$/, 'dist/');
                config.locateFile = (file) => wasmPath + file;
            }
            else {
                // In browser, use CDN location for sql.js WASM
                config.locateFile = (file) => `https://sql.js.org/dist/${file}`;
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
    db = null;
    sqlJs = null;
    config;
    initialized = false;
    changeListeners = new Map();
    globalListeners = new Set();
    persistence = null;
    autoSaveTimer = null;
    dirty = false;
    constructor(config) {
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
    async initialize() {
        if (this.initialized)
            return;
        try {
            // Load sql.js WASM module
            this.sqlJs = await loadSqlJs(this.config.wasmUrl);
            // Setup persistence based on mode
            await this.setupPersistence();
            // Load existing data or create new database
            const existingData = await this.loadPersistedData();
            if (existingData) {
                this.db = new this.sqlJs.Database(existingData);
            }
            else {
                this.db = new this.sqlJs.Database();
            }
            // Configure database
            await this.configureDatabase();
            // Setup auto-save if using persistence
            if (this.config.persistenceMode !== 'memory' && this.config.autoSaveInterval) {
                this.startAutoSave();
            }
            this.initialized = true;
        }
        catch (error) {
            throw new Error(`Failed to initialize SQLite: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    /**
     * Setup persistence layer based on mode
     */
    async setupPersistence() {
        switch (this.config.persistenceMode) {
            case 'opfs':
                if (OPFSPersistence.isSupported()) {
                    this.persistence = new OPFSPersistence(this.config.dbName);
                }
                else {
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
    async loadPersistedData() {
        if (!this.persistence)
            return null;
        try {
            return await this.persistence.load();
        }
        catch {
            return null;
        }
    }
    /**
     * Configure database settings
     */
    async configureDatabase() {
        if (!this.db)
            return;
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
    startAutoSave() {
        if (this.autoSaveTimer)
            return;
        this.autoSaveTimer = setInterval(async () => {
            if (this.dirty) {
                await this.persist();
            }
        }, this.config.autoSaveInterval);
    }
    /**
     * Stop auto-save timer
     */
    stopAutoSave() {
        if (this.autoSaveTimer) {
            clearInterval(this.autoSaveTimer);
            this.autoSaveTimer = null;
        }
    }
    /**
     * Persist database to storage
     */
    async persist() {
        if (!this.persistence || !this.db)
            return;
        const data = this.db.export();
        await this.persistence.save(data);
        this.dirty = false;
    }
    /**
     * Mark database as dirty (needs persistence)
     */
    markDirty() {
        this.dirty = true;
    }
    /**
     * Execute SQL without returning results
     */
    exec(sql, params) {
        this.ensureInitialized();
        if (params && params.length > 0) {
            this.db.run(sql, params);
        }
        else {
            this.db.exec(sql);
        }
        // Mark as dirty for persistence
        this.markDirty();
        // Detect changes and notify listeners
        this.detectAndNotifyChanges(sql);
    }
    /**
     * Execute SQL and return results
     */
    query(sql, params) {
        this.ensureInitialized();
        const results = params && params.length > 0
            ? this.db.exec(sql, params)
            : this.db.exec(sql);
        if (results.length === 0)
            return [];
        // Convert sql.js format to Row format
        const { columns, values } = results[0];
        return values.map((row) => {
            const obj = {};
            columns.forEach((col, i) => {
                obj[col] = row[i];
            });
            return obj;
        });
    }
    /**
     * Execute SQL and return first result
     */
    queryOne(sql, params) {
        const results = this.query(sql, params);
        return results[0];
    }
    /**
     * Run SQL and return change info
     */
    run(sql, params) {
        this.ensureInitialized();
        this.db.run(sql, params);
        // Get change info
        const changes = this.db.getRowsModified();
        const lastInsertRowid = this.queryOne('SELECT last_insert_rowid() as id')?.id ?? 0;
        // Mark as dirty for persistence
        this.markDirty();
        // Detect changes and notify listeners
        this.detectAndNotifyChanges(sql);
        return { changes, lastInsertRowid };
    }
    /**
     * Create a prepared statement
     */
    prepare(sql) {
        this.ensureInitialized();
        const stmt = this.db.prepare(sql);
        let boundParams;
        return {
            all: (params) => {
                const p = params ?? boundParams;
                if (p)
                    stmt.bind(p);
                const results = [];
                while (stmt.step()) {
                    const row = stmt.getAsObject();
                    results.push(row);
                }
                stmt.reset();
                return results;
            },
            get: (params) => {
                const p = params ?? boundParams;
                if (p)
                    stmt.bind(p);
                if (stmt.step()) {
                    const row = stmt.getAsObject();
                    stmt.reset();
                    return row;
                }
                stmt.reset();
                return undefined;
            },
            run: (params) => {
                const p = params ?? boundParams;
                if (p)
                    stmt.bind(p);
                stmt.step();
                stmt.reset();
                const changes = this.db.getRowsModified();
                const lastInsertRowid = this.queryOne('SELECT last_insert_rowid() as id')?.id ?? 0;
                this.markDirty();
                return { changes, lastInsertRowid };
            },
            free: () => {
                stmt.free();
            },
            bind: (params) => {
                boundParams = params;
                return this;
            },
        };
    }
    /**
     * Execute multiple statements in a transaction
     */
    transaction(fn) {
        this.exec('BEGIN TRANSACTION');
        try {
            const result = fn();
            this.exec('COMMIT');
            return result;
        }
        catch (error) {
            this.exec('ROLLBACK');
            throw error;
        }
    }
    /**
     * Execute async operations in a transaction
     */
    async transactionAsync(fn) {
        this.exec('BEGIN TRANSACTION');
        try {
            const result = await fn();
            this.exec('COMMIT');
            return result;
        }
        catch (error) {
            this.exec('ROLLBACK');
            throw error;
        }
    }
    /**
     * Execute multiple SQL statements in a batch
     */
    batch(statements) {
        this.transaction(() => {
            for (const { sql, params } of statements) {
                this.run(sql, params);
            }
        });
    }
    /**
     * Subscribe to changes on a specific table
     */
    onTableChange(table, callback) {
        let listeners = this.changeListeners.get(table);
        if (!listeners) {
            listeners = new Set();
            this.changeListeners.set(table, listeners);
        }
        listeners.add(callback);
        return () => {
            listeners.delete(callback);
            if (listeners.size === 0) {
                this.changeListeners.delete(table);
            }
        };
    }
    /**
     * Subscribe to all table changes
     */
    onAnyChange(callback) {
        this.globalListeners.add(callback);
        return () => this.globalListeners.delete(callback);
    }
    /**
     * Detect changes from SQL and notify listeners
     */
    detectAndNotifyChanges(sql) {
        const upperSql = sql.toUpperCase().trim();
        let operation = null;
        let table = null;
        if (upperSql.startsWith('INSERT')) {
            operation = 'INSERT';
            const match = sql.match(/INSERT\s+INTO\s+[`"']?(\w+)[`"']?/i);
            table = match?.[1] ?? null;
        }
        else if (upperSql.startsWith('UPDATE')) {
            operation = 'UPDATE';
            const match = sql.match(/UPDATE\s+[`"']?(\w+)[`"']?/i);
            table = match?.[1] ?? null;
        }
        else if (upperSql.startsWith('DELETE')) {
            operation = 'DELETE';
            const match = sql.match(/DELETE\s+FROM\s+[`"']?(\w+)[`"']?/i);
            table = match?.[1] ?? null;
        }
        if (operation && table) {
            const lastRowId = this.queryOne('SELECT last_insert_rowid() as id')?.id ?? 0;
            const event = { table, operation, rowId: lastRowId };
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
    getTables() {
        const results = this.query("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'");
        return results.map((r) => r.name);
    }
    /**
     * Get table schema
     */
    getTableSchema(table) {
        return this.query(`PRAGMA table_info(${table})`).map((row) => ({
            name: row.name,
            type: row.type,
            notnull: Boolean(row.notnull),
            pk: Boolean(row.pk),
        }));
    }
    /**
     * Check if table exists
     */
    tableExists(table) {
        const result = this.queryOne("SELECT COUNT(*) as count FROM sqlite_master WHERE type='table' AND name=?", [table]);
        return (result?.count ?? 0) > 0;
    }
    /**
     * Get row count for a table
     */
    getRowCount(table) {
        const result = this.queryOne(`SELECT COUNT(*) as count FROM ${table}`);
        return result?.count ?? 0;
    }
    /**
     * Export database to bytes
     */
    export() {
        this.ensureInitialized();
        return this.db.export();
    }
    /**
     * Import database from bytes
     */
    async import(data) {
        this.ensureInitialized();
        // Close current database
        this.db.close();
        // Create new database from data
        this.db = new this.sqlJs.Database(data);
        // Re-configure
        await this.configureDatabase();
        // Persist the imported data
        this.markDirty();
        await this.persist();
    }
    /**
     * Close the database
     */
    async close() {
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
    async delete() {
        await this.close();
        if (this.persistence) {
            await this.persistence.delete();
        }
    }
    /**
     * Ensure database is initialized
     */
    ensureInitialized() {
        if (!this.initialized || !this.db) {
            throw new Error('Database not initialized. Call initialize() first.');
        }
    }
    /**
     * Check if initialized
     */
    isInitialized() {
        return this.initialized;
    }
    /**
     * Get database name
     */
    getName() {
        return this.config.dbName;
    }
    /**
     * Get persistence mode
     */
    getPersistenceMode() {
        return this.config.persistenceMode;
    }
    /**
     * Get actual persistence type (may differ from config if fallback occurred)
     */
    getActualPersistenceType() {
        if (!this.persistence)
            return 'memory';
        if (this.persistence instanceof OPFSPersistence)
            return 'opfs';
        return 'indexeddb';
    }
    /**
     * Force persist to storage immediately
     */
    async flush() {
        await this.persist();
    }
    /**
     * Vacuum the database to reclaim space
     */
    vacuum() {
        this.exec('VACUUM');
    }
    /**
     * Get database file size in bytes
     */
    getSize() {
        const data = this.export();
        return data.byteLength;
    }
    /**
     * Execute raw SQL and get raw results (sql.js format)
     */
    execRaw(sql) {
        this.ensureInitialized();
        return this.db.exec(sql);
    }
}
/**
 * Create a new SQLite database
 */
export function createDatabase(config) {
    return new SQLiteDB(config);
}
/**
 * Create an in-memory database
 */
export function createMemoryDatabase(name = 'memory') {
    return new SQLiteDB({ dbName: name, persistenceMode: 'memory' });
}
/**
 * Create a persistent database using OPFS (with IndexedDB fallback)
 */
export function createPersistentDatabase(name) {
    return new SQLiteDB({ dbName: name, persistenceMode: 'opfs' });
}
/**
 * Create a database with IndexedDB persistence
 */
export function createIndexedDBDatabase(name) {
    return new SQLiteDB({ dbName: name, persistenceMode: 'indexeddb' });
}
/**
 * Check if OPFS is supported in the current environment
 */
export function isOPFSSupported() {
    return OPFSPersistence.isSupported();
}
/**
 * Check if IndexedDB is supported in the current environment
 */
export function isIndexedDBSupported() {
    return typeof indexedDB !== 'undefined';
}
/**
 * Get the best available persistence mode
 */
export function getBestPersistenceMode() {
    if (isOPFSSupported())
        return 'opfs';
    if (isIndexedDBSupported())
        return 'indexeddb';
    return 'memory';
}
//# sourceMappingURL=sqlite-wasm.js.map