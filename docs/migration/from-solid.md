# Migrating from Solid.js to PhilJS

This guide helps Solid.js developers transition to PhilJS. The frameworks share many similarities since both use fine-grained reactivity with signals.

## Quick Comparison

| Solid.js | PhilJS | Notes |
|----------|--------|-------|
| `createSignal()` | `signal()` | Nearly identical |
| `createEffect()` | `effect()` | Same concept |
| `createMemo()` | `computed()` | Same concept |
| `createResource()` | `createResource()` | Same concept |
| `<Show>` | `<Show>` | Same component |
| `<For>` | `<For>` | Same component |
| `<Switch>/<Match>` | `<Switch>/<Match>` | Same pattern |
| `onMount/onCleanup` | `onMount/onCleanup` | Same APIs |

## Core Concepts

### Signals

**Solid createSignal → PhilJS signal**

```tsx
// Solid.js
import { createSignal } from 'solid-js';

function Counter() {
  const [count, setCount] = createSignal(0);
  return (
    <button onClick={() => setCount(count() + 1)}>
      Count: {count()}
    </button>
  );
}
```

```tsx
// PhilJS
import { signal } from '@philjs/core';

function Counter() {
  const count = signal(0);
  return (
    <button onClick={() => count.set(count() + 1)}>
      Count: {count()}
    </button>
  );
}
```

**Key Differences:**
- PhilJS: `signal(value)` returns signal object with `.set()` method
- Solid: `createSignal(value)` returns `[getter, setter]` tuple
- Both access value with `signal()` call

### Effects

**Solid createEffect → PhilJS effect**

```tsx
// Solid.js
import { createSignal, createEffect } from 'solid-js';

function Logger() {
  const [count, setCount] = createSignal(0);

  createEffect(() => {
    console.log('Count is:', count());
  });

  return <button onClick={() => setCount(c => c + 1)}>Increment</button>;
}
```

```tsx
// PhilJS
import { signal, effect } from '@philjs/core';

function Logger() {
  const count = signal(0);

  effect(() => {
    console.log('Count is:', count());
  });

  return <button onClick={() => count.set(count() + 1)}>Increment</button>;
}
```

### Memos (Computed)

**Solid createMemo → PhilJS computed**

```tsx
// Solid.js
import { createSignal, createMemo } from 'solid-js';

function Calculator() {
  const [a, setA] = createSignal(1);
  const [b, setB] = createSignal(2);
  const sum = createMemo(() => a() + b());

  return <div>Sum: {sum()}</div>;
}
```

```tsx
// PhilJS
import { signal, computed } from '@philjs/core';

function Calculator() {
  const a = signal(1);
  const b = signal(2);
  const sum = computed(() => a() + b());

  return <div>Sum: {sum()}</div>;
}
```

### Resources

**Solid createResource → PhilJS createResource**

```tsx
// Solid.js
import { createResource, Suspense } from 'solid-js';

const fetchUser = async (id) => {
  const res = await fetch(`/api/users/${id}`);
  return res.json();
};

function User(props) {
  const [user] = createResource(() => props.id, fetchUser);

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <div>{user()?.name}</div>
    </Suspense>
  );
}
```

```tsx
// PhilJS
import { createResource, Suspense } from '@philjs/core';

const fetchUser = async (id: string) => {
  const res = await fetch(`/api/users/${id}`);
  return res.json();
};

function User(props: { id: () => string }) {
  const [user] = createResource(() => props.id(), fetchUser);

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <div>{user()?.name}</div>
    </Suspense>
  );
}
```

## Control Flow Components

### Show

```tsx
// Solid.js
import { Show } from 'solid-js';

<Show when={loggedIn()} fallback={<Login />}>
  <Dashboard />
</Show>
```

```tsx
// PhilJS - identical
import { Show } from '@philjs/core';

<Show when={loggedIn()} fallback={<Login />}>
  <Dashboard />
</Show>
```

### For

```tsx
// Solid.js
import { For } from 'solid-js';

<For each={items()} fallback={<div>No items</div>}>
  {(item, index) => <div>{index()}: {item.name}</div>}
</For>
```

```tsx
// PhilJS - identical
import { For } from '@philjs/core';

<For each={items()} fallback={<div>No items</div>}>
  {(item, index) => <div>{index()}: {item.name}</div>}
</For>
```

