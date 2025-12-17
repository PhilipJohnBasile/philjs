# Core API Reference

Complete reference for PhilJS core primitives and utilities.

## Signals

### `signal<T>(initialValue: T): Signal<T>`

Creates a reactive signal with an initial value.

```typescript
import { signal } from 'philjs-core';

const count = signal(0);
const name = signal('John');
const user = signal({ name: 'John', age: 30 });
```

#### Signal Methods

**`.get(): T`**
Returns the current value.

```typescript
const count = signal(5);
console.log(count.get());  // 5
```

**`.set(value: T | ((prev: T) => T)): void`**
Updates the signal value.

```typescript
count.set(10);                    // Set to 10
count.set(prev => prev + 1);      // Increment
```

**`.subscribe(callback: (value: T) => void): () => void`**
Subscribes to signal changes. Returns unsubscribe function.

```typescript
const unsubscribe = count.subscribe(value => {
  console.log('Count changed:', value);
});

// Later
unsubscribe();
```

**`.peek(): T`**
Reads value without subscribing.

```typescript
const value = count.peek();  // Doesn't create dependency
```

**`.toString(): string`**
Returns string representation.

```typescript
`Count: ${count}`;  // "Count: 5"
```

#### Type Definition

```typescript
interface Signal<T> {
  get(): T;
  set(value: T | ((prev: T) => T)): void;
  subscribe(callback: (value: T) => void): () => void;
  peek(): T;
  toString(): string;
}
```

---

## Memos

### `memo<T>(compute: () => T): Signal<T>`

Creates a computed signal that caches its value.

```typescript
import { signal, memo } from 'philjs-core';

const firstName = signal('John');
const lastName = signal('Doe');

const fullName = memo(() => `${firstName.get()} ${lastName.get()}`);

console.log(fullName.get());  // "John Doe"

firstName.set('Jane');
console.log(fullName.get());  // "Jane Doe"
```

#### Memoization Rules

- Recomputes only when dependencies change
- Caches result until next change
- Automatically tracks dependencies
- Can depend on other memos

```typescript
const a = signal(2);
const b = signal(3);

const sum = memo(() => a.get() + b.get());
const doubled = memo(() => sum.get() * 2);

console.log(doubled.get());  // 10

a.set(5);
console.log(doubled.get());  // 16
```

---

## Effects

### `effect(fn: () => void | (() => void)): () => void`

Runs a function when its dependencies change. Returns cleanup function.

```typescript
import { signal, effect } from 'philjs-core';

const count = signal(0);

// Run on every change
effect(() => {
  console.log('Count is:', count.get());
  document.title = `Count: ${count.get()}`;
});

// Effect with cleanup
effect(() => {
  const timer = setInterval(() => {
    console.log(count.get());
  }, 1000);

  // Cleanup runs before next execution
  return () => clearInterval(timer);
});
```

#### Effect Execution

- Runs immediately on creation
- Re-runs when dependencies change
- Cleanup runs before re-execution
- Cleanup runs on disposal

```typescript
const dispose = effect(() => {
  console.log(count.get());

  return () => console.log('Cleanup');
});

count.set(1);  // Logs: "Cleanup", "1"
count.set(2);  // Logs: "Cleanup", "2"

dispose();     // Logs: "Cleanup"
```

---

## Batching

### `batch(fn: () => void): void`

Batches multiple signal updates into a single transaction.

```typescript
import { signal, batch } from 'philjs-core';

const firstName = signal('John');
const lastName = signal('Doe');

effect(() => {
  // This runs once after batch completes
  console.log(`${firstName.get()} ${lastName.get()}`);
});

// Without batch: 2 effect runs
firstName.set('Jane');
lastName.set('Smith');

// With batch: 1 effect run
batch(() => {
  firstName.set('Jane');
  lastName.set('Smith');
});
```

---

## Untracking

### `untrack<T>(fn: () => T): T`

Reads signals without creating dependencies.

