# PhilJS Treaty Client

Eden Treaty-style type-safe client for PhilJS RPC. Provides a proxy-based API with full type inference from the server, eliminating the need for code generation while maintaining complete type safety.

## Features

- **Full Type Inference**: Types are automatically inferred from your server API definition
- **Proxy-Based API**: No code generation required - just TypeScript magic
- **Multiple HTTP Methods**: Support for GET, POST, PUT, PATCH, DELETE
- **Request Interceptors**: Modify requests before they're sent
- **Response Transformers**: Transform responses after they're received
- **Retry Logic**: Built-in retry with exponential backoff
- **Timeout Handling**: Per-request or global timeouts
- **AbortController Support**: Cancel requests in flight
- **WebSocket Support**: Type-safe WebSocket connections (when supported by server)
- **Error Handling**: Rich error types with full context

## Installation

```bash
npm install philjs-rpc zod
```

## Quick Start

### Server Setup

```typescript
import { createAPI, procedure } from 'philjs-rpc';
import { z } from 'zod';

// Define your API
export const api = createAPI({
  users: {
    list: procedure.query(async () => {
      return [
        { id: '1', name: 'Alice', email: 'alice@example.com' },
      ];
    }),

    byId: procedure
      .input(z.object({ id: z.string() }))
      .query(async ({ input }) => {
        return { id: input.id, name: 'Alice' };
      }),

    create: procedure
      .input(z.object({
        name: z.string(),
        email: z.string().email()
      }))
      .mutation(async ({ input }) => {
        return { id: '123', ...input };
      }),
  },
});

// Export the type
export type AppAPI = typeof api;
```

### Client Setup

```typescript
import { treaty } from 'philjs-rpc/treaty';
import type { AppAPI } from './server/api';

// Create the client
const client = treaty<AppAPI>('http://localhost:3000/api');

// Use it with full type safety
const users = await client.users.list.get();
const user = await client.users.byId.get({ id: '1' });
const newUser = await client.users.create.post({
  name: 'Bob',
  email: 'bob@example.com',
});
```

## API Reference

### Creating a Client

#### Basic Client

```typescript
const client = treaty<AppAPI>('http://localhost:3000/api');
```

#### Client with Configuration

```typescript
const client = treaty<AppAPI>('http://localhost:3000/api', {
  // Default request options
  defaults: {
    timeout: 30000,
    headers: { 'X-Custom': 'value' },
  },

  // Request interceptor
  onRequest: async (config) => {
    config.headers['Authorization'] = `Bearer ${getToken()}`;
    return config;
  },

  // Response interceptor
  onResponse: async (response) => {
    console.log('Response:', response);
    return response;
  },

  // Error interceptor
  onError: async (error) => {
    console.error('Error:', error.message);
  },

  // Custom fetch implementation
  fetch: customFetch,
});
```

#### Client with Utilities

```typescript
const { client, utils } = createTreatyClient<AppAPI>({
  baseUrl: 'http://localhost:3000/api',
});

// Batch requests
const [users, posts] = await utils.batch([
  () => client.users.list.get(),
  () => client.posts.list.get(),
] as const);

// Custom request
const result = await utils.request('custom/path', {
  method: 'POST',
  body: { data: 'test' },
});
```

### HTTP Methods

```typescript
// GET request
await client.users.list.get();
await client.users.byId.get({ id: '1' });

// POST request
await client.users.create.post({
  name: 'Alice',
  email: 'alice@example.com',
});

// PUT request
await client.users.update.put({
  id: '1',
  name: 'Alice Updated',
});

// PATCH request
await client.users.patch.patch({
  id: '1',
  email: 'newemail@example.com',
});

// DELETE request
await client.users.delete.delete({ id: '1' });
```

### Request Options

Every request method accepts an optional second parameter with request options:

```typescript
await client.users.list.get({
  // Custom headers
  headers: {
    'Authorization': 'Bearer token',
    'X-Custom': 'value',
  },

  // Request timeout (ms)
  timeout: 5000,

  // AbortSignal for cancellation
  signal: controller.signal,

  // Retry configuration
  retry: {
    count: 3,           // Number of retries
    delay: 1000,        // Initial delay (ms)
    backoff: 2,         // Backoff multiplier
    statusCodes: [500], // Retry only on these status codes
  },

  // Custom fetch
  fetch: customFetch,
});
```

