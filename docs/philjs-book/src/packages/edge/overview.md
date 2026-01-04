# @philjs/edge

The `@philjs/edge` package provides edge computing primitives with a unified API across Cloudflare Workers, Vercel Edge, and Deno Deploy.

## Installation

```bash
npm install @philjs/edge
```

## Features

- **KV Storage** - Unified key-value storage API
- **Durable Objects** - Stateful edge computing
- **Queues** - Message queues at the edge
- **Cron Scheduler** - Scheduled tasks
- **D1 Database** - SQLite at the edge
- **Geo Routing** - Location-based routing
- **Smart Caching** - Intelligent cache strategies
- **Rate Limiting** - Edge-native rate limiting

## Quick Start

```typescript
import { MemoryKVStore, useEdgeKV, CronScheduler, MemoryQueue } from '@philjs/edge';

// KV Storage
const kv = new MemoryKVStore();
await kv.put('user:123', JSON.stringify({ name: 'Alice' }));
const user = await kv.get('user:123', { type: 'json' });

// Reactive KV hook
function UserProfile() {
  const { data, isLoading, set } = useEdgeKV(kv, 'user:123');

  if (isLoading()) return <Loading />;
  return <div>{data()?.name}</div>;
}

// Queue
const queue = new MemoryQueue();
queue.consume(async (batch) => {
  for (const msg of batch) {
    console.log('Processing:', msg.body);
  }
});
await queue.send({ type: 'email', to: 'user@example.com' });
```

---

## KV Storage

### KVStore Interface

```typescript
import type { KVStore, KVGetOptions, KVPutOptions, KVListOptions } from '@philjs/edge';

interface KVStore {
  get<T = string>(key: string, options?: KVGetOptions): Promise<T | null>;
  put(key: string, value: string | ArrayBuffer | ReadableStream, options?: KVPutOptions): Promise<void>;
  delete(key: string): Promise<void>;
  list(options?: KVListOptions): Promise<KVListResult>;
  getWithMetadata<T = string>(key: string): Promise<{ value: T | null; metadata: Record<string, any> | null }>;
}

interface KVGetOptions {
  type?: 'text' | 'json' | 'arrayBuffer' | 'stream';
  cacheTtl?: number;
}

interface KVPutOptions {
  expirationTtl?: number;  // TTL in seconds
  expiration?: number;     // Unix timestamp
  metadata?: Record<string, any>;
}

interface KVListOptions {
  prefix?: string;
  limit?: number;
  cursor?: string;
}
```

### Memory KV (Development)

```typescript
import { MemoryKVStore } from '@philjs/edge';

const kv = new MemoryKVStore();

// Basic operations
await kv.put('key', 'value');
const value = await kv.get('key'); // 'value'
await kv.delete('key');

// JSON data
await kv.put('user:1', JSON.stringify({ name: 'Alice', role: 'admin' }));
const user = await kv.get('user:1', { type: 'json' });
// { name: 'Alice', role: 'admin' }

// With TTL (expires in 1 hour)
await kv.put('session:abc', 'data', { expirationTtl: 3600 });

// With metadata
await kv.put('file:123', fileBuffer, {
  metadata: { filename: 'document.pdf', size: 1024 }
});

const { value, metadata } = await kv.getWithMetadata('file:123');

// List keys
const result = await kv.list({ prefix: 'user:', limit: 100 });
for (const key of result.keys) {
  console.log(key.name, key.metadata);
}
```

### Cloudflare KV

```typescript
import { createCloudflareKV } from '@philjs/edge';

// In Cloudflare Worker
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const kv = createCloudflareKV(env.MY_KV_NAMESPACE);

    await kv.put('counter', '0');
    const count = await kv.get('counter');

    return new Response(`Count: ${count}`);
  }
};
```

### useEdgeKV Hook

