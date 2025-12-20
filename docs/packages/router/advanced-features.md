# PhilJS Router - Advanced Features

This document provides an overview of the advanced routing features available in PhilJS Router.

## Table of Contents

1. [Router DevTools](#router-devtools)
2. [Route Groups](#route-groups)
3. [Route Masking](#route-masking)
4. [Router Context](#router-context)

---

## Router DevTools

TanStack Router-style developer tools for debugging and monitoring your routes.

### Features

- **Visual Route Tree Display**: See your entire route hierarchy at a glance
- **State Inspector**: Inspect params, search params, and loader data
- **Navigation History**: Track all navigations with timestamps and metrics
- **Performance Metrics**: Monitor load times per route
- **Route Matching Debugger**: Debug why routes match or don't match
- **Live Updates**: Real-time updates as you navigate

### Usage

```tsx
import { RouterDevTools } from 'philjs-router';

function App() {
  return (
    <>
      <RouterView />
      {/* Add DevTools - only shows in development */}
      <RouterDevTools />
    </>
  );
}
```

### Configuration

```tsx
import { initRouterDevTools } from 'philjs-router';

initRouterDevTools({
  position: 'bottom',        // 'bottom' | 'top' | 'left' | 'right'
  size: 400,                 // Height/width in pixels
  minimized: false,          // Start minimized
  maxHistoryEntries: 100,    // Max navigation history entries
  showPerformance: true,     // Enable performance tracking
  autoTrack: true,           // Auto-track navigations
  theme: 'dark',             // 'light' | 'dark' | 'system'
});
```

### Programmatic Access

```tsx
import {
  trackNavigation,
  completeNavigation,
  trackLoader,
  updateRouteTree,
  exportState,
} from 'philjs-router';

// Track navigation
trackNavigation('/users/123', { id: '123' }, searchParams);

// Track loader performance
trackLoader('users-route', 50); // 50ms

// Complete navigation with metrics
completeNavigation({
  total: 150,
  matching: 10,
  dataLoading: 100,
  rendering: 40,
});

// Export state for debugging
const state = exportState();
console.log(state);
```

---

## Route Groups

SolidStart-style route groups for organizing routes without affecting URLs.

### Features

- **URL-agnostic Organization**: Group routes without adding path segments
- **Shared Layouts**: Apply layouts to all routes in a group
- **Group-level Middleware**: Authentication, permissions, logging, rate limiting
- **Better Code Organization**: Keep related routes together

### Basic Usage

```
routes/
  (marketing)/
    about.tsx           -> /about
    contact.tsx         -> /contact
    layout.tsx          -> shared layout
  (dashboard)/
    settings.tsx        -> /settings
    profile.tsx         -> /profile
    layout.tsx          -> shared layout
```

### Creating Route Groups

```tsx
import { createRouteGroup, addRouteToGroup } from 'philjs-router';

const marketingGroup = createRouteGroup('marketing', {
  layout: MarketingLayout,
  meta: {
    displayName: 'Marketing Pages',
    description: 'Public marketing content',
  },
  routes: [
    { path: '/about', component: AboutPage },
    { path: '/contact', component: ContactPage },
  ],
});
```

### Middleware

```tsx
import {
  createAuthMiddleware,
  createPermissionMiddleware,
  createLoggingMiddleware,
  createRateLimitMiddleware,
} from 'philjs-router';

const adminGroup = createRouteGroup('admin', {
  middleware: [
    // Require authentication
    createAuthMiddleware(checkAuth, '/login'),

    // Require admin permission
    createPermissionMiddleware(
      ['admin'],
      getPermissions,
      '/unauthorized'
    ),

    // Log all accesses
    createLoggingMiddleware(),

    // Rate limit
    createRateLimitMiddleware({
      maxRequests: 100,
      windowMs: 60000, // 1 minute
    }),
  ],
});
```

### Processing Groups

```tsx
import { processRouteGroups } from 'philjs-router';

const groups = [marketingGroup, dashboardGroup, adminGroup];
const routes = processRouteGroups(groups);

// Routes now have group layouts and middleware applied
```

### File-based Discovery

```tsx
import { discoverRouteGroups } from 'philjs-router';

const files = import.meta.glob('./(*)/*.tsx', { eager: true });
const groups = discoverRouteGroups(files);
```

---

## Route Masking

Display a different URL in the browser than the actual route being rendered.

### Features

- **Modal Routes**: Show modals with clean URLs
- **Drawer Routes**: Side panels with URL preservation
- **Parallel Routes**: Multiple routes active simultaneously
- **Stack Management**: Nested modals/drawers
- **History Integration**: Works with browser back/forward

### Basic Usage

```tsx
import { navigateWithMask } from 'philjs-router';

// Navigate to photo detail but show /photos in URL
navigateWithMask('/photos/123', {
  maskAs: '/photos',
  state: { photoId: '123' },
});
```

### Modal Pattern

```tsx
import { navigateAsModal, closeOverlay } from 'philjs-router';

// Open modal
function openPhotoModal(id: string) {
  navigateAsModal(`/photos/${id}`, {
    backgroundRoute: '/gallery',
    state: { photoId: id },
  });
}

// Close modal
function closePhotoModal() {
  closeOverlay({ navigate: true });
}
```

### Drawer Pattern

```tsx
import { navigateAsDrawer } from 'philjs-router';

function openSettings() {
  navigateAsDrawer('/settings/detail', {
    backgroundRoute: '/app',
    side: 'right', // 'left' | 'right' | 'top' | 'bottom'
    state: { drawer: true },
  });
}
```

### Nested Masking

```tsx
import { pushMask, popMask } from 'philjs-router';

// Push masks onto stack
const mask1 = createRouteMask('/modal1', '/background');
const mask2 = createRouteMask('/modal2', '/modal1');

pushMask(mask1);
pushMask(mask2); // Modal on top of modal

// Pop to go back
popMask(); // Returns to modal1
popMask(); // Returns to background
```

### Hooks

```tsx
import {
  useRouteMask,
  useIsRouteMasked,
  useActualRoute,
  useMaskedUrl,
} from 'philjs-router';

function MyComponent() {
  const mask = useRouteMask();
  const isMasked = useIsRouteMasked();
  const actualRoute = useActualRoute();
  const maskedUrl = useMaskedUrl();

  if (isMasked) {
    return <Modal actualRoute={actualRoute} />;
  }

  return <NormalView />;
}
```

---

## Router Context

Global context available to all routes with type-safe injection.

### Features

- **Type-safe Context**: Full TypeScript support
- **Provider Pattern**: Async data providers with caching
- **Route Overrides**: Different context per route
- **Middleware**: Transform context before use
- **Validation**: Ensure context integrity

### Basic Usage

```tsx
import { initRouterContext, setGlobalContext } from 'philjs-router';

// Initialize with context
initRouterContext({
  initialContext: {
    user: currentUser,
    theme: 'dark',
    api: apiClient,
  },
});

// Access in loader
export async function loader({ context }) {
  const { user, api } = context;
  return api.fetchData(user.id);
}

// Access in component
function MyComponent() {
  const context = useRouterContext();
  return <div>Hello {context.user.name}</div>;
}
```

### Context Providers

```tsx
import {
  registerContextProvider,
  defineContextProvider,
  createUserContextProvider,
} from 'philjs-router';

// Define provider
const apiProvider = defineContextProvider(
  'api',
  async () => createApiClient(),
  { cache: true, scope: 'global' }
);

registerContextProvider(apiProvider);

// Built-in providers
registerContextProvider(
  createUserContextProvider(fetchCurrentUser)
);
```

### Route-specific Context

```tsx
import { registerRouteContextOverride } from 'philjs-router';

// Override context for specific routes
registerRouteContextOverride({
  route: '/admin/*',
  context: {
    isAdmin: true,
    permissions: ['read', 'write', 'delete'],
  },
  merge: true, // Merge with global context
});
```

### Context Middleware

```tsx
import {
  addContextMiddleware,
  defineContextMiddleware,
} from 'philjs-router';

const loggingMiddleware = defineContextMiddleware((ctx, { route }) => {
  console.log(`Route ${route} accessing context:`, Object.keys(ctx));
  return ctx;
});

addContextMiddleware(loggingMiddleware);
```

### Typed Context

```tsx
import { createTypedContext } from 'philjs-router';

type AppContext = {
  user: User;
  theme: 'light' | 'dark';
  api: ApiClient;
};

const typedContext = createTypedContext<AppContext>();

// Fully typed
const context = typedContext.useContext();
const user = typedContext.useValue('user'); // Type: User
```

### Validation

```tsx
import { initRouterContext } from 'philjs-router';

initRouterContext({
  validators: {
    user: {
      validate: (value) => value && typeof value === 'object',
      errorMessage: 'User must be an object',
    },
    theme: {
      validate: (value) => ['light', 'dark'].includes(value),
      errorMessage: 'Theme must be light or dark',
    },
  },
});
```

### Built-in Helpers

```tsx
import {
  createUserContextProvider,
  createThemeContextProvider,
  createLocaleContextProvider,
  createApiContextProvider,
} from 'philjs-router';

// User context
registerContextProvider(
  createUserContextProvider(async () => {
    return await fetchUser();
  })
);

// Theme context
registerContextProvider(
  createThemeContextProvider(() => 'dark')
);

// Locale context
registerContextProvider(
  createLocaleContextProvider(() => 'en-US')
);

// API client context
registerContextProvider(
  createApiContextProvider(() => new ApiClient())
);
```

---

## Complete Example

Here's a complete example using all features:

```tsx
import {
  createAppRouter,
  RouterView,
  RouterDevTools,
  initRouterContext,
  createUserContextProvider,
  createRouteGroup,
  processRouteGroups,
  createAuthMiddleware,
  navigateAsModal,
  closeOverlay,
} from 'philjs-router';

// Set up context
initRouterContext({
  initialContext: {
    appName: 'MyApp',
    theme: 'dark',
  },
  providers: [
    createUserContextProvider(fetchUser),
  ],
});

// Create route groups
const publicGroup = createRouteGroup('public', {
  routes: [
    { path: '/', component: HomePage },
    { path: '/about', component: AboutPage },
  ],
});

const dashboardGroup = createRouteGroup('dashboard', {
  layout: DashboardLayout,
  middleware: [
    createAuthMiddleware(checkAuth, '/login'),
  ],
  routes: [
    { path: '/dashboard', component: DashboardPage },
    { path: '/settings', component: SettingsPage },
  ],
});

// Process groups
const routes = processRouteGroups([publicGroup, dashboardGroup]);

// Create router
const router = createAppRouter({
  routes,
  prefetch: true,
  transitions: true,
});

// App component
function App() {
  return (
    <>
      <RouterView />
      <RouterDevTools />
    </>
  );
}

// Modal example
function PhotoGrid() {
  const handlePhotoClick = (id: string) => {
    navigateAsModal(`/photos/${id}`, {
      backgroundRoute: '/gallery',
      state: { photoId: id },
    });
  };

  return (
    <div>
      {photos.map(photo => (
        <img onClick={() => handlePhotoClick(photo.id)} />
      ))}
    </div>
  );
}

function PhotoModal() {
  const mask = useRouteMask();

  if (!mask?.state?.photoId) return null;

  return (
    <Modal onClose={() => closeOverlay()}>
      <PhotoDetail id={mask.state.photoId} />
    </Modal>
  );
}
```

---

## API Reference

For detailed API documentation, see the TypeScript definitions in each module:

- `devtools.ts` - Router DevTools
- `route-groups.ts` - Route Groups
- `route-masking.ts` - Route Masking
- `router-context.ts` - Router Context

All exports are available from the main package:

```tsx
import {
  // DevTools
  RouterDevTools,
  initRouterDevTools,

  // Route Groups
  createRouteGroup,
  processRouteGroups,

  // Route Masking
  navigateAsModal,
  navigateAsDrawer,

  // Router Context
  useRouterContext,
  initRouterContext,
} from 'philjs-router';
```

---

## Testing

All features include comprehensive test suites:

- `devtools.test.ts` - DevTools tests
- `route-groups.test.ts` - Route Groups tests
- `route-masking.test.ts` - Route Masking tests
- `router-context.test.ts` - Router Context tests

Run tests with:

```bash
npm test
```

---

## Performance Considerations

### DevTools

- DevTools are lightweight and only track when enabled
- Set `autoTrack: false` to manually control tracking
- Clear history periodically with `clearHistory()`

### Route Groups

- Groups are processed once during initialization
- Middleware runs on every navigation - keep them fast
- Use caching in providers when possible

### Route Masking

- Mask stack is limited by `maxStackDepth`
- History is automatically trimmed to `maxHistorySize`
- Old masks are not restored if past `maxAge`

### Router Context

- Providers with `cache: true` only run once
- Context middleware runs on every route change
- Clear cache with `clearContextCache()` when needed

---

## Browser Support

All features work in modern browsers with:

- ES2020+ support
- URL API
- History API
- Signal/reactive primitives

For older browsers, use appropriate polyfills.

---

## License

MIT
