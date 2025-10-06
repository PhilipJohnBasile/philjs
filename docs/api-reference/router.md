# Router API

Client-side routing for PhilJS applications.

## Router

Root router component for managing navigation.

### Signature

```typescript
interface RouterProps {
  children: JSX.Element;
  base?: string;
}

function Router({ children, base }: RouterProps): JSX.Element
```

### Parameters

- **children**: `JSX.Element` - Route components
- **base**: `string` - Base path for all routes (optional)

### Examples

#### Basic Router

```typescript
import { Router, Route } from 'philjs-router';

function App() {
  return (
    <Router>
      <Route path="/" component={Home} />
      <Route path="/about" component={About} />
      <Route path="/contact" component={Contact} />
    </Router>
  );
}
```

#### With Base Path

```typescript
<Router base="/app">
  <Route path="/" component={Dashboard} />
  {/* Matches /app/ */}
  <Route path="/settings" component={Settings} />
  {/* Matches /app/settings */}
</Router>
```

### Notes

- Should be at the root of your application
- Only one Router per application
- Uses HTML5 History API

---

## Route

Defines a route and its component.

### Signature

```typescript
interface RouteProps {
  path: string;
  component: Component | (() => JSX.Element);
  exact?: boolean;
}

function Route({ path, component, exact }: RouteProps): JSX.Element | null
```

### Parameters

- **path**: `string` - URL pattern to match
- **component**: `Component | (() => JSX.Element)` - Component to render
- **exact**: `boolean` - Require exact path match (default: false)

### Examples

#### Basic Route

```typescript
<Route path="/" component={Home} />
<Route path="/about" component={About} />
```

#### Dynamic Routes

```typescript
<Route path="/users/:id" component={UserProfile} />
<Route path="/posts/:slug" component={BlogPost} />
```

#### Exact Matching

```typescript
<Route path="/" component={Home} exact />
{/* Only matches "/" exactly */}

<Route path="/users" component={Users} />
{/* Matches "/users" and "/users/123" */}
```

#### Inline Components

```typescript
<Route
  path="/dashboard"
  component={() => (
    <div>
      <Header />
      <Dashboard />
    </div>
  )}
/>
```

### Notes

- Routes are matched in order
- First matching route renders
- Use `exact` for index routes
- Dynamic segments available via `useParams()`

---

## Link

Declarative navigation component.

### Signature

```typescript
interface LinkProps {
  to: string;
  replace?: boolean;
  children: JSX.Element;
  className?: string;
  activeClassName?: string;
}

function Link(props: LinkProps): JSX.Element
```

### Parameters

- **to**: `string` - Destination path
- **replace**: `boolean` - Replace history instead of push (default: false)
- **children**: `JSX.Element` - Link content
- **className**: `string` - CSS class
- **activeClassName**: `string` - Class when link is active

### Examples

#### Basic Link

```typescript
import { Link } from 'philjs-router';

<Link to="/">Home</Link>
<Link to="/about">About</Link>
```

#### With Styling

```typescript
<Link
  to="/dashboard"
  className="nav-link"
  activeClassName="active"
>
  Dashboard
</Link>
```

#### Replace Navigation

```typescript
<Link to="/login" replace>
  Login
</Link>
```

#### With Query Params

```typescript
<Link to="/search?q=philjs">
  Search PhilJS
</Link>
```

### Notes

- Prevents page reload
- Handles active state automatically
- Supports keyboard navigation
- Accessible by default

---

## useRouter()

Hook for accessing router state and methods.

### Signature

```typescript
interface Router {
  path: () => string;
  params: () => RouteParams;
  query: () => URLSearchParams;
  navigate: (to: string, options?: NavigateOptions) => void;
  back: () => void;
  forward: () => void;
}

function useRouter(): Router
```

### Returns

Router object with navigation methods and state

### Examples

#### Current Path

```typescript
function Component() {
  const router = useRouter();

  return <div>Current path: {router.path()}</div>;
}
```

#### Navigate Programmatically

```typescript
function LoginForm() {
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    await login();
    router.navigate('/dashboard');
  };

  return <form onSubmit={handleSubmit}>{/* ... */}</form>;
}
```

#### Access Route Params

```typescript
function UserProfile() {
  const router = useRouter();
  const userId = router.params().id;

  return <div>User ID: {userId}</div>;
}
```

#### Access Query Params

```typescript
function SearchResults() {
  const router = useRouter();
  const query = router.query().get('q');

  return <div>Search: {query}</div>;
}
```

### Notes

- Must be called inside a component
- Path updates reactively
- Navigate is navigation-safe

---

## useNavigate()

Hook for programmatic navigation.

