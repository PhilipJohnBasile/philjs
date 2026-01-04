# Async Primitives

PhilJS provides a comprehensive set of async utilities for handling data fetching, mutations, caching, and complex async workflows. These primitives integrate seamlessly with the reactivity system.

## Overview

The async module provides:

- **createAsync**: Advanced async resources with caching, retry, and more
- **createMutation**: Mutations with optimistic updates
- **Cache Management**: Fine-grained cache control
- **Parallel & Waterfall**: Coordinate multiple async operations
- **Suspense Resources**: React-like suspense pattern
- **Debounce & Throttle**: Rate limiting for async functions
- **Queue & Concurrency**: Sequential and limited concurrent execution

## createAsync

### Basic Usage

Create an async resource that tracks loading and error states:

```typescript
import { createAsync } from '@philjs/core';

const users = createAsync(async () => {
  const res = await fetch('/api/users');
  if (!res.ok) throw new Error('Failed to fetch');
  return res.json();
});

// Use in component
function UserList() {
  if (users.loading()) {
    return <Spinner />;
  }

  if (users.error()) {
    return <Error message={users.error()!.message} />;
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

### With Options

```typescript
const users = createAsync(
  async () => {
    const res = await fetch('/api/users');
    return res.json();
  },
  {
    // Initial data while loading
    initialData: [],

    // Cache configuration
    cache: {
      key: 'users',
      ttl: 60000, // 1 minute
      staleTime: 30000 // Consider stale after 30s
    },

    // Retry configuration
    retry: {
      count: 3,
      delay: 1000, // or (attempt) => 1000 * Math.pow(2, attempt)
      condition: (error, attempt) => {
        // Only retry network errors
        return error.message.includes('network');
      }
    },

    // Request timeout
    timeout: 10000,

    // Deduplicate concurrent requests
    dedupe: true,

    // Keep previous data while refetching
    keepPreviousData: true,

    // Placeholder data
    placeholderData: () => getCachedUsers(),

    // Refetch on window focus
    refetchOnFocus: true,

    // Auto refetch interval
    refetchInterval: 30000,

    // Callbacks
    onSuccess: (data) => {
      console.log('Fetched users:', data.length);
    },
    onError: (error) => {
      console.error('Failed to fetch users:', error);
    },
    onSettled: (data, error) => {
      console.log('Request completed');
    }
  }
);
```

### Resource API

```typescript
interface AsyncResource<T> {
  data: () => T | undefined;      // Get data
  error: () => Error | undefined; // Get error
  loading: () => boolean;         // Check if loading
  status: () => 'idle' | 'pending' | 'success' | 'error';
  refetch: () => Promise<T>;      // Manual refetch
  mutate: (data: T | ((prev: T | undefined) => T)) => void; // Update data
}
```

### Dependent Queries

```typescript
const userId = signal<string | null>(null);

// This query only runs when userId is set
const userDetails = createAsync(
  async () => {
    const id = userId();
    if (!id) return null;

    const res = await fetch(`/api/users/${id}`);
    return res.json();
  },
  {
    cache: {
      key: `user-${userId()}`, // Dynamic cache key
      ttl: 60000
    }
  }
);

// Component
function UserDetails() {
  const user = userDetails.data();

  if (!userId()) {
    return <p>Select a user</p>;
  }

  if (userDetails.loading()) {
    return <Spinner />;
  }

  return <UserCard user={user} />;
}
```

## createMutation

### Basic Mutation

```typescript
import { createMutation } from '@philjs/core';

const createUser = createMutation(
  async (userData: CreateUserInput) => {
    const res = await fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData)
    });
    if (!res.ok) throw new Error('Failed to create user');
    return res.json();
  }
);

