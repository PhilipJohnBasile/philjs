# Data Loading

The `@philjs/router` package provides Remix-style data loading with loaders, actions, and deferred data for optimal user experience.

## Overview

Data loading features include:
- **Loaders**: Server-side data fetching that runs before rendering
- **Actions**: Form submissions and mutations with automatic revalidation
- **Deferred Data**: Stream non-critical data while rendering immediately
- **Parallel Loading**: All route loaders run simultaneously
- **Type Safety**: Full TypeScript support for loader/action data

## Loaders

### Basic Loader

Loaders are async functions that fetch data before a route renders:

```tsx
// routes/users/[id].tsx
import { useLoaderData, json, redirect } from '@philjs/router';

// Define loader function context
type LoaderFunctionContext = {
  params: Record<string, string>;
  request: Request;
  url: URL;
};

export async function loader({ params, request, url }: LoaderFunctionContext) {
  // Check authentication
  const session = await getSession(request);
  if (!session.userId) {
    return redirect('/login');
  }

  // Fetch data
  const user = await db.user.findUnique({
    where: { id: params.id }
  });

  if (!user) {
    throw new Response('Not Found', { status: 404 });
  }

  return json({ user, session });
}

export default function UserProfile() {
  const { user, session } = useLoaderData<typeof loader>();

  return (
    <div>
      <h1>{user.name}</h1>
      <p>Logged in as: {session.userId}</p>
    </div>
  );
}
```

### Response Helpers

#### json()

Return JSON data with optional status and headers:

```tsx
import { json } from '@philjs/router';

export async function loader({ params }) {
  const data = await fetchData(params.id);

  // Basic usage
  return json({ data });

  // With status
  return json({ error: 'Not found' }, { status: 404 });

  // With headers
  return json(
    { data },
    {
      status: 200,
      headers: {
        'Cache-Control': 'max-age=3600'
      }
    }
  );
}
```

#### redirect()

Redirect to another URL:

```tsx
import { redirect } from '@philjs/router';

export async function loader({ request }) {
  const user = await getUser(request);

  if (!user) {
    // Redirect to login
    return redirect('/login');
  }

  // Redirect with status
  return redirect('/new-location', 301);

  // Redirect with state
  return redirect('/dashboard', {
    status: 302,
    headers: {
      'X-Redirect-Reason': 'Auth required'
    }
  });
}
```

### Loader Context

The loader context provides access to:

```tsx
export async function loader({ params, request, url }) {
  // Route parameters from URL patterns
  console.log(params.id); // From /users/:id

  // Full Request object
  const authHeader = request.headers.get('Authorization');
  const cookies = request.headers.get('Cookie');

  // URL object with search params
  const page = url.searchParams.get('page') || '1';
  const sort = url.searchParams.get('sort') || 'name';

  return json({ /* data */ });
}
```

### Revalidation

Force loaders to re-run:

```tsx
import { revalidate, invalidateLoaderCache } from '@philjs/router';

// Re-run all active loaders
revalidate();

// Clear cached loader data
invalidateLoaderCache();

// Revalidate specific routes
revalidate({ routes: ['/users', '/dashboard'] });
```

## Actions

Actions handle form submissions and data mutations.

### Basic Action

```tsx
// routes/users/new.tsx
import {
  useActionData,
  useNavigation,
  Form,
  redirect,
  json
} from '@philjs/router';

type ActionFunctionContext = {
  params: Record<string, string>;
  request: Request;
  url: URL;
};

export async function action({ request }: ActionFunctionContext) {
  const formData = await request.formData();

  const name = formData.get('name');
  const email = formData.get('email');

  // Validate
  if (!name || !email) {
    return json(
      { error: 'Name and email are required' },
      { status: 400 }
    );
  }

  // Create user
  const user = await db.user.create({
    data: { name, email }
  });

  // Redirect on success
  return redirect(`/users/${user.id}`);
}

export default function NewUser() {
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === 'submitting';

  return (
    <Form method="post">
      {actionData?.error && (
        <div class="error">{actionData.error}</div>
      )}

      <label>
        Name
        <input name="name" required />
      </label>

      <label>
        Email
        <input name="email" type="email" required />
      </label>

      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Creating...' : 'Create User'}
      </button>
    </Form>
  );
}
```

### Form Component

The Form component handles submissions via the router:

```tsx
import { Form } from '@philjs/router';

// Basic form
<Form method="post">
  <input name="title" />
  <button type="submit">Submit</button>
</Form>

// With action URL
<Form method="post" action="/api/users">
  <input name="email" />
  <button type="submit">Subscribe</button>
</Form>

// Different HTTP methods
<Form method="delete" action={`/users/${user.id}`}>
  <button type="submit">Delete</button>
</Form>

// Replace history entry
<Form method="post" replace>
  <input name="query" />
  <button type="submit">Search</button>
</Form>

// Prevent scroll reset
<Form method="post" preventScrollReset>
  <button type="submit">Load More</button>
</Form>
```

### useSubmit Hook

Submit forms programmatically:

```tsx
import { useSubmit } from '@philjs/router';

function SearchBox() {
  const submit = useSubmit();

  const handleChange = (e) => {
    // Submit form data
    submit(e.currentTarget.form, {
      method: 'get',
      action: '/search'
    });
  };

  // Submit object
  const handleClick = () => {
    submit(
      { query: 'test', page: '1' },
      { method: 'post', action: '/api/search' }
    );
  };

  return (
    <form>
      <input name="q" onChange={handleChange} />
    </form>
  );
}
```

### Navigation State

Track form submission state:

```tsx
import { useNavigation } from '@philjs/router';

type NavigationState = {
  state: 'idle' | 'submitting' | 'loading';
  formData?: FormData;
  formMethod?: string;
  formAction?: string;
  formEncType?: string;
  location?: URL;
};

function Component() {
  const navigation = useNavigation();

  if (navigation.state === 'submitting') {
    return <p>Submitting to {navigation.formAction}...</p>;
  }

  if (navigation.state === 'loading') {
    return <p>Loading...</p>;
  }

  return <p>Idle</p>;
}
```

### useFetcher Hook

Fetch data or submit forms without navigation:

```tsx
import { useFetcher } from '@philjs/router';

function LikeButton({ postId }) {
  const fetcher = useFetcher<{ likes: number }>();

  const likes = fetcher.data?.likes ?? 0;
  const isLiking = fetcher.state === 'submitting';

  return (
    <fetcher.Form method="post" action="/api/like">
      <input type="hidden" name="postId" value={postId} />
      <button type="submit" disabled={isLiking}>
        {isLiking ? 'Liking...' : `${likes} Likes`}
      </button>
    </fetcher.Form>
  );
}

// Load data without navigation
function UserCard({ userId }) {
  const fetcher = useFetcher<{ user: User }>();

  useEffect(() => {
    fetcher.load(`/api/users/${userId}`);
  }, [userId]);

  if (fetcher.state === 'loading') {
    return <Skeleton />;
  }

  return <Card user={fetcher.data?.user} />;
}
```

### useFetchers Hook

Access all active fetchers:

```tsx
import { useFetchers } from '@philjs/router';

function GlobalLoadingIndicator() {
  const fetchers = useFetchers();
  const isLoading = fetchers.some(f => f.state !== 'idle');

  if (!isLoading) return null;

  return <ProgressBar />;
}
```

## Deferred Data

Stream non-critical data while rendering immediately.

### Basic Deferred Loading

```tsx
// routes/dashboard.tsx
import { defer, Await, useLoaderData } from '@philjs/router';

export async function loader() {
  return defer({
    // Critical data - awaited before render
    user: await getCurrentUser(),

    // Non-critical - streams in later
    stats: fetchDashboardStats(),
    notifications: fetchNotifications(),
    recommendations: fetchRecommendations()
  });
}

export default function Dashboard() {
  const { user, stats, notifications, recommendations } = useLoaderData();

  return (
    <div>
      {/* Renders immediately with user data */}
      <h1>Welcome, {user.name}</h1>

      {/* Streams in when ready */}
      <Suspense fallback={<StatsSkeleton />}>
        <Await resolve={stats}>
          {(data) => <StatsPanel data={data} />}
        </Await>
      </Suspense>

      <Suspense fallback={<NotificationsSkeleton />}>
        <Await resolve={notifications}>
          {(data) => <NotificationsList items={data} />}
        </Await>
      </Suspense>

      <Suspense fallback={<RecommendationsSkeleton />}>
        <Await resolve={recommendations}>
          {(data) => <RecommendationsGrid items={data} />}
        </Await>
      </Suspense>
    </div>
  );
}
```

### Deferred Types

```tsx
type DeferredStatus = 'pending' | 'resolved' | 'rejected';

type DeferredValue<T> = {
  _id: symbol;
  _deferred: true;
  promise: Promise<T>;
  status: DeferredStatus;
  value?: T;
  error?: Error;
  subscribe: (callback: (status: DeferredStatus) => void) => () => void;
};
```

### deferData Helper

Automatically wrap promises:

```tsx
import { deferData } from '@philjs/router';

export async function loader() {
  // Immediate values passed through, promises wrapped with defer()
  return deferData({
    user: await fetchUser(),        // immediate
    posts: fetchPosts(),            // deferred
    comments: fetchComments()       // deferred
  });
}
```

### Await Component

Render deferred data with error handling:

```tsx
import { Await } from '@philjs/router';

type AwaitProps<T> = {
  resolve: DeferredValue<T> | Promise<T>;
  children: (value: T) => VNode;
  errorElement?: VNode | ((error: Error) => VNode);
};

<Suspense fallback={<Loading />}>
  <Await
    resolve={data}
    errorElement={<ErrorMessage />}
  >
    {(resolvedData) => <DataView data={resolvedData} />}
  </Await>
</Suspense>

// With error render function
<Await
  resolve={data}
  errorElement={(error) => <ErrorView error={error} />}
>
  {(resolvedData) => <DataView data={resolvedData} />}
</Await>
```

### Checking Deferred Values

```tsx
import { isDeferred, resolveDeferred } from '@philjs/router';

// Check if value is deferred
if (isDeferred(value)) {
  console.log('Status:', value.status);
  console.log('Value:', value.value);
}

// Resolve a deferred value
const resolved = await resolveDeferred(value);
```

### Waiting for All Deferred Data

For SSR, wait for all deferred values:

```tsx
import { awaitAllDeferred, getDeferredStates } from '@philjs/router';

// Wait for all to resolve
const allData = await awaitAllDeferred(loaderData);

// Get current states without waiting
const states = getDeferredStates(loaderData);
// { posts: { status: 'resolved', value: [...] }, comments: { status: 'pending' } }
```

### Streaming Deferred Data

Stream deferred values as they resolve:

```tsx
import { streamDeferred, serializeDeferred, hydrateDeferred } from '@philjs/router';

// Server-side streaming
const unsubscribe = streamDeferred(data, {
  onResolve: (key, value) => {
    // Send to client via SSE or websocket
    sendToClient({ key, value });
  },
  onReject: (key, error) => {
    console.error(`${key} failed:`, error);
  },
  onComplete: () => {
    closeStream();
  }
});

// Serialize for hydration
const serialized = serializeDeferred(data);

// Hydrate on client
const hydrated = hydrateDeferred(serialized, {
  posts: () => fetchPosts(),
  comments: () => fetchComments()
});
```

## Optimistic Updates

Update UI immediately while mutations are in progress:

```tsx
import { applyOptimisticUpdate, useOptimisticUpdates, clearOptimisticUpdates } from '@philjs/router';

function TodoItem({ todo }) {
  const handleToggle = async () => {
    // Apply optimistic update
    const update = applyOptimisticUpdate(
      `todo-${todo.id}`,
      { ...todo, completed: !todo.completed },
      async () => {
        await toggleTodo(todo.id);
      }
    );
  };

  return (
    <div>
      <input
        type="checkbox"
        checked={todo.completed}
        onChange={handleToggle}
      />
      {todo.title}
    </div>
  );
}

// Access all optimistic updates
function OptimisticIndicator() {
  const updates = useOptimisticUpdates();
  const pending = updates.filter(u => u.pending);

  if (pending.length === 0) return null;

  return <span>{pending.length} updates pending...</span>;
}
```

## Form Utilities

### Form Data Conversion

```tsx
import { formDataToObject, objectToFormData } from '@philjs/router';

// Convert FormData to object
const formData = new FormData(form);
const obj = formDataToObject(formData);
// { name: 'John', tags: ['a', 'b'] }

// Convert object to FormData
const formData = objectToFormData({
  name: 'John',
  tags: ['a', 'b'],
  avatar: fileBlob
});
```

### Form Validation

```tsx
import { validateFormData } from '@philjs/router';

type ValidationResult<T> = {
  success: boolean;
  data?: T;
  errors?: Array<{ field: string; message: string }>;
};

export async function action({ request }) {
  const formData = await request.formData();

  const result = validateFormData(formData, (data) => {
    const errors = [];

    if (!data.email) {
      errors.push({ field: 'email', message: 'Email is required' });
    }

    if (!data.password || data.password.length < 8) {
      errors.push({ field: 'password', message: 'Password must be at least 8 characters' });
    }

    if (errors.length > 0) {
      return { success: false, errors };
    }

    return { success: true, data };
  });

  if (!result.success) {
    return json({ errors: result.errors }, { status: 400 });
  }

  // Process valid data
  await createUser(result.data);
  return redirect('/dashboard');
}
```

