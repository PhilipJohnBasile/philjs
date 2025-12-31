# WebSockets

Real-time bidirectional communication in PhilJS applications.

## What You'll Learn

- WebSocket basics
- Connection management
- Real-time updates
- Reconnection strategies
- Message handling
- Server-sent events (SSE)
- Best practices

## WebSocket Basics

### Basic WebSocket Connection

```typescript
import { signal, effect } from '@philjs/core';

export function useWebSocket(url: string) {
  const socket = signal<WebSocket | null>(null);
  const isConnected = signal(false);
  const messages = signal<any[]>([]);

  effect(() => {
    const ws = new WebSocket(url);

    ws.onopen = () => {
      console.log('WebSocket connected');
      isConnected.set(true);
    };

    ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      messages.set([...messages(), message]);
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    ws.onclose = () => {
      console.log('WebSocket disconnected');
      isConnected.set(false);
    };

    socket.set(ws);

    // Cleanup on unmount
    return () => {
      ws.close();
    };
  });

  const send = (data: any) => {
    const ws = socket();
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(data));
    } else {
      console.error('WebSocket not connected');
    }
  };

  return {
    isConnected,
    messages,
    send
  };
}

// Usage
function ChatRoom() {
  const ws = useWebSocket('wss://api.example.com/chat');
  const input = signal('');

  const sendMessage = () => {
    if (input().trim()) {
      ws.send({ type: 'message', text: input() });
      input.set('');
    }
  };

  return (
    <div>
      <div className="messages">
        {ws.messages().map((msg, i) => (
          <div key={i}>{msg.text}</div>
        ))}
      </div>

      <div>
        <input
          value={input()}
          onInput={(e) => input.set(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
        />
        <button onClick={sendMessage} disabled={!ws.isConnected()}>
          Send
        </button>
      </div>

      <div>
        Status: {ws.isConnected() ? '🟢 Connected' : '🔴 Disconnected'}
      </div>
    </div>
  );
}
```

## Auto-Reconnection

### Exponential Backoff

```typescript
export function useWebSocketWithReconnect(url: string) {
  const socket = signal<WebSocket | null>(null);
  const isConnected = signal(false);
  const messages = signal<any[]>([]);
  const reconnectAttempts = signal(0);

  const maxReconnectDelay = 30000; // 30 seconds
  const baseDelay = 1000; // 1 second

  const connect = () => {
    const ws = new WebSocket(url);

    ws.onopen = () => {
      console.log('WebSocket connected');
      isConnected.set(true);
      reconnectAttempts.set(0);
    };

    ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      messages.set([...messages(), message]);
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    ws.onclose = () => {
      console.log('WebSocket disconnected');
      isConnected.set(false);
      socket.set(null);

      // Auto-reconnect with exponential backoff
      const attempts = reconnectAttempts();
      const delay = Math.min(baseDelay * Math.pow(2, attempts), maxReconnectDelay);

      console.log(`Reconnecting in ${delay}ms...`);

      setTimeout(() => {
        reconnectAttempts.set(attempts + 1);
        connect();
      }, delay);
    };

    socket.set(ws);
  };

  effect(() => {
    connect();

    return () => {
      socket()?.close();
    };
  });

  const send = (data: any) => {
    const ws = socket();
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(data));
    } else {
      console.warn('WebSocket not connected, message queued');
    }
  };

  return {
    isConnected,
    messages,
    send,
    reconnectAttempts
  };
}
```

### Message Queue

```typescript
export function useWebSocketWithQueue(url: string) {
  const socket = signal<WebSocket | null>(null);
  const isConnected = signal(false);
  const messages = signal<any[]>([]);
  const messageQueue = signal<any[]>([]);

  effect(() => {
    const ws = new WebSocket(url);

    ws.onopen = () => {
      isConnected.set(true);

      // Send queued messages
      const queue = messageQueue();
      queue.forEach(msg => {
        ws.send(JSON.stringify(msg));
      });
      messageQueue.set([]);
    };

    ws.onmessage = (event) => {
      messages.set([...messages(), JSON.parse(event.data)]);
    };

    ws.onclose = () => {
      isConnected.set(false);
      // Auto-reconnect logic here
    };

    socket.set(ws);

    return () => ws.close();
  });

  const send = (data: any) => {
    const ws = socket();

    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(data));
    } else {
      // Queue message for later
      messageQueue.set([...messageQueue(), data]);
    }
  };

  return {
    isConnected,
    messages,
    send
  };
}
```

## Typed Messages

### Type-Safe Messages

