# @philjs/collab

The `@philjs/collab` package provides real-time collaboration capabilities for PhilJS applications, including presence tracking, CRDTs, cursor synchronization, awareness protocol, and operational transformations.

## Installation

```bash
npm install @philjs/collab
```

## Features

- **Real-time Presence** - Track who's online and their status
- **CRDTs** - Conflict-free replicated data types (Yjs-compatible)
- **Cursor Sync** - Multi-user cursor and selection visualization
- **Awareness Protocol** - Ephemeral state synchronization
- **Operational Transforms** - Text collaboration with OT
- **Transport Layer** - WebSocket and BroadcastChannel support
- **Comments System** - Threaded comments with reactions

## Quick Start

```typescript
import { createCollabRoom } from '@philjs/collab';

// Create a collaboration room
const room = createCollabRoom({
  url: 'wss://collab.example.com',
  roomId: 'document-123',
  user: {
    name: 'Alice',
    color: '#3b82f6',
  },
  onConnect: () => console.log('Connected!'),
  onDisconnect: (reason) => console.log('Disconnected:', reason),
});

// Connect to the room
await room.connect();

// Get the shared document
const doc = room.doc;
const text = doc.getText('content');

// Make changes (automatically synced)
text.insert(0, 'Hello, world!');

// Track cursor position
room.updateCursor({ line: 1, column: 5 });

// Clean up
room.disconnect();
```

---

## CollabRoom

The all-in-one collaboration solution:

```typescript
import { createCollabRoom, CollabRoom } from '@philjs/collab';
import type { CollabRoomConfig } from '@philjs/collab';

const config: CollabRoomConfig = {
  // WebSocket URL
  url: 'wss://collab.example.com',

  // Room identifier
  roomId: 'project-abc-doc-123',

  // Optional client ID (auto-generated if not provided)
  clientId: 'user-alice-session-1',

  // User information
  user: {
    name: 'Alice',
    color: '#3b82f6',
    avatar: 'https://example.com/alice.jpg',
  },

  // Event handlers
  onConnect: () => {
    console.log('Connected to collaboration server');
  },
  onDisconnect: (reason) => {
    console.log('Disconnected:', reason);
  },
  onError: (error) => {
    console.error('Collaboration error:', error);
  },
};

const room = createCollabRoom(config);

// Room provides access to all subsystems:
room.transport;  // WebSocketTransport
room.presence;   // PresenceManager
room.awareness;  // Awareness
room.cursors;    // CursorManager
room.doc;        // YDoc (CRDT document)
```

### Room Methods

```typescript
// Connect to room
await room.connect();

// Disconnect from room
room.disconnect();

// Attach cursor tracking to an editor element
room.attachCursors(document.getElementById('editor')!);

// Update cursor position
room.updateCursor({ line: 10, column: 15 });

// Update selection
room.updateSelection({
  start: { line: 10, column: 5 },
  end: { line: 10, column: 20 },
});

// Show typing indicator
room.setTyping(true);
// After typing stops
room.setTyping(false);
```

---

## Transport Layer

### WebSocket Transport

```typescript
import {
  WebSocketTransport,
  createWebSocketTransport,
  generateClientId,
} from '@philjs/collab';
import type { TransportConfig, CollabMessage } from '@philjs/collab';

const config: TransportConfig = {
  url: 'wss://collab.example.com',
  roomId: 'document-123',
  clientId: generateClientId(),
};

const transport = createWebSocketTransport(config);

// Connect
await transport.connect();

// Send messages
transport.send('presence', { status: 'online' });
transport.send('operation', { type: 'insert', pos: 0, text: 'Hello' });

// Receive messages
transport.on('message', (message: CollabMessage) => {
  console.log('Received:', message.type, message.payload);
});

// Connection events
transport.on('connect', () => console.log('Connected'));
transport.on('disconnect', (reason) => console.log('Disconnected:', reason));
transport.on('error', (error) => console.error('Error:', error));

// Disconnect
transport.disconnect();
```

### BroadcastChannel Transport

For same-origin tab synchronization:

```typescript
import { createBroadcastTransport } from '@philjs/collab';

// No server needed - syncs across browser tabs
const transport = createBroadcastTransport({
  roomId: 'local-doc',
  clientId: generateClientId(),
});

await transport.connect();
transport.send('operation', { data: 'synced across tabs' });
```

### Message Types

```typescript
type MessageType =
  | 'sync'        // Initial state sync
  | 'operation'   // Document operation
  | 'presence'    // Presence update
  | 'awareness'   // Awareness state
  | 'cursor'      // Cursor position
  | 'comment'     // Comment action
  | 'ack'         // Acknowledgment
  | 'error';      // Error message

interface CollabMessage {
  type: MessageType;
  clientId: string;
  roomId: string;
  payload: unknown;
  timestamp: number;
}
```

