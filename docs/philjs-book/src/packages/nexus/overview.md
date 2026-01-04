# @philjs/nexus - Complete Reference

The `@philjs/nexus` package is the unified entry point for building local-first, AI-native, and collaborative applications with PhilJS. It combines CRDT-backed data synchronization, integrated LLM capabilities, and real-time multiplayer features into a single cohesive framework.

## Installation

```bash
npm install @philjs/nexus
# or
pnpm add @philjs/nexus
# or
bun add @philjs/nexus
```

## Features

- **Local-First Data**: CRDT-backed documents and collections with automatic offline support
- **Seamless Sync**: Automatic synchronization between local storage and remote backends
- **AI Integration**: Built-in LLM support with caching, cost tracking, and streaming
- **Real-Time Collaboration**: Presence indicators, cursor synchronization, and typing indicators
- **Multiple Storage Adapters**: IndexedDB, SQLite, and in-memory storage options
- **Multiple Remote Backends**: Supabase, PostgreSQL, Firebase, and custom adapters
- **Multiple AI Providers**: Anthropic, OpenAI, Google, and local models
- **Event System**: Comprehensive event handling for sync, AI, and collaboration events
- **Hooks API**: React-style hooks for component integration

## Package Exports

| Export | Description |
|--------|-------------|
| `@philjs/nexus` | Main entry point with all exports |
| `@philjs/nexus/sync` | Sync engine and storage adapters |
| `@philjs/nexus/hooks` | React-style hooks for Nexus features |

## Quick Start

```typescript
import { createNexusApp } from '@philjs/nexus';

// Create a Nexus app with all features
const app = createNexusApp({
  // Local-first storage (required)
  local: { adapter: 'indexeddb' },

  // Remote sync (optional)
  remote: {
    adapter: 'supabase',
    url: process.env.SUPABASE_URL!,
    auth: { apiKey: process.env.SUPABASE_ANON_KEY! },
  },

  // AI capabilities (optional)
  ai: {
    provider: 'anthropic',
    apiKey: process.env.ANTHROPIC_API_KEY!,
    cache: true,
    trackCosts: true,
  },

  // Real-time collaboration (optional)
  collab: {
    presence: true,
    cursors: true,
    websocketUrl: 'wss://your-server.com/collab',
    user: {
      id: 'user-123',
      name: 'Alice',
      color: '#FF6B6B',
    },
  },
});

// Connect to all services
await app.connect();

// Use documents (CRDT-backed, auto-synced)
const doc = app.useDocument('my-doc');
await doc.set({ title: 'Hello', content: 'World' });

// Use AI (with caching and cost tracking)
const summary = await app.generate('Summarize this document');

// Use collaboration (real-time presence)
const users = app.getPresence();
app.updateCursor({ documentId: 'my-doc', x: 100, y: 200 });
```

## Architecture

```
@philjs/nexus
|-- NexusApp (Main Application Container)
|   |-- Connection Management
|   |   |-- connect()       - Connect to all services
|   |   |-- disconnect()    - Disconnect from all services
|   |   +-- isConnected()   - Check connection status
|   |
|   |-- Document API
|   |   |-- useDocument()   - Get/create a CRDT document
|   |   +-- useCollection() - Get/create a collection
|   |
|   |-- AI API
|   |   |-- generate()      - Generate content with AI
|   |   |-- generateStream() - Stream AI responses
|   |   +-- getAIUsage()    - Get token/cost statistics
|   |
|   |-- Collaboration API
|   |   |-- getPresence()   - Get online users
|   |   |-- updateCursor()  - Update cursor position
|   |   +-- setTyping()     - Set typing indicator
|   |
|   |-- Sync API
|   |   |-- getSyncStatus() - Get sync status
|   |   +-- sync()          - Manual sync trigger
|   |
|   +-- Event API
|       +-- subscribe()     - Subscribe to events
|
|-- SyncEngine (Local-First Sync)
|   |-- Storage Adapters
|   |   |-- IndexedDBAdapter - Browser storage
|   |   |-- MemoryAdapter   - In-memory (testing/SSR)
|   |   +-- SQLiteAdapter   - SQLite (coming soon)
|   |
|   +-- Remote Adapters
|       +-- SupabaseSyncAdapter - Supabase realtime sync
|
+-- Hooks (Component Integration)
    |-- initNexus()         - Initialize global app
    |-- getNexusApp()       - Get global app instance
    |-- useNexusDocument()  - Document hook
    |-- useNexusCollection() - Collection hook
    |-- useNexusAI()        - AI generation hook
    |-- useNexusAIStream()  - AI streaming hook
    |-- useNexusPresence()  - Presence hook
    |-- useNexusSync()      - Sync status hook
    +-- useNexusEvents()    - Event subscription hook
```

