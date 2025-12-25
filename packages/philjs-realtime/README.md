# PhilJS Realtime

Real-time collaboration and WebSocket features for PhilJS applications.

## Features

- **WebSocket Client** - Auto-reconnecting WebSocket with exponential backoff
- **Presence** - Track who's online with user metadata
- **Cursors** - Real-time cursor position sharing
- **Rooms** - Multi-room support with user management
- **Broadcast** - Channel-based message broadcasting
- **Shared State** - CRDT-like collaborative state synchronization
- **Y.js Integration** - Full CRDT support for complex documents

## Installation

```bash
npm install philjs-realtime
```

## Quick Start

```typescript
import {
  WebSocketClient,
  usePresence,
  useCursors,
  useRoom,
  useSharedState,
} from 'philjs-realtime';

// Create WebSocket client
const client = new WebSocketClient({
  url: 'wss://your-server.com/ws',
  reconnect: true,
  heartbeatInterval: 30000,
});

// Connect
client.connect();
```

## WebSocket Client

Full-featured WebSocket client with automatic reconnection:

```typescript
const client = new WebSocketClient({
  url: 'wss://api.example.com/ws',
  protocols: ['v1'],
  reconnect: true,
  reconnectDelay: 1000,
  maxReconnectDelay: 30000,
  reconnectAttempts: 10,
  heartbeatInterval: 30000,
  onOpen: () => console.log('Connected'),
  onClose: (event) => console.log('Disconnected', event),
  onError: (error) => console.error('Error', error),
  onMessage: (message) => console.log('Message', message),
});

// Connect/disconnect
client.connect();
client.disconnect();

// Send messages
client.send('chat:message', { text: 'Hello!' }, 'room-1');

// Listen for message types
const unsubscribe = client.on('chat:message', (payload) => {
  console.log('New message:', payload);
});

// Reactive status
effect(() => {
  console.log('Connection status:', client.status());
});
```

## Presence

Track online users with metadata:

```typescript
import { usePresence } from 'philjs-realtime';

function OnlineUsers() {
  const { others, myPresence, updatePresence, count } = usePresence({
    client,
    room: 'lobby',
    user: {
      id: 'user-123',
      name: 'Alice',
      avatar: '/alice.png',
    },
    initialData: { status: 'online' },
    syncInterval: 1000,
  });

  // Update my presence data
  updatePresence({ status: 'away' });

  return () => {
    const users = others();

    return (
      <div>
        <h3>Online ({count()})</h3>
        <ul>
          {users.map(u => (
            <li key={u.user.id}>
              <img src={u.user.avatar} />
              {u.user.name} - {u.data.status}
            </li>
          ))}
        </ul>
      </div>
    );
  };
}
```

## Cursors

Real-time cursor position sharing:

```typescript
import { useCursors } from 'philjs-realtime';

function CollaborativeCanvas() {
  const { cursors, broadcast } = useCursors({
    client,
    room: 'canvas',
    user: { id: 'user-123', name: 'Alice', color: '#ff0000' },
    throttle: 50, // Throttle updates to 50ms
  });

  // Track mouse movement
  const handleMouseMove = (e) => {
    broadcast(e.clientX, e.clientY);
  };

  return () => (
    <div onMouseMove={handleMouseMove} style={{ position: 'relative' }}>
      {/* Render other users' cursors */}
      {cursors().map(cursor => (
        <div
          key={cursor.user.id}
          style={{
            position: 'absolute',
            left: cursor.x,
            top: cursor.y,
            pointerEvents: 'none',
          }}
        >
          <svg width="20" height="20">
            <path d="M0,0 L0,14 L4,10 L7,16 L9,15 L6,9 L12,9 Z" fill={cursor.user.color} />
          </svg>
          <span>{cursor.user.name}</span>
        </div>
      ))}
    </div>
  );
}
```

## Rooms

Multi-room support with user management:

```typescript
import { useRoom } from 'philjs-realtime';

function ChatRoom({ roomId }) {
  const { room, users, isJoined, error, join, leave, broadcast } = useRoom({
    client,
    roomId,
    user: { id: 'user-123', name: 'Alice' },
    password: 'optional-password',
  });

  // Join on mount
  onMount(() => {
    join();
    return () => leave();
  });

  // Send message to room
  const sendMessage = (text) => {
    broadcast('chat:message', { text, timestamp: Date.now() });
  };

  return () => {
    if (error()) return <div>Error: {error().message}</div>;
    if (!isJoined()) return <div>Joining...</div>;

    return (
      <div>
        <h2>Room: {room()?.id}</h2>
        <h3>Users ({users().length})</h3>
        <ul>
          {users().map(u => <li key={u.id}>{u.name}</li>)}
        </ul>
      </div>
    );
  };
}
```

## Broadcast Channels

Simple pub/sub messaging:

