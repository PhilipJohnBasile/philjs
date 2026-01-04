# Channels and Rooms

The `@philjs/realtime` package provides powerful abstractions for organizing real-time communication: **Rooms** for user grouping and **Broadcast Channels** for pub/sub messaging.

## Rooms

Rooms allow you to scope real-time communication to specific groups of users. Users can join and leave rooms, and all messages can be targeted to specific rooms.

### useRoom Hook

The `useRoom` hook provides a complete room management API:

```typescript
import { useRoom } from '@philjs/realtime';

const room = useRoom({
  client,                      // WebSocketClient instance
  roomId: 'project-123',       // Unique room identifier
  user: currentUser,           // User object with id and optional metadata
  password: 'optional-secret', // Optional room password
});

// Room state (all are signals)
room.room();      // Room object or null
room.users();     // Array of users in the room
room.isJoined();  // Whether currently joined
room.error();     // Any error that occurred

// Actions
await room.join();              // Join the room
room.leave();                   // Leave the room
room.broadcast(type, payload);  // Send message to room
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
  persist?: boolean;  // Keep room alive when empty
}

interface User {
  id: string;
  name?: string;
  avatar?: string;
  color?: string;
  [key: string]: any;  // Additional custom properties
}
```

### Complete Room Example

```typescript
import { signal, effect, memo } from '@philjs/core';
import { WebSocketClient, useRoom } from '@philjs/realtime';

function ProjectRoom({ projectId }) {
  const client = new WebSocketClient({
    url: 'wss://api.example.com/ws',
  });

  const currentUser = {
    id: 'user-123',
    name: 'Alice',
    avatar: '/avatars/alice.png',
    role: 'editor',
  };

  const room = useRoom({
    client,
    roomId: projectId,
    user: currentUser,
  });

  // Auto-join on mount
  effect(() => {
    client.connect();
    room.join();

    return () => {
      room.leave();
      client.disconnect();
    };
  });

  // Derived state
  const userCount = memo(() => room.users().length);
  const editors = memo(() =>
    room.users().filter(u => u.role === 'editor')
  );

  return (
    <div class="project-room">
      <header>
        <h1>Project: {projectId}</h1>

        {() => room.error() && (
          <div class="error">{room.error()?.message}</div>
        )}

        <div class="status">
          {() => room.isJoined() ? (
            <span class="badge success">Connected</span>
          ) : (
            <span class="badge warning">Connecting...</span>
          )}
        </div>
      </header>

      <aside class="user-list">
        <h3>Online ({userCount()})</h3>
        <ul>
          {() => room.users().map(user => (
            <li key={user.id}>
              <img src={user.avatar} alt={user.name} />
              <span>{user.name}</span>
              <span class="role">{user.role}</span>
            </li>
          ))}
        </ul>
      </aside>

      <main>
        <ProjectContent
          projectId={projectId}
          onAction={(action) => {
            room.broadcast('project:action', action);
          }}
        />
      </main>
    </div>
  );
}
```

### Room Events

The room system uses specific message types for coordination:

```typescript
// Join/leave events handled automatically
client.on('room:joined', (data: Room) => {
  // Room data received after successful join
});

client.on('room:user:joined', (user: User) => {
  // Another user joined the room
});

client.on('room:user:left', (userId: string) => {
  // A user left the room
});

client.on('room:error', (error: { message: string }) => {
  // Room-related error (auth failed, room full, etc.)
});
```

### Protected Rooms

```typescript
// Password-protected room
const room = useRoom({
  client,
  roomId: 'private-meeting',
  user: currentUser,
  password: 'secret123',
});

// Server validates password on join
room.join().catch((err) => {
  if (err.message.includes('invalid password')) {
    showPasswordPrompt();
  }
});
```

## Broadcast Channels

Broadcast channels provide a simple pub/sub pattern for room-scoped messages. They're perfect for notifications, events, and loosely-coupled communication.

### useBroadcast Hook

```typescript
import { useBroadcast } from '@philjs/realtime';

interface Notification {
  type: 'info' | 'warning' | 'error';
  title: string;
  message: string;
}

const notifications = useBroadcast<Notification>({
  client,
  room: 'app-global',
  channel: 'notifications',
});

// Send a broadcast
notifications.broadcast({
  type: 'info',
  title: 'New feature',
  message: 'Dark mode is now available!',
});

// Read received broadcasts (signals)
notifications.lastMessage();  // Most recent message
notifications.history();      // All messages received

// Clear message history
notifications.clear();
```

### Multiple Channels

Use multiple channels to organize different types of messages:

```typescript
function DocumentEditor({ docId }) {
  // Different channels for different purposes
  const cursors = useBroadcast<CursorPosition>({
    client,
    room: docId,
    channel: 'cursors',
  });

  const comments = useBroadcast<Comment>({
    client,
    room: docId,
    channel: 'comments',
  });

  const selections = useBroadcast<Selection>({
    client,
    room: docId,
    channel: 'selections',
  });

  const saves = useBroadcast<SaveEvent>({
    client,
    room: docId,
    channel: 'saves',
  });

  return (
    <Editor
      onCursorMove={(pos) => cursors.broadcast(pos)}
      onComment={(comment) => comments.broadcast(comment)}
      onSelect={(selection) => selections.broadcast(selection)}
      onSave={() => saves.broadcast({ savedAt: Date.now() })}
    />
  );
}
```

