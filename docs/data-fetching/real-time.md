# Real-Time Data

Build live, real-time applications with WebSockets, Server-Sent Events, and polling.

## What You'll Learn

- WebSocket connections
- Server-Sent Events (SSE)
- Polling strategies
- Real-time queries
- Optimistic updates for real-time
- Best practices

## WebSockets

### Basic WebSocket Connection

```typescript
import { signal, effect } from '@philjs/core';

function useWebSocket<T>(url: string) {
  const data = signal<T | null>(null);
  const connected = signal(false);
  const error = signal<Error | null>(null);

  effect(() => {
    const ws = new WebSocket(url);

    ws.onopen = () => {
      connected.set(true);
      error.set(null);
    };

    ws.onmessage = (event) => {
      try {
        const parsed = JSON.parse(event.data);
        data.set(parsed);
      } catch (err) {
        error.set(err as Error);
      }
    };

    ws.onerror = (event) => {
      error.set(new Error('WebSocket error'));
    };

    ws.onclose = () => {
      connected.set(false);
    };

    return () => {
      ws.close();
    };
  });

  return { data, connected, error };
}
```

### Using WebSocket

```typescript
interface LiveStats {
  users: number;
  revenue: number;
  orders: number;
}

function LiveDashboard() {
  const { data, connected, error } = useWebSocket<LiveStats>(
    'wss://api.example.com/live-stats'
  );

  if (error()) {
    return <Error message={error()!.message} />;
  }

  return (
    <div>
      {!connected() && <div className="status">Connecting...</div>}

      {data() && (
        <div className="stats">
          <StatCard label="Users" value={data()!.users} />
          <StatCard label="Revenue" value={data()!.revenue} />
          <StatCard label="Orders" value={data()!.orders} />
        </div>
      )}
    </div>
  );
}
```

### Send Messages

```typescript
function useWebSocket(url: string) {
  const ws = signal<WebSocket | null>(null);
  const data = signal(null);

  effect(() => {
    const socket = new WebSocket(url);

    socket.onopen = () => ws.set(socket);
    socket.onmessage = (event) => data.set(JSON.parse(event.data));
    socket.onclose = () => ws.set(null);

    return () => socket.close();
  });

  const send = (message: any) => {
    if (ws()) {
      ws()!.send(JSON.stringify(message));
    }
  };

  return { data, send, connected: () => !!ws() };
}

// Usage
function Chat() {
  const { data, send, connected } = useWebSocket('wss://chat.example.com');

  const sendMessage = (text: string) => {
    send({ type: 'message', text });
  };

  return (
    <div>
      {data() && <Message data={data()!} />}
      <ChatInput onSend={sendMessage} disabled={!connected()} />
    </div>
  );
}
```

### Auto-Reconnect

```typescript
function useWebSocket(url: string, maxRetries = 5) {
  const data = signal(null);
  const connected = signal(false);
  const retryCount = signal(0);

  effect(() => {
    let ws: WebSocket;
    let reconnectTimer: any;

    const connect = () => {
      ws = new WebSocket(url);

      ws.onopen = () => {
        connected.set(true);
        retryCount.set(0);
      };

      ws.onmessage = (event) => {
        data.set(JSON.parse(event.data));
      };

      ws.onclose = () => {
        connected.set(false);

        // Attempt reconnect
        if (retryCount() < maxRetries) {
          const delay = Math.min(1000 * Math.pow(2, retryCount()), 30000);

          reconnectTimer = setTimeout(() => {
            retryCount.set(c => c + 1);
            connect();
          }, delay);
        }
      };
    };

    connect();

    return () => {
      clearTimeout(reconnectTimer);
      ws?.close();
    };
  });

  return { data, connected, retryCount };
}
```

## Server-Sent Events (SSE)

### Basic SSE Connection

```typescript
function useSSE<T>(url: string) {
  const data = signal<T | null>(null);
  const connected = signal(false);
  const error = signal<Error | null>(null);

  effect(() => {
    const eventSource = new EventSource(url);

    eventSource.onopen = () => {
      connected.set(true);
      error.set(null);
    };

    eventSource.onmessage = (event) => {
      try {
        const parsed = JSON.parse(event.data);
        data.set(parsed);
      } catch (err) {
        error.set(err as Error);
      }
    };

    eventSource.onerror = () => {
      connected.set(false);
      error.set(new Error('SSE connection error'));
    };

    return () => {
      eventSource.close();
    };
  });

  return { data, connected, error };
}
```

### Named Events

