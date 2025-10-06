# Routing Basics

PhilJS includes a powerful file-based routing system that automatically creates routes from your file structure. No configuration needed—just create files and PhilJS handles the rest.

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

## Navigation

### Link Component

```tsx
import { Link } from 'philjs-router';

function Navigation() {
  return (
    <nav>
      <Link href="/">Home</Link>
      <Link href="/about">About</Link>
      <Link href="/blog">Blog</Link>
      <Link href="/contact">Contact</Link>
    </nav>
  );
}
```

### Active Links

```tsx
import { Link, useLocation } from 'philjs-router';

function NavLink({ href, children }) {
  const location = useLocation();
  const isActive = location.pathname === href;

  return (
    <Link
      href={href}
      class={isActive ? 'active' : ''}
    >
      {children}
    </Link>
  );
}

// Usage
<nav>
  <NavLink href="/">Home</NavLink>
  <NavLink href="/about">About</NavLink>
</nav>
```

### Programmatic Navigation

```tsx
import { useNavigate } from 'philjs-router';

function LoginForm() {
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    const success = await login();

    if (success) {
      navigate('/dashboard');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input type="email" name="email" />
      <input type="password" name="password" />
      <button type="submit">Login</button>
    </form>
  );
}
```

## Route Parameters

### Dynamic Segments

```tsx
// routes/users/[id].tsx
import { useParams } from 'philjs-router';

export default function UserProfile() {
  const params = useParams();

  return (
    <div>
      <h1>User Profile</h1>
      <p>User ID: {params.id}</p>
    </div>
  );
}
```

### Multiple Parameters

```tsx
// routes/blog/[category]/[slug].tsx
import { useParams } from 'philjs-router';

export default function BlogPost() {
  const params = useParams();

  return (
    <div>
      <h1>Blog Post</h1>
      <p>Category: {params.category}</p>
      <p>Slug: {params.slug}</p>
    </div>
  );
}
```

### Catch-All Routes

```tsx
// routes/docs/[...path].tsx
import { useParams } from 'philjs-router';

export default function Docs() {
  const params = useParams();
  const path = params.path; // Can be multiple segments

  return (
    <div>
      <h1>Documentation</h1>
      <p>Path: {path}</p>
    </div>
  );
}

// Matches:
// /docs/getting-started → path = "getting-started"
// /docs/api/core → path = "api/core"
// /docs/guides/tutorials/intro → path = "guides/tutorials/intro"
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
