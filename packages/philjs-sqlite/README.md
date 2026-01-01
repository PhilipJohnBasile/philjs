# @philjs/sqlite

SQLite WASM for browser with reactive queries and sync engine for PhilJS.

## Overview

`@philjs/sqlite` provides a complete SQLite database solution for browser applications using WebAssembly. It includes reactive queries that auto-update when data changes and a sync engine for offline-first applications.

## Features

- **SQLite in the Browser**: Full SQL power via WebAssembly
- **Multiple Persistence Modes**: Memory, IndexedDB, or OPFS
- **Reactive Queries**: Auto-updating queries using signals
- **Query Builder**: Type-safe fluent query API
- **Sync Engine**: Offline-first with conflict resolution
- **Migration Support**: Schema versioning and migrations
- **Change Tracking**: Subscribe to table changes

## Installation

```bash
npm install @philjs/sqlite
# or
pnpm add @philjs/sqlite
```

## Quick Start

```typescript
import { createMemoryDatabase, createReactiveQuery } from '@philjs/sqlite';

// Create and initialize database
const db = createMemoryDatabase('myapp');
await db.initialize();

// Create tables
db.exec(`
  CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE
  )
`);

// Insert data
db.exec('INSERT INTO users (name, email) VALUES (?, ?)', ['John', 'john@example.com']);

// Query data
const users = db.query<{ id: number; name: string; email: string }>('SELECT * FROM users');
console.log(users);

// Create reactive query that auto-updates
const reactiveUsers = createReactiveQuery(db, {
  sql: 'SELECT * FROM users ORDER BY name',
});

// Subscribe to changes
reactiveUsers.subscribe(() => {
  console.log('Users updated:', reactiveUsers.data);
});

// Insert triggers auto-update
db.exec('INSERT INTO users (name, email) VALUES (?, ?)', ['Jane', 'jane@example.com']);
```

## Database Creation

### Memory Database

```typescript
import { createMemoryDatabase } from '@philjs/sqlite';

const db = createMemoryDatabase('my-memory-db');
await db.initialize();
```

### Persistent Database (OPFS)

```typescript
import { createPersistentDatabase } from '@philjs/sqlite';

const db = createPersistentDatabase('my-persistent-db');
await db.initialize();
```

### Custom Configuration

```typescript
import { createDatabase, type SQLiteConfig } from '@philjs/sqlite';

const config: SQLiteConfig = {
  dbName: 'custom-db',
  persistenceMode: 'indexeddb', // 'memory' | 'opfs' | 'indexeddb'
  pageSize: 8192,
  cacheSize: 5000,
  walMode: true,
  readOnly: false,
};

const db = createDatabase(config);
await db.initialize();
```

## SQL Operations

### Execute SQL

```typescript
// Execute without results
db.exec('CREATE TABLE products (id INTEGER PRIMARY KEY, name TEXT, price REAL)');

// Execute with parameters
db.exec('INSERT INTO products (name, price) VALUES (?, ?)', ['Widget', 29.99]);
```

### Query Data

```typescript
// Query all results
const products = db.query<Product>('SELECT * FROM products');

// Query with parameters
const expensive = db.query<Product>('SELECT * FROM products WHERE price > ?', [50]);

// Query single result
const product = db.queryOne<Product>('SELECT * FROM products WHERE id = ?', [1]);
```

### Run with Change Info

```typescript
const result = db.run('INSERT INTO products (name, price) VALUES (?, ?)', ['Gadget', 49.99]);
console.log('Changes:', result.changes);
console.log('Last ID:', result.lastInsertRowid);
```

### Transactions

```typescript
// Synchronous transaction
db.transaction(() => {
  db.exec('INSERT INTO accounts (balance) VALUES (?)', [1000]);
  db.exec('UPDATE accounts SET balance = balance - 100 WHERE id = ?', [1]);
  db.exec('UPDATE accounts SET balance = balance + 100 WHERE id = ?', [2]);
});

// Async transaction
await db.transactionAsync(async () => {
  db.exec('INSERT INTO logs (message) VALUES (?)', ['Started']);
  await someAsyncOperation();
  db.exec('INSERT INTO logs (message) VALUES (?)', ['Completed']);
});
```

## Reactive Queries

### Basic Reactive Query

```typescript
import { createReactiveQuery } from '@philjs/sqlite';

const query = createReactiveQuery(db, {
  sql: 'SELECT * FROM products WHERE price < ?',
  params: [100],
});

// Access current data
console.log(query.data);
console.log(query.loading);
console.log(query.error);
console.log(query.updatedAt);

// Subscribe to changes
const unsubscribe = query.subscribe(() => {
  console.log('Data updated:', query.data);
});

// Update parameters
query.setParams([50]);

// Manual refresh
query.refresh();

// Cleanup
query.dispose();
```

### With Transform