### Typing Indicator Example

A common use case for broadcast channels:

```typescript
import { signal, memo, effect } from '@philjs/core';
import { useBroadcast } from '@philjs/realtime';

interface TypingEvent {
  userId: string;
  userName: string;
  isTyping: boolean;
  timestamp: number;
}

function TypingIndicator({ client, roomId, currentUser }) {
  const typing = useBroadcast<TypingEvent>({
    client,
    room: roomId,
    channel: 'typing',
  });

  // Track who is currently typing
  const currentlyTyping = memo(() => {
    const now = Date.now();
    const recentTyping = typing.history().filter(event => {
      // Only consider events from the last 3 seconds
      return event.isTyping && now - event.timestamp < 3000;
    });

    // Get unique users (latest event per user)
    const userMap = new Map<string, TypingEvent>();
    recentTyping.forEach(event => {
      if (event.userId !== currentUser.id) {
        userMap.set(event.userId, event);
      }
    });

    return Array.from(userMap.values());
  });

  // Notify when I start/stop typing
  let typingTimeout: number | undefined;

  const setTyping = (isTyping: boolean) => {
    if (typingTimeout) clearTimeout(typingTimeout);

    typing.broadcast({
      userId: currentUser.id,
      userName: currentUser.name,
      isTyping,
      timestamp: Date.now(),
    });

    if (isTyping) {
      // Auto-stop typing after 2 seconds of inactivity
      typingTimeout = setTimeout(() => setTyping(false), 2000);
    }
  };

  return {
    currentlyTyping,
    setTyping,
  };
}

// Usage
function ChatInput({ roomId }) {
  const { currentlyTyping, setTyping } = TypingIndicator({
    client,
    roomId,
    currentUser,
  });

  return (
    <div class="chat-input-container">
      <div class="typing-indicator">
        {() => {
          const typing = currentlyTyping();
          if (typing.length === 0) return null;

          if (typing.length === 1) {
            return <span>{typing[0].userName} is typing...</span>;
          }

          if (typing.length === 2) {
            return (
              <span>
                {typing[0].userName} and {typing[1].userName} are typing...
              </span>
            );
          }

          return <span>{typing.length} people are typing...</span>;
        }}
      </div>

      <textarea
        onInput={() => setTyping(true)}
        onBlur={() => setTyping(false)}
        placeholder="Type a message..."
      />
    </div>
  );
}
```

## Server-Side Room Manager

For Node.js WebSocket servers, the `RoomManager` class helps manage room membership:

```typescript
import { RoomManager } from '@philjs/realtime';

const rooms = new RoomManager();

// Room manager API
rooms.join(roomId, userId);           // Add user to room
rooms.leave(roomId, userId);          // Remove user from room
rooms.leaveAll(userId);               // Remove user from all rooms (returns room IDs)

rooms.getUsers(roomId);               // Get all users in a room
rooms.getRooms(userId);               // Get all rooms a user is in
rooms.isInRoom(roomId, userId);       // Check if user is in room

rooms.getRoomCount();                 // Total number of rooms
rooms.getUserCount(roomId);           // Number of users in a room
```

### Complete Server Example

```typescript
import { WebSocketServer } from 'ws';
import { RoomManager } from '@philjs/realtime';

const wss = new WebSocketServer({ port: 8080 });
const rooms = new RoomManager();
const clients = new Map<string, WebSocket>();

wss.on('connection', (ws, req) => {
  const userId = authenticateUser(req);
  clients.set(userId, ws);

  ws.on('message', (data) => {
    const message = JSON.parse(data.toString());

    switch (message.type) {
      case 'room:join': {
        const { roomId, user } = message.payload;

        // Validate room access
        if (!canJoinRoom(userId, roomId)) {
          ws.send(JSON.stringify({
            type: 'room:error',
            payload: { message: 'Access denied' },
          }));
          return;
        }

        // Join the room
        rooms.join(roomId, userId);

        // Send room info to the joining user
        const roomUsers = rooms.getUsers(roomId).map(id => getUser(id));
        ws.send(JSON.stringify({
          type: 'room:joined',
          payload: {
            id: roomId,
            users: roomUsers,
            createdAt: new Date(),
          },
        }));

        // Notify other room members
        broadcastToRoom(roomId, {
          type: 'room:user:joined',
          payload: user,
        }, userId); // Exclude the joining user

        break;
      }

      case 'room:leave': {
        const { roomId } = message.payload;
        rooms.leave(roomId, userId);

        // Notify remaining members
        broadcastToRoom(roomId, {
          type: 'room:user:left',
          payload: userId,
        });

        break;
      }

      default: {
        // Route message to room if specified
        if (message.room) {
          broadcastToRoom(message.room, {
            ...message,
            from: userId,
          });
        }
      }
    }
  });

  ws.on('close', () => {
    // Clean up: leave all rooms
    const leftRooms = rooms.leaveAll(userId);
    clients.delete(userId);

    // Notify each room
    leftRooms.forEach(roomId => {
      broadcastToRoom(roomId, {
        type: 'room:user:left',
        payload: userId,
      });
    });
  });
});

function broadcastToRoom(roomId: string, message: any, excludeUserId?: string) {
  const users = rooms.getUsers(roomId);

  users.forEach(userId => {
    if (userId !== excludeUserId) {
      const ws = clients.get(userId);
      if (ws?.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(message));
      }
    }
  });
}
```

