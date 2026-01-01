# philjs-graphql

GraphQL integration for PhilJS with typed queries, mutations, and reactive caching.

## Features

- **Type-safe queries and mutations** - Full TypeScript support with typed GraphQL operations
- **Signal-based reactive caching** - Automatic cache updates using PhilJS signals
- **Automatic request deduplication** - Avoid duplicate queries with intelligent caching
- **GraphQL subscriptions** - Real-time updates over WebSocket with graphql-ws protocol
- **Optimistic updates** - Advanced optimistic mutation handling with rollback and conflict resolution
- **Persisted queries** - Automatic persisted query (APQ) support with hash generation
- **Fragment colocation** - Type-safe fragments with masking and composition
- **Code generation** - Enhanced TypeScript code generation for operations and fragments
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

## Advanced Features (v2)

### WebSocket Subscriptions

Enhanced subscription support with automatic reconnection and signal-based state:

```typescript
import { createSubscriptionClient, useSubscription } from 'philjs-graphql';

// Create subscription client
const subscriptionClient = createSubscriptionClient({
  url: 'wss://api.example.com/graphql',
  connectionTimeout: 5000,
  maxReconnectAttempts: 5,
  keepalive: true,
  lazy: true, // Only connect when first subscription is active
});

// Use subscription in component
const MESSAGE_SUBSCRIPTION = gql`
  subscription OnMessage($channelId: ID!) {
    newMessage(channelId: $channelId) {
      id
      text
      user {
        name
      }
    }
  }
`;

function ChatComponent() {
  const { data, error, active, connectionState } = useSubscription(
    subscriptionClient,
    {
      query: MESSAGE_SUBSCRIPTION,
      variables: { channelId: '1' },
      onData: (data) => console.log('New message:', data),
      onError: (error) => console.error('Subscription error:', error),
    }
  );

  return (
    <div>
      <p>Connection: {connectionState()}</p>
      {data() && <Message message={data().newMessage} />}
    </div>
  );
}
```

**Features:**
- graphql-ws protocol support
- Automatic reconnection with exponential backoff
- Heartbeat/keepalive support
- Signal-based reactive state
- Connection pooling for multiple subscriptions

### Persisted Queries (APQ)

Automatic Persisted Queries reduce bandwidth and improve caching:

```typescript
import {
  createPersistedQueryManager,
  buildPersistedQueryRequest,
  generatePersistedQueryManifest,
} from 'philjs-graphql';

// Create persisted query manager
const persistedQueryManager = createPersistedQueryManager({
  enabled: true,
  useGETForHashedQueries: true,
  includeQueryOnFirstRequest: false,
});

// Build request with persisted query
const request = await buildPersistedQueryRequest(
  persistedQueryManager,
  USERS_QUERY,
  { limit: 10 }
);

// Generate manifest for build-time optimization
const queries = {
  GetUsers: USERS_QUERY,
  GetUser: USER_QUERY,
  CreateUser: CREATE_USER_MUTATION,
};

const manifest = await generatePersistedQueryManifest(queries);
// Save manifest to file for server-side registration
```

**Features:**
- SHA-256 hash generation
- Automatic fallback to full query on hash miss
- CDN-friendly GET requests
- Query registry for pre-registration
- Build-time manifest generation

### Fragment Colocation

Type-safe fragments with masking for better data encapsulation:

```typescript
import {
  defineFragment,
  maskFragment,
  unmaskFragment,
  useFragment,
  withFragment,
  buildQueryWithFragments,
} from 'philjs-graphql';

// Define a fragment
const UserFragment = defineFragment<{ id: string; name: string; email: string }>(
  'UserFields',
  'User',
  gql`
    fragment UserFields on User {
      id
      name
      email
    }
  `
);

// Use fragment in query
const USERS_QUERY = buildQueryWithFragments(gql`
  query GetUsers {
    users {
      ...UserFields
    }
  }
`);

// Colocate fragment with component
const UserCard = withFragment(
  function UserCard({ user }) {
    const userData = useFragment(UserFragment, user);
    return <div>{userData.name}</div>;
  },
  UserFragment
);

// Fragment masking for data encapsulation
function UserList({ users }) {
  const maskedUsers = users.map(user => maskFragment(UserFragment, user));
  return maskedUsers.map(user => <UserCard user={user} key={user.__fragmentId} />);
}
```

