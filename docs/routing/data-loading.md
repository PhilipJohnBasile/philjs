# Data Loading

PhilJS provides powerful data loading capabilities that work seamlessly on both server and client. Load data before rendering, stream it progressively, or fetch it on demand.

## Server Data Loaders

### Basic Loader

```tsx
// routes/posts.tsx
import { createDataLoader } from 'philjs-router';

export const loader = createDataLoader(async () => {
  const posts = await db.posts.findAll();

  return { posts };
});

export default function Posts({ data }) {
  return (
    <div>
      <h1>Blog Posts</h1>
      <ul>
        {data.posts.map(post => (
          <li key={post.id}>
            <h2>{post.title}</h2>
            <p>{post.excerpt}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
```

### Loader with Parameters

```tsx
// routes/users/[id].tsx
import { createDataLoader } from 'philjs-router';

export const loader = createDataLoader(async ({ params }) => {
  const user = await db.users.findById(params.id);

  if (!user) {
    throw new Response('User not found', { status: 404 });
  }

  return { user };
});

export default function UserProfile({ data }) {
  return (
    <div>
      <h1>{data.user.name}</h1>
      <p>{data.user.email}</p>
      <p>Joined: {data.user.createdAt}</p>
    </div>
  );
}
```

### Loader with Request

```tsx
export const loader = createDataLoader(async ({ request, params }) => {
  // Access headers
  const userAgent = request.headers.get('user-agent');

  // Access cookies
  const sessionId = request.cookies.get('session_id');

  // Authenticate
  const user = await authenticateRequest(request);

  if (!user) {
    throw redirect('/login');
  }

  const posts = await db.posts.findByUser(user.id);

  return {
    user,
    posts,
    userAgent
  };
});
```

## Streaming Data

### Progressive Enhancement

```tsx
export const loader = createDataLoader(async () => {
  return {
    // Critical data - loads immediately
    user: await fetchUser(),

    // Non-critical - streams when ready
    recommendations: fetchRecommendations(),
    activityFeed: fetchActivityFeed()
  };
});

export default function Dashboard({ data }) {
  return (
    <div>
      {/* Renders immediately */}
      <h1>Welcome {data.user.name}</h1>

      {/* Streams when ready */}
      <Suspense fallback={<div>Loading recommendations...</div>}>
        <Await resolve={data.recommendations}>
          {(items) => (
            <RecommendationList items={items} />
          )}
        </Await>
      </Suspense>

      {/* Streams independently */}
      <Suspense fallback={<div>Loading activity...</div>}>
        <Await resolve={data.activityFeed}>
          {(feed) => (
            <ActivityFeed items={feed} />
          )}
        </Await>
      </Suspense>
    </div>
  );
}
```

### Parallel Data Loading

```tsx
export const loader = createDataLoader(async ({ params }) => {
  // Load in parallel
  const [user, posts, comments] = await Promise.all([
    fetchUser(params.id),
    fetchUserPosts(params.id),
    fetchUserComments(params.id)
  ]);

  return { user, posts, comments };
});
```

## Client Data Fetching

### Using Queries

```tsx
import { createQuery } from 'philjs-data';

export default function Posts() {
  const posts = createQuery(() => '/api/posts');

  if (posts.loading) {
    return <div>Loading...</div>;
  }

  if (posts.error) {
    return <div>Error: {posts.error.message}</div>;
  }

  return (
    <ul>
      {posts.data.map(post => (
        <li key={post.id}>{post.title}</li>
      ))}
    </ul>
  );
}
```

### Dependent Queries

```tsx
import { createQuery } from 'philjs-data';
import { signal } from 'philjs-core';

export default function UserPosts() {
  const userId = signal(1);

  const user = createQuery(() => `/api/users/${userId()}`);

  const posts = createQuery(
    () => user.data ? `/api/users/${user.data.id}/posts` : null
  );

  if (user.loading) return <div>Loading user...</div>;
  if (posts.loading) return <div>Loading posts...</div>;

  return (
    <div>
      <h1>{user.data.name}'s Posts</h1>
      <ul>
        {posts.data?.map(post => (
          <li key={post.id}>{post.title}</li>
        ))}
      </ul>
    </div>
  );
}
```

## Mutations

### Form Actions