```typescript
interface Product { id: number; name: string; price: number }
interface ProductDisplay { id: number; name: string; displayPrice: string }

const query = createReactiveQuery<ProductDisplay>(db, {
  sql: 'SELECT * FROM products',
  transform: (rows) => rows.map(row => ({
    id: row.id as number,
    name: row.name as string,
    displayPrice: `$${(row.price as number).toFixed(2)}`,
  })),
});
```

### With Debouncing

```typescript
const query = createReactiveQuery(db, {
  sql: 'SELECT * FROM logs ORDER BY created_at DESC',
  debounce: 100, // Debounce updates by 100ms
});
```

## Query Builder

### Basic Usage

```typescript
import { query } from '@philjs/sqlite';

const products = query(db)
  .select(['id', 'name', 'price'])
  .from('products')
  .where('category = ?', 'electronics')
  .where('price < ?', 500)
  .orderBy('price', 'ASC')
  .limit(10)
  .execute();
```

### Build SQL

```typescript
const { sql, params } = query(db)
  .select('*')
  .from('users')
  .where('role = ?', 'admin')
  .orderBy('name')
  .toSQL();

console.log(sql);    // SELECT * FROM users WHERE role = ? ORDER BY name ASC
console.log(params); // ['admin']
```

### Reactive Query Builder

```typescript
const reactiveProducts = query(db)
  .select('*')
  .from('products')
  .where('active = ?', true)
  .orderBy('created_at', 'DESC')
  .limit(20)
  .reactive({ debounce: 50 });
```

## Migrations

### Define Migrations

```typescript
import { createMigrationManager, defineMigration } from '@philjs/sqlite';

const manager = createMigrationManager(db);

manager.add(defineMigration({
  version: 1,
  name: 'create_users_table',
  up: `
    CREATE TABLE users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE,
      created_at TEXT DEFAULT (datetime('now'))
    )
  `,
  down: 'DROP TABLE users',
}));

manager.add(defineMigration({
  version: 2,
  name: 'add_user_role',
  up: "ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'user'",
  down: 'ALTER TABLE users DROP COLUMN role',
}));
```

### Run Migrations

```typescript
// Run all pending migrations
const result = manager.migrate();
if (result.success) {
  console.log('Applied:', result.applied);
}

// Migrate to specific version
manager.migrateTo(1);

// Rollback last migration
manager.rollback();

// Reset (rollback all)
manager.reset();
```

### Check Status

```typescript
const status = manager.getStatus();
console.log('Current version:', status.current);
console.log('Latest version:', status.latest);
console.log('Pending:', status.pending);
console.log('Applied:', status.applied);
```

## Sync Engine

### Basic Setup

```typescript
import { createSyncEngine } from '@philjs/sqlite';

const syncEngine = createSyncEngine(db, {
  endpoint: 'https://api.example.com/sync',
  tables: ['users', 'posts', 'comments'],
  conflictStrategy: 'last-write-wins',
  getAuthToken: async () => localStorage.getItem('auth_token'),
});

await syncEngine.initialize();
```

### Manual Sync

```typescript
const result = await syncEngine.sync();
console.log('Success:', result.success);
console.log('Pushed:', result.pushed);
console.log('Pulled:', result.pulled);
console.log('Conflicts:', result.conflicts);
console.log('Duration:', result.duration, 'ms');
```

### Auto-Sync

```typescript
const syncEngine = createSyncEngine(db, {
  endpoint: 'https://api.example.com/sync',
  tables: ['users'],
  conflictStrategy: 'server-wins',
  syncInterval: 30000, // Sync every 30 seconds
  onSyncComplete: (result) => {
    console.log('Sync completed:', result);
  },
});

// Stop auto-sync
syncEngine.stopSyncInterval();
```

### Conflict Resolution Strategies

```typescript
// Client always wins
{ conflictStrategy: 'client-wins' }

// Server always wins
{ conflictStrategy: 'server-wins' }

// Most recent write wins
{ conflictStrategy: 'last-write-wins' }

// Merge fields (remote values take precedence)
{ conflictStrategy: 'merge' }

// Manual resolution
{
  conflictStrategy: 'manual',
  onConflict: async (conflict) => {
    console.log('Local:', conflict.localData);
    console.log('Remote:', conflict.remoteData);

    // Return resolution
    return { action: 'use-merged', mergedData: { ...conflict.localData, ...conflict.remoteData } };
  }
}
```

### Sync Status

```typescript
const status = syncEngine.getStatus();
console.log('Pending changes:', status.pendingChanges);
console.log('Last sync:', new Date(status.lastSync));
console.log('Currently syncing:', status.syncing);
```

## Change Listeners

### Listen to Specific Table

```typescript
const unsubscribe = db.onTableChange('users', (event) => {
  console.log('Table:', event.table);
  console.log('Operation:', event.operation); // 'INSERT' | 'UPDATE' | 'DELETE'
  console.log('Row ID:', event.rowId);
});

// Stop listening
unsubscribe();
```

### Listen to All Changes

```typescript
const unsubscribe = db.onAnyChange((event) => {
  console.log('Change detected:', event);
});
```

## Hooks

### useSQLite

