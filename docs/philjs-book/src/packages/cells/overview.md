# @philjs/cells

The `@philjs/cells` package provides RedwoodJS-style Cells for declarative data loading with automatic Loading, Empty, Failure, and Success state management.

## Installation

```bash
npm install @philjs/cells
```

## Features

- **Declarative Data Loading** - Define states, not imperative logic
- **Automatic State Management** - Loading, Empty, Failure, Success
- **GraphQL & REST Support** - Works with queries or fetch functions
- **Caching** - Built-in cache with invalidation
- **SSR Support** - Server-side rendering with hydration
- **Composition** - Combine and depend on other cells
- **Retry Logic** - Configurable retry with backoff

## Quick Start

```tsx
import { createCell } from '@philjs/cells';

// Define a cell
const UsersCell = createCell({
  fetch: async () => {
    const response = await fetch('/api/users');
    return response.json();
  },

  Loading: () => <Spinner />,
  Empty: () => <p>No users found</p>,
  Failure: ({ error, retry }) => (
    <div>
      <p>Error: {error.message}</p>
      <button onClick={retry}>Retry</button>
    </div>
  ),
  Success: ({ users }) => (
    <ul>
      {users.map(user => (
        <li key={user.id}>{user.name}</li>
      ))}
    </ul>
  )
});

// Use it
function UsersPage() {
  return (
    <div>
      <h1>Users</h1>
      <UsersCell />
    </div>
  );
}
```

---

## Creating Cells

### With Fetch Function

```tsx
import { createCell } from '@philjs/cells';
import type { CellDefinition } from '@philjs/cells';

interface User {
  id: string;
  name: string;
  email: string;
}

interface UsersData {
  users: User[];
}

const UsersCell = createCell<UsersData>({
  // Custom fetch function
  fetch: async () => {
    const response = await fetch('/api/users');
    if (!response.ok) {
      throw new Error('Failed to fetch users');
    }
    return response.json();
  },

  // Transform data after fetch
  afterQuery: (data) => ({
    ...data,
    users: data.users.filter(u => u.active)
  }),

  // Check if data is empty
  isEmpty: (data) => data.users.length === 0,

  // State components
  Loading: ({ attempts }) => (
    <div>Loading... (attempt {attempts})</div>
  ),

  Empty: ({ variables }) => (
    <p>No users found</p>
  ),

  Failure: ({ error, retry, retryCount, isRetrying }) => (
    <div>
      <p>Error: {error.message}</p>
      <button onClick={retry} disabled={isRetrying}>
        {isRetrying ? 'Retrying...' : `Retry (${retryCount})`}
      </button>
    </div>
  ),

  Success: ({ users, refetch, isRefetching }) => (
    <div>
      <button onClick={refetch} disabled={isRefetching}>
        {isRefetching ? 'Refreshing...' : 'Refresh'}
      </button>
      <ul>
        {users.map(user => (
          <li key={user.id}>{user.name} - {user.email}</li>
        ))}
      </ul>
    </div>
  ),

  displayName: 'UsersCell'
});
```

### With GraphQL

```tsx
import { createCell } from '@philjs/cells';

// GraphQL query
export const QUERY = `
  query GetUsers($role: String) {
    users(role: $role) {
      id
      name
      email
      role
    }
  }
`;

export const Loading = () => <Spinner />;

export const Empty = () => (
  <EmptyState
    icon="users"
    title="No users found"
    description="Try adjusting your filters"
  />
);

export const Failure = ({ error, retry }) => (
  <ErrorBoundary error={error} onRetry={retry} />
);

export const Success = ({ users, refetch }) => (
  <UserTable users={users} onRefresh={refetch} />
);

export default createCell({
  QUERY,
  Loading,
  Empty,
  Failure,
  Success,
  displayName: 'UsersCell'
});
```

### With Variables

```tsx
import { createCell } from '@philjs/cells';

interface UserVariables {
  id: string;
}

interface UserData {
  user: {
    id: string;
    name: string;
    email: string;
    posts: Array<{ id: string; title: string }>;
  };
}

const UserCell = createCell<UserData, UserVariables>({
  fetch: async ({ id }) => {
    const response = await fetch(`/api/users/${id}`);
    return response.json();
  },

  Success: ({ user }) => (
    <div>
      <h2>{user.name}</h2>
      <p>{user.email}</p>
      <h3>Posts</h3>
      <ul>
        {user.posts.map(post => (
          <li key={post.id}>{post.title}</li>
        ))}
      </ul>
    </div>
  )
});

// Usage with variables
function UserProfile({ userId }: { userId: string }) {
  return <UserCell id={userId} />;
}
```

---

## State Components

### Loading

Rendered while data is being fetched:

```tsx
interface LoadingProps {
  attempts: number;
}

const Loading = ({ attempts }: LoadingProps) => (
  <div aria-busy="true" aria-live="polite">
    <Spinner />
    {attempts > 1 && <p>Still loading... (attempt {attempts})</p>}
  </div>
);
```

### Empty

Rendered when data is empty (controlled by `isEmpty`):

```tsx
interface EmptyProps {
  variables: Record<string, unknown>;
}

const Empty = ({ variables }: EmptyProps) => (
  <div className="empty-state">
    <Icon name="inbox" />
    <h3>No results</h3>
    {variables.search && (
      <p>No results for "{variables.search}"</p>
    )}
  </div>
);
```

### Failure

Rendered when an error occurs:

```tsx
interface FailureProps {
  error: Error;
  retryCount: number;
  retry: () => void;
  isRetrying: boolean;
}

const Failure = ({ error, retry, retryCount, isRetrying }: FailureProps) => (
  <div role="alert" className="error-state">
    <Icon name="alert-circle" />
    <h3>Something went wrong</h3>
    <p>{error.message}</p>
    <button onClick={retry} disabled={isRetrying}>
      {isRetrying ? 'Retrying...' : 'Try again'}
    </button>
    {retryCount > 0 && (
      <p className="text-muted">Failed {retryCount} times</p>
    )}
  </div>
);
```

### Success

Rendered when data loads successfully:

```tsx
interface SuccessProps<TData> {
  // Data is spread into props
  [key: string]: unknown;
  // Plus these utility props:
  refetch: () => Promise<void>;
  isRefetching: boolean;
}

const Success = ({ users, refetch, isRefetching }: SuccessProps<UsersData>) => (
  <div>
    <header>
      <h2>Users ({users.length})</h2>
      <button onClick={refetch} disabled={isRefetching}>
        <Icon name={isRefetching ? 'loader' : 'refresh'} />
        Refresh
      </button>
    </header>
    <UserList users={users} />
  </div>
);
```

---

## Cell Props

Pass props when using a cell:

```tsx
<UserCell
  // Variables passed to fetch
  id="123"
  role="admin"

  // Cell-specific props
  cacheKey="user-123"      // Custom cache key
  noCache={false}           // Disable caching
  pollInterval={5000}       // Poll every 5s

  // Callbacks
  onSuccess={(data) => console.log('Loaded:', data)}
  onError={(error) => console.error('Failed:', error)}
/>
```

---

## Caching

### Basic Cache Usage

```tsx
import { cellCache, createCellCacheKey } from '@philjs/cells';

// Generate cache key
const key = createCellCacheKey('UsersCell', { role: 'admin' });

// Check cache
const cached = cellCache.get(key);

// Set cache
cellCache.set(key, userData, { ttl: 60000 });

// Invalidate
cellCache.invalidate(key);
```

### Cache Invalidation

```tsx
import { useCellInvalidate, batchInvalidate } from '@philjs/cells';

function UserActions({ userId }: { userId: string }) {
  const invalidate = useCellInvalidate();

  const handleDelete = async () => {
    await deleteUser(userId);

    // Invalidate specific cell
    invalidate('UsersCell');

    // Invalidate with variables
    invalidate('UserCell', { id: userId });
  };

  return <button onClick={handleDelete}>Delete User</button>;
}

// Batch invalidation
async function refreshAllData() {
  batchInvalidate([
    'UsersCell',
    'PostsCell',
    'CommentsCell'
  ]);
}
```

### Prefetching

```tsx
import { useCellPrefetch } from '@philjs/cells';

function UserLink({ userId }: { userId: string }) {
  const prefetch = useCellPrefetch();

  const handleMouseEnter = () => {
    // Prefetch user data on hover
    prefetch('UserCell', { id: userId });
  };

  return (
    <a
      href={`/users/${userId}`}
      onMouseEnter={handleMouseEnter}
    >
      View User
    </a>
  );
}
```

### Warm Cache

Pre-populate cache on app load:

```tsx
import { warmCache } from '@philjs/cells';

// In app initialization
await warmCache([
  {
    cellName: 'ConfigCell',
    variables: {},
    fetcher: async () => {
      const response = await fetch('/api/config');
      return response.json();
    }
  },
  {
    cellName: 'CurrentUserCell',
    variables: {},
    fetcher: async () => {
      const response = await fetch('/api/me');
      return response.json();
    }
  }
]);
```

### Cache Statistics

```tsx
import { inspectCache, logCacheStats, type CacheStats } from '@philjs/cells';

// Get cache stats
const stats: CacheStats = inspectCache();
console.log(stats.size);        // Number of entries
console.log(stats.hits);        // Cache hits
console.log(stats.misses);      // Cache misses
console.log(stats.hitRate);     // Hit rate percentage

// Log formatted stats
logCacheStats();
// Cache Stats:
//   Entries: 42
//   Hits: 128
//   Misses: 23
//   Hit Rate: 84.8%
```

