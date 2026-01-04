# WebSocket Connections

The `@philjs/realtime` package provides a robust WebSocket client with automatic reconnection, heartbeat monitoring, and reactive connection status.

## WebSocketClient

The `WebSocketClient` class is the foundation for all real-time communication in PhilJS.

### Basic Usage

```typescript
import { WebSocketClient } from '@philjs/realtime';

const client = new WebSocketClient({
  url: 'wss://api.example.com/ws',
});

// Connect to the server
client.connect();

// Listen for connection status changes
effect(() => {
  console.log('Status:', client.status());
});

// Send messages
client.send('chat:message', { text: 'Hello!' });

// Disconnect when done
client.disconnect();
```

### Configuration Options

The `WebSocketClient` accepts a comprehensive set of options:

```typescript
interface WebSocketClientOptions {
  // Required: WebSocket server URL
  url: string;

  // Optional: Sub-protocols to request
  protocols?: string[];

  // Auto-reconnect on disconnect (default: true)
  reconnect?: boolean;

  // Initial reconnect delay in ms (default: 1000)
  reconnectDelay?: number;

  // Maximum reconnect delay with exponential backoff (default: 30000)
  maxReconnectDelay?: number;

  // Maximum reconnect attempts (default: Infinity)
  reconnectAttempts?: number;

  // Heartbeat ping interval in ms (default: 30000)
  heartbeatInterval?: number;

  // Event callbacks
  onOpen?: () => void;
  onClose?: (event: CloseEvent) => void;
  onError?: (error: Event) => void;
  onMessage?: (message: RealtimeMessage) => void;
}
```

### Full Configuration Example

```typescript
const client = new WebSocketClient({
  url: 'wss://api.example.com/ws',
  protocols: ['v1.realtime'],

  // Reconnection settings
  reconnect: true,
  reconnectDelay: 1000,
  maxReconnectDelay: 30000,
  reconnectAttempts: 10,

  // Heartbeat to keep connection alive
  heartbeatInterval: 30000,

  // Lifecycle callbacks
  onOpen: () => {
    console.log('Connected!');
    // Re-subscribe to channels, sync state, etc.
  },

  onClose: (event) => {
    console.log('Disconnected:', event.code, event.reason);
  },

  onError: (error) => {
    console.error('WebSocket error:', error);
  },

  onMessage: (message) => {
    console.log('Received:', message.type, message.payload);
  },
});
```

## Connection Lifecycle

### Connection Status

The client exposes a reactive `status` signal that tracks connection state:

```typescript
type ConnectionStatus =
  | 'connecting'    // Initial connection in progress
  | 'connected'     // Successfully connected
  | 'disconnected'  // Not connected
  | 'reconnecting'; // Attempting to reconnect

// React to status changes
effect(() => {
  const status = client.status();

  switch (status) {
    case 'connecting':
      showSpinner();
      break;
    case 'connected':
      hideSpinner();
      syncState();
      break;
    case 'disconnected':
      showOfflineBanner();
      break;
    case 'reconnecting':
      showReconnectingMessage();
      break;
  }
});
```

### Connection Status Component

```typescript
import { effect, signal } from '@philjs/core';
import { WebSocketClient } from '@philjs/realtime';

function ConnectionStatus({ client }: { client: WebSocketClient }) {
  return (
    <div class="connection-status">
      {() => {
        const status = client.status();

        if (status === 'connected') {
          return <span class="online">Connected</span>;
        }

        if (status === 'reconnecting') {
          return (
            <span class="reconnecting">
              Reconnecting...
            </span>
          );
        }

        return <span class="offline">Offline</span>;
      }}
    </div>
  );
}
```

### Connect and Disconnect

```typescript
// Establish connection
client.connect();

// Check if already connected (won't reconnect if OPEN)
if (client.status() !== 'connected') {
  client.connect();
}

// Gracefully disconnect (stops auto-reconnect)
client.disconnect();
```

## Sending Messages

### Message Format

All messages follow the `RealtimeMessage` structure:

```typescript
interface RealtimeMessage {
  type: string;        // Message type identifier
  payload: any;        // Message data
  room?: string;       // Optional room scope
  from?: string;       // Sender ID (usually server-set)
  timestamp?: number;  // Auto-set when sending
}
```

