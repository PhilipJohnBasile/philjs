# Signals and Reactivity

PhilJS uses fine-grained reactive signals inspired by SolidJS, with automatic dependency tracking and optimal update granularity.

## Core Concepts

### What is a Signal?

A signal is a reactive container that holds a value and notifies subscribers when that value changes. Unlike React's `useState`, signals provide direct access to values without requiring hooks rules.

```tsx
import { signal } from '@philjs/core';

// Create a signal with initial value
const count = signal(0);

// Read the value (tracks dependency in reactive contexts)
console.log(count()); // 0

// Write a new value
count.set(5);
console.log(count()); // 5

// Update based on previous value
count.set(prev => prev + 1);
console.log(count()); // 6
```

## Signal API

### `signal<T>(initialValue: T): Signal<T>`

Creates a reactive signal.

```tsx
interface Signal<T> {
  (): T;                              // Read value (tracks dependencies)
  set(value: T | ((prev: T) => T)): void;  // Write value
  subscribe(fn: (value: T) => void): () => void;  // Manual subscription
  peek(): T;                          // Read without tracking
}
```

#### Reading Values

```tsx
const name = signal('Alice');

// In reactive context (effect, memo, component render)
effect(() => {
  console.log(name()); // Automatically re-runs when name changes
});

// Reading without tracking
const currentName = name.peek(); // Does not create dependency
```

#### Writing Values

```tsx
const count = signal(0);

// Direct assignment
count.set(10);

// Functional update (recommended for derived values)
count.set(prev => prev + 1);

// Multiple updates are automatically batched in event handlers
button.onclick = () => {
  count.set(c => c + 1);
  count.set(c => c * 2);
  // Only triggers ONE re-render with final value
};
```

#### Manual Subscription

```tsx
const temperature = signal(72);

// Subscribe to changes outside reactive context
const unsubscribe = temperature.subscribe(value => {
  console.log(`Temperature changed to ${value}°F`);
});

temperature.set(75); // Logs: "Temperature changed to 75°F"

// Clean up when done
unsubscribe();
```

## Computed Values (Memos)

### `memo<T>(computation: () => T): Memo<T>`

Creates a memoized derived value that automatically tracks dependencies.

```tsx
import { signal, memo } from '@philjs/core';

const firstName = signal('John');
const lastName = signal('Doe');

// Automatically recomputes when firstName or lastName changes
const fullName = memo(() => `${firstName()} ${lastName()}`);

console.log(fullName()); // "John Doe"

firstName.set('Jane');
console.log(fullName()); // "Jane Doe"
```

### Memo Characteristics

1. **Lazy evaluation**: Only computes when read
2. **Cached**: Returns cached value if dependencies haven't changed
3. **Automatic tracking**: Knows exactly which signals it depends on
4. **Composable**: Memos can depend on other memos

```tsx
const items = signal([1, 2, 3, 4, 5]);
const filter = signal('all');

// Memos can depend on other memos
const filteredItems = memo(() => {
  const allItems = items();
  const currentFilter = filter();

  if (currentFilter === 'even') {
    return allItems.filter(x => x % 2 === 0);
  }
  if (currentFilter === 'odd') {
    return allItems.filter(x => x % 2 !== 0);
  }
  return allItems;
});

const itemCount = memo(() => filteredItems().length);

console.log(itemCount()); // 5

filter.set('even');
console.log(filteredItems()); // [2, 4]
console.log(itemCount()); // 2
```

## Linked Signals (Writable Computed)

### `linkedSignal<T>(computation: () => T, options?): LinkedSignal<T>`