```typescript
import { useEdgeKV } from '@philjs/edge';

function UserSettings() {
  const { data, isLoading, error, fetch, set, remove } = useEdgeKV<UserSettings>(
    kvStore,
    'settings:user:123'
  );

  if (isLoading()) return <Spinner />;
  if (error()) return <Error message={error()?.message} />;

  const handleSave = async (newSettings: UserSettings) => {
    await set(newSettings);
  };

  return (
    <div>
      <h1>Settings</h1>
      <SettingsForm
        settings={data()}
        onSave={handleSave}
      />
      <button onClick={fetch}>Refresh</button>
      <button onClick={remove}>Reset</button>
    </div>
  );
}
```

---

## Durable Objects

### Creating Durable Objects

```typescript
import { DurableObject, MemoryDurableStorage } from '@philjs/edge';
import type { DurableObjectState, DurableStorage } from '@philjs/edge';

class Counter extends DurableObject {
  private count = 0;

  constructor(state: DurableObjectState) {
    super(state);
    this.initializeCount();
  }

  private async initializeCount() {
    const stored = await this.state.storage.get<number>('count');
    this.count = stored ?? 0;
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);

    switch (url.pathname) {
      case '/increment':
        this.count++;
        await this.state.storage.put('count', this.count);
        return new Response(String(this.count));

      case '/decrement':
        this.count--;
        await this.state.storage.put('count', this.count);
        return new Response(String(this.count));

      case '/':
        return new Response(String(this.count));

      default:
        return new Response('Not found', { status: 404 });
    }
  }
}
```

### Durable Storage API

```typescript
interface DurableStorage {
  // Single key operations
  get<T>(key: string): Promise<T | undefined>;
  put<T>(key: string, value: T): Promise<void>;
  delete(key: string): Promise<boolean>;

  // Batch operations
  get<T>(keys: string[]): Promise<Map<string, T>>;
  put<T>(entries: Record<string, T>): Promise<void>;
  delete(keys: string[]): Promise<number>;

  // List with range queries
  list<T>(options?: {
    prefix?: string;
    limit?: number;
    start?: string;
    end?: string;
  }): Promise<Map<string, T>>;

  // Transactions
  transaction<T>(closure: (txn: DurableStorage) => Promise<T>): Promise<T>;
}
```

### Memory Durable Storage

```typescript
import { MemoryDurableStorage } from '@philjs/edge';

const storage = new MemoryDurableStorage();

// Single operations
await storage.put('user:1', { name: 'Alice' });
const user = await storage.get('user:1');

// Batch operations
await storage.put({
  'user:1': { name: 'Alice' },
  'user:2': { name: 'Bob' },
  'user:3': { name: 'Charlie' },
});

const users = await storage.get(['user:1', 'user:2']);
// Map { 'user:1' => {...}, 'user:2' => {...} }

// Range queries
const allUsers = await storage.list({ prefix: 'user:' });

// Transactions
await storage.transaction(async (txn) => {
  const balance = await txn.get<number>('account:1');
  await txn.put('account:1', (balance ?? 0) - 100);
  await txn.put('account:2', (balance ?? 0) + 100);
});
```

---

## Queues

### Creating Queues

```typescript
import { MemoryQueue } from '@philjs/edge';
import type { EdgeQueue, QueueMessage, QueueOptions } from '@philjs/edge';

interface EmailJob {
  to: string;
  subject: string;
  body: string;
}

const emailQueue = new MemoryQueue<EmailJob>({
  maxRetries: 3,
  retryDelay: 1000,
  deadLetterQueue: failedEmailsQueue,
});

// Send messages
await emailQueue.send({
  to: 'user@example.com',
  subject: 'Welcome!',
  body: 'Thanks for signing up.',
});

// Send batch
await emailQueue.sendBatch([
  { to: 'user1@example.com', subject: 'Hello', body: '...' },
  { to: 'user2@example.com', subject: 'Hello', body: '...' },
]);

// Consume messages
emailQueue.consume(async (batch: QueueMessage<EmailJob>[]) => {
  for (const msg of batch) {
    console.log(`Processing email to ${msg.body.to}`);
    await sendEmail(msg.body);
  }
});
```

### Queue Message

