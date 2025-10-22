# Server vs Client Rendering

Understanding when code runs on the server versus the client is crucial for building efficient PhilJS applications. This guide explains the differences and how to leverage both environments.


## The Rendering Spectrum

PhilJS supports multiple rendering strategies:

1. **Server-Side Rendering (SSR)**: Render on the server for each request
2. **Static Site Generation (SSG)**: Pre-render at build time
3. **Client-Side Rendering (CSR)**: Render in the browser
4. **Islands Architecture**: Mix static HTML with interactive components

```tsx
// This component can render in multiple environments
export default function UserProfile({ userId }: { userId: number }) {
  const user = signal(null);

  // This runs differently based on environment
  effect(() => {
    fetchUser(userId).then(data => user.set(data));
  });

  return (
    <div>
      <h1>{user()?.name ?? 'Loading...'}</h1>
      <p>{user()?.email}</p>
    </div>
  );
}
```

## Server-Side Code

### Server-Only Functions

Use `serverFn` to create functions that ONLY run on the server:

```tsx
import { serverFn } from 'philjs-ssr';

// This code never reaches the browser
export const getSecretData = serverFn(async (userId: number) => {
  // Access environment variables safely
  const apiKey = process.env.SECRET_API_KEY;

  // Query database directly
  const user = await db.users.findById(userId);

  // Return only safe data to client
  return {
    id: user.id,
    name: user.name,
    // Don't send sensitive data!
  };
});
```

### Server Components

Components can run exclusively on the server:

```tsx
// routes/dashboard.tsx
export default async function Dashboard() {
  // This runs on the server
  const user = await db.users.getCurrent();
  const stats = await db.stats.getForUser(user.id);

  // HTML is sent to client
  return (
    <div>
      <h1>Welcome {user.name}</h1>
      <div>
        <p>Total Sales: ${stats.totalSales}</p>
        <p>Orders: {stats.orderCount}</p>
      </div>
    </div>
  );
}
```

### Data Loading

Server-side data loading with loaders:

```tsx
import { createDataLoader } from 'philjs-router';

// Runs on server before rendering
export const loader = createDataLoader(async ({ params, request }) => {
  const user = await authenticateRequest(request);

  if (!user) {
    throw redirect('/login');
  }

  const posts = await db.posts.findByUser(user.id);

  return {
    user,
    posts
  };
});

// Component receives loaded data
export default function MyPosts({ data }) {
  return (
    <div>
      <h1>{data.user.name}'s Posts</h1>
      <ul>
        {data.posts.map(post => (
          <li key={post.id}>{post.title}</li>
        ))}
      </ul>
    </div>
  );
}
```

## Client-Side Code

### Client-Only Components

Mark components to run only in the browser:

```tsx
import { clientOnly } from 'philjs-core';

// This never runs on the server
const InteractiveMap = clientOnly(() => {
  const position = signal({ lat: 0, lng: 0 });

  effect(() => {
    if (typeof window === 'undefined') return;

    navigator.geolocation.getCurrentPosition(pos => {
      position.set({
        lat: pos.coords.latitude,
        lng: pos.coords.longitude
      });
    });
  });

  return (
    <div id="map">
      Location: {position().lat}, {position().lng}
    </div>
  );
});

export default function MapPage() {
  return (
    <div>
      <h1>Your Location</h1>
      <InteractiveMap />
    </div>
  );
}
```

### Browser APIs

Always check for browser environment:

```tsx
import { signal, effect } from 'philjs-core';

function WindowSize() {
  const size = signal({ width: 0, height: 0 });

  effect(() => {
    // Check if running in browser
    if (typeof window === 'undefined') return;

    const updateSize = () => {
      size.set({
        width: window.innerWidth,
        height: window.innerHeight
      });
    };

    updateSize();
    window.addEventListener('resize', updateSize);

    onCleanup(() => {
      window.removeEventListener('resize', updateSize);
    });
  });

  return (
    <div>
      Window: {size().width} x {size().height}
    </div>
  );
}
```

### Client-Side Navigation