---

## NexusApp Class

The main application container that orchestrates all Nexus features.

### Creating an App

```typescript
import { createNexusApp, NexusApp } from '@philjs/nexus';

// Using the factory function (recommended)
const app = createNexusApp({
  local: { adapter: 'indexeddb' },
});

// Using the class directly
const app = new NexusApp({
  local: { adapter: 'indexeddb' },
});
```

### Connection Management

```typescript
// Connect to all configured services
await app.connect();

// Check if connected
if (app.isConnected()) {
  console.log('Connected to Nexus');
}

// Disconnect when done
await app.disconnect();
```

---

## Documents and Collections

Nexus provides CRDT-backed documents and collections that work offline and sync automatically.

### Using Documents

Documents are single objects identified by a unique ID:

```typescript
interface Note {
  title: string;
  content: string;
  createdAt: number;
}

// Get or create a document
const doc = app.useDocument<Note>('notes/123');

// Set the entire document
await doc.set({
  title: 'My Note',
  content: 'Hello World',
  createdAt: Date.now(),
});

// Update a specific path
await doc.update('title', 'Updated Title');

// Subscribe to changes
const unsubscribe = doc.subscribe((value) => {
  console.log('Document changed:', value);
});

// Access document metadata
console.log('Document ID:', doc.id);
console.log('Last modified:', doc.lastModified);

// Clean up subscription
unsubscribe();
```

### Using Collections

Collections are lists of documents with query support:

```typescript
interface User {
  id?: string;
  name: string;
  email: string;
  age: number;
}

// Get or create a collection
const users = app.useCollection<User>('users');

// Add a document (auto-generates ID if not provided)
const userId = await users.add({
  name: 'Alice',
  email: 'alice@example.com',
  age: 25,
});

// Get a document by ID
const user = await users.get(userId);

// Get all documents
const allUsers = await users.getAll();

// Update a document
await users.update(userId, { age: 26 });

// Delete a document
await users.delete(userId);

// Query documents with a filter
const adults = await users.query((user) => user.age >= 18);
const alices = await users.query((user) => user.name.startsWith('Alice'));

// Subscribe to collection changes
const unsubscribe = users.subscribe((items) => {
  console.log('Collection updated:', items.length, 'items');
});

// Get collection size
console.log('Collection size:', users.size);
```

---

## AI Integration

Generate content using integrated LLM providers with built-in caching and cost tracking.

### Basic Generation

```typescript
// Configure AI when creating the app
const app = createNexusApp({
  local: { adapter: 'indexeddb' },
  ai: {
    provider: 'anthropic',
    apiKey: process.env.ANTHROPIC_API_KEY!,
    model: 'claude-3-5-sonnet-20241022',
    cache: true,
    trackCosts: true,
    dailyBudget: 10, // USD
  },
});

await app.connect();

// Generate content
const result = await app.generate('Summarize this article: ...');

console.log('Content:', result.content);
console.log('Tokens used:', result.usage.totalTokens);
console.log('Cost:', `$${result.cost.toFixed(4)}`);
console.log('From cache:', result.cached);
console.log('Model:', result.model);
```

