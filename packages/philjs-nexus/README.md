# @philjs/nexus

> **The Nexus Architecture: Local-first, AI-native, Collaborative**

Nexus unifies three paradigms into one cohesive framework:

- **Local-first**: CRDT-backed data with offline support and seamless sync
- **AI-native**: Integrated LLM capabilities with guardrails, caching, and cost tracking
- **Collaborative**: Real-time presence, cursors, and multiplayer experiences

## Installation

```bash
npm install @philjs/nexus
# or
pnpm add @philjs/nexus
```

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
  },
});

// Connect to all services
await app.connect();
```

## Documents & Collections

Nexus provides CRDT-backed documents and collections that work offline and sync automatically:

```typescript
// Use a single document
const doc = app.useDocument<Note>('notes/123');
await doc.set({ title: 'Hello', content: 'World' });

// Subscribe to changes
doc.subscribe((value) => {
  console.log('Document updated:', value);
});

// Use a collection
const notes = app.useCollection<Note>('notes');

// Add items
const id = await notes.add({ title: 'New Note', content: '' });

// Query items
const recentNotes = await notes.query((n) => n.createdAt > lastWeek);

// Update items
await notes.update(id, { title: 'Updated Title' });

// Delete items
await notes.delete(id);
```

## AI Integration

Generate content with built-in caching and cost tracking:

```typescript
// Simple generation
const summary = await app.generate('Summarize this article: ...');
console.log(summary.content);
console.log(`Cost: $${summary.cost.toFixed(4)}`);

// Streaming generation
for await (const chunk of app.generateStream('Write a story...')) {
  process.stdout.write(chunk);
}

// With options
const result = await app.generate('Translate to French', {
  systemPrompt: 'You are a professional translator.',
  temperature: 0.3,
  maxTokens: 1000,
});

// Check usage
const usage = app.getAIUsage();
console.log(`Total tokens: ${usage.totalTokens}`);
console.log(`Total cost: $${usage.totalCost.toFixed(2)}`);
```

## Real-time Collaboration

Add multiplayer features to your app:

```typescript
// Get online users
const users = app.getPresence();
users.forEach((user) => {
  console.log(`${user.name} is online (${user.color})`);
});

// Update cursor position
document.addEventListener('mousemove', (e) => {
  app.updateCursor({
    documentId: 'current-doc',
    x: e.clientX,
    y: e.clientY,
  });
});

// Set typing indicator
app.setTyping(true);
```

## Sync Status

Monitor and control synchronization:

```typescript
// Get current status
const status = app.getSyncStatus();
console.log(`State: ${status.state}`); // 'idle' | 'syncing' | 'error' | 'offline'
console.log(`Pending changes: ${status.pendingChanges}`);
console.log(`Online: ${status.isOnline}`);

// Manual sync
await app.sync();

// Subscribe to sync events
app.subscribe((event) => {
  switch (event.type) {
    case 'sync-complete':
      console.log(`Synced ${event.changes} changes`);
      break;
    case 'sync-error':
      console.error('Sync failed:', event.error);
      break;
    case 'offline':
      console.log('Gone offline, changes will queue');
      break;
    case 'online':
      console.log('Back online, syncing...');
      break;
  }
});
```

## Hooks API

Use React-style hooks for cleaner component integration:

```typescript
import {
  initNexus,
  useNexusDocument,
  useNexusCollection,
  useNexusAI,
  useNexusPresence,
  useNexusSync,
} from '@philjs/nexus';

// Initialize once at app start
initNexus({
  local: { adapter: 'indexeddb' },
  ai: { provider: 'anthropic', apiKey: '...' },
});

// In components
function NoteEditor({ noteId }: { noteId: string }) {
  const { data, set, loading } = useNexusDocument<Note>(noteId);
  const { generate, loading: aiLoading } = useNexusAI();
  const { users } = useNexusPresence();
  const { status } = useNexusSync();

  if (loading()) return <div>Loading...</div>;

  return (
    <div>
      <input
        value={data()?.title}
        onChange={(e) => set({ ...data()!, title: e.target.value })}
      />
      <button onClick={() => generate(`Improve: ${data()?.content}`)}>
        AI Improve
      </button>
      <div>
        {users().map((u) => (
          <span style={{ color: u.color }}>{u.name}</span>
        ))}
      </div>
      <div>{status().isOnline ? '🟢' : '🔴'}</div>
    </div>
  );
}
```

## Configuration

### Local Storage Options

```typescript
local: {
  adapter: 'indexeddb' | 'memory' | 'sqlite',
  dbName: 'my-app',           // Database name
  encryption: true,            // Encrypt at rest
  encryptionKey: 'secret',     // Encryption key
}
```

### Remote Sync Options

```typescript
remote: {
  adapter: 'supabase' | 'postgres' | 'firebase' | 'custom',
  url: 'https://...',
  auth: {
    token: 'jwt-token',
    apiKey: 'api-key',
  },
  syncStrategy: 'realtime' | 'polling' | 'manual',
  pollInterval: 30000,         // For polling strategy
  conflictResolution: 'crdt' | 'last-write-wins' | 'custom',
}
```

### AI Options

```typescript
ai: {
  provider: 'anthropic' | 'openai' | 'google' | 'local',
  apiKey: 'sk-...',
  model: 'claude-3-5-sonnet-20241022',
  guardrails: true,            // Schema validation
  cache: true,                 // Cache responses
  cacheTTL: 300000,            // Cache TTL (5 minutes)
  maxTokens: 4096,
  trackCosts: true,
  dailyBudget: 10,             // USD per day
}
```

### Collaboration Options

```typescript
collab: {
  presence: true,
  cursors: true,
  comments: true,
  websocketUrl: 'wss://...',
  user: {
    id: 'user-123',
    name: 'Alice',
    avatar: 'https://...',
    color: '#FF6B6B',
  },
}
```

## Why Nexus?

| Feature | Without Nexus | With Nexus |
|---------|--------------|------------|
| Local-first | Integrate Replicache/PowerSync ($$$) | Built-in, free |
| AI | Integrate Vercel AI SDK | Built-in with caching |
| Collaboration | Integrate Liveblocks ($$$) | Built-in, free |
| Sync | Build custom sync logic | Automatic |
| Offline | Complex service worker setup | Works automatically |
| Bundle | Multiple large dependencies | Single 15KB package |

## License

MIT
