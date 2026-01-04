# Parallel Routes

The `@philjs/router` package provides Next.js 14-style parallel routes for rendering multiple route branches simultaneously.

## Overview

Parallel routes enable:
- Multiple independent route slots (`@modal`, `@sidebar`, etc.)
- Dashboard layouts with multiple data panels
- Modal routes that preserve background content
- Split views with independent navigation
- Conditional slot rendering

## File Structure

Parallel routes use the `@` prefix for slot directories:

```
src/routes/
├── _layout.tsx           # Root layout with slots
├── page.tsx              # Main content
├── @modal/
│   ├── login.tsx         # /login renders in modal slot
│   └── signup.tsx        # /signup renders in modal slot
├── @sidebar/
│   ├── default.tsx       # Default sidebar content
│   └── cart.tsx          # /cart renders in sidebar slot
└── products/
    ├── page.tsx          # /products main content
    └── [id].tsx          # /products/:id
```

## Basic Usage

### Defining Slots

Create slot directories with the `@` prefix:

```tsx
// routes/@modal/login.tsx
export default function LoginModal() {
  return (
    <div class="modal-content">
      <h2>Login</h2>
      <form>
        <input name="email" type="email" />
        <input name="password" type="password" />
        <button type="submit">Login</button>
      </form>
    </div>
  );
}

// routes/@sidebar/cart.tsx
export default function CartSidebar() {
  return (
    <aside class="cart-sidebar">
      <h2>Your Cart</h2>
      <CartItems />
      <CartTotal />
    </aside>
  );
}
```

### Rendering Slots

Use `useSlots` or `useSlot` to access parallel routes:

```tsx
import { Outlet, useSlots, useSlot } from '@philjs/router';

// routes/_layout.tsx
export default function RootLayout() {
  const slots = useSlots();

  // Or individual slot access
  const modalSlot = useSlot('modal');
  const sidebarSlot = useSlot('sidebar');

  return (
    <div class="app">
      <Header />

      <div class="main-content">
        {/* Main route outlet */}
        <main>
          <Outlet />
        </main>

        {/* Sidebar slot */}
        {slots.sidebar && (
          <aside class="sidebar">
            {slots.sidebar}
          </aside>
        )}
      </div>

      {/* Modal slot */}
      {modalSlot && (
        <div class="modal-overlay">
          <div class="modal">
            {modalSlot}
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
```

## Slot Types

```tsx
type SlotDefinition = {
  /** Slot name (without @) */
  name: string;
  /** Default component when no route matches */
  default?: RouteComponent;
  /** Routes for this slot */
  routes: SlotRoute[];
  /** Loading component */
  loading?: RouteComponent;
  /** Error component */
  error?: RouteComponent;
};

type SlotRoute = {
  /** Path that triggers this slot route */
  path: string;
  /** Component to render */
  component: RouteComponent;
  /** Loader for data */
  loader?: LoaderFunction;
  /** Action for mutations */
  action?: ActionFunction;
};
```

## Matching Parallel Routes

### matchParallelRoutes

Match routes to their respective slots:

```tsx
import { matchParallelRoutes } from '@philjs/router';

const routes = defineRoutes([
  {
    path: '/',
    component: RootLayout,
    slots: {
      modal: [
        { path: '/login', component: LoginModal },
        { path: '/signup', component: SignupModal }
      ],
      sidebar: [
        { path: '/', component: DefaultSidebar, default: true },
        { path: '/cart', component: CartSidebar }
      ]
    }
  }
]);

const matches = matchParallelRoutes(routes, '/cart');
// {
//   main: { component: MainPage, params: {} },
//   sidebar: { component: CartSidebar, params: {} },
//   modal: null
// }
```

### renderParallelSlots

Render all matched slots:

```tsx
import { renderParallelSlots } from '@philjs/router';

const rendered = renderParallelSlots(matches);
// {
//   main: <MainPage />,
//   sidebar: <CartSidebar />,
//   modal: null
// }
```

## Navigation with Slots

### navigateWithInterception

Navigate to a slot without changing the main route:

```tsx
import { navigateWithInterception } from '@philjs/router';

function OpenLoginModal() {
  const handleClick = () => {
    navigateWithInterception('/login', {
      slot: 'modal',
      preserveMain: true
    });
  };

  return <button onClick={handleClick}>Login</button>;
}
```

### Slot-Specific Navigation