// Use in component
function CreateUserForm() {
  const handleSubmit = async (e: Event) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);

    try {
      const user = await createUser.mutate({
        name: formData.get('name') as string,
        email: formData.get('email') as string
      });
      console.log('Created user:', user);
    } catch (error) {
      console.error('Failed:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input name="name" placeholder="Name" />
      <input name="email" placeholder="Email" />
      <button
        type="submit"
        disabled={createUser.loading()}
      >
        {createUser.loading() ? 'Creating...' : 'Create'}
      </button>
      {createUser.error() && (
        <p class="error">{createUser.error()!.message}</p>
      )}
    </form>
  );
}
```

### With Optimistic Updates

```typescript
const updateTodo = createMutation(
  async (update: { id: string; done: boolean }) => {
    const res = await fetch(`/api/todos/${update.id}`, {
      method: 'PATCH',
      body: JSON.stringify({ done: update.done })
    });
    return res.json();
  },
  {
    // Optimistically update UI before request completes
    optimisticUpdate: ({ id, done }) => {
      // Return the optimistic data
      return { id, done };
    },

    // Handle errors with rollback
    onError: (error, variables, rollback) => {
      console.error('Update failed:', error);
      rollback(); // Restore previous state
      showToast('Failed to update todo');
    },

    // Success handler
    onSuccess: (data, variables) => {
      console.log('Todo updated:', data);
    },

    // Invalidate cache on success
    invalidate: ['todos']
  }
);
```

### Mutation API

```typescript
interface Mutation<T, V> {
  mutate: (variables: V) => Promise<T>;
  data: () => T | undefined;
  error: () => Error | undefined;
  loading: () => boolean;
  reset: () => void;
}
```

## Cache Management

### Manual Cache Control

```typescript
import { setCache, getCached, invalidateCache, clearCache } from '@philjs/core';

// Set cache data
setCache('users', userData, 60000); // TTL: 1 minute

// Get cached data
const cached = getCached<User[]>('users');

// Invalidate specific key
invalidateCache('users');

// Invalidate by pattern
invalidateCache(/^user-/); // All keys starting with "user-"

// Clear all cache
clearCache();
```

### Cache with Mutations

```typescript
const deleteUser = createMutation(
  async (id: string) => {
    await fetch(`/api/users/${id}`, { method: 'DELETE' });
  },
  {
    onSuccess: () => {
      // Invalidate users cache to refetch
      invalidateCache('users');
    }
  }
);
```

### Prefetching

```typescript
import { preload } from '@philjs/core';

// Prefetch on hover
function UserLink({ id, name }: { id: string; name: string }) {
  const prefetchUser = () => {
    preload(`user-${id}`, async () => {
      const res = await fetch(`/api/users/${id}`);
      return res.json();
    });
  };

  return (
    <a
      href={`/users/${id}`}
      onMouseEnter={prefetchUser}
      onFocus={prefetchUser}
    >
      {name}
    </a>
  );
}
```

## Parallel & Waterfall

### Parallel Execution

Fetch multiple resources simultaneously:

```typescript
import { parallel } from '@philjs/core';

const [users, posts, comments] = await parallel([
  () => fetch('/api/users').then(r => r.json()),
  () => fetch('/api/posts').then(r => r.json()),
  () => fetch('/api/comments').then(r => r.json())
]);

// All results available when all complete
console.log(users, posts, comments);
```

### Waterfall (Sequential)

Fetch resources in sequence, passing results:

```typescript
import { waterfall } from '@philjs/core';

const result = await waterfall([
  async () => {
    // First: get user
    return fetch('/api/me').then(r => r.json());
  },
  async (user) => {
    // Second: get user's posts
    return fetch(`/api/users/${user.id}/posts`).then(r => r.json());
  },
  async (posts) => {
    // Third: get comments for first post
    if (posts.length === 0) return [];
    return fetch(`/api/posts/${posts[0].id}/comments`).then(r => r.json());
  }
], null);
```

### Race

Get the first successful result:

```typescript
import { race } from '@philjs/core';

const data = await race([
  () => fetch('/api/primary/data').then(r => r.json()),
  () => fetch('/api/backup/data').then(r => r.json()),
  () => fetch('/api/cache/data').then(r => r.json())
], { timeout: 5000 });
```

## Retry with Backoff

### fetchWithRetry

```typescript
import { fetchWithRetry } from '@philjs/core';

