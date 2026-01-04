# @philjs/rpc

The `@philjs/rpc` package provides a tRPC-style type-safe RPC framework with end-to-end TypeScript inference, signal-based hooks, request batching, and multiple runtime adapters.

## Installation

```bash
npm install @philjs/rpc
```

## Features

- **End-to-End Type Safety** - Full TypeScript inference from server to client
- **Signal-Based Hooks** - `useQuery` and `useMutation` with reactive state
- **Request Batching** - Automatic request batching for performance
- **Multiple Runtimes** - Node.js, Express, Fetch API, Vercel, Netlify
- **Middleware** - Global and per-procedure middleware
- **Subscriptions** - Real-time subscriptions via SSE
- **Validation** - Built-in input validation with Zod

## Quick Start

### Server

```typescript
import { createAPI, createRouter, procedure, z } from '@philjs/rpc';

// Define procedures
const router = createRouter({
  users: createRouter({
    list: procedure
      .query(async () => {
        const users = await db.users.findMany();
        return users;
      }),

    byId: procedure
      .input(z.object({ id: z.string() }))
      .query(async ({ input }) => {
        return db.users.findUnique({ where: { id: input.id } });
      }),

    create: procedure
      .input(z.object({
        name: z.string(),
        email: z.string().email()
      }))
      .mutation(async ({ input }) => {
        return db.users.create({ data: input });
      }),
  }),
});

// Create API
export const api = createAPI({ router });
export type AppAPI = typeof api;
```

### Client

```typescript
import { createClient } from '@philjs/rpc/client';
import type { AppAPI } from './server/api';

const client = createClient<AppAPI>({
  url: '/api/rpc'
});

// Direct calls
const users = await client.users.list.fetch();
const user = await client.users.byId.fetch({ id: '123' });

// In components with hooks
function UsersList() {
  const users = client.users.list.useQuery();

  if (users.isLoading) return <Spinner />;
  if (users.isError) return <Error error={users.error} />;

  return (
    <ul>
      {users.data.map(user => (
        <li key={user.id}>{user.name}</li>
      ))}
    </ul>
  );
}
```

---

## Server Setup

### Creating the Router

```typescript
import { createRouter, procedure, z } from '@philjs/rpc';

const router = createRouter({
  // Nested routers
  posts: createRouter({
    // Query procedure (GET-like)
    list: procedure
      .input(z.object({
        limit: z.number().optional().default(10),
        cursor: z.string().optional()
      }))
      .query(async ({ input }) => {
        const posts = await db.posts.findMany({
          take: input.limit + 1,
          cursor: input.cursor ? { id: input.cursor } : undefined
        });

        let nextCursor: string | undefined;
        if (posts.length > input.limit) {
          const nextPost = posts.pop();
          nextCursor = nextPost?.id;
        }

        return { posts, nextCursor };
      }),

    // Mutation procedure (POST-like)
    create: procedure
      .input(z.object({
        title: z.string().min(1),
        content: z.string(),
        published: z.boolean().default(false)
      }))
      .mutation(async ({ input, ctx }) => {
        return db.posts.create({
          data: {
            ...input,
            authorId: ctx.user.id
          }
        });
      }),

    // Delete mutation
    delete: procedure
      .input(z.object({ id: z.string() }))
      .mutation(async ({ input }) => {
        await db.posts.delete({ where: { id: input.id } });
        return { success: true };
      }),
  }),
});
```

### Creating the API

```typescript
import { createAPI } from '@philjs/rpc';

export const api = createAPI({
  router,

  // Global middleware
  middleware: [
    // Logging middleware
    async ({ ctx, next }) => {
      const start = Date.now();
      const result = await next();
      console.log(`Request took ${Date.now() - start}ms`);
      return result;
    },

    // Auth middleware
    async ({ ctx, next }) => {
      if (!ctx.user) {
        throw new RPCError({
          code: 'UNAUTHORIZED',
          message: 'Not authenticated'
        });
      }
      return next();
    }
  ]
});

// Export type for client
export type AppAPI = typeof api;
```

### Request Handlers