```tsx
import { createMutation } from 'philjs-data';

export default function CreatePost() {
  const createPost = createMutation(
    async (data: FormData) => {
      const response = await fetch('/api/posts', {
        method: 'POST',
        body: data
      });

      return response.json();
    },
    {
      onSuccess: (post) => {
        console.log('Created post:', post);
        navigate(`/posts/${post.id}`);
      }
    }
  );

  return (
    <form action={createPost}>
      <input name="title" required />
      <textarea name="content" required />
      <button type="submit">Create Post</button>
    </form>
  );
}
```

### Optimistic Updates

```tsx
import { createMutation, useQueryClient } from 'philjs-data';

export default function TodoItem({ todo }) {
  const queryClient = useQueryClient();

  const toggleTodo = createMutation(
    async () => {
      return await fetch(`/api/todos/${todo.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ completed: !todo.completed })
      });
    },
    {
      onMutate: async () => {
        // Cancel outgoing queries
        await queryClient.cancelQueries(['todos']);

        // Snapshot previous value
        const previous = queryClient.getQueryData(['todos']);

        // Optimistically update
        queryClient.setQueryData(['todos'], old => {
          return old.map(t =>
            t.id === todo.id
              ? { ...t, completed: !t.completed }
              : t
          );
        });

        return { previous };
      },
      onError: (err, variables, context) => {
        // Rollback on error
        queryClient.setQueryData(['todos'], context.previous);
      },
      onSettled: () => {
        // Refetch after mutation
        queryClient.invalidateQueries(['todos']);
      }
    }
  );

  return (
    <div>
      <input
        type="checkbox"
        checked={todo.completed}
        onChange={() => toggleTodo.mutate()}
      />
      {todo.title}
    </div>
  );
}
```

## Caching

### Cache Configuration

```tsx
import { createQuery } from 'philjs-data';

export default function Posts() {
  const posts = createQuery(
    () => '/api/posts',
    {
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
      refetchOnWindowFocus: true,
      refetchOnReconnect: true
    }
  );

  return <div>...</div>;
}
```

### Cache Invalidation

```tsx
import { useQueryClient } from 'philjs-data';

function RefreshButton() {
  const queryClient = useQueryClient();

  const refresh = () => {
    // Invalidate specific query
    queryClient.invalidateQueries(['posts']);

    // Invalidate all queries
    queryClient.invalidateQueries();

    // Remove query from cache
    queryClient.removeQueries(['posts', postId]);
  };

  return <button onClick={refresh}>Refresh</button>;
}
```

## Error Handling

### Loader Errors

```tsx
export const loader = createDataLoader(async ({ params }) => {
  const post = await db.posts.findById(params.id);

  if (!post) {
    // Throw a Response to trigger error boundary
    throw new Response('Post not found', {
      status: 404,
      statusText: 'Not Found'
    });
  }

  return { post };
});

// routes/posts/[id].tsx
export default function Post({ data }) {
  return <article>{data.post.title}</article>;
}

// routes/posts/[id]/_error.tsx
export default function PostError({ error }) {
  if (error.status === 404) {
    return (
      <div>
        <h1>Post Not Found</h1>
        <Link href="/posts">Back to Posts</Link>
      </div>
    );
  }

  return <div>Error loading post</div>;
}
```

### Query Errors

```tsx
import { createQuery } from 'philjs-data';

export default function Posts() {
  const posts = createQuery(
    () => '/api/posts',
    {
      retry: 3,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      onError: (error) => {
        console.error('Failed to load posts:', error);
        showToast('Failed to load posts');
      }
    }
  );

  if (posts.error) {
    return (
      <div>
        <p>Error: {posts.error.message}</p>
        <button onClick={() => posts.refetch()}>
          Try Again
        </button>
      </div>
    );
  }

  return <div>...</div>;
}
```

## Prefetching

### Link Prefetching

```tsx
import { Link } from 'philjs-router';

function PostCard({ post }) {
  return (
    <Link
      href={`/posts/${post.id}`}
      prefetch="hover" // or "visible" or "mount"
    >
      {post.title}
    </Link>
  );
}
```

### Manual Prefetching

```tsx
import { prefetch } from 'philjs-router';

