# Data Layer

The PhilJS data layer provides a comprehensive solution for data fetching, mutations, caching, and state synchronization.

## Overview

```tsx
import {
  createQuery,
  createMutation,
  queryCache,
  invalidateQueries,
  prefetchQuery
} from '@philjs/core';
```

## Queries

### Basic Query

```tsx
import { createQuery } from '@philjs/core';

const users = createQuery({
  key: ['users'],
  fetcher: async () => {
    const response = await fetch('/api/users');
    return response.json();
  }
});

function UserList() {
  if (users.loading()) {
    return <div>Loading users...</div>;
  }

  if (users.error()) {
    return <div>Error: {users.error()!.message}</div>;
  }

  return (
    <ul>
      {users.data()?.map(user => (
        <li key={user.id}>{user.name}</li>
      ))}
    </ul>
  );
}
```

### Query with Parameters

```tsx
import { signal } from '@philjs/core';

const userId = signal(1);

const user = createQuery({
  key: () => ['users', userId()], // Reactive key
  fetcher: async ({ key }) => {
    const [, id] = key;
    const response = await fetch(`/api/users/${id}`);
    return response.json();
  },
  enabled: () => userId() > 0 // Only fetch when enabled
});

// Change userId to refetch
userId.set(2);
```

### Query Options

```tsx
interface QueryOptions<T> {
  key: QueryKey | (() => QueryKey);
  fetcher: (ctx: QueryContext) => Promise<T>;
  enabled?: boolean | (() => boolean);
  staleTime?: number;        // Time before data is considered stale (ms)
  cacheTime?: number;        // Time to keep unused data in cache (ms)
  refetchOnMount?: boolean;  // Refetch when component mounts
  refetchOnFocus?: boolean;  // Refetch when window gains focus
  refetchInterval?: number;  // Auto-refetch interval (ms)
  retry?: number | boolean;  // Retry failed requests
  retryDelay?: number;       // Delay between retries (ms)
  onSuccess?: (data: T) => void;
  onError?: (error: Error) => void;
  onSettled?: (data: T | undefined, error: Error | null) => void;
  select?: (data: T) => any; // Transform data
  placeholderData?: T;       // Show while loading
  initialData?: T;           // Initial data (skips fetch)
}
```

### Query Return Value

```tsx
interface QueryResult<T> {
  data: () => T | undefined;
  error: () => Error | null;
  loading: () => boolean;
  fetching: () => boolean;   // True during refetch
  stale: () => boolean;
  status: () => 'idle' | 'loading' | 'success' | 'error';
  refetch: () => Promise<T>;
  invalidate: () => void;
}
```

## Mutations

### Basic Mutation

```tsx
import { createMutation } from '@philjs/core';

const createUser = createMutation({
  mutator: async (userData: CreateUserInput) => {
    const response = await fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData)
    });
    return response.json();
  },
  onSuccess: () => {
    invalidateQueries(['users']); // Refresh user list
  }
});

function CreateUserForm() {
  const handleSubmit = async (e: Event) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);

    await createUser.mutate({
      name: formData.get('name') as string,
      email: formData.get('email') as string
    });
  };

  return (
    <form onSubmit={handleSubmit}>
      <input name="name" placeholder="Name" />
      <input name="email" type="email" placeholder="Email" />
      <button type="submit" disabled={createUser.loading()}>
        {createUser.loading() ? 'Creating...' : 'Create User'}
      </button>
      {createUser.error() && (
        <p class="error">{createUser.error()!.message}</p>
      )}
    </form>
  );
}
```

### Mutation Options

```tsx
interface MutationOptions<T, V> {
  mutator: (variables: V) => Promise<T>;
  onMutate?: (variables: V) => Promise<any> | any;  // Optimistic update
  onSuccess?: (data: T, variables: V, context: any) => void;
  onError?: (error: Error, variables: V, context: any) => void;
  onSettled?: (data: T | undefined, error: Error | null, variables: V) => void;
  retry?: number | boolean;
  retryDelay?: number;
}
```

### Mutation Return Value

```tsx
interface MutationResult<T, V> {
  mutate: (variables: V) => Promise<T>;
  mutateAsync: (variables: V) => Promise<T>;
  data: () => T | undefined;
  error: () => Error | null;
  loading: () => boolean;
  status: () => 'idle' | 'loading' | 'success' | 'error';
  reset: () => void;
}
```

## Optimistic Updates

### Pattern 1: Manual Optimistic Update

```tsx
const updateTodo = createMutation({
  mutator: async (todo: Todo) => {
    const response = await fetch(`/api/todos/${todo.id}`, {
      method: 'PUT',
      body: JSON.stringify(todo)
    });
    return response.json();
  },
  onMutate: async (newTodo) => {
    // Cancel any outgoing refetches
    await queryCache.cancelQueries(['todos']);

    // Snapshot current value
    const previousTodos = queryCache.get<Todo[]>(['todos']);

    // Optimistically update
    queryCache.set(['todos'], (old: Todo[] = []) =>
      old.map(t => t.id === newTodo.id ? newTodo : t)
    );

    // Return context for rollback
    return { previousTodos };
  },
  onError: (err, newTodo, context) => {
    // Rollback on error
    if (context?.previousTodos) {
      queryCache.set(['todos'], context.previousTodos);
    }
  },
  onSettled: () => {
    // Always refetch after mutation
    invalidateQueries(['todos']);
  }
});
```