```tsx
import { navigateToSlot, clearSlot } from '@philjs/router';

// Navigate to specific slot
navigateToSlot('sidebar', '/cart');

// Clear a slot
clearSlot('modal');

// Navigate with multiple slots
navigateWithSlots({
  main: '/dashboard',
  sidebar: '/notifications',
  modal: null // Clear modal
});
```

## Slot Hooks

### useSlots

Get all slot contents:

```tsx
import { useSlots } from '@philjs/router';

function Layout() {
  const slots = useSlots();

  return (
    <div>
      <main>{slots.main}</main>
      {slots.sidebar && <aside>{slots.sidebar}</aside>}
      {slots.modal && <Modal>{slots.modal}</Modal>}
    </div>
  );
}
```

### useSlot

Get a specific slot:

```tsx
import { useSlot } from '@philjs/router';

function Layout() {
  const modalContent = useSlot('modal');

  return (
    <div>
      <Outlet />
      {modalContent && (
        <Modal onClose={() => clearSlot('modal')}>
          {modalContent}
        </Modal>
      )}
    </div>
  );
}
```

### useSlotParams

Get params from a slot route:

```tsx
import { useSlotParams } from '@philjs/router';

function ModalWrapper() {
  const params = useSlotParams('modal');
  // { id: '123' } for /photos/:id

  return <div>Viewing photo {params.id}</div>;
}
```

## Intercepted Navigation

Show content in a slot while preserving the background route.

### useInterception

Handle intercepted navigation:

```tsx
import { useInterception, useInterceptedNavigation } from '@philjs/router';

function PhotoGrid() {
  const { intercept } = useInterception();

  return (
    <div class="grid">
      {photos.map(photo => (
        <a
          href={`/photos/${photo.id}`}
          onClick={(e) => {
            e.preventDefault();
            intercept(`/photos/${photo.id}`, {
              slot: 'modal',
              state: { photoId: photo.id }
            });
          }}
        >
          <img src={photo.thumbnail} />
        </a>
      ))}
    </div>
  );
}

function PhotoModal() {
  const intercepted = useInterceptedNavigation();

  if (!intercepted) return null;

  return (
    <Modal onClose={() => intercepted.close()}>
      <PhotoDetail id={intercepted.state.photoId} />
    </Modal>
  );
}
```

### Interception State

```tsx
type InterceptionState = {
  /** Original URL being intercepted */
  originalUrl: string;
  /** Slot receiving the intercepted route */
  slot: string;
  /** Navigation state */
  state: Record<string, unknown>;
  /** Close the interception */
  close: () => void;
  /** Navigate to the actual route */
  proceed: () => void;
};
```

## Default Slots

Provide default content when no route matches:

```tsx
// routes/@sidebar/default.tsx
export default function DefaultSidebar() {
  return (
    <aside>
      <h3>Quick Links</h3>
      <nav>
        <Link href="/dashboard">Dashboard</Link>
        <Link href="/settings">Settings</Link>
      </nav>
    </aside>
  );
}
```

```tsx
// In route definition
const routes = [
  {
    path: '/',
    component: Layout,
    slots: {
      sidebar: {
        default: DefaultSidebar,
        routes: [
          { path: '/cart', component: CartSidebar },
          { path: '/notifications', component: NotificationsSidebar }
        ]
      }
    }
  }
];
```

## Loading States

Add loading states to slots:

```tsx
// routes/@modal/loading.tsx
export default function ModalLoading() {
  return (
    <div class="modal-loading">
      <Spinner />
      <p>Loading...</p>
    </div>
  );
}
```

```tsx
import { useSlotLoading } from '@philjs/router';

function Layout() {
  const modalLoading = useSlotLoading('modal');

  return (
    <div>
      <Outlet />
      {modalLoading && <ModalLoading />}
    </div>
  );
}
```

## Error Boundaries

Handle slot-specific errors:

```tsx
// routes/@modal/error.tsx
export default function ModalError({ error, reset }) {
  return (
    <div class="modal-error">
      <h2>Something went wrong</h2>
      <p>{error.message}</p>
      <button onClick={reset}>Try again</button>
    </div>
  );
}
```

```tsx
import { SlotErrorBoundary } from '@philjs/router';

function Layout() {
  const modal = useSlot('modal');

  return (
    <div>
      <Outlet />
      {modal && (
        <SlotErrorBoundary
          slot="modal"
          fallback={({ error, reset }) => (
            <ModalError error={error} reset={reset} />
          )}
        >
          {modal}
        </SlotErrorBoundary>
      )}
    </div>
  );
}
```

