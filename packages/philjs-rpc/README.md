# philjs-rpc

A tRPC-style end-to-end type-safe RPC system for PhilJS. Build fully type-safe APIs with automatic type inference from server to client.

## Features

- **End-to-end type safety**: Full TypeScript inference from API definition to client usage
- **React Query-style hooks**: `useQuery`, `useMutation`, and `useSubscription` hooks built on PhilJS signals
- **Real-time subscriptions**: WebSocket and SSE support for live data streaming
- **tRPC-style links**: Composable request/response transformations and routing
- **Input validation**: Built-in Zod integration for runtime validation
- **Middleware support**: Composable middleware for auth, logging, rate limiting, etc.
- **Multiple runtime adapters**: Works with Node.js, Express, Vercel, Netlify, Cloudflare Workers
- **Request batching**: Automatic request batching for improved performance
- **Caching**: Built-in query caching with stale-while-revalidate support
- **Automatic reconnection**: Resilient WebSocket connections with exponential backoff
- **Transport fallback**: Graceful degradation from WebSocket to SSE

## Installation

```bash
npm install philjs-rpc
# or
pnpm add philjs-rpc
# or
yarn add philjs-rpc
```

Optional peer dependency for input validation:

```bash
npm install zod
```

## Quick Start

### 1. Define your API (Server)

```typescript
// src/server/api.ts
import { createAPI, procedure } from 'philjs-rpc';
import { z } from 'zod';

// Define your database or data layer
const db = {
  users: {
    findMany: async () => [{ id: '1', name: 'John', email: 'john@example.com' }],
    findUnique: async ({ where }: { where: { id: string } }) => ({
      id: where.id,
      name: 'John',
      email: 'john@example.com',
    }),
    create: async ({ data }: { data: { name: string; email: string } }) => ({
      id: '2',
      ...data,
    }),
    delete: async ({ where }: { where: { id: string } }) => ({ id: where.id }),
  },
};

export const api = createAPI({
  users: {
    // Simple query (no input)
    list: procedure.query(async () => {
      return db.users.findMany();
    }),

    // Query with input validation
    byId: procedure
      .input(z.object({ id: z.string() }))
      .query(async ({ input }) => {
        return db.users.findUnique({ where: { id: input.id } });
      }),

    // Mutation with input validation
    create: procedure
      .input(
        z.object({
          name: z.string().min(1, 'Name is required'),
          email: z.string().email('Invalid email'),
        })
      )
      .mutation(async ({ input }) => {
        return db.users.create({ data: input });
      }),

    // Mutation with delete
    delete: procedure
      .input(z.object({ id: z.string() }))
      .mutation(async ({ input }) => {
        return db.users.delete({ where: { id: input.id } });
      }),
  },

  // Nested namespaces
  posts: {
    list: procedure.query(async () => {
      return [{ id: '1', title: 'Hello World' }];
    }),

    comments: {
      list: procedure
        .input(z.object({ postId: z.string() }))
        .query(async ({ input }) => {
          return [{ id: '1', postId: input.postId, content: 'Great post!' }];
        }),
    },
  },
});

// Export the API type for client usage
export type AppAPI = typeof api;
```

### 2. Create the Server Handler

```typescript
// src/server/handler.ts
import { createHandler } from 'philjs-rpc/server';
import { api } from './api';

export const handler = createHandler(api, {
  createContext: async (req) => {
    // Extract auth info from headers
    const token = req.headers.authorization?.replace('Bearer ', '');
    return {
      user: token ? await validateToken(token) : null,
    };
  },
  onError: (error, ctx) => {
    console.error('RPC Error:', error);
  },
});
```

### 3. Set Up Server Routes

#### Node.js HTTP Server

```typescript
import http from 'http';
import { createNodeHandler } from 'philjs-rpc/server';
import { api } from './api';

const handler = createNodeHandler(api);

http.createServer(handler).listen(3000, () => {
  console.log('Server running on http://localhost:3000');
});
```

#### Express.js

```typescript
import express from 'express';
import { createExpressHandler } from 'philjs-rpc/server';
import { api } from './api';

const app = express();
app.use(express.json());
app.post('/api/rpc', createExpressHandler(api));
app.listen(3000);
```

#### Vercel Serverless Functions

```typescript
// api/rpc.ts
import { createVercelHandler } from 'philjs-rpc/server';
import { api } from '../src/server/api';

export default createVercelHandler(api);
```

#### Netlify Functions