---

## Presence

Track who's online and their status:

```typescript
import {
  PresenceManager,
  createPresenceManager,
  getPresenceColor,
  PRESENCE_COLORS,
} from '@philjs/collab';
import type { UserPresence, PresenceConfig, PresenceUpdate } from '@philjs/collab';

const presence = createPresenceManager({
  clientId: 'user-123',
  user: {
    name: 'Alice',
    color: '#3b82f6', // Or use getPresenceColor(index)
  },
});

// Start broadcasting presence
presence.start((update: PresenceUpdate) => {
  // Send update via transport
  transport.send('presence', update);
});

// Handle remote presence updates
transport.on('message', (msg) => {
  if (msg.type === 'presence') {
    presence.handleRemoteUpdate(msg.payload);
  }
});

// Get all online users
const users = presence.getAll();
users.forEach((user: UserPresence) => {
  console.log(`${user.name} - ${user.status}`);
});

// Stop presence
presence.stop();
```

### Presence Colors

```typescript
import { getPresenceColor, PRESENCE_COLORS } from '@philjs/collab';

// Get color by index (cycles through palette)
const color1 = getPresenceColor(0); // '#3b82f6'
const color2 = getPresenceColor(1); // '#ef4444'

// Full palette
console.log(PRESENCE_COLORS);
// ['#3b82f6', '#ef4444', '#22c55e', '#f59e0b', '#8b5cf6', ...]
```

---

## CRDTs

Yjs-compatible conflict-free replicated data types:

### YDoc

```typescript
import { YDoc, createYDoc } from '@philjs/collab';
import type { Update } from '@philjs/collab';

// Create a CRDT document
const doc = createYDoc('client-123');

// Listen for local updates
doc.onUpdate((update: Update) => {
  // Send to other clients
  transport.send('operation', update);
});

// Apply remote updates
transport.on('message', (msg) => {
  if (msg.type === 'operation') {
    doc.applyUpdate(msg.payload);
  }
});
```

### YText

Collaborative text editing:

```typescript
import type { TextDelta } from '@philjs/collab';

// Get or create shared text
const text = doc.getText('content');

// Insert text
text.insert(0, 'Hello, ');
text.insert(7, 'world!');

// Delete text
text.delete(0, 7); // Delete "Hello, "

// Get full text
const content = text.toString(); // "world!"

// Get length
const length = text.length;

// Listen for changes
text.observe((event) => {
  console.log('Text changed:', event.delta);
});
```

### YArray

Collaborative arrays:

```typescript
import type { ArrayEvent } from '@philjs/collab';

// Get or create shared array
const list = doc.getArray('items');

// Add items
list.push(['item1', 'item2']);
list.insert(0, ['first']);
list.unshift('very first');

// Remove items
list.delete(0, 1); // Delete first item

// Get items
const items = list.toArray();
const item = list.get(0);
const length = list.length;

// Observe changes
list.observe((event: ArrayEvent) => {
  console.log('Added:', event.added);
  console.log('Deleted:', event.deleted);
});
```

### YMap

Collaborative key-value store:

```typescript
import type { MapEvent } from '@philjs/collab';

// Get or create shared map
const metadata = doc.getMap('metadata');

// Set values
metadata.set('title', 'My Document');
metadata.set('author', 'Alice');
metadata.set('version', 1);

// Get values
const title = metadata.get('title');
const hasAuthor = metadata.has('author');

// Delete keys
metadata.delete('version');

// Get all keys
const keys = Array.from(metadata.keys());

// Convert to object
const obj = metadata.toJSON();

// Observe changes
metadata.observe((event: MapEvent) => {
  for (const [key, change] of event.changes) {
    console.log(`${key}: ${change.action}`);
  }
});
```

---

## Cursors

Multi-user cursor visualization:

```typescript
import {
  CursorManager,
  createCursorManager,
  injectCursorStyles,
  CURSOR_STYLES,
} from '@philjs/collab';
import type { CursorPosition, CursorDecoration } from '@philjs/collab';

// Inject default cursor CSS
injectCursorStyles();

// Create cursor manager
const cursors = createCursorManager('my-client-id');

// Attach to editor container
cursors.attach(document.getElementById('editor')!);

// Update remote cursor
cursors.updateCursor({
  clientId: 'other-user',
  name: 'Bob',
  color: '#ef4444',
  position: { line: 5, column: 10 },
  selection: {
    start: { line: 5, column: 5 },
    end: { line: 5, column: 15 },
  },
  timestamp: Date.now(),
});

// Remove cursor when user leaves
cursors.removeCursor('other-user');
```

