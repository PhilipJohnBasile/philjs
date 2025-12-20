# Parallel Routes Examples

This directory contains comprehensive examples demonstrating Next.js 14 style Parallel Routes in PhilJS.

## Overview

Parallel Routes enable rendering multiple pages in the same layout simultaneously. Each route can have its own:
- Independent loading states
- Error boundaries
- Data loaders
- Suspense boundaries

## Features Demonstrated

### 1. Slot Syntax (@slot)
- `@modal` - Modal overlays
- `@sidebar` - Navigation sidebars
- `@main` - Main content area
- `@analytics` - Analytics widgets
- `@folders`, `@list`, `@preview` - Multi-pane layouts

### 2. Route Interception
- `(.)` - Same level interception
- `(..)` - One level up interception
- `(..)(..)` - Two levels up interception
- `(...)` - Root level interception

### 3. Navigation Modes
- **Soft Navigation** - Client-only, preserves state (for modals)
- **Hard Navigation** - Full page reload (for deep links)

### 4. Parallel Data Loading
- All slots load data simultaneously
- No waterfalls
- Independent error handling per slot
- Streaming support

## Examples

### 1. Photo Gallery with Modal (`modal-example.tsx`)

A photo gallery that uses parallel routes for modal interception.

**File Structure:**
```
app/
  layout.tsx                    - Root layout with modal slot
  page.tsx                      - Gallery grid
  @modal/
    (.)photos/[id]/page.tsx    - Intercepted modal view
  photos/
    [id]/page.tsx              - Full page view
```

**Features:**
- Click photo → Opens in modal (soft navigation)
- Refresh page → Opens full page view (hard navigation)
- Close modal → Returns to gallery
- Share URL → Direct to full page

**Usage:**
```typescript
import { renderPhotoGallery } from './modal-example';

const container = document.getElementById('app')!;
await renderPhotoGallery(container);
```

**Key Concepts:**
- Route interception with `(.)`
- Soft vs hard navigation
- State preservation
- URL synchronization

---

### 2. Dashboard with Multiple Slots (`dashboard-example.tsx`)

A dashboard with independent slots for sidebar, main content, and analytics.

**File Structure:**
```
app/
  dashboard/
    layout.tsx                  - Dashboard layout with all slots
    @sidebar/page.tsx           - Sidebar navigation
    @main/page.tsx              - Main content area
    @analytics/page.tsx         - Analytics widget
    @main/users/page.tsx        - Users list
    @main/settings/page.tsx     - Settings page
```

**Features:**
- Sidebar loads instantly
- Analytics widget loads in parallel
- Main content loads independently
- Each slot has its own loading state
- Progressive rendering as data arrives

**Usage:**
```typescript
import { renderDashboard, renderDashboardStreaming } from './dashboard-example';

const container = document.getElementById('app')!;

// Standard rendering
await renderDashboard(container);

// Or with streaming (progressive rendering)
await renderDashboardStreaming(container);
```

**Key Concepts:**
- Multiple parallel slots
- Independent loading states
- Streaming support
- Progressive rendering
- Suspense boundaries per slot

---

### 3. Email Client with Multi-Pane Layout (`multi-pane-example.tsx`)

A complex email client with folder tree, email list, preview, and compose modal.

**File Structure:**
```
app/
  mail/
    layout.tsx                    - Email client layout
    @folders/page.tsx             - Folder tree
    @list/[folder]/page.tsx       - Email list for folder
    @preview/[id]/page.tsx        - Email preview
    @compose/(.)compose/page.tsx  - Compose modal (intercepted)
```

**Features:**
- Three-pane layout (folders, list, preview)
- Compose modal overlays everything
- Each pane loads independently
- Conditional slot rendering
- Complex state management

**Usage:**
```typescript
import { renderEmailClient } from './multi-pane-example';

const container = document.getElementById('app')!;
await renderEmailClient(container);
```

**Key Concepts:**
- Multi-pane layouts
- Conditional slot rendering
- Optional slots
- Complex routing
- Modal interception for compose

## Configuration

### Basic Parallel Route Config

```typescript
import { createParallelRouteConfig } from 'philjs-router';

const config = createParallelRouteConfig({
  basePath: '/app',
  mainSlot: '@main', // Default: 'children'
  softNavigation: true, // Enable soft navigation
  slots: [
    // Sidebar slot
    {
      name: '@sidebar',
      path: '/',
      loader: async () => ({ data: 'sidebar' }),
      component: Sidebar,
    },
    // Main content slot
    {
      name: '@main',
      path: '/dashboard',
      loader: async () => ({ data: 'dashboard' }),
      component: Dashboard,
    },
    // Optional modal slot with interception
    {
      name: '@modal',
      path: '(.)photos/:id',
      loader: async ({ params }) => getPhoto(params.id),
      component: PhotoModal,
      optional: true,
    },
  ],
});
```

### Route Interception Patterns

```typescript
// Same level: app/@modal/(.)photos/[id]
// Matches: /app/photos/123
{
  name: '@modal',
  path: '(.)photos/:id',
  component: PhotoModal,
}

// One level up: app/@modal/(..)photos/[id]
// Matches: /photos/123 (when in /app)
{
  name: '@modal',
  path: '(..)photos/:id',
  component: PhotoModal,
}

// Two levels up: app/@modal/(..)(..)photos/[id]
// Matches: /photos/123 (when in /app/nested)
{
  name: '@modal',
  path: '(..)(..)photos/:id',
  component: PhotoModal,
}

// From root: app/@modal/(...)photos/[id]
// Matches: /photos/123 (from anywhere)
{
  name: '@modal',
  path: '(...)photos/:id',
  component: PhotoModal,
}
```

