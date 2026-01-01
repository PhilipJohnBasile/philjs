# Caching Strategies

Master caching to build fast, efficient applications that minimize unnecessary network requests.

## What You'll Learn

- Cache invalidation
- Stale-while-revalidate
- Cache persistence
- Custom cache implementations
- Memory management
- Best practices

## Cache Basics

### How Caching Works

PhilJS caches query results in memory by query key:

```typescript
const userQuery = createQuery({
  key: (userId: string) => ['user', userId],
  fetcher: fetchUser
});

// First call - fetches from network
const { data: user1 } = userQuery('123');

// Second call with same ID - returns from cache
const { data: user2 } = userQuery('123');
```

### Cache Lifecycle

```
1. Query executes → 2. Data fetched → 3. Cached
                                         ↓
                                    4. Becomes stale
                                         ↓
                                    5. Refetched (if active)
                                         ↓
                                    6. Removed (if inactive)
```

## Stale Time

Control when data is considered stale:

```typescript
const postsQuery = createQuery({
  key: () => ['posts'],
  fetcher: fetchPosts,
  staleTime: 60000 // Fresh for 1 minute
});

// Within 60s - returns cache, no refetch
// After 60s - returns cache, refetches in background
```

### Stale Time Patterns

```typescript
// Never stale (static data)
const countriesQuery = createQuery({
  key: () => ['countries'],
  fetcher: fetchCountries,
  staleTime: Infinity
});

// Always stale (real-time data)
const stockQuery = createQuery({
  key: (symbol: string) => ['stock', symbol],
  fetcher: fetchStockPrice,
  staleTime: 0
});

// Smart stale time (5 minutes)
const userQuery = createQuery({
  key: (id: string) => ['user', id],
  fetcher: fetchUser,
  staleTime: 5 * 60 * 1000
});
```

## Cache Time

Control how long unused data stays in cache:

```typescript
const dataQuery = createQuery({
  key: () => ['data'],
  fetcher: fetchData,
  cacheTime: 5 * 60 * 1000 // Keep for 5 minutes after last use
});

// Component unmounts → cache stays for 5 minutes
// If no component uses it → removed after 5 minutes
```

### Cache Time vs Stale Time

```typescript
const query = createQuery({
  key: () => ['data'],
  fetcher: fetchData,
  staleTime: 60000,   // Fresh for 1 minute
  cacheTime: 300000   // Keep in cache for 5 minutes
});

// t=0s:   Fetch and cache (fresh)
// t=30s:  Return from cache (still fresh)
// t=70s:  Return from cache + refetch (stale)
// t=5min: Remove from cache (no active users)
```

## Cache Invalidation

### Manual Invalidation

```typescript
import { invalidateQueries } from '@philjs/core';

// Invalidate specific query
invalidateQueries(['user', userId]);

// Invalidate all users
invalidateQueries(['users']);

// Invalidate by prefix
invalidateQueries(['user']); // Matches ['user', '123'], ['user', '456'], etc.
```

### Automatic Invalidation

```typescript
const updateUserMutation = createMutation({
  mutationFn: updateUser,
  onSuccess: (user) => {
    // Invalidate after successful update
    invalidateQueries(['user', user.id]);
    invalidateQueries(['users']);
  }
});
```

### Conditional Invalidation

```typescript
const deletePostMutation = createMutation({
  mutationFn: deletePost,
  onSuccess: (deletedPost) => {
    // Only invalidate if post was published
    if (deletedPost.published) {
      invalidateQueries(['posts', 'published']);
    }

    invalidateQueries(['user', deletedPost.authorId, 'posts']);
  }
});
```

## Direct Cache Updates

Update cache without refetching:

### Set Query Data

```typescript
import { setQueryData } from '@philjs/core';

// Set entire cache
setQueryData(['user', userId], updatedUser);

// Update with function
setQueryData(['user', userId], (old: User) => ({
  ...old,
  name: newName
}));
```

### Update List Cache

```typescript
// Add item to list
setQueryData(['todos'], (old: Todo[]) => [
  ...old,
  newTodo
]);

// Update item in list
setQueryData(['todos'], (old: Todo[]) =>
  old.map(todo =>
    todo.id === updatedTodo.id ? updatedTodo : todo
  )
);

// Remove item from list
setQueryData(['todos'], (old: Todo[]) =>
  old.filter(todo => todo.id !== deletedId)
);
```

