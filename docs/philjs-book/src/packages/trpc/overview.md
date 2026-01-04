# @philjs/trpc

Type-safe RPC layer for PhilJS with server middleware, platform adapters, WebSocket subscriptions, and batched requests.

## Installation

```bash
npm install @philjs/trpc
```

## Features

- **Type-safe RPC** - End-to-end type safety
- **Server Middleware** - Auth, rate limiting, logging, caching
- **Platform Adapters** - Express, Fastify, Hono, Cloudflare, Lambda
- **WebSocket Subscriptions** - Real-time data
- **Batched Requests** - Combine multiple calls
- **Query Caching** - Client-side caching

## Quick Start

```typescript
// server.ts
import { createRouter, createAuthMiddleware, validateInput } from '@philjs/trpc';
import { z } from 'zod';

const router = createRouter<{ userId?: string }>();

// Define a query
router.query
  .input(validateInput(z.object({ id: z.string() })))
  .handler(async ({ ctx, input }) => {
    return await getUser(input.id);
  })('getUser');

// Define a mutation
router.mutation
  .use(createAuthMiddleware())
  .input(validateInput(z.object({ name: z.string() })))
  .handler(async ({ ctx, input }) => {
    return await createUser(input.name, ctx.userId!);
  })('createUser');

export type AppRouter = typeof router;

// client.ts
import { createClient } from '@philjs/trpc';
import type { AppRouter } from './server';

const client = createClient<AppRouter>({
  url: 'http://localhost:3000/rpc',
});

// Type-safe calls
const user = await client.query('getUser', { id: '123' });
const newUser = await client.mutate('createUser', { name: 'John' });
```

## Server

### Creating a Router

```typescript
import { createRouter } from '@philjs/trpc';

// Define your context type
interface AppContext {
  userId?: string;
  sessionId?: string;
  isAdmin?: boolean;
}

const router = createRouter<AppContext>();
```

### Defining Queries

```typescript
import { validateInput } from '@philjs/trpc';
import { z } from 'zod';

// Simple query
router.query
  .handler(async ({ ctx }) => {
    return { status: 'ok' };
  })('health');

// Query with input validation
router.query
  .input(validateInput(z.object({
    id: z.string().uuid(),
  })))
  .handler(async ({ ctx, input }) => {
    return await getUserById(input.id);
  })('getUser');

// Query with middleware
router.query
  .use(createAuthMiddleware())
  .input(validateInput(z.object({ limit: z.number().default(10) })))
  .handler(async ({ ctx, input }) => {
    return await getMyPosts(ctx.userId!, input.limit);
  })('getMyPosts');
```

### Defining Mutations

```typescript
router.mutation
  .use(createAuthMiddleware())
  .input(validateInput(z.object({
    title: z.string().min(1),
    content: z.string(),
  })))
  .handler(async ({ ctx, input }) => {
    return await createPost({
      ...input,
      authorId: ctx.userId!,
    });
  })('createPost');

router.mutation
  .use(createAuthMiddleware())
  .use(createRoleMiddleware(['admin']))
  .input(validateInput(z.object({ userId: z.string() })))
  .handler(async ({ ctx, input }) => {
    return await deleteUser(input.userId);
  })('deleteUser');
```

### Defining Subscriptions

```typescript
router.subscription
  .use(createAuthMiddleware())
  .input(validateInput(z.object({ channelId: z.string() })))
  .handler(async ({ ctx, input }) => {
    // Return an async iterator or observable
    return subscribeToChannel(input.channelId);
  })('onMessage');
```

### Handling Requests

```typescript
// Get all procedure definitions
const procedures = router.getProcedures();

// Handle a request manually
const result = await router.handle(
  { method: 'query', path: 'getUser', input: { id: '123' } },
  { userId: 'user-456' }
);

if (result.error) {
  console.error(result.error.code, result.error.message);
} else {
  console.log(result.data);
}
```

## Middleware

### Authentication Middleware

```typescript
import { createAuthMiddleware, RPCError, ErrorCodes } from '@philjs/trpc';

// Built-in auth middleware
const authMiddleware = createAuthMiddleware<AppContext>();

// Use in procedures
router.query
  .use(authMiddleware)
  .handler(async ({ ctx }) => {
    // ctx.user is guaranteed to exist
    return await getProfile(ctx.userId!);
  })('getProfile');
```

### Role-Based Access Control