```typescript
import {
  createHandler,
  createFetchHandler,
  createExpressHandler,
  createNodeHandler,
  createVercelHandler,
  createNetlifyHandler
} from '@philjs/rpc/server';
import type { HandlerOptions, ProcedureContext } from '@philjs/rpc';

const options: HandlerOptions = {
  // Create context from request
  createContext: async (req) => {
    const token = req.headers.authorization?.split(' ')[1];
    const user = token ? await verifyToken(token) : null;
    return { user };
  },

  // Global error handler
  onError: (error, ctx) => {
    console.error('RPC Error:', error);
    trackError(error);
  },

  // Enable request batching
  batching: true
};

// Fetch API (Cloudflare Workers, Deno, Bun)
const fetchHandler = createFetchHandler(api, options);
export default { fetch: fetchHandler };

// Express.js
import express from 'express';
const app = express();
app.use(express.json());
app.post('/api/rpc', createExpressHandler(api, options));

// Node.js HTTP
import http from 'http';
http.createServer(createNodeHandler(api, options)).listen(3000);

// Vercel Serverless
export default createVercelHandler(api, options);

// Netlify Functions
export const handler = createNetlifyHandler(api, options);
```

---

## Client Setup

### Creating the Client

```typescript
import { createClient } from '@philjs/rpc/client';
import type { ClientConfig } from '@philjs/rpc/client';
import type { AppAPI } from './server/api';

const config: ClientConfig = {
  // Base URL for API requests
  url: '/api/rpc',

  // Custom fetch implementation
  fetch: customFetch,

  // Headers (static or dynamic)
  headers: () => ({
    Authorization: `Bearer ${getToken()}`
  }),

  // Transform requests
  transformRequest: (request) => {
    console.log('Request:', request);
    return request;
  },

  // Transform responses
  transformResponse: (response) => {
    console.log('Response:', response);
    return response;
  },

  // Global error handler
  onError: (error) => {
    if (error.code === 'UNAUTHORIZED') {
      redirectToLogin();
    }
  },

  // Enable request batching
  batching: true,
  batchWindowMs: 10 // Batch requests within 10ms
};

export const client = createClient<AppAPI>(config);
```

### Direct Fetch Calls

```typescript
// Query procedures
const users = await client.users.list.fetch();
const user = await client.users.byId.fetch({ id: '123' });

// Mutation procedures
const newUser = await client.users.create.fetch({
  name: 'John Doe',
  email: 'john@example.com'
});

// With error handling
try {
  const result = await client.posts.delete.fetch({ id: postId });
} catch (error) {
  if (error instanceof RPCError) {
    console.error(error.code, error.message);
  }
}
```

---

## Query Hook

Use `useQuery` for data fetching with automatic caching and refetching:

```typescript
import type { UseQueryOptions, UseQueryResult } from '@philjs/rpc/client';

function UserProfile({ userId }: { userId: string }) {
  const user = client.users.byId.useQuery(
    { id: userId },
    {
      // Enable/disable the query
      enabled: !!userId,

      // Cache settings
      staleTime: 60000, // Consider fresh for 1 minute

      // Retry settings
      retry: 3,
      retryDelay: 1000,

      // Callbacks
      onSuccess: (data) => console.log('Loaded:', data),
      onError: (error) => console.error('Error:', error),

      // Refetching
      refetchOnWindowFocus: true,
      refetchInterval: 30000, // Poll every 30s

      // Initial/placeholder data
      initialData: cachedUser,
      placeholderData: { name: 'Loading...', email: '' }
    }
  );

  // Query state
  if (user.isLoading) return <Spinner />;
  if (user.isError) return <Error error={user.error} />;
  if (user.isStale) console.log('Data is stale');

  return (
    <div>
      <h1>{user.data.name}</h1>
      <p>{user.data.email}</p>

      <button
        onClick={() => user.refetch()}
        disabled={user.isFetching}
      >
        {user.isFetching ? 'Refreshing...' : 'Refresh'}
      </button>

      <button onClick={() => user.remove()}>
        Clear Cache
      </button>
    </div>
  );
}
```

### UseQueryResult