### Switch/Match

```tsx
// Solid.js
import { Switch, Match } from 'solid-js';

<Switch fallback={<div>Not found</div>}>
  <Match when={state() === 'loading'}>
    <Loading />
  </Match>
  <Match when={state() === 'error'}>
    <Error />
  </Match>
  <Match when={state() === 'ready'}>
    <Ready />
  </Match>
</Switch>
```

```tsx
// PhilJS - identical
import { Switch, Match } from '@philjs/core';

<Switch fallback={<div>Not found</div>}>
  <Match when={state() === 'loading'}>
    <Loading />
  </Match>
  <Match when={state() === 'error'}>
    <Error />
  </Match>
  <Match when={state() === 'ready'}>
    <Ready />
  </Match>
</Switch>
```

### Index

```tsx
// Solid.js
import { Index } from 'solid-js';

<Index each={items()}>
  {(item, index) => <div>{index}: {item().name}</div>}
</Index>
```

```tsx
// PhilJS - identical
import { Index } from '@philjs/core';

<Index each={items()}>
  {(item, index) => <div>{index}: {item().name}</div>}
</Index>
```

## Lifecycle

**Both frameworks share the same lifecycle APIs:**

```tsx
// Solid.js
import { onMount, onCleanup } from 'solid-js';

function Component() {
  onMount(() => {
    console.log('Mounted');
  });

  onCleanup(() => {
    console.log('Cleanup');
  });

  return <div>Content</div>;
}
```

```tsx
// PhilJS - identical
import { onMount, onCleanup } from '@philjs/core';

function Component() {
  onMount(() => {
    console.log('Mounted');
  });

  onCleanup(() => {
    console.log('Cleanup');
  });

  return <div>Content</div>;
}
```

## Context

```tsx
// Solid.js
import { createContext, useContext } from 'solid-js';

const ThemeContext = createContext('light');

function App() {
  return (
    <ThemeContext.Provider value="dark">
      <Child />
    </ThemeContext.Provider>
  );
}

function Child() {
  const theme = useContext(ThemeContext);
  return <div>Theme: {theme}</div>;
}
```

```tsx
// PhilJS - identical
import { createContext, useContext } from '@philjs/core';

const ThemeContext = createContext('light');

function App() {
  return (
    <ThemeContext.Provider value="dark">
      <Child />
    </ThemeContext.Provider>
  );
}

function Child() {
  const theme = useContext(ThemeContext);
  return <div>Theme: {theme}</div>;
}
```

## Stores

**Solid createStore → PhilJS createStore**

```tsx
// Solid.js
import { createStore } from 'solid-js/store';

const [state, setState] = createStore({
  user: { name: 'John', age: 30 },
  items: []
});

// Update nested property
setState('user', 'name', 'Jane');

// Add to array
setState('items', items => [...items, newItem]);
```

```tsx
// PhilJS
import { createStore } from '@philjs/store';

const store = createStore({
  user: { name: 'John', age: 30 },
  items: [] as Item[],

  setUserName(name: string) {
    this.user = { ...this.user, name };
  },

  addItem(item: Item) {
    this.items = [...this.items, item];
  }
});

// Usage
store.setUserName('Jane');
store.addItem(newItem);
```

**Key Difference:** PhilJS stores use methods for updates rather than path-based setters.

## Props & Reactivity

Both frameworks require accessing reactive props as functions:

```tsx
// Solid.js
function Child(props) {
  // Must access props.value() to maintain reactivity
  createEffect(() => {
    console.log(props.value);  // This works in Solid due to proxy
  });
}
```

```tsx
// PhilJS
function Child(props: { value: () => string }) {
  // Explicitly typed as function
  effect(() => {
    console.log(props.value());  // Call as function
  });
}
```

**Difference:** PhilJS uses explicit function types for reactive props rather than Solid's proxy approach.

## Batch Updates

```tsx
// Solid.js
import { batch } from 'solid-js';

batch(() => {
  setA(1);
  setB(2);
  setC(3);
});
```

```tsx
// PhilJS - identical
import { batch } from '@philjs/core';

batch(() => {
  a.set(1);
  b.set(2);
  c.set(3);
});
```

## Routing

**Solid Router → PhilJS Router**