### Pattern 2: Toggle with Optimistic UI

```tsx
const toggleTodo = createMutation({
  mutator: async (id: string) => {
    const response = await fetch(`/api/todos/${id}/toggle`, {
      method: 'POST'
    });
    return response.json();
  },
  onMutate: async (id) => {
    const previous = queryCache.get<Todo[]>(['todos']);

    queryCache.set(['todos'], (old: Todo[] = []) =>
      old.map(t => t.id === id ? { ...t, done: !t.done } : t)
    );

    return { previous };
  },
  onError: (_, __, context) => {
    queryCache.set(['todos'], context?.previous);
  }
});
```

## Cache Management

### Query Cache API

```tsx
import { queryCache, invalidateQueries, prefetchQuery } from '@philjs/core';

// Get cached data
const users = queryCache.get<User[]>(['users']);

// Set cached data
queryCache.set(['users'], newUsers);

// Update cached data
queryCache.set(['users'], (old: User[] = []) => [...old, newUser]);

// Invalidate queries (triggers refetch)
invalidateQueries(['users']);              // Exact match
invalidateQueries(['users'], { exact: false }); // Prefix match
invalidateQueries();                       // All queries

// Prefetch data
await prefetchQuery({
  key: ['user', userId],
  fetcher: () => fetchUser(userId)
});

// Check if query exists
const hasUsers = queryCache.has(['users']);

// Remove from cache
queryCache.remove(['users']);

// Clear entire cache
queryCache.clear();
```

### Stale Time vs Cache Time

```tsx
const posts = createQuery({
  key: ['posts'],
  fetcher: fetchPosts,
  staleTime: 5 * 60 * 1000,  // Data is fresh for 5 minutes
  cacheTime: 30 * 60 * 1000  // Keep in cache for 30 minutes
});

// Timeline:
// 0-5 min: Data is fresh, no refetch on mount
// 5-30 min: Data is stale, refetch on mount but show cached
// 30+ min: Data removed from cache, full loading state
```

## Pagination

### Offset-Based Pagination

```tsx
const page = signal(1);
const pageSize = signal(20);

const posts = createQuery({
  key: () => ['posts', { page: page(), pageSize: pageSize() }],
  fetcher: async ({ key }) => {
    const [, params] = key;
    const response = await fetch(
      `/api/posts?page=${params.page}&limit=${params.pageSize}`
    );
    return response.json();
  },
  keepPreviousData: true // Show old data while fetching new page
});

function PostList() {
  return (
    <div>
      {posts.loading() && !posts.data() ? (
        <Spinner />
      ) : (
        <ul>
          {posts.data()?.items.map(post => (
            <li key={post.id}>{post.title}</li>
          ))}
        </ul>
      )}

      <div class="pagination">
        <button
          onClick={() => page.set(p => p - 1)}
          disabled={page() === 1}
        >
          Previous
        </button>
        <span>Page {page()}</span>
        <button
          onClick={() => page.set(p => p + 1)}
          disabled={!posts.data()?.hasMore}
        >
          Next
        </button>
      </div>
    </div>
  );
}
```

### Cursor-Based Pagination

```tsx
const cursor = signal<string | null>(null);

const posts = createQuery({
  key: () => ['posts', { cursor: cursor() }],
  fetcher: async ({ key }) => {
    const [, params] = key;
    const url = params.cursor
      ? `/api/posts?cursor=${params.cursor}`
      : '/api/posts';
    const response = await fetch(url);
    return response.json();
  }
});

function InfinitePostList() {
  return (
    <div>
      <ul>
        {posts.data()?.items.map(post => (
          <li key={post.id}>{post.title}</li>
        ))}
      </ul>

      {posts.data()?.nextCursor && (
        <button
          onClick={() => cursor.set(posts.data()!.nextCursor)}
          disabled={posts.fetching()}
        >
          {posts.fetching() ? 'Loading...' : 'Load More'}
        </button>
      )}
    </div>
  );
}
```

### Infinite Query

```tsx
import { createInfiniteQuery } from '@philjs/core';

const posts = createInfiniteQuery({
  key: ['posts'],
  fetcher: async ({ pageParam = null }) => {
    const url = pageParam
      ? `/api/posts?cursor=${pageParam}`
      : '/api/posts';
    const response = await fetch(url);
    return response.json();
  },
  getNextPageParam: (lastPage) => lastPage.nextCursor
});

function InfiniteFeed() {
  return (
    <div>
      {posts.data()?.pages.flatMap(page =>
        page.items.map(post => (
          <PostCard key={post.id} post={post} />
        ))
      )}

      <button
        onClick={() => posts.fetchNextPage()}
        disabled={!posts.hasNextPage() || posts.isFetchingNextPage()}
      >
        {posts.isFetchingNextPage()
          ? 'Loading...'
          : posts.hasNextPage()
            ? 'Load More'
            : 'No more posts'}
      </button>
    </div>
  );
}
```