### Generation Options

```typescript
const result = await app.generate('Translate to French', {
  // Custom system prompt
  systemPrompt: 'You are a professional translator. Be accurate and natural.',

  // Additional context
  context: { targetLanguage: 'French', formality: 'formal' },

  // Temperature (0-1, lower = more deterministic)
  temperature: 0.3,

  // Maximum tokens in response
  maxTokens: 1000,

  // Output schema for structured output
  schema: {
    type: 'object',
    properties: {
      translation: { type: 'string' },
      confidence: { type: 'number' },
    },
  },
});
```

### Streaming Generation

```typescript
// Stream responses for real-time display
const generator = app.generateStream('Write a story about...');

let fullText = '';
for await (const chunk of generator) {
  process.stdout.write(chunk);
  fullText += chunk;
}

// The generator returns the final result when done
const result = await generator.return(undefined);
console.log('\nTotal tokens:', result?.value?.usage.totalTokens);
```

### Cost Tracking

```typescript
// Get cumulative usage statistics
const usage = app.getAIUsage();
console.log('Total tokens used:', usage.totalTokens);
console.log('Total cost:', `$${usage.totalCost.toFixed(2)}`);

// Set a daily budget in configuration
const app = createNexusApp({
  local: { adapter: 'indexeddb' },
  ai: {
    provider: 'anthropic',
    apiKey: '...',
    dailyBudget: 10, // Throws error if exceeded
  },
});
```

### Supported Providers

| Provider | Models | Streaming |
|----------|--------|-----------|
| `anthropic` | Claude 3.5 Sonnet, Claude 3 Opus, etc. | Yes |
| `openai` | GPT-4 Turbo, GPT-4, GPT-3.5, etc. | Yes |
| `google` | Gemini Pro, Gemini Ultra | Coming soon |
| `local` | Ollama, llama.cpp | Coming soon |

---

## Real-Time Collaboration

Add multiplayer features to your application with presence, cursors, and typing indicators.

### Configuration

```typescript
const app = createNexusApp({
  local: { adapter: 'indexeddb' },
  collab: {
    // Enable presence indicators
    presence: true,

    // Enable cursor synchronization
    cursors: true,

    // Enable comment threads
    comments: true,

    // WebSocket server for real-time sync
    websocketUrl: 'wss://your-server.com/collab',

    // Current user information
    user: {
      id: 'user-123',
      name: 'Alice',
      avatar: 'https://example.com/alice.jpg',
      color: '#FF6B6B', // Auto-generated if not provided
    },
  },
});
```

### Presence

```typescript
// Get all online users
const users = app.getPresence();

users.forEach((user) => {
  console.log(`${user.name} is online`);
  console.log(`  Color: ${user.color}`);
  console.log(`  Avatar: ${user.avatar}`);
  console.log(`  Typing: ${user.typing}`);
  console.log(`  Last active: ${new Date(user.lastActive)}`);

  if (user.cursor) {
    console.log(`  Cursor: (${user.cursor.x}, ${user.cursor.y})`);
  }
});
```

### Cursor Synchronization

```typescript
// Track mouse movement and sync cursors
document.addEventListener('mousemove', (e) => {
  app.updateCursor({
    documentId: 'current-document',
    x: e.clientX,
    y: e.clientY,
  });
});

// For text editors, use line/column instead
app.updateCursor({
  documentId: 'editor',
  line: 42,
  column: 15,
});
```

### Typing Indicator

```typescript
// Set typing indicator when user starts typing
input.addEventListener('input', () => {
  app.setTyping(true);
});

// Clear typing indicator after a delay
let typingTimeout: number;
input.addEventListener('input', () => {
  clearTimeout(typingTimeout);
  app.setTyping(true);

  typingTimeout = setTimeout(() => {
    app.setTyping(false);
  }, 1000);
});
```

---

## Sync Engine

The sync engine handles local storage and remote synchronization.

