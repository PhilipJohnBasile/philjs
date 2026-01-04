# @philjs/sqlite

SQLite WASM for browser with reactive queries and sync engine.

## Introduction

`@philjs/sqlite` brings the full power of SQLite to the browser via WebAssembly. Built on top of sql.js, it provides a complete local database solution with reactive queries that automatically update when data changes, multiple persistence options, schema migrations, and a sync engine for synchronizing with remote servers.

### Key Features

- **Real SQLite Database** - Full SQL support via WebAssembly
- **Multiple Persistence Modes** - OPFS, IndexedDB, or in-memory
- **Reactive Queries** - Auto-updating queries that react to data changes
- **Schema Migrations** - Version-controlled database schema management
- **Sync Engine** - Bidirectional sync with conflict resolution
- **PhilJS Integration** - Hooks for seamless framework integration
- **Type-Safe** - Full TypeScript support with generics

## Installation

```bash
npm install @philjs/sqlite
```

## Quick Start

```typescript
import {
  createPersistentDatabase,
  createMigrationManager,
  defineMigration,
  createReactiveQuery,
} from '@philjs/sqlite';

// Create a persistent database
const db = createPersistentDatabase('myapp');
await db.initialize();

// Define and run migrations
const migrations = createMigrationManager(db);
migrations.add(defineMigration({
  version: 1,
  name: 'create_users',
  up: `CREATE TABLE users (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE
  )`,
  down: 'DROP TABLE users',
}));
migrations.migrate();

// Insert data
db.run('INSERT INTO users (name, email) VALUES (?, ?)', ['Alice', 'alice@example.com']);

// Create a reactive query
const usersQuery = createReactiveQuery(db, {
  sql: 'SELECT * FROM users',
});

// Query auto-updates when users table changes
usersQuery.subscribe(() => {
  console.log('Users updated:', usersQuery.data);
});
```

---

## Database Creation

The package provides multiple ways to create databases depending on your persistence requirements.

### createDatabase()

Creates a database with full configuration options.

```typescript
import { createDatabase, type SQLiteConfig } from '@philjs/sqlite';

const config: SQLiteConfig = {
  dbName: 'myapp',
  persistenceMode: 'opfs',  // 'memory' | 'opfs' | 'indexeddb'
  pageSize: 4096,           // Page size in bytes
  cacheSize: 2000,          // Cache size in pages
  walMode: false,           // WAL mode (limited browser support)
  readOnly: false,          // Read-only mode
  autoSaveInterval: 5000,   // Auto-save interval in ms
  wasmUrl: undefined,       // Custom WASM URL (optional)
};

const db = createDatabase(config);
await db.initialize();
```

### createMemoryDatabase()

Creates an in-memory database. Data is lost when the page is closed - ideal for testing or temporary data.

```typescript
import { createMemoryDatabase } from '@philjs/sqlite';

const db = createMemoryDatabase('test-db');
await db.initialize();

// Perfect for testing
db.exec('CREATE TABLE temp_data (id INTEGER, value TEXT)');
db.run('INSERT INTO temp_data VALUES (?, ?)', [1, 'temporary']);
```

### createPersistentDatabase()

Creates a database with OPFS (Origin Private File System) persistence. Falls back to IndexedDB if OPFS is not supported.

```typescript
import { createPersistentDatabase } from '@philjs/sqlite';

const db = createPersistentDatabase('myapp');
await db.initialize();

// Data persists across sessions
db.exec('CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT)');
db.run('INSERT OR REPLACE INTO settings VALUES (?, ?)', ['theme', 'dark']);

// Check actual persistence type used
console.log(db.getActualPersistenceType()); // 'opfs' or 'indexeddb'
```

### createIndexedDBDatabase()

Creates a database that explicitly uses IndexedDB for persistence.

```typescript
import { createIndexedDBDatabase } from '@philjs/sqlite';

const db = createIndexedDBDatabase('fallback-db');
await db.initialize();

// Guaranteed IndexedDB persistence
// Useful for broader browser compatibility
```

### getBestPersistenceMode()

Detects and returns the best available persistence mode for the current browser.