### Garbage Collection

```tsx
import { setupCacheGC } from '@philjs/cells';

// Set up automatic garbage collection
const cleanup = setupCacheGC({
  interval: 60000,     // Run every minute
  maxAge: 300000,      // Remove entries older than 5 minutes
  maxSize: 100         // Keep max 100 entries
});

// Later: stop GC
cleanup();
```

---

## SSR Support

### Server-Side Rendering

```tsx
import { CellSSRProvider, serializeCellData, getCellHydrationScript } from '@philjs/cells';

// Server render
async function renderPage() {
  const cellData = new Map();

  const html = renderToString(
    <CellSSRProvider
      onCellData={(key, data) => cellData.set(key, data)}
    >
      <App />
    </CellSSRProvider>
  );

  // Serialize cell data for hydration
  const serialized = serializeCellData(cellData);
  const hydrationScript = getCellHydrationScript(serialized);

  return `
    <!DOCTYPE html>
    <html>
      <body>
        <div id="root">${html}</div>
        ${hydrationScript}
        <script src="/client.js"></script>
      </body>
    </html>
  `;
}
```

### Client Hydration

```tsx
import { hydrateCells, initializeCellsFromWindow } from '@philjs/cells';

// Option 1: Manual hydration
const serverData = window.__CELL_DATA__;
hydrateCells(serverData);

// Option 2: Auto-initialize from window
initializeCellsFromWindow();
```

### SSR Context Hook

```tsx
import { useCellSSR } from '@philjs/cells';

function MyCell({ id }: { id: string }) {
  const { isSSR, registerData, getServerData } = useCellSSR();

  if (isSSR) {
    // Server: fetch and register data
    const data = await fetchData(id);
    registerData(`MyCell:${id}`, data);
    return <SuccessComponent data={data} />;
  }

  // Client: use server data if available
  const serverData = getServerData(`MyCell:${id}`);
  if (serverData) {
    return <SuccessComponent data={serverData} />;
  }

  // Fetch on client
  // ...
}
```

---

## Cell Provider

Configure cells globally:

```tsx
import { CellProvider } from '@philjs/cells';
import type { CellProviderConfig } from '@philjs/cells';

const config: CellProviderConfig = {
  // GraphQL client for QUERY-based cells
  executeQuery: async (query, variables) => {
    const response = await fetch('/graphql', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, variables })
    });
    return response.json();
  },

  // Global error handler
  onError: (error, cellName) => {
    console.error(`Cell ${cellName} failed:`, error);
    trackError(error, { cell: cellName });
  },

  // Global success handler
  onSuccess: (data, cellName) => {
    console.log(`Cell ${cellName} loaded`);
  },

  // Default cache TTL
  defaultTTL: 60000,

  // Enable debug logging
  debug: process.env.NODE_ENV === 'development'
};

function App() {
  return (
    <CellProvider config={config}>
      <Router />
    </CellProvider>
  );
}
```

---

## Advanced Patterns

### Composed Cells

Combine multiple cells:

```tsx
import { composeCells } from '@philjs/cells';

const DashboardCell = composeCells({
  users: UsersCell,
  posts: PostsCell,
  stats: StatsCell
});

// All cells load in parallel
function Dashboard() {
  return (
    <DashboardCell
      Success={({ users, posts, stats }) => (
        <div>
          <StatsPanel stats={stats} />
          <UserList users={users} />
          <PostList posts={posts} />
        </div>
      )}
    />
  );
}
```

### Dependent Cells

Create cells that depend on other cells:

```tsx
import { createDependentCell } from '@philjs/cells';

// Parent cell fetches user
const UserCell = createCell({
  fetch: async ({ id }) => {
    const response = await fetch(`/api/users/${id}`);
    return response.json();
  },
  Success: ({ user }) => <UserProfile user={user} />
});

// Child cell depends on user data
const UserPostsCell = createDependentCell(UserCell, {
  fetch: async ({ user }) => {
    const response = await fetch(`/api/users/${user.id}/posts`);
    return response.json();
  },
  Success: ({ posts }) => <PostList posts={posts} />
});
```

### Cells with Retry

Configure automatic retry:

```tsx
import { createCellWithRetry } from '@philjs/cells';

const ResilientCell = createCellWithRetry(
  {
    fetch: async () => {
      const response = await fetch('/api/data');
      if (!response.ok) throw new Error('Fetch failed');
      return response.json();
    },
    Success: ({ data }) => <DataView data={data} />
  },
  {
    maxRetries: 3,
    retryDelay: 1000,        // Start with 1s
    backoffMultiplier: 2,    // Double each retry
    shouldRetry: (error, attempt) => {
      // Don't retry 4xx errors
      if (error.message.includes('404')) return false;
      return attempt < 3;
    }
  }
);
```

