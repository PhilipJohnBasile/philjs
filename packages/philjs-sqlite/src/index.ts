/**
 * @philjs/sqlite
 * SQLite WASM for browser with reactive queries and sync engine
 *
 * @packageDocumentation
 */

// Database
export {
  SQLiteDB,
  createDatabase,
  createMemoryDatabase,
  createPersistentDatabase,
  createIndexedDBDatabase,
  isOPFSSupported,
  isIndexedDBSupported,
  getBestPersistenceMode,
  type SQLiteConfig,
  type PersistenceMode,
  type Row,
  type TableChangeEvent,
  type TableChangeCallback,
  type PreparedStatement,
} from './db/sqlite-wasm.js';

export {
  MigrationManager,
  createMigrationManager,
  defineMigration,
  migrationsFromSQL,
  type Migration,
  type MigrationResult,
} from './db/migrations.js';

// Reactive
export {
  ReactiveQuery,
  createReactiveQuery,
  QueryBuilder,
  query,
  type ReactiveQueryOptions,
  type ReactiveQueryState,
} from './reactive/reactive-query.js';

// Sync
export {
  SQLiteSyncEngine,
  createSyncEngine,
  type SyncConfig,
  type SyncResult,
  type SyncConflict,
  type ConflictResolution,
  type ChangeRecord,
} from './sync/sync-engine.js';

// Hooks
export {
  useSQLite,
  useQuery,
  useSync,
  useKVStore,
  getDatabase,
  closeDatabase,
  closeAllDatabases,
  type SQLiteContext,
  type ReactiveQueryResult,
  type SyncHookResult,
} from './hooks.js';
