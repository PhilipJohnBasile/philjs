# Routing Basics

PhilJS includes a powerful file-based routing system that automatically creates routes from your file structure. No configuration needed—just create files and PhilJS handles the rest.

> ⚠️ PhilJS currently ships low-level routing utilities (see [`/docs/api-reference/router.md`](../api-reference/router.md)). The high-level helpers demonstrated here—like `<Router>`, `<Route>`, `Link`, and `useRouter()`—are part of the planned ergonomic API and are shown for conceptual guidance.

## File-Based Routing

Routes are defined by files in your `routes/` directory:

```
src/routes/
  index.tsx          → /
  about.tsx          → /about
  blog/
    index.tsx        → /blog
    [slug].tsx       → /blog/:slug
  users/
    index.tsx        → /users
    [id].tsx         → /users/:id
    [id]/
      edit.tsx       → /users/:id/edit
```

### Basic Route

```tsx
// routes/about.tsx
export default function About() {
  return (
    <div>
      <h1>About Us</h1>
      <p>Welcome to our company!</p>
    </div>
  );
}
```

### Index Routes

```tsx
// routes/index.tsx - Renders at /
export default function Home() {
  return (
    <div>
      <h1>Welcome Home</h1>
      <p>This is the homepage</p>
    </div>
  );
}

// routes/blog/index.tsx - Renders at /blog
export default function BlogIndex() {
  return (
    <div>
      <h1>Blog Posts</h1>
      <ul>
        <li><a href="/blog/first-post">First Post</a></li>
        <li><a href="/blog/second-post">Second Post</a></li>
      </ul>
    </div>
  );
}
```

## Wiring navigation with the current APIs

Until the high-level `<Router>`/`Link` helpers land, you can wire up navigation yourself with the low-level exports from `philjs-router`.

Create `src/router.ts`:

```ts
import { createRouter } from 'philjs-router';
import { render } from 'philjs-core';

type RouteEntry = {
  pattern: string;
  load: () => Promise<{ default: (props: any) => any }>;
};

const routes: RouteEntry[] = [
  { pattern: '/', load: () => import('./routes/index.js') },
  { pattern: '/about', load: () => import('./routes/about.js') },
  { pattern: '/blog/:slug', load: () => import('./routes/blog/[slug].js') },
];

const router = createRouter(
  Object.fromEntries(routes.map((route) => [route.pattern, route.load]))
);

let outlet: HTMLElement | null = null;

function matchPath(pattern: string, pathname: string): Record<string, string> | null {
  const paramNames: string[] = [];
  const regex = new RegExp(
    '^' +
      pattern
        .replace(/\//g, '\\/')
        .replace(/:[^/]+/g, (segment) => {
          paramNames.push(segment.slice(1));
          return '([^/]+)';
        }) +
      '$'
  );

  const match = pathname.match(regex);
  if (!match) return null;

  const params: Record<string, string> = {};
  paramNames.forEach((name, index) => {
    params[name] = decodeURIComponent(match[index + 1]);
  });
  return params;
}

async function renderRoute(url: URL) {
  if (!outlet) throw new Error('Router not started');

  for (const entry of routes) {
    const params = matchPath(entry.pattern, url.pathname);
    if (!params) continue;

    const loader = router.manifest[entry.pattern];
    const mod = await loader();
    const Component = mod.default;
    render(() => Component({ params, url, navigate: navigateInternal }), outlet);
    return;
  }

  render(() => 'Not Found', outlet);
}

async function navigateInternal(to: string) {
  const url = new URL(to, window.location.origin);
  window.history.pushState({}, '', url.toString());
  await renderRoute(url);
}

export const navigate = navigateInternal;

export function startRouter(target: HTMLElement) {
  outlet = target;

  document.addEventListener('click', (event) => {
    const anchor = (event.target as HTMLElement).closest<HTMLAnchorElement>('a[data-router-link]');
    if (!anchor || anchor.target === '_blank' || anchor.hasAttribute('download')) return;

    const url = new URL(anchor.href);
    if (url.origin !== window.location.origin) return;

    event.preventDefault();
    navigateInternal(url.pathname + url.search + url.hash);
  });

  window.addEventListener('popstate', () => {
    renderRoute(new URL(window.location.href));
  });

  renderRoute(new URL(window.location.href));
}
```

Initialize it in `src/main.tsx`:

```ts
import { startRouter } from './router.ts';

startRouter(document.getElementById('app')!);
```