```typescript
function useSSE(url: string) {
  const data = signal(null);

  effect(() => {
    const eventSource = new EventSource(url);

    // Listen for specific event types
    eventSource.addEventListener('update', (event) => {
      data.set(JSON.parse(event.data));
    });

    eventSource.addEventListener('delete', (event) => {
      console.log('Item deleted:', event.data);
    });

    eventSource.addEventListener('error', (event) => {
      console.error('Error event:', event);
    });

    return () => eventSource.close();
  });

  return { data };
}
```

### Server Implementation

```typescript
// src/pages/api/events.ts
export async function GET(request: Request) {
  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder();

      // Send data every 5 seconds
      const interval = setInterval(() => {
        const data = {
          timestamp: Date.now(),
          value: Math.random()
        };

        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify(data)}\n\n`)
        );
      }, 5000);

      // Cleanup
      request.signal.addEventListener('abort', () => {
        clearInterval(interval);
        controller.close();
      });
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive'
    }
  });
}
```

## Polling

### Basic Polling

```typescript
function usePolling<T>(url: string, interval = 5000) {
  const data = signal<T | null>(null);
  const loading = signal(true);

  effect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(url);
        data.set(await res.json());
        loading.set(false);
      } catch (error) {
        console.error('Polling error:', error);
      }
    };

    fetchData();
    const timer = setInterval(fetchData, interval);

    return () => clearInterval(timer);
  });

  return { data, loading };
}
```

### Adaptive Polling

```typescript
function useAdaptivePolling<T>(url: string) {
  const data = signal<T | null>(null);
  const interval = signal(5000); // Start with 5s

  effect(() => {
    let timer: any;

    const fetchData = async () => {
      const start = Date.now();

      try {
        const res = await fetch(url);
        const newData = await res.json();

        // If data changed, poll faster
        if (JSON.stringify(newData) !== JSON.stringify(data())) {
          interval.set(Math.max(1000, interval() / 2));
        } else {
          // If no change, slow down
          interval.set(Math.min(30000, interval() * 1.5));
        }

        data.set(newData);
      } catch (error) {
        console.error(error);
      }

      // Schedule next poll
      timer = setTimeout(fetchData, interval());
    };

    fetchData();

    return () => clearTimeout(timer);
  });

  return { data, interval };
}
```

### Conditional Polling

```typescript
function useConditionalPolling<T>(
  url: string,
  shouldPoll: () => boolean,
  interval = 5000
) {
  const data = signal<T | null>(null);

  effect(() => {
    if (!shouldPoll()) return;

    const fetchData = async () => {
      const res = await fetch(url);
      data.set(await res.json());
    };

    fetchData();
    const timer = setInterval(fetchData, interval);

    return () => clearInterval(timer);
  });

  return { data };
}

// Usage
function Dashboard() {
  const isActive = signal(true);

  // Only poll when dashboard is active
  const { data } = useConditionalPolling(
    '/api/stats',
    () => isActive(),
    10000
  );

  return <StatsWidget stats={data()} />;
}
```

## Real-Time Queries

Combine queries with real-time updates:

```typescript
import { createQuery, setQueryData } from '@philjs/core';

const postsQuery = createQuery({
  key: () => ['posts'],
  fetcher: async () => {
    const res = await fetch('/api/posts');
    return res.json();
  }
});

function PostsList() {
  const { data } = postsQuery();

  // Subscribe to real-time updates
  effect(() => {
    const ws = new WebSocket('wss://api.example.com/posts');

    ws.onmessage = (event) => {
      const update = JSON.parse(event.data);

      // Update query cache in real-time
      setQueryData(['posts'], (old: Post[]) => {
        switch (update.type) {
          case 'create':
            return [update.post, ...old];

          case 'update':
            return old.map(post =>
              post.id === update.post.id ? update.post : post
            );

          case 'delete':
            return old.filter(post => post.id !== update.postId);

          default:
            return old;
        }
      });
    };

    return () => ws.close();
  });

  return (
    <div>
      {data()?.map(post => (
        <PostCard key={post.id} post={post} />
      ))}
    </div>
  );
}
```

## Presence

Track who's online:

```typescript
interface Presence {
  userId: string;
  username: string;
  lastSeen: number;
}

