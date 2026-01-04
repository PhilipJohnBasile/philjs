# @philjs/offline

Offline-first architecture for PhilJS with IndexedDB, automatic sync, conflict resolution, and cache strategies.

## Installation

```bash
npm install @philjs/offline
```

## Features

- **IndexedDB Storage** - Reactive local database
- **Automatic Sync** - Background sync when online
- **Conflict Resolution** - Multiple resolution strategies
- **Optimistic Updates** - Instant local changes
- **Offline Queue** - Queue operations for later sync
- **Network Monitoring** - Detect connection status
- **Cache Strategies** - Cache-first, network-first, stale-while-revalidate

## Quick Start

```typescript
import { OfflineDB, SyncManager, useOfflineData } from '@philjs/offline';

// Create database
const db = new OfflineDB('myapp');

// Register stores
db.registerStore({
  name: 'todos',
  keyPath: 'id',
  indexes: [{ name: 'status', keyPath: 'status' }],
  syncEndpoint: '/api/todos',
});

// Use with sync
const syncManager = new SyncManager(db, {
  conflictStrategy: 'last-write-wins',
});
await syncManager.start();
```

## OfflineDB

### Configuration

```typescript
const db = new OfflineDB(
  'myapp_db',  // Database name
  1            // Database version
);
```

### Registering Stores

```typescript
db.registerStore({
  name: 'users',
  keyPath: 'id',
  indexes: [
    { name: 'email', keyPath: 'email', unique: true },
    { name: 'createdAt', keyPath: 'createdAt' },
  ],
  syncEndpoint: '/api/users', // Optional sync endpoint
  transform: (data) => ({     // Transform before sync
    ...data,
    syncedAt: new Date().toISOString(),
  }),
});

await db.open();
```

### CRUD Operations

```typescript
// Add new record (auto-adds to sync queue)
const id = await db.add('users', {
  id: 'user-1',
  name: 'John Doe',
  email: 'john@example.com',
});

// Update record
await db.put('users', {
  id: 'user-1',
  name: 'John Smith',
  email: 'john@example.com',
});

// Get single record
const user = await db.get('users', 'user-1');

// Get all records
const allUsers = await db.getAll('users');

// Query by index
const admins = await db.query('users', 'role', 'admin');
const recentUsers = await db.query(
  'users',
  'createdAt',
  IDBKeyRange.lowerBound(new Date('2024-01-01'))
);

// Delete record
await db.delete('users', 'user-1');

// Clear store
await db.clear('users');

// Count records
const count = await db.count('users');
```

### Skip Sync Queue

```typescript
// Add without syncing (local-only)
await db.add('cache', data, false);
await db.put('cache', data, false);
await db.delete('cache', 'key', false);
```

### Metadata Storage

```typescript
// Store app metadata
await db.setMetadata('lastSync', Date.now());
await db.setMetadata('appVersion', '1.2.0');

// Retrieve metadata
const lastSync = await db.getMetadata<number>('lastSync');
```

## SyncManager

### Configuration

```typescript
import { SyncManager } from '@philjs/offline';

const syncManager = new SyncManager(db, {
  syncInterval: 30000,          // Sync every 30 seconds
  maxRetries: 3,                // Max retry attempts
  conflictStrategy: 'last-write-wins',
});
```

### Conflict Strategies

```typescript
type ConflictStrategy =
  | 'client-wins'       // Local changes always win
  | 'server-wins'       // Server changes always win
  | 'last-write-wins'   // Most recent timestamp wins
  | 'merge'             // Shallow merge of objects
  | 'manual';           // Emit event for manual resolution
```

### Starting/Stopping Sync

```typescript
// Start automatic sync
await syncManager.start();

// Manual sync
await syncManager.sync();

// Stop sync
syncManager.stop();
```

### Monitoring Sync Status

```typescript
// Listen for sync events
const unsubscribe = syncManager.onSync((status) => {
  switch (status) {
    case 'started':
      showSyncIndicator();
      break;
    case 'completed':
      hideSyncIndicator();
      break;
    case 'failed':
      showSyncError();
      break;
  }
});

// Get pending operations count
const pendingCount = await syncManager.getPendingCount();

// Get failed operations
const failed = await syncManager.getFailedOperations();

// Retry failed operations
await syncManager.retryFailed();
```

## NetworkMonitor

### Checking Network Status