### Declarative links

Use regular anchor tags and mark them with `data-router-link` so the router can intercept them:

```tsx
export function Navigation() {
  return (
    <nav>
      <a href="/" data-router-link>
        Home
      </a>
      <a href="/about" data-router-link>
        About
      </a>
      <a href="/blog/introducing-philjs" data-router-link>
        Blog
      </a>
    </nav>
  );
}
```

Add an `aria-current` attribute for the active link by comparing with `window.location.pathname` or by tracking the current route in a signal you update inside `renderRoute`.

### Programmatic navigation

Call the `navigate` helper you receive from the router when you need to redirect after a mutation:

```tsx
type LoginFormProps = {
  navigate: (to: string) => Promise<void>;
};

export function LoginForm({ navigate }: LoginFormProps) {
  const handleSubmit = async (event: SubmitEvent) => {
    event.preventDefault();
    const success = await login();
    if (success) {
      await navigate('/dashboard');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* form fields */}
      <button type="submit">Login</button>
    </form>
  );
}
```

## Route Parameters

Because we manually fetched the component and passed `params` into it, your route modules can read the params from the props they receive:

### Dynamic Segments

```tsx
// routes/users/[id].tsx
export default function UserProfile({ params }: { params: { id: string } }) {
  return (
    <section>
      <h1>User Profile</h1>
      <p>User ID: {params.id}</p>
    </section>
  );
}
```

### Multiple Parameters

```tsx
// routes/blog/[category]/[slug].tsx
export default function BlogPost({
  params,
}: {
  params: { category: string; slug: string };
}) {
  return (
    <article>
      <h1>{params.slug.replace(/-/g, ' ')}</h1>
      <p>Category: {params.category}</p>
    </article>
  );
}
```

### Catch-All Routes

For catch-all segments, record the remainder inside your router’s `matchPath` helper (for example by translating `*` into `(.*)` and returning it as a single param) and pass it through the component props:

```tsx
// routes/docs/[...path].tsx
export default function Docs({ params }: { params: { path: string } }) {
  return (
    <div>
      <h1>Documentation</h1>
      <p>Path: {params.path}</p>
    </div>
  );
}
```

## Query Parameters

### Reading Query Params

```tsx
import { useSearchParams } from 'philjs-router';

function SearchPage() {
  const [searchParams] = useSearchParams();

  const query = searchParams.get('q');
  const page = searchParams.get('page') || '1';
  const sort = searchParams.get('sort') || 'date';

  return (
    <div>
      <h1>Search Results</h1>
      <p>Query: {query}</p>
      <p>Page: {page}</p>
      <p>Sort: {sort}</p>
    </div>
  );
}

// URL: /search?q=philjs&page=2&sort=relevance
```

### Updating Query Params

```tsx
import { useSearchParams } from 'philjs-router';

function FilterControls() {
  const [searchParams, setSearchParams] = useSearchParams();

  const updateSort = (sort: string) => {
    setSearchParams({ ...searchParams, sort });
  };

  return (
    <div>
      <button onClick={() => updateSort('date')}>Sort by Date</button>
      <button onClick={() => updateSort('title')}>Sort by Title</button>
      <button onClick={() => updateSort('author')}>Sort by Author</button>
    </div>
  );
}
```

## Layouts

### Root Layout

```tsx
// routes/_layout.tsx
export default function RootLayout({ children }) {
  return (
    <html>
      <head>
        <title>My App</title>
      </head>
      <body>
        <header>
          <nav>
            <Link href="/">Home</Link>
            <Link href="/about">About</Link>
          </nav>
        </header>

        <main>{children}</main>

        <footer>
          <p>&copy; 2024 My App</p>
        </footer>
      </body>
    </html>
  );
}
```

### Nested Layouts

```tsx
// routes/dashboard/_layout.tsx
export default function DashboardLayout({ children }) {
  return (
    <div class="dashboard">
      <aside>
        <nav>
          <Link href="/dashboard">Overview</Link>
          <Link href="/dashboard/analytics">Analytics</Link>
          <Link href="/dashboard/settings">Settings</Link>
        </nav>
      </aside>

      <div class="content">
        {children}
      </div>
    </div>
  );
}

// routes/dashboard/index.tsx
export default function Dashboard() {
  return <h1>Dashboard Overview</h1>;
}

// routes/dashboard/analytics.tsx
export default function Analytics() {
  return <h1>Analytics</h1>;
}
```

## Loading States