const data = await fetchWithRetry(
  async () => {
    const res = await fetch('/api/unreliable');
    if (!res.ok) throw new Error('Failed');
    return res.json();
  },
  {
    count: 3,
    delay: 1000, // Doubles each retry (exponential backoff)
    condition: (error, attempt) => {
      // Stop retrying on 4xx errors
      if (error.message.includes('404')) return false;
      return true;
    }
  }
);
```

### Custom Retry Logic

```typescript
const data = await fetchWithRetry(
  fetcher,
  {
    count: 5,
    // Custom delay function
    delay: (attempt) => {
      // Exponential backoff with jitter
      const base = 1000 * Math.pow(2, attempt);
      const jitter = Math.random() * 1000;
      return Math.min(base + jitter, 30000);
    }
  }
);
```

## Suspense Resources

### createSuspenseResource

Create React-style suspense resources:

```typescript
import { createSuspenseResource, preload } from '@philjs/core';

const getUser = createSuspenseResource(
  'user',
  async () => {
    const res = await fetch('/api/user');
    return res.json();
  }
);

// Component using suspense
function UserProfile() {
  // This throws a promise while loading (for Suspense boundary)
  const user = getUser();

  return (
    <div>
      <h1>{user.name}</h1>
      <p>{user.email}</p>
    </div>
  );
}

// Wrap with Suspense
<Suspense fallback={<Spinner />}>
  <UserProfile />
</Suspense>
```

### Preloading

```typescript
// Preload data before navigation
function handleNavigate(userId: string) {
  preload(`user-${userId}`, () => fetchUser(userId));
  navigate(`/users/${userId}`);
}
```

## Debounce & Throttle

### debounceAsync

Debounce async functions:

```typescript
import { debounceAsync } from '@philjs/core';

const searchUsers = debounceAsync(
  async (query: string) => {
    const res = await fetch(`/api/search?q=${query}`);
    return res.json();
  },
  300 // Wait 300ms after last call
);

// In component
function SearchInput() {
  const results = signal<User[]>([]);

  const handleInput = async (e: Event) => {
    const query = (e.target as HTMLInputElement).value;
    const data = await searchUsers(query);
    results.set(data);
  };

  return (
    <div>
      <input onInput={handleInput} placeholder="Search users..." />
      <ul>
        {results().map(user => (
          <li key={user.id}>{user.name}</li>
        ))}
      </ul>
    </div>
  );
}
```

### throttleAsync

Throttle async functions:

```typescript
import { throttleAsync } from '@philjs/core';

const saveDocument = throttleAsync(
  async (content: string) => {
    await fetch('/api/document', {
      method: 'PUT',
      body: JSON.stringify({ content })
    });
  },
  5000 // At most once every 5 seconds
);

// Auto-save on change
effect(() => {
  const content = document.content();
  saveDocument(content);
});
```

## Queue & Concurrency

### Sequential Queue

Process tasks one at a time:

```typescript
import { createQueue } from '@philjs/core';

const uploadQueue = createQueue<string>();

// Add uploads to queue
async function uploadFile(file: File) {
  const result = await uploadQueue.add(async () => {
    const formData = new FormData();
    formData.append('file', file);

    const res = await fetch('/api/upload', {
      method: 'POST',
      body: formData
    });

    return res.json();
  });

  console.log('Uploaded:', result.url);
  return result.url;
}

// Queue multiple files (processed sequentially)
for (const file of files) {
  uploadFile(file);
}

// Check queue status
console.log('Pending uploads:', uploadQueue.size());

// Clear queue
uploadQueue.clear();
```

### Concurrency Limiter

Limit parallel operations:

```typescript
import { createConcurrencyLimiter } from '@philjs/core';

const limiter = createConcurrencyLimiter(3); // Max 3 concurrent

async function fetchWithLimit(url: string) {
  return limiter.run(async () => {
    const res = await fetch(url);
    return res.json();
  });
}

