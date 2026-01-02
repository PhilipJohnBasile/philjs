# @philjs/graphql - GraphQL Integration

**Type-safe GraphQL client with signal-based caching, subscriptions, optimistic updates, and code generation.**

@philjs/graphql provides a complete GraphQL solution for PhilJS applications including reactive queries, mutations, subscriptions over WebSocket, automatic caching, optimistic updates, fragments, persisted queries, and full TypeScript code generation.

## Installation

```bash
npm install @philjs/graphql graphql
```

## Quick Start

```typescript
import { createGraphQLClient, gql, createQuery, createMutation } from '@philjs/graphql';

// Create client
const client = createGraphQLClient({
  endpoint: 'https://api.example.com/graphql',
  subscriptionEndpoint: 'wss://api.example.com/graphql',
});

// Query
const { data, loading, error, refetch } = createQuery(client, {
  query: gql`
    query GetUsers {
      users {
        id
        name
        email
      }
    }
  `,
});

// Mutation
const { mutate, data: mutationData } = createMutation(client,
  gql`mutation CreateUser($name: String!, $email: String!) {
    createUser(name: $name, email: $email) {
      id
      name
    }
  }`
);

await mutate({ name: 'John', email: 'john@example.com' });
```

## GraphQL Client

### Configuration

```typescript
import { createGraphQLClient, GraphQLClient } from '@philjs/graphql';

const client = createGraphQLClient({
  // Required
  endpoint: 'https://api.example.com/graphql',

  // Optional - for subscriptions
  subscriptionEndpoint: 'wss://api.example.com/graphql',

  // Optional headers
  headers: {
    'Authorization': 'Bearer token',
    'X-Custom-Header': 'value',
  },

  // Custom fetch implementation
  fetch: customFetch,

  // Enable reactive caching (default: true)
  reactiveCache: true,

  // Default cache TTL in ms (default: 5 minutes)
  defaultCacheTTL: 5 * 60 * 1000,

  // Retry configuration
  retry: {
    maxRetries: 3,          // Max retry attempts
    retryDelay: 1000,       // Initial delay ms
    backoffMultiplier: 2,   // Exponential backoff
  },
});
```

### Queries

```typescript
// Direct query
const response = await client.query({
  query: gql`
    query GetUser($id: ID!) {
      user(id: $id) {
        id
        name
        email
      }
    }
  `,
  variables: { id: '123' },
  cacheKey: 'user-123',     // Custom cache key
  noCache: false,            // Disable caching for this query
  cacheTTL: 60000,           // Custom TTL for this query
  pollInterval: 5000,        // Poll every 5 seconds
});

// Access response
const user = response.data?.user;
const errors = response.errors;
```

### Mutations

```typescript
const response = await client.mutate({
  mutation: gql`
    mutation UpdateUser($id: ID!, $name: String!) {
      updateUser(id: $id, name: $name) {
        id
        name
      }
    }
  `,
  variables: { id: '123', name: 'Jane' },

  // Optimistic response
  optimisticResponse: {
    updateUser: { id: '123', name: 'Jane' },
  },

  // Queries to refetch after mutation
  refetchQueries: [
    'GetUsers',  // By operation name
    { query: GetUserQuery, variables: { id: '123' } },  // By query
  ],

  // Manual cache update
  update: (cache, result) => {
    cache.set('user-123', { data: result.data });
  },
});
```

### Cache Management

```typescript
// Get cached data (returns Signal)
const cachedData = client.get<UserData>('user-123');
if (cachedData) {
  console.log(cachedData());  // Access current value
}

// Set cache data
client.set('user-123', { data: { user: { id: '123', name: 'John' } } });

// Delete cache entry
client.delete('user-123');

// Clear cache
client.clear();                    // Clear all
client.clear('user-');             // Clear by prefix (string)
client.clear(/^user-/);            // Clear by regex
```

## Reactive Queries

### `createQuery()`

Create signal-based reactive queries:

```typescript
import { createQuery } from '@philjs/graphql';

const query = createQuery(client, {
  query: gql`query GetPosts { posts { id title } }`,
  pollInterval: 10000,  // Optional polling
});

// Reactive signals
query.data();      // Current data (signal)
query.loading();   // Loading state (signal)
query.error();     // Error state (signal)
query.retryCount(); // Retry count (signal)

// Methods
query.refetch();       // Refetch the query
query.startPolling(5000);  // Start polling
query.stopPolling();       // Stop polling
```

### `createMutation()`

Create signal-based reactive mutations:

```typescript
import { createMutation } from '@philjs/graphql';

const mutation = createMutation(client,
  gql`mutation DeletePost($id: ID!) { deletePost(id: $id) }`
);

// Reactive signals
mutation.data();     // Mutation result (signal)
mutation.loading();  // Loading state (signal)
mutation.error();    // Error state (signal)

// Execute mutation
await mutation.mutate({ id: '123' });
```

## Subscriptions

### Subscription Client

```typescript
import { createSubscriptionClient, useSubscription } from '@philjs/graphql';

const subscriptionClient = createSubscriptionClient({
  url: 'wss://api.example.com/graphql',
  connectionTimeout: 5000,
  maxReconnectAttempts: 5,
  reconnectDelay: 1000,
  backoffMultiplier: 2,
  keepalive: true,
  keepaliveInterval: 30000,
  connectionParams: () => ({
    authToken: getAuthToken(),
  }),
  lazy: true,  // Only connect when first subscription is created
});

// Get connection state (signal)
const connectionState = subscriptionClient.getConnectionState();
// 'disconnected' | 'connecting' | 'connected' | 'reconnecting'
```

### Creating Subscriptions

```typescript
// Using subscribe method
const handle = subscriptionClient.subscribe({
  query: gql`
    subscription OnPostCreated {
      postCreated {
        id
        title
        author { name }
      }
    }
  `,
  variables: {},
  onData: (data) => console.log('New post:', data),
  onError: (error) => console.error('Error:', error),
  onComplete: () => console.log('Subscription completed'),
});

// Access subscription state (signals)
handle.data();           // Current data
handle.error();          // Current error
handle.active();         // Whether subscription is active
handle.connectionState(); // Connection state

// Unsubscribe
handle.unsubscribe();
```

### `useSubscription()` Hook

```typescript
import { useSubscription } from '@philjs/graphql';

const { data, error, active, connectionState, unsubscribe } = useSubscription(
  subscriptionClient,
  {
    query: gql`subscription OnMessage { messageReceived { id text } }`,
    variables: {},
    onData: (data) => console.log('Message:', data),
    onError: (error) => console.error('Error:', error),
  }
);

// Use in component
function Chat() {
  return (
    <div>
      <p>Status: {connectionState()}</p>
      {data() && <p>Latest: {data().messageReceived.text}</p>}
    </div>
  );
}
```

## Optimistic Updates

### Optimistic Update Manager

```typescript
import {
  createOptimisticUpdateManager,
  buildOptimisticResponse,
  createMutationQueue,
} from '@philjs/graphql';

const optimisticManager = createOptimisticUpdateManager({
  autoRollback: true,      // Auto-rollback on failure
  queueMutations: false,   // Queue mutations sequentially
  maxQueueSize: 50,        // Max queue size
  conflictResolution: 'queue', // 'reject' | 'queue' | 'override'
});

// Track pending mutations (signals)
optimisticManager.queueSize();        // Queued count
optimisticManager.pendingMutations(); // Pending count

// Get statistics
const stats = optimisticManager.getStats();
// { totalMutations, pendingMutations, completedMutations, failedMutations, queueSize, snapshotCount }
```

### Creating Optimistic Mutations

```typescript
// Create mutation
const mutation = optimisticManager.createMutation(
  UpdateUserMutation,
  { id: '123', name: 'Jane' },
  { updateUser: { id: '123', name: 'Jane', __typename: 'User' } },  // Optimistic response
  (cache, result) => {
    cache.set('user-123', result);
  }
);

// Apply optimistic update
const snapshot = optimisticManager.applyOptimistic(mutation.id, client);

// On success
optimisticManager.commit(mutation.id, client, response.data);

// On failure
optimisticManager.rollback(mutation.id, client, error);
```

### Optimistic Response Builder