### Route Loading

```tsx
// routes/posts/[id].tsx
export default function Post() {
  return <Suspense fallback={<div>Loading post...</div>}>
    <PostContent />
  </Suspense>;
}
```

### Global Loading

```tsx
// routes/_layout.tsx
import { useNavigation } from 'philjs-router';

export default function Layout({ children }) {
  const navigation = useNavigation();

  return (
    <div>
      {navigation.state === 'loading' && (
        <div class="loading-bar">Loading...</div>
      )}

      {children}
    </div>
  );
}
```

## Error Handling

### Error Boundaries

```tsx
// routes/posts/[id].tsx
import { ErrorBoundary } from 'philjs-core';

export default function Post() {
  return (
    <ErrorBoundary
      fallback={(error, reset) => (
        <div>
          <h1>Error Loading Post</h1>
          <p>{error.message}</p>
          <button onClick={reset}>Try Again</button>
        </div>
      )}
    >
      <PostContent />
    </ErrorBoundary>
  );
}
```

### 404 Pages

```tsx
// routes/[...404].tsx
export default function NotFound() {
  return (
    <div>
      <h1>404 - Page Not Found</h1>
      <p>The page you're looking for doesn't exist.</p>
      <Link href="/">Go Home</Link>
    </div>
  );
}
```

## Redirects

### Client-Side Redirects

```tsx
import { redirect } from 'philjs-router';

function ProtectedPage() {
  const user = useUser();

  if (!user) {
    redirect('/login');
    return null;
  }

  return <div>Protected Content</div>;
}
```

### Server-Side Redirects

```tsx
// routes/old-page.tsx
export const loader = () => {
  return redirect('/new-page', 301);
};
```

## Route Groups

Organize routes without affecting URLs:

```
routes/
  (marketing)/
    index.tsx        → /
    about.tsx        → /about
    pricing.tsx      → /pricing
  (app)/
    dashboard.tsx    → /dashboard
    settings.tsx     → /settings
```

```tsx
// routes/(marketing)/_layout.tsx
export default function MarketingLayout({ children }) {
  return (
    <div class="marketing">
      <nav>Marketing Nav</nav>
      {children}
    </div>
  );
}

// routes/(app)/_layout.tsx
export default function AppLayout({ children }) {
  return (
    <div class="app">
      <nav>App Nav</nav>
      {children}
    </div>
  );
}
```

## Route Configuration

### Route Metadata

```tsx
// routes/about.tsx
export const meta = {
  title: 'About Us',
  description: 'Learn more about our company',
  keywords: ['about', 'company', 'team']
};

export default function About() {
  return <div>About Us</div>;
}
```

### Route Options

```tsx
// routes/api.tsx
export const config = {
  runtime: 'edge',
  regions: ['iad1'],
  cache: {
    maxAge: 3600
  }
};

export default function API() {
  return <div>API Route</div>;
}
```

## Best Practices

### ✅ Do: Use Link for Internal Navigation

```tsx
// ✅ Good - uses Link component
<Link href="/about">About</Link>

// ❌ Bad - full page reload
<a href="/about">About</a>
```

### ✅ Do: Organize Routes Logically

```
routes/
  admin/           # Admin routes
  api/            # API routes
  (public)/       # Public marketing pages
  (app)/          # Authenticated app routes
```

### ✅ Do: Use Layouts for Shared UI

```tsx
// ✅ Good - shared layout
// routes/dashboard/_layout.tsx
export default function DashboardLayout({ children }) {
  return (
    <div>
      <DashboardNav />
      {children}
    </div>
  );
}
```

### ❌ Don't: Nest Routes Too Deeply

```
// ❌ Bad - too deep
routes/app/dashboard/users/list/active/premium/index.tsx

// ✅ Good - flatter structure
routes/dashboard/users.tsx
routes/dashboard/users/[id].tsx
```

## Next Steps

- [Dynamic Routes](/docs/routing/dynamic-routes.md) - Advanced route patterns
- [Data Loading](/docs/routing/data-loading.md) - Load data for routes
- [Route Guards](/docs/routing/route-guards.md) - Protect routes
- [Navigation](/docs/routing/navigation.md) - Advanced navigation

---

💡 **Tip**: Use route groups `(name)` to organize routes without affecting the URL structure.

⚠️ **Warning**: Always use the `Link` component for internal navigation to enable client-side routing.

ℹ️ **Note**: PhilJS automatically code-splits each route for optimal performance.