```typescript
import { useSQLite } from '@philjs/sqlite';

const { db, ready, error, exec, query, queryOne, run, transaction } = useSQLite({
  dbName: 'myapp',
  persistenceMode: 'opfs',
});

if (ready) {
  const users = query<User>('SELECT * FROM users');
}
```

### useQuery

```typescript
import { useQuery } from '@philjs/sqlite';

const { data, loading, error, refetch, setParams } = useQuery<User>(
  'SELECT * FROM users WHERE role = ?',
  ['admin'],
  {
    dbName: 'myapp',
    debounce: 100,
  }
);

// Update query parameters
setParams(['user']);

// Manual refresh
refetch();
```

### useSync

```typescript
import { useSync } from '@philjs/sqlite';

const { status, sync, stop } = useSync({
  endpoint: 'https://api.example.com/sync',
  tables: ['users', 'posts'],
  conflictStrategy: 'last-write-wins',
  syncInterval: 60000,
});

// Manual sync
await sync();

// Stop auto-sync
stop();
```

### useKVStore

```typescript
import { useKVStore } from '@philjs/sqlite';

const kv = useKVStore('settings');

// Set value
kv.set('theme', 'dark');
kv.set('user', { name: 'John', preferences: { notifications: true } });

// Get value
const theme = kv.get<string>('theme');
const user = kv.get<User>('user');

// Delete
kv.delete('theme');

// Get all keys
const keys = kv.keys();

// Clear all
kv.clear();
```

## Database Management

```typescript
import { getDatabase, closeDatabase, closeAllDatabases } from '@philjs/sqlite';

// Get database by name
const db = getDatabase('myapp');

// Close specific database
closeDatabase('myapp');

// Close all databases
closeAllDatabases();
```

## TypeScript Support

Full type exports:

```typescript
import type {
  // Database types
  SQLiteDB,
  SQLiteConfig,
  PersistenceMode,
  Row,
  TableChangeEvent,
  TableChangeCallback,

  // Migration types
  Migration,
  MigrationResult,

  // Reactive types
  ReactiveQuery,
  ReactiveQueryOptions,
  ReactiveQueryState,

  // Sync types
  SQLiteSyncEngine,
  SyncConfig,
  SyncResult,
  SyncConflict,
  ConflictResolution,
  ChangeRecord,

  // Hook types
  SQLiteContext,
  ReactiveQueryResult,
  SyncHookResult,
} from '@philjs/sqlite';
```

## Subpath Exports

```typescript
// Database only
import { SQLiteDB, createDatabase } from '@philjs/sqlite/db';

// Reactive queries only
import { ReactiveQuery, QueryBuilder, query } from '@philjs/sqlite/reactive';

// Sync engine only
import { SQLiteSyncEngine, createSyncEngine } from '@philjs/sqlite/sync';

// Hooks only
import { useSQLite, useQuery, useSync, useKVStore } from '@philjs/sqlite/hooks';
```

## Browser Compatibility

- **Memory mode**: All modern browsers
- **IndexedDB mode**: All modern browsers
- **OPFS mode**: Chrome 102+, Edge 102+, Firefox 111+, Safari 15.2+

<!-- API_SNAPSHOT_START -->
## API Snapshot

This section is generated from the package source. Run `node scripts/generate-package-atlas.mjs` to refresh.

### Entry Points
- Export keys: ., ./db, ./reactive, ./sync, ./hooks
- Source files: packages/philjs-sqlite/src/index.ts, packages/philjs-sqlite/src/db/index.ts, packages/philjs-sqlite/src/reactive/index.ts, packages/philjs-sqlite/src/sync/index.ts, packages/philjs-sqlite/src/hooks.ts

### Public API
- Direct exports: ReactiveQueryResult, SQLiteContext, SyncHookResult, closeAllDatabases, closeDatabase, getDatabase, useKVStore, useQuery, useSQLite, useSync
- Re-exported names: ChangeRecord, ConflictResolution, Migration, MigrationManager, MigrationResult, PersistenceMode, PreparedStatement, QueryBuilder, ReactiveQuery, ReactiveQueryOptions, ReactiveQueryResult, ReactiveQueryState, Row, SQLiteConfig, SQLiteContext, SQLiteDB, SQLiteSyncEngine, SyncConfig, SyncConflict, SyncHookResult, SyncResult, TableChangeCallback, TableChangeEvent, closeAllDatabases, closeDatabase, createDatabase, createIndexedDBDatabase, createMemoryDatabase, createMigrationManager, createPersistentDatabase, createReactiveQuery, createSyncEngine, defineMigration, getBestPersistenceMode, getDatabase, isIndexedDBSupported, isOPFSSupported, migrationsFromSQL, query, useKVStore, useQuery, useSQLite, useSync
- Re-exported modules: ./db/migrations.js, ./db/sqlite-wasm.js, ./hooks.js, ./migrations.js, ./reactive-query.js, ./reactive/reactive-query.js, ./sqlite-wasm.js, ./sync-engine.js, ./sync/sync-engine.js
<!-- API_SNAPSHOT_END -->

## License

MIT
