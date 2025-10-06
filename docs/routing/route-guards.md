# Route Guards

Route guards protect routes by controlling access based on authentication, authorization, or other conditions. PhilJS provides flexible patterns for implementing route protection.

## Authentication Guards

### Basic Auth Guard

```tsx
// routes/dashboard/_layout.tsx
import { redirect } from 'philjs-router';
import { createDataLoader } from 'philjs-router';

export const loader = createDataLoader(async ({ request }) => {
  const user = await authenticateRequest(request);

  if (!user) {
    throw redirect('/login');
  }

  return { user };
});

export default function DashboardLayout({ children, data }) {
  return (
    <div>
      <header>
        <p>Welcome, {data.user.name}</p>
      </header>
      {children}
    </div>
  );
}
```

### Redirect with Return URL

```tsx
export const loader = createDataLoader(async ({ request }) => {
  const user = await authenticateRequest(request);

  if (!user) {
    const url = new URL(request.url);
    throw redirect(`/login?return=${encodeURIComponent(url.pathname)}`);
  }

  return { user };
});

// routes/login.tsx
export default function Login() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const returnUrl = searchParams.get('return') || '/';

  const handleLogin = async (e) => {
    e.preventDefault();
    const success = await login(/* ... */);

    if (success) {
      navigate(returnUrl);
    }
  };

  return <form onSubmit={handleLogin}>...</form>;
}
```

## Authorization Guards

### Role-Based Access

```tsx
// lib/guards.ts
export function requireRole(role: string) {
  return async ({ request }) => {
    const user = await authenticateRequest(request);

    if (!user) {
      throw redirect('/login');
    }

    if (!user.roles.includes(role)) {
      throw redirect('/unauthorized');
    }

    return { user };
  };
}

// routes/admin/_layout.tsx
export const loader = createDataLoader(requireRole('admin'));

export default function AdminLayout({ children, data }) {
  return (
    <div>
      <h1>Admin Panel</h1>
      <p>Logged in as: {data.user.name}</p>
      {children}
    </div>
  );
}
```

### Permission-Based Access

```tsx
// lib/guards.ts
export function requirePermission(permission: string) {
  return async ({ request }) => {
    const user = await authenticateRequest(request);

    if (!user) {
      throw redirect('/login');
    }

    const hasPermission = await checkPermission(user.id, permission);

    if (!hasPermission) {
      throw new Response('Forbidden', { status: 403 });
    }

    return { user };
  };
}

// routes/posts/[id]/edit.tsx
export const loader = createDataLoader(async ({ request, params }) => {
  const guard = requirePermission('posts.edit');
  const { user } = await guard({ request, params });

  const post = await db.posts.findById(params.id);

  // Additional ownership check
  if (post.authorId !== user.id && !user.roles.includes('admin')) {
    throw new Response('Forbidden', { status: 403 });
  }

  return { user, post };
});
```

## Client-Side Guards

### Route Protection Component

```tsx
// components/ProtectedRoute.tsx
import { useAuth } from '~/lib/auth';
import { Navigate } from 'philjs-router';

export function ProtectedRoute({ children }) {
  const auth = useAuth();

  if (!auth.user()) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

// Usage
export default function Dashboard() {
  return (
    <ProtectedRoute>
      <DashboardContent />
    </ProtectedRoute>
  );
}
```

### Role Guard Component

```tsx
interface RoleGuardProps {
  role: string;
  fallback?: JSX.Element;
  children: JSX.Element;
}

export function RoleGuard({ role, fallback, children }: RoleGuardProps) {
  const auth = useAuth();
  const user = auth.user();

  if (!user) {
    return <Navigate to="/login" />;
  }

  if (!user.roles.includes(role)) {
    return fallback || <Navigate to="/unauthorized" />;
  }

  return <>{children}</>;
}

// Usage
<RoleGuard role="admin">
  <AdminPanel />
</RoleGuard>
```

