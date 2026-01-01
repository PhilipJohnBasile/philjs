# Queries

Declarative data fetching with automatic caching, deduplication, and revalidation.

## What You'll Learn

- Creating queries
- Query caching
- Automatic refetching
- Dependent queries
- Parallel queries
- Query invalidation
- Best practices

## What are Queries?

Queries provide a declarative way to fetch and cache data:

**Benefits:**
- Automatic caching
- Request deduplication
- Background refetching
- Stale-while-revalidate
- TypeScript inference
- Loading and error states

## Basic Queries

### Creating a Query

```typescript
import { createQuery } from '@philjs/core';

interface User {
  id: string;
  name: string;
  email: string;
}

const userQuery = createQuery({
  key: (userId: string) => ['user', userId],
  fetcher: async (userId: string) => {
    const res = await fetch(`/api/users/${userId}`);
    if (!res.ok) throw new Error('Failed to fetch user');
    return res.json() as Promise<User>;
  }
});
```

### Using a Query

```typescript
import { signal, effect } from '@philjs/core';

function UserProfile({ userId }: { userId: string }) {
  const { data, loading, error, refetch } = userQuery(userId);

  if (loading()) return <Spinner />;
  if (error()) return <Error message={error()!.message} />;

  return (
    <div>
      <h1>{data()!.name}</h1>
      <p>{data()!.email}</p>
      <button onClick={refetch}>Refresh</button>
    </div>
  );
}
```

## Query Keys

Query keys identify and cache queries:

### Simple Keys

```typescript
const postsQuery = createQuery({
  key: () => ['posts'],
  fetcher: async () => {
    const res = await fetch('/api/posts');
    return res.json();
  }
});
```

### Parameterized Keys

```typescript
const postQuery = createQuery({
  key: (postId: string) => ['post', postId],
  fetcher: async (postId: string) => {
    const res = await fetch(`/api/posts/${postId}`);
    return res.json();
  }
});
```

### Complex Keys

```typescript
interface PostsFilter {
  category?: string;
  page?: number;
  limit?: number;
}

const postsQuery = createQuery({
  key: (filter: PostsFilter) => ['posts', filter],
  fetcher: async (filter: PostsFilter) => {
    const params = new URLSearchParams();
    if (filter.category) params.set('category', filter.category);
    if (filter.page) params.set('page', filter.page.toString());
    if (filter.limit) params.set('limit', filter.limit.toString());

    const res = await fetch(`/api/posts?${params}`);
    return res.json();
  }
});

// Usage
const { data } = postsQuery({ category: 'tech', page: 1, limit: 10 });
```

## Query Options

### Stale Time

```typescript
const userQuery = createQuery({
  key: (userId: string) => ['user', userId],
  fetcher: async (userId: string) => {
    const res = await fetch(`/api/users/${userId}`);
    return res.json();
  },
  staleTime: 60000 // 1 minute - data is fresh for 60s
});
```

### Cache Time

```typescript
const postsQuery = createQuery({
  key: () => ['posts'],
  fetcher: fetchPosts,
  cacheTime: 300000 // 5 minutes - keep unused data for 5 minutes
});
```

### Refetch Interval

```typescript
const statsQuery = createQuery({
  key: () => ['stats'],
  fetcher: fetchStats,
  refetchInterval: 10000 // Refetch every 10 seconds
});
```

### Refetch on Window Focus

```typescript
const dataQuery = createQuery({
  key: () => ['data'],
  fetcher: fetchData,
  refetchOnWindowFocus: true // Refetch when user returns to tab
});
```

### Retry

```typescript
const dataQuery = createQuery({
  key: () => ['data'],
  fetcher: fetchData,
  retry: 3, // Retry 3 times on failure
  retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000)
});
```

## Dependent Queries

Queries that depend on other queries:

```typescript
const userQuery = createQuery({
  key: (userId: string) => ['user', userId],
  fetcher: async (userId: string) => {
    const res = await fetch(`/api/users/${userId}`);
    return res.json();
  }
});

const userPostsQuery = createQuery({
  key: (userId: string) => ['user-posts', userId],
  fetcher: async (userId: string) => {
    const res = await fetch(`/api/users/${userId}/posts`);
    return res.json();
  }
});

function UserProfile({ userId }: { userId: string }) {
  const { data: user, loading: userLoading } = userQuery(userId);
  const { data: posts, loading: postsLoading } = userPostsQuery(userId);

  if (userLoading() || postsLoading()) return <Spinner />;

  return (
    <div>
      <h1>{user()!.name}</h1>
      <PostList posts={posts()!} />
    </div>
  );
}
```