### Error Handling

```typescript
import { TreatyError } from 'philjs-rpc/treaty';

try {
  await client.users.byId.get({ id: 'invalid' });
} catch (error) {
  if (error instanceof TreatyError) {
    console.error('Error code:', error.code);
    console.error('Status:', error.status);
    console.error('Message:', error.message);
    console.error('Response:', error.response);
    console.error('Config:', error.config);
  }
}
```

### Retry Logic

```typescript
// Retry up to 3 times with exponential backoff
const result = await client.users.flaky.get(
  { param: 'value' },
  {
    retry: {
      count: 3,
      delay: 1000,
      backoff: 2, // 1s, 2s, 4s
      statusCodes: [408, 500, 502, 503], // Retry on these codes
    },
  }
);
```

### Timeout Handling

```typescript
// Global timeout
const client = treaty<AppAPI>('http://localhost:3000/api', {
  defaults: { timeout: 10000 },
});

// Per-request timeout
await client.users.list.get({
  timeout: 5000, // 5 second timeout
});
```

### Request Cancellation

```typescript
const controller = new AbortController();

// Start request
const promise = client.users.list.get({
  signal: controller.signal,
});

// Cancel after 1 second
setTimeout(() => controller.abort(), 1000);

try {
  await promise;
} catch (error) {
  console.log('Request cancelled');
}
```

### Batch Requests

```typescript
const { client, utils } = createTreatyClient<AppAPI>({
  baseUrl: 'http://localhost:3000/api',
});

// Execute multiple requests in parallel
const [users, posts, comments] = await utils.batch([
  () => client.users.list.get(),
  () => client.posts.list.get(),
  () => client.comments.list.get(),
] as const);

// Results are fully typed
console.log(users.length);  // ✅ Type: number
console.log(posts[0].title); // ✅ Type: string
```

## Advanced Examples

### Authentication

```typescript
let authToken: string | null = null;

const client = treaty<AppAPI>('http://localhost:3000/api', {
  onRequest: async (config) => {
    if (authToken) {
      config.headers['Authorization'] = `Bearer ${authToken}`;
    }
    return config;
  },

  onError: async (error) => {
    if (error.status === 401) {
      // Token expired, clear and redirect to login
      authToken = null;
      window.location.href = '/login';
    }
  },
});

// Login
const { token } = await client.auth.login.post({
  email: 'user@example.com',
  password: 'password',
});
authToken = token;

// Now all requests will include the token
const profile = await client.me.profile.get();
```

### File Upload

```typescript
async function uploadFile(file: File) {
  // Convert file to base64
  const reader = new FileReader();
  const data = await new Promise<string>((resolve) => {
    reader.onload = () => resolve(reader.result as string);
    reader.readAsDataURL(file);
  });

  return client.files.upload.post({
    filename: file.name,
    size: file.size,
    type: file.type,
    data: data.split(',')[1],
  });
}
```

### Pagination

```typescript
async function getAllPosts() {
  let page = 1;
  const allPosts = [];

  while (true) {
    const result = await client.posts.paginated.get({
      page,
      pageSize: 20,
    });

    allPosts.push(...result.data);

    if (!result.pagination.hasNext) {
      break;
    }

    page++;
  }

  return allPosts;
}

// Or use an async generator
async function* paginatePosts(pageSize = 10) {
  let page = 1;

  while (true) {
    const result = await client.posts.paginated.get({
      page,
      pageSize,
    });

    yield result.data;

    if (!result.pagination.hasNext) {
      break;
    }

    page++;
  }
}

// Use with for-await-of
for await (const posts of paginatePosts(20)) {
  console.log('Page:', posts.length);
}
```

### WebSocket Support

```typescript
// Connect to WebSocket endpoint
const ws = client.notifications.ws({
  onOpen: () => console.log('Connected'),
  onMessage: (data) => console.log('Received:', data),
  onError: (error) => console.error('Error:', error),
  onClose: () => console.log('Disconnected'),
}, {
  autoReconnect: true,
  reconnectDelay: 1000,
  maxReconnectAttempts: 5,
});

// Send message
ws.send({ type: 'subscribe', channel: 'updates' });

// Close connection
ws.close();
```

### Custom Request