```typescript
interface UseQueryResult<TData> {
  data: TData | undefined;
  error: RPCError | null;
  isLoading: boolean;    // Initial loading
  isFetching: boolean;   // Any fetch in progress
  isSuccess: boolean;    // Has data, no error
  isError: boolean;      // Has error
  isStale: boolean;      // Data is stale
  refetch: () => Promise<void>;
  remove: () => void;    // Clear from cache
}
```

---

## Mutation Hook

Use `useMutation` for data modifications:

```typescript
import type { UseMutationOptions, UseMutationResult } from '@philjs/rpc/client';

function CreateUserForm() {
  const createUser = client.users.create.useMutation({
    // Called before mutation
    onMutate: async (input) => {
      // Optimistic update
      const previousUsers = queryCache.get('users.list');
      queryCache.set('users.list', [...previousUsers, { ...input, id: 'temp' }]);
      return { previousUsers };
    },

    // Called on success
    onSuccess: (data, input) => {
      toast.success(`Created user: ${data.name}`);
      invalidateQueries('users');
    },

    // Called on error
    onError: (error, input, context) => {
      toast.error(error.message);
      // Rollback optimistic update
      if (context?.previousUsers) {
        queryCache.set('users.list', context.previousUsers);
      }
    },

    // Called after success or error
    onSettled: (data, error, input) => {
      console.log('Mutation settled');
    },

    // Retry failed mutations
    retry: 2
  });

  const handleSubmit = async (formData: FormData) => {
    const input = {
      name: formData.get('name') as string,
      email: formData.get('email') as string
    };

    // Fire and forget
    createUser.mutate(input);

    // Or await result
    try {
      const user = await createUser.mutateAsync(input);
      router.push(`/users/${user.id}`);
    } catch (error) {
      // Error already handled in onError
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input name="name" required />
      <input name="email" type="email" required />

      <button
        type="submit"
        disabled={createUser.isLoading}
      >
        {createUser.isLoading ? 'Creating...' : 'Create User'}
      </button>

      {createUser.isError && (
        <p class="error">{createUser.error.message}</p>
      )}

      {createUser.isSuccess && (
        <p class="success">User created!</p>
      )}

      <button type="button" onClick={() => createUser.reset()}>
        Reset
      </button>
    </form>
  );
}
```

### UseMutationResult

```typescript
interface UseMutationResult<TData, TInput> {
  data: TData | undefined;
  error: RPCError | null;
  isLoading: boolean;
  isSuccess: boolean;
  isError: boolean;
  isIdle: boolean;
  mutate: (input: TInput) => void;
  mutateAsync: (input: TInput) => Promise<TData>;
  reset: () => void;
}
```

---

## Middleware

### Global Middleware

```typescript
import { createAPI, MiddlewareFn } from '@philjs/rpc';

const loggingMiddleware: MiddlewareFn = async ({ ctx, path, type, next }) => {
  console.log(`[${type}] ${path}`);
  const start = Date.now();

  const result = await next();

  console.log(`[${type}] ${path} - ${Date.now() - start}ms`);
  return result;
};

const authMiddleware: MiddlewareFn = async ({ ctx, next }) => {
  if (!ctx.user) {
    throw new RPCError({
      code: 'UNAUTHORIZED',
      message: 'Authentication required'
    });
  }
  return next();
};

const rateLimitMiddleware: MiddlewareFn = async ({ ctx, next }) => {
  const key = ctx.user?.id ?? ctx.ip;
  const limited = await checkRateLimit(key);

  if (limited) {
    throw new RPCError({
      code: 'TOO_MANY_REQUESTS',
      message: 'Rate limit exceeded'
    });
  }

  return next();
};

const api = createAPI({
  router,
  middleware: [
    loggingMiddleware,
    authMiddleware,
    rateLimitMiddleware
  ]
});
```

### Procedure Middleware

```typescript
const router = createRouter({
  admin: createRouter({
    users: procedure
      .use(async ({ ctx, next }) => {
        // Check admin role
        if (ctx.user?.role !== 'admin') {
          throw new RPCError({
            code: 'FORBIDDEN',
            message: 'Admin access required'
          });
        }
        return next();
      })
      .query(async ({ ctx }) => {
        return db.users.findMany();
      }),
  }),
});
```

