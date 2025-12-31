# Middleware

Protect routes, authenticate users, and modify requests with routing middleware.


## What You'll Learn

- Route protection
- Authentication middleware
- Authorization checks
- Redirects and guards
- Request/response modification
- Best practices

## What is Middleware?

Middleware runs before a route renders, allowing you to:

- Check authentication
- Verify permissions
- Redirect users
- Modify requests
- Log analytics
- Set headers

## Layout-Based Middleware

Use layouts for route protection:

```typescript
// src/pages/(protected)/layout.tsx
import { useRouter } from '@philjs/router';
import { useUser } from '@/hooks/useUser';

export default function ProtectedLayout({ children }: { children: any }) {
  const router = useRouter();
  const user = useUser();

  // Redirect if not authenticated
  if (!user()) {
    router.replace('/login');
    return null;
  }

  return <div>{children}</div>;
}
```

All routes in `(protected)/` are now guarded!

## Authentication Middleware

### Basic Auth Check

```typescript
// src/pages/(auth)/layout.tsx
import { useRouter } from '@philjs/router';
import { useAuth } from '@/hooks/useAuth';
import { effect } from '@philjs/core';

export default function AuthLayout({ children }: { children: any }) {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();

  effect(() => {
    if (!isLoading() && !isAuthenticated()) {
      router.replace('/login');
    }
  });

  if (isLoading()) {
    return <LoadingSpinner />;
  }

  if (!isAuthenticated()) {
    return null;
  }

  return <div>{children}</div>;
}
```

### Save Return URL

```typescript
import { useRouter, usePathname } from '@philjs/router';
import { useAuth } from '@/hooks/useAuth';

export default function AuthLayout({ children }: { children: any }) {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated()) {
    // Save where user was trying to go
    const returnUrl = encodeURIComponent(pathname);
    router.replace(`/login?returnUrl=${returnUrl}`);
    return null;
  }

  return <div>{children}</div>;
}
```

Then in login page:

```typescript
// src/pages/login.tsx
import { useRouter, useSearchParams } from '@philjs/router';

export default function Login() {
  const router = useRouter();
  const [searchParams] = useSearchParams();

  const handleLogin = async () => {
    await login();

    const returnUrl = searchParams.get('returnUrl') || '/dashboard';
    router.push(decodeURIComponent(returnUrl));
  };

  return <LoginForm onSubmit={handleLogin} />;
}
```

## Authorization Middleware

### Role-Based Access

```typescript
// src/pages/(admin)/layout.tsx
import { useRouter } from '@philjs/router';
import { useUser } from '@/hooks/useUser';

export default function AdminLayout({ children }: { children: any }) {
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

  return (
    <div className="admin-layout">
      <AdminSidebar />
      {children}
    </div>
  );
}
```

### Multiple Roles

```typescript
interface LayoutProps {
  children: any;
  allowedRoles?: string[];
}

export default function RoleLayout({
  children,
  allowedRoles = ['admin', 'moderator']
}: LayoutProps) {
  const router = useRouter();
  const user = useUser();

  if (!user()) {
    router.replace('/login');
    return null;
  }

  const hasPermission = allowedRoles.includes(user()!.role);

  if (!hasPermission) {
    router.replace('/unauthorized');
    return null;
  }

  return <div>{children}</div>;
}
```

### Permission-Based Access

```typescript
// src/pages/(editor)/layout.tsx
import { useRouter } from '@philjs/router';
import { useUser } from '@/hooks/useUser';

export default function EditorLayout({ children }: { children: any }) {
  const router = useRouter();
  const user = useUser();

  if (!user()) {
    router.replace('/login');
    return null;
  }

  const canEdit = user()!.permissions.includes('edit:content');

  if (!canEdit) {
    router.replace('/forbidden');
    return null;
  }

  return <div>{children}</div>;
}
```

## Subscription Middleware

Check subscription status:

```typescript
// src/pages/(premium)/layout.tsx
import { useRouter } from '@philjs/router';
import { useUser, useSubscription } from '@/hooks';

export default function PremiumLayout({ children }: { children: any }) {
  const router = useRouter();
  const user = useUser();
  const subscription = useSubscription();

  if (!user()) {
    router.replace('/login');
    return null;
  }

  if (!subscription()?.active) {
    router.replace('/upgrade');
    return null;
  }

  return <div>{children}</div>;
}
```

## Feature Flags

Gate features with flags:

```typescript
// src/pages/(beta)/layout.tsx
import { useRouter } from '@philjs/router';
import { useFeatureFlag } from '@/hooks/useFeatureFlag';

export default function BetaLayout({ children }: { children: any }) {
  const router = useRouter();
  const betaEnabled = useFeatureFlag('beta-features');

  if (!betaEnabled()) {
    router.replace('/');
    return null;
  }

  return (
    <div>
      <div className="beta-badge">Beta Feature</div>
      {children}
    </div>
  );
}
```