### Optimistic Updates

```typescript
const likeMutation = createMutation({
  mutationFn: likePost,
  onMutate: async (postId) => {
    // Save current data
    const previous = getQueryData(['post', postId]);

    // Optimistically update
    setQueryData(['post', postId], (old: Post) => ({
      ...old,
      likes: old.likes + 1,
      isLiked: true
    }));

    return { previous };
  },
  onError: (err, postId, context) => {
    // Rollback on error
    setQueryData(['post', postId], context.previous);
  },
  onSettled: (data, err, postId) => {
    // Refetch to sync
    invalidateQueries(['post', postId]);
  }
});
```

## Cache Persistence

### LocalStorage Persistence

```typescript
import { persistQueryCache } from '@philjs/core';

// Persist cache to localStorage
persistQueryCache({
  storage: localStorage,
  key: 'philjs-cache',
  maxAge: 24 * 60 * 60 * 1000 // 24 hours
});

// Cache survives page reloads
```

### Custom Storage

```typescript
import { persistQueryCache } from '@philjs/core';

const customStorage = {
  getItem: (key: string) => {
    // Get from IndexedDB, SessionStorage, etc.
    return indexedDB.get(key);
  },
  setItem: (key: string, value: string) => {
    indexedDB.set(key, value);
  },
  removeItem: (key: string) => {
    indexedDB.remove(key);
  }
};

persistQueryCache({
  storage: customStorage,
  key: 'app-cache'
});
```

### Selective Persistence

```typescript
persistQueryCache({
  storage: localStorage,
  key: 'cache',
  // Only persist certain queries
  filter: (query) => {
    const [queryKey] = query.key;
    return ['users', 'posts', 'settings'].includes(queryKey);
  }
});
```

## Background Refetching

### Refetch on Window Focus

```typescript
const query = createQuery({
  key: () => ['data'],
  fetcher: fetchData,
  refetchOnWindowFocus: true
});

// User returns to tab → refetches if stale
```

### Refetch on Reconnect

```typescript
const query = createQuery({
  key: () => ['data'],
  fetcher: fetchData,
  refetchOnReconnect: true
});

// Internet reconnects → refetches if stale
```

### Polling

```typescript
const liveStatsQuery = createQuery({
  key: () => ['stats'],
  fetcher: fetchStats,
  refetchInterval: 10000 // Refetch every 10 seconds
});
```

### Conditional Polling

```typescript
const statsQuery = createQuery({
  key: () => ['stats'],
  fetcher: fetchStats,
  refetchInterval: (data) => {
    // Stop polling if no data
    return data ? 10000 : false;
  }
});
```

## Memory Management

### Automatic Cleanup

```typescript
const query = createQuery({
  key: () => ['data'],
  fetcher: fetchData,
  cacheTime: 5 * 60 * 1000 // Remove after 5 minutes of inactivity
});

// Component mounts → query active
// Component unmounts → 5 minute timer starts
// Timer expires → cache removed
```

### Manual Cleanup

```typescript
import { clearQueryCache, removeQueries } from '@philjs/core';

// Remove specific query
removeQueries(['user', userId]);

// Clear entire cache
clearQueryCache();

// Remove inactive queries
removeQueries({ type: 'inactive' });

// Remove stale queries
removeQueries({ type: 'stale' });
```

### Cache Size Limits

```typescript
import { setQueryCacheConfig } from '@philjs/core';

setQueryCacheConfig({
  maxQueries: 100, // Maximum number of queries
  maxAge: 24 * 60 * 60 * 1000, // Maximum age (24 hours)
  onExceedMax: 'remove-oldest' // What to do when max exceeded
});
```

## Advanced Patterns

### Hierarchical Invalidation

```typescript
// Invalidate all user-related data
function invalidateUserData(userId: string) {
  invalidateQueries(['user', userId]);
  invalidateQueries(['user', userId, 'posts']);
  invalidateQueries(['user', userId, 'comments']);
  invalidateQueries(['user', userId, 'followers']);
  invalidateQueries(['user', userId, 'following']);
}

// Usage
deleteUserMutation({
  onSuccess: (user) => invalidateUserData(user.id)
});
```

### Smart Cache Updates