```typescript
import { buildOptimisticResponse } from '@philjs/graphql';

const optimisticResponse = buildOptimisticResponse<UpdateUserMutation>()
  .set('updateUser', {
    id: '123',
    name: 'Jane',
  })
  .typename('User')
  .build();
```

### Mutation Queue

```typescript
import { createMutationQueue, MutationQueue } from '@philjs/graphql';

const queue = createMutationQueue();

// Add with priority (higher = first)
queue.enqueue(mutation1, 10);  // High priority
queue.enqueue(mutation2, 0);   // Normal priority

// Process queue
while (!queue.isEmpty()) {
  const next = queue.dequeue();
  await executeMutation(next);
}

// Other methods
queue.peek();     // View next without removing
queue.size;       // Queue size
queue.clear();    // Clear queue
queue.getAll();   // Get all mutations
```

### Conflict Resolution

```typescript
import {
  LastWriteWinsResolver,
  FirstWriteWinsResolver,
  CustomConflictResolver,
} from '@philjs/graphql';

// Last write wins
const lww = new LastWriteWinsResolver();

// First write wins
const fww = new FirstWriteWinsResolver();

// Custom resolver
const custom = new CustomConflictResolver((current, incoming) => {
  // Return the mutation that should proceed, or null to reject both
  if (incoming.timestamp > current.timestamp) {
    return incoming;
  }
  return current;
});
```

## Fragments

### Defining Fragments

```typescript
import {
  defineFragment,
  FragmentRegistry,
  createFragmentRegistry,
  getFragmentRegistry,
} from '@philjs/graphql';

// Use global registry
const UserFields = defineFragment('UserFields', 'User', gql`
  fragment UserFields on User {
    id
    name
    email
    avatar
  }
`);

// Or create isolated registry
const registry = createFragmentRegistry();
const PostFields = defineFragment('PostFields', 'Post', gql`
  fragment PostFields on Post {
    id
    title
    content
  }
`, registry);
```

### Using Fragments

```typescript
import { spreadFragment, buildQueryWithFragments } from '@philjs/graphql';

// Spread in query
const query = gql`
  query GetUser($id: ID!) {
    user(id: $id) {
      ${spreadFragment(UserFields)}
      posts {
        ${spreadFragment(PostFields)}
      }
    }
  }
`;

// Automatically include fragment definitions
const fullQuery = buildQueryWithFragments(query, registry);
```

### Fragment Masking

```typescript
import { maskFragment, unmaskFragment, isMaskedFragment } from '@philjs/graphql';

// Mask fragment data (encapsulation)
const masked = maskFragment(UserFields, userData);

// Check if masked
if (isMaskedFragment(data)) {
  // Unmask to access
  const user = unmaskFragment(UserFields, data);
}
```

### Fragment Colocation

```typescript
import { withFragment, getComponentFragment, useFragment } from '@philjs/graphql';

// Attach fragment to component
const UserCard = withFragment(
  function UserCard({ user }) {
    // useFragment extracts typed data
    const userData = useFragment(UserFields, user);
    return <div>{userData.name}</div>;
  },
  UserFields
);

// Get component's fragment
const fragment = getComponentFragment(UserCard);
```

### Fragment Utilities

```typescript
import { FragmentUtils, composeFragments, mergeFragmentData } from '@philjs/graphql';

// Compose multiple fragments
const composed = composeFragments([UserFields, PostFields], registry);

// Merge fragment data
const merged = mergeFragmentData(userData, profileData);

// Check if query uses fragment
FragmentUtils.queryUsesFragment(query, 'UserFields'); // true

// Remove unused fragments
const optimized = FragmentUtils.removeUnusedFragments(document);

// Deduplicate fragments
const deduplicated = FragmentUtils.deduplicateFragments(document);
```

## Persisted Queries

### Persisted Query Manager