## Conditional Rendering

### Feature Flags

```tsx
import { signal } from 'philjs-core';

const features = signal({
  newDashboard: false,
  betaFeatures: false,
  advancedSearch: true
});

export function FeatureGuard({ feature, children, fallback }) {
  if (!features()[feature]) {
    return fallback || null;
  }

  return <>{children}</>;
}

// Usage
<FeatureGuard
  feature="newDashboard"
  fallback={<OldDashboard />}
>
  <NewDashboard />
</FeatureGuard>
```

### Subscription Guards

```tsx
export const loader = createDataLoader(async ({ request }) => {
  const user = await authenticateRequest(request);

  if (!user) {
    throw redirect('/login');
  }

  const subscription = await db.subscriptions.findActive(user.id);

  if (!subscription) {
    throw redirect('/pricing');
  }

  if (subscription.tier === 'free') {
    throw redirect('/upgrade');
  }

  return { user, subscription };
});
```

## Guard Composition

### Multiple Guards

```tsx
// lib/guards.ts
export function composeGuards(...guards) {
  return async (context) => {
    const results = {};

    for (const guard of guards) {
      const result = await guard(context);
      Object.assign(results, result);
    }

    return results;
  };
}

const requireAuth = async ({ request }) => {
  const user = await authenticateRequest(request);
  if (!user) throw redirect('/login');
  return { user };
};

const requireSubscription = async ({ user }) => {
  const subscription = await db.subscriptions.findActive(user.id);
  if (!subscription) throw redirect('/pricing');
  return { subscription };
};

const requirePremium = async ({ subscription }) => {
  if (subscription.tier !== 'premium') throw redirect('/upgrade');
  return {};
};

// Use composed guards
export const loader = createDataLoader(
  composeGuards(requireAuth, requireSubscription, requirePremium)
);
```

### Async Guard Pipeline

```tsx
class GuardPipeline {
  private guards: Array<(ctx: any) => Promise<any>> = [];

  use(guard: (ctx: any) => Promise<any>) {
    this.guards.push(guard);
    return this;
  }

  async execute(context: any) {
    let result = {};

    for (const guard of this.guards) {
      const guardResult = await guard({ ...context, ...result });
      result = { ...result, ...guardResult };
    }

    return result;
  }
}

// Usage
const pipeline = new GuardPipeline()
  .use(requireAuth)
  .use(requireEmailVerified)
  .use(requireRole('admin'))
  .use(requirePermission('users.manage'));

export const loader = createDataLoader(async (context) => {
  const data = await pipeline.execute(context);
  return data;
});
```

## Time-Based Guards

### Schedule-Based Access

```tsx
export const loader = createDataLoader(async ({ request }) => {
  const user = await authenticateRequest(request);

  if (!user) {
    throw redirect('/login');
  }

  const now = new Date();
  const hour = now.getHours();

  // Only accessible during business hours
  if (hour < 9 || hour > 17) {
    throw new Response('Available only during business hours (9 AM - 5 PM)', {
      status: 403
    });
  }

  return { user };
});
```

### Maintenance Mode

```tsx
export const loader = createDataLoader(async ({ request }) => {
  const isMaintenanceMode = await getMaintenanceMode();

  if (isMaintenanceMode) {
    const user = await authenticateRequest(request);

    // Allow admins during maintenance
    if (!user?.roles.includes('admin')) {
      throw new Response('Under Maintenance', {
        status: 503,
        headers: {
          'Retry-After': '3600'
        }
      });
    }
  }

  return {};
});
```

## Rate Limiting Guards

### Request Rate Limiting

```tsx
import { rateLimit } from '~/lib/rate-limit';

export const loader = createDataLoader(async ({ request }) => {
  const ip = request.headers.get('x-forwarded-for') || 'unknown';

  const limited = await rateLimit.check(ip, {
    max: 100,
    window: '1m'
  });

  if (limited) {
    throw new Response('Too Many Requests', {
      status: 429,
      headers: {
        'Retry-After': limited.resetIn.toString()
      }
    });
  }

  return {};
});
```