```typescript
import { getBestPersistenceMode, isOPFSSupported, isIndexedDBSupported } from '@philjs/sqlite';

// Get best available mode
const mode = getBestPersistenceMode();
console.log(`Using ${mode} for persistence`);

// Check specific support
if (isOPFSSupported()) {
  console.log('OPFS is available - best performance!');
} else if (isIndexedDBSupported()) {
  console.log('Using IndexedDB fallback');
} else {
  console.log('Only memory mode available');
}
```

---

## SQLiteDB Class

The `SQLiteDB` class is the main interface for database operations.

### exec()

Executes SQL without returning results. Use for DDL statements and writes where you don't need return values.

```typescript
// Create tables
db.exec(`
  CREATE TABLE IF NOT EXISTS posts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    content TEXT,
    author_id INTEGER REFERENCES users(id),
    created_at TEXT DEFAULT (datetime('now'))
  )
`);

// Execute with parameters
db.exec('DELETE FROM posts WHERE author_id = ?', [userId]);

// Multiple statements
db.exec(`
  CREATE INDEX idx_posts_author ON posts(author_id);
  CREATE INDEX idx_posts_created ON posts(created_at);
`);
```

### query() and queryOne()

Execute queries and return results.

```typescript
interface User {
  id: number;
  name: string;
  email: string;
}

// Query all results
const users = db.query<User>('SELECT * FROM users WHERE active = ?', [true]);
console.log(users); // [{ id: 1, name: 'Alice', ... }, ...]

// Query single result
const user = db.queryOne<User>('SELECT * FROM users WHERE id = ?', [userId]);
if (user) {
  console.log(`Found user: ${user.name}`);
}

// Complex queries
const stats = db.query<{ author: string; count: number }>(`
  SELECT u.name as author, COUNT(p.id) as count
  FROM users u
  LEFT JOIN posts p ON p.author_id = u.id
  GROUP BY u.id
  ORDER BY count DESC
`);
```

### run()

Executes SQL and returns change information.

```typescript
// Insert and get the new row ID
const result = db.run(
  'INSERT INTO users (name, email) VALUES (?, ?)',
  ['Bob', 'bob@example.com']
);
console.log(`Inserted user with ID: ${result.lastInsertRowid}`);
console.log(`Rows affected: ${result.changes}`);

// Update and check affected rows
const updateResult = db.run(
  'UPDATE users SET active = ? WHERE last_login < ?',
  [false, '2024-01-01']
);
console.log(`Deactivated ${updateResult.changes} users`);
```

### prepare()

Creates prepared statements for repeated execution with different parameters.

```typescript
interface Post {
  id: number;
  title: string;
  content: string;
}

// Prepare a statement
const insertPost = db.prepare<Post>(
  'INSERT INTO posts (title, content, author_id) VALUES (?, ?, ?)'
);

// Execute multiple times efficiently
for (const post of postsToInsert) {
  insertPost.run([post.title, post.content, post.authorId]);
}

// Prepared query
const getPostsByAuthor = db.prepare<Post>(
  'SELECT * FROM posts WHERE author_id = ?'
);

const alicePosts = getPostsByAuthor.all([1]);
const bobPosts = getPostsByAuthor.all([2]);

// Get single result
const latestPost = db.prepare<Post>(
  'SELECT * FROM posts ORDER BY created_at DESC LIMIT 1'
).get();

// Free resources when done
insertPost.free();
getPostsByAuthor.free();
```

### transaction()

Executes multiple operations atomically.

```typescript
// Synchronous transaction
const orderId = db.transaction(() => {
  // Create order
  const { lastInsertRowid: id } = db.run(
    'INSERT INTO orders (user_id, total) VALUES (?, ?)',
    [userId, 0]
  );

  let total = 0;
  for (const item of cartItems) {
    db.run(
      'INSERT INTO order_items (order_id, product_id, quantity, price) VALUES (?, ?, ?, ?)',
      [id, item.productId, item.quantity, item.price]
    );
    total += item.quantity * item.price;

    // Update inventory
    db.run(
      'UPDATE products SET stock = stock - ? WHERE id = ?',
      [item.quantity, item.productId]
    );
  }

  // Update order total
  db.run('UPDATE orders SET total = ? WHERE id = ?', [total, id]);

  return id;
});

console.log(`Created order ${orderId}`);

// Transaction automatically rolls back on error
try {
  db.transaction(() => {
    db.run('INSERT INTO users (name) VALUES (?)', ['Alice']);
    throw new Error('Oops!'); // This triggers rollback
  });
} catch (e) {
  console.log('Transaction rolled back');
}

// Async transaction
await db.transactionAsync(async () => {
  const data = await fetchExternalData();
  db.run('INSERT INTO external_data VALUES (?)', [JSON.stringify(data)]);
});
```

