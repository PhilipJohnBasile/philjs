# @philjs/realtime - Real-time Collaboration

**WebSocket client with presence, cursors, rooms, and multiplayer state for real-time applications.**

@philjs/realtime provides everything needed for real-time collaboration: WebSocket connections with auto-reconnect, presence tracking, cursor sharing, room management, broadcast channels, and shared state synchronization.

## Installation

```bash
npm install @philjs/realtime
```

## Quick Start

```typescript
import {
  WebSocketClient,
  usePresence,
  useCursors,
  useRoom,
} from '@philjs/realtime';

// Create WebSocket client
const client = new WebSocketClient({
  url: 'wss://api.example.com/ws',
  reconnect: true,
});

client.connect();

// Track presence
const presence = usePresence({
  client,
  room: 'document-123',
  user: { id: 'user-1', name: 'John' },
  initialData: { cursor: null },
});

console.log('Online:', presence.count());
console.log('Others:', presence.others());
```

## WebSocket Client

### Configuration

```typescript
import { WebSocketClient } from '@philjs/realtime';

const client = new WebSocketClient({
  // Required
  url: 'wss://api.example.com/ws',

  // Optional protocols
  protocols: ['v1', 'v2'],

  // Auto-reconnect (default: true)
  reconnect: true,

  // Reconnect delays (ms)
  reconnectDelay: 1000,       // Initial delay
  maxReconnectDelay: 30000,   // Max delay (exponential backoff)
  reconnectAttempts: Infinity, // Max attempts

  // Heartbeat interval (default: 30000ms)
  heartbeatInterval: 30000,

  // Event callbacks
  onOpen: () => console.log('Connected'),
  onClose: (event) => console.log('Disconnected', event),
  onError: (error) => console.error('Error', error),
  onMessage: (message) => console.log('Message', message),
});
```

### Connection Management

```typescript
// Connect
client.connect();

// Disconnect (stops auto-reconnect)
client.disconnect();

// Connection status (signal)
client.status();  // 'connecting' | 'connected' | 'disconnected' | 'reconnecting'

// Last received message (signal)
client.lastMessage();  // RealtimeMessage | null
```

### Sending Messages

```typescript
// Send message
client.send('chat:message', { text: 'Hello!' }, 'room-123');

// Message structure
interface RealtimeMessage {
  type: string;        // Message type
  payload: any;        // Message data
  room?: string;       // Optional room
  from?: string;       // Sender ID (server-set)
  timestamp?: number;  // Auto-set timestamp
}
```

### Listening for Messages

```typescript
// Listen to specific message type
const unsubscribe = client.on('chat:message', (payload) => {
  console.log('New message:', payload.text);
});

// Clean up
unsubscribe();

// Listen to all messages
client.onMessage = (message) => {
  console.log('Type:', message.type);
  console.log('Payload:', message.payload);
  console.log('Room:', message.room);
};
```

## Presence

Track who's online and share live state:

### `usePresence()`

```typescript
import { usePresence } from '@philjs/realtime';

interface CursorData {
  x: number;
  y: number;
}

const presence = usePresence<CursorData>({
  client,
  room: 'document-123',
  user: {
    id: 'user-1',
    name: 'John',
    avatar: '/john.png',
    color: '#4CAF50',
  },
  initialData: { x: 0, y: 0 },
  syncInterval: 1000,  // Broadcast interval (default: 1000ms)
});

// Read presence state (signals)
presence.others();      // Array of PresenceState<CursorData>
presence.myPresence();  // My current data
presence.isConnected(); // Connection status
presence.count();       // Total users (including me)

// Update my presence
presence.updatePresence({ x: 100, y: 200 });
```

### Presence Types

```typescript
interface User {
  id: string;
  name?: string;
  avatar?: string;
  color?: string;
  [key: string]: any;  // Custom properties
}

interface PresenceState<T = any> {
  user: User;
  data: T;
  lastSeen: number;
}
```

### Example: Online Users List

```typescript
function OnlineUsers() {
  const presence = usePresence({
    client,
    room: 'app',
    user: currentUser,
  });

  return (
    <ul class="online-users">
      {presence.others().map(other => (
        <li key={other.user.id}>
          <img src={other.user.avatar} alt={other.user.name} />
          <span>{other.user.name}</span>
          <span class="status">
            {Date.now() - other.lastSeen < 5000 ? 'active' : 'idle'}
          </span>
        </li>
      ))}
    </ul>
  );
}
```

