# PhilJS Cells

RedwoodJS-style Cells pattern for PhilJS - Declarative data loading components with built-in loading, error, empty, and success states.

## Features

- **Declarative data loading** - Define what to fetch and how to render each state
- **Built-in state management** - Loading, Error, Empty, and Success states handled automatically
- **No manual loading state** - Focus on your UI, not state management
- **GraphQL & REST support** - Use QUERY for GraphQL or fetch for REST APIs
- **TypeScript first** - Full type inference for your data
- **Cache integration** - Built-in caching with TTL and invalidation
- **SSR support** - Server-side rendering with streaming
- **Refetch on prop change** - Automatic refetching when variables change

## Installation

```bash
npm install philjs-cells
# or
pnpm add philjs-cells
```

## Quick Start

### Creating a Cell

```tsx
// cells/UsersCell.tsx
import { createCell } from 'philjs-cells';

// Using GraphQL
export const QUERY = `
  query Users {
    users { id, name, email }
  }
`;

// Or using fetch
export const fetch = async () => {
  const res = await fetch('/api/users');
  return res.json();
};

export const Loading = () => <Spinner />;

export const Empty = () => <p>No users found</p>;

export const Failure = ({ error, retry }) => (
  <div>
    <p>Error: {error.message}</p>
    <button onClick={retry}>Retry</button>
  </div>
);

export const Success = ({ users }) => (
  <ul>
    {users.map(user => <li key={user.id}>{user.name}</li>)}
  </ul>
);

export default createCell({
  QUERY, // or fetch
  Loading,
  Empty,
  Failure,
  Success,
});
```

### Using a Cell

```tsx
import UsersCell from './cells/UsersCell';

function UsersPage() {
  return (
    <div>
      <h1>Users</h1>
      <UsersCell />
    </div>
  );
}

// With variables
<UserCell id="123" />
```

## API Reference

### `createCell(definition)`

Creates a Cell component from a definition.

```typescript
interface CellDefinition<TData, TVariables> {
  // Data fetching (choose one)
  QUERY?: string;                    // GraphQL query
  fetch?: (vars: TVariables) => Promise<TData>;  // Fetch function

  // State components
  Loading?: (props: LoadingProps) => VNode;
  Empty?: (props: EmptyProps) => VNode;
  Failure?: (props: FailureProps) => VNode;
  Success: (props: SuccessProps<TData>) => VNode;  // Required

  // Options
  afterQuery?: (data: TData) => TData;  // Transform data
  isEmpty?: (data: TData) => boolean;   // Custom empty check
  displayName?: string;                  // For debugging
}
```

### State Component Props

#### LoadingProps

```typescript
interface LoadingProps {
  attempts: number;  // Number of load attempts
}
```

#### EmptyProps

```typescript
interface EmptyProps {
  variables: Record<string, unknown>;  // Current variables
}
```

#### FailureProps

```typescript
interface FailureProps {
  error: Error;           // The error that occurred
  retryCount: number;     // Number of retry attempts
  retry: () => void;      // Function to retry
  isRetrying: boolean;    // Whether retry is in progress
}
```

#### SuccessProps

```typescript
type SuccessProps<TData> = TData & {
  refetch: () => Promise<void>;  // Manual refetch
  isRefetching: boolean;          // Refetch in progress
};
```

### Cell Props

All cells accept these props:

```typescript
interface CellProps<TVariables> {
  // Variables passed to fetcher
  ...variables: TVariables;

  // Optional overrides
  cacheKey?: string;      // Custom cache key
  noCache?: boolean;      // Disable caching
  pollInterval?: number;  // Auto-refetch interval (ms)
  onSuccess?: (data) => void;
  onError?: (error) => void;
}
```

## Provider Setup

### CellProvider

Wrap your app with `CellProvider` to configure cells:

```tsx
import { CellProvider } from 'philjs-cells';
import { createGraphQLClient } from 'philjs-graphql';

const graphqlClient = createGraphQLClient({
  endpoint: '/graphql',
});

function App() {
  return (
    <CellProvider
      graphqlClient={graphqlClient}
      defaultCacheTTL={5 * 60 * 1000}
      retry={{ maxRetries: 3 }}
    >
      <MyApp />
    </CellProvider>
  );
}
```

### SSR Support

```tsx
import { CellSSRProvider, getCellHydrationScript } from 'philjs-cells';
import { renderToString } from '@philjs/core/render-to-string';

// Server
const ssrContext = { /* ... */ };
const html = await renderToString(
  <CellSSRProvider>
    <App />
  </CellSSRProvider>
);

const hydrationScript = getCellHydrationScript(ssrContext);
// Inject into HTML before </body>
```

## Cache Management

### Accessing Cache