### Basic Send

```typescript
// Send a message with type and payload
client.send('chat:message', {
  text: 'Hello, world!',
  userId: 'user-123',
});

// Send to a specific room
client.send('chat:message', { text: 'Hello room!' }, 'room-abc');

// Send different message types
client.send('user:typing', { isTyping: true }, 'room-abc');
client.send('game:move', { x: 5, y: 3 }, 'game-456');
client.send('document:edit', { operation: 'insert', pos: 10, text: 'new' });
```

### Handling Disconnection

The `send` method warns if the connection is not open:

```typescript
// Safe send pattern
function safeSend(type: string, payload: any, room?: string) {
  if (client.status() !== 'connected') {
    console.warn('Cannot send - not connected');
    // Queue message for later, or notify user
    return false;
  }

  client.send(type, payload, room);
  return true;
}
```

## Receiving Messages

### Message Handlers

Register handlers for specific message types:

```typescript
// Listen to a specific message type
const unsubscribe = client.on('chat:message', (payload) => {
  console.log('New message:', payload.text);
  addMessageToList(payload);
});

// Listen to multiple types
client.on('user:joined', (user) => {
  showNotification(`${user.name} joined`);
});

client.on('user:left', (userId) => {
  removeUserFromList(userId);
});

// Clean up when done
unsubscribe();
```

### Last Message Signal

The `lastMessage` signal provides reactive access to the most recent message:

```typescript
// React to any message
effect(() => {
  const message = client.lastMessage();
  if (message) {
    console.log('Latest:', message.type, message.payload);
  }
});

// In a component
function DebugPanel({ client }) {
  return (
    <pre>
      {() => JSON.stringify(client.lastMessage(), null, 2)}
    </pre>
  );
}
```

### Global Message Handler

Use the `onMessage` callback for global message processing:

```typescript
const client = new WebSocketClient({
  url: 'wss://api.example.com/ws',
  onMessage: (message) => {
    // Log all messages
    logger.debug('WS message', message);

    // Handle system messages
    if (message.type.startsWith('system:')) {
      handleSystemMessage(message);
    }

    // Update metrics
    metrics.increment('ws.messages.received');
  },
});
```

## Auto-Reconnect

### Exponential Backoff

The client implements exponential backoff for reconnection:

```typescript
const client = new WebSocketClient({
  url: 'wss://api.example.com/ws',
  reconnect: true,
  reconnectDelay: 1000,      // Start with 1 second
  maxReconnectDelay: 30000,  // Cap at 30 seconds
  reconnectAttempts: 10,     // Give up after 10 attempts
});

// Reconnect delays: 1s, 2s, 4s, 8s, 16s, 30s, 30s, 30s, 30s, 30s
```

### Tracking Reconnection

```typescript
let reconnectCount = 0;

effect(() => {
  const status = client.status();

  if (status === 'reconnecting') {
    reconnectCount++;
    console.log(`Reconnect attempt ${reconnectCount}`);
  }

  if (status === 'connected') {
    if (reconnectCount > 0) {
      console.log('Reconnected successfully!');
      // Resync state after reconnect
      syncState();
    }
    reconnectCount = 0;
  }
});
```

### Manual Reconnection Control

```typescript
// Disable auto-reconnect for manual control
const client = new WebSocketClient({
  url: 'wss://api.example.com/ws',
  reconnect: false,
});

// Handle reconnection manually
client.onClose = (event) => {
  if (event.code !== 1000) { // Not a clean close
    setTimeout(() => {
      if (navigator.onLine) {
        client.connect();
      }
    }, 5000);
  }
};

// Reconnect on network recovery
window.addEventListener('online', () => {
  if (client.status() === 'disconnected') {
    client.connect();
  }
});
```

## Heartbeat

The client sends periodic heartbeat pings to keep the connection alive:

```typescript
const client = new WebSocketClient({
  url: 'wss://api.example.com/ws',
  heartbeatInterval: 30000, // Ping every 30 seconds
});

// The client automatically sends: { type: 'ping', payload: {} }
// Your server should respond with a 'pong' or similar
```

### Server-Side Heartbeat Handling