```typescript
import { useBroadcast } from 'philjs-realtime';

function Notifications() {
  const { broadcast, lastMessage, history, clear } = useBroadcast({
    client,
    room: 'global',
    channel: 'notifications',
  });

  // Send a notification
  broadcast({ type: 'info', text: 'Welcome!' });

  return () => (
    <div>
      <h3>Latest: {lastMessage()?.text}</h3>
      <ul>
        {history().map((n, i) => <li key={i}>{n.text}</li>)}
      </ul>
      <button onClick={clear}>Clear</button>
    </div>
  );
}
```

## Shared State

CRDT-like collaborative state synchronization:

```typescript
import { useSharedState } from 'philjs-realtime';

function CollaborativeDocument() {
  const { state, get, set, merge, version } = useSharedState({
    client,
    room: 'doc-123',
    initialState: {
      title: 'Untitled',
      content: '',
      collaborators: [],
    },
  });

  // Update a single field
  const updateTitle = (title) => set('title', title);

  // Merge multiple fields
  const saveChanges = () => merge({
    content: 'New content',
    lastModified: Date.now(),
  });

  return () => (
    <div>
      <input
        value={get('title')}
        onInput={(e) => updateTitle(e.target.value)}
      />
      <textarea
        value={get('content')}
        onInput={(e) => set('content', e.target.value)}
      />
      <small>Version: {version()}</small>
    </div>
  );
}
```

## Y.js Integration

For complex CRDT operations, use Y.js:

```typescript
import { useYjs } from 'philjs-realtime/yjs';
import * as Y from 'yjs';

function CollaborativeEditor() {
  const { doc, awareness, provider } = useYjs({
    client,
    room: 'editor',
    user: { id: 'user-123', name: 'Alice' },
  });

  // Get shared text
  const ytext = doc.getText('content');

  // Bind to editor (e.g., Quill, ProseMirror)
  onMount(() => {
    const binding = new QuillBinding(ytext, quillEditor, awareness);
    return () => binding.destroy();
  });
}
```

## Server-Side Room Manager

For server implementations:

```typescript
import { RoomManager } from 'philjs-realtime';

const rooms = new RoomManager();

// Handle WebSocket connections
wss.on('connection', (ws, req) => {
  const userId = getUserId(req);

  ws.on('message', (data) => {
    const { type, roomId, payload } = JSON.parse(data);

    switch (type) {
      case 'join':
        rooms.join(roomId, userId);
        broadcastToRoom(roomId, 'user:joined', { userId });
        break;

      case 'leave':
        rooms.leave(roomId, userId);
        broadcastToRoom(roomId, 'user:left', { userId });
        break;

      case 'message':
        if (rooms.isInRoom(roomId, userId)) {
          broadcastToRoom(roomId, 'message', payload);
        }
        break;
    }
  });

  ws.on('close', () => {
    const leftRooms = rooms.leaveAll(userId);
    leftRooms.forEach(roomId => {
      broadcastToRoom(roomId, 'user:left', { userId });
    });
  });
});

function broadcastToRoom(roomId, event, payload) {
  const users = rooms.getUsers(roomId);
  // Send to all users in room
}
```

## Message Protocol

Standard message format:

```typescript
interface RealtimeMessage {
  type: string;      // Message type (e.g., 'chat:message')
  payload: any;      // Message data
  room?: string;     // Target room (optional)
  from?: string;     // Sender ID (set by server)
  timestamp?: number; // Message timestamp
}
```

## TypeScript Types

```typescript
import type {
  ConnectionStatus,
  User,
  PresenceState,
  RoomConfig,
  RealtimeMessage,
  WebSocketClientOptions,
  CursorPosition,
  CursorState,
} from 'philjs-realtime';
```

## Best Practices

### 1. Throttle Cursor Updates

```typescript
useCursors({ throttle: 50 }); // 50ms between updates
```

### 2. Clean Up on Unmount

```typescript
onMount(() => {
  client.connect();
  return () => client.disconnect();
});
```

### 3. Handle Reconnection

```typescript
effect(() => {
  if (client.status() === 'reconnecting') {
    showReconnectingIndicator();
  }
});
```

### 4. Use Rooms for Isolation

```typescript
// Each document gets its own room
useRoom({ roomId: `doc-${documentId}` });
```

## Comparison with Alternatives

| Feature | PhilJS Realtime | Socket.IO | Liveblocks | Supabase Realtime |
|---------|-----------------|-----------|------------|-------------------|
| Presence | Yes | Manual | Yes | Yes |
| Cursors | Yes | Manual | Yes | No |
| Rooms | Yes | Yes | Yes | Yes |
| CRDT | Y.js | Manual | Yes | No |
| Auto-reconnect | Yes | Yes | Yes | Yes |
| TypeScript | Yes | Yes | Yes | Yes |

## License

MIT