### Sync Status

```typescript
// Get current sync status
const status = app.getSyncStatus();

console.log('State:', status.state); // 'idle' | 'syncing' | 'error' | 'offline'
console.log('Last synced:', status.lastSyncedAt ? new Date(status.lastSyncedAt) : 'Never');
console.log('Pending changes:', status.pendingChanges);
console.log('Online:', status.isOnline);
console.log('Error:', status.error);
```

### Manual Sync

```typescript
// Trigger a manual sync
await app.sync();
```

### Sync Events

```typescript
app.subscribe((event) => {
  switch (event.type) {
    case 'sync-start':
      console.log('Sync started');
      break;

    case 'sync-complete':
      console.log(`Synced ${event.changes} changes`);
      break;

    case 'sync-error':
      console.error('Sync failed:', event.error);
      break;

    case 'conflict':
      console.log(`Conflict at ${event.path}, resolved: ${event.resolved}`);
      break;

    case 'online':
      console.log('Back online');
      break;

    case 'offline':
      console.log('Gone offline, changes will queue');
      break;
  }
});
```

### Using the Sync Engine Directly

```typescript
import { createSyncEngine, SyncEngine } from '@philjs/nexus/sync';

// Create a standalone sync engine
const engine = createSyncEngine({
  local: { adapter: 'indexeddb', dbName: 'my-app' },
  remote: {
    adapter: 'supabase',
    url: 'https://...',
    auth: { apiKey: '...' },
    syncStrategy: 'realtime',
  },
});

// Initialize
await engine.init();

// Use directly
await engine.set('users', 'user-1', { name: 'Alice' });
const user = await engine.get('users', 'user-1');
const allUsers = await engine.getAll('users');
await engine.delete('users', 'user-1');

// Get status
const status = engine.getStatus();

// Subscribe to events
engine.subscribe((event) => {
  console.log('Sync event:', event);
});

// Manual sync
await engine.sync();

// Close when done
await engine.close();
```

### Storage Adapters

#### IndexedDBAdapter

Browser-native storage with full offline support:

```typescript
import { IndexedDBAdapter } from '@philjs/nexus/sync';

const adapter = new IndexedDBAdapter('my-database');
await adapter.init();

// Basic operations
await adapter.set('collection', 'key', { value: 'data' });
const data = await adapter.get('collection', 'key');
const all = await adapter.getAll('collection');
const keys = await adapter.keys('collection');
await adapter.delete('collection', 'key');
await adapter.clear('collection');

// Pending changes queue (for offline sync)
await adapter.addPendingChange({
  collection: 'users',
  key: 'user-1',
  operation: 'set',
  value: { name: 'Alice' },
  timestamp: Date.now(),
});

const pending = await adapter.getPendingChanges();
await adapter.clearPendingChanges();

await adapter.close();
```

#### MemoryAdapter

In-memory storage for testing and SSR:

```typescript
import { MemoryAdapter } from '@philjs/nexus/sync';

const adapter = new MemoryAdapter();
await adapter.init();

// Same API as IndexedDBAdapter
await adapter.set('test', 'key', { value: 'data' });
const data = await adapter.get('test', 'key');

await adapter.close();
```

---

## Hooks API

React-style hooks for cleaner component integration.

### Initialization

```typescript
import { initNexus, getNexusApp } from '@philjs/nexus';

// Initialize once at app startup
const app = initNexus({
  local: { adapter: 'indexeddb' },
  ai: { provider: 'anthropic', apiKey: '...' },
  collab: { presence: true, cursors: true },
});

await app.connect();

// Access the global app anywhere
const app = getNexusApp();
```

### useNexusDocument

Hook for reactive document access:

```typescript
import { useNexusDocument } from '@philjs/nexus';

function NoteEditor({ noteId }: { noteId: string }) {
  const { data, set, update, loading, error } = useNexusDocument<Note>(noteId);

  if (loading()) return <div>Loading...</div>;
  if (error()) return <div>Error: {error()!.message}</div>;

  return (
    <div>
      <input
        value={data()?.title ?? ''}
        onChange={(e) => update('title', e.target.value)}
      />
      <textarea
        value={data()?.content ?? ''}
        onChange={(e) => update('content', e.target.value)}
      />
      <button onClick={() => set({ ...data()!, updatedAt: Date.now() })}>
        Save
      </button>
    </div>
  );
}
```

### useNexusCollection

Hook for reactive collection access:

```typescript
import { useNexusCollection } from '@philjs/nexus';

function NotesList() {
  const { items, add, update, remove, query, loading, error } =
    useNexusCollection<Note>('notes');

  if (loading()) return <div>Loading...</div>;

  return (
    <div>
      <ul>
        {items().map((note) => (
          <li key={note.id}>
            <span>{note.title}</span>
            <button onClick={() => remove(note.id!)}>Delete</button>
          </li>
        ))}
      </ul>
      <button onClick={() => add({ title: 'New Note', content: '' })}>
        Add Note
      </button>
    </div>
  );
}
```

### useNexusAI

Hook for AI text generation:

```typescript
import { useNexusAI } from '@philjs/nexus';

function SummarizeButton({ text }: { text: string }) {
  const { generate, result, loading, error, usage } = useNexusAI();

  return (
    <div>
      <button
        onClick={() => generate(`Summarize: ${text}`)}
        disabled={loading()}
      >
        {loading() ? 'Generating...' : 'Summarize'}
      </button>

      {result() && <p>{result()}</p>}
      {error() && <p style={{ color: 'red' }}>{error()!.message}</p>}

      <small>
        Tokens: {usage().tokens} | Cost: ${usage().cost.toFixed(4)}
      </small>
    </div>
  );
}
```

### useNexusAIStream

Hook for streaming AI responses:

```typescript
import { useNexusAIStream } from '@philjs/nexus';

function ChatMessage({ prompt }: { prompt: string }) {
  const { stream, content, loading, error } = useNexusAIStream();

  useEffect(() => {
    stream(prompt);
  }, [prompt]);

  return (
    <div>
      {loading() && <span>...</span>}
      <p>{content()}</p>
      {error() && <p style={{ color: 'red' }}>{error()!.message}</p>}
    </div>
  );
}
```

### useNexusPresence

Hook for real-time presence:

```typescript
import { useNexusPresence } from '@philjs/nexus';

function UserList() {
  const { users, updateCursor, setTyping } = useNexusPresence();

  return (
    <div onMouseMove={(e) => updateCursor({ x: e.clientX, y: e.clientY })}>
      <ul>
        {users().map((user) => (
          <li key={user.id} style={{ color: user.color }}>
            {user.name}
            {user.typing && ' (typing...)'}
            {!user.online && ' (offline)'}
          </li>
        ))}
      </ul>
    </div>
  );
}
```

### useNexusSync

Hook for sync status:

```typescript
import { useNexusSync } from '@philjs/nexus';

function SyncIndicator() {
  const { status, sync, isOnline } = useNexusSync();

  return (
    <div>
      {!isOnline() && <span style={{ color: 'red' }}>Offline</span>}
      {status().state === 'syncing' && <span>Syncing...</span>}
      {status().pendingChanges > 0 && (
        <span>{status().pendingChanges} pending changes</span>
      )}
      <button onClick={sync} disabled={!isOnline()}>
        Sync Now
      </button>
    </div>
  );
}
```

### useNexusEvents

Hook for event subscription:

```typescript
import { useNexusEvents } from '@philjs/nexus';

function EventLogger() {
  useNexusEvents((event) => {
    console.log('Nexus event:', event.type, event);

    if (event.type === 'ai-response') {
      console.log(`AI used ${event.tokens} tokens, cost: $${event.cost}`);
    }
  });

  return null;
}
```

---

## Event System

Nexus provides a comprehensive event system for monitoring all activities.