---

## Input Validation

Built-in Zod validation:

```typescript
import { procedure, z } from '@philjs/rpc';

const createUserProcedure = procedure
  .input(z.object({
    name: z.string().min(2).max(100),
    email: z.string().email(),
    age: z.number().int().min(13).optional(),
    role: z.enum(['user', 'admin']).default('user'),
    metadata: z.record(z.string()).optional()
  }))
  .mutation(async ({ input }) => {
    // input is fully typed and validated
    return db.users.create({ data: input });
  });

// Output validation
const getUserProcedure = procedure
  .input(z.object({ id: z.string() }))
  .output(z.object({
    id: z.string(),
    name: z.string(),
    email: z.string().email()
  }))
  .query(async ({ input }) => {
    const user = await db.users.findUnique({ where: { id: input.id } });
    return user; // Output is validated before sending
  });
```

---

## Subscriptions

Real-time subscriptions via Server-Sent Events:

```typescript
// Server
import { procedure, z } from '@philjs/rpc';

const subscriptionRouter = createRouter({
  messages: createRouter({
    // Subscribe to new messages
    onMessage: procedure
      .input(z.object({ roomId: z.string() }))
      .subscription(async function* ({ input }) {
        const channel = pubsub.subscribe(`room:${input.roomId}`);

        try {
          for await (const message of channel) {
            yield message;
          }
        } finally {
          channel.unsubscribe();
        }
      }),
  }),
});

// Client
function ChatRoom({ roomId }: { roomId: string }) {
  const [messages, setMessages] = useState<Message[]>([]);

  useEffect(() => {
    const subscription = client.messages.onMessage.subscribe(
      { roomId },
      {
        onData: (message) => {
          setMessages(prev => [...prev, message]);
        },
        onError: (error) => {
          console.error('Subscription error:', error);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [roomId]);

  return (
    <div>
      {messages.map(msg => (
        <Message key={msg.id} message={msg} />
      ))}
    </div>
  );
}
```

---

## Cache Management

```typescript
import { invalidateQueries, prefetchQuery, getQueryCache } from '@philjs/rpc/client';

// Invalidate queries after mutation
const deleteUser = client.users.delete.useMutation({
  onSuccess: () => {
    invalidateQueries('users'); // Invalidate all users queries
  }
});

// Prefetch on hover
function UserLink({ userId }: { userId: string }) {
  const handleMouseEnter = () => {
    prefetchQuery(client.users.byId, { id: userId });
  };

  return (
    <a href={`/users/${userId}`} onMouseEnter={handleMouseEnter}>
      View User
    </a>
  );
}

// Direct cache access
const cache = getQueryCache();
const cachedUser = cache.get<User>('users.byId:{"id":"123"}');
cache.invalidate('users.list');
cache.invalidateAll();
```

---

## Error Handling

```typescript
import { RPCError } from '@philjs/rpc';

// Throwing errors in procedures
const deletePost = procedure
  .input(z.object({ id: z.string() }))
  .mutation(async ({ input, ctx }) => {
    const post = await db.posts.findUnique({ where: { id: input.id } });

    if (!post) {
      throw new RPCError({
        code: 'NOT_FOUND',
        message: 'Post not found'
      });
    }

    if (post.authorId !== ctx.user.id) {
      throw new RPCError({
        code: 'FORBIDDEN',
        message: 'You can only delete your own posts'
      });
    }

    await db.posts.delete({ where: { id: input.id } });
    return { success: true };
  });

// Error codes
type RPCErrorCode =
  | 'BAD_REQUEST'          // 400
  | 'UNAUTHORIZED'         // 401
  | 'FORBIDDEN'            // 403
  | 'NOT_FOUND'            // 404
  | 'METHOD_NOT_ALLOWED'   // 405
  | 'TIMEOUT'              // 408
  | 'CONFLICT'             // 409
  | 'PRECONDITION_FAILED'  // 412
  | 'PAYLOAD_TOO_LARGE'    // 413
  | 'UNPROCESSABLE_ENTITY' // 422
  | 'TOO_MANY_REQUESTS'    // 429
  | 'INTERNAL_SERVER_ERROR'; // 500
```

