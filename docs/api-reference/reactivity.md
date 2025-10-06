# Reactivity API

Core reactive primitives for building reactive applications.

## signal()

Creates a reactive signal that holds a value and notifies dependents when it changes.

### Signature

```typescript
function signal<T>(initialValue: T): Signal<T>

interface Signal<T> {
  (): T;
  set: (value: T | ((prev: T) => T)) => void;
  subscribe: (callback: (value: T) => void) => () => void;
}
```

### Parameters

- **initialValue**: `T` - The initial value of the signal

### Returns

A `Signal<T>` object with:
- **()**: Function to read the current value
- **set()**: Function to update the value
- **subscribe()**: Function to subscribe to changes

### Examples

#### Basic Usage

```typescript
import { signal } from 'philjs-core';

const count = signal(0);

console.log(count()); // 0

count.set(5);
console.log(count()); // 5
```

#### Functional Updates

```typescript
const count = signal(0);

// Update based on previous value
count.set(prev => prev + 1);
console.log(count()); // 1

count.set(prev => prev * 2);
console.log(count()); // 2
```

#### Object Signals

```typescript
interface User {
  name: string;
  age: number;
}

const user = signal<User>({
  name: 'Alice',
  age: 30
});

// Update entire object
user.set({ name: 'Bob', age: 25 });

// Update with previous value
user.set(prev => ({
  ...prev,
  age: prev.age + 1
}));
```

#### Subscribe to Changes

```typescript
const count = signal(0);

const unsubscribe = count.subscribe((value) => {
  console.log('Count changed:', value);
});

count.set(1); // Logs: "Count changed: 1"
count.set(2); // Logs: "Count changed: 2"

// Clean up
unsubscribe();
```

### Notes

- Signals are synchronous - updates happen immediately
- Signals use reference equality to determine if the value changed
- Reading a signal inside an effect or memo automatically tracks it as a dependency
- Use functional updates to avoid race conditions

---

## memo()

Creates a computed value that automatically updates when its dependencies change.

### Signature

```typescript
function memo<T>(computation: () => T): Memo<T>

interface Memo<T> {
  (): T;
}
```

### Parameters

- **computation**: `() => T` - Function that computes the value

### Returns

A `Memo<T>` function that returns the computed value.

### Examples

#### Basic Memo

```typescript
import { signal, memo } from 'philjs-core';

const count = signal(10);
const doubled = memo(() => count() * 2);

console.log(doubled()); // 20

count.set(15);
console.log(doubled()); // 30
```

#### Multiple Dependencies

```typescript
const firstName = signal('John');
const lastName = signal('Doe');

const fullName = memo(() => `${firstName()} ${lastName()}`);

console.log(fullName()); // "John Doe"

firstName.set('Jane');
console.log(fullName()); // "Jane Doe"
```

#### Chained Memos

```typescript
const count = signal(2);
const doubled = memo(() => count() * 2);
const quadrupled = memo(() => doubled() * 2);

console.log(quadrupled()); // 8

count.set(5);
console.log(quadrupled()); // 20
```

#### Expensive Computations

```typescript
const data = signal([1, 2, 3, 4, 5]);

const sum = memo(() => {
  console.log('Computing sum...');
  return data().reduce((a, b) => a + b, 0);
});

// First access - computes
console.log(sum()); // Logs "Computing sum..." then 15

// Second access - cached
console.log(sum()); // 15 (no log)

// After dependency changes - recomputes
data.set([1, 2, 3]);
console.log(sum()); // Logs "Computing sum..." then 6
```

### Notes

- Memos are lazy - they only compute when accessed
- Memos cache their value and only recompute when dependencies change
- Memos automatically track all signals read during computation
- Memos are read-only - you cannot `.set()` them

---

## effect()

Creates a side effect that runs when its dependencies change.

### Signature

```typescript
function effect(fn: () => void | (() => void)): () => void
```

### Parameters

- **fn**: `() => void | (() => void)` - Effect function. Can return a cleanup function.

### Returns

A dispose function to stop the effect.

### Examples

#### Basic Effect

```typescript
import { signal, effect } from 'philjs-core';

const count = signal(0);

effect(() => {
  console.log('Count is:', count());
});
// Immediately logs: "Count is: 0"

count.set(5);
// Logs: "Count is: 5"
```

#### Effect with Cleanup

```typescript
const isActive = signal(true);

effect(() => {
  if (!isActive()) return;

  const id = setInterval(() => {
    console.log('Tick');
  }, 1000);

  // Cleanup function
  return () => {
    clearInterval(id);
  };
});

// When isActive becomes false, cleanup runs
isActive.set(false);
```

#### DOM Side Effects

```typescript
const theme = signal<'light' | 'dark'>('light');

effect(() => {
  document.body.className = theme();
});

theme.set('dark'); // Updates body class
```

#### Multiple Dependencies

```typescript
const firstName = signal('John');
const lastName = signal('Doe');

effect(() => {
  document.title = `${firstName()} ${lastName()}`;
});

firstName.set('Jane'); // Updates title
lastName.set('Smith'); // Updates title
```

#### Dispose Effect

```typescript
const count = signal(0);

const dispose = effect(() => {
  console.log('Count:', count());
});

count.set(1); // Logs: "Count: 1"

// Stop the effect
dispose();

count.set(2); // No log
```