Creates a writable computed signal (similar to Angular's `linkedSignal`). It acts like a memo by default but can be manually overridden. When dependencies change, it resets to the computed value.

```tsx
import { signal, linkedSignal } from '@philjs/core';

const firstName = signal('John');
const lastName = signal('Doe');

const displayName = linkedSignal(() => `${firstName()} ${lastName()}`);

console.log(displayName()); // "John Doe"
console.log(displayName.isOverridden()); // false

// Manual override
displayName.set('Jane Smith');
console.log(displayName()); // "Jane Smith"
console.log(displayName.isOverridden()); // true

// Dependency change resets to computed value
firstName.set('Bob');
console.log(displayName()); // "Bob Doe" (reset!)
console.log(displayName.isOverridden()); // false

// Reset manually
displayName.set('Custom Name');
displayName.reset();
console.log(displayName()); // "Bob Doe"
```

### Options

```tsx
interface LinkedSignalOptions {
  resetOnChange?: boolean; // Default: true - reset when deps change
}

// Keep override even when dependencies change
const preservedName = linkedSignal(
  () => `${firstName()} ${lastName()}`,
  { resetOnChange: false }
);
```

## Effects

### `effect(fn: () => void | (() => void)): () => void`

Creates a side effect that automatically tracks dependencies and re-runs when they change.

```tsx
import { signal, effect } from '@philjs/core';

const count = signal(0);

const dispose = effect(() => {
  console.log(`Count is now: ${count()}`);

  // Optional: return cleanup function
  return () => {
    console.log('Cleaning up previous effect');
  };
});

count.set(1);
// Logs: "Cleaning up previous effect"
// Logs: "Count is now: 1"

// Stop the effect
dispose();
```

### Effect Patterns

#### DOM Updates

```tsx
const theme = signal<'light' | 'dark'>('light');

effect(() => {
  document.body.className = theme();
});
```

#### Async Operations

```tsx
const searchQuery = signal('');

effect(() => {
  const query = searchQuery();
  if (query.length < 3) return;

  const controller = new AbortController();

  fetch(`/api/search?q=${query}`, { signal: controller.signal })
    .then(r => r.json())
    .then(setResults)
    .catch(() => {}); // Ignore aborted requests

  return () => controller.abort();
});
```

#### Timers

```tsx
const interval = signal(1000);

effect(() => {
  const ms = interval();
  const id = setInterval(() => console.log('tick'), ms);
  return () => clearInterval(id);
});
```

## Cleanup with `onCleanup`

### `onCleanup(fn: () => void): void`

Register cleanup functions within effects.

```tsx
import { signal, effect, onCleanup } from '@philjs/core';

const isConnected = signal(false);

effect(() => {
  if (!isConnected()) return;

  const ws = new WebSocket('wss://api.example.com');

  ws.onopen = () => console.log('Connected');
  ws.onmessage = (e) => console.log('Message:', e.data);

  onCleanup(() => {
    console.log('Closing WebSocket');
    ws.close();
  });
});
```

## Batching

### `batch<T>(fn: () => T): T`

Batch multiple signal updates into a single update cycle.

```tsx
import { signal, effect, batch } from '@philjs/core';

const firstName = signal('John');
const lastName = signal('Doe');
const age = signal(30);

effect(() => {
  console.log(`${firstName()} ${lastName()}, ${age()}`);
});

// Without batching: 3 console logs
firstName.set('Jane');
lastName.set('Smith');
age.set(25);

// With batching: 1 console log
batch(() => {
  firstName.set('Jane');
  lastName.set('Smith');
  age.set(25);
});
```

## Untracking

### `untrack<T>(fn: () => T): T`

Read signal values without creating dependencies.

```tsx
import { signal, memo, untrack } from '@philjs/core';

const a = signal(1);
const b = signal(2);

const sum = memo(() => {
  const aVal = a();           // Tracked - changes trigger recompute
  const bVal = untrack(() => b()); // Not tracked - changes ignored
  return aVal + bVal;
});

console.log(sum()); // 3

b.set(100);
console.log(sum()); // Still 3 (b not tracked)

a.set(5);
console.log(sum()); // 105 (recomputed, now uses b=100)
```

## Root Scopes

### `createRoot<T>(fn: (dispose: () => void) => T): T`

Create a root scope for managing effect lifetimes.

```tsx
import { signal, effect, createRoot } from '@philjs/core';

const dispose = createRoot(dispose => {
  const count = signal(0);

  effect(() => {
    console.log(count());
  });

  // Effects within this root will be cleaned up together
  return dispose;
});

// Later: clean up everything
dispose();
```

## Resources (Async Data)

### `resource<T>(fetcher: () => T | Promise<T>): Resource<T>`

Create async data with loading and error states.

```tsx
import { signal, resource } from '@philjs/core';

const userId = signal(1);

const user = resource(async () => {
  const response = await fetch(`/api/users/${userId()}`);
  if (!response.ok) throw new Error('Failed to fetch');
  return response.json();
});

// In component
function UserProfile() {
  if (user.loading()) {
    return <div>Loading...</div>;
  }

  if (user.error()) {
    return <div>Error: {user.error()!.message}</div>;
  }

  return (
    <div>
      <h1>{user().name}</h1>
      <button onClick={() => user.refresh()}>
        Refresh
      </button>
    </div>
  );
}
```

### Resource API

```tsx
interface Resource<T> {
  (): T;                    // Get data (throws if error)
  loading(): boolean;       // Loading state
  error(): Error | null;    // Error state
  refresh(): void;          // Refetch data
}
```

## HMR Support

PhilJS signals support Hot Module Replacement for optimal development experience.

```tsx
import {
  snapshotHMRState,
  restoreHMRState,
  cleanupHMREffects,
  getHMRStats
} from '@philjs/core';

// Before HMR update
const snapshot = snapshotHMRState({ verbose: true });

// After HMR update
cleanupHMREffects();
restoreHMRState({ verbose: true });

// Debug HMR state
console.log(getHMRStats());
// { signalCount: 42, effectCount: 15, registrySize: 42, ... }
```

## Performance Best Practices

### 1. Granular Signals

```tsx
// Bad: One big object signal
const state = signal({ count: 0, name: '', items: [] });

// Good: Separate signals for independent updates
const count = signal(0);
const name = signal('');
const items = signal<string[]>([]);
```

### 2. Memoize Expensive Computations

```tsx
const items = signal<Item[]>([]);
const filter = signal('');

// Good: Expensive filter only runs when dependencies change
const filteredItems = memo(() =>
  items().filter(item =>
    item.name.toLowerCase().includes(filter().toLowerCase())
  )
);
```

### 3. Batch Related Updates

```tsx
function handleFormSubmit(data: FormData) {
  batch(() => {
    firstName.set(data.firstName);
    lastName.set(data.lastName);
    email.set(data.email);
    // Single update cycle
  });
}
```

### 4. Use `peek()` for Non-Reactive Reads

```tsx
effect(() => {
  const query = searchQuery(); // Reactive
  const config = configSignal.peek(); // Non-reactive (doesn't re-run effect)

  performSearch(query, config);
});
```

## TypeScript Integration

```tsx
import { signal, memo, Signal, Memo } from '@philjs/core';

// Explicit types
const count: Signal<number> = signal(0);
const name: Signal<string> = signal('');
const items: Signal<Item[]> = signal([]);

// Inferred types work great
const doubled = memo(() => count() * 2); // Memo<number>

// Complex types
interface User {
  id: number;
  name: string;
  email: string;
}

const currentUser = signal<User | null>(null);

// Type-safe updates
currentUser.set(prev => prev ? { ...prev, name: 'Updated' } : null);
```

## Next Steps

- [JSX and Rendering](./jsx-rendering.md)
- [Data Layer](./data-layer.md)
- [Effects and Lifecycle](./effects-lifecycle.md)