```typescript
// Node.js WebSocket server example
wss.on('connection', (ws) => {
  ws.isAlive = true;

  ws.on('message', (data) => {
    const message = JSON.parse(data);

    if (message.type === 'ping') {
      ws.isAlive = true;
      ws.send(JSON.stringify({ type: 'pong' }));
    }
  });
});

// Check for dead connections
const interval = setInterval(() => {
  wss.clients.forEach((ws) => {
    if (!ws.isAlive) {
      return ws.terminate();
    }
    ws.isAlive = false;
  });
}, 35000);
```

## Complete Example: Real-Time Chat

```typescript
import { signal, effect, batch } from '@philjs/core';
import { WebSocketClient } from '@philjs/realtime';

interface ChatMessage {
  id: string;
  userId: string;
  userName: string;
  text: string;
  timestamp: number;
}

function createChatClient(roomId: string, currentUser: User) {
  const client = new WebSocketClient({
    url: `wss://api.example.com/ws`,
    reconnect: true,
    onOpen: () => {
      // Join room on connect
      client.send('room:join', { roomId, user: currentUser });
    },
  });

  const messages = signal<ChatMessage[]>([]);
  const typingUsers = signal<Set<string>>(new Set());
  const isConnected = () => client.status() === 'connected';

  // Handle incoming messages
  client.on('chat:message', (message: ChatMessage) => {
    messages.set([...messages(), message]);
  });

  // Handle typing indicators
  client.on('user:typing', ({ userId, isTyping }) => {
    const current = new Set(typingUsers());
    if (isTyping) {
      current.add(userId);
    } else {
      current.delete(userId);
    }
    typingUsers.set(current);
  });

  // Handle message history on join
  client.on('room:history', (history: ChatMessage[]) => {
    messages.set(history);
  });

  // Connect
  client.connect();

  return {
    messages: () => messages(),
    typingUsers: () => Array.from(typingUsers()),
    isConnected,

    sendMessage: (text: string) => {
      const message: ChatMessage = {
        id: crypto.randomUUID(),
        userId: currentUser.id,
        userName: currentUser.name,
        text,
        timestamp: Date.now(),
      };

      client.send('chat:message', message, roomId);

      // Optimistic update
      messages.set([...messages(), message]);
    },

    setTyping: (isTyping: boolean) => {
      client.send('user:typing', {
        userId: currentUser.id,
        isTyping,
      }, roomId);
    },

    disconnect: () => {
      client.send('room:leave', { roomId, userId: currentUser.id });
      client.disconnect();
    },
  };
}
```

## Best Practices

### 1. Handle All Connection States

```typescript
function RealtimeProvider({ children, client }) {
  return (
    <>
      {children}

      {() => {
        const status = client.status();

        if (status === 'disconnected') {
          return <OfflineBanner />;
        }

        if (status === 'reconnecting') {
          return <ReconnectingToast />;
        }

        return null;
      }}
    </>
  );
}
```

### 2. Clean Up Subscriptions

```typescript
function useChat(roomId: string) {
  const client = useMemo(() => new WebSocketClient({ url }), []);

  effect(() => {
    client.connect();

    const unsub1 = client.on('chat:message', handleMessage);
    const unsub2 = client.on('user:typing', handleTyping);

    return () => {
      unsub1();
      unsub2();
      client.disconnect();
    };
  });

  return { client };
}
```

### 3. Validate Messages

```typescript
client.on('chat:message', (payload) => {
  // Validate before processing
  if (!payload.text || typeof payload.text !== 'string') {
    console.warn('Invalid message payload');
    return;
  }

  // Sanitize user content
  const sanitizedText = sanitizeHtml(payload.text);
  handleMessage({ ...payload, text: sanitizedText });
});
```

### 4. Rate Limit Outgoing Messages

```typescript
import { throttle } from '@philjs/core';

const sendTypingThrottled = throttle((client, roomId, isTyping) => {
  client.send('user:typing', { isTyping }, roomId);
}, 1000);

// Use throttled version
inputElement.addEventListener('input', () => {
  sendTypingThrottled(client, roomId, true);
});
```

## Next Steps

- [Channels](./channels.md) - Broadcast channels and room messaging
- [Presence](./presence.md) - Track online users
- [Data Sync](./data-sync.md) - Synchronize shared state