### Conditional Queries

```typescript
function UserPosts({ userId }: { userId: string | null }) {
  const enabled = signal(!!userId);

  const { data, loading } = userPostsQuery(userId!, {
    enabled: enabled() // Only fetch if enabled
  });

  if (!userId) return <div>No user selected</div>;
  if (loading()) return <Spinner />;

  return <PostList posts={data()!} />;
}
```

## Parallel Queries

Fetch multiple queries simultaneously:

```typescript
function Dashboard() {
  const { data: stats } = statsQuery();
  const { data: users } = usersQuery();
  const { data: posts } = postsQuery();

  // All queries run in parallel

  return (
    <div>
      <StatsWidget stats={stats()} />
      <UsersList users={users()} />
      <PostsList posts={posts()} />
    </div>
  );
}
```

## Query Refetching

### Manual Refetch

```typescript
function UserProfile({ userId }: { userId: string }) {
  const { data, refetch } = userQuery(userId);

  return (
    <div>
      <h1>{data()!.name}</h1>
      <button onClick={refetch}>Refresh</button>
    </div>
  );
}
```

### Refetch All

```typescript
import { refetchAll } from '@philjs/core';

function RefreshButton() {
  return (
    <button onClick={() => refetchAll()}>
      Refresh All Data
    </button>
  );
}
```

### Refetch by Key

```typescript
import { refetchQueries } from '@philjs/core';

function refreshUserData(userId: string) {
  // Refetch all queries with matching key
  refetchQueries(['user', userId]);
}
```

## Query Invalidation

Mark queries as stale and refetch:

```typescript
import { invalidateQueries } from '@philjs/core';

async function updateUser(userId: string, data: any) {
  const res = await fetch(`/api/users/${userId}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  });

  // Invalidate user query
  invalidateQueries(['user', userId]);

  return res.json();
}
```

### Invalidate Multiple

```typescript
async function deletePost(postId: string) {
  await fetch(`/api/posts/${postId}`, { method: 'DELETE' });

  // Invalidate related queries
  invalidateQueries(['post', postId]);
  invalidateQueries(['posts']); // All posts lists
}
```

## Optimistic Updates

Update UI before server responds:

```typescript
import { setQueryData, invalidateQueries } from '@philjs/core';