```typescript
const { client, utils } = createTreatyClient<AppAPI>({
  baseUrl: 'http://localhost:3000/api',
});

// Make a custom request not defined in the API
const result = await utils.request<CustomResponse>('custom/endpoint', {
  method: 'POST',
  body: { custom: 'data' },
  headers: { 'X-Custom': 'header' },
});
```

## Server Utilities

### Extract API Metadata

```typescript
import { extractAPIMetadata } from 'philjs-rpc/treaty-server';

const metadata = extractAPIMetadata(api, {
  title: 'My API',
  version: '1.0.0',
  description: 'API description',
});

console.log(metadata.routes);
// [
//   {
//     path: 'users.list',
//     type: 'query',
//     methods: ['GET'],
//     ...
//   },
//   ...
// ]
```

### Generate OpenAPI Spec

```typescript
import { extractAPIMetadata, generateOpenAPI } from 'philjs-rpc/treaty-server';

const metadata = extractAPIMetadata(api);
const openapi = generateOpenAPI(metadata);

// Save to file or serve as endpoint
fs.writeFileSync('openapi.json', JSON.stringify(openapi, null, 2));
```

### Generate TypeScript Types

```typescript
import { extractAPIMetadata, generateTypeDefinitions } from 'philjs-rpc/treaty-server';

const metadata = extractAPIMetadata(api);
const types = generateTypeDefinitions(metadata, {
  exportName: 'AppAPI',
  includeHelpers: true,
  includeComments: true,
});

fs.writeFileSync('api-types.ts', types);
```

### Print Routes

```typescript
import { printAPIRoutes } from 'philjs-rpc/treaty-server';

// Print all routes to console
printAPIRoutes(api, {
  includeMiddleware: true,
  colors: true,
});

// Output:
// === API Routes ===
//
// QUERY users.list
//   Methods: GET, HEAD, OPTIONS
//
// MUTATION users.create
//   Methods: POST, PUT, PATCH, DELETE
//   Input: Required (ZodObject)
```

## Type Safety

Treaty provides complete type safety:

```typescript
// ✅ Correct usage
const users = await client.users.list.get();
const user = await client.users.byId.get({ id: '1' });

// ❌ TypeScript errors
await client.users.byId.get();           // Error: Missing required parameter 'id'
await client.users.byId.get({ id: 1 }); // Error: 'id' must be string, not number
await client.users.create.get({ ... });  // Error: .create is a mutation, use .post()

// Full autocomplete support
client. // Shows: users, posts, auth, etc.
client.users. // Shows: list, byId, create, etc.
client.users.list. // Shows: get, post, put, etc.
```

## Comparison with tRPC Client

### tRPC Client

```typescript
// tRPC requires separate client creation
const trpc = createTRPCProxyClient<AppRouter>({
  links: [httpBatchLink({ url: '...' })],
});

await trpc.users.list.query();
await trpc.users.create.mutate({ ... });
```

### Treaty Client

```typescript
// Treaty uses REST-like HTTP methods
const client = treaty<AppAPI>('http://localhost:3000/api');

await client.users.list.get();
await client.users.create.post({ ... });
```

## Best Practices

1. **Define API types once**: Export the API type from your server file

```typescript
// server/api.ts
export const api = createAPI({ ... });
export type AppAPI = typeof api;
```

2. **Create client singleton**: Reuse the same client instance

```typescript
// lib/api-client.ts
import { treaty } from 'philjs-rpc/treaty';
import type { AppAPI } from '@/server/api';

export const api = treaty<AppAPI>(process.env.API_URL!);
```

3. **Use request interceptors for auth**: Keep auth logic centralized

```typescript
const client = treaty<AppAPI>('...', {
  onRequest: async (config) => {
    const token = await getToken();
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
});
```

4. **Handle errors globally**: Use error interceptor for common patterns

```typescript
const client = treaty<AppAPI>('...', {
  onError: async (error) => {
    if (error.status === 401) {
      redirectToLogin();
    } else if (error.status >= 500) {
      showErrorToast('Server error');
    }
  },
});
```

5. **Use retry for idempotent operations**: Only retry safe operations

```typescript
// ✅ Safe to retry
await client.users.list.get({}, { retry: { count: 3 } });

// ❌ Don't retry mutations by default
await client.users.create.post({ ... });
```

## License

MIT