```typescript
// Message types
type ClientMessage =
  | { type: 'join'; room: string }
  | { type: 'leave'; room: string }
  | { type: 'message'; room: string; text: string }
  | { type: 'typing'; room: string; isTyping: boolean };

type ServerMessage =
  | { type: 'joined'; room: string; users: string[] }
  | { type: 'left'; room: string; userId: string }
  | { type: 'message'; room: string; userId: string; text: string; timestamp: number }
  | { type: 'typing'; room: string; userId: string; isTyping: boolean }
  | { type: 'error'; message: string };

export function useTypedWebSocket(url: string) {
  const socket = signal<WebSocket | null>(null);
  const isConnected = signal(false);
  const messages = signal<ServerMessage[]>([]);

  effect(() => {
    const ws = new WebSocket(url);

    ws.onopen = () => {
      isConnected.set(true);
    };

    ws.onmessage = (event) => {
      const message: ServerMessage = JSON.parse(event.data);
      messages.set([...messages(), message]);
    };

    ws.onclose = () => {
      isConnected.set(false);
    };

    socket.set(ws);

    return () => ws.close();
  });

  const send = (message: ClientMessage) => {
    const ws = socket();
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
    }
  };

  return {
    isConnected,
    messages,
    send
  };
}

// Usage
function ChatApp() {
  const ws = useTypedWebSocket('wss://api.example.com/chat');

  const joinRoom = (room: string) => {
    ws.send({ type: 'join', room }); // Type-safe!
  };

  const sendMessage = (room: string, text: string) => {
    ws.send({ type: 'message', room, text });
  };

  return <div>{/* UI */}</div>;
}
```

## Message Handlers

### Subscribe to Message Types

```typescript
export function useWebSocketMessages(url: string) {
  const socket = signal<WebSocket | null>(null);
  const isConnected = signal(false);
  const handlers = new Map<string, (data: any) => void>();

  effect(() => {
    const ws = new WebSocket(url);

    ws.onopen = () => isConnected.set(true);

    ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      const handler = handlers.get(message.type);

      if (handler) {
        handler(message);
      } else {
        console.warn(`No handler for message type: ${message.type}`);
      }
    };

    ws.onclose = () => isConnected.set(false);

    socket.set(ws);

    return () => ws.close();
  });

  const on = (type: string, handler: (data: any) => void) => {
    handlers.set(type, handler);
  };

  const off = (type: string) => {
    handlers.delete(type);
  };

  const send = (message: any) => {
    socket()?.send(JSON.stringify(message));
  };

  return {
    isConnected,
    on,
    off,
    send
  };
}

// Usage
function Chat() {
  const ws = useWebSocketMessages('wss://api.example.com/chat');
  const messages = signal<Message[]>([]);
  const users = signal<User[]>([]);

  // Subscribe to specific message types
  ws.on('message', (msg) => {
    messages.set([...messages(), msg]);
  });

  ws.on('user:joined', (user) => {
    users.set([...users(), user]);
  });

  ws.on('user:left', (userId) => {
    users.set(users().filter(u => u.id !== userId));
  });

  return <div>{/* UI */}</div>;
}
```

## Server-Sent Events (SSE)

### SSE for Server-to-Client Updates

```typescript
export function useServerSentEvents(url: string) {
  const events = signal<any[]>([]);
  const isConnected = signal(false);
  const error = signal<Error | null>(null);

  effect(() => {
    const eventSource = new EventSource(url);

    eventSource.onopen = () => {
      isConnected.set(true);
      error.set(null);
    };

    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);
      events.set([...events(), data]);
    };

    eventSource.onerror = (err) => {
      isConnected.set(false);
      error.set(new Error('SSE connection error'));
      eventSource.close();
    };

    return () => {
      eventSource.close();
    };
  });

  return {
    events,
    isConnected,
    error
  };
}

// Usage - Live notifications
function NotificationFeed() {
  const sse = useServerSentEvents('/api/notifications/stream');

  return (
    <div>
      <h2>Notifications</h2>

      {sse.isConnected() ? (
        <div>🟢 Live</div>
      ) : (
        <div>🔴 Disconnected</div>
      )}

      {sse.error() && (
        <div className="error">{sse.error()!.message}</div>
      )}

      <div>
        {sse.events().map((event, i) => (
          <div key={i} className="notification">
            {event.message}
          </div>
        ))}
      </div>
    </div>
  );
}
```

## Real-Time Collaboration

### Presence System