## API Reference

### Hooks

#### `useSlot()`
Access current slot data.

```typescript
function MySlot() {
  const { slotName, data, error, loading } = useSlot();
  return <div>Slot: {slotName}</div>;
}
```

#### `useSlotByName(name)`
Access specific slot by name.

```typescript
function Layout() {
  const modalSlot = useSlotByName('@modal');
  return modalSlot ? <Modal data={modalSlot.data} /> : null;
}
```

#### `useSlots()`
Access all current slots.

```typescript
function Layout() {
  const slots = useSlots();
  return (
    <div>
      {Array.from(slots.entries()).map(([name, slot]) => (
        <div key={name}>{slot.data}</div>
      ))}
    </div>
  );
}
```

#### `useInterception()`
Access interception state.

```typescript
function Modal() {
  const { intercepted, originalUrl, mode } = useInterception();
  return intercepted ? <div>Intercepted!</div> : null;
}
```

#### `useInterceptedNavigation()`
Navigate with interception support.

```typescript
function PhotoLink({ id }) {
  const { navigate, close, isIntercepted } = useInterceptedNavigation();

  return (
    <button onClick={() => navigate(`/photos/${id}`, 'soft')}>
      Open Photo
    </button>
  );
}
```

### Functions

#### `matchParallelRoutes(pathname, config)`
Match pathname against parallel route config.

```typescript
const matches = matchParallelRoutes('/dashboard/users', config);
if (matches) {
  // matches is Map<SlotName, MatchedSlot>
}
```

#### `loadParallelSlots(slots, request)`
Load data for all slots in parallel.

```typescript
const request = new Request(window.location.href);
const loadedSlots = await loadParallelSlots(matches, request);
```

#### `renderParallelSlots(slots, searchParams)`
Render all slots.

```typescript
const searchParams = new URLSearchParams(window.location.search);
const rendered = renderParallelSlots(loadedSlots, searchParams);
// rendered: { children: VNode, '@modal': VNode, ... }
```

#### `parseInterception(path)`
Parse interception config from path.

```typescript
const config = parseInterception('(.)photos/:id');
// { type: '(.)', target: 'photos/:id' }
```

## Performance Benefits

### No Waterfalls
Traditional nested routes load sequentially:
```
Parent loader (500ms) → Child loader (300ms) → Grandchild loader (200ms)
Total: 1000ms
```

Parallel routes load simultaneously:
```
All loaders in parallel → Max(500ms, 300ms, 200ms)
Total: 500ms
```

### Streaming Support
Slots render as data arrives:
```typescript
// Sidebar loads instantly (100ms)
// Main content loads later (500ms)
// Analytics loads in between (300ms)

Timeline:
0ms    → Render loading states
100ms  → Sidebar renders
300ms  → Analytics renders
500ms  → Main content renders
```

## Best Practices

### 1. Use Optional Slots for Modals
```typescript
{
  name: '@modal',
  path: '(.)photos/:id',
  optional: true, // Only renders when intercepted
}
```

### 2. Provide Loading States
```typescript
{
  name: '@main',
  path: '/users',
  loader: fetchUsers,
  component: UsersList,
  loadingComponent: UsersLoading, // Shows while loading
}
```

### 3. Handle Errors Per Slot
```typescript
{
  name: '@analytics',
  path: '/',
  loader: fetchAnalytics,
  component: Analytics,
  errorBoundary: AnalyticsError, // Isolate errors
}
```

### 4. Use Soft Navigation for Modals
```typescript
// Preserve page state
await navigateWithInterception('/photos/123', config, 'soft');

// Close modal
closeInterception();
```

### 5. Combine Params from All Slots
```typescript
// URL: /users/123/posts/456
// Slots can access both userId and postId
const config = {
  slots: [
    { name: '@user', path: '/users/:userId' },
    { name: '@posts', path: '/users/:userId/posts/:postId' },
  ],
};
```

## TypeScript Support

Full TypeScript support with type inference:

```typescript
import type {
  ParallelRouteConfig,
  SlotDefinition,
  SlotComponentProps,
  MatchedSlot,
  InterceptConfig,
} from 'philjs-router';

// Typed slot component
const MySlot: SlotComponent<SlotComponentProps> = ({ data, params }) => {
  // data is typed based on loader return type
  return <div>{data.message}</div>;
};

// Typed config
const config: ParallelRouteConfig = {
  slots: [
    {
      name: '@main',
      path: '/',
      component: MySlot,
    },
  ],
};
```

## Migration from Traditional Routing

### Before (Traditional Nested Routes)
```typescript
// routes/dashboard.tsx
export default function Dashboard() {
  const sidebarData = useSidebarData(); // Waterfall!
  const mainData = useMainData(); // Waterfall!

  return (
    <div>
      <Sidebar data={sidebarData} />
      <Main data={mainData} />
    </div>
  );
}
```

### After (Parallel Routes)
```typescript
// app/dashboard/layout.tsx
export default function DashboardLayout({ sidebar, main }) {
  return (
    <div>
      {sidebar}
      {main}
    </div>
  );
}

// app/dashboard/@sidebar/page.tsx
export async function loader() {
  return await fetchSidebar(); // Loads in parallel!
}

// app/dashboard/@main/page.tsx
export async function loader() {
  return await fetchMain(); // Loads in parallel!
}
```

## Further Reading

- [Next.js Parallel Routes](https://nextjs.org/docs/app/building-your-application/routing/parallel-routes)
- [Next.js Route Interception](https://nextjs.org/docs/app/building-your-application/routing/intercepting-routes)
- PhilJS Router Documentation
- Streaming and Suspense Guide