## Request Logging

Track page views:

```typescript
import { usePathname } from '@philjs/router';
import { effect } from '@philjs/core';

export default function AnalyticsLayout({ children }: { children: any }) {
  const pathname = usePathname();

  effect(() => {
    // Log page view
    analytics.track('page_view', {
      path: pathname,
      timestamp: Date.now()
    });
  });

  return <div>{children}</div>;
}
```

## Rate Limiting

Client-side rate limit checks:

```typescript
import { useRouter } from '@philjs/router';
import { signal, effect } from '@philjs/core';

const requestCount = signal(0);
const lastReset = signal(Date.now());

export default function RateLimitedLayout({ children }: { children: any }) {
  const router = useRouter();

  effect(() => {
    const now = Date.now();
    const elapsed = now - lastReset();

    // Reset every minute
    if (elapsed > 60000) {
      requestCount.set(0);
      lastReset.set(now);
    }

    // Increment counter
    requestCount.set(c => c + 1);

    // Check limit (60 requests per minute)
    if (requestCount() > 60) {
      router.replace('/rate-limited');
    }
  });

  return <div>{children}</div>;
}
```

## Maintenance Mode

Show maintenance page:

```typescript
// src/pages/layout.tsx
import { signal } from '@philjs/core';

const maintenanceMode = signal(false);

export default function RootLayout({ children }: { children: any }) {
  if (maintenanceMode()) {
    return <MaintenancePage />;
  }

  return <div>{children}</div>;
}
```

## Geo-Blocking

Restrict by location:

```typescript
import { useRouter } from '@philjs/router';
import { signal, effect } from '@philjs/core';

const userCountry = signal<string | null>(null);

export default function GeoLayout({ children }: { children: any }) {
  const router = useRouter();

  effect(() => {
    // Fetch user location
    fetch('/api/geo')
      .then(r => r.json())
      .then(data => userCountry.set(data.country));
  });

  effect(() => {
    const country = userCountry();
    const blockedCountries = ['XX', 'YY']; // Country codes

    if (country && blockedCountries.includes(country)) {
      router.replace('/unavailable');
    }
  });

  if (!userCountry()) {
    return <LoadingSpinner />;
  }

  return <div>{children}</div>;
}
```

## A/B Testing

Split traffic between variants:

```typescript
import { signal, effect } from '@philjs/core';

const variant = signal<'A' | 'B' | null>(null);

export default function ABTestLayout({ children }: { children: any }) {
  effect(() => {
    // Assign variant once
    if (!variant()) {
      const assigned = Math.random() < 0.5 ? 'A' : 'B';
      variant.set(assigned);

      // Track assignment
      analytics.track('ab_test_assigned', { variant: assigned });
    }
  });

  if (!variant()) return null;

  return (
    <div data-variant={variant()}>
      {children}
    </div>
  );
}
```

## Middleware Composition

Combine multiple middleware checks:

```typescript
// src/middleware/compose.ts
type MiddlewareFunction = (props: any) => any | null;

export function compose(...middlewares: MiddlewareFunction[]) {
  return function ComposedMiddleware({ children }: { children: any }) {
    let result = children;

    for (const middleware of middlewares) {
      result = middleware({ children: result });
      if (result === null) return null;
    }

    return result;
  };
}
```

Usage:

```typescript
// src/pages/(protected)/layout.tsx
import { compose } from '@/middleware/compose';
import { authMiddleware } from '@/middleware/auth';
import { roleMiddleware } from '@/middleware/role';
import { subscriptionMiddleware } from '@/middleware/subscription';

const ProtectedLayout = compose(
  authMiddleware,
  roleMiddleware(['admin', 'moderator']),
  subscriptionMiddleware
);

export default ProtectedLayout;
```

## Page-Level Middleware

Apply middleware to specific pages:

```typescript
// src/pages/admin/users.tsx
import { useRouter } from '@philjs/router';
import { useUser } from '@/hooks/useUser';

export default function AdminUsers() {
  const router = useRouter();
  const user = useUser();

  // Page-specific check
  if (!user()?.permissions.includes('manage:users')) {
    router.replace('/unauthorized');
    return null;
  }

  return (
    <div>
      <h1>User Management</h1>
      <UserList />
    </div>
  );
}
```

## Redirect Patterns

### Authenticated to Dashboard

```typescript
// src/pages/login.tsx
import { useRouter } from '@philjs/router';
import { useUser } from '@/hooks/useUser';
import { effect } from '@philjs/core';

export default function Login() {
  const router = useRouter();
  const user = useUser();

  // Redirect if already logged in
  effect(() => {
    if (user()) {
      router.replace('/dashboard');
    }
  });

  return <LoginForm />;
}
```

### Role-Based Landing