```typescript
import { createRoleMiddleware } from '@philjs/trpc';

// Only admins
const adminOnly = createRoleMiddleware<AppContext>(['admin']);

// Admins or moderators
const moderatorAccess = createRoleMiddleware<AppContext>(['admin', 'moderator']);

router.mutation
  .use(createAuthMiddleware())
  .use(adminOnly)
  .handler(async ({ ctx, input }) => {
    return await performAdminAction(input);
  })('adminAction');
```

### Rate Limiting

```typescript
import { createRateLimitMiddleware } from '@philjs/trpc';

const rateLimiter = createRateLimitMiddleware<AppContext>({
  windowMs: 60000,        // 1 minute window
  max: 100,               // Max 100 requests per window
  keyGenerator: (ctx) => ctx.userId || 'anonymous',
});

router.mutation
  .use(rateLimiter)
  .handler(async ({ input }) => {
    return await sendEmail(input);
  })('sendEmail');
```

### Logging Middleware

```typescript
import { createLoggingMiddleware } from '@philjs/trpc';

const logger = createLoggingMiddleware<AppContext>({
  logger: {
    info: (msg) => console.log('[INFO]', msg),
    error: (msg) => console.error('[ERROR]', msg),
  },
});

router.query
  .use(logger)
  .handler(async ({ input }) => {
    return await fetchData(input);
  })('getData');
```

### Caching Middleware

```typescript
import { createCacheMiddleware } from '@philjs/trpc';

const cache = createCacheMiddleware<AppContext>({
  ttl: 60000,              // Cache for 1 minute
  keyGenerator: (ctx) => `cache:${ctx.userId}`,
});

router.query
  .use(cache)
  .handler(async ({ ctx }) => {
    return await getExpensiveData(ctx.userId!);
  })('getCachedData');
```

### Custom Middleware

```typescript
import type { MiddlewareFunction } from '@philjs/trpc';

const timingMiddleware: MiddlewareFunction<AppContext> = async (ctx, next) => {
  const start = Date.now();
  await next();
  console.log(`Request took ${Date.now() - start}ms`);
};

const validationMiddleware: MiddlewareFunction<AppContext> = async (ctx, next) => {
  if (!ctx.sessionId) {
    throw new RPCError({
      code: ErrorCodes.BAD_REQUEST,
      message: 'Session ID required',
      statusCode: 400,
    });
  }
  await next();
};

router.query
  .use(timingMiddleware)
  .use(validationMiddleware)
  .handler(async ({ ctx }) => {
    return { sessionId: ctx.sessionId };
  })('getSession');
```

## Error Handling

### Built-in Error Codes

```typescript
import { ErrorCodes, RPCError } from '@philjs/trpc';

// Available error codes
ErrorCodes.BAD_REQUEST        // 400
ErrorCodes.UNAUTHORIZED       // 401
ErrorCodes.FORBIDDEN          // 403
ErrorCodes.NOT_FOUND          // 404
ErrorCodes.CONFLICT           // 409
ErrorCodes.TOO_MANY_REQUESTS  // 429
ErrorCodes.INTERNAL_ERROR     // 500
```

### Throwing Errors

```typescript
router.query
  .handler(async ({ input }) => {
    const user = await findUser(input.id);

    if (!user) {
      throw new RPCError({
        code: ErrorCodes.NOT_FOUND,
        message: `User ${input.id} not found`,
        statusCode: 404,
      });
    }

    return user;
  })('getUser');
```

## Client

### Creating a Client

```typescript
import { createClient } from '@philjs/trpc';

const client = createClient({
  url: 'http://localhost:3000/rpc',
  headers: {
    'X-API-Key': 'my-api-key',
  },
});

// Or with dynamic headers
const client = createClient({
  url: 'http://localhost:3000/rpc',
  headers: async () => ({
    Authorization: `Bearer ${await getToken()}`,
  }),
});
```

### Making Queries

```typescript
// Type-safe query
const user = await client.query<{ id: string }, User>('getUser', { id: '123' });

// With error handling
try {
  const posts = await client.query('getPosts', { limit: 10 });
} catch (error) {
  console.error('Query failed:', error.message);
}
```

### Making Mutations

```typescript
// Type-safe mutation
const newPost = await client.mutate<CreatePostInput, Post>('createPost', {
  title: 'Hello',
  content: 'World',
});
```

### WebSocket Subscriptions

```typescript
const subscription = client.subscribe<{ channelId: string }, Message>(
  'onMessage',
  { channelId: 'general' },
  {
    onStarted: () => console.log('Subscription started'),
    onData: (message) => console.log('New message:', message),
    onError: (error) => console.error('Subscription error:', error),
    onComplete: () => console.log('Subscription complete'),
    onStopped: () => console.log('Subscription stopped'),
  }
);

// Unsubscribe when done
subscription.unsubscribe();
```

