# Routing Overview

Learn how routing works in PhilJS with file-based routing, navigation, and route parameters.

## What You'll Learn

- File-based routing system
- Creating routes
- Navigation between pages
- Route parameters
- Nested routes
- Routing best practices

## What is Routing?

Routing maps URLs to components:

```
/ → Home page
/about → About page
/blog → Blog listing
/blog/hello-world → Specific blog post
```

## File-Based Routing

PhilJS uses file-based routing - your file structure defines your routes:

```
src/pages/
  index.tsx → /
  about.tsx → /about
  blog/
    index.tsx → /blog
    [slug].tsx → /blog/:slug
  users/
    [id].tsx → /users/:id
```

**Benefits:**
- Intuitive structure
- Auto-generates routes
- No route configuration needed
- TypeScript-safe

## Creating Your First Route

### 1. Create pages/ Directory

```bash
src/
  pages/
    index.tsx
```

### 2. Create Page Component

```typescript
// src/pages/index.tsx
export default function Home() {
  return (
    <div>
      <h1>Welcome to PhilJS!</h1>
      <p>This is the home page</p>
    </div>
  );
}
```

### 3. Add More Pages

```typescript
// src/pages/about.tsx
export default function About() {
  return (
    <div>
      <h1>About Us</h1>
      <p>Learn more about our company</p>
    </div>
  );
}
```

Now you have two routes:
- `/` → Home
- `/about` → About

## Navigation

### Link Component

```typescript
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

### Programmatic Navigation

```typescript
import { useRouter } from 'philjs-router';

function LoginForm() {
  const router = useRouter();

  const handleSubmit = async (e: Event) => {
    e.preventDefault();

    // Login logic...

    // Navigate to dashboard
    router.push('/dashboard');
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* form fields */}
      <button type="submit">Login</button>
    </form>
  );
}
```

## Dynamic Routes

Use brackets for dynamic segments:

```typescript
// src/pages/blog/[slug].tsx
import { useParams } from 'philjs-router';

export default function BlogPost() {
  const params = useParams();

  return (
    <div>
      <h1>Blog Post: {params.slug}</h1>
    </div>
  );
}
```

**URLs:**
- `/blog/hello-world` → `params.slug = "hello-world"`
- `/blog/getting-started` → `params.slug = "getting-started"`

### Multiple Parameters

```typescript
// src/pages/users/[id]/posts/[postId].tsx
import { useParams } from 'philjs-router';