function ProductCard({ product }) {
  return (
    <div
      onMouseEnter={() => {
        // Prefetch route and data
        prefetch(`/products/${product.id}`);
      }}
    >
      <h3>{product.name}</h3>
      <Link href={`/products/${product.id}`}>
        View Details
      </Link>
    </div>
  );
}
```

## Revalidation

### Time-Based Revalidation

```tsx
export const config = {
  revalidate: 60 // Revalidate every 60 seconds
};

export const loader = createDataLoader(async () => {
  const data = await fetch('https://api.example.com/data');
  return { data };
});
```

### On-Demand Revalidation

```tsx
// API route to trigger revalidation
export async function POST(request) {
  const { path } = await request.json();

  await revalidatePath(path);

  return new Response('Revalidated', { status: 200 });
}

// Trigger from client
async function revalidate() {
  await fetch('/api/revalidate', {
    method: 'POST',
    body: JSON.stringify({ path: '/posts' })
  });
}
```

## Pagination

### Cursor-Based Pagination

```tsx
import { createInfiniteQuery } from 'philjs-data';

export default function InfinitePosts() {
  const posts = createInfiniteQuery(
    ({ pageParam = 0 }) => `/api/posts?cursor=${pageParam}`,
    {
      getNextPageParam: (lastPage) => lastPage.nextCursor
    }
  );

  return (
    <div>
      {posts.data?.pages.map((page, i) => (
        <div key={i}>
          {page.posts.map(post => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      ))}

      {posts.hasNextPage && (
        <button
          onClick={() => posts.fetchNextPage()}
          disabled={posts.isFetchingNextPage}
        >
          {posts.isFetchingNextPage ? 'Loading...' : 'Load More'}
        </button>
      )}
    </div>
  );
}
```

### Page-Based Pagination

```tsx
import { signal } from 'philjs-core';
import { createQuery } from 'philjs-data';

export default function Posts() {
  const page = signal(1);

  const posts = createQuery(
    () => `/api/posts?page=${page()}`,
    { keepPreviousData: true }
  );

  return (
    <div>
      <ul>
        {posts.data?.posts.map(post => (
          <li key={post.id}>{post.title}</li>
        ))}
      </ul>

      <div>
        <button
          onClick={() => page.set(Math.max(1, page() - 1))}
          disabled={page() === 1}
        >
          Previous
        </button>

        <span>Page {page()}</span>

        <button
          onClick={() => page.set(page() + 1)}
          disabled={!posts.data?.hasMore}
        >
          Next
        </button>
      </div>
    </div>
  );
}
```

## Best Practices

### ✅ Do: Load Data on the Server

```tsx
// ✅ Good - fast initial load
export const loader = createDataLoader(async () => {
  return { posts: await db.posts.findAll() };
});

// ❌ Avoid - slow initial load
export default function Posts() {
  const [posts, setPosts] = useState([]);
  useEffect(() => {
    fetch('/api/posts').then(r => r.json()).then(setPosts);
  }, []);
}
```

### ✅ Do: Use Parallel Loading

```tsx
// ✅ Good - parallel
const [user, posts] = await Promise.all([
  fetchUser(),
  fetchPosts()
]);

// ❌ Bad - sequential
const user = await fetchUser();
const posts = await fetchPosts();
```

### ✅ Do: Handle Loading States

```tsx
// ✅ Good - handles all states
if (query.loading) return <Skeleton />;
if (query.error) return <Error error={query.error} />;
return <Content data={query.data} />;
```

### ❌ Don't: Fetch in Loops

```tsx
// ❌ Bad - N+1 problem
const users = await db.users.findAll();
for (const user of users) {
  user.posts = await db.posts.findByUser(user.id);
}

// ✅ Good - batch load
const users = await db.users.findAll();
const userIds = users.map(u => u.id);
const allPosts = await db.posts.findByUserIds(userIds);
```

## Next Steps

- [Caching](/docs/data-fetching/caching.md) - Advanced caching strategies
- [Mutations](/docs/data-fetching/mutations.md) - Modify data
- [Real-time](/docs/data-fetching/real-time.md) - Live updates
- [Error Handling](/docs/data-fetching/error-handling.md) - Handle failures

---

💡 **Tip**: Use streaming with `Await` and `Suspense` to send critical data first and stream the rest progressively.

⚠️ **Warning**: Always handle loading and error states to provide a good user experience.

ℹ️ **Note**: Server loaders run on the server and their data is automatically serialized and sent to the client.