```tsx
import { cellCache, useCellInvalidate } from 'philjs-cells';

// Invalidate specific cells
const invalidate = useCellInvalidate();
invalidate(/^user/);  // Invalidate all user-related cells

// Warm cache
import { warmCache } from 'philjs-cells';
warmCache({
  'cell:users:': prefetchedUsers,
  'cell:config:': appConfig,
});
```

### Prefetching

```tsx
import { useCellPrefetch } from 'philjs-cells';

function UsersList() {
  const prefetch = useCellPrefetch();

  return (
    <ul>
      {users.map(user => (
        <li
          key={user.id}
          onMouseEnter={() => prefetch(UserCell, { id: user.id })}
        >
          {user.name}
        </li>
      ))}
    </ul>
  );
}
```

## Advanced Patterns

### Typed Cells

```tsx
import { createTypedCell } from 'philjs-cells';

interface UserData {
  user: { id: string; name: string; email: string };
}

interface UserVariables {
  id: string;
}

const createUserCell = createTypedCell<UserData, UserVariables>();

export default createUserCell({
  fetch: async ({ id }) => {
    const res = await fetch(`/api/users/${id}`);
    return res.json();
  },
  Success: ({ user }) => <UserProfile user={user} />,
});
```

### Cell with Retry

```tsx
import { createCellWithRetry } from 'philjs-cells';

export default createCellWithRetry(
  {
    fetch: fetchUsers,
    Success: UsersList,
  },
  {
    maxRetries: 5,
    retryDelay: 1000,
    backoffMultiplier: 2,
    shouldRetry: (error, attempt) => {
      // Only retry network errors
      return error.message.includes('network');
    },
  }
);
```

### Dependent Cells

```tsx
import { createDependentCell } from 'philjs-cells';

// UserPostsCell depends on UserCell data
const UserPostsCell = createDependentCell(UserCell, {
  fetch: async ({ user }) => {
    const res = await fetch(`/api/users/${user.id}/posts`);
    return res.json();
  },
  Success: ({ posts }) => <PostsList posts={posts} />,
});
```

## CLI Generator

Generate cells using the PhilJS CLI:

```bash
# Generate a GraphQL cell
philjs generate cell Users

# Generate a fetch-based cell
philjs generate cell Users --fetch

# JavaScript instead of TypeScript
philjs generate cell Users --js

# Custom directory
philjs generate cell Users -d src/components/cells
```

## Best Practices

1. **One Cell per data requirement** - Keep cells focused on a single data fetch
2. **Use TypeScript** - Get full type inference for your data
3. **Handle all states** - Always provide Loading, Empty, and Failure components
4. **Use variables for dynamic data** - Pass IDs and filters as props
5. **Leverage caching** - Use appropriate TTL for your data freshness needs
6. **Prefetch on hover** - Improve perceived performance

<!-- API_SNAPSHOT_START -->
## API Snapshot

This section is generated from the package source. Run `node scripts/generate-package-atlas.mjs` to refresh.

### Entry Points
- Export keys: ., ./cell, ./context, ./cache
- Source files: packages/philjs-cells/src/index.ts, packages/philjs-cells/src/cell.ts, packages/philjs-cells/src/context.ts, packages/philjs-cells/src/cache.ts

### Public API
- Direct exports: CacheStats, CellContext, CellProvider, CellProviderProps, CellSSRContext, CellSSRProvider, CellSSRProviderProps, batchInvalidate, cellCache, composeCells, createCell, createCellCacheKey, createCellWithRetry, createDependentCell, createScopedCache, createTypedCell, generateCacheKey, getCellHydrationScript, hydrateCells, initializeCellsFromWindow, inspectCache, logCacheStats, serializeCellData, setupCacheGC, useCellContext, useCellInvalidate, useCellPrefetch, useCellSSR, warmCache
- Re-exported names: CacheStats, CellCache, CellCacheEntry, CellComponent, CellContextValue, CellDataType, CellDefinition, CellFetcher, CellProps, CellProvider, CellProviderConfig, CellQuery, CellSSRContext, CellSSRProvider, CellState, CellStateComponents, CellVariablesType, EmptyCheckFn, EmptyProps, FailureProps, GraphQLResult, LoadingProps, PartialExcept, ReactiveCellState, SuccessProps, batchInvalidate, cellCache, composeCells, createCell, createCellCacheKey, createCellWithRetry, createDependentCell, createScopedCache, createTypedCell, defaultIsEmpty, generateCacheKey, getCellHydrationScript, hydrateCells, initializeCellsFromWindow, inspectCache, logCacheStats, serializeCellData, setupCacheGC, useCellContext, useCellInvalidate, useCellPrefetch, useCellSSR, warmCache
- Re-exported modules: ./cache.js, ./cell.js, ./context.js, ./types.js
<!-- API_SNAPSHOT_END -->

## License

MIT