### Cursor Styles

```typescript
// Default styles
console.log(CURSOR_STYLES);
// CSS for cursor caret, selection highlight, name label

// Custom cursor decoration
const decoration: CursorDecoration = {
  caretColor: '#ef4444',
  selectionColor: 'rgba(239, 68, 68, 0.3)',
  labelBackground: '#ef4444',
  labelColor: '#ffffff',
};
```

---

## Awareness

Ephemeral state synchronization (cursors, selections, typing indicators):

```typescript
import {
  Awareness,
  createAwareness,
  createTypedAwareness,
} from '@philjs/collab';
import type {
  AwarenessState,
  AwarenessUpdate,
  StandardAwarenessState,
} from '@philjs/collab';

// Create awareness instance
const awareness = createAwareness({
  clientId: 'user-123',
});

// Start broadcasting
awareness.start((state: AwarenessState) => {
  transport.send('awareness', state);
});

// Update local state
awareness.updateLocalState({
  cursor: { line: 10, column: 5 },
  selection: {
    start: { line: 10, column: 0 },
    end: { line: 10, column: 20 },
  },
  typing: true,
  customData: 'any value',
});

// Get local state
const localState = awareness.getLocalState();

// Get remote user's state
const remoteState = awareness.getRemoteState('other-user');

// Get all states
const allStates = awareness.getAllStates();

// Subscribe to changes
awareness.subscribe((update: AwarenessUpdate) => {
  console.log('Added clients:', update.added);
  console.log('Updated clients:', update.updated);
  console.log('Removed clients:', update.removed);
});

// Handle remote updates
awareness.handleRemoteUpdate(remotePayload);

// Apply full state sync
awareness.applyStates(statesFromServer);

// Stop awareness
awareness.stop();
```

### Typed Awareness

For type-safe awareness state:

```typescript
interface MyAwarenessState {
  cursor: { line: number; column: number } | null;
  selection: { start: Position; end: Position } | null;
  typing: boolean;
  viewingSection: string;
}

const awareness = createTypedAwareness<MyAwarenessState>({
  clientId: 'user-123',
});

// Type-safe updates
awareness.updateLocalState({
  cursor: { line: 1, column: 1 },
  typing: false,
  viewingSection: 'introduction',
});
```

---

## Operational Transformations

For text-based real-time collaboration:

```typescript
import {
  OTClient,
  OTServer,
  createOTClient,
  createOTServer,
  transform,
  compose,
  invert,
} from '@philjs/collab';
import type { Operation, InsertOp, DeleteOp, RetainOp } from '@philjs/collab';

// Client-side OT
const client = createOTClient({
  clientId: 'user-123',
  onSend: (op) => transport.send('operation', op),
});

// Apply local edit
client.applyLocal({
  type: 'insert',
  position: 0,
  text: 'Hello',
});

// Receive server operation
client.applyServer(serverOperation);

// Server-side OT
const server = createOTServer();

// Process client operation
const transformed = server.receiveOperation('user-123', operation);

// Broadcast to other clients
server.broadcast(transformed, excludeClientId);
```

### Operation Types

```typescript
// Insert text
const insert: InsertOp = {
  type: 'insert',
  position: 0,
  text: 'Hello',
};

// Delete text
const del: DeleteOp = {
  type: 'delete',
  position: 5,
  count: 3,
};

// Retain (skip) characters
const retain: RetainOp = {
  type: 'retain',
  count: 10,
};
```

### Transform Operations

```typescript
// Transform two concurrent operations
const [op1Prime, op2Prime] = transform(op1, op2);

// Compose sequential operations
const combined = compose(op1, op2);

// Invert an operation (for undo)
const undo = invert(operation, document);

// Apply operations to text
import { applyOperation, applyOperations } from '@philjs/collab';

let text = 'Hello';
text = applyOperation(text, { type: 'insert', position: 5, text: ' World' });
// "Hello World"

text = applyOperations(text, [
  { type: 'delete', position: 0, count: 6 },
  { type: 'insert', position: 0, text: 'Hi' },
]);
// "Hi World"
```

---

## Comments

Threaded commenting system:

```typescript
import {
  CommentsManager,
  createCommentsManager,
  COMMENT_REACTIONS,
} from '@philjs/collab';
import type {
  Comment,
  CommentThread,
  ThreadAnchor,
  CommentReaction,
} from '@philjs/collab';

const comments = createCommentsManager({
  transport,
  onThreadCreated: (thread) => console.log('New thread:', thread.id),
  onCommentAdded: (comment) => console.log('New comment:', comment.id),
  onReactionAdded: (reaction) => console.log('New reaction:', reaction.emoji),
});

// Create a thread anchored to content
const thread = comments.createThread({
  anchor: {
    type: 'text',
    startOffset: 100,
    endOffset: 150,
  },
  author: {
    id: 'user-123',
    name: 'Alice',
    avatar: 'https://example.com/alice.jpg',
  },
  content: 'This paragraph needs revision.',
});

// Reply to thread
comments.addComment(thread.id, {
  author: { id: 'user-456', name: 'Bob' },
  content: 'I agree, let me fix it.',
});

// Add reaction
comments.addReaction(thread.id, commentId, {
  emoji: '👍',
  userId: 'user-789',
});

// Resolve thread
comments.resolveThread(thread.id);

// Get all threads
const threads = comments.getAllThreads();

// Get threads for a range
const rangeThreads = comments.getThreadsInRange(0, 200);
```

### Comment Reactions

```typescript
// Default reactions
console.log(COMMENT_REACTIONS);
// ['👍', '👎', '❤️', '🎉', '😕', '👀']

// Custom reactions
const config = {
  allowedReactions: ['👍', '👎', '✅', '❌'],
};
```

---

## Types Reference

```typescript
// User presence
interface UserPresence {
  clientId: string;
  name: string;
  color: string;
  avatar?: string;
  status: 'online' | 'away' | 'offline';
  lastSeen: number;
}

// Cursor position
interface CursorPosition {
  clientId: string;
  name: string;
  color: string;
  position: { line: number; column: number };
  selection?: {
    start: { line: number; column: number };
    end: { line: number; column: number };
  };
  timestamp: number;
}

// Awareness state
interface AwarenessState {
  clientId: string;
  [key: string]: unknown;
}

// Awareness update
interface AwarenessUpdate {
  added: string[];
  updated: string[];
  removed: string[];
}

// CRDT types
interface ItemId {
  client: string;
  clock: number;
}

interface StateVector {
  [clientId: string]: number;
}

interface Update {
  origin: string;
  data: Uint8Array;
}

// Comment types
interface Comment {
  id: string;
  threadId: string;
  author: CommentAuthor;
  content: string;
  createdAt: number;
  updatedAt?: number;
  reactions: CommentReaction[];
}

interface CommentThread {
  id: string;
  anchor: ThreadAnchor;
  comments: Comment[];
  resolved: boolean;
  createdAt: number;
}
```

---

## API Reference

### CollabRoom

| Export | Description |
|--------|-------------|
| `createCollabRoom` | Create collaboration room |
| `CollabRoom` | Room class |

### Transport

| Export | Description |
|--------|-------------|
| `createWebSocketTransport` | WebSocket transport |
| `createBroadcastTransport` | BroadcastChannel transport |
| `generateClientId` | Generate unique client ID |
| `WebSocketTransport` | Transport class |
| `BroadcastTransport` | Local transport class |

### Presence

| Export | Description |
|--------|-------------|
| `createPresenceManager` | Create presence manager |
| `getPresenceColor` | Get color by index |
| `PRESENCE_COLORS` | Color palette array |
| `PresenceManager` | Manager class |

### CRDTs

| Export | Description |
|--------|-------------|
| `createYDoc` | Create CRDT document |
| `YDoc` | Document class |
| `YText` | Collaborative text |
| `YArray` | Collaborative array |
| `YMap` | Collaborative map |

### Cursors

| Export | Description |
|--------|-------------|
| `createCursorManager` | Create cursor manager |
| `injectCursorStyles` | Inject cursor CSS |
| `CURSOR_STYLES` | Default CSS |
| `CursorManager` | Manager class |

### Awareness

| Export | Description |
|--------|-------------|
| `createAwareness` | Create awareness |
| `createTypedAwareness` | Type-safe awareness |
| `Awareness` | Awareness class |

### Operational Transforms

| Export | Description |
|--------|-------------|
| `createOTClient` | Create OT client |
| `createOTServer` | Create OT server |
| `transform` | Transform operations |
| `compose` | Compose operations |
| `invert` | Invert operation |
| `applyOperation` | Apply single operation |
| `applyOperations` | Apply multiple operations |

### Comments

| Export | Description |
|--------|-------------|
| `createCommentsManager` | Create comments system |
| `COMMENT_REACTIONS` | Default reaction emojis |
| `CommentsManager` | Manager class |

---

## Next Steps

- [Collaboration Patterns](../../nexus/collaboration.md)
- [Real-time Data](../../data/real-time.md)
- [@philjs/realtime](../realtime/overview.md)