```typescript
import {
  createPersistedQueryManager,
  createPersistedQueryRegistry,
  buildPersistedQueryRequest,
} from '@philjs/graphql';

const persistedManager = createPersistedQueryManager({
  enabled: true,
  hashAlgorithm: 'sha256',
  useGETForHashedQueries: false,
  includeQueryOnFirstRequest: false,
  generateHash: async (query) => customHash(query),  // Optional custom hasher
});

// Create persisted query link
const link = await persistedManager.createPersistedQueryLink(query);
// { extensions: { persistedQuery: { version: 1, sha256Hash: '...' } }, includeQuery: false }

// Mark hash as known (server confirmed)
persistedManager.markHashAsKnown(link.extensions.persistedQuery.sha256Hash);

// Check if hash is known
persistedManager.isHashKnown(hash); // boolean

// Get stats
persistedManager.getCacheStats(); // { hashCacheSize, knownHashesSize }
```

### Persisted Query Registry

```typescript
const registry = createPersistedQueryRegistry();

// Register query with hash
registry.register('GetUsers', getUsersQuery, 'abc123...');

// Get hash
const hash = registry.getHash('GetUsers');

// Load from manifest
registry.loadFromManifest({
  'GetUsers': 'abc123...',
  'GetPosts': 'def456...',
});

// Export as manifest
const manifest = registry.exportManifest();
```

### Building Requests

```typescript
import {
  buildPersistedQueryRequest,
  shouldRetryWithFullQuery,
  extractQueryHash,
  generatePersistedQueryManifest,
} from '@philjs/graphql';

// Build request
const request = await buildPersistedQueryRequest(
  persistedManager,
  query,
  variables,
  'GetUsers',
  false  // retryWithFullQuery
);

// Check if should retry
if (shouldRetryWithFullQuery(error, response)) {
  // Retry with full query
  const retryRequest = await buildPersistedQueryRequest(
    persistedManager,
    query,
    variables,
    'GetUsers',
    true
  );
}

// Extract hash
const hash = await extractQueryHash(query);

// Generate manifest (for build time)
const manifest = await generatePersistedQueryManifest({
  'GetUsers': getUsersQuery,
  'GetPosts': getPostsQuery,
});
```

## Code Generation

### GraphQL Codegen

```typescript
import { createCodegen, GraphQLCodegen } from '@philjs/graphql';

const codegen = createCodegen({
  schema: './schema.graphql',
  documents: ['src/**/*.graphql'],
  outputDir: './src/generated',
  generateHooks: true,
  generateFragments: true,
  generateSubscriptions: true,
  generatePersistedQueries: false,
  strict: false,
  scalars: {
    DateTime: 'string',
    JSON: 'Record<string, unknown>',
  },
  enumsAsUnionTypes: false,
  immutableTypes: false,
  addTypename: true,
});

// Set schema
codegen.setSchema(schemaString);
// Or: codegen.setSchemaObject(graphqlSchema);

// Generate schema types
const schemaTypes = codegen.generateSchemaTypeDefinitions();

// Generate query types
const queryTypes = codegen.generateQueryTypes('GetUsers', getUsersQuery);

// Generate mutation types (with optimistic)
const mutationTypes = codegen.generateMutationTypes('UpdateUser', updateUserMutation, {
  generateOptimistic: true,
});

// Generate subscription types
const subTypes = codegen.generateSubscriptionTypes('OnMessage', onMessageSub);

// Generate fragment types
const fragmentTypes = codegen.generateFragmentTypes('UserFields', 'User', userFieldsFragment);

// Generate resolver types
const resolverTypes = codegen.generateResolverTypes('User');

// Generate complete types file
const typesFile = codegen.generateTypesFile(
  [
    { name: 'GetUsers', type: 'query', document: getUsersQuery },
    { name: 'UpdateUser', type: 'mutation', document: updateUserMutation },
    { name: 'OnMessage', type: 'subscription', document: onMessageSub },
  ],
  [
    { name: 'UserFields', on: 'User', document: userFieldsFragment },
  ]
);

// Generate persisted query manifest
const manifest = await codegen.generatePersistedQueryManifest([
  { name: 'GetUsers', document: getUsersQuery },
  { name: 'GetPosts', document: getPostsQuery },
]);
```

### Batch Codegen