## Complete Example

```tsx
// routes/_layout.tsx
import {
  Outlet,
  useSlots,
  useSlot,
  clearSlot,
  SlotErrorBoundary
} from '@philjs/router';

export default function AppLayout() {
  const { sidebar, modal } = useSlots();

  return (
    <div class="app-layout">
      <Header />

      <div class="content-area">
        {/* Main content */}
        <main class="main-content">
          <Outlet />
        </main>

        {/* Sidebar slot */}
        {sidebar && (
          <aside class="sidebar">
            <SlotErrorBoundary slot="sidebar">
              {sidebar}
            </SlotErrorBoundary>
          </aside>
        )}
      </div>

      {/* Modal slot */}
      {modal && (
        <div
          class="modal-backdrop"
          onClick={() => clearSlot('modal')}
        >
          <div
            class="modal-container"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              class="modal-close"
              onClick={() => clearSlot('modal')}
            >
              Close
            </button>
            <SlotErrorBoundary slot="modal">
              {modal}
            </SlotErrorBoundary>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}

// routes/@modal/photo/[id].tsx
import { useLoaderData, closeSlot } from '@philjs/router';

export async function loader({ params }) {
  const photo = await fetchPhoto(params.id);
  return { photo };
}

export default function PhotoModal() {
  const { photo } = useLoaderData();

  return (
    <div class="photo-modal">
      <img src={photo.url} alt={photo.title} />
      <h2>{photo.title}</h2>
      <p>{photo.description}</p>
      <div class="actions">
        <button onClick={() => downloadPhoto(photo.id)}>
          Download
        </button>
        <Link href={`/photos/${photo.id}`}>
          View Full Page
        </Link>
      </div>
    </div>
  );
}

// routes/@sidebar/cart.tsx
import { useLoaderData, useFetcher } from '@philjs/router';

export async function loader() {
  const cart = await getCart();
  return { cart };
}

export default function CartSidebar() {
  const { cart } = useLoaderData();
  const fetcher = useFetcher();

  return (
    <div class="cart-sidebar">
      <h2>Shopping Cart ({cart.items.length})</h2>

      <ul class="cart-items">
        {cart.items.map(item => (
          <li key={item.id}>
            <span>{item.name}</span>
            <span>{item.quantity}x</span>
            <span>{item.price}</span>
            <fetcher.Form method="post" action="/api/cart/remove">
              <input type="hidden" name="itemId" value={item.id} />
              <button type="submit">Remove</button>
            </fetcher.Form>
          </li>
        ))}
      </ul>

      <div class="cart-total">
        Total: {cart.total}
      </div>

      <Link href="/checkout" class="checkout-button">
        Checkout
      </Link>
    </div>
  );
}

// Navigation component
function Navigation() {
  return (
    <nav>
      <Link href="/">Home</Link>
      <Link href="/products">Products</Link>

      {/* Opens in sidebar slot */}
      <button onClick={() => navigateToSlot('sidebar', '/cart')}>
        Cart
      </button>

      {/* Opens in modal slot */}
      <button onClick={() => navigateToSlot('modal', '/login')}>
        Login
      </button>
    </nav>
  );
}
```

## API Reference

### Slot Access

| Function/Hook | Description |
|---------------|-------------|
| `useSlots()` | Get all slot contents |
| `useSlot(name)` | Get specific slot content |
| `useSlotParams(name)` | Get slot route params |
| `useSlotLoading(name)` | Check if slot is loading |

### Navigation

| Function | Description |
|----------|-------------|
| `navigateToSlot(slot, path)` | Navigate to a slot |
| `clearSlot(slot)` | Clear slot content |
| `navigateWithSlots(slots)` | Navigate multiple slots |
| `navigateWithInterception(path, options)` | Intercept navigation |

### Matching

| Function | Description |
|----------|-------------|
| `matchParallelRoutes(routes, url)` | Match URL to slots |
| `renderParallelSlots(matches)` | Render matched slots |

### Interception

| Function/Hook | Description |
|---------------|-------------|
| `useInterception()` | Get interception controls |
| `useInterceptedNavigation()` | Access intercepted state |

### Components

| Component | Description |
|-----------|-------------|
| `SlotErrorBoundary` | Error boundary for slots |

## Next Steps

- [Route Masking](./route-masking.md) - Mask URLs for modal routes
- [View Transitions](./view-transitions.md) - Animate slot changes
- [Data Loading](./data-loading.md) - Load data for slots