// Process many URLs with max 3 concurrent requests
const urls = [/* many URLs */];
const results = await Promise.all(
  urls.map(url => fetchWithLimit(url))
);

// Check active count
console.log('Active requests:', limiter.active());
```

## Integration with Signals

### Reactive Fetching

```typescript
const userId = signal<string | null>(null);
const userDetails = signal<User | null>(null);
const isLoading = signal(false);

// Effect that fetches when userId changes
effect(() => {
  const id = userId();
  if (!id) {
    userDetails.set(null);
    return;
  }

  const controller = new AbortController();
  isLoading.set(true);

  fetch(`/api/users/${id}`, { signal: controller.signal })
    .then(r => r.json())
    .then(user => {
      userDetails.set(user);
      isLoading.set(false);
    })
    .catch(err => {
      if (err.name !== 'AbortError') {
        console.error(err);
        isLoading.set(false);
      }
    });

  onCleanup(() => controller.abort());
});
```

### Polling

```typescript
const pollInterval = signal(5000);
const data = signal<Data | null>(null);

effect(() => {
  const interval = pollInterval();

  const fetchData = async () => {
    try {
      const res = await fetch('/api/data');
      data.set(await res.json());
    } catch (err) {
      console.error('Poll failed:', err);
    }
  };

  // Initial fetch
  fetchData();

  // Poll at interval
  const id = setInterval(fetchData, interval);

  onCleanup(() => clearInterval(id));
});

// Stop polling
pollInterval.set(0); // or handle in effect
```

## Best Practices

### 1. Handle All States

```typescript
function DataView() {
  const resource = createAsync(fetchData);

  // Handle idle state (before first fetch)
  if (resource.status() === 'idle') {
    return <button onClick={() => resource.refetch()}>Load</button>;
  }

  // Handle loading
  if (resource.loading()) {
    return <Spinner />;
  }

  // Handle error
  if (resource.error()) {
    return (
      <div>
        <p>Error: {resource.error()!.message}</p>
        <button onClick={() => resource.refetch()}>Retry</button>
      </div>
    );
  }

  // Handle success
  return <DataDisplay data={resource.data()!} />;
}
```

### 2. Use Appropriate Caching

```typescript
// Frequently changing data: short TTL
const notifications = createAsync(fetchNotifications, {
  cache: { key: 'notifications', ttl: 30000 }
});

// Rarely changing data: long TTL
const config = createAsync(fetchConfig, {
  cache: { key: 'config', ttl: 3600000 } // 1 hour
});

// User-specific data: include user in key
const userPrefs = createAsync(fetchUserPrefs, {
  cache: { key: `prefs-${userId()}`, ttl: 60000 }
});
```

### 3. Implement Optimistic Updates

```typescript
const toggleTodo = createMutation(
  (id: string) => api.toggleTodo(id),
  {
    optimisticUpdate: (id) => {
      // Return optimistic state
      const todo = todos().find(t => t.id === id);
      return todo ? { ...todo, done: !todo.done } : null;
    },
    onError: (error, id, rollback) => {
      rollback();
      showToast('Failed to update');
    }
  }
);
```

### 4. Cancel Stale Requests

```typescript
effect(() => {
  const query = searchQuery();
  const controller = new AbortController();

  // Previous request is aborted on cleanup
  fetch(`/api/search?q=${query}`, { signal: controller.signal })
    .then(r => r.json())
    .then(setResults)
    .catch(() => {}); // Ignore abort errors

  onCleanup(() => controller.abort());
});
```

### 5. Deduplicate Requests

```typescript
const users = createAsync(fetchUsers, {
  cache: { key: 'users' },
  dedupe: true // Only one request in flight
});

// Multiple components calling users.refetch()
// will share the same request
```

## Next Steps

- [Signals and Reactivity](./signals.md) - Foundation of reactivity
- [Effects and Lifecycle](./effects-lifecycle.md) - Side effects
- [Store](./store.md) - Complex state management
- [API Reference](./api-reference.md) - Complete API documentation
