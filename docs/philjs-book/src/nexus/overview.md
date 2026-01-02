# What is Nexus?

**Nexus** is PhilJS's unified architecture for building modern applications that are:

- **Local-first**: Your data lives on the device, syncs when online
- **AI-native**: LLM capabilities built in with guardrails and cost tracking
- **Collaborative**: Real-time presence, cursors, and multiplayer by default

Instead of stitching together Replicache + Vercel AI SDK + Liveblocks (and paying for each), Nexus provides all three paradigms in a single, cohesive API.

## The Problem Nexus Solves

Building a modern collaborative, AI-powered app typically requires:

| Capability | Traditional Approach | Cost |
|------------|---------------------|------|
| Local-first sync | Replicache, PowerSync, ElectricSQL | $500-2000/mo |
| AI integration | Vercel AI SDK, LangChain | Free + API costs |
| Real-time collab | Liveblocks, Yjs + server | $500-1500/mo |
| Offline support | Custom service workers | Engineering time |

**Nexus unifies all of this into one 15KB package.**

## Quick Start

```bash
npm install @philjs/nexus
```

```typescript
import { createNexusApp } from '@philjs/nexus';

const app = createNexusApp({
  // Local storage (required)
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

  // Collaboration (optional)
  collab: {
    presence: true,
    cursors: true,
  },
});

await app.connect();
```

## Core Concepts

### Documents (CRDT-backed)

Documents are the primary unit of data in Nexus. They're backed by CRDTs for automatic conflict resolution:

```typescript
const doc = app.useDocument<Note>('notes/123');

// Set the entire document
await doc.set({ title: 'Hello', content: 'World' });

// Update a nested path
await doc.update('content', 'Updated content');

// Subscribe to changes (works offline)
doc.subscribe((value) => {
  console.log('Document changed:', value);
});
```

### Collections

Collections are ordered sets of documents:

```typescript
const notes = app.useCollection<Note>('notes');

// Add items
const id = await notes.add({ title: 'New Note', content: '' });

// Query with predicates
const recent = await notes.query((n) => n.createdAt > lastWeek);

// Update and delete
await notes.update(id, { title: 'Renamed' });
await notes.delete(id);
```

### AI Generation

Generate content with built-in caching and cost tracking:

```typescript
// Simple generation
const result = await app.generate('Summarize this article: ...');
console.log(result.content);
console.log(`Cost: $${result.cost.toFixed(4)}`);

// Streaming
for await (const chunk of app.generateStream('Write a story...')) {
  process.stdout.write(chunk);
}

// Check usage
const usage = app.getAIUsage();
console.log(`Total cost: $${usage.totalCost.toFixed(2)}`);
```

### Real-time Presence

See who's online and where they are:

```typescript
// Get online users
const users = app.getPresence();
users.forEach((user) => {
  console.log(`${user.name} is at (${user.cursor?.x}, ${user.cursor?.y})`);
});

// Update your cursor
app.updateCursor({ documentId: 'doc-123', x: 100, y: 200 });

// Show typing indicator
app.setTyping(true);
```

### Sync Status

Monitor and control synchronization:

```typescript
const status = app.getSyncStatus();
// { state: 'idle' | 'syncing' | 'error' | 'offline', pendingChanges: 0, isOnline: true }

// Manual sync
await app.sync();

// Subscribe to sync events
app.subscribe((event) => {
  if (event.type === 'sync-complete') {
    console.log(`Synced ${event.changes} changes`);
  }
});
```

## Hooks API

For component integration, use the hooks API:

```typescript
import {
  initNexus,
  useNexusDocument,
  useNexusCollection,
  useNexusAI,
  useNexusPresence,
  useNexusSync,
} from '@philjs/nexus';

// Initialize once
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
      <div>{status().isOnline ? 'Online' : 'Offline'}</div>
    </div>
  );
}
```

## Architecture

Nexus is built on top of existing PhilJS packages:

```
@philjs/nexus
├── @philjs/collab    → CRDT implementation (YDoc, YText, YArray, YMap)
├── @philjs/genui     → A2UI protocol for AI-generated UIs
├── @philjs/intent    → Intent-based development with policies
├── @philjs/ai        → LLM providers with guardrails
└── @philjs/storage   → Persistence adapters
```

The sync engine handles:
- **Local storage**: IndexedDB (browser), SQLite (native), Memory (SSR/testing)
- **Remote sync**: Supabase, Postgres, Firebase, or custom adapters
- **Conflict resolution**: CRDT-based or last-write-wins
- **Offline queue**: Changes are queued and replayed when back online

## Comparison

| Feature | Nexus | Liveblocks | Replicache | Vercel AI |
|---------|-------|------------|------------|-----------|
| Local-first | Yes | No | Yes | No |
| AI integration | Built-in | No | No | Yes |
| Collaboration | Built-in | Yes | No | No |
| Offline | Automatic | Partial | Yes | No |
| Cost tracking | Built-in | No | No | No |
| Bundle size | 15KB | 50KB | 30KB | 20KB |
| Monthly cost | Free | $500+ | $500+ | Free |

## Next Steps

- [Local-First Architecture](./architecture.md) - Deep dive into CRDTs and sync
- [GenUI and AI Flows](./genui.md) - AI-assisted UI generation with guardrails
- [Collaboration Patterns](./collaboration.md) - Building multiplayer experiences
- [Tutorial: Building a Notion Clone](../tutorials/notion-clone.md) - Full example app

## Why "Nexus"?

A nexus is a connection point, a place where things come together. PhilJS Nexus connects:

- Your **local data** with **remote servers**
- Your **users** with **each other**
- Your **app** with **AI capabilities**

All in one unified, type-safe, reactive API that works offline and scales to millions of users.
