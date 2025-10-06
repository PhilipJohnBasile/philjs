# Suspense and Async

Handle async operations gracefully with loading states, error boundaries, and suspense patterns.

## What You'll Learn

- Async component patterns
- Suspense boundaries
- Resource loading
- Error handling
- Concurrent rendering

## Async Components

Components that load data asynchronously:

```typescript
function UserProfile({ userId }: { userId: number }) {
  const user = signal<User | null>(null);
  const loading = signal(true);
  const error = signal<Error | null>(null);

  effect(() => {
    loading.set(true);
    error.set(null);

    fetch(`/api/users/${userId}`)
      .then(res => res.json())
      .then(data => {
        user.set(data);
        loading.set(false);
      })
      .catch(err => {
        error.set(err);
        loading.set(false);
      });
  });

  if (loading()) return <Spinner />;
  if (error()) return <ErrorMessage error={error()!} />;
  if (!user()) return <NotFound />;

  return (
    <div>
      <h1>{user()!.name}</h1>
      <p>{user()!.email}</p>
    </div>
  );
}
```

## Suspense Pattern

Create a suspense boundary that handles loading states:

```typescript
interface SuspenseProps {
  children: any;
  fallback: any;
}

function Suspense({ children, fallback }: SuspenseProps) {
  const isLoading = signal(true);
  const error = signal<Error | null>(null);

  // Simplified suspense implementation
  try {
    const result = children;

    if (isLoading()) {
      return fallback;
    }

    return result;
  } catch (e) {
    if (e instanceof Promise) {
      // Component suspended - show fallback
      e.finally(() => isLoading.set(false));
      return fallback;
    }

    // Actual error - rethrow to error boundary
    throw e;
  }
}

// Usage:
<Suspense fallback={<Spinner />}>
  <UserProfile userId={123} />
</Suspense>
```

## Resource Pattern

Wrap async operations in a resource:

```typescript
interface Resource<T> {
  read: () => T;
}

function createResource<T>(fetcher: () => Promise<T>): Resource<T> {
  let status = 'pending';
  let result: T;
  let error: Error;

  const promise = fetcher()
    .then(data => {
      status = 'success';
      result = data;
    })
    .catch(err => {
      status = 'error';
      error = err;
    });

  return {
    read() {
      switch (status) {
        case 'pending':
          throw promise; // Suspend
        case 'error':
          throw error; // Error boundary catches
        case 'success':
          return result; // Return data
      }
    }
  };
}

// Usage:
const userResource = createResource(() =>
  fetch('/api/user').then(r => r.json())
);

function UserProfile() {
  const user = userResource.read(); // Suspends if not ready

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

## Loading States

### Skeleton Screens

```typescript
function UserProfileSkeleton() {
  return (
    <div className="skeleton">
      <div className="skeleton-avatar" />
      <div className="skeleton-name" />
      <div className="skeleton-bio" />
    </div>
  );
}

<Suspense fallback={<UserProfileSkeleton />}>
  <UserProfile />