```typescript
import { NetworkMonitor } from '@philjs/offline';

const monitor = new NetworkMonitor();

// Current status
const status = monitor.getStatus();
console.log({
  online: status.online,
  effectiveType: status.effectiveType, // 'slow-2g' | '2g' | '3g' | '4g'
  downlink: status.downlink,           // Mb/s
  rtt: status.rtt,                     // Round-trip time in ms
  saveData: status.saveData,           // Data saver enabled
});

// Quick checks
if (monitor.isOnline()) {
  syncData();
}

if (monitor.isSlowConnection()) {
  loadLowResImages();
}

if (monitor.shouldSaveData()) {
  skipNonEssentialRequests();
}
```

### Subscribing to Changes

```typescript
const unsubscribe = monitor.subscribe((status) => {
  if (status.online) {
    console.log('Back online!');
    triggerSync();
  } else {
    console.log('Gone offline');
    showOfflineBanner();
  }
});
```

## CacheManager

### Configuration

```typescript
import { CacheManager } from '@philjs/offline';

const cache = new CacheManager('myapp_cache');

// Register cache strategies for URL patterns
cache.registerStrategy('/api/users', {
  name: 'users-cache',
  strategy: 'network-first',
  maxAge: 60000, // 1 minute
});

cache.registerStrategy('/static/', {
  name: 'static-cache',
  strategy: 'cache-first',
  maxAge: 86400000, // 24 hours
});

cache.registerStrategy('/api/feed', {
  name: 'feed-cache',
  strategy: 'stale-while-revalidate',
});
```

### Cache Strategies

```typescript
type CacheStrategy =
  | 'cache-first'             // Try cache, fallback to network
  | 'network-first'           // Try network, fallback to cache
  | 'stale-while-revalidate'  // Return cache, update in background
  | 'cache-only'              // Only use cache
  | 'network-only';           // Only use network
```

### Using the Cache

```typescript
// Fetch with caching (uses registered strategy)
const response = await cache.fetch('/api/users');

// Fetch with specific strategy
const response = await cache.fetch('/api/data', {
  name: 'custom',
  strategy: 'cache-first',
  maxAge: 30000,
});

// Manual cache operations
await cache.put('/api/users', response);
const cached = await cache.get('/api/users');
await cache.delete('/api/users');
await cache.clear();
```

## Offline Store Factory

### Creating Typed Stores

```typescript
import { createOfflineStore } from '@philjs/offline';

interface Todo {
  id: string;
  title: string;
  completed: boolean;
}

const todoStore = createOfflineStore<Todo>(db, {
  name: 'todos',
  keyPath: 'id',
  indexes: [{ name: 'completed', keyPath: 'completed' }],
  syncEndpoint: '/api/todos',
});

// Typed operations
const todos = await todoStore.getAll();
const todo = await todoStore.get('todo-1');
await todoStore.add({ id: 'todo-2', title: 'New', completed: false });
await todoStore.put({ id: 'todo-2', title: 'Updated', completed: true });
await todoStore.delete('todo-2');
const incomplete = await todoStore.query('completed', false);
```

## React-style Hooks

### useOfflineData

```typescript
import { useOfflineData } from '@philjs/offline';

function TodoList() {
  const {
    data,        // Current data array
    get,         // Get single item
    add,         // Add new item
    update,      // Update item
    remove,      // Delete item
    refresh,     // Refresh data
    loading,     // Loading state
  } = useOfflineData<Todo>('todos', {
    keyPath: 'id',
    indexes: [{ name: 'completed', keyPath: 'completed' }],
  });

  const handleAdd = async () => {
    await add({ id: crypto.randomUUID(), title: 'New Todo', completed: false });
  };

  const handleToggle = async (todo: Todo) => {
    await update({ ...todo, completed: !todo.completed });
  };

  const handleDelete = async (id: string) => {
    await remove(id);
  };

  return (
    <div>
      {loading ? <Spinner /> : (
        <ul>
          {data.map(todo => (
            <li key={todo.id}>
              <input
                type="checkbox"
                checked={todo.completed}
                onChange={() => handleToggle(todo)}
              />
              {todo.title}
              <button onClick={() => handleDelete(todo.id)}>Delete</button>
            </li>
          ))}
        </ul>
      )}
      <button onClick={handleAdd}>Add Todo</button>
    </div>
  );
}
```

### useNetworkStatus