## Cursors

Share live cursor positions across users:

### `useCursors()`

```typescript
import { useCursors } from '@philjs/realtime';

const cursors = useCursors({
  client,
  room: 'document-123',
  user: currentUser,
  throttle: 50,  // Broadcast throttle in ms (default: 50)
});

// Get all cursors (signal)
cursors.cursors();  // Array of CursorState

// Broadcast my cursor position
document.addEventListener('mousemove', (e) => {
  cursors.broadcast(e.clientX, e.clientY);
});
```

### Cursor Types

```typescript
interface CursorPosition {
  x: number;
  y: number;
  timestamp: number;
}

interface CursorState extends CursorPosition {
  user: User;
}
```

### Example: Cursor Overlay

```typescript
function CursorOverlay() {
  const { cursors, broadcast } = useCursors({
    client,
    room: 'canvas',
    user: currentUser,
  });

  effect(() => {
    const handler = (e: MouseEvent) => broadcast(e.clientX, e.clientY);
    document.addEventListener('mousemove', handler);
    return () => document.removeEventListener('mousemove', handler);
  });

  return (
    <div class="cursor-overlay">
      {cursors().map(cursor => (
        <div
          key={cursor.user.id}
          class="cursor"
          style={{
            transform: `translate(${cursor.x}px, ${cursor.y}px)`,
            backgroundColor: cursor.user.color,
          }}
        >
          <span>{cursor.user.name}</span>
        </div>
      ))}
    </div>
  );
}
```

## Rooms

Manage user rooms for scoped collaboration:

### `useRoom()`

```typescript
import { useRoom } from '@philjs/realtime';

const room = useRoom({
  client,
  roomId: 'project-123',
  user: currentUser,
  password: 'optional-password',
});

// Room state (signals)
room.room();      // Room object or null
room.users();     // Array of User
room.isJoined();  // boolean
room.error();     // Error or null

// Actions
room.join();   // Join the room
room.leave();  // Leave the room
room.broadcast('event-type', payload);  // Broadcast to room
```

### Room Types

```typescript
interface Room {
  id: string;
  users: User[];
  metadata?: Record<string, any>;
  createdAt: Date;
}

interface RoomConfig {
  id: string;
  password?: string;
  maxUsers?: number;
  persist?: boolean;
}
```

### Example: Chat Room

```typescript
function ChatRoom({ roomId }) {
  const room = useRoom({
    client,
    roomId,
    user: currentUser,
  });

  const messages = signal<Message[]>([]);

  effect(() => {
    room.join();

    const unsub = client.on('chat:message', (message) => {
      messages.set([...messages(), message]);
    });

    return () => {
      unsub();
      room.leave();
    };
  });

  const sendMessage = (text: string) => {
    room.broadcast('chat:message', {
      text,
      from: currentUser,
      timestamp: Date.now(),
    });
  };

  return (
    <div class="chat-room">
      <div class="users">
        <h3>Users ({room.users().length})</h3>
        {room.users().map(user => (
          <span key={user.id}>{user.name}</span>
        ))}
      </div>

      <div class="messages">
        {messages().map(msg => (
          <div key={msg.timestamp}>
            <strong>{msg.from.name}:</strong> {msg.text}
          </div>
        ))}
      </div>

      <MessageInput onSend={sendMessage} />
    </div>
  );
}
```

## Broadcast Channel

Simple pub/sub for room-scoped messages:

### `useBroadcast()`

```typescript
import { useBroadcast } from '@philjs/realtime';

interface Notification {
  type: 'info' | 'warning' | 'error';
  message: string;
}

const notifications = useBroadcast<Notification>({
  client,
  room: 'app',
  channel: 'notifications',
});

// Broadcast a message
notifications.broadcast({
  type: 'info',
  message: 'User joined the document',
});

// Read messages (signals)
notifications.lastMessage();  // Most recent message
notifications.history();      // All messages

// Clear history
notifications.clear();
```

### Example: Typing Indicator