**Features:**
- Type-safe fragment definitions
- Fragment masking for encapsulation
- Automatic fragment spreading
- Component colocation
- Fragment composition and merging

### Optimistic Updates

Advanced optimistic mutation handling with automatic rollback:

```typescript
import {
  createOptimisticUpdateManager,
  buildOptimisticResponse,
} from 'philjs-graphql';

// Create optimistic update manager
const optimisticManager = createOptimisticUpdateManager({
  autoRollback: true,
  queueMutations: false,
  conflictResolution: 'queue',
});

// Build type-safe optimistic response
const optimisticResponse = buildOptimisticResponse<CreatePostMutation>()
  .typename('Post')
  .set('id', 'temp-id')
  .set('title', 'New Post')
  .set('published', false)
  .build();

// Use with mutation
const ADD_MESSAGE = gql`
  mutation AddMessage($text: String!) {
    addMessage(text: $text) {
      id
      text
      timestamp
    }
  }
`;

const [addMessage] = useMutation(ADD_MESSAGE);

async function handleSubmit(text: string) {
  // Create optimistic mutation
  const mutation = optimisticManager.createMutation(
    ADD_MESSAGE,
    { text },
    optimisticResponse,
    (cache, { data }) => {
      // Update cache optimistically
      const messagesKey = 'GetMessages:{}';
      const messagesData = cache.get(messagesKey);
      if (messagesData) {
        const current = messagesData();
        if (current?.data) {
          messagesData.set({
            data: {
              messages: [...current.data.messages, data.addMessage],
            },
          });
        }
      }
    }
  );

  // Apply optimistic update
  const snapshot = optimisticManager.applyOptimistic(mutation.id, client);

  try {
    const result = await addMessage({ text });
    // Commit on success
    optimisticManager.commit(mutation.id, client, result);
  } catch (error) {
    // Automatic rollback on error
    optimisticManager.rollback(mutation.id, client, error);
  }
}
```

**Features:**
- Automatic rollback on error
- Snapshot-based state restoration
- Mutation queue management
- Conflict resolution strategies
- Type-safe optimistic response builder

### Code Generation

Generate TypeScript types and hooks for GraphQL operations:

```typescript
import {
  createCodegen,
  createBatchCodegen,
  extractOperationInfo,
  extractFragmentInfo,
} from 'philjs-graphql';

// Configure code generator
const codegen = createCodegen({
  schema: 'https://api.example.com/graphql',
  documents: ['src/**/*.graphql', 'src/**/*.tsx'],
  outputDir: 'src/generated',
  generateHooks: true,
  generateFragments: true,
  generateSubscriptions: true,
  generatePersistedQueries: true,
  scalars: {
    DateTime: 'string',
    JSON: 'any',
  },
});

// Generate types for operations
const queryTypes = codegen.generateQueryTypes('GetUsers', USERS_QUERY, {
  generateHook: true,
});

const mutationTypes = codegen.generateMutationTypes('CreateUser', CREATE_USER_MUTATION, {
  generateHook: true,
  generateOptimistic: true,
});

const subscriptionTypes = codegen.generateSubscriptionTypes('OnMessage', MESSAGE_SUBSCRIPTION);

// Batch code generation
const batchCodegen = createBatchCodegen({
  schema: 'https://api.example.com/graphql',
  documents: [],
  outputDir: 'src/generated',
});

batchCodegen.addOperation('GetUsers', 'query', USERS_QUERY);
batchCodegen.addOperation('CreateUser', 'mutation', CREATE_USER_MUTATION);
batchCodegen.addFragment('UserFields', 'User', USER_FRAGMENT);

const generatedCode = batchCodegen.generate();
// Write to file: src/generated/graphql.ts
```

**Generated types example:**

```typescript
// GetUsers Query
export interface GetUsersVariables {
  limit?: number;
  offset?: number;
}

export interface GetUsersQuery {
  users: Array<{
    id: string;
    name: string;
    email: string;
  }>;
}

export function useGetUsersQuery(
  variables?: GetUsersVariables,
  options?: GraphQLQueryOptions<GetUsersVariables>
) {
  return createQuery<GetUsersQuery, GetUsersVariables>(client, {
    query: GetUsersDocument,
    variables,
    ...options,
  });
}

// CreateUser Mutation with optimistic response
export interface CreateUserVariables {
  name: string;
  email: string;
}

export interface CreateUserMutation {
  createUser: {
    id: string;
    name: string;
    email: string;
  };
}

export type CreateUserOptimisticResponse = Partial<CreateUserMutation>;

export function useCreateUserMutation() {
  return createMutation<CreateUserMutation, CreateUserVariables>(
    client,
    CreateUserDocument
  );
}
```

