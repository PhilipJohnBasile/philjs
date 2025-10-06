# Data Fetching Overview

Learn how to fetch, cache, and manage data in PhilJS applications.

## What You'll Learn

- Data fetching patterns
- Client vs server data loading
- Caching strategies
- Loading and error states
- Real-time updates
- Best practices

## Data Fetching Patterns

PhilJS supports multiple data fetching approaches:

1. **Client-side fetching** - Fetch in components with effects
2. **Server functions** - Type-safe RPC calls
3. **Queries** - Declarative data fetching with caching
4. **Static generation** - Fetch at build time
5. **Server-side rendering** - Fetch on each request

## Client-Side Fetching

### Basic Fetch in Effect

```typescript
import { signal, effect } from 'philjs-core';

function UserProfile({ userId }: { userId: string }) {
  const user = signal(null);
  const loading = signal(true);
  const error = signal<Error | null>(null);

  effect(() => {
    loading.set(true);
    error.set(null);

    fetch(`/api/users/${userId}`)
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch');
        return res.json();
      })
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
  if (error()) return <Error message={error()!.message} />;
  if (!user()) return null;

  return (
    <div>
      <h1>{user()!.name}</h1>
      <p>{user()!.email}</p>
    </div>
  );
}
```

### Custom Fetch Hook

```typescript
import { signal, effect } from 'philjs-core';

function useFetch<T>(url: string) {
  const data = signal<T | null>(null);
  const loading = signal(true);
  const error = signal<Error | null>(null);

  effect(() => {
    loading.set(true);
    error.set(null);

    fetch(url)
      .then(res => res.json())
      .then(json => {
        data.set(json);
        loading.set(false);
      })
      .catch(err => {
        error.set(err);
        loading.set(false);
      });
  });

  return { data, loading, error };
}

// Usage
function Component() {
  const { data, loading, error } = useFetch<User>('/api/user');

  if (loading()) return <Spinner />;
  if (error()) return <Error />;

  return <div>{data()!.name}</div>;
}
```

## Server Functions

Type-safe server calls without API routes:

```typescript
// src/server/users.ts
'use server';

export async function getUser(id: string) {
  const user = await db.users.findById(id);
  return user;
}

export async function updateUser(id: string, data: Partial<User>) {
  const user = await db.users.update(id, data);
  return user;
}
```

```typescript
// src/pages/profile.tsx
import { getUser, updateUser } from '@/server/users';
import { signal, effect } from 'philjs-core';

export default function Profile({ userId }: { userId: string }) {
  const user = signal(null);

  effect(async () => {
    const data = await getUser(userId);
    user.set(data);
  });

  const handleUpdate = async () => {
    await updateUser(userId, { name: 'New Name' });
    const updated = await getUser(userId);
    user.set(updated);
  };

  return (
    <div>
      <h1>{user()?.name}</h1>
      <button onClick={handleUpdate}>Update</button>
    </div>
  );
}
```

## Queries

Declarative data fetching with automatic caching:

```typescript
import { createQuery } from 'philjs-core';

const userQuery = createQuery({
  key: (userId: string) => ['user', userId],
  fetcher: async (userId: string) => {
    const res = await fetch(`/api/users/${userId}`);
    return res.json();
  }
});

function UserProfile({ userId }: { userId: string }) {
  const { data, loading, error, refetch } = userQuery(userId);

  if (loading()) return <Spinner />;
  if (error()) return <Error />;

  return (
    <div>
      <h1>{data()!.name}</h1>
      <button onClick={refetch}>Refresh</button>
    </div>
  );
}
```

## Mutations

Update data with optimistic updates:

```typescript
import { createMutation, createQuery } from 'philjs-core';

const updateUserMutation = createMutation({
  mutationFn: async ({ id, data }: { id: string; data: Partial<User> }) => {
    const res = await fetch(`/api/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
    return res.json();
  },
  onSuccess: (data) => {
    // Invalidate and refetch
    userQuery.invalidate(data.id);
  }
});

function EditProfile({ user }: { user: User }) {
  const { mutate, loading } = updateUserMutation;

  const handleSave = () => {
    mutate({ id: user.id, data: { name: 'New Name' } });
  };

  return (
    <button onClick={handleSave} disabled={loading()}>
      Save
    </button>
  );
}
```

## Static Generation

Fetch data at build time:

```typescript
// src/pages/blog/[slug].tsx
interface Post {
  slug: string;
  title: string;
  content: string;
}

// Generate static paths
export async function generateStaticParams() {
  const posts = await fetch('https://api.example.com/posts').then(r => r.json());

  return posts.map((post: Post) => ({
    slug: post.slug
  }));
}

// Fetch data for each page
export async function getStaticProps({ params }: { params: { slug: string } }) {
  const post = await fetch(`https://api.example.com/posts/${params.slug}`)
    .then(r => r.json());

  return { props: { post } };
}

export default function BlogPost({ post }: { post: Post }) {
  return (
    <article>
      <h1>{post.title}</h1>
      <div>{post.content}</div>
    </article>
  );
}
```

## Server-Side Rendering

Fetch on each request:

```typescript
// src/pages/dashboard.tsx
export async function getServerSideProps() {
  const stats = await fetchDashboardStats();

  return {
    props: { stats }
  };
}

export default function Dashboard({ stats }: { stats: Stats }) {
  return (
    <div>
      <h1>Dashboard</h1>
      <StatsWidget stats={stats} />
    </div>
  );
}
```

## Caching Strategies

### Memory Cache

```typescript
const cache = new Map<string, any>();

async function fetchWithCache<T>(key: string, fetcher: () => Promise<T>): Promise<T> {
  if (cache.has(key)) {
    return cache.get(key);
  }

  const data = await fetcher();
  cache.set(key, data);
  return data;
}

