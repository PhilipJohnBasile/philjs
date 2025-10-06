# PhilJS Quick Reference Guide

**🚀 Get Started in 60 Seconds**

## Installation

```bash
pnpm create philjs my-app
cd my-app
pnpm install
pnpm dev
```

---

## Core Concepts

### Signals - Reactive State

```tsx
import { signal } from 'philjs-core';

const count = signal(0);

// Read
console.log(count()); // 0

// Write
count.set(5);

// Update function
count.set(c => c + 1);

// Subscribe (manual)
const unsub = count.subscribe(val => console.log(val));
unsub(); // Unsubscribe

// Peek (read without tracking)
count.peek(); // Reads without creating dependency
```

### Memos - Computed Values

```tsx
import { memo } from 'philjs-core';

const firstName = signal('John');
const lastName = signal('Doe');

const fullName = memo(() => `${firstName()} ${lastName()}`);

console.log(fullName()); // "John Doe"

firstName.set('Jane');
console.log(fullName()); // "Jane Doe" - automatically recomputed!
```

### Effects - Side Effects

```tsx
import { effect } from 'philjs-core';

const count = signal(0);

// Runs immediately and when count changes
const dispose = effect(() => {
  console.log('Count is:', count());

  // Optional cleanup
  return () => console.log('Cleaning up!');
});

// Stop the effect
dispose();
```

### Batching - Performance

```tsx
import { batch } from 'philjs-core';

const firstName = signal('John');
const lastName = signal('Doe');

// Only triggers one update
batch(() => {
  firstName.set('Jane');
  lastName.set('Smith');
});
```

### Untrack - Conditional Dependencies

```tsx
import { untrack } from 'philjs-core';

const a = signal(1);
const b = signal(2);

const sum = memo(() => {
  const aVal = a(); // Tracked
  const bVal = untrack(() => b()); // NOT tracked
  return aVal + bVal;
});

b.set(100); // Won't trigger sum to recompute!
a.set(5); // Will trigger sum to recompute
```

---

## Components

### Basic Component

```tsx
function Counter() {
  const count = signal(0);

  return (
    <div>
      <p>Count: {count()}</p>
      <button onClick={() => count.set(count() + 1)}>
        Increment
      </button>
    </div>
  );
}
```

### With Props

```tsx
interface ButtonProps {
  label: string;
  onClick: () => void;
  variant?: 'primary' | 'secondary';
}

function Button(props: ButtonProps) {
  return (
    <button
      onClick={props.onClick}
      className={`btn btn-${props.variant || 'primary'}`}
    >
      {props.label}
    </button>
  );
}

// Usage
<Button label="Click me" onClick={() => console.log('Clicked!')} />
```

### With Children

```tsx
function Card({ children }) {
  return (
    <div className="card">
      {children}
    </div>
  );
}

// Usage
<Card>
  <h2>Title</h2>
  <p>Content</p>
</Card>
```

---

## Forms

### Basic Form

```tsx
import { useForm, v } from 'philjs-core';

function LoginForm() {
  const form = useForm({
    schema: {
      email: v.email().required(),
      password: v.string().min(8).required(),
    },
    onSubmit: async (values) => {
      console.log('Logging in:', values);
    },
  });

  return (
    <form onSubmit={form.handleSubmit}>
      <input {...form.field('email')} placeholder="Email" />
      {form.errors.email && <span>{form.errors.email}</span>}

      <input {...form.field('password')} type="password" />
      {form.errors.password && <span>{form.errors.password}</span>}

      <button type="submit" disabled={form.isSubmitting()}>
        {form.isSubmitting() ? 'Logging in...' : 'Login'}
      </button>
    </form>
  );
}
```

### Validators

```tsx
import { v } from 'philjs-core';

// Built-in validators
v.string()
v.number()
v.boolean()
v.email()
v.url()
v.min(5)
v.max(100)
v.minLength(3)
v.maxLength(50)
v.pattern(/^[A-Z]/)
v.required()

// Custom validator
v.custom((value) => {
  if (value !== 'secret') {
    return 'Invalid value';
  }
  return null; // Valid
})

// Chaining
v.string().email().required()
```