```typescript
import { useNetworkStatus } from '@philjs/offline';

function NetworkBanner() {
  const { online, status, isSlowConnection, shouldSaveData } = useNetworkStatus();

  if (!online) {
    return <div class="offline-banner">You're offline</div>;
  }

  if (isSlowConnection) {
    return <div class="slow-banner">Slow connection detected</div>;
  }

  return null;
}
```

### useSync

```typescript
import { useSync } from '@philjs/offline';

function SyncStatus() {
  const {
    sync,
    pendingCount,
    isSyncing,
    startAutoSync,
    stopAutoSync,
    retryFailed,
  } = useSync();

  return (
    <div>
      <span>{isSyncing ? 'Syncing...' : `${pendingCount} pending`}</span>
      <button onClick={sync} disabled={isSyncing}>Sync Now</button>
      <button onClick={retryFailed}>Retry Failed</button>
    </div>
  );
}
```

### useCache

```typescript
import { useCache } from '@philjs/offline';

function CachedContent() {
  const { get, put, delete: remove, fetch, clear } = useCache();

  const loadData = async () => {
    const response = await fetch('/api/data', {
      name: 'data-cache',
      strategy: 'stale-while-revalidate',
    });
    return response.json();
  };

  return /* ... */;
}
```

## Types Reference

```typescript
// Offline configuration
interface OfflineConfig {
  dbName?: string;
  dbVersion?: number;
  syncInterval?: number;
  maxRetries?: number;
  conflictStrategy?: ConflictStrategy;
}

// Store definition
interface OfflineStore<T> {
  name: string;
  keyPath: string;
  indexes?: Array<{
    name: string;
    keyPath: string | string[];
    unique?: boolean;
  }>;
  syncEndpoint?: string;
  transform?: (data: T) => any;
}

// Sync operation
interface SyncOperation {
  id: string;
  type: 'create' | 'update' | 'delete';
  store: string;
  data: any;
  timestamp: number;
  retries: number;
  status: 'pending' | 'syncing' | 'failed' | 'completed';
  error?: string;
}

// Network status
interface NetworkStatus {
  online: boolean;
  effectiveType?: 'slow-2g' | '2g' | '3g' | '4g';
  downlink?: number;
  rtt?: number;
  saveData?: boolean;
}

// Cache strategy
interface CacheStrategy {
  name: string;
  strategy: 'cache-first' | 'network-first' | 'stale-while-revalidate' | 'cache-only' | 'network-only';
  maxAge?: number;
  maxEntries?: number;
}
```

## API Reference

### Classes

| Class | Description |
|-------|-------------|
| `OfflineDB` | IndexedDB wrapper with sync queue |
| `SyncManager` | Background sync management |
| `NetworkMonitor` | Network status detection |
| `CacheManager` | HTTP response caching |

### Functions

| Function | Description |
|----------|-------------|
| `createOfflineStore(db, config)` | Create typed store |

### Hooks

| Hook | Description |
|------|-------------|
| `useOfflineData(store, config)` | Offline data with CRUD |
| `useNetworkStatus()` | Network connection state |
| `useSync(config?)` | Sync control and status |
| `useCache()` | Cache operations |

## Example: Offline-First Todo App

```typescript
import {
  OfflineDB,
  SyncManager,
  NetworkMonitor,
  useOfflineData,
  useNetworkStatus,
  useSync,
} from '@philjs/offline';

// Initialize
const db = new OfflineDB('todos_app');
db.registerStore({
  name: 'todos',
  keyPath: 'id',
  syncEndpoint: '/api/todos',
});

const syncManager = new SyncManager(db, {
  conflictStrategy: 'last-write-wins',
});

// Start sync when app loads
await syncManager.start();

// Component
function TodoApp() {
  const { online } = useNetworkStatus();
  const { pendingCount, isSyncing } = useSync();
  const { data: todos, add, update, remove } = useOfflineData('todos', {
    keyPath: 'id',
  });

  return (
    <div>
      <header>
        {!online && <span class="offline">Offline</span>}
        {pendingCount > 0 && <span>{pendingCount} pending changes</span>}
        {isSyncing && <span>Syncing...</span>}
      </header>

      <ul>
        {todos.map(todo => (
          <TodoItem
            key={todo.id}
            todo={todo}
            onToggle={() => update({ ...todo, completed: !todo.completed })}
            onDelete={() => remove(todo.id)}
          />
        ))}
      </ul>

      <button onClick={() => add({
        id: crypto.randomUUID(),
        title: 'New Todo',
        completed: false,
      })}>
        Add Todo
      </button>
    </div>
  );
}
```
