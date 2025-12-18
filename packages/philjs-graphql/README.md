# philjs-graphql

GraphQL integration for PhilJS with typed queries, mutations, and reactive caching.

## Features

- **Type-safe queries and mutations** - Full TypeScript support with typed GraphQL operations
- **Signal-based reactive caching** - Automatic cache updates using PhilJS signals
- **Automatic request deduplication** - Avoid duplicate queries with intelligent caching
- **GraphQL subscriptions** - Real-time updates over WebSocket
- **Optimistic updates** - Immediate UI updates before server response
- **Retry logic** - Configurable retry with exponential backoff
- **SSR integration** - Works with PhilJS loaders and actions
- **Polling support** - Automatic refetching at intervals

## Installation

```bash
pnpm add philjs-graphql graphql
```

Note: `graphql` is a peer dependency for type definitions.

## Quick Start

### 1. Create a GraphQL Client

```typescript
import { createGraphQLClient } from 'philjs-graphql';

const client = createGraphQLClient({
  endpoint: 'https://api.example.com/graphql',
  subscriptionEndpoint: 'wss://api.example.com/graphql', // optional
  headers: {
    'Authorization': 'Bearer YOUR_TOKEN'
  }
});
```

### 2. Query Data

```typescript
import { createQuery, gql } from 'philjs-graphql';

const USERS_QUERY = gql`
  query GetUsers {
    users {
      id
      name
      email
    }
  }
`;

const usersQuery = createQuery(client, {
  query: USERS_QUERY
});

// Access reactive data
console.log(usersQuery.data()); // undefined initially
console.log(usersQuery.loading()); // true
console.log(usersQuery.error()); // null

// Data becomes available when query resolves
setTimeout(() => {
  console.log(usersQuery.data()); // [{ id: 1, name: 'Alice', ... }]
  console.log(usersQuery.loading()); // false
}, 1000);
```

### 3. Execute Mutations

```typescript
import { createMutation, gql } from 'philjs-graphql';

const CREATE_USER_MUTATION = gql`
  mutation CreateUser($name: String!, $email: String!) {
    createUser(name: $name, email: $email) {
      id
      name
      email
    }
  }
`;

const createUserMutation = createMutation(client, CREATE_USER_MUTATION);

// Execute mutation
async function handleSubmit(name: string, email: string) {
  try {
    const result = await createUserMutation.mutate({ name, email });
    console.log('User created:', result);
  } catch (error) {
    console.error('Failed to create user:', createUserMutation.error());
  }
}
```

### 4. GraphQL Subscriptions

```typescript
import { gql } from 'philjs-graphql';

const MESSAGE_SUBSCRIPTION = gql`
  subscription OnMessageAdded {
    messageAdded {
      id
      content
      user {
        name
      }
    }
  }
`;

const unsubscribe = client.subscribe({
  subscription: MESSAGE_SUBSCRIPTION,
  onData: (data) => {
    console.log('New message:', data.messageAdded);
  },
  onError: (error) => {
    console.error('Subscription error:', error);
  }
});

// Clean up when done
unsubscribe();
```

## SSR Integration

### GraphQL Loaders

Use GraphQL queries with PhilJS loaders for server-side data fetching:

```typescript
import { createGraphQLLoader, gql } from 'philjs-graphql';

const USER_QUERY = gql`
  query GetUser($id: ID!) {
    user(id: $id) {
      id
      name
      email
    }
  }
`;

export const userLoader = createGraphQLLoader(client, USER_QUERY);

// Use in route
export default function UserProfile() {
  const user = userLoader.use();

  return (
    <div>
      <h1>{user.name}</h1>
      <p>{user.email}</p>
    </div>
  );
}
```

### GraphQL Actions

Use mutations with PhilJS actions for form submissions:

```typescript
import { createGraphQLAction, gql } from 'philjs-graphql';

const UPDATE_PROFILE_MUTATION = gql`
  mutation UpdateProfile($name: String!, $bio: String!) {
    updateProfile(name: $name, bio: $bio) {
      id
      name
      bio
    }
  }
`;

export const updateProfileAction = createGraphQLAction(client, UPDATE_PROFILE_MUTATION);

// Use in form
export default function ProfileForm() {
  return (
    <form action={updateProfileAction}>
      <input name="name" placeholder="Name" />
      <textarea name="bio" placeholder="Bio" />
      <button type="submit">Update Profile</button>
    </form>
  );
}
```

## Advanced Usage

### Optimistic Updates

Update UI immediately before server responds:

```typescript
const deleteTodoMutation = await client.mutate({
  mutation: DELETE_TODO_MUTATION,
  variables: { id: '123' },
  optimisticResponse: {
    deleteTodo: { id: '123', __typename: 'Todo' }
  },
  update: (cache, result) => {
    // Manually update cache
    const todosKey = 'GetTodos:{}';
    const todosData = cache.get(todosKey);
    if (todosData) {
      const todos = todosData();
      if (todos?.data) {
        todosData.set({
          data: {
            todos: todos.data.todos.filter(t => t.id !== '123')
          }
        });
      }
    }
  }
});
```

### Polling

Automatically refetch data at intervals:

```typescript
const usersQuery = createQuery(client, {
  query: USERS_QUERY,
  pollInterval: 5000 // Refetch every 5 seconds
});

// Control polling programmatically
usersQuery.stopPolling();
usersQuery.startPolling(10000); // Change to 10 seconds
```

### Cache Management

```typescript
// Clear all cache
client.clearCache();

// Clear cache by pattern
client.clearCache('GetUser'); // Clear all GetUser queries
client.clearCache(/users/i); // Clear using regex

// Manual cache manipulation
const cacheKey = 'GetUser:{"id":"123"}';
client.set(cacheKey, { data: { user: { id: '123', name: 'Alice' } } });
client.delete(cacheKey);
```

### Retry Configuration

```typescript
const client = createGraphQLClient({
  endpoint: 'https://api.example.com/graphql',
  retry: {
    maxRetries: 5,
    retryDelay: 2000,
    backoffMultiplier: 1.5
  }
});
```

### Custom Cache TTL

```typescript
const usersQuery = createQuery(client, {
  query: USERS_QUERY,
  cacheTTL: 60 * 1000 // Cache for 1 minute
});

// Or disable caching
const freshQuery = createQuery(client, {
  query: USERS_QUERY,
  noCache: true
});
```

## API Reference

### `createGraphQLClient(config)`

Creates a GraphQL client instance.

**Config options:**
- `endpoint` - GraphQL endpoint URL (required)
- `subscriptionEndpoint` - WebSocket endpoint for subscriptions
- `headers` - Custom headers for all requests
- `fetch` - Custom fetch implementation
- `reactiveCache` - Enable signal-based caching (default: `true`)
- `defaultCacheTTL` - Default cache duration in ms (default: `300000` / 5 minutes)
- `retry` - Retry configuration object

### `createQuery(client, options)`

Creates a reactive GraphQL query.

**Returns:** `{ data, error, loading, retryCount, refetch, startPolling, stopPolling }`

### `createMutation(client, mutation)`

Creates a GraphQL mutation.

**Returns:** `{ mutate, data, error, loading }`

### `client.subscribe(options)`

Creates a GraphQL subscription.

**Returns:** Unsubscribe function

### `createGraphQLLoader(client, query)`

Creates a PhilJS loader for SSR.

### `createGraphQLAction(client, mutation)`

Creates a PhilJS action for mutations.

### `gql` Template Tag

Tagged template literal for GraphQL queries:

```typescript
const query = gql`
  query GetUser($id: ID!) {
    user(id: $id) {
      name
    }
  }
`;
```

## Documentation

For more information, see the [PhilJS documentation](../../docs).

## License

MIT