### batch()

Execute multiple statements efficiently in a single transaction.

```typescript
db.batch([
  { sql: 'INSERT INTO logs (message) VALUES (?)', params: ['Event 1'] },
  { sql: 'INSERT INTO logs (message) VALUES (?)', params: ['Event 2'] },
  { sql: 'INSERT INTO logs (message) VALUES (?)', params: ['Event 3'] },
  { sql: 'UPDATE stats SET log_count = log_count + 3' },
]);
```

### Table Change Events

Subscribe to table changes for reactive updates.

```typescript
// Subscribe to specific table changes
const unsubscribe = db.onTableChange('users', (event) => {
  console.log(`Table: ${event.table}`);
  console.log(`Operation: ${event.operation}`); // 'INSERT' | 'UPDATE' | 'DELETE'
  console.log(`Row ID: ${event.rowId}`);
});

// Subscribe to all table changes
const unsubscribeAll = db.onAnyChange((event) => {
  console.log(`Change detected in ${event.table}`);
});

// Trigger notifications
db.run('INSERT INTO users (name) VALUES (?)', ['Charlie']);
// Logs: Table: users, Operation: INSERT, Row ID: 3

// Cleanup
unsubscribe();
unsubscribeAll();
```

### Utility Methods

```typescript
// Get all table names
const tables = db.getTables();
console.log(tables); // ['users', 'posts', 'comments']

// Get table schema
const schema = db.getTableSchema('users');
// [{ name: 'id', type: 'INTEGER', notnull: false, pk: true }, ...]

// Check if table exists
if (db.tableExists('users')) {
  console.log('Users table exists');
}

// Get row count
const userCount = db.getRowCount('users');

// Export database to bytes
const bytes = db.export();
await saveToFile(bytes);

// Import database from bytes
const savedData = await loadFromFile();
await db.import(savedData);

// Force save to persistence
await db.flush();

// Reclaim disk space
db.vacuum();

// Get database size
console.log(`Database size: ${db.getSize()} bytes`);

// Close database
await db.close();

// Delete database (removes persisted data)
await db.delete();
```

---

## Migrations

Schema migrations ensure your database structure evolves safely across versions.

### MigrationManager

```typescript
import { createMigrationManager, defineMigration, type Migration } from '@philjs/sqlite';

const db = createPersistentDatabase('myapp');
await db.initialize();

// Create migration manager
const migrations = createMigrationManager(db);

// Or with custom table name
const migrations = createMigrationManager(db, '_schema_versions');
```

### defineMigration()

Define individual migrations with up and down SQL.

```typescript
const createUsers = defineMigration({
  version: 1,
  name: 'create_users',
  up: `
    CREATE TABLE users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      created_at TEXT DEFAULT (datetime('now'))
    );
    CREATE INDEX idx_users_email ON users(email);
  `,
  down: `
    DROP INDEX idx_users_email;
    DROP TABLE users;
  `,
});

const createPosts = defineMigration({
  version: 2,
  name: 'create_posts',
  up: `
    CREATE TABLE posts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      content TEXT,
      author_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      published INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now'))
    );
    CREATE INDEX idx_posts_author ON posts(author_id);
  `,
  down: `
    DROP INDEX idx_posts_author;
    DROP TABLE posts;
  `,
});

const addUserRole = defineMigration({
  version: 3,
  name: 'add_user_role',
  up: `ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'user'`,
  down: `ALTER TABLE users DROP COLUMN role`,
});

// Add migrations
migrations.add(createUsers);
migrations.add(createPosts);
migrations.add(addUserRole);
```

### migrationsFromSQL()

Create migrations from an array of definitions.