```typescript
const createPostMutation = createMutation({
  mutationFn: createPost,
  onSuccess: (newPost) => {
    // Add to posts list cache
    setQueryData(['posts'], (old: Post[] | undefined) => {
      if (!old) return [newPost];
      return [newPost, ...old];
    });

    // Update user's post count
    setQueryData(['user', newPost.authorId], (old: User) => ({
      ...old,
      postCount: old.postCount + 1
    }));

    // Set single post cache
    setQueryData(['post', newPost.id], newPost);
  }
});
```

### Partial Updates

```typescript
// Update only changed fields
setQueryData(['user', userId], (old: User) => ({
  ...old,
  ...partialUpdate
}));

// Update nested data
setQueryData(['settings'], (old: Settings) => ({
  ...old,
  notifications: {
    ...old.notifications,
    email: newEmailSetting
  }
}));
```

### Batch Updates

```typescript
import { batch } from '@philjs/core';

batch(() => {
  setQueryData(['user', '1'], user1);
  setQueryData(['user', '2'], user2);
  setQueryData(['user', '3'], user3);
});
// All updates applied together, single re-render
```

## Cache Debugging

### Inspect Cache

```typescript
import { getQueryCache } from '@philjs/core';

// Get all queries in cache
const cache = getQueryCache();

console.log('Cache size:', cache.size);
console.log('Cached queries:', cache.keys());

// Get specific query
const userCache = getQueryData(['user', userId]);
console.log('User cache:', userCache);
```

### Cache Events

```typescript
import { onCacheChange } from '@philjs/core';

onCacheChange((event) => {
  console.log('Cache event:', event.type);
  console.log('Query key:', event.key);
  console.log('Data:', event.data);
});

// Events: 'added', 'updated', 'removed', 'invalidated'
```

## Best Practices

### Choose Appropriate Stale Times

```typescript
// ✅ Match stale time to data volatility
const staticQuery = createQuery({
  staleTime: Infinity // Never changes
});

const slowChangingQuery = createQuery({
  staleTime: 60 * 60 * 1000 // 1 hour
});

const fastChangingQuery = createQuery({
  staleTime: 10000 // 10 seconds
});

// ❌ One size fits all
const query = createQuery({
  staleTime: 5000 // Same for all queries
});
```

### Invalidate Proactively

```typescript
// ✅ Invalidate all affected queries
const updateMutation = createMutation({
  onSuccess: (data) => {
    invalidateQueries(['item', data.id]);
    invalidateQueries(['items']);
    invalidateQueries(['user', data.userId, 'items']);
  }
});

// ❌ Forget related queries
const updateMutation = createMutation({
  onSuccess: (data) => {
    invalidateQueries(['item', data.id]);
    // Missing: items list, user items
  }
});
```

### Use Optimistic Updates Carefully

```typescript
// ✅ Optimistic for simple updates
const likeMutation = createMutation({
  onMutate: async (id) => {
    setQueryData(['likes', id], old => old + 1);
  }
});

// ❌ Optimistic for complex operations
const checkoutMutation = createMutation({
  onMutate: async (data) => {
    // Don't optimistically update complex state
  }
});
```

### Persist Important Data

```typescript
// ✅ Persist user preferences, auth state
persistQueryCache({
  filter: (query) => {
    const [key] = query.key;
    return ['auth', 'settings', 'preferences'].includes(key);
  }
});

// ❌ Persist everything (wastes storage)
persistQueryCache({
  filter: () => true
});
```

### Clean Up Regularly

```typescript
// ✅ Set reasonable cache times
const query = createQuery({
  cacheTime: 5 * 60 * 1000 // 5 minutes
});

// Clear old data periodically
setInterval(() => {
  removeQueries({ type: 'inactive' });
}, 60 * 60 * 1000); // Every hour

// ❌ Keep everything forever
const query = createQuery({
  cacheTime: Infinity
});
```

## Summary

You've learned:

✅ Cache lifecycle and management
✅ Stale time vs cache time
✅ Manual and automatic invalidation
✅ Direct cache updates
✅ Optimistic updates
✅ Cache persistence (localStorage, custom)
✅ Background refetching
✅ Memory management and cleanup
✅ Advanced caching patterns
✅ Best practices

Smart caching makes apps fast and responsive!

---

**Next:** [Real-Time Data →](./real-time.md) WebSockets, SSE, and live updates


