# PhilJS RPC Subscription Features

## Overview

This document outlines the comprehensive tRPC-style subscription features added to philjs-rpc, including WebSocket subscriptions, Server-Sent Events (SSE) fallback, links, and subscription-specific middleware.

## Features Implemented

### 1. WebSocket Subscriptions (`src/subscriptions.ts`)

**WebSocketConnection Class:**
- Full-featured WebSocket connection manager
- Automatic reconnection with exponential backoff
- Configurable retry attempts, delays, and backoff multipliers
- Heartbeat/ping-pong to keep connections alive
- Connection state management (connecting, connected, disconnected, error)
- Event system for lifecycle hooks (connecting, connected, disconnected, error, reconnecting, reconnectFailed)
- Subscription multiplexing over single connection
- Graceful cleanup and unsubscription

**useSubscription Hook:**
- React-style hook for WebSocket subscriptions
- Built on PhilJS signals for reactivity
- Automatic subscription on mount, cleanup on unmount
- Error handling with retry capability
- Status tracking (idle, connecting, subscribed, error)
- Accumulates all received data
- Tracks latest data separately
- Resubscribe functionality

**State Persistence:**
- `createLocalStorageStateManager` - Persist subscription state in localStorage
- `createMemoryStateManager` - In-memory state storage
- Save/load/clear subscription state
- Useful for resuming subscriptions after page reload

### 2. Server-Sent Events Transport (`src/sse.ts`)