---

## Routing

### File-Based Routes

```
src/routes/
  index.tsx              -> /
  about.tsx              -> /about
  products/
    index.tsx            -> /products
    [id].tsx             -> /products/:id
    [id]/reviews.tsx     -> /products/:id/reviews
```

### Route with Loader

```tsx
// src/routes/products/[id].tsx
export async function loader({ params }) {
  const product = await fetchProduct(params.id);
  return { product };
}

export default function ProductPage({ data }) {
  return (
    <div>
      <h1>{data.product.name}</h1>
      <p>${data.product.price}</p>
    </div>
  );
}

export const config = {
  preload: 'intent', // Smart preloading!
};
```

### Navigation

```tsx
import { Link, useNavigate } from 'philjs-router';

// Declarative
<Link href="/products">Products</Link>

// Programmatic
function MyComponent() {
  const navigate = useNavigate();

  const goToProduct = (id) => {
    navigate(`/products/${id}`);
  };

  return <button onClick={() => goToProduct(123)}>View Product</button>;
}
```

---

## Data Fetching

### Queries

```tsx
import { createQuery, invalidateQueries } from 'philjs-core';

function ProductList() {
  const products = createQuery({
    queryKey: ['products'],
    queryFn: () => fetch('/api/products').then(r => r.json()),
    staleTime: 5000, // Cache for 5 seconds
  });

  if (products.isLoading()) return <div>Loading...</div>;
  if (products.error()) return <div>Error!</div>;

  return (
    <ul>
      {products.data().map(p => (
        <li key={p.id}>{p.name}</li>
      ))}
    </ul>
  );
}
```

### Mutations

```tsx
import { createMutation } from 'philjs-core';

function AddProduct() {
  const addProduct = createMutation({
    mutationFn: (product) =>
      fetch('/api/products', {
        method: 'POST',
        body: JSON.stringify(product),
      }),
    onSuccess: () => {
      invalidateQueries(['products']); // Refetch products
    },
  });

  return (
    <button onClick={() => addProduct.mutate({ name: 'New Product' })}>
      Add Product
    </button>
  );
}
```

---

## Context

```tsx
import { createContext, useContext } from 'philjs-core';

// Create context
const ThemeContext = createContext({ theme: 'light' });

// Provider
function App() {
  return (
    <ThemeContext.Provider value={{ theme: 'dark' }}>
      <Page />
    </ThemeContext.Provider>
  );
}

// Consumer
function Page() {
  const { theme } = useContext(ThemeContext);
  return <div className={theme}>Content</div>;
}
```

---

## Server-Side Rendering

### Basic SSR

```tsx
import { renderToString } from 'philjs-core';

const html = await renderToString(() => <App />);
```

### Streaming SSR

```tsx
import { renderToStream } from 'philjs-core';

app.get('*', (req, res) => {
  const stream = renderToStream(() => <App url={req.url} />);
  stream.pipe(res);
});
```

### Resumability (Zero Hydration)

```tsx
import { serializeResumableState } from 'philjs-core';

const html = await renderToString(<App />, {
  resumable: true, // No hydration needed!
});
```

---

## Islands

```tsx
import { island } from 'philjs-islands';

// Static component (never hydrates)
function Header() {
  return <header><h1>My Site</h1></header>;
}

// Interactive island (hydrates on demand)
const Counter = island(function Counter() {
  const count = signal(0);

  return (
    <button onClick={() => count.set(count() + 1)}>
      Count: {count()}
    </button>
  );
}, {
  when: 'visible', // Only hydrate when visible
});
```

---

## Error Boundaries