### Room Limits and Validation

```typescript
const MAX_USERS_PER_ROOM = 50;
const MAX_ROOMS_PER_USER = 10;

function canJoinRoom(userId: string, roomId: string): boolean {
  // Check user's room limit
  const userRooms = rooms.getRooms(userId);
  if (userRooms.length >= MAX_ROOMS_PER_USER) {
    return false;
  }

  // Check room capacity
  const roomUsers = rooms.getUserCount(roomId);
  if (roomUsers >= MAX_USERS_PER_ROOM) {
    return false;
  }

  // Check permissions
  return hasPermission(userId, roomId);
}
```

## Patterns and Best Practices

### 1. Room-Based Chat Application

```typescript
interface ChatRoom {
  messages: ChatMessage[];
  participants: User[];
  sendMessage: (text: string) => void;
  leave: () => void;
}

function useChatRoom(roomId: string, currentUser: User): ChatRoom {
  const client = useWebSocketClient();

  const room = useRoom({
    client,
    roomId,
    user: currentUser,
  });

  const messages = useBroadcast<ChatMessage>({
    client,
    room: roomId,
    channel: 'messages',
  });

  effect(() => {
    room.join();
    return () => room.leave();
  });

  return {
    messages: () => messages.history(),
    participants: () => room.users(),

    sendMessage: (text: string) => {
      messages.broadcast({
        id: crypto.randomUUID(),
        userId: currentUser.id,
        userName: currentUser.name,
        text,
        timestamp: Date.now(),
      });
    },

    leave: () => room.leave(),
  };
}
```

### 2. Channel Namespacing

Organize channels with consistent naming conventions:

```typescript
// Pattern: {domain}:{action}
const channels = {
  // Chat channels
  'chat:message': useBroadcast({ channel: 'chat:message' }),
  'chat:reaction': useBroadcast({ channel: 'chat:reaction' }),

  // Presence channels
  'presence:online': useBroadcast({ channel: 'presence:online' }),
  'presence:typing': useBroadcast({ channel: 'presence:typing' }),

  // Document channels
  'doc:edit': useBroadcast({ channel: 'doc:edit' }),
  'doc:cursor': useBroadcast({ channel: 'doc:cursor' }),
  'doc:selection': useBroadcast({ channel: 'doc:selection' }),

  // System channels
  'system:notification': useBroadcast({ channel: 'system:notification' }),
  'system:error': useBroadcast({ channel: 'system:error' }),
};
```

### 3. Message Acknowledgment

```typescript
interface AckMessage<T> {
  id: string;
  data: T;
  requiresAck: boolean;
}

function useBroadcastWithAck<T>(options: UseBroadcastOptions<T>) {
  const broadcast = useBroadcast<AckMessage<T>>(options);
  const pending = signal<Map<string, { data: T; timeout: number }>>(new Map());

  const send = (data: T, requiresAck = false) => {
    const id = crypto.randomUUID();

    broadcast.broadcast({ id, data, requiresAck });

    if (requiresAck) {
      const map = new Map(pending());
      map.set(id, {
        data,
        timeout: setTimeout(() => {
          // Message not acknowledged - retry or notify
          console.warn('Message not acknowledged:', id);
          map.delete(id);
          pending.set(new Map(map));
        }, 5000),
      });
      pending.set(map);
    }
  };

  // Listen for acknowledgments
  client.on(`${options.channel}:ack`, (ackId: string) => {
    const map = new Map(pending());
    const item = map.get(ackId);
    if (item) {
      clearTimeout(item.timeout);
      map.delete(ackId);
      pending.set(map);
    }
  });

  return { send, lastMessage: broadcast.lastMessage };
}
```

### 4. Error Handling

```typescript
function RoomWithErrorHandling({ roomId, currentUser }) {
  const room = useRoom({
    client,
    roomId,
    user: currentUser,
  });

  effect(() => {
    const error = room.error();
    if (!error) return;

    switch (error.message) {
      case 'Room not found':
        showError('This room no longer exists');
        navigate('/rooms');
        break;

      case 'Room is full':
        showError('This room is at capacity. Try again later.');
        break;

      case 'Access denied':
        showError('You do not have permission to join this room');
        navigate('/rooms');
        break;

      default:
        showError('Failed to join room: ' + error.message);
    }
  });

  return (/* ... */);
}
```

## Next Steps

- [Presence](./presence.md) - Track who's online
- [Data Sync](./data-sync.md) - Synchronize shared state
- [WebSockets](./websockets.md) - Low-level WebSocket client
