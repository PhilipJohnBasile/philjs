# Navigation and Links

Master client-side navigation with the Link component and programmatic routing.

> ⚠️ PhilJS currently ships low-level routing utilities (see [`/docs/api-reference/router.md`](../api-reference/router.md)). The high-level helpers showcased here—`Link`, `useRouter()`, `useNavigate()`, etc.—are part of the planned ergonomic API and are provided for conceptual guidance.

## What You'll Learn

- Link component
- Programmatic navigation
- Active links
- Prefetching
- Navigation guards
- Best practices

## Link Component

Use `<Link>` for client-side navigation:

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

**Benefits over `<a>`:**
- Client-side navigation (no page reload)
- Prefetching
- Active state tracking
- Route transitions

## Link Props

### Basic Usage

```typescript
<Link href="/about">About Us</Link>
```

### With Children

```typescript
<Link href="/products">
  <div className="card">
    <h3>Products</h3>
    <p>View our catalog</p>
  </div>
</Link>
```

### External Links

```typescript
// External links open in new tab
<Link href="https://example.com" external>
  External Site
</Link>

// Or use regular anchor for external
<a href="https://example.com" target="_blank" rel="noopener">
  External Site
</a>
```

### Custom Class Names

```typescript
<Link href="/about" className="nav-link">
  About
</Link>
```

### Replace History

```typescript
// Replace current entry instead of push
<Link href="/login" replace>
  Login
</Link>
```

## Active Links

Highlight the current page:

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

// Usage:
<nav>
  <NavLink href="/">Home</NavLink>
  <NavLink href="/about">About</NavLink>
  <NavLink href="/blog">Blog</NavLink>
</nav>
```

### Partial Matching

```typescript
function NavLink({ href, children }: { href: string; children: any }) {
  const pathname = usePathname();

  // Match if pathname starts with href
  const isActive = pathname.startsWith(href);

  return (
    <Link href={href} className={isActive ? 'active' : ''}>
      {children}
    </Link>
  );
}

// /blog/post-1 will make "Blog" active
<NavLink href="/blog">Blog</NavLink>
```

### Exact Matching

```typescript
function NavLink({ href, exact = false, children }: {
  href: string;
  exact?: boolean;
  children: any;
}) {
  const pathname = usePathname();

  const isActive = exact
    ? pathname === href
    : pathname.startsWith(href);

  return (
    <Link href={href} className={isActive ? 'active' : ''}>
      {children}
    </Link>
  );
}

// Usage:
<NavLink href="/" exact>Home</NavLink> // Only / is active
<NavLink href="/blog">Blog</NavLink> // /blog/* is active
```

## Programmatic Navigation

Navigate from JavaScript:

```typescript
import { useRouter } from 'philjs-router';