```typescript
import { migrationsFromSQL } from '@philjs/sqlite';

const allMigrations = migrationsFromSQL([
  {
    version: 1,
    name: 'initial_schema',
    up: `
      CREATE TABLE users (id INTEGER PRIMARY KEY, name TEXT);
      CREATE TABLE posts (id INTEGER PRIMARY KEY, title TEXT);
    `,
    down: `
      DROP TABLE posts;
      DROP TABLE users;
    `,
  },
  {
    version: 2,
    name: 'add_timestamps',
    up: `
      ALTER TABLE users ADD COLUMN created_at TEXT;
      ALTER TABLE posts ADD COLUMN created_at TEXT;
    `,
    down: `
      -- SQLite doesn't support DROP COLUMN directly
      -- Would need to recreate tables
    `,
  },
]);

migrations.addAll(allMigrations);
```

### Running Migrations

```typescript
// Run all pending migrations
const result = migrations.migrate();
if (result.success) {
  console.log(`Applied migrations: ${result.applied.join(', ')}`);
} else {
  console.error(`Migration failed: ${result.error?.message}`);
}

// Migrate to specific version
const result = migrations.migrateTo(2);

// Rollback last migration
const rollbackResult = migrations.rollback();

// Rollback to specific version
const rollbackResult = migrations.rollbackTo(1);

// Reset all migrations
const resetResult = migrations.reset();
```

### Migration Status

```typescript
// Get current version
const currentVersion = migrations.getCurrentVersion();
console.log(`Current schema version: ${currentVersion}`);

// Get applied versions
const applied = migrations.getAppliedVersions();
console.log(`Applied: ${applied.join(', ')}`);

// Get pending migrations
const pending = migrations.getPending();
console.log(`Pending: ${pending.map(m => m.name).join(', ')}`);

// Get full status
const status = migrations.getStatus();
console.log(`
  Current: ${status.current}
  Latest: ${status.latest}
  Applied: ${status.applied}
  Pending: ${status.pending}
`);
```

---

## Reactive Queries

Reactive queries automatically re-execute when their dependent tables change.

### createReactiveQuery()

```typescript
import { createReactiveQuery, type ReactiveQueryOptions } from '@philjs/sqlite';

interface User {
  id: number;
  name: string;
  role: string;
}

// Basic reactive query
const usersQuery = createReactiveQuery<User>(db, {
  sql: 'SELECT * FROM users',
});

// Access data
console.log(usersQuery.data);     // User[]
console.log(usersQuery.loading);  // boolean
console.log(usersQuery.error);    // Error | null
console.log(usersQuery.updatedAt); // timestamp

// With parameters
const adminQuery = createReactiveQuery<User>(db, {
  sql: 'SELECT * FROM users WHERE role = ?',
  params: ['admin'],
});

// With options
const options: ReactiveQueryOptions<User> = {
  sql: 'SELECT * FROM users ORDER BY created_at DESC LIMIT ?',
  params: [10],
  dependencies: ['users'], // Explicit table dependencies
  debounce: 100,           // Debounce updates by 100ms
  transform: (rows) => rows.map(row => ({
    ...row,
    name: row.name.toUpperCase(),
  })),
};

const recentUsers = createReactiveQuery<User>(db, options);
```

### Subscribing to Changes

```typescript
// Subscribe to query updates
const unsubscribe = usersQuery.subscribe(() => {
  console.log('Users changed:', usersQuery.data);
  updateUI(usersQuery.data);
});

// The query automatically updates when you modify the users table
db.run('INSERT INTO users (name, role) VALUES (?, ?)', ['Alice', 'admin']);
// Subscriber is called with new data

// Manual refresh
usersQuery.refresh();

// Update parameters
usersQuery.setParams(['moderator']);

// Cleanup when done
unsubscribe();
usersQuery.dispose();
```

### QueryBuilder - Fluent Query API

Build queries programmatically with a fluent interface.

```typescript
import { query, QueryBuilder } from '@philjs/sqlite';

// Create a query builder
const builder = query<User>(db);

// Build queries fluently
const { sql, params } = query<User>(db)
  .select(['id', 'name', 'email'])
  .from('users')
  .where('active = ?', true)
  .where('role = ?', 'admin')
  .orderBy('created_at', 'DESC')
  .limit(10)
  .offset(0)
  .toSQL();

console.log(sql);
// SELECT id, name, email FROM users WHERE active = ? AND role = ? ORDER BY created_at DESC LIMIT 10 OFFSET 0

// Execute as one-time query
const results = query<User>(db)
  .select('*')
  .from('users')
  .where('active = ?', true)
  .execute();

// Convert to reactive query
const reactiveUsers = query<User>(db)
  .select('*')
  .from('users')
  .where('role = ?', 'admin')
  .orderBy('name', 'ASC')
  .reactive({ debounce: 50 });

// Subscribe to changes
reactiveUsers.subscribe(() => {
  console.log('Admin users updated:', reactiveUsers.data);
});
```