```typescript
function TypingIndicator() {
  const typing = useBroadcast<{ userId: string; isTyping: boolean }>({
    client,
    room: 'chat-123',
    channel: 'typing',
  });

  const typingUsers = memo(() => {
    const recent = typing.history().filter(
      msg => msg.isTyping && Date.now() - msg.timestamp < 3000
    );
    return [...new Set(recent.map(m => m.userId))];
  });

  // Notify when I'm typing
  const setTyping = (isTyping: boolean) => {
    typing.broadcast({ userId: currentUser.id, isTyping });
  };

  return (
    <div class="typing-indicator">
      {typingUsers().length > 0 && (
        <span>
          {typingUsers().length === 1
            ? 'Someone is typing...'
            : `${typingUsers().length} people are typing...`}
        </span>
      )}
    </div>
  );
}
```

## Shared State

Synchronized state across all users in a room:

### `useSharedState()`

```typescript
import { useSharedState } from '@philjs/realtime';

interface DocumentState {
  title: string;
  content: string;
  lastEditor: string;
}

const shared = useSharedState<DocumentState>({
  client,
  room: 'document-123',
  initialState: {
    title: 'Untitled',
    content: '',
    lastEditor: '',
  },
});

// Read state (signals)
shared.state();           // Full state object
shared.get('title');      // Get specific key
shared.version();         // State version number

// Update state
shared.set('title', 'My Document');           // Set single key
shared.merge({ title: 'New Title', lastEditor: currentUser.id }); // Merge partial
```

### Example: Collaborative Document

```typescript
function CollaborativeDoc() {
  const doc = useSharedState<DocumentState>({
    client,
    room: 'doc-123',
    initialState: { title: '', content: '', lastEditor: '' },
  });

  return (
    <div class="document">
      <input
        type="text"
        value={doc.get('title')}
        onInput={(e) => doc.set('title', e.target.value)}
        placeholder="Document title"
      />

      <textarea
        value={doc.get('content')}
        onInput={(e) => {
          doc.merge({
            content: e.target.value,
            lastEditor: currentUser.name,
          });
        }}
        placeholder="Start typing..."
      />

      <p class="status">
        Last edited by: {doc.get('lastEditor') || 'No one yet'}
        <span class="version">v{doc.version()}</span>
      </p>
    </div>
  );
}
```

## Server-Side Room Manager

For Node.js WebSocket servers:

```typescript
import { RoomManager } from '@philjs/realtime';

const rooms = new RoomManager();

// Handle WebSocket connections
wss.on('connection', (ws, req) => {
  const userId = getUserId(req);

  ws.on('message', (data) => {
    const message = JSON.parse(data);

    switch (message.type) {
      case 'room:join':
        rooms.join(message.payload.roomId, userId);
        broadcastToRoom(message.payload.roomId, {
          type: 'room:user:joined',
          payload: { userId },
        });
        break;

      case 'room:leave':
        rooms.leave(message.payload.roomId, userId);
        broadcastToRoom(message.payload.roomId, {
          type: 'room:user:left',
          payload: userId,
        });
        break;

      default:
        // Broadcast to room if specified
        if (message.room) {
          broadcastToRoom(message.room, message);
        }
    }
  });

  ws.on('close', () => {
    const leftRooms = rooms.leaveAll(userId);
    leftRooms.forEach(roomId => {
      broadcastToRoom(roomId, {
        type: 'room:user:left',
        payload: userId,
      });
    });
  });
});

function broadcastToRoom(roomId: string, message: any) {
  const users = rooms.getUsers(roomId);
  users.forEach(userId => {
    const socket = getSocketByUserId(userId);
    socket?.send(JSON.stringify(message));
  });
}
```

### RoomManager API

```typescript
const rooms = new RoomManager();

// Join/leave
rooms.join(roomId, userId);
rooms.leave(roomId, userId);
rooms.leaveAll(userId);         // Returns rooms left

// Queries
rooms.getUsers(roomId);         // Users in room
rooms.getRooms(userId);         // User's rooms
rooms.isInRoom(roomId, userId); // Check membership
rooms.getRoomCount();           // Total rooms
rooms.getUserCount(roomId);     // Users in specific room
```

## Full Example: Multiplayer Whiteboard