```typescript
import { signal, effect, untrack } from 'philjs-core';

const a = signal(1);
const b = signal(2);

effect(() => {
  console.log(a.get());          // Tracked
  console.log(untrack(() => b.get()));  // Not tracked
});

a.set(3);  // Effect runs
b.set(4);  // Effect doesn't run
```

---

## Lifecycle

### `onCleanup(fn: () => void): void`

Registers a cleanup function for the current effect.

```typescript
import { effect, onCleanup } from 'philjs-core';

effect(() => {
  const subscription = subscribe();

  onCleanup(() => {
    subscription.unsubscribe();
  });
});
```

### `onMount(fn: () => void): void`

Runs a function when the component mounts.

```typescript
import { onMount } from 'philjs-core';

function Component() {
  onMount(() => {
    console.log('Component mounted');
  });

  return <div>Content</div>;
}
```

### `onUnmount(fn: () => void): void`

Runs a function when the component unmounts.

```typescript
import { onUnmount } from 'philjs-core';

function Component() {
  onUnmount(() => {
    console.log('Component unmounted');
  });

  return <div>Content</div>;
}
```

---

## Roots

### `createRoot(fn: (dispose: () => void) => T): T`

Creates an isolated reactive scope.

```typescript
import { signal, effect, createRoot } from 'philjs-core';

const dispose = createRoot((dispose) => {
  const count = signal(0);

  effect(() => {
    console.log(count.get());
  });

  return dispose;
});

// Later, dispose all effects
dispose();
```

---

## Advanced Signals

### `linkedSignal<T, U>(source: Signal<T>, compute: (value: T) => U): Signal<U>`

Creates a writable computed signal (like Angular signals).

```typescript
import { signal, linkedSignal } from 'philjs-core';

const celsius = signal(0);

// Writable computed: converts Celsius to Fahrenheit
const fahrenheit = linkedSignal(
  celsius,
  (c) => c * 9/5 + 32
);

console.log(fahrenheit.get());  // 32

// Set fahrenheit directly
fahrenheit.set(212);
console.log(celsius.get());     // 100

// Or set celsius
celsius.set(100);
console.log(fahrenheit.get());  // 212
```

### `resource<T>(fetcher: () => Promise<T>, options?): Resource<T>`

Creates a resource for async data loading.

```typescript
import { resource } from 'philjs-core';

const userId = signal('123');

const user = resource(
  async () => {
    const response = await fetch(`/api/users/${userId.get()}`);
    return response.json();
  },
  {
    initialValue: null,
    refetchOnMount: true,
  }
);

<div>
  {user.loading && <p>Loading...</p>}
  {user.error && <p>Error: {user.error.message}</p>}
  {user() && <p>Name: {user().name}</p>}
</div>
```

#### Resource API

```typescript
interface Resource<T> extends Signal<T | undefined> {
  loading: Signal<boolean>;
  error: Signal<Error | null>;
  refetch(): Promise<void>;
  mutate(value: T): void;
}
```

---

## Rendering

### `render(component: () => JSX.Element, container: HTMLElement): () => void`

Renders a component to a DOM element.

```typescript
import { render } from 'philjs-core';

const dispose = render(
  () => <App />,
  document.getElementById('root')!
);

// Later, unmount
dispose();
```

### `hydrate(component: () => JSX.Element, container: HTMLElement): () => void`

Hydrates a server-rendered component.

```typescript
import { hydrate } from 'philjs-core';

hydrate(
  () => <App />,
  document.getElementById('root')!
);
```

---

## JSX

### `jsx(type: string | Component, props: Props, ...children: JSX.Element[])`

Creates a JSX element.

```typescript
import { jsx } from 'philjs-core';

// Usually handled by JSX transform
const element = jsx('div', { className: 'container' },
  jsx('h1', {}, 'Hello'),
  jsx('p', {}, 'World')
);
```

### `Fragment`

Renders multiple children without a wrapper element.

```typescript
import { Fragment } from 'philjs-core';

function Component() {
  return (
    <Fragment>
      <h1>Title</h1>
      <p>Content</p>
    </Fragment>
  );
}

// Shorthand
function Component() {
  return (
    <>
      <h1>Title</h1>
      <p>Content</p>
    </>
  );
}
```