---

## Types Reference

```typescript
// Client configuration
interface ClientConfig {
  url: string;
  fetch?: typeof fetch;
  headers?: Record<string, string> | (() => Record<string, string> | Promise<Record<string, string>>);
  transformRequest?: (request: RPCRequest) => RPCRequest | Promise<RPCRequest>;
  transformResponse?: <T>(response: RPCResponse<T>) => RPCResponse<T>;
  onError?: (error: RPCError) => void;
  batching?: boolean;
  batchWindowMs?: number;
}

// Request/Response types
interface RPCRequest {
  path: string;
  type: 'query' | 'mutation' | 'subscription';
  input?: unknown;
}

interface RPCResponse<T = unknown> {
  result?: { data: T };
  error?: { code: RPCErrorCode; message: string };
}

// Handler options
interface HandlerOptions {
  basePath?: string;
  createContext?: (req: RequestAdapter) => ProcedureContext | Promise<ProcedureContext>;
  onError?: (error: unknown, ctx: ProcedureContext) => void;
  batching?: boolean;
}

// Query options
interface UseQueryOptions<TData> {
  enabled?: boolean;
  staleTime?: number;
  retry?: number;
  retryDelay?: number;
  onSuccess?: (data: TData) => void;
  onError?: (error: RPCError) => void;
  refetchOnWindowFocus?: boolean;
  refetchInterval?: number;
  initialData?: TData;
  placeholderData?: TData;
}

// Mutation options
interface UseMutationOptions<TData, TInput> {
  onMutate?: (input: TInput) => unknown | Promise<unknown>;
  onSuccess?: (data: TData, input: TInput) => void;
  onError?: (error: RPCError, input: TInput, context?: unknown) => void;
  onSettled?: (data: TData | undefined, error: RPCError | null, input: TInput) => void;
  retry?: number;
}
```

---

## Best Practices

### 1. Organize Routers by Domain

```typescript
const router = createRouter({
  users: usersRouter,
  posts: postsRouter,
  comments: commentsRouter,
  auth: authRouter,
  admin: adminRouter
});
```

### 2. Use Middleware for Cross-Cutting Concerns

```typescript
// Reusable middleware
const withAuth = middleware(async ({ ctx, next }) => {
  if (!ctx.user) throw new RPCError({ code: 'UNAUTHORIZED' });
  return next();
});

const withAdmin = middleware(async ({ ctx, next }) => {
  if (ctx.user?.role !== 'admin') throw new RPCError({ code: 'FORBIDDEN' });
  return next();
});
```

### 3. Leverage Type Inference

```typescript
// Let TypeScript infer types
const user = await client.users.byId.fetch({ id: '123' });
// user is fully typed based on server return type
```

### 4. Batch Related Requests

```typescript
// These will be batched into a single HTTP request
const [users, posts, stats] = await Promise.all([
  client.users.list.fetch(),
  client.posts.list.fetch(),
  client.stats.get.fetch()
]);
```

---

## API Reference

| Export | Description |
|--------|-------------|
| `createAPI` | Create API definition |
| `createRouter` | Create router with procedures |
| `procedure` | Procedure builder |
| `z` | Zod validation |
| `createClient` | Create type-safe client |
| `createHandler` | Create generic handler |
| `createFetchHandler` | Fetch API handler |
| `createExpressHandler` | Express.js handler |
| `createNodeHandler` | Node.js HTTP handler |
| `createVercelHandler` | Vercel handler |
| `createNetlifyHandler` | Netlify handler |
| `RPCError` | Error class |
| `invalidateQueries` | Invalidate cached queries |
| `prefetchQuery` | Prefetch query data |
| `getQueryCache` | Get cache instance |

---

## Next Steps

- [@philjs/graphql for GraphQL](../graphql/overview.md)
- [@philjs/realtime for WebSocket](../realtime/overview.md)
- [@philjs/api Server Actions](../api/overview.md)