```typescript
interface QueueMessage<T = any> {
  id: string;           // Unique message ID
  body: T;              // Message payload
  timestamp: number;    // When message was sent
  retries: number;      // Retry count
}

interface QueueOptions {
  maxRetries?: number;      // Max retry attempts (default: 3)
  retryDelay?: number;      // Delay between retries (ms)
  deadLetterQueue?: EdgeQueue<any>;  // Failed message destination
}
```

---

## Cron Scheduler

### Scheduling Jobs

```typescript
import { CronScheduler } from '@philjs/edge';

const scheduler = new CronScheduler();

// Simple interval (every 30 seconds)
scheduler.register('healthcheck', '30s', async () => {
  await fetch('https://api.example.com/health');
});

// Every 5 minutes
scheduler.register('sync-data', '5m', async () => {
  await syncDataFromSource();
});

// Every hour
scheduler.register('cleanup', '1h', async () => {
  await cleanupOldRecords();
});

// Control jobs
scheduler.disable('sync-data');  // Pause
scheduler.enable('sync-data');   // Resume
scheduler.unregister('cleanup'); // Remove

// List all jobs
const jobs = scheduler.getJobs();
for (const job of jobs) {
  console.log(`${job.id}: ${job.enabled ? 'active' : 'paused'}`);
  console.log(`  Last run: ${job.lastRun}`);
  console.log(`  Next run: ${job.nextRun}`);
}
```

### CronJob Interface

```typescript
interface CronJob {
  id: string;
  schedule: string;          // '30s', '5m', '1h', or cron expression
  handler: () => Promise<void>;
  enabled: boolean;
  lastRun?: Date;
  nextRun?: Date;
}
```

---

## D1 Database (SQLite at Edge)

### Database Interface

```typescript
import type { D1Database, D1PreparedStatement, D1Result } from '@philjs/edge';

// In Cloudflare Worker
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const db: D1Database = env.DB;

    // Prepared statements
    const stmt = db.prepare('SELECT * FROM users WHERE id = ?');
    const user = await stmt.bind(1).first();

    // All results
    const allUsers = await db.prepare('SELECT * FROM users').all();

    // Run (for INSERT/UPDATE/DELETE)
    const result = await db
      .prepare('INSERT INTO users (name, email) VALUES (?, ?)')
      .bind('Alice', 'alice@example.com')
      .run();

    console.log(result.meta.changes); // 1

    // Batch operations
    const results = await db.batch([
      db.prepare('INSERT INTO users (name) VALUES (?)').bind('Bob'),
      db.prepare('INSERT INTO users (name) VALUES (?)').bind('Charlie'),
    ]);

    return Response.json({ users: allUsers.results });
  }
};
```

### D1 Types

```typescript
interface D1Database {
  prepare(query: string): D1PreparedStatement;
  batch<T = unknown>(statements: D1PreparedStatement[]): Promise<D1Result<T>[]>;
  exec(query: string): Promise<D1ExecResult>;
}

interface D1PreparedStatement {
  bind(...values: any[]): D1PreparedStatement;
  first<T = unknown>(column?: string): Promise<T | null>;
  all<T = unknown>(): Promise<D1Result<T>>;
  raw<T = unknown>(): Promise<T[]>;
  run(): Promise<D1Result>;
}

interface D1Result<T = unknown> {
  results: T[];
  success: boolean;
  meta: {
    duration: number;
    changes: number;
    last_row_id: number;
  };
}
```

---

## Additional Modules

### Geo Routing

```typescript
import { geoRoute, getCountryCode, getRegion } from '@philjs/edge/geo-routing';

// Route based on location
const handler = geoRoute({
  US: () => usHandler,
  EU: () => euHandler,
  default: () => defaultHandler,
});

// Get location info
const country = getCountryCode(request);  // 'US'
const region = getRegion(request);        // 'NA'
```

### Smart Cache

```typescript
import { smartCache, cacheWithRevalidation } from '@philjs/edge/smart-cache';

// Cache with SWR pattern
const data = await smartCache('api-response', async () => {
  return fetch('https://api.example.com/data').then(r => r.json());
}, {
  ttl: 60,            // Fresh for 60s
  staleWhileRevalidate: 300,  // Serve stale for 5min while revalidating
});

// Cache with background revalidation
const cachedFetch = cacheWithRevalidation(async (url: string) => {
  const response = await fetch(url);
  return response.json();
});
```