---

## Context

### `createContext<T>(defaultValue: T): Context<T>`

Creates a context for dependency injection.

```typescript
import { createContext } from 'philjs-core';

interface Theme {
  color: string;
  background: string;
}

const ThemeContext = createContext<Theme>({
  color: 'black',
  background: 'white'
});
```

### `Context.Provider`

Provides a context value to children.

```typescript
function App() {
  const theme = signal({
    color: 'white',
    background: 'black'
  });

  return (
    <ThemeContext.Provider value={theme}>
      <ThemedComponent />
    </ThemeContext.Provider>
  );
}
```

### `useContext<T>(context: Context<T>): T`

Consumes a context value.

```typescript
import { useContext } from 'philjs-core';

function ThemedComponent() {
  const theme = useContext(ThemeContext);

  return (
    <div style={{
      color: theme.get().color,
      background: theme.get().background
    }}>
      Themed content
    </div>
  );
}
```

---

## Components

### Component Props

```typescript
interface ComponentProps {
  children?: JSX.Element | JSX.Element[];
  ref?: (element: HTMLElement) => void;
  [key: string]: any;
}

function Component(props: ComponentProps) {
  return <div {...props}>{props.children}</div>;
}
```

### Refs

```typescript
import { signal } from 'philjs-core';

function Component() {
  const divRef = signal<HTMLDivElement | null>(null);

  onMount(() => {
    console.log('Div element:', divRef.get());
  });

  return <div ref={divRef}>Content</div>;
}
```

---

## Error Boundaries

### `ErrorBoundary`

Catches errors in child components.

```typescript
import { ErrorBoundary } from 'philjs-core';

function App() {
  return (
    <ErrorBoundary
      fallback={(error, reset) => (
        <div>
          <h1>Error: {error.message}</h1>
          <button onClick={reset}>Retry</button>
        </div>
      )}
    >
      <MaybeFailingComponent />
    </ErrorBoundary>
  );
}
```

---

## Suspense

### `Suspense`

Shows a fallback while children are loading.

```typescript
import { Suspense } from 'philjs-core';

function App() {
  return (
    <Suspense fallback={<Loading />}>
      <AsyncComponent />
    </Suspense>
  );
}
```

---

## Utilities

### `isSignal(value: any): boolean`

Checks if a value is a signal.

```typescript
import { isSignal, signal } from 'philjs-core';

const count = signal(0);
console.log(isSignal(count));  // true
console.log(isSignal(5));      // false
```

### `isJSXElement(value: any): boolean`

Checks if a value is a JSX element.

```typescript
import { isJSXElement } from 'philjs-core';

console.log(isJSXElement(<div />));  // true
console.log(isJSXElement('text'));   // false
```

---

## Type Definitions

```typescript
// Signal
type Signal<T> = {
  get(): T;
  set(value: T | ((prev: T) => T)): void;
  subscribe(callback: (value: T) => void): () => void;
  peek(): T;
  toString(): string;
};

// Component
type Component<P = {}> = (props: P) => JSX.Element;

// JSX Element
type JSX.Element = {
  type: string | Component;
  props: Record<string, any>;
  children: JSX.Element[];
};

// Context
type Context<T> = {
  Provider: Component<{ value: T; children?: JSX.Element }>;
  defaultValue: T;
};

// Resource
type Resource<T> = Signal<T | undefined> & {
  loading: Signal<boolean>;
  error: Signal<Error | null>;
  refetch(): Promise<void>;
  mutate(value: T): void;
};
```

---

## Next Steps

Explore specific API references:

- [Reactivity API](reactivity) - Detailed reactivity system
- [PPR API](ppr) - Partial pre-rendering
- [Activity API](activity) - Priority-based rendering
- [Server Islands API](server-islands) - Per-component caching
- [Router API](router) - Client-side navigation
- [Components API](components) - Built-in components