### Signature

```typescript
type Navigate = (to: string, options?: NavigateOptions) => void;

function useNavigate(): Navigate
```

### Returns

Navigate function

### Examples

#### Basic Navigation

```typescript
function Component() {
  const navigate = useNavigate();

  return (
    <button onClick={() => navigate('/about')}>
      Go to About
    </button>
  );
}
```

#### Replace History

```typescript
const navigate = useNavigate();

navigate('/login', { replace: true });
```

#### With State

```typescript
navigate('/dashboard', {
  state: { from: '/login' }
});
```

---

## useParams()

Hook for accessing route parameters.

### Signature

```typescript
function useParams<T extends RouteParams = RouteParams>(): T
```

### Returns

Object containing route parameters

### Examples

#### Single Parameter

```typescript
// Route: /users/:id
function UserProfile() {
  const { id } = useParams<{ id: string }>();

  return <div>User ID: {id}</div>;
}
```

#### Multiple Parameters

```typescript
// Route: /posts/:category/:slug
function BlogPost() {
  const { category, slug } = useParams<{
    category: string;
    slug: string;
  }>();

  return (
    <div>
      <p>Category: {category}</p>
      <p>Slug: {slug}</p>
    </div>
  );
}
```

---

## useLocation()

Hook for accessing current location.

### Signature

```typescript
interface Location {
  pathname: string;
  search: string;
  hash: string;
  state: any;
}

function useLocation(): () => Location
```

### Returns

Signal containing current location

### Examples

#### Access Location

```typescript
function Component() {
  const location = useLocation();

  return (
    <div>
      <p>Path: {location().pathname}</p>
      <p>Search: {location().search}</p>
      <p>Hash: {location().hash}</p>
    </div>
  );
}
```

#### Track Page Views

```typescript
function Analytics() {
  const location = useLocation();

  effect(() => {
    trackPageView(location().pathname);
  });

  return null;
}
```

---

## useSearchParams()

Hook for reading and updating query parameters.

### Signature

```typescript
function useSearchParams(): {
  searchParams: () => URLSearchParams;
  setSearchParams: (params: Record<string, string>) => void;
}
```

### Returns

Object with `searchParams` getter and `setSearchParams` setter

### Examples

#### Read Query Params

```typescript
function SearchPage() {
  const { searchParams } = useSearchParams();

  const query = searchParams().get('q');
  const page = searchParams().get('page');

  return (
    <div>
      <p>Query: {query}</p>
      <p>Page: {page}</p>
    </div>
  );
}
```

#### Update Query Params

```typescript
function Filters() {
  const { setSearchParams } = useSearchParams();

  const applyFilters = (category: string, sort: string) => {
    setSearchParams({ category, sort });
    // Updates URL to ?category=books&sort=price
  };

  return (
    <button onClick={() => applyFilters('books', 'price')}>
      Apply Filters
    </button>
  );
}
```

---

## Nested Routes

Support for nested routing.

### Examples

```typescript
<Router>
  <Route path="/dashboard" component={() => (
    <Dashboard>
      <Route path="/dashboard/overview" component={Overview} />
      <Route path="/dashboard/analytics" component={Analytics} />
      <Route path="/dashboard/settings" component={Settings} />
    </Dashboard>
  )} />
</Router>
```

---

## Route Guards

Protect routes with guards.

### Examples

```typescript
function ProtectedRoute({ component: Component, ...rest }: RouteProps) {
  const { isAuthenticated } = useAuth();

  return (
    <Route
      {...rest}
      component={() =>
        isAuthenticated() ? <Component /> : <Navigate to="/login" />
      }
    />
  );
}

// Usage
<ProtectedRoute path="/dashboard" component={Dashboard} />
```

---

## Redirects

Redirect to another route.

### Examples

```typescript
function Navigate({ to }: { to: string }) {
  const navigate = useNavigate();

  effect(() => {
    navigate(to, { replace: true });
  });

  return null;
}

// Usage
<Route path="/old-path" component={() => <Navigate to="/new-path" />} />
```

---

## Best Practices

### Use Link for Navigation

```typescript
// ✅ Declarative navigation
<Link to="/about">About</Link>

// ❌ Manual href (causes reload)
<a href="/about">About</a>
```

### Type Route Params

```typescript
// ✅ Type-safe params
const { id } = useParams<{ id: string }>();

// ❌ No types
const { id } = useParams();
```

### Use Exact for Index Routes

```typescript
// ✅ Exact match for home
<Route path="/" component={Home} exact />

// ❌ Matches all paths
<Route path="/" component={Home} />
```

---

**Next:** [SSR API →](./ssr.md) Server-side rendering