### Rate Limiting

```typescript
import { createRateLimiter, slidingWindowLimiter } from '@philjs/edge/rate-limiter';

// Fixed window rate limiter
const limiter = createRateLimiter({
  windowMs: 60 * 1000,  // 1 minute
  max: 100,             // 100 requests per window
  keyGenerator: (req) => req.headers.get('CF-Connecting-IP') || 'unknown',
});

// Check rate limit
const result = await limiter.check(request);
if (!result.allowed) {
  return new Response('Too Many Requests', {
    status: 429,
    headers: {
      'Retry-After': String(result.retryAfter),
    },
  });
}

// Sliding window for smoother limiting
const slidingLimiter = slidingWindowLimiter({
  windowMs: 60 * 1000,
  max: 100,
});
```

### State Replication

```typescript
import { replicateState, syncAcrossRegions } from '@philjs/edge/state-replication';

// Replicate state across edge locations
const replicatedKV = replicateState(kvStore, {
  regions: ['US', 'EU', 'APAC'],
  consistencyLevel: 'eventual',  // or 'strong'
});

// Sync specific keys
await syncAcrossRegions('session:*', {
  source: 'US',
  targets: ['EU', 'APAC'],
});
```

### Streaming

```typescript
import { streamResponse, createStreamingHandler } from '@philjs/edge/streaming';

// Stream large responses
const handler = createStreamingHandler(async function* (request) {
  yield 'Starting...\n';

  for await (const chunk of processData()) {
    yield JSON.stringify(chunk) + '\n';
  }

  yield 'Done!\n';
});

// Stream with backpressure
const response = streamResponse(async (controller) => {
  for (const item of largeDataset) {
    await controller.enqueue(JSON.stringify(item));
  }
  controller.close();
});
```

---

## Types Reference

```typescript
// KV Types
interface EdgeKVOptions {
  namespace: string;
  provider?: 'cloudflare' | 'vercel' | 'deno' | 'memory';
}

interface KVListResult {
  keys: Array<{
    name: string;
    expiration?: number;
    metadata?: Record<string, any>;
  }>;
  cursor?: string;
  complete: boolean;
}

// Durable Object Types
interface DurableObjectState {
  storage: DurableStorage;
  id: string;
}

// Queue Types
interface EdgeQueue<T = any> {
  send(message: T): Promise<void>;
  sendBatch(messages: T[]): Promise<void>;
  consume(handler: (batch: QueueMessage<T>[]) => Promise<void>): void;
}

// Cron Types
interface CronJob {
  id: string;
  schedule: string;
  handler: () => Promise<void>;
  enabled: boolean;
  lastRun?: Date;
  nextRun?: Date;
}
```

---

## API Reference

### KV Storage

| Export | Description |
|--------|-------------|
| `MemoryKVStore` | In-memory KV store |
| `createCloudflareKV` | Cloudflare KV wrapper |
| `useEdgeKV` | Reactive KV hook |

### Durable Objects

| Export | Description |
|--------|-------------|
| `DurableObject` | Base class |
| `MemoryDurableStorage` | In-memory storage |

### Queues

| Export | Description |
|--------|-------------|
| `MemoryQueue` | In-memory queue |

### Cron

| Export | Description |
|--------|-------------|
| `CronScheduler` | Job scheduler |

### Submodules

| Module | Description |
|--------|-------------|
| `@philjs/edge/geo-routing` | Location-based routing |
| `@philjs/edge/smart-cache` | Intelligent caching |
| `@philjs/edge/rate-limiter` | Rate limiting |
| `@philjs/edge/state-replication` | Cross-region sync |
| `@philjs/edge/streaming` | Response streaming |
| `@philjs/edge/prefetch` | Resource prefetching |
| `@philjs/edge/edge-functions` | Edge function utilities |

---

## Next Steps

- [Edge Deployment](../../platforms/edge.md)
- [@philjs/api Edge Middleware](../api/edge-middleware.md)
- [Performance: Server-Side](../../performance/server-side.md)