function usePresence(roomId: string) {
  const users = signal<Presence[]>([]);

  effect(() => {
    const ws = new WebSocket(`wss://api.example.com/presence/${roomId}`);

    ws.onopen = () => {
      // Announce presence
      ws.send(JSON.stringify({
        type: 'join',
        userId: currentUser.id,
        username: currentUser.name
      }));
    };

    ws.onmessage = (event) => {
      const message = JSON.parse(event.data);

      switch (message.type) {
        case 'user-joined':
          users.set([...users(), message.user]);
          break;

        case 'user-left':
          users.set(users().filter(u => u.userId !== message.userId));
          break;

        case 'presence-list':
          users.set(message.users);
          break;
      }
    };

    // Send heartbeat
    const heartbeat = setInterval(() => {
      ws.send(JSON.stringify({ type: 'heartbeat' }));
    }, 30000);

    return () => {
      clearInterval(heartbeat);
      ws.close();
    };
  });

  return { users };
}
```

## Typing Indicators

Show when users are typing:

```typescript
function useTypingIndicator(roomId: string) {
  const typingUsers = signal<string[]>([]);

  effect(() => {
    const ws = new WebSocket(`wss://api.example.com/typing/${roomId}`);

    ws.onmessage = (event) => {
      const { type, userId, username } = JSON.parse(event.data);

      if (type === 'typing-start') {
        typingUsers.set([...typingUsers(), username]);
      } else if (type === 'typing-stop') {
        typingUsers.set(typingUsers().filter(u => u !== username));
      }
    };

    return () => ws.close();
  });

  const sendTyping = (isTyping: boolean) => {
    // Send to server
    fetch(`/api/typing/${roomId}`, {
      method: 'POST',
      body: JSON.stringify({ isTyping })
    });
  };

  return { typingUsers, sendTyping };
}

// Usage
function ChatInput() {
  const { sendTyping } = useTypingIndicator('room-123');
  let typingTimer: any;

  const handleInput = () => {
    sendTyping(true);

    clearTimeout(typingTimer);
    typingTimer = setTimeout(() => {
      sendTyping(false);
    }, 2000);
  };

  return <input onInput={handleInput} />;
}
```

## Collaborative Editing

Real-time collaborative features:

```typescript
function useCollaborativeDoc(docId: string) {
  const content = signal('');
  const cursors = signal<Map<string, number>>(new Map());

  effect(() => {
    const ws = new WebSocket(`wss://api.example.com/docs/${docId}`);

    ws.onmessage = (event) => {
      const message = JSON.parse(event.data);

      switch (message.type) {
        case 'content-change':
          content.set(message.content);
          break;

        case 'cursor-move':
          cursors.set(new Map(cursors()).set(
            message.userId,
            message.position
          ));
          break;
      }
    };

    return () => ws.close();
  });

  const updateContent = (newContent: string) => {
    content.set(newContent);

    // Send to server
    ws.send(JSON.stringify({
      type: 'content-change',
      content: newContent
    }));
  };

  return { content, cursors, updateContent };
}
```

## Best Practices

### Choose the Right Technology

```typescript
// ✅ WebSocket for bidirectional communication
const chat = useWebSocket('wss://api.example.com/chat');

// ✅ SSE for server-to-client only
const notifications = useSSE('/api/notifications');

// ✅ Polling for simple updates
const { data } = usePolling('/api/stats', 30000);

// ❌ WebSocket for occasional updates (overkill)
// ❌ Polling for real-time chat (too slow)
```

### Handle Reconnection

```typescript
// ✅ Implement automatic reconnection
function useWebSocket(url: string) {
  // ... reconnection logic
}

// ❌ No reconnection handling
const ws = new WebSocket(url);
```

### Clean Up Connections

```typescript
// ✅ Close connections when unmounting
effect(() => {
  const ws = new WebSocket(url);

  return () => {
    ws.close();
  };
});

// ❌ Leave connections open
effect(() => {
  const ws = new WebSocket(url);
  // Missing cleanup
});
```

### Throttle Updates

```typescript
// ✅ Throttle frequent updates
let updateTimer: any;

ws.onmessage = (event) => {
  clearTimeout(updateTimer);
  updateTimer = setTimeout(() => {
    data.set(JSON.parse(event.data));
  }, 100);
};

// ❌ Update on every message (can cause performance issues)
ws.onmessage = (event) => {
  data.set(JSON.parse(event.data));
};
```

### Show Connection Status

```typescript
// ✅ Show connection state
{!connected() && <div>Disconnected - Reconnecting...</div>}

// ❌ Silent disconnection
```

## Summary

You've learned:

✅ WebSocket connections and messaging
✅ Auto-reconnection strategies
✅ Server-Sent Events (SSE)
✅ Polling (basic, adaptive, conditional)
✅ Real-time query updates
✅ Presence tracking
✅ Typing indicators
✅ Collaborative editing
✅ Best practices

Real-time features make apps feel alive and responsive!

---

**Next:** [Optimistic Updates →](./optimistic-updates.md) Instant UI updates before server confirms