### Typed Cells

Full TypeScript inference:

```tsx
import { createTypedCell } from '@philjs/cells';

interface ProductData {
  product: {
    id: string;
    name: string;
    price: number;
    inventory: number;
  };
}

interface ProductVariables {
  id: string;
}

const createProductCell = createTypedCell<ProductData, ProductVariables>();

const ProductCell = createProductCell({
  fetch: async ({ id }) => {
    const response = await fetch(`/api/products/${id}`);
    return response.json();
  },
  Success: ({ product }) => (
    // product is fully typed
    <div>
      <h1>{product.name}</h1>
      <p>${product.price}</p>
      <p>In stock: {product.inventory}</p>
    </div>
  )
});
```

---

## Types Reference

```typescript
// Cell definition
interface CellDefinition<TData, TVariables = Record<string, unknown>> {
  QUERY?: string;
  fetch?: CellFetcher<TData, TVariables>;
  afterQuery?: (data: TData) => TData;
  isEmpty?: (data: TData) => boolean;
  Loading?: (props: LoadingProps) => VNode;
  Empty?: (props: EmptyProps) => VNode;
  Failure?: (props: FailureProps) => VNode;
  Success: (props: SuccessProps<TData>) => VNode;
  displayName?: string;
}

// Cell component type
interface CellComponent<TData, TVariables> {
  (props: TVariables & CellProps<TVariables>): JSXElement;
  displayName?: string;
  __cellDefinition: CellDefinition<TData, TVariables>;
}

// Cell props
interface CellProps<TVariables> {
  cacheKey?: string;
  noCache?: boolean;
  pollInterval?: number;
  onSuccess?: (data: unknown) => void;
  onError?: (error: Error) => void;
}

// State component props
interface LoadingProps {
  attempts: number;
}

interface EmptyProps {
  variables: Record<string, unknown>;
}

interface FailureProps {
  error: Error;
  retryCount: number;
  retry: () => void;
  isRetrying: boolean;
}

interface SuccessProps<TData> extends TData {
  refetch: () => Promise<void>;
  isRefetching: boolean;
}

// Cache entry
interface CellCacheEntry<T> {
  data: T;
  timestamp: number;
  ttl?: number;
}
```

---

## Best Practices

### 1. Keep Cells Focused

```tsx
// Good - focused cell
const UserAvatarCell = createCell({
  fetch: async ({ id }) => fetchUser(id),
  Success: ({ user }) => <Avatar src={user.avatar} />
});

// Avoid - cell does too much
// const UserEverythingCell = createCell({ ... });
```

### 2. Use isEmpty for Empty State

```tsx
createCell({
  fetch: async () => fetchUsers(),
  // Define when to show Empty component
  isEmpty: (data) => data.users.length === 0,
  Empty: () => <EmptyState />,
  Success: ({ users }) => <UserList users={users} />
});
```

### 3. Provide Meaningful Error UI

```tsx
const Failure = ({ error, retry, retryCount }) => (
  <div role="alert">
    <h3>Unable to load users</h3>
    <p>{getErrorMessage(error)}</p>
    <button onClick={retry}>
      Try again {retryCount > 0 && `(${retryCount} failed)`}
    </button>
  </div>
);
```

### 4. Use Caching Strategically

```tsx
// Frequently accessed, rarely changes
<ConfigCell cacheKey="global-config" />

// User-specific, may need fresh data
<UserDashboardCell noCache={true} />

// Real-time data
<LiveStatsCell pollInterval={5000} />
```

---

## API Reference

| Export | Description |
|--------|-------------|
| `createCell` | Create a cell component |
| `createTypedCell` | Create typed cell factory |
| `composeCells` | Combine multiple cells |
| `createDependentCell` | Create cell depending on another |
| `createCellWithRetry` | Create cell with retry logic |
| `CellProvider` | Global cell configuration |
| `CellSSRProvider` | SSR-specific provider |
| `useCellContext` | Access cell context |
| `useCellInvalidate` | Invalidate cell cache |
| `useCellPrefetch` | Prefetch cell data |
| `cellCache` | Direct cache access |
| `warmCache` | Pre-populate cache |
| `batchInvalidate` | Invalidate multiple cells |
| `setupCacheGC` | Configure garbage collection |
| `serializeCellData` | Serialize for SSR |
| `hydrateCells` | Hydrate on client |

---

## Next Steps

- [@philjs/graphql for GraphQL Integration](../graphql/overview.md)
- [@philjs/router Data Loading](../router/data-loading.md)
- [SSR Guide](../ssr/overview.md)