### User-Based Rate Limiting

```tsx
export const loader = createDataLoader(async ({ request }) => {
  const user = await authenticateRequest(request);

  if (user) {
    const limited = await rateLimit.check(`user:${user.id}`, {
      max: 1000,
      window: '1h'
    });

    if (limited) {
      throw new Response('Rate limit exceeded', { status: 429 });
    }
  }

  return { user };
});
```

## Guard Utilities

### Create Guard Hook

```tsx
export function createGuard(checker: () => boolean, redirectTo: string) {
  return () => {
    if (!checker()) {
      throw redirect(redirectTo);
    }
  };
}

// Usage
const requireEmailVerified = createGuard(
  () => user().emailVerified,
  '/verify-email'
);
```

### Guard with Loading State

```tsx
export function useGuard(condition: () => boolean) {
  const navigate = useNavigate();
  const [checking, setChecking] = signal(true);

  effect(() => {
    setChecking(true);

    if (!condition()) {
      navigate('/unauthorized');
    } else {
      setChecking(false);
    }
  });

  return { checking };
}

// Usage
function ProtectedPage() {
  const auth = useAuth();
  const { checking } = useGuard(() => auth.user() !== null);

  if (checking()) return <div>Checking permissions...</div>;

  return <div>Protected Content</div>;
}
```

## Error Pages

### 401 Unauthorized

```tsx
// routes/unauthorized.tsx
export default function Unauthorized() {
  return (
    <div>
      <h1>401 - Unauthorized</h1>
      <p>You need to log in to access this page.</p>
      <Link href="/login">Go to Login</Link>
    </div>
  );
}
```

### 403 Forbidden

```tsx
// routes/forbidden.tsx
export default function Forbidden() {
  return (
    <div>
      <h1>403 - Forbidden</h1>
      <p>You don't have permission to access this resource.</p>
      <Link href="/">Go Home</Link>
    </div>
  );
}
```

## Best Practices

### ✅ Do: Guard on the Server

```tsx
// ✅ Good - secure server-side guard
export const loader = createDataLoader(async ({ request }) => {
  const user = await authenticateRequest(request);
  if (!user) throw redirect('/login');
  return { user };
});

// ❌ Bad - client-side only (insecure)
function Dashboard() {
  const user = useUser();
  if (!user) return <Navigate to="/login" />;
  return <div>Dashboard</div>;
}
```

### ✅ Do: Return Appropriate Status Codes

```tsx
// ✅ Good - correct status codes
if (!user) {
  throw new Response('Unauthorized', { status: 401 });
}

if (!hasPermission) {
  throw new Response('Forbidden', { status: 403 });
}
```

### ✅ Do: Compose Guards

```tsx
// ✅ Good - reusable guards
const guards = composeGuards(
  requireAuth,
  requireEmailVerified,
  requireRole('admin')
);

export const loader = createDataLoader(guards);
```

### ❌ Don't: Expose Sensitive Info

```tsx
// ❌ Bad - reveals existence
if (!user) throw new Response('User not found', { status: 404 });

// ✅ Good - generic message
if (!user) throw new Response('Unauthorized', { status: 401 });
```

## Next Steps

- [Authentication](/docs/advanced/auth.md) - Implement auth
- [Middleware](/docs/advanced/middleware.md) - Route middleware
- [Security](/docs/best-practices/security.md) - Security best practices
- [API Routes](/docs/routing/api-routes.md) - Protect API routes

---

💡 **Tip**: Always implement guards on the server. Client-side guards are only for UX, not security.

⚠️ **Warning**: Never trust client-side guards for security. Always validate on the server.

ℹ️ **Note**: Compose guards to create reusable authorization logic across your application.
