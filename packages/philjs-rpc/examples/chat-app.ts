/**
 * Complete chat application example using philjs-rpc subscriptions.
 * Demonstrates WebSocket subscriptions, links, and middleware.
 */

import { createAPI, procedure } from 'philjs-rpc';
import { z } from 'zod';
import {
  createHttpLink,
  createWebSocketLink,
  createSplitLink,
  createRetryLink,
  createLoggingLink,
  createLinkChain,
  WebSocketConnection,
  createSubscriptionAuthMiddleware,
  createSubscriptionRateLimitMiddleware,
  createBackpressureMiddleware,
  composeSubscriptionMiddleware,
} from 'philjs-rpc';

// ============================================================================
// Server-side API Definition
// ============================================================================

// Simulated message store
const messages: Array<{ id: string; roomId: string; text: string; userId: string; timestamp: Date }> = [];
const messageStreams = new Map<string, Set<(message: any) => void>>();

// Helper to broadcast messages to a room
function broadcastMessage(roomId: string, message: any) {
  const listeners = messageStreams.get(roomId);
  if (listeners) {
    for (const listener of listeners) {
      listener(message);
    }
  }
}

// API definition
export const chatAPI = createAPI({
  // Query: Get message history
  messages: {
    list: procedure
      .input(z.object({ roomId: z.string() }))
      .query(async ({ input }) => {
        return messages.filter((m) => m.roomId === input.roomId);
      }),
  },

  // Mutation: Send a message
  sendMessage: procedure
    .input(z.object({
      roomId: z.string(),
      text: z.string().min(1).max(1000),
    }))
    .mutation(async ({ input, ctx }) => {
      const message = {
        id: Math.random().toString(36).substr(2, 9),
        roomId: input.roomId,
        text: input.text,
        userId: (ctx.user as any)?.id ?? 'anonymous',
        timestamp: new Date(),
      };

      messages.push(message);
      broadcastMessage(input.roomId, message);

      return message;
    }),

  // Subscription: Listen to new messages
  onMessage: procedure
    .input(z.object({ roomId: z.string() }))
    .subscription(async function* ({ input }) {
      // Create async generator for message stream
      const queue: any[] = [];
      let resolver: ((value: any) => void) | null = null;

      const listener = (message: any) => {
        if (resolver) {
          resolver(message);
          resolver = null;
        } else {
          queue.push(message);
        }
      };

      // Register listener
      if (!messageStreams.has(input.roomId)) {
        messageStreams.set(input.roomId, new Set());
      }
      messageStreams.get(input.roomId)!.add(listener);

      try {
        while (true) {
          // Yield messages from queue or wait for new ones
          if (queue.length > 0) {
            yield queue.shift();
          } else {
            yield await new Promise<any>((resolve) => {
              resolver = resolve;
            });
          }
        }
      } finally {
        // Cleanup on unsubscribe
        messageStreams.get(input.roomId)?.delete(listener);
      }
    }),

  // Subscription: User typing indicator
  onTyping: procedure
    .input(z.object({ roomId: z.string() }))
    .subscription(async function* ({ input }) {
      const typingEvents: any[] = [];
      // Simplified typing indicator implementation
      while (true) {
        if (typingEvents.length > 0) {
          yield typingEvents.shift();
        }
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
    }),
});

export type ChatAPI = typeof chatAPI;

// ============================================================================
// Server Setup with Subscription Middleware
// ============================================================================

// Create subscription middleware
const subscriptionMiddleware = composeSubscriptionMiddleware([
  createSubscriptionAuthMiddleware({
    isAuthenticated: (ctx) => !!ctx.user,
    hasPermission: (ctx, path) => {
      // Example: Only allow authenticated users to subscribe to private rooms
      if (path.includes('private')) {
        return !!ctx.user;
      }
      return true;
    },
  }),
  createSubscriptionRateLimitMiddleware({
    maxSubscriptionsPerConnection: 10,
    maxEventsPerSecond: 100,
  }),
  createBackpressureMiddleware({
    maxBufferSize: 100,
    strategy: 'drop-oldest',
  }),
]);

// ============================================================================
// Client Setup with Links
// ============================================================================

// Create HTTP link for queries and mutations
const httpLink = createHttpLink({
  url: '/api/rpc',
  headers: () => ({
    Authorization: `Bearer ${localStorage.getItem('token')}`,
  }),
});

// Create WebSocket link for subscriptions
const wsLink = createWebSocketLink({
  url: 'ws://localhost:3000/api/rpc',
});

// Split link to route based on operation type
const splitLink = createSplitLink({
  condition: (op) => op.type === 'subscription',
  true: wsLink,
  false: httpLink,
});

// Add retry and logging
const link = createLinkChain([
  createLoggingLink({ enabled: true }),
  createRetryLink({
    maxAttempts: 3,
    retryDelay: 1000,
  }),
  splitLink,
]);

// Create client with link chain
import { createClient } from 'philjs-rpc/client';

// Note: In actual implementation, createClient would accept a link parameter
const client = createClient<ChatAPI>({ url: '/api/rpc' });

// ============================================================================
// React Component Example
// ============================================================================

/**
 * Chat room component with real-time messages.
 */
function ChatRoom({ roomId }: { roomId: string }) {
  // Fetch message history
  const messageHistory = client.messages.list.useQuery({ roomId });

  // Subscribe to new messages
  const newMessages = client.onMessage.useSubscription(
    { roomId },
    {
      onData: (message) => {
        console.log('New message:', message);
      },
      onError: (error) => {
        console.error('Subscription error:', error);
      },
    }
  );

  // Subscribe to typing indicators
  const typingIndicators = client.onTyping.useSubscription({ roomId });

  // Send message mutation
  const sendMessage = client.sendMessage.useMutation({
    onSuccess: () => {
      console.log('Message sent!');
    },
  });

  const handleSendMessage = (text: string) => {
    sendMessage.mutate({ roomId, text });
  };

  if (messageHistory.isLoading) {
    return <div>Loading messages...</div>;
  }

  if (messageHistory.isError) {
    return <div>Error: {messageHistory.error?.message}</div>;
  }

  // Combine history and new messages
  const allMessages = [
    ...(messageHistory.data ?? []),
    ...newMessages.data,
  ];

  return (
    <div className="chat-room">
      <div className="messages">
        {allMessages.map((message) => (
          <div key={message.id} className="message">
            <strong>{message.userId}:</strong> {message.text}
          </div>
        ))}
      </div>

      {typingIndicators.lastData && (
        <div className="typing-indicator">
          Someone is typing...
        </div>
      )}

      <form onSubmit={(e) => {
        e.preventDefault();
        const input = e.currentTarget.elements.namedItem('message') as HTMLInputElement;
        handleSendMessage(input.value);
        input.value = '';
      }}>
        <input name="message" placeholder="Type a message..." />
        <button type="submit">Send</button>
      </form>

      <div className="subscription-status">
        Status: {newMessages.status}
        {newMessages.isError && ` - Error: ${newMessages.error?.message}`}
      </div>
    </div>
  );
}

// ============================================================================
// Advanced Features
// ============================================================================

/**
 * Example: Subscription with filtering
 */
import { createSubscriptionFilterMiddleware } from 'philjs-rpc';

const filterMiddleware = createSubscriptionFilterMiddleware({
  filter: (ctx, data: any) => {
    // Only send messages from users the subscriber follows
    const followedUsers = (ctx.user as any)?.following ?? [];
    return followedUsers.includes(data.userId);
  },
});

/**
 * Example: Subscription multiplexing
 */
import { createMultiplexingMiddleware } from 'philjs-rpc';

const multiplexingMiddleware = createMultiplexingMiddleware({
  getKey: (input: any) => `room:${input.roomId}`,
  maxSubscriptionsPerKey: 1000,
});

/**
 * Example: SSE fallback
 */
import { createAutoTransport } from 'philjs-rpc';

const { connection, type } = createAutoTransport({
  wsUrl: 'ws://localhost:3000/api/rpc',
  sseUrl: '/api/rpc/sse',
  preferWebSocket: true,
});

console.log(`Using ${type} transport`);

/**
 * Example: Manual WebSocket connection management
 */
const wsConnection = new WebSocketConnection({
  url: 'ws://localhost:3000/api/rpc',
  reconnect: {
    enabled: true,
    maxAttempts: 10,
    delay: 1000,
  },
});

// Listen to connection events
wsConnection.on('connected', () => {
  console.log('WebSocket connected');
});

wsConnection.on('disconnected', () => {
  console.log('WebSocket disconnected');
});

wsConnection.on('reconnecting', ({ attempt, delay }) => {
  console.log(`Reconnecting (attempt ${attempt}) in ${delay}ms`);
});

wsConnection.on('error', ({ error }) => {
  console.error('WebSocket error:', error);
});

// Connect
await wsConnection.connect();

/**
 * Example: Subscription state persistence
 */
import { createLocalStorageStateManager } from 'philjs-rpc';

const stateManager = createLocalStorageStateManager('chat-app');

// Save subscription state
stateManager.save('last-room', { roomId: 'general' });

// Load subscription state
const lastRoom = stateManager.load('last-room');
console.log('Last room:', lastRoom);

export { ChatRoom, client };
