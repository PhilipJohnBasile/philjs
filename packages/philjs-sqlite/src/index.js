/**
 * @philjs/sqlite
 * SQLite WASM for browser with reactive queries and sync engine
 *
 * @packageDocumentation
 */
// Database
export { SQLiteDB, createDatabase, createMemoryDatabase, createPersistentDatabase, createIndexedDBDatabase, isOPFSSupported, isIndexedDBSupported, getBestPersistenceMode, } from './db/sqlite-wasm.js';
export { MigrationManager, createMigrationManager, defineMigration, migrationsFromSQL, } from './db/migrations.js';
// Reactive
export { ReactiveQuery, createReactiveQuery, QueryBuilder, query, } from './reactive/reactive-query.js';
// Sync
export { SQLiteSyncEngine, createSyncEngine, } from './sync/sync-engine.js';
// Hooks
export { useSQLite, useQuery, useSync, useKVStore, getDatabase, closeDatabase, closeAllDatabases, } from './hooks.js';
//# sourceMappingURL=index.js.map