**Features:**
- Generate TypeScript types from GraphQL schema
- Generate hooks for queries, mutations, and subscriptions
- Generate optimistic response types
- Generate fragment types
- Extract operation and fragment information
- Batch generation support

## Best Practices

### 1. Use Fragments for Reusable Fields

```typescript
const UserFieldsFragment = defineFragment('UserFields', 'User', gql`
  fragment UserFields on User {
    id
    name
    email
    avatar
  }
`);

// Reuse in multiple queries
const USERS_QUERY = buildQueryWithFragments(gql`
  query GetUsers {
    users {
      ...UserFields
    }
  }
`);
```

### 2. Enable Persisted Queries for Production

```typescript
const client = createGraphQLClient({
  endpoint: 'https://api.example.com/graphql',
  // Enable persisted queries
});

const persistedQueryManager = createPersistedQueryManager({
  enabled: true,
  useGETForHashedQueries: true, // Better CDN caching
});
```

### 3. Use Optimistic Updates for Better UX

```typescript
// Always provide optimistic response for mutations that update lists
const [addItem] = useMutation(ADD_ITEM, {
  optimisticResponse: {
    addItem: {
      id: 'temp-' + Date.now(),
      name: inputValue,
      __typename: 'Item',
    },
  },
  update: (cache, { data }) => {
    // Update cache optimistically
  },
});
```

### 4. Colocate Fragments with Components

```typescript
// Keep fragments close to components that use them
const UserCard = withFragment(
  function UserCard({ user }) {
    return <div>{user.name}</div>;
  },
  UserCardFragment
);
```

### 5. Use Subscriptions for Real-Time Features

```typescript
// Use subscriptions for chat, notifications, live updates
const { data, connectionState } = useSubscription(subscriptionClient, {
  query: MESSAGES_SUBSCRIPTION,
  variables: { channelId },
});
```

## Documentation

For more information, see the [PhilJS documentation](../../docs).

<!-- API_SNAPSHOT_START -->
## API Snapshot

This section is generated from the package source. Run `node scripts/generate-package-atlas.mjs` to refresh.

### Entry Points
- Export keys: .
- Source files: packages/philjs-graphql/src/index.ts

### Public API
- Direct exports: CacheStore, DocumentNode, GraphQLClient, GraphQLClientConfig, GraphQLMutationOptions, GraphQLQueryOptions, GraphQLResponse, GraphQLSubscriptionOptions, createGraphQLAction, createGraphQLClient, createGraphQLLoader, createMutation, createQuery, gql
- Re-exported names: BatchCodegen, CodegenConfig, ConflictResolver, CustomConflictResolver, FirstWriteWinsResolver, FragmentDefinition, FragmentRegistry, FragmentUtils, GeneratedFragment, GeneratedOperation, GraphQLCodegen, LastWriteWinsResolver, MaskedFragment, MutationQueue, OptimisticMutation, OptimisticResponseBuilder, OptimisticUpdateConfig, OptimisticUpdateManager, OptimisticUpdateSnapshot, PersistedQueryConfig, PersistedQueryLink, PersistedQueryManager, PersistedQueryRegistry, SubscriptionClient, SubscriptionConfig, SubscriptionHandle, SubscriptionOptions, SubscriptionState, buildOptimisticResponse, buildPersistedQueryRequest, buildQueryWithFragments, composeFragments, createBatchCodegen, createCodegen, createFragmentRegistry, createMutationQueue, createOptimisticUpdateManager, createPersistedQueryManager, createPersistedQueryRegistry, createSubscriptionClient, defineFragment, extractFragmentInfo, extractOperationInfo, extractQueryHash, fragment, generatePersistedQueryManifest, getComponentFragment, getFragmentRegistry, inlineFragment, isMaskedFragment, maskFragment, mergeFragmentData, runCodegen, selectFromFragment, shouldRetryWithFullQuery, spreadFragment, unmaskFragment, useFragment, useSubscription, withFragment
- Re-exported modules: ./codegen-enhanced.js, ./fragments.js, ./optimistic.js, ./persisted.js, ./subscription.js
<!-- API_SNAPSHOT_END -->

## License

MIT