## Prefetching

### Prefetch on Hover

```tsx
function UserListItem({ user }: { user: User }) {
  const prefetchUser = () => {
    prefetchQuery({
      key: ['user', user.id],
      fetcher: () => fetchUser(user.id),
      staleTime: 5000
    });
  };

  return (
    <li onMouseEnter={prefetchUser}>
      <a href={`/users/${user.id}`}>{user.name}</a>
    </li>
  );
}
```

### Prefetch on Route

```tsx
// In your router configuration
const routes = [
  {
    path: '/users/:id',
    component: UserProfile,
    loader: async ({ params }) => {
      await prefetchQuery({
        key: ['user', params.id],
        fetcher: () => fetchUser(params.id)
      });
    }
  }
];
```

## Error Handling

### Per-Query Error Handling

```tsx
const users = createQuery({
  key: ['users'],
  fetcher: fetchUsers,
  onError: (error) => {
    toast.error(`Failed to load users: ${error.message}`);
  },
  retry: 3,
  retryDelay: 1000
});
```

### Error Boundaries

```tsx
import { ErrorBoundary } from '@philjs/core';

function App() {
  return (
    <ErrorBoundary
      fallback={(error, reset) => (
        <div>
          <p>Something went wrong: {error.message}</p>
          <button onClick={reset}>Try again</button>
        </div>
      )}
    >
      <UserList />
    </ErrorBoundary>
  );
}
```

### Global Error Handler

```tsx
import { queryCache } from '@philjs/core';

queryCache.setDefaultOptions({
  onError: (error) => {
    if (error.status === 401) {
      redirectToLogin();
    } else {
      captureException(error);
    }
  }
});
```

## Real-Time Data

### Polling

```tsx
const notifications = createQuery({
  key: ['notifications'],
  fetcher: fetchNotifications,
  refetchInterval: 30000 // Poll every 30 seconds
});
```

### WebSocket Integration

```tsx
const messages = createQuery({
  key: ['messages', roomId],
  fetcher: () => fetchMessages(roomId),
  // Initial fetch from REST
});

// Subscribe to WebSocket updates
effect(() => {
  const ws = new WebSocket(`wss://api.example.com/rooms/${roomId()}`);

  ws.onmessage = (event) => {
    const newMessage = JSON.parse(event.data);

    // Update cache with new message
    queryCache.set(['messages', roomId()], (old: Message[] = []) =>
      [...old, newMessage]
    );
  };

  return () => ws.close();
});
```

## TypeScript Integration

```tsx
interface User {
  id: string;
  name: string;
  email: string;
}

interface CreateUserInput {
  name: string;
  email: string;
}

// Fully typed query
const users = createQuery<User[]>({
  key: ['users'],
  fetcher: async () => {
    const response = await fetch('/api/users');
    return response.json();
  }
});

// Fully typed mutation
const createUser = createMutation<User, CreateUserInput>({
  mutator: async (input) => {
    const response = await fetch('/api/users', {
      method: 'POST',
      body: JSON.stringify(input)
    });
    return response.json();
  }
});

// Type inference
users.data()?.forEach(user => {
  console.log(user.name); // string
});
```

## Best Practices

### 1. Consistent Query Keys

```tsx
// Use a factory for consistent keys
const queryKeys = {
  users: {
    all: ['users'] as const,
    list: (filters: UserFilters) => [...queryKeys.users.all, filters] as const,
    detail: (id: string) => [...queryKeys.users.all, id] as const,
  },
  posts: {
    all: ['posts'] as const,
    byUser: (userId: string) => [...queryKeys.posts.all, 'user', userId] as const,
  }
};

// Usage
const users = createQuery({
  key: queryKeys.users.list({ active: true }),
  fetcher: fetchUsers
});

// Invalidate all user queries
invalidateQueries(queryKeys.users.all);
```

### 2. Separate Concerns

```tsx
// queries/users.ts
export const useUsers = () => createQuery({
  key: ['users'],
  fetcher: fetchUsers
});

export const useUser = (id: string) => createQuery({
  key: ['users', id],
  fetcher: () => fetchUser(id)
});

export const useCreateUser = () => createMutation({
  mutator: createUser,
  onSuccess: () => invalidateQueries(['users'])
});
```

### 3. Handle Loading States

```tsx
function UserProfile({ userId }: { userId: string }) {
  const user = useUser(userId);

  // Show skeleton during initial load
  if (user.loading() && !user.data()) {
    return <UserProfileSkeleton />;
  }

  // Show error with retry
  if (user.error()) {
    return (
      <ErrorCard
        message={user.error()!.message}
        onRetry={() => user.refetch()}
      />
    );
  }

  // Show data with background refresh indicator
  return (
    <div>
      {user.fetching() && <RefreshIndicator />}
      <h1>{user.data()!.name}</h1>
      <p>{user.data()!.email}</p>
    </div>
  );
}
```

## Next Steps

- [Forms and Validation](./forms.md)
- [Server-Side Rendering](./ssr.md)
- [Error Handling](./error-handling.md)