</Suspense>
```

### Progressive Loading

```typescript
function Dashboard() {
  return (
    <div>
      {/* Critical content loads first */}
      <Header />

      {/* Secondary content suspends independently */}
      <Suspense fallback={<StatsSkeleton />}>
        <Stats />
      </Suspense>

      <Suspense fallback={<ChartSkeleton />}>
        <Charts />
      </Suspense>

      <Suspense fallback={<ActivitySkeleton />}>
        <RecentActivity />
      </Suspense>
    </div>
  );
}
```

## Error Handling

Combine Suspense with Error Boundaries:

```typescript
function App() {
  return (
    <ErrorBoundary fallback={<ErrorMessage />}>
      <Suspense fallback={<Spinner />}>
        <Dashboard />
      </Suspense>
    </ErrorBoundary>
  );
}
```

### Per-Component Error Handling

```typescript
function Dashboard() {
  return (
    <div>
      <ErrorBoundary fallback={<StatsError />}>
        <Suspense fallback={<StatsSkeleton />}>
          <Stats />
        </Suspense>
      </ErrorBoundary>

      <ErrorBoundary fallback={<ChartError />}>
        <Suspense fallback={<ChartSkeleton />}>
          <Charts />
        </Suspense>
      </ErrorBoundary>
    </div>
  );
}
```

## Data Fetching Patterns

### Parallel Fetching

```typescript
function Page() {
  // Both fetch in parallel
  const userResource = createResource(() =>
    fetch('/api/user').then(r => r.json())
  );

  const postsResource = createResource(() =>
    fetch('/api/posts').then(r => r.json())
  );

  return (
    <div>
      <Suspense fallback={<UserSkeleton />}>
        <User resource={userResource} />
      </Suspense>

      <Suspense fallback={<PostsSkeleton />}>
        <Posts resource={postsResource} />
      </Suspense>
    </div>
  );
}
```

### Sequential Fetching

```typescript
function UserPosts({ userId }: { userId: number }) {
  // Fetch user first
  const user = createResource(() =>
    fetch(`/api/users/${userId}`).then(r => r.json())
  ).read();

  // Then fetch their posts
  const posts = createResource(() =>
    fetch(`/api/users/${userId}/posts`).then(r => r.json())
  ).read();

  return (
    <div>
      <h1>{user.name}'s Posts</h1>
      {posts.map(post => (
        <PostCard key={post.id} post={post} />
      ))}
    </div>
  );
}
```

### Waterfall (Avoid This)

```typescript
// ❌ Bad - creates waterfall
function Page() {
  const user = useUser(); // Waits...

  if (!user) return <Spinner />;

  return <UserPosts userId={user.id} />; // Then starts loading posts
}

// ✅ Good - parallel
function Page() {
  return (
    <Suspense fallback={<Spinner />}>
      <UserPostsOptimized />
    </Suspense>
  );
}

function UserPostsOptimized() {
  const userId = getCurrentUserId();

  // Start loading immediately
  const postsResource = createResource(() =>
    fetch(`/api/users/${userId}/posts`).then(r => r.json())
  );

  const posts = postsResource.read();

  return posts.map(post => <PostCard key={post.id} post={post} />);
}
```

## Transitions

Show stale content while loading new data:

```typescript
function SearchResults() {
  const query = signal('');
  const isPending = signal(false);
  const results = signal<Result[]>([]);

  const search = async (searchQuery: string) => {
    isPending.set(true);

    const data = await fetch(`/api/search?q=${searchQuery}`)
      .then(r => r.json());

    results.set(data);
    isPending.set(false);
  };

  effect(() => {
    const q = query();
    if (q) {
      search(q);
    }
  });

  return (
    <div>
      <input
        value={query()}
        onInput={(e) => query.set(e.target.value)}
        placeholder="Search..."
      />

      <div style={{ opacity: isPending() ? 0.6 : 1 }}>
        {results().map(result => (
          <ResultCard key={result.id} result={result} />
        ))}
      </div>

      {isPending() && <Spinner />}
    </div>
  );
}
```

## Streaming SSR

Server-side rendering with streaming:

```typescript
// Server
app.get('/', async (req, res) => {
  res.write('<!DOCTYPE html><html><head>...</head><body>');
  res.write('<div id="app">');

  // Stream shell immediately
  res.write(renderShell());

  // Stream content as it loads
  const stream = renderToReadableStream(<App />);

  for await (const chunk of stream) {
    res.write(chunk);
  }

  res.write('</div></body></html>');
  res.end();
});
```

## Retry Logic

```typescript
function createResourceWithRetry<T>(
  fetcher: () => Promise<T>,
  maxRetries = 3
): Resource<T> {
  let retries = 0;

  const fetchWithRetry = async (): Promise<T> => {
    try {
      return await fetcher();
    } catch (error) {
      if (retries < maxRetries) {
        retries++;
        await new Promise(resolve => setTimeout(resolve, 1000 * retries));
        return fetchWithRetry();
      }
      throw error;
    }
  };

  return createResource(fetchWithRetry);
}