```tsx
import { useNavigate } from 'philjs-router';

function ClientNavigation() {
  const navigate = useNavigate();

  const handleClick = () => {
    // This only runs in browser
    if (confirm('Are you sure?')) {
      navigate('/dashboard');
    }
  };

  return (
    <button onClick={handleClick}>
      Go to Dashboard
    </button>
  );
}
```

## Islands Architecture

Combine static HTML with interactive islands:

```tsx
// routes/blog-post.tsx
export default function BlogPost({ post }) {
  return (
    <article>
      {/* Static HTML - no JavaScript */}
      <h1>{post.title}</h1>
      <p>By {post.author}</p>

      <div dangerouslySetInnerHTML={{ __html: post.content }} />

      {/* Interactive island - includes JavaScript */}
      <LikeButton postId={post.id} client:load />

      {/* Lazy island - loads when visible */}
      <Comments postId={post.id} client:visible />
    </article>
  );
}
```

### Island Directives

```tsx
// Load immediately
<Counter client:load />

// Load when idle
<Analytics client:idle />

// Load when visible
<HeavyComponent client:visible />

// Only run on client (no SSR)
<BrowserOnlyWidget client:only />

// Preload but don't hydrate yet
<DeferredComponent client:preload />
```

## Environment Detection

### Detecting Environment

```tsx
function Component() {
  const isServer = typeof window === 'undefined';
  const isClient = typeof window !== 'undefined';

  if (isServer) {
    return <div>Rendered on server</div>;
  }

  return <div>Rendered on client</div>;
}
```

### Using Import Meta

```tsx
if (import.meta.env.SSR) {
  // Server-side code
  console.log('Running on server');
} else {
  // Client-side code
  console.log('Running on client');
}
```

### Environment-Specific Imports

```tsx
// Only import on client
const ClientModule = import.meta.env.SSR
  ? null
  : await import('./client-only');

// Only import on server
const ServerModule = import.meta.env.SSR
  ? await import('./server-only')
  : null;
```

## Data Flow

### Server to Client

```tsx
// Server sends data to client
export const loader = createDataLoader(async () => {
  return {
    serverTime: new Date().toISOString(),
    config: {
      apiUrl: process.env.PUBLIC_API_URL
    }
  };
});

export default function Page({ data }) {
  // Data is available on both server and client
  return (
    <div>
      <p>Server Time: {data.serverTime}</p>
      <p>API URL: {data.config.apiUrl}</p>
    </div>
  );
}
```

### Client to Server

```tsx
import { createMutation } from 'philjs-data';

function ContactForm() {
  const sendMessage = createMutation(async (data: FormData) => {
    // This runs on server
    const name = data.get('name');
    const message = data.get('message');

    await db.messages.create({ name, message });
    await sendEmail(name, message);

    return { success: true };
  });

  return (
    <form action={sendMessage}>
      <input name="name" required />
      <textarea name="message" required />
      <button type="submit">Send</button>
    </form>
  );
}
```

## Hydration

### Selective Hydration

```tsx
export default function ProductPage({ product }) {
  return (
    <div>
      {/* Static content - no hydration */}
      <h1>{product.name}</h1>
      <p>{product.description}</p>
      <img src={product.image} alt={product.name} />

      {/* Only this hydrates */}
      <AddToCart productId={product.id} client:load />
    </div>
  );
}
```

### Resumability

PhilJS uses resumability instead of hydration:

```tsx
// Traditional framework (React, Vue)
// 1. Server renders HTML
// 2. Client downloads JS
// 3. Client re-executes all component code (hydration)
// 4. Client attaches event listeners
// = Wasted work repeating what server already did

// PhilJS with resumability
// 1. Server renders HTML with serialized state
// 2. Client downloads minimal JS
// 3. Client resumes from serialized state
// 4. No re-execution needed
// = Zero wasted work
```

### Serialization

```tsx
export default function StatefulComponent() {
  const count = signal(0);
  const items = signal(['a', 'b', 'c']);

  // These signals are automatically serialized by server
  // and deserialized on client (if needed)

  return (
    <div>
      <p>Count: {count()}</p>
      <button onClick={() => count.set(count() + 1)}>
        Increment
      </button>
    </div>
  );
}
```