```typescript
import { useRouter } from '@philjs/router';
import { useUser } from '@/hooks/useUser';
import { effect } from '@philjs/core';

export default function Home() {
  const router = useRouter();
  const user = useUser();

  effect(() => {
    if (!user()) return;

    // Redirect based on role
    switch (user()!.role) {
      case 'admin':
        router.replace('/admin/dashboard');
        break;
      case 'moderator':
        router.replace('/moderator/queue');
        break;
      default:
        router.replace('/dashboard');
    }
  });

  return <LoadingSpinner />;
}
```

## Navigation Guards

Confirm before leaving:

```typescript
import { useRouter } from '@philjs/router';
import { signal, effect } from '@philjs/core';

export default function EditPost() {
  const router = useRouter();
  const hasUnsavedChanges = signal(false);

  effect(() => {
    const handleBeforeNavigate = (e: any) => {
      if (hasUnsavedChanges()) {
        const confirmed = confirm('You have unsaved changes. Leave anyway?');
        if (!confirmed) {
          e.preventDefault();
        }
      }
    };

    router.events.on('beforeNavigate', handleBeforeNavigate);

    return () => {
      router.events.off('beforeNavigate', handleBeforeNavigate);
    };
  });

  return <PostEditor onChange={() => hasUnsavedChanges.set(true)} />;
}
```

## Best Practices

### Use Layouts for Groups

```typescript
// ✅ Protect entire section
src/pages/
  (admin)/
    layout.tsx ← Auth check here
    users.tsx
    settings.tsx

// ❌ Duplicate checks in every page
src/pages/
  admin-users.tsx ← Auth check
  admin-settings.tsx ← Auth check (duplicate)
```

### Show Loading States

```typescript
// ✅ Show loading while checking auth
if (isLoading()) {
  return <LoadingSpinner />;
}

// ❌ Blank screen during check
if (!user()) {
  router.replace('/login');
  return null; // Flashes blank
}
```

### Redirect Early

```typescript
// ✅ Check and redirect in layout
export default function Layout({ children }) {
  if (!authorized()) {
    router.replace('/login');
    return null;
  }
  return children;
}

// ❌ Check in every component
export default function Page() {
  if (!authorized()) { /* ... */ }
  return <div>Content</div>;
}
```

### Use Effect for Side Effects

```typescript
// ✅ Redirect in effect
effect(() => {
  if (!user()) {
    router.replace('/login');
  }
});

// ❌ Redirect during render (can cause issues)
if (!user()) {
  router.replace('/login');
}
```

### Compose Middleware

```typescript
// ✅ Reusable middleware functions
const protected = compose(auth, subscription);

// ❌ Duplicate logic
function Layout1() { /* auth + subscription */ }
function Layout2() { /* auth + subscription */ }
```

## Complete Example

Multi-tier access control:

```typescript
// src/middleware/auth.tsx
import { useRouter } from '@philjs/router';
import { useAuth } from '@/hooks/useAuth';

export function RequireAuth({ children }: { children: any }) {
  const router = useRouter();
  const { user, isLoading } = useAuth();

  if (isLoading()) {
    return <LoadingSpinner />;
  }

  if (!user()) {
    router.replace('/login');
    return null;
  }

  return children;
}
```

```typescript
// src/middleware/role.tsx
import { useRouter } from '@philjs/router';
import { useUser } from '@/hooks/useUser';

interface RoleProps {
  children: any;
  roles: string[];
}

export function RequireRole({ children, roles }: RoleProps) {
  const router = useRouter();
  const user = useUser();

  if (!user()) return null;

  if (!roles.includes(user()!.role)) {
    router.replace('/unauthorized');
    return null;
  }

  return children;
}
```

```typescript
// src/middleware/subscription.tsx
import { useRouter } from '@philjs/router';
import { useSubscription } from '@/hooks/useSubscription';

export function RequireSubscription({ children }: { children: any }) {
  const router = useRouter();
  const subscription = useSubscription();

  if (!subscription()?.active) {
    router.replace('/upgrade');
    return null;
  }

  return children;
}
```

```typescript
// src/pages/(premium-admin)/layout.tsx
import { RequireAuth } from '@/middleware/auth';
import { RequireRole } from '@/middleware/role';
import { RequireSubscription } from '@/middleware/subscription';

export default function PremiumAdminLayout({ children }: { children: any }) {
  return (
    <RequireAuth>
      <RequireRole roles={['admin', 'superadmin']}>
        <RequireSubscription>
          <div className="premium-admin-layout">
            <AdminSidebar />
            {children}
          </div>
        </RequireSubscription>
      </RequireRole>
    </RequireAuth>
  );
}
```

## Summary

You've learned:

✅ Layout-based middleware
✅ Authentication checks
✅ Authorization and roles
✅ Permission-based access
✅ Subscription gating
✅ Feature flags
✅ Request logging
✅ Navigation guards
✅ Middleware composition
✅ Best practices

Middleware keeps your routes secure and organized!

---

**Next:** [Error Handling →](./error-handling.md) Handle route errors gracefully