**SSEConnection Class:**
- EventSource-based transport for environments without WebSocket
- Same API as WebSocketConnection for easy switching
- Automatic reconnection with exponential backoff
- Heartbeat monitoring with timeout detection
- Connection lifecycle events
- Query parameter-based auth (since EventSource doesn't support custom headers)

**useSSESubscription Hook:**
- Same API as useSubscription but for SSE
- Automatic fallback option
- Compatible with all subscription features

**Auto Transport Selection:**
- `createAutoTransport` automatically selects WebSocket or SSE
- Prefers WebSocket by default, falls back to SSE
- Returns connection and transport type
- Graceful degradation for browser compatibility

### 3. Subscription Middleware (`src/subscription-middleware.ts`)

**Authentication Middleware:**
- `createSubscriptionAuthMiddleware` - Auth checks per subscription
- isAuthenticated check
- Per-path permission checking
- Custom error messages

**Rate Limiting Middleware:**
- `createSubscriptionRateLimitMiddleware` - Prevent abuse
- Max subscriptions per connection
- Max subscriptions per user
- Max events per second per subscription
- Sliding window rate limiting

**Backpressure Middleware:**
- `createBackpressureMiddleware` - Handle slow consumers
- Configurable buffer size
- Drop strategies: drop-oldest, drop-newest, error
- Callback when events are dropped
- Prevents memory leaks

**Connection Limit Middleware:**
- `createConnectionLimitMiddleware` - Limit total connections
- Max total connections globally
- Max connections per IP address
- Prevents DDoS

**Filtering Middleware:**
- `createSubscriptionFilterMiddleware` - Filter events per subscriber
- Per-user, per-permission, or custom filtering
- Reduce bandwidth and improve security

**Multiplexing Middleware:**
- `createMultiplexingMiddleware` - Share subscriptions
- Group subscriptions by key
- Limit subscriptions per key
- Efficient resource usage

**Middleware Composition:**
- `composeSubscriptionMiddleware` - Combine multiple middlewares
- Sequential execution
- Error handling across chain

### 4. Links (`src/links.ts`)

**HTTP Link:**
- `createHttpLink` - Standard HTTP transport
- Custom fetch implementation
- Dynamic headers
- Request/response transformers

**WebSocket Link:**
- `createWebSocketLink` - WebSocket transport
- Reconnection support
- Only for subscription operations

**Split Link:**
- `createSplitLink` - Route operations by type
- Conditional routing
- Typically routes subscriptions to WebSocket, queries/mutations to HTTP

**Batch Link:**
- `createBatchLink` - Batch multiple operations
- Configurable batch size and window
- Automatic batching with timeout
- Falls back to single request for one operation

**Deduplication Link:**
- `createDeduplicationLink` - Prevent duplicate in-flight requests
- Only for query operations
- Custom key generation
- Shares pending requests

**Retry Link:**
- `createRetryLink` - Automatic retry with backoff
- Configurable max attempts
- Exponential backoff
- Custom retry conditions
- Per-operation error handling

**Logging Link:**
- `createLoggingLink` - Log operations and results
- Request/response logging
- Timing information
- Custom logger support
- Enable/disable per environment

**Link Chain:**
- `createLinkChain` - Compose multiple links
- Sequential execution
- Middleware-like pattern
- Flexible composition

**Terminating Link:**
- `createTerminatingLink` - Custom endpoint
- For testing or custom implementations

### 5. Type System Updates (`src/types.ts`)

**New Types:**
- `ProcedureType` now includes 'subscription'
- `SubscriptionObserver<TData>` - Observer pattern for subscriptions
- `SubscriptionHandler<TInput, TOutput>` - Async generator handler type
- `UseSubscriptionOptions<TData>` - Hook configuration
- `UseSubscriptionResult<TData>` - Hook return type
- `SubscriptionEventMap` - Connection event types
- `IsSubscription<T>` - Type guard

**Updated Types:**
- `ClientProcedure` now includes `useSubscription` method
- Full type inference for subscriptions

### 6. Procedure Updates (`src/procedure.ts`)

**New Methods:**
- `procedure.subscription(handler)` - Define subscription procedures
- `isSubscription(proc)` - Type guard for subscriptions

**Subscription Handler:**
- Accepts async generators
- Yields data over time
- Automatic cleanup on completion

## Usage Examples

### Basic WebSocket Subscription

```typescript
import { createAPI, procedure } from 'philjs-rpc';
import { z } from 'zod';

// Server: Define subscription
export const api = createAPI({
  onMessage: procedure
    .input(z.object({ roomId: z.string() }))
    .subscription(async function* ({ input }) {
      while (true) {
        const message = await getNextMessage(input.roomId);
        yield message;
      }
    }),
});

// Client: Use subscription
const messages = client.onMessage.useSubscription(
  { roomId: 'general' },
  {
    onData: (msg) => console.log('New message:', msg),
    onError: (err) => console.error('Error:', err),
    retryOnError: true,
  }
);
```

### SSE Fallback

```typescript
import { createAutoTransport } from 'philjs-rpc';

const { connection, type } = createAutoTransport({
  wsUrl: 'ws://localhost:3000/api/rpc',
  sseUrl: '/api/rpc/sse',
  preferWebSocket: true,
});

console.log(`Using ${type} transport`);
```

### Links Composition

```typescript
import {
  createHttpLink,
  createWebSocketLink,
  createSplitLink,
  createRetryLink,
  createLoggingLink,
  createLinkChain,
} from 'philjs-rpc';

const link = createLinkChain([
  createLoggingLink({ enabled: true }),
  createRetryLink({ maxAttempts: 3 }),
  createSplitLink({
    condition: (op) => op.type === 'subscription',
    true: createWebSocketLink({ url: 'ws://localhost:3000/api/rpc' }),
    false: createHttpLink({ url: '/api/rpc' }),
  }),
]);
```

### Subscription Middleware

```typescript
import {
  createSubscriptionAuthMiddleware,
  createSubscriptionRateLimitMiddleware,
  createBackpressureMiddleware,
  composeSubscriptionMiddleware,
} from 'philjs-rpc';

const middleware = composeSubscriptionMiddleware([
  createSubscriptionAuthMiddleware({
    isAuthenticated: (ctx) => !!ctx.user,
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
```

## Architecture

### Connection Management

```
┌─────────────────┐
│  Application    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐      ┌──────────────┐
│ WebSocket/SSE   │─────▶│ Reconnection │
│   Connection    │      │    Logic     │
└────────┬────────┘      └──────────────┘
         │
         ▼
┌─────────────────┐
│  Subscription   │
│    Manager      │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   Observers     │
│  (useSubscription)│
└─────────────────┘
```

### Link Chain

```
Operation ──▶ Link 1 ──▶ Link 2 ──▶ Link 3 ──▶ Terminal
   │            │          │          │            │
   │         Logging    Retry      Split       HTTP/WS
   │                                            Transport
   │
   ▼
Result ◀──────────────────────────────────────────┘
```

### Subscription Lifecycle

```
1. Subscribe
   ├─▶ onStart callback
   ├─▶ Connection established (if needed)
   └─▶ Subscription registered

2. Receiving Data
   ├─▶ Server yields data
   ├─▶ Middleware chain processes
   ├─▶ onData callback
   └─▶ State updated

3. Error Handling
   ├─▶ onError callback
   ├─▶ Retry if enabled
   └─▶ Reconnection if needed

4. Completion
   ├─▶ onComplete callback
   └─▶ Cleanup

5. Unsubscribe
   ├─▶ Remove from subscription manager
   └─▶ Close connection if last subscription
```

## Files Added

1. `src/subscriptions.ts` - WebSocket connection and subscription hooks
2. `src/sse.ts` - Server-Sent Events transport
3. `src/subscription-middleware.ts` - Subscription-specific middleware
4. `src/links.ts` - tRPC-style links
5. `examples/chat-app.ts` - Complete chat application example
6. `examples/sse-example.ts` - SSE subscription examples
7. `examples/README.md` - Examples documentation

## Files Modified

1. `src/types.ts` - Added subscription types
2. `src/procedure.ts` - Added subscription procedure support
3. `src/index.ts` - Export all new features
4. `README.md` - Added subscription documentation

## Testing Considerations

### Unit Tests Needed

- [ ] WebSocketConnection lifecycle
- [ ] SSEConnection lifecycle
- [ ] Subscription middleware chain
- [ ] Link composition and routing
- [ ] Reconnection logic
- [ ] Backpressure handling
- [ ] Rate limiting

### Integration Tests Needed

- [ ] End-to-end WebSocket subscriptions
- [ ] End-to-end SSE subscriptions
- [ ] Fallback from WebSocket to SSE
- [ ] Multiple concurrent subscriptions
- [ ] Subscription with middleware
- [ ] Link chain execution

## Performance Considerations

1. **Connection Pooling**: Reuse WebSocket connections across subscriptions
2. **Multiplexing**: Share subscriptions with same input
3. **Backpressure**: Prevent memory leaks from slow consumers
4. **Rate Limiting**: Protect server from abuse
5. **Heartbeat**: Detect and close dead connections
6. **Efficient Cleanup**: Properly dispose subscriptions and connections

## Security Considerations

1. **Authentication**: Verify identity for each subscription
2. **Authorization**: Check permissions per subscription path
3. **Rate Limiting**: Prevent DDoS and abuse
4. **Input Validation**: Validate subscription inputs with Zod
5. **Connection Limits**: Limit total and per-IP connections
6. **HTTPS/WSS**: Use secure transports in production

## Browser Compatibility

- **WebSocket**: Supported in all modern browsers
- **SSE**: Supported in all modern browsers (including IE10+)
- **Automatic Fallback**: Gracefully degrades to SSE when WebSocket unavailable
- **EventSource Polyfill**: Available for older environments if needed

## Future Enhancements

1. **Subscription Batching**: Batch subscription messages
2. **Compression**: Compress subscription data
3. **Binary Protocol**: Use binary instead of JSON for efficiency
4. **Offline Queue**: Queue messages when offline
5. **Conflict Resolution**: Handle concurrent updates
6. **Optimistic Updates**: Update UI before server confirmation
7. **Presence System**: Track online/offline users
8. **Typing Indicators**: Show when users are typing
9. **Read Receipts**: Track message read status
10. **Subscription Pagination**: Paginate large subscription results

## Comparison with tRPC

### Similarities
- Type-safe subscriptions
- Async generator-based handlers
- Link system for composition
- Middleware support
- WebSocket and SSE transports

### Differences
- PhilJS uses signals instead of React Query
- Simpler API surface
- Built-in SSE support with auto-fallback
- More comprehensive subscription middleware
- Tighter integration with PhilJS ecosystem

## Documentation

- Main README updated with subscription examples
- Examples directory with comprehensive demos
- Inline JSDoc comments in all new files
- Type definitions for all public APIs

## Migration Guide

### From HTTP-only to Subscriptions

1. Add WebSocket server support
2. Define subscription procedures
3. Set up WebSocket connection on client
4. Use subscription hooks in components
5. Add subscription middleware for auth/rate limiting

### From tRPC Subscriptions

1. Replace `httpBatchLink` with `createHttpLink`
2. Replace `wsLink` with `createWebSocketLink`
3. Use `createSplitLink` instead of `splitLink`
4. Replace `useSubscription` with client-specific hook
5. Middleware needs slight API adjustment

## Support

For issues or questions:
- Check examples directory
- Review type definitions
- Submit GitHub issues
- Consult PhilJS documentation

## License

MIT - Same as philjs-rpc package