## Security Considerations

### Never Expose Secrets

```tsx
// ❌ BAD - Secret exposed to client
export default function Dashboard() {
  const apiKey = process.env.SECRET_API_KEY; // NEVER DO THIS!

  return <div>Key: {apiKey}</div>;
}

// ✅ GOOD - Secret stays on server
export const loader = createDataLoader(async () => {
  const apiKey = process.env.SECRET_API_KEY;
  const data = await fetchWithKey(apiKey);

  return { data }; // Only send safe data
});

export default function Dashboard({ data }) {
  return <div>{data.message}</div>;
}
```

### Validate on Server

```tsx
// ❌ BAD - Client validation only
function DeleteButton({ userId }) {
  const handleDelete = async () => {
    if (userId === currentUser.id) {
      await fetch(`/api/users/${userId}`, { method: 'DELETE' });
    }
  };

  return <button onClick={handleDelete}>Delete</button>;
}

// ✅ GOOD - Server validation
const deleteUser = serverFn(async (userId: number) => {
  const currentUser = await getCurrentUser();

  // Validate on server!
  if (userId !== currentUser.id) {
    throw new Error('Unauthorized');
  }

  await db.users.delete(userId);
});

function DeleteButton({ userId }) {
  return (
    <button onClick={() => deleteUser(userId)}>
      Delete
    </button>
  );
}
```

## Performance Strategies

### Streaming SSR

```tsx
export const loader = createDataLoader(async () => {
  return {
    // Send immediately
    user: await fetchUser(),

    // Stream later
    recommendations: fetchRecommendations(),
    activity: fetchActivity()
  };
});

export default function Dashboard({ data }) {
  return (
    <div>
      {/* Renders immediately */}
      <h1>Welcome {data.user.name}</h1>

      {/* Streams when ready */}
      <Suspense fallback={<Skeleton />}>
        <Await resolve={data.recommendations}>
          {(items) => <RecommendationList items={items} />}
        </Await>
      </Suspense>
    </div>
  );
}
```

### Edge Rendering

```tsx
// Runs at the edge (closest to user)
export const config = {
  runtime: 'edge'
};

export default function EdgePage() {
  // Minimal latency
  return <div>Rendered at the edge!</div>;
}
```

### Static Optimization

```tsx
// Pre-render at build time
export async function generateStaticParams() {
  const posts = await db.posts.findAll();

  return posts.map(post => ({
    slug: post.slug
  }));
}

export default function BlogPost({ params }) {
  // This page is static HTML
  return <article>...</article>;
}
```

## Best Practices

### ✅ Do: Keep Server Logic on Server

```tsx
// ✅ GOOD
export const getData = serverFn(async () => {
  return await db.query('...');
});
```

### ✅ Do: Use Islands for Interactivity

```tsx
// ✅ GOOD - Static HTML with interactive islands
<article>
  <h1>{post.title}</h1>
  <p>{post.content}</p>
  <ShareButton client:visible />
</article>
```

### ✅ Do: Check Environment

```tsx
// ✅ GOOD
if (typeof window !== 'undefined') {
  localStorage.setItem('key', 'value');
}
```

### ❌ Don't: Use Server APIs on Client

```tsx
// ❌ BAD
function Component() {
  // process only exists on server!
  const apiKey = process.env.API_KEY;
}
```

### ❌ Don't: Use Client APIs on Server

```tsx
// ❌ BAD
function Component() {
  // localStorage only exists in browser!
  const value = localStorage.getItem('key');
}
```

## Next Steps

- [SSR](/docs/advanced/ssr.md) - Server-side rendering deep dive
- [Islands](/docs/advanced/islands.md) - Islands architecture
- [Resumability](/docs/advanced/resumability.md) - Zero-hydration rendering
- [Security](/docs/best-practices/security.md) - Secure your application

---

💡 **Tip**: Use server functions for any code that accesses secrets, databases, or sensitive APIs.

⚠️ **Warning**: Always validate user input on the server, even if you validate on the client.

ℹ️ **Note**: PhilJS's resumability means faster page loads compared to traditional hydration-based frameworks.
