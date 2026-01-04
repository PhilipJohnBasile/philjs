# Route Guards

The `@philjs/router` package provides Vue Router-style navigation guards for route protection, analytics tracking, and navigation control.

## Overview

Route guards allow you to:
- Protect routes based on authentication state
- Redirect users to login pages
- Track page views for analytics
- Modify or cancel navigation
- Execute code before/after every navigation

## Global Guards

### beforeEach

Run code before every navigation:

```tsx
import { beforeEach } from '@philjs/router';

// Basic guard
const dispose = beforeEach((to, from, ctx) => {
  console.log(`Navigating from ${from?.path} to ${to.path}`);

  // Allow navigation
  return true;

  // Or block navigation
  return false;

  // Or redirect
  return { redirect: '/login' };
});

// Clean up when done
dispose();
```

### Guard Parameters

```tsx
type GuardToLocation = {
  path: string;
  fullPath: string;
  params: Record<string, string>;
  searchParams: URLSearchParams;
  hash: string;
  meta: Record<string, unknown>;
};

type GuardFromLocation = {
  path: string;
  fullPath: string;
  params: Record<string, string>;
  searchParams: URLSearchParams;
  hash: string;
  meta: Record<string, unknown>;
} | undefined; // undefined on initial load

type GuardContext = {
  routeId: string;
  matches: RouteMatch[];
};
```

### afterEach

Run code after every navigation completes:

```tsx
import { afterEach } from '@philjs/router';

// Analytics tracking
afterEach((to, from) => {
  analytics.track('pageview', {
    path: to.path,
    referrer: from?.path,
    params: to.params,
    timestamp: Date.now()
  });
});

// Log navigation timing
afterEach((to, from) => {
  console.log(`Navigation to ${to.path} completed`);
});
```

## Route-Level Guards

### beforeRoute

Apply guards to specific route patterns:

```tsx
import { beforeRoute } from '@philjs/router';

// Guard admin routes
beforeRoute('/admin/*', (to) => {
  if (!hasRole('admin')) {
    return { redirect: '/forbidden' };
  }
});

// Guard multiple patterns
beforeRoute(['/settings/*', '/profile/*'], (to) => {
  if (!isAuthenticated()) {
    return { redirect: `/login?next=${to.path}` };
  }
});

// Guard specific route
beforeRoute('/checkout', async (to) => {
  const cart = await getCart();
  if (cart.items.length === 0) {
    return { redirect: '/cart', error: 'Cart is empty' };
  }
});
```

## Built-in Guard Factories

### createAuthGuard

Create an authentication guard:

```tsx
import { beforeEach, createAuthGuard } from '@philjs/router';

beforeEach(createAuthGuard({
  // Check if user is authenticated
  isAuthenticated: () => !!authStore.user(),

  // Redirect destination
  loginPath: '/login',

  // Routes that don't require auth
  excludePaths: [
    '/login',
    '/register',
    '/forgot-password',
    '/public/*',
    '/api/*'
  ],

  // Include the original path in redirect
  includeRedirect: true // Results in /login?redirect=/protected-page
}));
```

### createTitleGuard

Update page title on navigation:

```tsx
import { beforeEach, createTitleGuard } from '@philjs/router';

beforeEach(createTitleGuard({
  // Template function for titles
  titleTemplate: (title) => `${title} | MyApp`,

  // Default title when route has none
  defaultTitle: 'MyApp',

  // Get title from route meta
  getTitleFromRoute: (route) => route.meta?.title
}));

// In route definition
const routes = [
  {
    path: '/dashboard',
    component: Dashboard,
    meta: { title: 'Dashboard' }
  },
  {
    path: '/settings',
    component: Settings,
    meta: { title: 'Settings' }
  }
];
```

### createScrollGuard

Control scroll behavior on navigation:

```tsx
import { afterEach, createScrollGuard } from '@philjs/router';

afterEach(createScrollGuard({
  // Scroll to top on navigation
  scrollToTop: true,

  // Behavior: 'auto' | 'smooth' | 'instant'
  behavior: 'smooth',

  // Restore scroll position on back/forward
  restoreScrollPosition: true,

  // Custom scroll logic
  getScrollPosition: (to, from) => {
    // Scroll to hash if present
    if (to.hash) {
      return { selector: to.hash };
    }
    // Otherwise scroll to top
    return { top: 0, left: 0 };
  }
}));
```

## Custom Guards

### Authentication Guard

```tsx
beforeEach(async (to, from) => {
  // Check if route requires auth
  if (to.meta?.requiresAuth) {
    const user = await getCurrentUser();

    if (!user) {
      // Store intended destination
      sessionStorage.setItem('authRedirect', to.fullPath);
      return { redirect: '/login' };
    }

    // Check specific permissions
    if (to.meta?.requiredPermissions) {
      const hasPermission = to.meta.requiredPermissions.every(
        (perm: string) => user.permissions.includes(perm)
      );

      if (!hasPermission) {
        return { redirect: '/unauthorized' };
      }
    }
  }

  return true;
});
```

### Role-Based Guard

```tsx
beforeEach((to, from) => {
  if (to.meta?.requiredRole) {
    const user = authStore.user();

    if (!user) {
      return { redirect: '/login' };
    }

    if (user.role !== to.meta.requiredRole) {
      return { redirect: '/forbidden' };
    }
  }

  return true;
});

// Route definition
const routes = [
  {
    path: '/admin',
    component: AdminPanel,
    meta: { requiredRole: 'admin' }
  },
  {
    path: '/manager',
    component: ManagerDashboard,
    meta: { requiredRole: 'manager' }
  }
];
```

### Confirmation Guard

Prevent accidental navigation away from unsaved changes:

```tsx
import { beforeEach } from '@philjs/router';
import { hasUnsavedChanges } from './store';

beforeEach((to, from) => {
  if (hasUnsavedChanges()) {
    const confirmed = window.confirm(
      'You have unsaved changes. Leave anyway?'
    );

    if (!confirmed) {
      return false; // Block navigation
    }
  }

  return true;
});
```

### Feature Flag Guard

```tsx
import { beforeEach } from '@philjs/router';
import { featureFlags } from './features';

beforeEach((to) => {
  // Check if route requires a feature flag
  const requiredFlag = to.meta?.featureFlag;

  if (requiredFlag && !featureFlags.isEnabled(requiredFlag)) {
    return { redirect: '/feature-not-available' };
  }

  return true;
});
```

### Maintenance Mode Guard

```tsx
import { beforeEach } from '@philjs/router';

beforeEach((to) => {
  const isMaintenanceMode = checkMaintenanceMode();

  if (isMaintenanceMode && to.path !== '/maintenance') {
    return { redirect: '/maintenance' };
  }

  if (!isMaintenanceMode && to.path === '/maintenance') {
    return { redirect: '/' };
  }

  return true;
});
```

## Guard Return Values

Guards can return different values:

```tsx
beforeEach((to, from) => {
  // Allow navigation
  return true;
  return undefined;
  return; // implicit undefined

  // Block navigation
  return false;

  // Redirect
  return { redirect: '/new-path' };

  // Redirect with query params
  return { redirect: `/login?next=${encodeURIComponent(to.fullPath)}` };

  // Throw error (triggers error boundary)
  throw new Error('Navigation blocked');
});
```

## Async Guards

Guards can be asynchronous:

```tsx
beforeEach(async (to, from) => {
  // Wait for authentication check
  const session = await checkSession();

  if (!session && to.meta?.requiresAuth) {
    return { redirect: '/login' };
  }

  // Prefetch data
  if (to.meta?.prefetch) {
    await prefetchRouteData(to.path);
  }

  return true;
});
```

## Guard Ordering

Guards run in registration order:

```tsx
// 1. Auth guard runs first
beforeEach(authGuard);

// 2. Permission guard runs second
beforeEach(permissionGuard);

// 3. Analytics guard runs third
beforeEach(analyticsGuard);

// If any guard returns false or redirect, subsequent guards don't run
```

## Analytics Integration

### Page View Tracking

```tsx
afterEach((to, from) => {
  // Google Analytics
  gtag('event', 'page_view', {
    page_path: to.path,
    page_title: document.title,
    page_referrer: from?.fullPath
  });

  // Custom analytics
  analytics.page({
    name: to.path,
    properties: {
      referrer: from?.path,
      params: to.params,
      search: to.searchParams.toString()
    }
  });
});
```

### Navigation Timing

```tsx
let navigationStart: number;

beforeEach(() => {
  navigationStart = performance.now();
  return true;
});

afterEach((to) => {
  const duration = performance.now() - navigationStart;

  analytics.timing({
    category: 'Navigation',
    variable: 'pageLoad',
    value: Math.round(duration),
    label: to.path
  });
});
```

## Complete Example

```tsx
import {
  beforeEach,
  afterEach,
  beforeRoute,
  createAuthGuard,
  createTitleGuard,
  createScrollGuard
} from '@philjs/router';

// 1. Authentication guard
beforeEach(createAuthGuard({
  isAuthenticated: () => !!authStore.user(),
  loginPath: '/login',
  excludePaths: ['/login', '/register', '/public/*']
}));

// 2. Role-based access for admin routes
beforeRoute('/admin/*', (to) => {
  const user = authStore.user();
  if (user?.role !== 'admin') {
    return { redirect: '/forbidden' };
  }
});

// 3. Feature flag guard
beforeEach((to) => {
  if (to.meta?.featureFlag) {
    if (!features.isEnabled(to.meta.featureFlag)) {
      return { redirect: '/feature-unavailable' };
    }
  }
  return true;
});

// 4. Page title updates
beforeEach(createTitleGuard({
  titleTemplate: (title) => `${title} - MyApp`,
  defaultTitle: 'MyApp'
}));

// 5. Analytics tracking
afterEach((to, from) => {
  analytics.page(to.path, {
    referrer: from?.path,
    title: document.title
  });
});

// 6. Scroll restoration
afterEach(createScrollGuard({
  scrollToTop: true,
  behavior: 'smooth',
  restoreScrollPosition: true
}));

// 7. Performance tracking
let navStart: number;
beforeEach(() => {
  navStart = performance.now();
  return true;
});

afterEach((to) => {
  const duration = performance.now() - navStart;
  console.log(`Navigation to ${to.path}: ${duration.toFixed(2)}ms`);
});
```

## API Reference

### Global Guards

| Function | Description |
|----------|-------------|
| `beforeEach(guard)` | Run guard before every navigation |
| `afterEach(guard)` | Run callback after every navigation |

### Route-Level Guards

| Function | Description |
|----------|-------------|
| `beforeRoute(pattern, guard)` | Guard specific route patterns |
| `beforeRoute(patterns[], guard)` | Guard multiple patterns |

### Guard Factories

| Function | Description |
|----------|-------------|
| `createAuthGuard(options)` | Create authentication guard |
| `createTitleGuard(options)` | Create page title guard |
| `createScrollGuard(options)` | Create scroll behavior guard |

### Return Values

| Value | Effect |
|-------|--------|
| `true` or `undefined` | Allow navigation |
| `false` | Block navigation |
| `{ redirect: string }` | Redirect to path |

## Next Steps

- [Data Loading](./data-loading.md) - Load data after guards pass
- [Error Handling](./error-handling.md) - Handle guard errors
- [Route Groups](./route-groups.md) - Group-level middleware