```typescript
// netlify/functions/rpc.ts
import { createNetlifyHandler } from 'philjs-rpc/server';
import { api } from '../../src/server/api';

export const handler = createNetlifyHandler(api);
```

#### Cloudflare Workers / Deno / Bun

```typescript
import { createFetchHandler } from 'philjs-rpc/server';
import { api } from './api';

const handler = createFetchHandler(api);

export default {
  fetch: handler,
};
```

### 4. Create the Client

```typescript
// src/client/rpc.ts
import { createClient } from 'philjs-rpc/client';
import type { AppAPI } from '../server/api';

export const client = createClient<AppAPI>({
  url: '/api/rpc',
  // Optional: Add auth headers
  headers: () => ({
    Authorization: `Bearer ${getAuthToken()}`,
  }),
});
```

### 5. Use in Components

```typescript
// src/components/UsersList.tsx
import { client } from '../client/rpc';

function UsersList() {
  // Query hook - automatically fetches and caches
  const users = client.users.list.useQuery({
    staleTime: 5000, // Consider data stale after 5 seconds
    refetchOnWindowFocus: true,
  });

  if (users.isLoading) {
    return <div>Loading users...</div>;
  }

  if (users.isError) {
    return <div>Error: {users.error.message}</div>;
  }

  return (
    <ul>
      {users.data?.map((user) => (
        <li key={user.id}>
          {user.name} ({user.email})
        </li>
      ))}
    </ul>
  );
}

function UserProfile({ userId }: { userId: string }) {
  // Query with input
  const user = client.users.byId.useQuery(
    { id: userId },
    { enabled: !!userId }
  );

  if (user.isLoading) return <div>Loading...</div>;
  if (user.isError) return <div>Error: {user.error.message}</div>;

  return (
    <div>
      <h1>{user.data?.name}</h1>
      <p>{user.data?.email}</p>
    </div>
  );
}

function CreateUserForm() {
  // Mutation hook
  const createUser = client.users.create.useMutation({
    onSuccess: (data) => {
      console.log('User created:', data);
    },
    onError: (error) => {
      console.error('Failed to create user:', error.message);
    },
  });

  const handleSubmit = (e: Event) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);

    createUser.mutate({
      name: formData.get('name') as string,
      email: formData.get('email') as string,
    });
  };

  return (
    <form onSubmit={handleSubmit}>
      <input name="name" placeholder="Name" required />
      <input name="email" type="email" placeholder="Email" required />
      <button type="submit" disabled={createUser.isLoading}>
        {createUser.isLoading ? 'Creating...' : 'Create User'}
      </button>
      {createUser.isError && (
        <div class="error">{createUser.error.message}</div>
      )}
    </form>
  );
}
```

### 6. Direct Fetch Calls

```typescript
// Outside of components, use .fetch() for direct calls
async function loadInitialData() {
  const users = await client.users.list.fetch();
  const user = await client.users.byId.fetch({ id: '123' });

  // Mutations
  const newUser = await client.users.create.fetch({
    name: 'Jane Doe',
    email: 'jane@example.com',
  });
}
```

## Middleware

### Built-in Middleware

```typescript
import {
  createAPI,
  procedure,
  loggerMiddleware,
  rateLimitMiddleware,
  createAuthMiddleware,
  permissionMiddleware,
  cacheMiddleware,
} from 'philjs-rpc';

// Logger middleware
const withLogging = procedure.use(
  loggerMiddleware({
    logInput: true,
    logOutput: true,
  })
);

// Rate limiting
const withRateLimit = procedure.use(
  rateLimitMiddleware({
    limit: 100,
    windowMs: 60000, // 1 minute
  })
);

// Authentication
const authMiddleware = createAuthMiddleware({
  validateToken: async (token) => {
    // Return user or null
    return await verifyJWT(token);
  },
});

const authedProcedure = procedure.use(authMiddleware);

// Permission checking
const adminProcedure = authedProcedure.use(
  permissionMiddleware(['admin'], { mode: 'any' })
);

// Caching for queries
const cachedProcedure = procedure.use(
  cacheMiddleware({
    ttl: 60000, // 1 minute
  })
);
```

### Custom Middleware

```typescript
import { createMiddleware, RPCError } from 'philjs-rpc';

// Custom logging middleware
const customLogger = createMiddleware(async ({ ctx, input, next, type, path }) => {
  console.log(`[${type}] ${path}`, { input });

  const start = Date.now();
  const result = await next(ctx);
  const duration = Date.now() - start;

  console.log(`[${type}] ${path} completed in ${duration}ms`);

  return result;
});

// Validation middleware
const validateRequest = createMiddleware(async ({ ctx, next }) => {
  if (!ctx.user) {
    return {
      ok: false,
      error: new RPCError({
        code: 'UNAUTHORIZED',
        message: 'Authentication required',
      }),
    };
  }

  // Add additional context
  return next({
    ...ctx,
    isAuthenticated: true,
  });
});
```