```typescript
import {
  WebSocketClient,
  usePresence,
  useCursors,
  useRoom,
  useBroadcast,
  useSharedState,
} from '@philjs/realtime';

interface WhiteboardState {
  background: string;
  strokes: Stroke[];
}

interface Stroke {
  id: string;
  userId: string;
  color: string;
  points: Point[];
}

function Whiteboard({ roomId }) {
  const client = new WebSocketClient({
    url: 'wss://api.example.com/ws',
  });

  const user = { id: crypto.randomUUID(), name: 'User', color: randomColor() };

  // Connect on mount
  effect(() => {
    client.connect();
    return () => client.disconnect();
  });

  // Presence for user list
  const presence = usePresence({
    client,
    room: roomId,
    user,
    initialData: { tool: 'pen' },
  });

  // Cursors for live positions
  const { cursors, broadcast: broadcastCursor } = useCursors({
    client,
    room: roomId,
    user,
  });

  // Room management
  const room = useRoom({
    client,
    roomId,
    user,
  });

  // Shared whiteboard state
  const whiteboard = useSharedState<WhiteboardState>({
    client,
    room: roomId,
    initialState: { background: '#ffffff', strokes: [] },
  });

  // Drawing broadcast
  const drawing = useBroadcast<{ strokeId: string; point: Point }>({
    client,
    room: roomId,
    channel: 'drawing',
  });

  // Handle mouse movement
  const handleMouseMove = (e: MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    broadcastCursor(e.clientX - rect.left, e.clientY - rect.top);
  };

  // Join room on mount
  effect(() => {
    room.join();
    return () => room.leave();
  });

  return (
    <div class="whiteboard-container">
      {/* User list */}
      <aside class="users-panel">
        <h3>Online ({presence.count()})</h3>
        {presence.others().map(other => (
          <div key={other.user.id} class="user">
            <span style={{ color: other.user.color }}>{other.user.name}</span>
            <small>Tool: {other.data.tool}</small>
          </div>
        ))}
      </aside>

      {/* Canvas */}
      <canvas
        class="whiteboard-canvas"
        onMouseMove={handleMouseMove}
        style={{ background: whiteboard.get('background') }}
      />

      {/* Cursor overlays */}
      <div class="cursor-layer">
        {cursors().map(cursor => (
          <div
            key={cursor.user.id}
            class="remote-cursor"
            style={{
              left: cursor.x,
              top: cursor.y,
              backgroundColor: cursor.user.color,
            }}
          >
            {cursor.user.name}
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <footer class="toolbar">
        <button onClick={() => presence.updatePresence({ tool: 'pen' })}>Pen</button>
        <button onClick={() => presence.updatePresence({ tool: 'eraser' })}>Eraser</button>
        <input
          type="color"
          value={whiteboard.get('background')}
          onChange={(e) => whiteboard.set('background', e.target.value)}
        />
      </footer>
    </div>
  );
}
```

## Best Practices

1. **Use throttling** for high-frequency updates (cursors, drawing)
2. **Clean up on disconnect** - leave rooms and unsubscribe
3. **Handle reconnection** - sync state after reconnecting
4. **Validate messages** - don't trust client data on the server
5. **Use rooms** to scope messages and reduce broadcast scope
6. **Implement auth** at the WebSocket connection level

## API Reference

### Classes

| Class | Description |
|-------|-------------|
| `WebSocketClient` | WebSocket client with auto-reconnect |
| `RoomManager` | Server-side room management |

### Hooks

| Hook | Description |
|------|-------------|
| `usePresence(options)` | Track who's online |
| `useCursors(options)` | Share cursor positions |
| `useRoom(options)` | Join/leave rooms |
| `useBroadcast(options)` | Pub/sub messaging |
| `useSharedState(options)` | Synchronized state |

### Types

| Type | Description |
|------|-------------|
| `ConnectionStatus` | `'connecting' \| 'connected' \| 'disconnected' \| 'reconnecting'` |
| `User` | User identity with optional metadata |
| `PresenceState<T>` | User presence with custom data |
| `CursorState` | Cursor position with user |
| `Room` | Room with users and metadata |
| `RealtimeMessage` | WebSocket message format |

## Next Steps

- [WebSockets and Realtime](../../integrations/websockets.md) - Integration guide
- [@philjs/graphql](../graphql/overview.md) - GraphQL subscriptions
- [Nexus Architecture](../../nexus/overview.md) - Local-first patterns