```tsx
import { ErrorBoundary } from 'philjs-core';

function App() {
  return (
    <ErrorBoundary fallback={(error) => <div>Error: {error.message}</div>}>
      <MyComponent />
    </ErrorBoundary>
  );
}
```

---

## Internationalization

```tsx
import { I18nProvider, useTranslation } from 'philjs-core';

const translations = {
  en: { welcome: 'Welcome, {{name}}!' },
  es: { welcome: '¡Bienvenido, {{name}}!' },
};

function App() {
  return (
    <I18nProvider locale="en" translations={translations}>
      <Page />
    </I18nProvider>
  );
}

function Page() {
  const { t, setLocale } = useTranslation();

  return (
    <div>
      <h1>{t('welcome', { name: 'Alice' })}</h1>
      <button onClick={() => setLocale('es')}>Español</button>
    </div>
  );
}
```

---

## Performance Tips

### 1. Use Memos for Expensive Computations

```tsx
// ❌ Recomputes every render
const filtered = todos().filter(t => !t.done);

// ✅ Only recomputes when todos changes
const filtered = memo(() => todos().filter(t => !t.done));
```

### 2. Batch Updates

```tsx
// ❌ Three separate updates
firstName.set('Jane');
lastName.set('Smith');
age.set(30);

// ✅ One batched update
batch(() => {
  firstName.set('Jane');
  lastName.set('Smith');
  age.set(30);
});
```

### 3. Use Islands for Partial Hydration

```tsx
// ✅ Only interactive parts hydrate
<StaticHeader />
<InteractiveCounter /> // Only this hydrates
<StaticFooter />
```

### 4. Lazy Load Routes

```tsx
import { lazy } from 'philjs-core';

const ProductPage = lazy(() => import('./ProductPage'));
```

---

## Debugging

### Time-Travel Debugging

```tsx
import { TimeTravelDebugger } from 'philjs-devtools';

const debugger = new TimeTravelDebugger();

// Undo/redo state changes
debugger.undo();
debugger.redo();

// Jump to snapshot
debugger.jumpTo(snapshotId);

// Export session for bug reports
const session = debugger.exportSession();
```

### Console Logging

```tsx
effect(() => {
  console.log('Count changed:', count());
});
```

---

## Testing

```tsx
import { describe, it, expect } from 'vitest';
import { signal, memo, effect } from 'philjs-core';

describe('Counter', () => {
  it('increments count', () => {
    const count = signal(0);
    count.set(count() + 1);
    expect(count()).toBe(1);
  });

  it('computes doubled value', () => {
    const count = signal(2);
    const doubled = memo(() => count() * 2);
    expect(doubled()).toBe(4);
  });
});
```

---

## Common Patterns

### Loading State

```tsx
function UserProfile({ userId }) {
  const user = createQuery({
    queryKey: ['user', userId],
    queryFn: () => fetchUser(userId),
  });

  if (user.isLoading()) return <Spinner />;
  if (user.error()) return <Error error={user.error()} />;

  return <Profile user={user.data()} />;
}
```

### Optimistic Updates

```tsx
const updateTodo = createMutation({
  mutationFn: updateTodoApi,
  onMutate: (vars) => {
    // Optimistic update
    todos.set(todos().map(t =>
      t.id === vars.id ? { ...t, ...vars } : t
    ));
  },
  onError: () => {
    // Rollback on error
    invalidateQueries(['todos']);
  },
});
```

### Debounced Search

```tsx
const searchQuery = signal('');
const debouncedQuery = signal('');

effect(() => {
  const timer = setTimeout(() => {
    debouncedQuery.set(searchQuery());
  }, 300);

  return () => clearTimeout(timer);
});
```

---

## Resources

- **Documentation**: `/docs/README.md`
- **Examples**: `/examples/`
- **API Reference**: `/docs/api-reference/`
- **Troubleshooting**: `/docs/troubleshooting/faq.md`

---

**Need help?** Check the [full documentation](./docs/README.md) or [open an issue](https://github.com/philjs/philjs/issues)!