### Auto-Refresh on Table Changes

Reactive queries automatically detect which tables they depend on and refresh when those tables change.

```typescript
// Query automatically detects dependency on 'users' and 'posts' tables
const authorStats = createReactiveQuery(db, {
  sql: `
    SELECT u.name, COUNT(p.id) as post_count
    FROM users u
    LEFT JOIN posts p ON p.author_id = u.id
    GROUP BY u.id
  `,
});

// Changes to either table trigger a refresh
db.run('INSERT INTO posts (title, author_id) VALUES (?, ?)', ['New Post', 1]);
// authorStats automatically updates

db.run('UPDATE users SET name = ? WHERE id = ?', ['Alice Smith', 1]);
// authorStats automatically updates again
```

---

## Sync Engine

The sync engine enables bidirectional synchronization between local SQLite and a remote server.

### createSyncEngine()

```typescript
import { createSyncEngine, type SyncConfig } from '@philjs/sqlite';

const syncConfig: SyncConfig = {
  endpoint: 'https://api.example.com/sync',
  tables: ['users', 'posts', 'comments'],
  conflictStrategy: 'last-write-wins',
  syncInterval: 30000, // Sync every 30 seconds (0 for manual only)
  getAuthToken: async () => {
    return localStorage.getItem('auth_token') || '';
  },
  onSyncComplete: (result) => {
    console.log(`Sync complete: pushed ${result.pushed}, pulled ${result.pulled}`);
  },
  debug: true,
};

const syncEngine = createSyncEngine(db, syncConfig);
await syncEngine.initialize();
```

### Conflict Resolution Strategies

```typescript
// Client wins - local changes always override server
const clientWins: SyncConfig = {
  tables: ['drafts'],
  conflictStrategy: 'client-wins',
};

// Server wins - server changes always override local
const serverWins: SyncConfig = {
  tables: ['settings'],
  conflictStrategy: 'server-wins',
};

// Last write wins - most recent change wins
const lastWriteWins: SyncConfig = {
  tables: ['documents'],
  conflictStrategy: 'last-write-wins',
};

// Merge - combine fields from both
const merge: SyncConfig = {
  tables: ['profiles'],
  conflictStrategy: 'merge',
};

// Manual - handle conflicts yourself
const manual: SyncConfig = {
  tables: ['orders'],
  conflictStrategy: 'manual',
  onConflict: async (conflict) => {
    console.log('Conflict detected:', conflict);
    console.log('Local:', conflict.localData);
    console.log('Remote:', conflict.remoteData);

    // Decide how to resolve
    if (conflict.localTimestamp > conflict.remoteTimestamp) {
      return { action: 'use-local' };
    }

    // Or merge manually
    return {
      action: 'use-merged',
      mergedData: {
        ...conflict.remoteData,
        localField: conflict.localData.localField,
      },
    };
  },
};
```

### ChangeRecord Tracking

The sync engine automatically tracks all changes to synced tables.

```typescript
// Get pending (unsynced) changes
const pending = syncEngine.getPendingChanges();

for (const change of pending) {
  console.log(`
    ID: ${change.id}
    Table: ${change.table}
    Operation: ${change.operation}
    Row ID: ${change.rowId}
    Data: ${JSON.stringify(change.data)}
    Timestamp: ${new Date(change.timestamp).toISOString()}
    Synced: ${change.synced}
  `);
}

// Get sync status
const status = syncEngine.getStatus();
console.log(`
  Pending changes: ${status.pendingChanges}
  Last sync: ${new Date(status.lastSync).toISOString()}
  Currently syncing: ${status.syncing}
`);
```

### Manual Sync

```typescript
// Trigger sync manually
const result = await syncEngine.sync();

console.log(`
  Success: ${result.success}
  Pushed: ${result.pushed}
  Pulled: ${result.pulled}
  Conflicts: ${result.conflicts}
  Duration: ${result.duration}ms