### Event Types

```typescript
type NexusEvent =
  // Sync events
  | { type: 'sync-start' }
  | { type: 'sync-complete'; changes: number }
  | { type: 'sync-error'; error: Error }
  | { type: 'conflict'; path: string; resolved: boolean }
  | { type: 'online' }
  | { type: 'offline' }

  // AI events
  | { type: 'ai-request'; prompt: string }
  | { type: 'ai-response'; tokens: number; cost: number }
  | { type: 'ai-error'; error: Error }

  // Collaboration events
  | { type: 'presence-update'; users: PresenceState[] }
  | { type: 'cursor-update'; userId: string; position: CursorPosition }

  // Document events
  | { type: 'document-change'; documentId: string }

  // Connection events
  | { type: 'connected' }
  | { type: 'disconnected' };
```

### Subscribing to Events

```typescript
// Subscribe to all events
const unsubscribe = app.subscribe((event) => {
  switch (event.type) {
    case 'connected':
      console.log('App connected');
      break;
    case 'disconnected':
      console.log('App disconnected');
      break;
    case 'document-change':
      console.log(`Document ${event.documentId} changed`);
      break;
    // ... handle other events
  }
});

// Unsubscribe when done
unsubscribe();
```

---

## Configuration Reference

### NexusConfig

Main configuration object:

```typescript
interface NexusConfig {
  local: LocalConfig;      // Required - local storage configuration
  remote?: RemoteConfig;   // Optional - remote sync configuration
  ai?: AIConfig;           // Optional - AI/LLM configuration
  collab?: CollabConfig;   // Optional - collaboration configuration
  debug?: DebugConfig;     // Optional - debug options
}
```

### LocalConfig

Local storage configuration:

```typescript
interface LocalConfig {
  adapter: 'indexeddb' | 'sqlite' | 'memory';
  dbName?: string;           // Database name (default: 'philjs-nexus')
  encryption?: boolean;      // Enable encryption at rest
  encryptionKey?: string;    // Required if encryption is enabled
}
```

### RemoteConfig

Remote sync configuration:

```typescript
interface RemoteConfig {
  adapter: 'supabase' | 'postgres' | 'firebase' | 'custom';
  url: string;                           // Connection URL
  auth?: RemoteAuthConfig;               // Authentication
  syncStrategy?: 'realtime' | 'polling' | 'manual'; // Default: 'realtime'
  pollInterval?: number;                 // For polling strategy (ms)
  conflictResolution?: 'crdt' | 'last-write-wins' | 'custom';
  conflictResolver?: ConflictResolver;   // For custom resolution
}

interface RemoteAuthConfig {
  token?: string;                  // JWT token
  apiKey?: string;                 // API key
  headers?: Record<string, string>; // Custom headers
}
```

### AIConfig

AI/LLM configuration:

```typescript
interface AIConfig {
  provider: 'anthropic' | 'openai' | 'google' | 'local';
  apiKey?: string;           // API key for the provider
  model?: string;            // Model to use (provider-specific default)
  guardrails?: boolean;      // Enable schema validation and safety filters
  cache?: boolean;           // Enable response caching
  cacheTTL?: number;         // Cache TTL in ms (default: 300000 = 5 min)
  maxTokens?: number;        // Max tokens per request
  trackCosts?: boolean;      // Enable cost tracking
  dailyBudget?: number;      // Budget in USD per day
}
```

### CollabConfig

Collaboration configuration:

```typescript
interface CollabConfig {
  presence?: boolean;        // Enable presence indicators
  cursors?: boolean;         // Enable cursor synchronization
  comments?: boolean;        // Enable comment threads
  websocketUrl?: string;     // WebSocket server URL
  user?: CollabUser;         // Current user information
}

interface CollabUser {
  id: string;                // Unique user ID
  name: string;              // Display name
  avatar?: string;           // Avatar URL
  color?: string;            // Color for cursors/presence
}
```

### DebugConfig