// Usage:
const userResource = createResourceWithRetry(() =>
  fetch('/api/user').then(r => r.json())
);
```

## Cache Strategy

```typescript
const cache = new Map<string, any>();

function createCachedResource<T>(
  key: string,
  fetcher: () => Promise<T>
): Resource<T> {
  if (cache.has(key)) {
    return createResource(() => Promise.resolve(cache.get(key)));
  }

  const promise = fetcher().then(data => {
    cache.set(key, data);
    return data;
  });

  return createResource(() => promise);
}

// Usage:
const userResource = createCachedResource(
  `user-${userId}`,
  () => fetch(`/api/users/${userId}`).then(r => r.json())
);
```

## Best Practices

### Show Meaningful Loading States

```typescript
// ❌ Generic spinner
<Suspense fallback={<Spinner />}>

// ✅ Content-specific skeleton
<Suspense fallback={<DashboardSkeleton />}>
```

### Handle Errors Gracefully

```typescript
// ✅ Combine error boundaries with suspense
<ErrorBoundary fallback={<ErrorView />}>
  <Suspense fallback={<LoadingView />}>
    <Content />
  </Suspense>
</ErrorBoundary>
```

### Avoid Loading Waterfalls

```typescript
// ❌ Sequential loading
const user = await fetchUser();
const posts = await fetchPosts(user.id);

// ✅ Parallel loading
const [user, posts] = await Promise.all([
  fetchUser(),
  fetchPosts()
]);
```

### Optimize for Perceived Performance

```typescript
// Show critical content first
<div>
  <Header /> {/* Instant */}

  <Suspense fallback={<Skeleton />}>
    <MainContent /> {/* Loads async */}
  </Suspense>
</div>
```

## Common Patterns

### Infinite Scroll

```typescript
function InfiniteList() {
  const page = signal(1);
  const items = signal<Item[]>([]);
  const hasMore = signal(true);

  const loadMore = async () => {
    const data = await fetch(`/api/items?page=${page()}`)
      .then(r => r.json());

    items.set([...items(), ...data.items]);
    hasMore.set(data.hasMore);
    page.set(page() + 1);
  };

  return (
    <div>
      {items().map(item => (
        <ItemCard key={item.id} item={item} />
      ))}

      {hasMore() && (
        <Suspense fallback={<Spinner />}>
          <LoadMore onVisible={loadMore} />
        </Suspense>
      )}
    </div>
  );
}
```

### Optimistic Updates

```typescript
function TodoItem({ todo }: { todo: Todo }) {
  const [optimisticTodo, setOptimisticTodo] = signal(todo);

  const toggleTodo = async () => {
    // Update optimistically
    setOptimisticTodo({ ...todo, done: !todo.done });

    try {
      // Send to server
      await fetch(`/api/todos/${todo.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ done: !todo.done })
      });
    } catch (error) {
      // Revert on error
      setOptimisticTodo(todo);
    }
  };

  return (
    <div>
      <input
        type="checkbox"
        checked={optimisticTodo().done}
        onChange={toggleTodo}
      />
      {optimisticTodo().text}
    </div>
  );
}
```

## Summary

You've learned:

✅ Async component patterns
✅ Suspense boundaries for loading states
✅ Resource pattern for data fetching
✅ Error handling with boundaries
✅ Loading states and skeletons
✅ Parallel vs sequential fetching
✅ Transitions for smooth UX
✅ Retry and cache strategies
✅ Best practices and common patterns

Suspense enables smooth, resilient async UIs!

---

**Congratulations!** You've completed the Core Concepts section. You now understand all fundamental PhilJS concepts!

**Next:** Explore advanced topics like Routing, Data Fetching, and Performance Optimization.