// Usage
const user = await fetchWithCache(
  `user:${userId}`,
  () => fetch(`/api/users/${userId}`).then(r => r.json())
);
```

### Time-Based Cache

```typescript
interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

class Cache {
  private cache = new Map<string, CacheEntry<any>>();

  set<T>(key: string, data: T) {
    this.cache.set(key, { data, timestamp: Date.now() });
  }

  get<T>(key: string, maxAge = 60000): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (Date.now() - entry.timestamp > maxAge) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }
}

const cache = new Cache();

async function fetchUser(userId: string) {
  // Try cache first (60 second TTL)
  const cached = cache.get<User>(`user:${userId}`, 60000);
  if (cached) return cached;

  // Fetch and cache
  const user = await fetch(`/api/users/${userId}`).then(r => r.json());
  cache.set(`user:${userId}`, user);

  return user;
}
```

## Loading States

### Skeleton Loading

```typescript
function ProductList() {
  const { data, loading } = useProducts();

  if (loading()) {
    return (
      <div className="product-grid">
        {Array.from({ length: 12 }).map((_, i) => (
          <ProductSkeleton key={i} />
        ))}
      </div>
    );
  }

  return (
    <div className="product-grid">
      {data()!.map(product => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
```

### Suspense

```typescript
import { Suspense } from 'philjs-core';

export default function Page() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <DataComponent />
    </Suspense>
  );
}
```

## Error Handling

### Retry Logic

```typescript
async function fetchWithRetry<T>(
  url: string,
  retries = 3
): Promise<T> {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (error) {
      if (i === retries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, i)));
    }
  }
  throw new Error('Max retries exceeded');
}
```

### Error Boundaries

```typescript
import { ErrorBoundary } from 'philjs-core';

export default function Page() {
  return (
    <ErrorBoundary
      fallback={(error, reset) => (
        <div>
          <h2>Failed to load data</h2>
          <p>{error.message}</p>
          <button onClick={reset}>Retry</button>
        </div>
      )}
    >
      <DataComponent />
    </ErrorBoundary>
  );
}
```

## Real-Time Updates

### WebSocket

```typescript
import { signal, effect } from 'philjs-core';

function useWebSocket<T>(url: string) {
  const data = signal<T | null>(null);
  const connected = signal(false);

  effect(() => {
    const ws = new WebSocket(url);

    ws.onopen = () => connected.set(true);
    ws.onclose = () => connected.set(false);
    ws.onmessage = (event) => {
      data.set(JSON.parse(event.data));
    };

    return () => ws.close();
  });

  return { data, connected };
}

function LiveDashboard() {
  const { data, connected } = useWebSocket<Stats>('wss://api.example.com/stats');

  return (
    <div>
      {!connected() && <div>Connecting...</div>}
      {data() && <StatsWidget stats={data()!} />}
    </div>
  );
}
```

### Polling

```typescript
import { signal, effect } from 'philjs-core';

function usePolling<T>(url: string, interval = 5000) {
  const data = signal<T | null>(null);

  effect(() => {
    const fetchData = async () => {
      const res = await fetch(url);
      data.set(await res.json());
    };

    fetchData();
    const timer = setInterval(fetchData, interval);

    return () => clearInterval(timer);
  });

  return { data };
}

function LiveStats() {
  const { data } = usePolling<Stats>('/api/stats', 10000);

  return <StatsWidget stats={data()} />;
}
```

## Best Practices

### Centralize Data Fetching

```typescript
// ✅ Good - centralized API client
// src/lib/api.ts
export const api = {
  users: {
    get: (id: string) => fetch(`/api/users/${id}`).then(r => r.json()),
    list: () => fetch('/api/users').then(r => r.json()),
    create: (data: any) => fetch('/api/users', {
      method: 'POST',
      body: JSON.stringify(data)
    }).then(r => r.json())
  }
};

// Usage
const user = await api.users.get(userId);

// ❌ Bad - scattered fetch calls
fetch('/api/users/' + userId);
```

### Handle Loading and Errors

```typescript
// ✅ Always show loading and error states
if (loading()) return <Spinner />;
if (error()) return <Error error={error()!} />;

// ❌ Missing states
return <div>{data()?.name}</div>;
```

### Cache Wisely

```typescript
// ✅ Cache stable data
const countries = await fetchWithCache('countries', fetchCountries);

// ❌ Don't cache user-specific or time-sensitive data
const currentUser = await fetchWithCache('user', getCurrentUser);
```

### Type Your Data

```typescript
// ✅ Type-safe data fetching
interface User {
  id: string;
  name: string;
  email: string;
}

const user = await fetch(`/api/users/${id}`).then(r => r.json() as Promise<User>);

// Or with Zod
const UserSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().email()
});

const user = UserSchema.parse(await fetch('/api/users/1').then(r => r.json()));
```

## Comparison Table

| Pattern | When to Use | Pros | Cons |
|---------|-------------|------|------|
| Client-side fetch | Dynamic, user-specific data | Interactive, personalized | Slower initial load |
| Server functions | Type-safe backend calls | No API routes needed | Server-only |
| Queries | Cacheable data | Auto caching, deduping | More setup |
| Static generation | Content that rarely changes | Fastest, SEO-friendly | Build-time only |
| SSR | Dynamic but SEO-critical | SEO + dynamic | Slower response |

## Summary

You've learned:

✅ Client-side fetching with effects
✅ Server functions for type-safe calls
✅ Queries for automatic caching
✅ Mutations for data updates
✅ Static generation and SSR
✅ Caching strategies
✅ Loading and error states
✅ Real-time updates
✅ Best practices

Choose the right pattern for your use case!

---

**Next:** [Server Functions →](./server-functions.md) Build type-safe backend functions