Debug and development options:

```typescript
interface DebugConfig {
  verbose?: boolean;         // Enable verbose logging
  timeTravel?: boolean;      // Enable time-travel debugging
  performance?: boolean;     // Enable performance tracking
}
```

---

## Types Reference

### Document Types

```typescript
interface NexusDocument<T = unknown> {
  readonly id: string;
  readonly lastModified: number;
  get(): T;
  set(value: T): void;
  update(path: string, value: unknown): void;
  subscribe(listener: (value: T) => void): () => void;
}

interface NexusCollection<T = unknown> {
  readonly size: number;
  getAll(): T[];
  get(id: string): T | undefined;
  add(doc: T): string;
  update(id: string, updates: Partial<T>): void;
  delete(id: string): void;
  query(filter: (doc: T) => boolean): T[];
  subscribe(listener: (docs: T[]) => void): () => void;
}
```

### Sync Types

```typescript
interface SyncStatus {
  state: 'idle' | 'syncing' | 'error' | 'offline';
  lastSyncedAt: number | null;
  pendingChanges: number;
  error: Error | null;
  isOnline: boolean;
}

interface SyncChange {
  collection: string;
  key: string;
  operation: 'set' | 'delete';
  value?: unknown;
  timestamp: number;
  userId?: string;
}

interface SyncResult {
  success: boolean;
  error?: Error;
  synced: number;
  conflicts: ConflictMetadata[];
}

type ConflictResolver = (
  local: unknown,
  remote: unknown,
  metadata: ConflictMetadata
) => unknown;

interface ConflictMetadata {
  path: string;
  localTimestamp: number;
  remoteTimestamp: number;
  localUser?: string;
  remoteUser?: string;
}
```

### AI Types

```typescript
interface AIGenerateOptions {
  systemPrompt?: string;
  context?: Record<string, unknown>;
  temperature?: number;      // 0-1
  maxTokens?: number;
  schema?: unknown;          // For structured output
}

interface AIGenerateResult<T = string> {
  content: T;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  cost: number;              // Estimated cost in USD
  cached: boolean;
  model: string;
}

interface AIStreamChunk {
  content: string;
  done: boolean;
  accumulated: string;
}
```

### Collaboration Types

```typescript
interface PresenceState {
  id: string;
  name: string;
  color: string;
  avatar?: string;
  cursor?: CursorPosition;
  selection?: SelectionRange;
  typing?: boolean;
  lastActive: number;
  online: boolean;
}

interface CursorPosition {
  documentId: string;
  line?: number;             // For text editors
  column?: number;           // For text editors
  x?: number;                // For canvas/general
  y?: number;                // For canvas/general
}

interface SelectionRange {
  start: { line: number; column: number };
  end: { line: number; column: number };
}
```

---

## API Reference

### NexusApp Methods

| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| `connect()` | - | `Promise<void>` | Connect to all configured services |
| `disconnect()` | - | `Promise<void>` | Disconnect from all services |
| `isConnected()` | - | `boolean` | Check connection status |
| `useDocument<T>(id)` | `id: string` | `NexusDocument<T>` | Get or create a document |
| `useCollection<T>(name)` | `name: string` | `NexusCollection<T>` | Get or create a collection |
| `generate(prompt, options?)` | `prompt: string, options?: AIGenerateOptions` | `Promise<AIGenerateResult>` | Generate content with AI |
| `generateStream(prompt, options?)` | `prompt: string, options?: AIGenerateOptions` | `AsyncGenerator<string, AIGenerateResult>` | Stream AI response |
| `getAIUsage()` | - | `{ totalTokens: number; totalCost: number }` | Get AI usage statistics |
| `getPresence()` | - | `PresenceState[]` | Get online users |
| `updateCursor(position)` | `position: CursorPosition` | `void` | Update cursor position |
| `setTyping(typing)` | `typing: boolean` | `void` | Set typing indicator |
| `getSyncStatus()` | - | `SyncStatus` | Get sync status |
| `sync()` | - | `Promise<void>` | Manually trigger sync |
| `subscribe(listener)` | `listener: NexusEventListener` | `() => void` | Subscribe to events |