`);

if (result.errors.length > 0) {
  console.error('Sync errors:', result.errors);
}

// Check if currently syncing
if (syncEngine.isSyncing()) {
  console.log('Sync in progress...');
}

// Stop auto-sync
syncEngine.stopSyncInterval();

// Cleanup
syncEngine.dispose();
```

### Server API Requirements

The sync engine expects a server API with these endpoints:

```typescript
// POST /sync/push
// Request body: { changes: ChangeRecord[] }
// Response: { accepted: string[], rejected: { id: string, reason: string }[] }

// GET /sync/pull?since={timestamp}
// Response: { changes: ChangeRecord[], timestamp: number }
```

---

## React/PhilJS Hooks

The package provides hooks for seamless integration with PhilJS and React applications.

### useSQLite() - Database Context

```typescript
import { useSQLite } from '@philjs/sqlite';

function MyComponent() {
  const { db, ready, error, query, exec, run, transaction } = useSQLite({
    dbName: 'myapp',
    persistenceMode: 'opfs',
  });

  if (error) {
    return <div>Database error: {error.message}</div>;
  }

  if (!ready) {
    return <div>Loading database...</div>;
  }

  // Use database operations
  const users = query<User>('SELECT * FROM users');

  const addUser = (name: string, email: string) => {
    run('INSERT INTO users (name, email) VALUES (?, ?)', [name, email]);
  };

  const transferFunds = (from: number, to: number, amount: number) => {
    transaction(() => {
      run('UPDATE accounts SET balance = balance - ? WHERE id = ?', [amount, from]);
      run('UPDATE accounts SET balance = balance + ? WHERE id = ?', [amount, to]);
    });
  };

  return (
    <div>
      <h1>Users ({users.length})</h1>
      <ul>
        {users.map(user => <li key={user.id}>{user.name}</li>)}
      </ul>
    </div>
  );
}
```

### useQuery() - Reactive Query Hook

```typescript
import { useQuery } from '@philjs/sqlite';

interface Post {
  id: number;
  title: string;
  content: string;
  author_id: number;
}

function PostList({ authorId }: { authorId: number }) {
  const { data, loading, error, refetch, setParams } = useQuery<Post>(
    'SELECT * FROM posts WHERE author_id = ? ORDER BY created_at DESC',
    [authorId],
    {
      dbName: 'myapp',
      dependencies: ['posts'],
      debounce: 100,
      transform: (rows) => rows.map(row => ({
        ...row,
        title: row.title.trim(),
      })),
    }
  );

  if (loading) return <div>Loading posts...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      <button onClick={refetch}>Refresh</button>
      <ul>
        {data.map(post => (
          <li key={post.id}>{post.title}</li>
        ))}
      </ul>
    </div>
  );
}

// Query automatically updates when posts table changes
```

### useSync() - Sync Hook

```typescript
import { useSync } from '@philjs/sqlite';

function SyncStatus() {
  const { status, sync, stop } = useSync({
    dbName: 'myapp',
    endpoint: 'https://api.example.com/sync',
    tables: ['users', 'posts'],
    conflictStrategy: 'last-write-wins',
    syncInterval: 30000,
  });

  const handleManualSync = async () => {
    const result = await sync();
    if (result.success) {
      alert(`Synced! Pushed: ${result.pushed}, Pulled: ${result.pulled}`);
    } else {
      alert(`Sync failed: ${result.errors.join(', ')}`);
    }
  };

  return (
    <div>
      <p>Pending changes: {status.pendingChanges}</p>
      <p>Last sync: {new Date(status.lastSync).toLocaleString()}</p>
      <p>Status: {status.syncing ? 'Syncing...' : 'Idle'}</p>
      <button onClick={handleManualSync} disabled={status.syncing}>
        Sync Now
      </button>
      <button onClick={stop}>Stop Auto-Sync</button>
    </div>
  );
}
```

### useKVStore() - Key-Value Store Hook

A simple key-value store built on SQLite.