```tsx
// Solid Router
import { Router, Routes, Route, A, useParams } from '@solidjs/router';

function App() {
  return (
    <Router>
      <A href="/">Home</A>
      <Routes>
        <Route path="/" component={Home} />
        <Route path="/users/:id" component={User} />
      </Routes>
    </Router>
  );
}

function User() {
  const params = useParams();
  return <div>User: {params.id}</div>;
}
```

```tsx
// PhilJS Router
import { createAppRouter, Link, RouterView, useRoute } from '@philjs/router';

const router = createAppRouter({
  routes: [
    { path: '/', component: Home },
    { path: '/users/:id', component: User },
  ]
});

function App() {
  return (
    <>
      <Link to="/">Home</Link>
      <RouterView />
    </>
  );
}

function User() {
  const route = useRoute();
  return <div>User: {route.params.id}</div>;
}
```

## Error Boundaries

```tsx
// Solid.js
import { ErrorBoundary } from 'solid-js';

<ErrorBoundary fallback={(err) => <div>Error: {err.message}</div>}>
  <ProblematicComponent />
</ErrorBoundary>
```

```tsx
// PhilJS - identical
import { ErrorBoundary } from '@philjs/core';

<ErrorBoundary fallback={(err) => <div>Error: {err.message}</div>}>
  <ProblematicComponent />
</ErrorBoundary>
```

## Main Differences

### 1. Signal API

```tsx
// Solid.js - tuple destructuring
const [count, setCount] = createSignal(0);
setCount(10);
setCount(c => c + 1);

// PhilJS - object with methods
const count = signal(0);
count.set(10);
count.set(count() + 1);
// Or: count.update(c => c + 1);
```

### 2. Store Updates

```tsx
// Solid.js - path-based
setState('user', 'profile', 'name', 'Jane');

// PhilJS - method-based
store.updateUserName('Jane');
// Or: store.user = { ...store.user, profile: { ...store.user.profile, name: 'Jane' } };
```

### 3. Compilation

```tsx
// Solid.js - requires Babel plugin for JSX transformation
// Transforms JSX at build time for optimal performance

// PhilJS - works with standard JSX transforms
// No special compilation, but still achieves fine-grained updates
```

### 4. Additional Features

PhilJS includes several features not in core Solid:

```tsx
// linkedSignal - writable computed
import { linkedSignal } from '@philjs/core';

const fahrenheit = signal(32);
const celsius = linkedSignal({
  get: () => (fahrenheit() - 32) * 5/9,
  set: (c) => fahrenheit.set(c * 9/5 + 32)
});

// Self-healing runtime
import { enableSelfHealing } from '@philjs/runtime';

// Cost tracking (serverless)
import { trackCost } from '@philjs/serverless';

// Activity component
import { Activity } from '@philjs/core';
```

## Migration Checklist

Most code transfers directly. Here's what to change:

1. **Signals**
   - `createSignal(x)` → `signal(x)`
   - `setSignal(value)` → `signal.set(value)`
   - `setSignal(fn)` → `signal.update(fn)` or `signal.set(fn(signal()))`

2. **Effects**
   - `createEffect` → `effect` (same behavior)

3. **Memos**
   - `createMemo` → `computed` (same behavior)

4. **Imports**
   - `from 'solid-js'` → `from '@philjs/core'`
   - `from 'solid-js/store'` → `from '@philjs/store'`
   - `from '@solidjs/router'` → `from '@philjs/router'`

5. **Stores**
   - Convert path-based updates to methods

## Why Migrate?

If Solid.js and PhilJS are similar, why switch?

1. **Extended ecosystem**: 200+ packages for every use case
2. **Unique features**: linkedSignal, self-healing, cost tracking
3. **Backend support**: 8 language adapters (Python, Go, Rust, etc.)
4. **DevTools**: Comprehensive debugging tools
5. **No compilation**: Standard JSX, simpler build setup
6. **TypeScript-first**: Better type inference out of the box

## Gradual Migration

Since both frameworks use signals, you can:

1. Share signal utilities between both
2. Migrate component by component
3. Use adapter at boundaries

```tsx
// Shared reactive logic works in both
export function createCounter(initial = 0) {
  // This pattern works similarly in both frameworks
  const count = signal(initial);  // or createSignal
  return {
    count,
    increment: () => count.set(count() + 1),
    decrement: () => count.set(count() - 1),
  };
}
```