### SyncEngine Methods

| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| `init()` | - | `Promise<void>` | Initialize the sync engine |
| `close()` | - | `Promise<void>` | Close the sync engine |
| `get<T>(collection, key)` | `collection: string, key: string` | `Promise<T \| undefined>` | Get a value |
| `getAll<T>(collection)` | `collection: string` | `Promise<T[]>` | Get all values in a collection |
| `set<T>(collection, key, value)` | `collection: string, key: string, value: T` | `Promise<void>` | Set a value |
| `delete(collection, key)` | `collection: string, key: string` | `Promise<void>` | Delete a value |
| `sync()` | - | `Promise<SyncResult>` | Manually sync with remote |
| `getStatus()` | - | `SyncStatus` | Get current sync status |
| `subscribe(listener)` | `listener: SyncEventListener` | `() => void` | Subscribe to sync events |

### StorageAdapter Interface

| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| `init()` | - | `Promise<void>` | Initialize storage |
| `get<T>(collection, key)` | `collection: string, key: string` | `Promise<T \| undefined>` | Get a value |
| `getAll<T>(collection)` | `collection: string` | `Promise<T[]>` | Get all values |
| `set<T>(collection, key, value)` | `collection: string, key: string, value: T` | `Promise<void>` | Set a value |
| `delete(collection, key)` | `collection: string, key: string` | `Promise<void>` | Delete a value |
| `clear(collection)` | `collection: string` | `Promise<void>` | Clear a collection |
| `keys(collection)` | `collection: string` | `Promise<string[]>` | Get all keys |
| `close()` | - | `Promise<void>` | Close the storage |

### Hooks Reference

| Hook | Parameters | Returns | Description |
|------|------------|---------|-------------|
| `initNexus(config)` | `config: NexusConfig` | `NexusApp` | Initialize global Nexus app |
| `getNexusApp()` | - | `NexusApp` | Get global Nexus app |
| `useNexusDocument<T>(id)` | `id: string` | `{ data, set, update, loading, error }` | Document hook |
| `useNexusCollection<T>(name)` | `name: string` | `{ items, get, add, update, remove, query, loading, error }` | Collection hook |
| `useNexusAI()` | - | `{ generate, result, loading, error, usage }` | AI generation hook |
| `useNexusAIStream()` | - | `{ stream, content, loading, error }` | AI streaming hook |
| `useNexusPresence()` | - | `{ users, updateCursor, setTyping }` | Presence hook |
| `useNexusSync()` | - | `{ status, sync, isOnline }` | Sync status hook |
| `useNexusEvents(callback)` | `callback: (event: NexusEvent) => void` | `() => void` | Event subscription hook |

---

## Comparison: Nexus vs. Alternatives

| Feature | @philjs/nexus | Replicache + Liveblocks | Firebase + Vercel AI |
|---------|---------------|-------------------------|----------------------|
| Local-first storage | Built-in | Replicache ($$$) | Limited |
| Remote sync | Built-in (free) | Replicache ($$$) | Firebase |
| AI integration | Built-in with caching | Separate SDK | Vercel AI SDK |
| Collaboration | Built-in (free) | Liveblocks ($$$) | Manual setup |
| Offline support | Automatic | Automatic | Limited |
| Bundle size | ~15KB | ~100KB+ combined | ~50KB+ combined |
| Monthly cost | Free | $200-2000+ | Variable |
| Setup complexity | Single import | Multiple integrations | Multiple integrations |

---

## Next Steps

- Review the source code for advanced patterns
- Check the tests at `packages/philjs-nexus/src/__tests__/nexus.test.ts` for usage examples
- Integrate with other PhilJS packages like `@philjs/core` for signals and `@philjs/router` for navigation