## Error Handling

```typescript
import { RPCError } from 'philjs-rpc';

const api = createAPI({
  users: {
    byId: procedure
      .input(z.object({ id: z.string() }))
      .query(async ({ input }) => {
        const user = await db.users.findUnique({ where: { id: input.id } });

        if (!user) {
          throw new RPCError({
            code: 'NOT_FOUND',
            message: `User with id ${input.id} not found`,
          });
        }

        return user;
      }),
  },
});
```

### Error Codes

| Code                    | HTTP Status | Description                    |
| ----------------------- | ----------- | ------------------------------ |
| `BAD_REQUEST`           | 400         | Invalid input or request       |
| `UNAUTHORIZED`          | 401         | Missing or invalid auth        |
| `FORBIDDEN`             | 403         | Insufficient permissions       |
| `NOT_FOUND`             | 404         | Resource not found             |
| `METHOD_NOT_ALLOWED`    | 405         | Wrong procedure type           |
| `TIMEOUT`               | 408         | Request timed out              |
| `CONFLICT`              | 409         | Resource conflict              |
| `PRECONDITION_FAILED`   | 412         | Precondition not met           |
| `PAYLOAD_TOO_LARGE`     | 413         | Request body too large         |
| `UNPROCESSABLE_ENTITY`  | 422         | Semantic validation error      |
| `TOO_MANY_REQUESTS`     | 429         | Rate limit exceeded            |
| `INTERNAL_SERVER_ERROR` | 500         | Unexpected server error        |

## Advanced Usage

### Request Batching

```typescript
const client = createClient<AppAPI>({
  url: '/api/rpc',
  batching: true,
  batchWindowMs: 10, // Batch requests within 10ms
});

// These requests will be batched into a single HTTP request
const [users, posts] = await Promise.all([
  client.users.list.fetch(),
  client.posts.list.fetch(),
]);
```

### Query Invalidation

```typescript
import { invalidateQueries } from 'philjs-rpc/client';

const createUser = client.users.create.useMutation({
  onSuccess: () => {
    // Invalidate user queries after creating
    invalidateQueries('users');
  },
});
```

### Prefetching

```typescript
import { prefetchQuery } from 'philjs-rpc/client';

// Prefetch on hover
<button
  onMouseEnter={() => prefetchQuery(client.users.byId, { id: '123' })}
  onClick={() => navigate(`/users/123`)}
>
  View User
</button>
```

### Custom Context Types

```typescript
import { createProcedureBuilder, ProcedureContext } from 'philjs-rpc';

interface AuthContext extends ProcedureContext {
  user: {
    id: string;
    email: string;
    roles: string[];
  };
}

const authedProcedure = createProcedureBuilder<AuthContext>();

const api = createAPI({
  profile: {
    get: authedProcedure.query(async ({ ctx }) => {
      // ctx.user is fully typed
      return ctx.user;
    }),
  },
});
```

### Organizing Large APIs

```typescript
// src/server/routers/users.ts
import { createRouter, procedure } from 'philjs-rpc';
import { z } from 'zod';

export const usersRouter = createRouter({
  list: procedure.query(async () => db.users.findMany()),
  byId: procedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => db.users.findUnique({ where: { id: input.id } })),
});

// src/server/routers/posts.ts
export const postsRouter = createRouter({
  list: procedure.query(async () => db.posts.findMany()),
});

// src/server/api.ts
import { createAPI, mergeRouters } from 'philjs-rpc';
import { usersRouter } from './routers/users';
import { postsRouter } from './routers/posts';

export const api = createAPI(
  mergeRouters({
    users: usersRouter,
    posts: postsRouter,
  })
);
```

## Type Inference Utilities

```typescript
import type {
  InferProcedureInput,
  InferProcedureOutput,
  InferRouter,
  GetProcedureInput,
  GetProcedureOutput,
} from 'philjs-rpc';

// Infer input type from a procedure
type CreateUserInput = InferProcedureInput<typeof api._router.users.create>;
// { name: string; email: string }

// Infer output type from a procedure
type CreateUserOutput = InferProcedureOutput<typeof api._router.users.create>;
// { id: string; name: string; email: string }

// Get input/output at a path
type UserById = GetProcedureOutput<typeof api._router, 'users.byId'>;
```