```typescript
interface Presence {
  userId: string;
  name: string;
  cursor?: { x: number; y: number };
  lastSeen: number;
}

export function usePresence(roomId: string) {
  const ws = useWebSocketWithReconnect('wss://api.example.com/presence');
  const users = signal<Map<string, Presence>>(new Map());

  ws.on('presence:join', (user: Presence) => {
    const updated = new Map(users());
    updated.set(user.userId, user);
    users.set(updated);
  });

  ws.on('presence:leave', ({ userId }: { userId: string }) => {
    const updated = new Map(users());
    updated.delete(userId);
    users.set(updated);
  });

  ws.on('presence:update', (user: Presence) => {
    const updated = new Map(users());
    updated.set(user.userId, user);
    users.set(updated);
  });

  const updateCursor = (x: number, y: number) => {
    ws.send({
      type: 'presence:update',
      roomId,
      cursor: { x, y }
    });
  };

  return {
    users: memo(() => Array.from(users().values())),
    updateCursor
  };
}

// Usage
function CollaborativeEditor() {
  const presence = usePresence('room-123');

  effect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      presence.updateCursor(e.clientX, e.clientY);
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  });

  return (
    <div>
      {/* Show other users' cursors */}
      {presence.users().map(user => (
        user.cursor && (
          <div
            key={user.userId}
            className="cursor"
            style={{
              left: `${user.cursor.x}px`,
              top: `${user.cursor.y}px`
            }}
          >
            {user.name}
          </div>
        )
      ))}
    </div>
  );
}
```

## Best Practices

### Heartbeat/Ping-Pong

```typescript
export function useWebSocketWithHeartbeat(url: string, interval: number = 30000) {
  const socket = signal<WebSocket | null>(null);
  const isConnected = signal(false);

  effect(() => {
    const ws = new WebSocket(url);

    ws.onopen = () => {
      isConnected.set(true);

      // Send heartbeat
      const heartbeat = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: 'ping' }));
        }
      }, interval);

      // Cleanup heartbeat on close
      ws.onclose = () => {
        clearInterval(heartbeat);
        isConnected.set(false);
      };
    };

    ws.onmessage = (event) => {
      const message = JSON.parse(event.data);

      // Handle pong response
      if (message.type === 'pong') {
        console.log('Received pong');
      }
    };

    socket.set(ws);

    return () => {
      ws.close();
    };
  });

  return {
    isConnected,
    socket
  };
}
```

### Handle Binary Data

```typescript
export function useWebSocketBinary(url: string) {
  const socket = signal<WebSocket | null>(null);
  const isConnected = signal(false);

  effect(() => {
    const ws = new WebSocket(url);
    ws.binaryType = 'arraybuffer'; // or 'blob'

    ws.onopen = () => isConnected.set(true);

    ws.onmessage = (event) => {
      if (event.data instanceof ArrayBuffer) {
        const data = new Uint8Array(event.data);
        console.log('Received binary data:', data);
      } else {
        const message = JSON.parse(event.data);
        console.log('Received text:', message);
      }
    };

    ws.onclose = () => isConnected.set(false);

    socket.set(ws);

    return () => ws.close();
  });

  const sendBinary = (data: ArrayBuffer) => {
    socket()?.send(data);
  };

  const sendText = (data: any) => {
    socket()?.send(JSON.stringify(data));
  };

  return {
    isConnected,
    sendBinary,
    sendText
  };
}
```

### Throttle Messages

```typescript
function throttle<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): T {
  let lastCall = 0;

  return ((...args: any[]) => {
    const now = Date.now();

    if (now - lastCall >= delay) {
      lastCall = now;
      func(...args);
    }
  }) as T;
}

export function useThrottledWebSocket(url: string) {
  const ws = useWebSocket(url);

  // Throttle cursor updates to max 20/sec
  const throttledSend = throttle(ws.send, 50);

  return {
    ...ws,
    sendThrottled: throttledSend
  };
}

// Usage
function Canvas() {
  const ws = useThrottledWebSocket('wss://api.example.com/draw');

  const handleMouseMove = (e: MouseEvent) => {
    // Send at most 20 updates per second
    ws.sendThrottled({
      type: 'cursor',
      x: e.clientX,
      y: e.clientY
    });
  };

  return <canvas onMouseMove={handleMouseMove} />;
}
```

## Summary

You've learned:

✅ WebSocket connection management
✅ Auto-reconnection with exponential backoff
✅ Message queuing for reliability
✅ Type-safe WebSocket messages
✅ Message handlers and subscriptions
✅ Server-Sent Events (SSE)
✅ Real-time collaboration patterns
✅ Heartbeat for connection health
✅ Binary data handling
✅ Performance optimizations

WebSockets enable real-time, bidirectional communication!

---

**Next:** [Service Workers →](./service-workers.md) Offline functionality and caching
