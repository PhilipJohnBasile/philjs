# PhilJS API Reference

Complete API documentation for PhilJS - The framework that thinks ahead.

## Table of Contents

- [philjs-core](#philjs-core)
  - [Signals](#signals)
  - [Components](#components)
  - [Forms](#forms)
  - [Data Fetching](#data-fetching)
  - [Context](#context)
- [philjs-router](#philjs-router)
- [philjs-ssr](#philjs-ssr)
- [philjs-devtools](#philjs-devtools)

---

## philjs-core

### Signals

#### `signal<T>(initialValue: T): Signal<T>`

Creates a reactive signal.

```typescript
import { signal } from "philjs-core";

const count = signal(0);

// Read value
console.log(count()); // 0

// Set value
count.set(5);

// Update with function
count.set(prev => prev + 1);

// Subscribe to changes
const unsubscribe = count.subscribe(value => {
  console.log("Changed to:", value);
});
```

**Type:**
```typescript
type Signal<T> = {
  (): T;
  set(value: T | ((prev: T) => T)): void;
  subscribe(fn: (value: T) => void): () => void;
};
```

#### `memo<T>(fn: () => T): Memo<T>`

Creates a derived signal that automatically updates when dependencies change.

```typescript
import { signal, memo } from "philjs-core";

const count = signal(5);
const doubled = memo(() => count() * 2);

console.log(doubled()); // 10
count.set(10);
console.log(doubled()); // 20
```

#### `resource<T>(fetcher: () => Promise<T>): Resource<T>`

Creates an async resource with loading/error states.

```typescript
import { resource } from "philjs-core";

const data = resource(async () => {
  const res = await fetch("/api/data");
  return res.json();
});

console.log(data.loading()); // true
console.log(data.data());    // undefined initially, then data
console.log(data.error());   // Error if fetch fails
```

### Components

#### `render(component, container)`

Renders a component into a DOM container.

```typescript
import { render } from "philjs-core";

render(<App />, document.getElementById("root")!);
```

#### `jsx(type, props, ...children)`

JSX factory function (usually automatic).

```typescript
// Automatic with tsconfig.json:
// "jsx": "react-jsx",
// "jsxImportSource": "philjs-core"

<div className="container">
  <h1>Title</h1>
  <p>Text</p>
</div>
```

### Forms

#### `useForm<T>(options): FormApi<T>`

Creates a form with validation.

```typescript
import { useForm, validators as v } from "philjs-core";

const form = useForm({
  schema: {
    email: v.string().email().required(),
    age: v.number().min(18),
  },
  initialValues: {
    email: "",
    age: 0,
  },
  validateOnChange: true,
  onSubmit: async (values) => {
    await saveData(values);
  },
});

// API
form.values();          // { email: "", age: 0 }
form.errors();          // { email: ["Required"] }
form.touched();         // { email: true }
form.dirty();           // { email: true }
form.isValid();         // false

form.setValue("email", "test@example.com");
form.setTouched("email", true);
form.clearError("email");
form.handleSubmit();    // Validates and calls onSubmit
form.reset();           // Reset to initial values
```

#### Validators

```typescript
import { validators as v } from "philjs-core";

// String
v.string()
  .required("Required")
  .email("Invalid email")
  .url("Invalid URL")
  .min(5, "Too short")
  .max(100, "Too long")
  .pattern(/^[A-Z]/, "Must start with uppercase")

// Number
v.number()
  .required()
  .min(0, "Must be positive")
  .max(100, "Too large")

// Boolean
v.boolean()
  .required("Must accept")

// Date
v.date()
  .required()

// Custom
v.custom({
  validate: (value) => value.length > 5,
  message: "Must be longer than 5 characters",
})
```

### Data Fetching

#### `createQuery<T>(key, fetcher, options): QueryResult<T>`

Creates a cached query.

```typescript
import { createQuery, invalidateQueries } from "philjs-core";

const products = createQuery(
  "products",
  async () => {
    const res = await fetch("/api/products");
    return res.json();
  },
  {
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
  }
);

products.loading();  // boolean
products.error();    // Error | null
products.data();     // T | undefined
products.refetch();  // Refetch data

// Invalidate cache
invalidateQueries("products");
```

#### `createMutation<T, V>(mutationFn, options): MutationResult<T, V>`

Creates a mutation.

```typescript
import { createMutation } from "philjs-core";

const addProduct = createMutation(
  async (product) => {
    const res = await fetch("/api/products", {
      method: "POST",
      body: JSON.stringify(product),
    });
    return res.json();
  },
  {
    onSuccess: (data) => {
      invalidateQueries("products");
    },
    onError: (error) => {
      console.error(error);
    },
  }
);

await addProduct.mutate({ name: "New Product" });
```

### Context

#### `createContext<T>(): Context<T>`

Creates a context.

```typescript
import { createContext, useContext } from "philjs-core";

const ThemeContext = createContext<Signal<"light" | "dark">>();

export function ThemeProvider({ children }) {
  const theme = signal<"light" | "dark">("light");

  return (
    <ThemeContext.Provider value={theme}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
```

---

## philjs-router

### Routing

#### File-Based Routes

```
src/routes/
  index.tsx           → /
  about.tsx           → /about
  products/
    index.tsx         → /products
    [id].tsx          → /products/:id
  blog/
    [...slug].tsx     → /blog/* (catch-all)
```

#### `navigate(path, params?)`

Programmatic navigation.

```typescript
import { navigate } from "philjs-router";

navigate("/products/123");
navigate("/products/:id", { id: "123" });
```

#### `useParams(): Record<string, string>`

Access route parameters.

```typescript
// In routes/products/[id].tsx
import { useParams } from "philjs-router";

export default function Product() {
  const { id } = useParams(); // "123"
  return <div>Product {id}</div>;
}
```

### Smart Preloading

#### `initSmartPreloader(options): SmartPreloader`

Initialize smart preloading.

```typescript
import { initSmartPreloader } from "philjs-router";

const preloader = initSmartPreloader({
  strategy: "intent", // "eager" | "hover" | "visible" | "intent" | "manual"
  intentThreshold: 0.6, // 0-1 confidence threshold
  maxConcurrent: 3,
  hoverDelay: 50, // ms
});

// Get stats
preloader.getStats();
// { loaded: 5, loading: 2, queued: 3 }
```

#### `preloadLink(element, options)`

Apply preloading to a link.

```typescript
import { preloadLink } from "philjs-router";

const cleanup = preloadLink(linkElement, {
  strategy: "hover",
  priority: "high",
});
```

### View Transitions

#### `navigateWithTransition(url, options)`

Navigate with transition.

```typescript
import { navigateWithTransition } from "philjs-router";

await navigateWithTransition("/about", {
  type: "slide-left", // "slide-left" | "slide-right" | "fade" | "scale"
  duration: 300,
});
```

#### `markSharedElement(element, options)`

Mark element for shared transition.

```typescript
import { markSharedElement } from "philjs-router";

const cleanup = markSharedElement(imageElement, {
  name: "hero-image",
  duration: 500,
  easing: "cubic-bezier(0.4, 0, 0.2, 1)",
});
```

---

## philjs-ssr

### Rendering Modes

#### `ssg(options): RouteConfig`

Static site generation.

```typescript
import { ssg } from "philjs-ssr";

export const config = ssg({
  getStaticPaths: async () => {
    const posts = await fetchPosts();
    return posts.map(p => `/posts/${p.slug}`);
  },
});
```

#### `isr(revalidate, options): RouteConfig`

Incremental static regeneration.

```typescript
import { isr } from "philjs-ssr";

export const config = isr(60, { // Revalidate every 60 seconds
  fallback: "blocking", // "blocking" | "static" | false
  getStaticPaths: async () => ["/products/1", "/products/2"],
});
```

#### `ssr(): RouteConfig`

Server-side rendering.

```typescript
import { ssr } from "philjs-ssr";

export const config = ssr();
```

### Rate Limiting

#### `rateLimit(config)`

Create rate limiter.

```typescript
import { rateLimit } from "philjs-ssr";

const limiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 100,
  keyGenerator: (req) => req.headers.get("x-forwarded-for") || "unknown",
});
```

#### `apiRateLimit(requestsPerMinute, store?)`

API rate limiting.

```typescript
import { apiRateLimit } from "philjs-ssr";

const limiter = apiRateLimit(100); // 100 req/min
```

#### `authRateLimit(attemptsPerMinute, store?)`

Auth rate limiting (only counts failures).

```typescript
import { authRateLimit } from "philjs-ssr";

const limiter = authRateLimit(5); // 5 attempts/min
```

---

## philjs-devtools

### Time-Travel Debugging

#### `initTimeTravel<T>(config): TimeTravelDebugger<T>`

Initialize time-travel debugger.

```typescript
import { initTimeTravel } from "philjs-devtools";

const ttd = initTimeTravel({
  maxSnapshots: 100,
  captureInterval: 100, // Min ms between snapshots
  enableBranching: true,
});

// Capture state
ttd.capture(appState, "user_action", { userId: 123 });

// Navigate
ttd.undo();
ttd.redo();
ttd.jumpTo(snapshotId);

// Get diff
const diff = ttd.getDiff(snapshot1Id, snapshot2Id);

// Export/import
const session = ttd.exportSession();
ttd.importSession(sessionJSON);
```

#### `debugSignal<T>(signal, name, debugger?): Signal<T>`

Auto-track signal changes.

```typescript
import { debugSignal } from "philjs-devtools";

const count = signal(0);
const trackedCount = debugSignal(count, "count");

trackedCount.set(5); // Automatically captured in time-travel debugger
```

---

## Type Definitions

### Core Types

```typescript
type Signal<T> = {
  (): T;
  set(value: T | ((prev: T) => T)): void;
  subscribe(fn: (value: T) => void): () => void;
};

type Memo<T> = {
  (): T;
};

type Resource<T> = {
  (): T | undefined;
  loading(): boolean;
  error(): Error | null;
  refetch(): void;
};

type FormApi<T> = {
  values(): T;
  errors(): Record<keyof T, string[]>;
  touched(): Record<keyof T, boolean>;
  dirty(): Record<keyof T, boolean>;
  isValid(): boolean;
  setValue<K extends keyof T>(field: K, value: T[K]): void;
  setTouched(field: keyof T, touched: boolean): void;
  clearError(field: keyof T): void;
  setError(field: keyof T, message: string): void;
  handleSubmit(): Promise<void>;
  reset(): void;
};
```

### Router Types

```typescript
type PreloadStrategy = "hover" | "visible" | "intent" | "eager" | "manual";

type TransitionType =
  | "slide-left"
  | "slide-right"
  | "slide-up"
  | "slide-down"
  | "fade"
  | "scale"
  | "custom";

type RenderMode = "ssr" | "ssg" | "isr" | "csr";
```

---

## Configuration

### philjs.config.ts

```typescript
export default {
  // Performance budgets
  performanceBudgets: {
    maxBundleSize: 200 * 1024, // 200KB
    maxLCP: 2.5,
    maxCLS: 0.1,
    maxFID: 100,
  },

  // Smart preloading
  preloading: {
    strategy: "intent",
    intentThreshold: 0.6,
    maxConcurrent: 3,
  },

  // Cost tracking
  costTracking: {
    enabled: true,
    provider: "aws", // "aws" | "gcp" | "azure" | "cloudflare" | "vercel"
  },

  // Usage analytics
  usageAnalytics: {
    enabled: process.env.NODE_ENV === "production",
    sampleRate: 0.1, // 10% of users
  },

  // Time-travel debugging
  timeTravel: {
    enabled: process.env.NODE_ENV !== "production",
    maxSnapshots: 100,
  },
};
```

---

## Examples

See the [examples](./examples/) directory for complete working applications:

- [Todo App](./examples/todo-app) - Signals and forms
- [Blog](./examples/blog) - SSG with regeneration
- [E-commerce](./examples/storefront) - Full-featured store

---

## TypeScript Support

All PhilJS packages are written in TypeScript and provide complete type definitions.

```typescript
// Automatic type inference
const count = signal(0); // Signal<number>
const doubled = memo(() => count() * 2); // Memo<number>

// Generic type parameters
const user = signal<User | null>(null);
const form = useForm<SignupFormData>({ ... });
```

---

## Next Steps

- [Getting Started Guide](./GETTING_STARTED.md)
- [Performance Guide](./docs/performance.md)
- [Migration Guides](./docs/migration/)
- [Contributing](./CONTRIBUTING.md)