async function updateUserOptimistic(userId: string, data: Partial<User>) {
  // Save current data for rollback
  const previousUser = getQueryData(['user', userId]);

  // Optimistically update
  setQueryData(['user', userId], (old: User) => ({
    ...old,
    ...data
  }));

  try {
    // Make API call
    const updated = await fetch(`/api/users/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    }).then(r => r.json());

    // Update with server response
    setQueryData(['user', userId], updated);
  } catch (error) {
    // Rollback on error
    setQueryData(['user', userId], previousUser);
    throw error;
  }
}
```

## Pagination

### Offset-Based Pagination

```typescript
const postsQuery = createQuery({
  key: (page: number) => ['posts', page],
  fetcher: async (page: number) => {
    const res = await fetch(`/api/posts?page=${page}&limit=10`);
    return res.json();
  },
  keepPreviousData: true // Keep old data while fetching new page
});

function PostsList() {
  const page = signal(1);
  const { data, loading } = postsQuery(page());

  return (
    <div>
      {loading() && <Spinner />}

      {data() && (
        <div>
          {data()!.posts.map(post => (
            <PostCard key={post.id} post={post} />
          ))}

          <div>
            <button
              onClick={() => page.set(p => Math.max(1, p - 1))}
              disabled={page() === 1}
            >
              Previous
            </button>

            <span>Page {page()}</span>

            <button
              onClick={() => page.set(p => p + 1)}
              disabled={!data()!.hasMore}
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
```

### Cursor-Based Pagination

```typescript
const postsQuery = createQuery({
  key: (cursor: string | null) => ['posts', cursor],
  fetcher: async (cursor: string | null) => {
    const url = cursor
      ? `/api/posts?cursor=${cursor}`
      : '/api/posts';

    const res = await fetch(url);
    return res.json();
  }
});

function PostsList() {
  const cursor = signal<string | null>(null);
  const { data, loading } = postsQuery(cursor());

  const loadMore = () => {
    if (data()?.nextCursor) {
      cursor.set(data()!.nextCursor);
    }
  };

  return (
    <div>
      {data()?.posts.map(post => (
        <PostCard key={post.id} post={post} />
      ))}

      {data()?.nextCursor && (
        <button onClick={loadMore} disabled={loading()}>
          Load More
        </button>
      )}
    </div>
  );
}
```

## Infinite Queries

Continuously append data:

```typescript
import { createInfiniteQuery } from '@philjs/core';

const infinitePostsQuery = createInfiniteQuery({
  key: () => ['posts-infinite'],
  fetcher: async ({ pageParam = 0 }) => {
    const res = await fetch(`/api/posts?offset=${pageParam}&limit=10`);
    return res.json();
  },
  getNextPageParam: (lastPage, allPages) => {
    return lastPage.hasMore ? allPages.length * 10 : undefined;
  }
});

function InfinitePostsList() {
  const {
    data,
    loading,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage
  } = infinitePostsQuery();

  return (
    <div>
      {data()?.pages.flatMap(page =>
        page.posts.map(post => (
          <PostCard key={post.id} post={post} />
        ))
      )}

      {hasNextPage() && (
        <button
          onClick={() => fetchNextPage()}
          disabled={isFetchingNextPage()}
        >
          {isFetchingNextPage() ? 'Loading...' : 'Load More'}
        </button>
      )}
    </div>
  );
}
```

## Prefetching

Load data before it's needed:

```typescript
import { prefetchQuery } from '@philjs/core';

function ProductCard({ product }: { product: Product }) {
  const handleMouseEnter = () => {
    // Prefetch product details on hover
    prefetchQuery(productQuery(product.id));
  };

  return (
    <Link
      href={`/products/${product.id}`}
      onMouseEnter={handleMouseEnter}
    >
      <img src={product.image} alt={product.name} />
      <h3>{product.name}</h3>
    </Link>
  );
}
```

## Query Status

Track query state:

```typescript
function DataComponent() {
  const query = dataQuery();

  if (query.isLoading()) return <Spinner />;
  if (query.isError()) return <Error error={query.error()!} />;
  if (query.isSuccess()) return <Data data={query.data()!} />;

  return null;
}
```

### Fine-Grained Status

```typescript
const {
  data,
  loading,
  error,
  isLoading,     // Initial load
  isFetching,    // Any fetch (including background)
  isRefetching,  // Manual refetch
  isStale,       // Data is stale
  isSuccess,
  isError
} = dataQuery();
```

## Best Practices

### Use Query Keys Wisely

```typescript
// ✅ Good - hierarchical keys
['posts']                    // All posts
['posts', { page: 1 }]      // First page
['post', postId]            // Single post
['user', userId, 'posts']   // User's posts

// ❌ Bad - inconsistent keys
['getAllPosts']
['post_' + postId]
[userId + '-posts']
```

### Set Appropriate Stale Times

```typescript
// ✅ Match stale time to data volatility

// Rarely changes - long stale time
const countriesQuery = createQuery({
  key: () => ['countries'],
  fetcher: fetchCountries,
  staleTime: Infinity // Never stale
});

// Changes frequently - short stale time
const stockPriceQuery = createQuery({
  key: (symbol: string) => ['stock', symbol],
  fetcher: fetchStockPrice,
  staleTime: 5000 // 5 seconds
});
```

### Handle Loading States

```typescript
// ✅ Show skeleton while loading
if (loading()) return <Skeleton />;

// ❌ Blank screen
if (loading()) return null;
```

### Invalidate Related Queries

```typescript
// ✅ Invalidate all related data
async function createPost(data: any) {
  const post = await api.posts.create(data);

  // Invalidate lists
  invalidateQueries(['posts']);
  invalidateQueries(['user', post.authorId, 'posts']);

  return post;
}

// ❌ Forget to invalidate
async function createPost(data: any) {
  return await api.posts.create(data);
}
```

### Use TypeScript

```typescript
// ✅ Type-safe queries
interface User {
  id: string;
  name: string;
}

const userQuery = createQuery<User, string>({
  key: (userId: string) => ['user', userId],
  fetcher: async (userId: string): Promise<User> => {
    const res = await fetch(`/api/users/${userId}`);
    return res.json();
  }
});

// Full type inference
const { data } = userQuery('123');
const name = data()?.name; // TypeScript knows this is string | undefined
```

## Summary

You've learned:

✅ Creating queries with createQuery
✅ Query keys and caching
✅ Query options (stale time, retry, etc.)
✅ Dependent and parallel queries
✅ Manual refetching
✅ Query invalidation
✅ Optimistic updates
✅ Pagination patterns
✅ Infinite queries
✅ Prefetching
✅ Best practices

Queries simplify data fetching with smart caching!

---

**Next:** [Mutations →](./mutations.md) Update data with optimistic updates