### Data Transformers

```typescript
import superjson from 'superjson';

const client = createClient({
  url: 'http://localhost:3000/rpc',
  transformer: {
    serialize: (data) => superjson.stringify(data),
    deserialize: (data) => superjson.parse(data as string),
  },
});
```

## Batched Client

### Setup

```typescript
import { createBatchedClient } from '@philjs/trpc';

const client = createBatchedClient({
  url: 'http://localhost:3000/rpc',
  batch: {
    maxItems: 10,       // Max items per batch
    waitMs: 10,         // Wait time before sending
  },
});
```

### Usage

```typescript
// These calls are automatically batched
const [user, posts, comments] = await Promise.all([
  client.query('getUser', { id: '123' }),
  client.query('getPosts', { userId: '123' }),
  client.query('getComments', { postId: '456' }),
]);

// Force flush
await client.flush();
```

## Query Caching

### Creating a Cache

```typescript
import { createQueryCache } from '@philjs/trpc';

const cache = createQueryCache({
  ttl: 1000 * 60 * 5,   // 5 minutes
});

// Get cached value
const user = cache.get<User>('user:123');

// Set value
cache.set('user:123', userData);

// Check if exists
if (cache.has('user:123')) {
  // ...
}

// Invalidate
cache.invalidate('user:123');

// Clear all
cache.invalidateAll();
```

### Cached Query Function

```typescript
import { createCachedQuery } from '@philjs/trpc';

const getUser = createCachedQuery(
  async (id: string) => {
    return await client.query('getUser', { id });
  },
  {
    ttl: 60000,
    keyFn: (id) => `user:${id}`,
  }
);

// First call fetches, subsequent calls use cache
const user1 = await getUser('123');
const user2 = await getUser('123'); // From cache
```

## Platform Adapters

### Express

```typescript
import express from 'express';
import { createExpressAdapter } from '@philjs/trpc';

const app = express();
app.use(express.json());

const handler = createExpressAdapter({
  router,
  createContext: async ({ req }) => ({
    userId: req.headers['x-user-id'] as string,
  }),
  onError: (error, ctx) => {
    console.error('RPC Error:', error);
  },
});

app.post('/rpc', handler);
app.listen(3000);
```

### Fastify

```typescript
import Fastify from 'fastify';
import { createFastifyAdapter } from '@philjs/trpc';

const fastify = Fastify();

const handler = createFastifyAdapter({
  router,
  createContext: async ({ req }) => ({
    userId: req.headers['x-user-id'] as string,
  }),
});

fastify.post('/rpc', handler);
fastify.listen({ port: 3000 });
```

### Hono

```typescript
import { Hono } from 'hono';
import { createHonoAdapter } from '@philjs/trpc';

const app = new Hono();

const handler = createHonoAdapter({
  router,
  createContext: async ({ req }) => ({
    userId: req.header('x-user-id'),
  }),
});

app.post('/rpc', handler);
export default app;
```

### Cloudflare Workers

```typescript
import { createCloudflareAdapter } from '@philjs/trpc';

const adapter = createCloudflareAdapter({
  router,
  createContext: async ({ req }) => ({
    userId: req.headers.get('x-user-id'),
  }),
});

export default {
  fetch: adapter.fetch,
};
```

### AWS Lambda

```typescript
import { createLambdaAdapter } from '@philjs/trpc';

const handler = createLambdaAdapter({
  router,
  createContext: async ({ req }) => ({
    userId: req.headers['x-user-id'],
  }),
});

export { handler };
```

### Standalone Server

```typescript
import { createStandaloneServer } from '@philjs/trpc';

const server = createStandaloneServer({
  router,
  port: 3000,
  createContext: async ({ req }) => ({
    userId: req.headers['x-user-id'],
  }),
});

await server.listen();
console.log('Server running on port 3000');

// Graceful shutdown
process.on('SIGTERM', async () => {
  await server.close();
});
```

## Types Reference