function LoginForm() {
  const router = useRouter();

  const handleSubmit = async (e: Event) => {
    e.preventDefault();

    const success = await login();

    if (success) {
      // Navigate to dashboard
      router.push('/dashboard');
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

### Router Methods

```typescript
const router = useRouter();

// Navigate to route
router.push('/about');

// Replace current route
router.replace('/login');

// Go back
router.back();

// Go forward
router.forward();

// Go to specific history entry
router.go(-2); // Go back 2 pages
router.go(1); // Go forward 1 page

// Reload current route
router.reload();
```

### Navigation with State

```typescript
// Pass state with navigation
router.push('/profile', { state: { from: '/dashboard' } });

// Access state in destination
function Profile() {
  const router = useRouter();
  const state = router.state;

  console.log('Came from:', state?.from);
}
```

## Prefetching

Prefetch routes for instant navigation:

```typescript
import { Link } from 'philjs-router';

// Prefetch on hover (default)
<Link href="/dashboard" prefetch="hover">
  Dashboard
</Link>

// Prefetch immediately
<Link href="/dashboard" prefetch="immediate">
  Dashboard
</Link>

// Don't prefetch
<Link href="/dashboard" prefetch="none">
  Dashboard
</Link>
```

### Manual Prefetching

```typescript
import { useRouter } from 'philjs-router';

function NavItem({ href, children }) {
  const router = useRouter();

  const handleMouseEnter = () => {
    // Prefetch route on hover
    router.prefetch(href);
  };

  return (
    <a href={href} onMouseEnter={handleMouseEnter}>
      {children}
    </a>
  );
}
```

## Scroll Behavior

### Scroll to Top

```typescript
// Default: scrolls to top on navigation
<Link href="/about">About</Link>

// Disable scroll to top
<Link href="/about" scroll={false}>
  About
</Link>
```

### Scroll to Element

```typescript
function TableOfContents() {
  return (
    <nav>
      <Link href="#introduction">Introduction</Link>
      <Link href="#getting-started">Getting Started</Link>
      <Link href="#examples">Examples</Link>
    </nav>
  );
}
```

### Preserve Scroll Position

```typescript
import { useRouter } from 'philjs-router';

function Page() {
  const router = useRouter();

  const navigateWithScroll = () => {
    // Navigate and keep scroll position
    router.push('/next-page', { scroll: false });
  };

  return <button onClick={navigateWithScroll}>Next</button>;
}
```

## Navigation Guards

Protect routes from unauthorized access:

```typescript
import { useRouter } from 'philjs-router';
import { useUser } from './hooks/useUser';

function ProtectedRoute({ children }: { children: any }) {
  const router = useRouter();
  const user = useUser();

  if (!user()) {
    router.replace('/login');
    return null;
  }

  return children;
}

// Usage:
<ProtectedRoute>
  <Dashboard />
</ProtectedRoute>
```

### Role-Based Guards

```typescript
function AdminRoute({ children }: { children: any }) {
  const router = useRouter();
  const user = useUser();

  if (!user()) {
    router.replace('/login');
    return null;
  }

  if (user()!.role !== 'admin') {
    router.replace('/unauthorized');
    return null;
  }

  return children;
}
```

### Confirm Before Leave

```typescript
function EditForm() {
  const router = useRouter();
  const hasUnsavedChanges = signal(false);

  const handleNavigate = (e: Event) => {
    if (hasUnsavedChanges()) {
      const confirm = window.confirm('You have unsaved changes. Leave anyway?');

      if (!confirm) {
        e.preventDefault();
      }
    }
  };

  effect(() => {
    router.events.on('beforeNavigate', handleNavigate);

    return () => {
      router.events.off('beforeNavigate', handleNavigate);
    };
  });

  return <form>{/* form fields */}</form>;
}
```

## Loading States

Show loading indicator during navigation:

```typescript
import { useRouter } from 'philjs-router';
import { signal } from 'philjs-core';

function App() {
  const router = useRouter();
  const loading = signal(false);

  effect(() => {
    const handleStart = () => loading.set(true);
    const handleComplete = () => loading.set(false);

    router.events.on('routeChangeStart', handleStart);
    router.events.on('routeChangeComplete', handleComplete);

    return () => {
      router.events.off('routeChangeStart', handleStart);
      router.events.off('routeChangeComplete', handleComplete);
    };
  });

  return (
    <div>
      {loading() && <LoadingBar />}
      <Router />
    </div>
  );
}
```

### Progress Bar

```typescript
function LoadingBar() {
  const progress = signal(0);

  effect(() => {
    const timer = setInterval(() => {
      progress.set(p => Math.min(p + 10, 90));
    }, 100);

    return () => clearInterval(timer);
  });

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        height: '3px',
        background: '#667eea',
        width: `${progress()}%`,
        transition: 'width 0.2s'
      }}
    />
  );
}
```

## Query Parameters

Navigate with query params:

```typescript
import { useRouter } from 'philjs-router';

function SearchForm() {
  const router = useRouter();
  const query = signal('');

  const handleSearch = () => {
    router.push({
      pathname: '/search',
      query: { q: query(), page: '1' }
    });

    // URL: /search?q=philjs&page=1
  };

  return (
    <form>
      <input
        value={query()}
        onInput={(e) => query.set(e.target.value)}
      />
      <button onClick={handleSearch}>Search</button>
    </form>
  );
}
```

### Update Query Params

```typescript
import { useSearchParams } from 'philjs-router';

function Filters() {
  const [searchParams, setSearchParams] = useSearchParams();

  const category = searchParams.get('category') || 'all';

  const setCategory = (cat: string) => {
    setSearchParams({ category: cat });
  };

  return (
    <div>
      <button onClick={() => setCategory('electronics')}>Electronics</button>
      <button onClick={() => setCategory('books')}>Books</button>
      <button onClick={() => setCategory('clothing')}>Clothing</button>
    </div>
  );
}
```

## Best Practices

### Always Use Link for Internal Navigation

```typescript
// ❌ Don't use <a> for internal links
<a href="/about">About</a>

// ✅ Use <Link>
<Link href="/about">About</Link>
```

### Prefetch Important Routes

```typescript
// Prefetch dashboard on app load
useEffect(() => {
  router.prefetch('/dashboard');
}, []);
```

### Show Loading States

```typescript
// ✅ Always show loading feedback
{loading() && <Spinner />}
```

### Handle Navigation Errors

```typescript
router.events.on('routeChangeError', (error) => {
  console.error('Navigation error:', error);
  // Show error message
});
```

## Summary

You've learned:

✅ Link component for client-side navigation
✅ Active link styling
✅ Programmatic navigation with useRouter
✅ Prefetching for instant navigation
✅ Navigation guards for protection
✅ Loading states and progress bars
✅ Query parameter handling
✅ Best practices

Master navigation for smooth, app-like experiences!

---

**Next:** [Layouts →](./layouts.md) Create shared layouts for your routes