#### Async Effects

```typescript
const userId = signal('123');

effect(async () => {
  const response = await fetch(`/api/users/${userId()}`);
  const user = await response.json();
  console.log('User:', user);
});

userId.set('456'); // Fetches new user
```

### Notes

- Effects run immediately when created
- Effects automatically track all signals read during execution
- Effects run synchronously after signal updates
- Cleanup functions run before re-execution and on dispose
- Avoid infinite loops by not updating dependencies inside effects

---

## batch()

Batches multiple signal updates into a single update cycle.

### Signature

```typescript
function batch(fn: () => void): void
```

### Parameters

- **fn**: `() => void` - Function containing signal updates

### Returns

`void`

### Examples

#### Basic Batching

```typescript
import { signal, effect, batch } from 'philjs-core';

const count = signal(0);
const name = signal('Alice');

effect(() => {
  console.log('Effect ran:', count(), name());
});

// Without batch - effect runs twice
count.set(1);
name.set('Bob');

// With batch - effect runs once
batch(() => {
  count.set(2);
  name.set('Charlie');
});
```

#### Batch in Event Handlers

```typescript
function handleSubmit() {
  batch(() => {
    // Multiple updates, single re-render
    firstName.set('John');
    lastName.set('Doe');
    email.set('john@example.com');
    isSubmitting.set(true);
  });
}
```

#### Nested Batches

```typescript
batch(() => {
  count.set(1);

  batch(() => {
    name.set('Alice');
    age.set(30);
  });

  status.set('active');
});
// All updates applied in single cycle
```

### Notes

- Batching improves performance by reducing effect executions
- Effects still run in the correct order after batch completes
- Nested batches are flattened into a single batch
- Use batch for multiple related updates

---

## untrack()

Reads a signal without tracking it as a dependency.

### Signature

```typescript
function untrack<T>(fn: () => T): T
```

### Parameters

- **fn**: `() => T` - Function to run without tracking

### Returns

The return value of `fn`

### Examples

#### Untracked Reads

```typescript
import { signal, effect, untrack } from 'philjs-core';

const count = signal(0);
const threshold = signal(10);

effect(() => {
  console.log('Count:', count());

  // Read threshold without tracking it
  const max = untrack(() => threshold());

  if (count() > max) {
    console.log('Exceeded threshold');
  }
});

count.set(15); // Logs both messages
threshold.set(20); // Effect doesn't run (not tracked)
```

#### Conditional Tracking

```typescript
const shouldTrack = signal(true);
const value = signal(0);

effect(() => {
  if (shouldTrack()) {
    console.log('Tracked:', value());
  } else {
    console.log('Untracked:', untrack(() => value()));
  }
});
```

### Notes

- Use `untrack()` to avoid unnecessary effect re-runs
- Useful for conditional dependencies
- Can improve performance in complex effects

---

## onCleanup()

Registers a cleanup function in the current effect.

### Signature

```typescript
function onCleanup(fn: () => void): void
```

### Parameters

- **fn**: `() => void` - Cleanup function to run

### Returns

`void`

### Examples

#### Using onCleanup

```typescript
import { effect, onCleanup } from 'philjs-core';

effect(() => {
  const id = setInterval(() => {
    console.log('Tick');
  }, 1000);

  onCleanup(() => {
    clearInterval(id);
  });
});
```

#### Multiple Cleanups

```typescript
effect(() => {
  const listener1 = () => console.log('Click');
  const listener2 = () => console.log('Scroll');

  window.addEventListener('click', listener1);
  window.addEventListener('scroll', listener2);

  onCleanup(() => {
    window.removeEventListener('click', listener1);
  });

  onCleanup(() => {
    window.removeEventListener('scroll', listener2);
  });
});
```

### Notes

- `onCleanup()` must be called inside an effect
- Multiple cleanup functions can be registered
- Cleanup functions run in registration order
- Equivalent to returning a cleanup function from effect

---

## Best Practices

### Keep Effects Minimal

```typescript
// ❌ Doing too much in one effect
effect(() => {
  updateDOM(count());
  logAnalytics(count());
  saveToLocalStorage(count());
  syncWithServer(count());
});

// ✅ Separate concerns
effect(() => updateDOM(count()));
effect(() => logAnalytics(count()));
effect(() => saveToLocalStorage(count()));
effect(() => syncWithServer(count()));
```

### Use Memos for Derived State

```typescript
// ❌ Computing in component
function Component() {
  const filtered = todos().filter(t => !t.completed);
  const count = filtered.length;
}

// ✅ Use memo
const activeTodos = memo(() => todos().filter(t => !t.completed));
const activeCount = memo(() => activeTodos().length);
```

### Batch Related Updates

```typescript
// ❌ Multiple individual updates
count.set(1);
name.set('Alice');
status.set('active');

// ✅ Batch together
batch(() => {
  count.set(1);
  name.set('Alice');
  status.set('active');
});
```

### Clean Up Effects

```typescript
// ✅ Always clean up side effects
effect(() => {
  const subscription = subscribe();

  return () => {
    subscription.unsubscribe();
  };
});
```

---

**Next:** [Components API →](./components.md) Component rendering and JSX