```typescript
import { useKVStore } from '@philjs/sqlite';

interface UserPreferences {
  theme: 'light' | 'dark';
  fontSize: number;
  notifications: boolean;
}

function Settings() {
  const kv = useKVStore('user_settings', { dbName: 'myapp' });

  // Get typed values
  const prefs = kv.get<UserPreferences>('preferences') || {
    theme: 'light',
    fontSize: 14,
    notifications: true,
  };

  const updateTheme = (theme: 'light' | 'dark') => {
    kv.set('preferences', { ...prefs, theme });
  };

  const updateFontSize = (size: number) => {
    kv.set('preferences', { ...prefs, fontSize: size });
  };

  // List all keys
  const allKeys = kv.keys();
  console.log('Stored keys:', allKeys);

  // Delete a specific key
  const clearPreferences = () => {
    kv.delete('preferences');
  };

  // Clear all settings
  const resetAll = () => {
    kv.clear();
  };

  return (
    <div>
      <label>
        Theme:
        <select value={prefs.theme} onChange={e => updateTheme(e.target.value as 'light' | 'dark')}>
          <option value="light">Light</option>
          <option value="dark">Dark</option>
        </select>
      </label>
      <label>
        Font Size:
        <input
          type="number"
          value={prefs.fontSize}
          onChange={e => updateFontSize(Number(e.target.value))}
        />
      </label>
      <button onClick={resetAll}>Reset All Settings</button>
    </div>
  );
}
```

### Database Management Functions

```typescript
import { getDatabase, closeDatabase, closeAllDatabases } from '@philjs/sqlite';

// Get a database instance by name
const db = getDatabase('myapp');
if (db) {
  console.log('Database found:', db.getName());
}

// Close a specific database
const closed = closeDatabase('myapp');
console.log('Database closed:', closed);

// Close all databases (cleanup on app unmount)
closeAllDatabases();
```

---

## Performance Optimization

### Database Configuration

```typescript
const db = createDatabase({
  dbName: 'optimized',
  persistenceMode: 'opfs',
  pageSize: 8192,        // Larger pages for big datasets
  cacheSize: 4000,       // More cache for read-heavy workloads
  autoSaveInterval: 10000, // Less frequent saves
});
```

### Prepared Statements

Use prepared statements for repeated queries:

```typescript
// Prepare once, use many times
const insertStmt = db.prepare('INSERT INTO logs (message, level) VALUES (?, ?)');

for (const log of logs) {
  insertStmt.run([log.message, log.level]);
}

insertStmt.free();
```

### Batch Operations

```typescript
// Use batch for multiple inserts
db.batch(
  items.map(item => ({
    sql: 'INSERT INTO items (name, price) VALUES (?, ?)',
    params: [item.name, item.price],
  }))
);

// Or use a transaction for complex operations
db.transaction(() => {
  for (const item of items) {
    db.run('INSERT INTO items (name, price) VALUES (?, ?)', [item.name, item.price]);
  }
});
```

### Debounce Reactive Queries

```typescript
// Debounce high-frequency updates
const liveSearch = createReactiveQuery(db, {
  sql: 'SELECT * FROM products WHERE name LIKE ?',
  params: [`%${searchTerm}%`],
  debounce: 150, // Wait 150ms between updates
});
```

### Index Your Queries

```typescript
// Create indexes for frequently queried columns
db.exec(`
  CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
  CREATE INDEX IF NOT EXISTS idx_posts_author_date ON posts(author_id, created_at);
  CREATE INDEX IF NOT EXISTS idx_orders_user_status ON orders(user_id, status);
`);
```

### Vacuum Periodically

```typescript
// Reclaim space after heavy deletions
db.vacuum();
```

### Monitor Database Size

```typescript
const sizeBytes = db.getSize();
const sizeMB = sizeBytes / (1024 * 1024);
console.log(`Database size: ${sizeMB.toFixed(2)} MB`);

if (sizeMB > 50) {
  console.warn('Database is getting large, consider archiving old data');
}
```

---

## Complete Example: Todo App