```typescript
import { createBatchCodegen, BatchCodegen } from '@philjs/graphql';

const batch = createBatchCodegen(config);
batch.setSchema(schemaString);

// Add operations
batch.addOperation('GetUsers', 'query', getUsersQuery);
batch.addOperation('UpdateUser', 'mutation', updateUserMutation);
batch.addOperation('OnMessage', 'subscription', onMessageSub);

// Add fragments
batch.addFragment('UserFields', 'User', userFieldsFragment);

// Generate all
const code = batch.generate();

// Clear for reuse
batch.clear();
```

### Helper Functions

```typescript
import { extractOperationInfo, extractFragmentInfo } from '@philjs/graphql';

// Extract operation info
const opInfo = extractOperationInfo(document);
// { name: 'GetUsers', type: 'query' }

// Extract fragment info
const fragInfo = extractFragmentInfo(document);
// { name: 'UserFields', on: 'User' }
```

## Server Integration

### GraphQL Loader

```typescript
import { createGraphQLLoader } from '@philjs/graphql';

// Create loader for SSR
export const loader = createGraphQLLoader(client,
  gql`query GetPost($id: ID!) { post(id: $id) { id title content } }`
);

// In route
export default function Post() {
  const data = useLoaderData();
  return <article>{data.title}</article>;
}
```

### GraphQL Action

```typescript
import { createGraphQLAction } from '@philjs/graphql';

// Create action for mutations
export const action = createGraphQLAction(client,
  gql`mutation UpdatePost($id: ID!, $title: String!) {
    updatePost(id: $id, title: $title) { id title }
  }`
);

// In form
<form method="post">
  <input name="id" type="hidden" value={post.id} />
  <input name="title" defaultValue={post.title} />
  <button type="submit">Save</button>
</form>
```

## Best Practices

1. **Use fragments** for reusable field selections
2. **Enable persisted queries** in production for smaller payloads
3. **Use optimistic updates** for responsive UIs
4. **Subscribe lazily** to reduce connection overhead
5. **Generate types** for type-safe operations
6. **Cache wisely** with appropriate TTLs
7. **Handle errors** at query and mutation level

## API Reference

### Client

| Function | Description |
|----------|-------------|
| `createGraphQLClient(config)` | Create GraphQL client |
| `client.query(options)` | Execute query |
| `client.mutate(options)` | Execute mutation |
| `client.subscribe(options)` | Subscribe to subscription |
| `client.clearCache(pattern)` | Clear cache |

### Queries & Mutations

| Function | Description |
|----------|-------------|
| `createQuery(client, options)` | Create reactive query |
| `createMutation(client, mutation)` | Create reactive mutation |
| `gql` | Template literal for GraphQL |

### Subscriptions

| Function | Description |
|----------|-------------|
| `createSubscriptionClient(config)` | Create subscription client |
| `useSubscription(client, options)` | Subscription hook |
| `SubscriptionHandle` | Subscription handle class |

### Optimistic

| Function | Description |
|----------|-------------|
| `createOptimisticUpdateManager(config)` | Create optimistic manager |
| `buildOptimisticResponse()` | Build optimistic response |
| `createMutationQueue()` | Create mutation queue |

### Fragments

| Function | Description |
|----------|-------------|
| `defineFragment(name, on, doc)` | Define fragment |
| `spreadFragment(fragment)` | Spread fragment in query |
| `maskFragment(fragment, data)` | Mask fragment data |
| `unmaskFragment(fragment, masked)` | Unmask fragment data |
| `buildQueryWithFragments(query)` | Include fragment definitions |

### Persisted Queries

| Function | Description |
|----------|-------------|
| `createPersistedQueryManager(config)` | Create APQ manager |
| `createPersistedQueryRegistry()` | Create query registry |
| `buildPersistedQueryRequest()` | Build APQ request |
| `generatePersistedQueryManifest()` | Generate manifest |

### Code Generation

| Function | Description |
|----------|-------------|
| `createCodegen(config)` | Create code generator |
| `createBatchCodegen(config)` | Create batch generator |
| `runCodegen(config)` | Run CLI codegen |

## Next Steps

- [GraphQL Integration](../../integrations/graphql.md) - Full GraphQL guide
- [@philjs/realtime](../realtime/overview.md) - Real-time integration
- [Data Layer](../core/data-layer.md) - Core data patterns