## API Reference

### Server

- `createAPI(router)` - Create an API definition
- `createHandler(api, options?)` - Create a generic request handler
- `createNodeHandler(api, options?)` - Node.js HTTP handler
- `createExpressHandler(api, options?)` - Express.js handler
- `createVercelHandler(api, options?)` - Vercel serverless handler
- `createNetlifyHandler(api, options?)` - Netlify Functions handler
- `createFetchHandler(api, options?)` - Fetch API handler (Workers, Deno, Bun)

### Client

- `createClient<API>(config)` - Create a type-safe client
- `invalidateQueries(pathPattern)` - Invalidate cached queries
- `prefetchQuery(procedure, input)` - Prefetch a query
- `getQueryCache()` - Access the query cache

### Procedure

- `procedure.input(schema)` - Add input validation
- `procedure.use(middleware)` - Add middleware
- `procedure.query(handler)` - Create a query procedure
- `procedure.mutation(handler)` - Create a mutation procedure
- `procedure.subscription(handler)` - Create a subscription procedure

### Middleware

- `createMiddleware(fn)` - Create custom middleware
- `loggerMiddleware(options?)` - Logging middleware
- `rateLimitMiddleware(options)` - Rate limiting middleware
- `createAuthMiddleware(options)` - Authentication middleware
- `permissionMiddleware(permissions, options?)` - Permission checking
- `cacheMiddleware(options?)` - Query caching middleware
- `retryMiddleware(options?)` - Retry failed requests

### Subscriptions

- `WebSocketConnection(config)` - WebSocket connection manager
- `SSEConnection(config)` - Server-Sent Events connection manager
- `createAutoTransport(config)` - Automatic transport selection (WebSocket/SSE)
- `createUseSubscription(connection, path)` - Create subscription hook
- `createUseSSESubscription(connection, path)` - Create SSE subscription hook

### Subscription Middleware

- `createSubscriptionAuthMiddleware(options)` - Auth for subscriptions
- `createSubscriptionRateLimitMiddleware(options)` - Rate limiting for subscriptions
- `createBackpressureMiddleware(options)` - Backpressure handling
- `createConnectionLimitMiddleware(options)` - Connection limits
- `createSubscriptionFilterMiddleware(options)` - Filter subscription data
- `createMultiplexingMiddleware(options)` - Share subscriptions

### Links

- `createHttpLink(options)` - HTTP transport for queries/mutations
- `createWebSocketLink(options)` - WebSocket transport for subscriptions
- `createSplitLink(options)` - Route operations based on type
- `createBatchLink(options)` - Batch multiple operations
- `createDeduplicationLink(options?)` - Deduplicate in-flight requests
- `createRetryLink(options?)` - Automatic retry with backoff
- `createLoggingLink(options?)` - Log operations and results
- `createLinkChain(links)` - Compose multiple links

## Real-time Subscriptions

PhilJS RPC provides full support for real-time data streaming with both WebSocket and Server-Sent Events (SSE) transports.

### WebSocket Subscriptions

Define a subscription procedure:

```typescript
import { createAPI, procedure } from 'philjs-rpc';
import { z } from 'zod';

export const api = createAPI({
  // Real-time message subscription
  onMessage: procedure
    .input(z.object({ roomId: z.string() }))
    .subscription(async function* ({ input }) {
      // Async generator that yields data over time
      while (true) {
        const message = await getNextMessage(input.roomId);
        yield message;
      }
    }),

  // Stock price updates
  onPriceUpdate: procedure
    .input(z.object({ symbol: z.string() }))
    .subscription(async function* ({ input }) {
      for await (const price of watchStock(input.symbol)) {
        yield {
          symbol: input.symbol,
          price,
          timestamp: new Date(),
        };
      }
    }),
});
```

Use subscription in components:

```typescript
import { client } from './rpc';

function ChatRoom({ roomId }: { roomId: string }) {
  const messages = client.onMessage.useSubscription(
    { roomId },
    {
      onData: (message) => console.log('New message:', message),
      onError: (error) => console.error('Subscription error:', error),
      onComplete: () => console.log('Subscription completed'),
      retryOnError: true,
      retryDelay: 1000,
    }
  );

  return (
    <div>
      <div>Status: {messages.status}</div>
      <div>Latest: {messages.lastData?.text}</div>
      <ul>
        {messages.data.map((msg, i) => (
          <li key={i}>{msg.text}</li>
        ))}
      </ul>
    </div>
  );
}
```

### Setting Up WebSocket Connection