export default function UserPost() {
  const params = useParams();

  return (
    <div>
      <h1>User {params.id}</h1>
      <h2>Post {params.postId}</h2>
    </div>
  );
}
```

**URL:** `/users/123/posts/456`
- `params.id = "123"`
- `params.postId = "456"`

## Nested Routes

Create nested layouts with folder structure:

```
src/pages/
  dashboard/
    layout.tsx → Wraps all /dashboard/* routes
    index.tsx → /dashboard
    settings.tsx → /dashboard/settings
    profile.tsx → /dashboard/profile
```

```typescript
// src/pages/dashboard/layout.tsx
export default function DashboardLayout({ children }: { children: any }) {
  return (
    <div>
      <DashboardSidebar />
      <main>{children}</main>
    </div>
  );
}
```

All dashboard pages share this layout!

## Route Groups

Organize routes without affecting URLs:

```
src/pages/
  (auth)/
    login.tsx → /login
    signup.tsx → /signup
  (marketing)/
    about.tsx → /about
    pricing.tsx → /pricing
```

Folders in parentheses don't appear in URLs.

## Catch-All Routes

Match multiple segments:

```typescript
// src/pages/docs/[...slug].tsx
import { useParams } from 'philjs-router';

export default function Docs() {
  const params = useParams();

  // /docs/getting-started → params.slug = ["getting-started"]
  // /docs/api/reference → params.slug = ["api", "reference"]

  return <DocsPage path={params.slug} />;
}
```

## Active Links

Highlight current page:

```typescript
import { Link, usePathname } from 'philjs-router';

function NavLink({ href, children }: { href: string; children: any }) {
  const pathname = usePathname();
  const isActive = pathname === href;

  return (
    <Link
      href={href}
      className={isActive ? 'nav-link active' : 'nav-link'}
    >
      {children}
    </Link>
  );
}
```

## Query Parameters

Access URL query parameters:

```typescript
import { useSearchParams } from 'philjs-router';

function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  const query = searchParams.get('q') || '';
  const page = searchParams.get('page') || '1';

  return (
    <div>
      <h1>Search: {query}</h1>
      <p>Page {page}</p>

      <button onClick={() => setSearchParams({ q: query, page: '2' })}>
        Next Page
      </button>
    </div>
  );
}
```

**URL:** `/search?q=philjs&page=1`

## 404 Pages

Create custom 404 page:

```typescript
// src/pages/404.tsx
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

## Loading States

Show loading while route changes:

```typescript
import { useRouter } from 'philjs-router';
import { signal } from 'philjs-core';

function App() {
  const router = useRouter();
  const loading = signal(false);

  // Listen to route changes
  router.events.on('routeChangeStart', () => loading.set(true));
  router.events.on('routeChangeComplete', () => loading.set(false));

  return (
    <div>
      {loading() && <LoadingBar />}
      <Router />
    </div>
  );
}
```

## Route Metadata

Add metadata to routes:

```typescript
// src/pages/about.tsx
export const metadata = {
  title: 'About Us',
  description: 'Learn more about our company'
};

export default function About() {
  return <div>About page</div>;
}
```

## Best Practices

### Organize by Feature

```
src/pages/
  blog/
    index.tsx
    [slug].tsx
    components/
      BlogCard.tsx
    utils/
      formatDate.ts
```

### Use Layouts

```typescript
// Wrap sections with shared layouts
src/pages/
  dashboard/
    layout.tsx ← Shared layout
    index.tsx
    settings.tsx
```

### Lazy Load Routes

```typescript
// Large routes loaded on demand
const Dashboard = lazy(() => import('./pages/Dashboard'));
```

### Type-Safe Routes

```typescript
// Define route types
type Routes = '/' | '/about' | '/blog' | `/blog/${string}`;

function navigate(route: Routes) {
  router.push(route);
}

navigate('/about'); // ✅
navigate('/invalid'); // ❌ TypeScript error
```

## Complete Example

```typescript
// src/pages/index.tsx
import { Link } from 'philjs-router';

export default function Home() {
  return (
    <div>
      <h1>Welcome to My Site</h1>

      <nav>
        <Link href="/about">About</Link>
        <Link href="/blog">Blog</Link>
        <Link href="/contact">Contact</Link>
      </nav>

      <section>
        <h2>Featured Posts</h2>
        {/* Content */}
      </section>
    </div>
  );
}
```

```typescript
// src/pages/blog/[slug].tsx
import { useParams, Link } from 'philjs-router';
import { signal, effect } from 'philjs-core';

export default function BlogPost() {
  const params = useParams();
  const post = signal(null);

  effect(() => {
    fetch(`/api/posts/${params.slug}`)
      .then(r => r.json())
      .then(data => post.set(data));
  });

  if (!post()) return <div>Loading...</div>;

  return (
    <article>
      <Link href="/blog">← Back to Blog</Link>

      <h1>{post().title}</h1>
      <p>{post().content}</p>
    </article>
  );
}
```

## Summary

You've learned:

✅ File-based routing system
✅ Creating pages and routes
✅ Navigation with Link component
✅ Dynamic routes with parameters
✅ Nested routes and layouts
✅ Query parameters
✅ 404 pages
✅ Loading states
✅ Best practices

File-based routing makes building multi-page apps intuitive!

---

**Next:** [Dynamic Routes →](./dynamic-routes.md) Master route parameters and patterns