## Complete Example

```tsx
// routes/posts/[id].tsx
import {
  useLoaderData,
  useActionData,
  useNavigation,
  Form,
  defer,
  Await,
  json,
  redirect
} from '@philjs/router';

export async function loader({ params }) {
  const post = await db.post.findUnique({
    where: { id: params.id }
  });

  if (!post) {
    throw new Response('Post not found', { status: 404 });
  }

  return defer({
    post,
    comments: fetchComments(params.id),
    related: fetchRelatedPosts(params.id)
  });
}

export async function action({ params, request }) {
  const formData = await request.formData();
  const intent = formData.get('intent');

  switch (intent) {
    case 'comment': {
      const content = formData.get('content');
      if (!content) {
        return json({ error: 'Comment required' }, { status: 400 });
      }
      await db.comment.create({
        data: { postId: params.id, content }
      });
      return json({ success: true });
    }

    case 'delete': {
      await db.post.delete({ where: { id: params.id } });
      return redirect('/posts');
    }

    default:
      return json({ error: 'Unknown action' }, { status: 400 });
  }
}

export default function PostPage() {
  const { post, comments, related } = useLoaderData();
  const actionData = useActionData();
  const navigation = useNavigation();

  const isCommenting = navigation.state === 'submitting' &&
    navigation.formData?.get('intent') === 'comment';

  return (
    <article>
      <h1>{post.title}</h1>
      <div>{post.content}</div>

      {/* Comment form */}
      <Form method="post">
        <input type="hidden" name="intent" value="comment" />

        {actionData?.error && (
          <div class="error">{actionData.error}</div>
        )}

        <textarea name="content" required />
        <button type="submit" disabled={isCommenting}>
          {isCommenting ? 'Posting...' : 'Add Comment'}
        </button>
      </Form>

      {/* Streamed comments */}
      <Suspense fallback={<CommentsSkeleton />}>
        <Await resolve={comments}>
          {(data) => <CommentList comments={data} />}
        </Await>
      </Suspense>

      {/* Streamed related posts */}
      <Suspense fallback={<RelatedSkeleton />}>
        <Await resolve={related}>
          {(data) => <RelatedPosts posts={data} />}
        </Await>
      </Suspense>

      {/* Delete form */}
      <Form method="post">
        <input type="hidden" name="intent" value="delete" />
        <button type="submit">Delete Post</button>
      </Form>
    </article>
  );
}
```

## API Reference

### Loader Functions

| Export | Description |
|--------|-------------|
| `json(data, init?)` | Return JSON response |
| `redirect(url, init?)` | Return redirect response |
| `useLoaderData<T>()` | Access current route's loader data |
| `useRouteLoaderData<T>(routeId)` | Access any route's loader data |
| `revalidate(options?)` | Re-run active loaders |
| `invalidateLoaderCache()` | Clear loader cache |

### Action Functions

| Export | Description |
|--------|-------------|
| `useActionData<T>()` | Access action result |
| `useNavigation()` | Get navigation state |
| `useSubmit()` | Programmatic form submission |
| `useFetcher<T>()` | Fetch without navigation |
| `useFetchers()` | Access all active fetchers |
| `Form` | Enhanced form component |

### Deferred Data

| Export | Description |
|--------|-------------|
| `defer(promise)` | Create deferred value |
| `deferData(data)` | Wrap object with defer() |
| `isDeferred(value)` | Check if deferred |
| `resolveDeferred(value)` | Resolve deferred value |
| `awaitAllDeferred(data)` | Wait for all deferred |
| `getDeferredStates(data)` | Get current states |
| `streamDeferred(data, options)` | Stream as values resolve |
| `serializeDeferred(data)` | Serialize for hydration |
| `hydrateDeferred(serialized, fetchers)` | Hydrate on client |
| `Await` | Render deferred with Suspense |

### Optimistic Updates

| Export | Description |
|--------|-------------|
| `applyOptimisticUpdate(id, data, submit)` | Apply optimistic update |
| `useOptimisticUpdates<T>()` | Access all updates |
| `clearOptimisticUpdates()` | Clear completed updates |

### Form Utilities

| Export | Description |
|--------|-------------|
| `formDataToObject(formData)` | Convert FormData to object |
| `objectToFormData(obj)` | Convert object to FormData |
| `validateFormData(formData, validator)` | Validate form data |

## Next Steps

- [Nested Routes](./nested-routes.md) - Parallel data loading in route hierarchy
- [Error Handling](./error-handling.md) - Handle loader/action errors
- [Route Guards](./guards.md) - Protect routes before data loading