```typescript
import { WebSocketConnection, createUseSubscription } from 'philjs-rpc';

const wsConnection = new WebSocketConnection({
  url: 'ws://localhost:3000/api/rpc',
  reconnect: {
    enabled: true,
    maxAttempts: 10,
    delay: 1000,
    maxDelay: 30000,
    backoffMultiplier: 1.5,
  },
  heartbeatInterval: 30000,
});

// Listen to connection events
wsConnection.on('connected', () => console.log('Connected'));
wsConnection.on('disconnected', () => console.log('Disconnected'));
wsConnection.on('reconnecting', ({ attempt, delay }) => {
  console.log(`Reconnecting (attempt ${attempt}) in ${delay}ms`);
});

await wsConnection.connect();
```

### Server-Sent Events (SSE) Fallback

For environments without WebSocket support:

```typescript
import { SSEConnection, createUseSSESubscription } from 'philjs-rpc';

const sseConnection = new SSEConnection({
  url: '/api/rpc/sse',
  reconnect: { enabled: true },
  heartbeatTimeout: 60000,
});

const priceUpdates = createUseSSESubscription(
  sseConnection,
  'onPriceUpdate'
)({ symbol: 'AAPL' });
```

### Automatic Transport Selection

```typescript
import { createAutoTransport } from 'philjs-rpc';

const { connection, type } = createAutoTransport({
  wsUrl: 'ws://localhost:3000/api/rpc',
  sseUrl: '/api/rpc/sse',
  preferWebSocket: true, // Prefer WebSocket, fallback to SSE
});

console.log(`Using ${type} transport`); // 'websocket' or 'sse'
```

### Links for Advanced Routing

Compose request/response transformations:

```typescript
import {
  createHttpLink,
  createWebSocketLink,
  createSplitLink,
  createRetryLink,
  createLoggingLink,
  createLinkChain,
} from 'philjs-rpc';

// HTTP link for queries/mutations
const httpLink = createHttpLink({
  url: '/api/rpc',
  headers: () => ({
    Authorization: `Bearer ${getToken()}`,
  }),
});

// WebSocket link for subscriptions
const wsLink = createWebSocketLink({
  url: 'ws://localhost:3000/api/rpc',
});

// Route based on operation type
const splitLink = createSplitLink({
  condition: (op) => op.type === 'subscription',
  true: wsLink,
  false: httpLink,
});

// Compose links
const link = createLinkChain([
  createLoggingLink({ enabled: true }),
  createRetryLink({ maxAttempts: 3 }),
  splitLink,
]);
```

### Subscription Middleware

Protect and control subscriptions:

```typescript
import {
  createSubscriptionAuthMiddleware,
  createSubscriptionRateLimitMiddleware,
  createBackpressureMiddleware,
  composeSubscriptionMiddleware,
} from 'philjs-rpc';

const subscriptionMiddleware = composeSubscriptionMiddleware([
  // Authentication
  createSubscriptionAuthMiddleware({
    isAuthenticated: (ctx) => !!ctx.user,
    hasPermission: (ctx, path) => {
      if (path.includes('admin')) {
        return ctx.user?.role === 'admin';
      }
      return true;
    },
  }),

  // Rate limiting
  createSubscriptionRateLimitMiddleware({
    maxSubscriptionsPerConnection: 10,
    maxSubscriptionsPerUser: 50,
    maxEventsPerSecond: 100,
  }),

  // Backpressure handling
  createBackpressureMiddleware({
    maxBufferSize: 100,
    strategy: 'drop-oldest',
  }),
]);
```

### Advanced Subscription Features

**Filtering:**

```typescript
import { createSubscriptionFilterMiddleware } from 'philjs-rpc';

const filterMiddleware = createSubscriptionFilterMiddleware({
  filter: (ctx, data) => {
    // Only send data relevant to user
    return data.userId === ctx.user?.id;
  },
});
```

**Multiplexing:**

```typescript
import { createMultiplexingMiddleware } from 'philjs-rpc';

const multiplexingMiddleware = createMultiplexingMiddleware({
  getKey: (input) => `room:${input.roomId}`,
  maxSubscriptionsPerKey: 1000,
});
```

**State Persistence:**

```typescript
import { createLocalStorageStateManager } from 'philjs-rpc';

const stateManager = createLocalStorageStateManager('app');

// Save/load subscription state
stateManager.save('last-room', { roomId: 'general' });
const state = stateManager.load('last-room');
```

For complete examples, see the [examples directory](./examples/README.md).

## License

MIT