```typescript
import {
  createPersistentDatabase,
  createMigrationManager,
  defineMigration,
  createReactiveQuery,
  createSyncEngine,
} from '@philjs/sqlite';

// Types
interface Todo {
  id: number;
  text: string;
  completed: boolean;
  created_at: string;
}

// Initialize database
const db = createPersistentDatabase('todos');
await db.initialize();

// Run migrations
const migrations = createMigrationManager(db);
migrations.add(defineMigration({
  version: 1,
  name: 'create_todos',
  up: `
    CREATE TABLE todos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      text TEXT NOT NULL,
      completed INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now'))
    );
    CREATE INDEX idx_todos_completed ON todos(completed);
  `,
  down: 'DROP TABLE todos',
}));
migrations.migrate();

// Create reactive query for all todos
const todosQuery = createReactiveQuery<Todo>(db, {
  sql: 'SELECT * FROM todos ORDER BY created_at DESC',
});

// Create reactive query for stats
const statsQuery = createReactiveQuery<{ total: number; completed: number }>(db, {
  sql: `
    SELECT
      COUNT(*) as total,
      SUM(CASE WHEN completed = 1 THEN 1 ELSE 0 END) as completed
    FROM todos
  `,
});

// Setup sync (optional)
const syncEngine = createSyncEngine(db, {
  endpoint: 'https://api.example.com/sync',
  tables: ['todos'],
  conflictStrategy: 'last-write-wins',
  syncInterval: 60000,
});
await syncEngine.initialize();

// CRUD operations
function addTodo(text: string): number {
  const result = db.run('INSERT INTO todos (text) VALUES (?)', [text]);
  return result.lastInsertRowid;
}

function toggleTodo(id: number): void {
  db.run('UPDATE todos SET completed = NOT completed WHERE id = ?', [id]);
}

function deleteTodo(id: number): void {
  db.run('DELETE FROM todos WHERE id = ?', [id]);
}

function clearCompleted(): void {
  db.run('DELETE FROM todos WHERE completed = 1');
}

// Subscribe to updates
todosQuery.subscribe(() => {
  console.log('Todos:', todosQuery.data);
  renderTodos(todosQuery.data);
});

statsQuery.subscribe(() => {
  const stats = statsQuery.data[0];
  console.log(`${stats.completed}/${stats.total} completed`);
  renderStats(stats);
});

// Export for persistence
function exportData(): Uint8Array {
  return db.export();
}

// Import from backup
async function importData(data: Uint8Array): Promise<void> {
  await db.import(data);
}

// Cleanup on app close
window.addEventListener('beforeunload', async () => {
  syncEngine.dispose();
  await db.close();
});
```

---

## API Reference

### Types

```typescript
// Persistence modes
type PersistenceMode = 'memory' | 'opfs' | 'indexeddb';

// Database configuration
interface SQLiteConfig {
  dbName: string;
  persistenceMode: PersistenceMode;
  wasmUrl?: string;
  pageSize?: number;
  cacheSize?: number;
  walMode?: boolean;
  readOnly?: boolean;
  autoSaveInterval?: number;
}

// Query result row
type Row = Record<string, unknown>;

// Table change event
interface TableChangeEvent {
  table: string;
  operation: 'INSERT' | 'UPDATE' | 'DELETE';
  rowId: number;
}

// Migration definition
interface Migration {
  version: number;
  name: string;
  up: string;
  down: string;
}

// Sync configuration
interface SyncConfig {
  endpoint?: string;
  syncInterval?: number;
  conflictStrategy: 'client-wins' | 'server-wins' | 'last-write-wins' | 'merge' | 'manual';
  tables: string[];
  getAuthToken?: () => string | Promise<string>;
  onSyncComplete?: (result: SyncResult) => void;
  onConflict?: (conflict: SyncConflict) => Promise<ConflictResolution>;
  debug?: boolean;
}

// Change record for sync tracking
interface ChangeRecord {
  id: string;
  table: string;
  operation: 'INSERT' | 'UPDATE' | 'DELETE';
  rowId: number;
  data: Row | null;
  timestamp: number;
  synced: boolean;
}
```

### Exports

```typescript
// Database
export { SQLiteDB, createDatabase, createMemoryDatabase, createPersistentDatabase, createIndexedDBDatabase };
export { isOPFSSupported, isIndexedDBSupported, getBestPersistenceMode };

// Migrations
export { MigrationManager, createMigrationManager, defineMigration, migrationsFromSQL };

// Reactive Queries
export { ReactiveQuery, createReactiveQuery, QueryBuilder, query };

// Sync Engine
export { SQLiteSyncEngine, createSyncEngine };

// Hooks
export { useSQLite, useQuery, useSync, useKVStore, getDatabase, closeDatabase, closeAllDatabases };
```