```typescript
// Base context
interface BaseContext {
  [key: string]: unknown;
}

// Auth context
interface AuthContext extends BaseContext {
  user?: User;
}

// User type
interface User {
  id: string;
  email?: string;
  role?: string;
}

// Middleware function
type MiddlewareFunction<T> = (
  ctx: T,
  next: () => Promise<unknown>
) => Promise<unknown>;

// Client config
interface ClientConfig {
  url: string;
  headers?: Record<string, string> | (() => Promise<Record<string, string>>);
  transformer?: DataTransformer;
}

// Data transformer
interface DataTransformer {
  serialize: (data: unknown) => unknown;
  deserialize: (data: unknown) => unknown;
}

// Batch config
interface BatchConfig {
  maxItems?: number;
  waitMs?: number;
}

// Subscription callbacks
interface SubscriptionCallbacks<T> {
  onData: (data: T) => void;
  onError?: (error: Error) => void;
  onComplete?: () => void;
  onStarted?: () => void;
  onStopped?: () => void;
}

// Adapter config
interface AdapterConfig {
  router: unknown;
  createContext?: (opts: { req: Request }) => Promise<BaseContext>;
  onError?: (error: TRPCClientErrorLike, ctx: BaseContext) => void;
}
```

## API Reference

### Server

| Export | Description |
|--------|-------------|
| `createRouter<T>()` | Create RPC router |
| `createAuthMiddleware<T>()` | Authentication middleware |
| `createRoleMiddleware<T>(roles)` | Role-based access middleware |
| `createRateLimitMiddleware<T>(options)` | Rate limiting middleware |
| `createLoggingMiddleware<T>(options?)` | Logging middleware |
| `createCacheMiddleware<T>(options)` | Caching middleware |
| `validateInput(schema)` | Input validation helper |
| `RPCError` | RPC error class |
| `ErrorCodes` | Common error codes |

### Client

| Export | Description |
|--------|-------------|
| `createClient<T>(config)` | Create RPC client |
| `createBatchedClient<T>(config)` | Create batched client |
| `createQueryCache(options?)` | Create query cache |
| `createCachedQuery(fn, options?)` | Create cached query function |

### Adapters

| Export | Description |
|--------|-------------|
| `createExpressAdapter(config)` | Express adapter |
| `createFastifyAdapter(config)` | Fastify adapter |
| `createHonoAdapter(config)` | Hono adapter |
| `createCloudflareAdapter(config)` | Cloudflare Workers adapter |
| `createLambdaAdapter(config)` | AWS Lambda adapter |
| `createStandaloneServer(config)` | Standalone HTTP server |

## Example: Complete API

```typescript
// server/router.ts
import {
  createRouter,
  createAuthMiddleware,
  createRateLimitMiddleware,
  createLoggingMiddleware,
  validateInput,
  RPCError,
  ErrorCodes,
} from '@philjs/trpc';
import { z } from 'zod';

interface AppContext {
  userId?: string;
  isAdmin?: boolean;
}

export const router = createRouter<AppContext>();

// Middleware
const auth = createAuthMiddleware<AppContext>();
const rateLimit = createRateLimitMiddleware<AppContext>({
  windowMs: 60000,
  max: 100,
  keyGenerator: (ctx) => ctx.userId || 'anon',
});
const logger = createLoggingMiddleware<AppContext>();

// Public queries
router.query
  .use(logger)
  .handler(async () => ({ status: 'ok', time: new Date() }))('health');

// Protected queries
router.query
  .use(logger)
  .use(auth)
  .input(validateInput(z.object({ limit: z.number().default(10) })))
  .handler(async ({ ctx, input }) => {
    return await getPosts(ctx.userId!, input.limit);
  })('getPosts');

// Protected mutations
router.mutation
  .use(logger)
  .use(auth)
  .use(rateLimit)
  .input(validateInput(z.object({
    title: z.string().min(1).max(200),
    content: z.string().min(1),
  })))
  .handler(async ({ ctx, input }) => {
    return await createPost({
      ...input,
      authorId: ctx.userId!,
    });
  })('createPost');

export type AppRouter = typeof router;

// server/index.ts
import { createExpressAdapter } from '@philjs/trpc';
import express from 'express';
import { router } from './router';

const app = express();
app.use(express.json());

app.post('/rpc', createExpressAdapter({
  router,
  createContext: async ({ req }) => ({
    userId: await verifyToken(req.headers.authorization),
  }),
}));

app.listen(3000);

// client/api.ts
import { createClient, createCachedQuery } from '@philjs/trpc';
import type { AppRouter } from '../server/router';

export const api = createClient<AppRouter>({
  url: 'http://localhost:3000/rpc',
  headers: async () => ({
    Authorization: `Bearer ${await getAuthToken()}`,
  }),
});

// Cached query for frequently accessed data
export const getPostsCached = createCachedQuery(
  (limit: number) => api.query('getPosts', { limit }),
  { ttl: 30000 }
);
```
