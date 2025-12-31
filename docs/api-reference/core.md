# Core API Reference

Complete API reference for @philjs/core package.

## Table of Contents

- [Signals & Reactivity](#signals--reactivity)
- [Rendering](#rendering)
- [Resumability](#resumability)
- [Data Layer](#data-layer)
- [Context API](#context-api)
- [Animation & Motion](#animation--motion)
- [Internationalization](#internationalization)
- [Error Boundaries](#error-boundaries)
- [Service Worker](#service-worker)
- [Performance & Intelligence](#performance--intelligence)
- [Error Handling & Result](#error-handling--result)
- [Forms & Validation](#forms--validation)
- [Accessibility](#accessibility)
- [A/B Testing](#ab-testing)
- [Partial Pre-rendering (PPR)](#partial-pre-rendering-ppr)
- [Activity Component](#activity-component)

---

## Signals & Reactivity

### signal()

**Signature**:
```typescript
function signal<T>(initialValue: T): Signal<T>

interface Signal<T> {
  (): T;                                    // Read value
  set: (next: T | ((prev: T) => T)) => void; // Update value
  subscribe: (fn: (v: T) => void) => () => void; // Subscribe to changes
  peek: () => T;                            // Read without tracking
}
```

**Description**: Create reactive state that automatically tracks dependencies and triggers updates when the value changes. Signals use reference equality (`Object.is`) to determine if a value has changed.

**Examples**:

```typescript
import { signal } from '@philjs/core';

// Example 1: Basic counter
const count = signal(0);

console.log(count()); // 0
count.set(5);
console.log(count()); // 5

// Updater function (preferred)
count.set(c => c + 1);
console.log(count()); // 6

// Example 2: Object state with immutable updates
const user = signal({ name: 'Alice', age: 30 });

// Always create new objects, never mutate
user.set({ ...user(), age: 31 });
user.set(u => ({ ...u, name: 'Bob' }));

// Example 3: Array state
const todos = signal([
  { id: 1, text: 'Learn PhilJS', done: false }
]);

// Add item - create new array
todos.set([...todos(), { id: 2, text: 'Build app', done: false }]);

// Remove item
todos.set(todos => todos.filter(t => t.id !== 1));

// Update item
todos.set(todos => todos.map(t =>
  t.id === 1 ? { ...t, done: true } : t
));

// Example 4: Using peek() to read without tracking
import { effect } from '@philjs/core';

const a = signal(1);
const b = signal(2);

effect(() => {
  console.log(a());      // Tracked - effect re-runs when a changes
  console.log(a.peek()); // Also tracked (same as calling a())
});

// Example 5: Subscribing to changes
const count = signal(0);

const unsubscribe = count.subscribe(value => {
  console.log('Count changed to:', value);
});

count.set(1); // Logs: "Count changed to: 1"
unsubscribe(); // Stop listening
count.set(2); // No log
```

**Edge Cases**:

```typescript
// 1. Updates with same value don't trigger subscribers (Object.is equality)
const count = signal(0);
effect(() => console.log('Effect:', count()));
// Logs: "Effect: 0"

count.set(0); // No log - same value
count.set(-0); // No log - Object.is(0, -0) is true
count.set(1); // Logs: "Effect: 1"

// 2. NaN is equal to itself with Object.is
const value = signal(NaN);
effect(() => console.log('Value:', value()));
// Logs: "Value: NaN"

value.set(NaN); // No log - Object.is(NaN, NaN) is true

// 3. Object/array updates require new references
const state = signal({ count: 0 });
effect(() => console.log('State:', state()));
// Logs: "State: { count: 0 }"

state.peek().count = 1; // Mutation - no update triggered!
state.set(state()); // No update - same reference!

// Correct way:
state.set({ ...state(), count: 1 }); // New object - updates!

// 4. Function values must be wrapped in updater
const fn = signal(() => 'hello');
fn.set(() => () => 'world'); // Correct - wrap in updater
// fn.set(() => 'world') // Wrong - would execute function
```

**Performance Tips**:

- Signals are very cheap to create - don't hesitate to use many fine-grained signals
- Prefer updater functions (`count.set(c => c + 1)`) over reading then setting
- Use `peek()` when you need to read a value without creating a dependency
- For objects/arrays, only spread/copy the parts that changed to minimize allocations
- Signal updates are synchronous but batched automatically in event handlers

**TypeScript Tips**:

```typescript
// Explicit typing
const count = signal<number>(0);
const user = signal<User | null>(null);

// Union types
const status = signal<'idle' | 'loading' | 'success' | 'error'>('idle');

// Generic signals
function createToggle<T>(initialValue: T, otherValue: T) {
  const value = signal(initialValue);
  const toggle = () => value.set(v => v === initialValue ? otherValue : initialValue);
  return [value, toggle] as const;
}
```

**Common Pitfalls**:

- Forgetting to call the signal: `console.log(count)` instead of `console.log(count())`
- Mutating objects/arrays instead of creating new ones
- Using `.set()` with the same reference and expecting an update
- Creating signals inside loops or conditionals in components

**See also**: [memo()](#memo), [effect()](#effect), [linkedSignal()](#linkedsignal)

---

### memo()

**Signature**:
```typescript
function memo<T>(calc: () => T): Memo<T>

interface Memo<T> {
  (): T; // Read computed value
}
```

**Description**: Create a memoized computed value that automatically tracks dependencies and only re-computes when dependencies change. The computation is lazy - it only runs when the memo is read. Memos cache their result until dependencies change.

**Examples**:

```typescript
import { signal, memo } from '@philjs/core';

// Example 1: Simple derived value
const count = signal(5);
const doubled = memo(() => count() * 2);

console.log(doubled()); // 10 - runs computation
console.log(doubled()); // 10 - uses cached value
count.set(10);
console.log(doubled()); // 20 - recomputes

// Example 2: Multiple dependencies
const firstName = signal('John');
const lastName = signal('Doe');
const fullName = memo(() => `${firstName()} ${lastName()}`);

console.log(fullName()); // "John Doe"
firstName.set('Jane');
console.log(fullName()); // "Jane Doe"

// Example 3: Expensive computation with filtering
const todos = signal([
  { id: 1, text: 'Learn PhilJS', done: false },
  { id: 2, text: 'Build app', done: true },
  { id: 3, text: 'Deploy', done: false }
]);

const activeTodos = memo(() => {
  console.log('Computing active todos...');
  return todos().filter(t => !t.done);
});

const completedCount = memo(() => {
  console.log('Computing completed count...');
  return todos().filter(t => t.done).length;
});

console.log(activeTodos()); // Logs computation, returns 2 items
console.log(activeTodos()); // Uses cache, no log
console.log(completedCount()); // Logs computation, returns 1

// Example 4: Chaining memos
const a = signal(2);
const b = signal(3);
const sum = memo(() => a() + b());
const product = memo(() => sum() * 2);
const formatted = memo(() => `Result: ${product()}`);

console.log(formatted()); // "Result: 10"
a.set(5);
console.log(formatted()); // "Result: 16" - entire chain recomputes

// Example 5: Conditional dependencies
const showDetails = signal(false);
const data = signal({ basic: 'info', detailed: 'more info' });

const display = memo(() => {
  const basic = data().basic;
  if (showDetails()) {
    return `${basic} - ${data().detailed}`;
  }
  return basic;
});

console.log(display()); // "info"
data.set({ basic: 'info', detailed: 'updated' }); // Doesn't recompute - detailed not accessed
showDetails.set(true);
console.log(display()); // "info - updated"

// Example 6: Using untrack for non-reactive reads
import { untrack } from '@philjs/core';

const multiplier = signal(2);
const value = signal(5);
const result = memo(() => {
  const m = untrack(() => multiplier()); // Not tracked
  return value() * m; // Only value is tracked
});

console.log(result()); // 10
multiplier.set(3);
console.log(result()); // 10 - no recompute
value.set(10);
console.log(result()); // 30 - recomputes (uses new multiplier value)
```

**Edge Cases**:

```typescript
// 1. Memos are lazy - don't compute until read
const expensive = memo(() => {
  console.log('Computing...');
  return Math.random();
});
// No log yet - not computed

console.log(expensive()); // Logs "Computing...", returns value
console.log(expensive()); // No log - cached

// 2. Memos detect all dependencies automatically
const a = signal(1);
const b = signal(2);
const c = signal(3);

const complex = memo(() => {
  const result = a();
  if (result > 0) {
    return b();
  }
  return c();
});

console.log(complex()); // Reads a and b, not c
c.set(10); // Doesn't trigger recompute
b.set(20); // Triggers recompute

// 3. Memos can return different types
const count = signal(0);
const status = memo(() => {
  const c = count();
  if (c === 0) return null;
  if (c < 0) return { type: 'negative', value: c };
  return { type: 'positive', value: c };
});

// 4. Diamond dependency problem - handled correctly
const source = signal(1);
const a = memo(() => source() * 2);
const b = memo(() => source() + 10);
const combined = memo(() => a() + b());

console.log(combined()); // 13 (2 + 11)
source.set(2);
console.log(combined()); // 16 - only recomputes once, not twice
```

**Performance Tips**:

- Use memos for expensive computations that depend on signals
- Memos automatically deduplicate updates in diamond dependency graphs
- Don't create memos for trivial computations - direct access is faster
- Memos are garbage collected when no longer referenced
- Consider using memos instead of effects for derived state

**When to use memo() vs signal()**:

```typescript
// Use signal for:
const userInput = signal(''); // User-controlled state
const isOpen = signal(false); // Toggle state
const items = signal([]); // Mutable list

// Use memo for:
const filteredItems = memo(() => items().filter(i => i.active)); // Derived data
const itemCount = memo(() => items().length); // Computed property
const isValid = memo(() => userInput().length > 0); // Validation
```

**TypeScript Tips**:

```typescript
// Memos infer return type
const count = signal(5);
const doubled = memo(() => count() * 2); // Memo<number>

// Explicit typing
interface User { name: string; age: number }
const user = signal<User | null>(null);
const userName = memo((): string => user()?.name ?? 'Guest');

// Complex return types
const status = memo((): 'loading' | 'ready' | 'error' => {
  // ... logic
  return 'ready';
});
```

**Common Pitfalls**:

- Creating memos inside components on every render (create once outside or use module-level)
- Not calling the memo: `{doubled}` instead of `{doubled()}`
- Using effects instead of memos for derived state
- Forgetting memos are lazy (they won't run until accessed)

**See also**: [signal()](#signal), [effect()](#effect), [untrack()](#untrack)

---

### linkedSignal()

**Signature**:
```typescript
function linkedSignal<T>(
  computation: () => T,
  options?: { resetOnChange?: boolean }
): LinkedSignal<T>

interface LinkedSignal<T> {
  (): T;                                    // Read value
  set: (next: T | ((prev: T) => T)) => void; // Override value
  reset: () => void;                        // Reset to computed value
  isOverridden: () => boolean;              // Check if manually set
}
```

**Description**: Create a writable computed signal (similar to Angular's `linkedSignal`). Acts like a memo by default, but can be manually overridden. When dependencies change, it resets to the computed value unless `resetOnChange: false` is set.

**Examples**:

```typescript
import { signal, linkedSignal } from '@philjs/core';

// Example 1: Two-way binding with computed default
const firstName = signal('John');
const lastName = signal('Doe');
const fullName = linkedSignal(() => `${firstName()} ${lastName()}`);

console.log(fullName()); // "John Doe"
console.log(fullName.isOverridden()); // false

// Manual override
fullName.set('Jane Smith');
console.log(fullName()); // "Jane Smith"
console.log(fullName.isOverridden()); // true

// Dependency change resets to computed value
firstName.set('Bob');
console.log(fullName()); // "Bob Doe"
console.log(fullName.isOverridden()); // false

// Example 2: Controlled input with external source
const externalValue = signal(100);
const inputValue = linkedSignal(() => externalValue().toString());

// User types in input
inputValue.set('150'); // Local override

// External update resets input
externalValue.set(200);
console.log(inputValue()); // "200" - reset to computed

// Example 3: Persistent override with resetOnChange: false
const defaultTheme = signal<'light' | 'dark'>('light');
const userTheme = linkedSignal(
  () => defaultTheme(),
  { resetOnChange: false }
);

console.log(userTheme()); // "light"
userTheme.set('dark'); // User preference
console.log(userTheme.isOverridden()); // true

// Default changes but user preference persists
defaultTheme.set('light');
console.log(userTheme()); // "dark" - still overridden!

// Manual reset to follow default again
userTheme.reset();
console.log(userTheme()); // "light"
console.log(userTheme.isOverridden()); // false

// Example 4: Form field with smart defaults
const userAge = signal<number | null>(null);
const ageInput = linkedSignal(() => {
  const age = userAge();
  return age !== null ? age.toString() : '';
});

console.log(ageInput()); // ""
ageInput.set('25'); // User typing

// Load user data
userAge.set(30);
console.log(ageInput()); // "30" - reset to loaded data

// Example 5: Derived state with temporary overrides
const items = signal([1, 2, 3, 4, 5]);
const pageSize = signal(10);
const visibleItems = linkedSignal(() =>
  items().slice(0, pageSize())
);

console.log(visibleItems()); // [1, 2, 3, 4, 5]

// Temporarily show fewer items
visibleItems.set([1, 2]);
console.log(visibleItems()); // [1, 2]

// Items change - back to computed
items.set([6, 7, 8]);
console.log(visibleItems()); // [6, 7, 8]

// Example 6: Complex transformation with override
interface Product {
  id: number;
  name: string;
  price: number;
}

const products = signal<Product[]>([
  { id: 1, name: 'Widget', price: 10 },
  { id: 2, name: 'Gadget', price: 20 }
]);

const sortedProducts = linkedSignal(() =>
  [...products()].sort((a, b) => a.price - b.price)
);

console.log(sortedProducts()[0].name); // "Widget"

// Custom sort override
sortedProducts.set([...products()].sort((a, b) =>
  a.name.localeCompare(b.name)
));

console.log(sortedProducts()[0].name); // "Gadget"

// Products update - back to price sort
products.set([
  { id: 3, name: 'Doohickey', price: 5 },
  ...products()
]);
console.log(sortedProducts()[0].name); // "Doohickey"
```

**Edge Cases**:

```typescript
// 1. resetOnChange behavior
const source = signal(1);
const linked = linkedSignal(() => source() * 2, { resetOnChange: false });

linked.set(100); // Override
source.set(2); // Dependency changed
console.log(linked()); // 100 - still overridden
console.log(linked.isOverridden()); // true

// 2. Calling reset() when not overridden is safe
const count = signal(5);
const doubled = linkedSignal(() => count() * 2);
doubled.reset(); // No-op, already at computed value

// 3. Setting to the same value as computed doesn't mark as overridden
const a = signal(10);
const b = linkedSignal(() => a());
b.set(10); // Same as computed value - still not overridden!
console.log(b.isOverridden()); // false

// 4. Multiple dependencies
const x = signal(1);
const y = signal(2);
const sum = linkedSignal(() => x() + y());

sum.set(10); // Override
x.set(5); // Any dependency change resets
console.log(sum()); // 7 (5 + 2), not 10
```

**Performance Tips**:

- Linked signals have similar performance to memos when not overridden
- Use `resetOnChange: false` when override should persist across dependency updates
- Check `isOverridden()` before making decisions based on the value's source
- Prefer regular signals if you never need the computed behavior
- Prefer memos if you never need to override the value

**Use Cases**:

```typescript
// 1. Controlled components with external data
const apiData = signal(null);
const formData = linkedSignal(() => apiData() ?? getDefaults());

// 2. Temporary UI overrides
const systemLocale = signal('en-US');
const userLocale = linkedSignal(() => systemLocale());
// User can override, but system changes reset it

// 3. Editable computed values
const items = signal([1, 2, 3]);
const average = linkedSignal(() =>
  items().reduce((a, b) => a + b, 0) / items().length
);
// Can manually set average, but item changes recompute it

// 4. Smart form defaults
const savedValue = signal<string | null>(null);
const inputValue = linkedSignal(() => savedValue() ?? 'default');
```

**TypeScript Tips**:

```typescript
// Type inference works automatically
const count = signal(5);
const doubled = linkedSignal(() => count() * 2); // LinkedSignal<number>

// Explicit typing
interface User { name: string }
const defaultUser = signal<User>({ name: 'Guest' });
const currentUser = linkedSignal<User>(() => defaultUser());

// Options parameter
const value = linkedSignal<number>(
  () => 42,
  { resetOnChange: false }
);
```

**Common Pitfalls**:

- Forgetting that dependency changes reset overrides (unless `resetOnChange: false`)
- Not checking `isOverridden()` when you need to know the value's source
- Using linkedSignal when a regular signal or memo would be simpler
- Expecting overrides to persist after dependency changes with default options

**See also**: [signal()](#signal), [memo()](#memo), [effect()](#effect)

---

### effect()

**Signature**:
```typescript
function effect(fn: () => void | EffectCleanup): EffectCleanup

type EffectCleanup = () => void
```

**Description**: Create a side effect that automatically tracks reactive dependencies and re-runs when they change. The effect runs immediately when created and whenever its dependencies update. Returns a cleanup function to dispose the effect.

**Examples**:

```typescript
import { signal, effect } from '@philjs/core';

// Example 1: Simple logging effect
const count = signal(0);

effect(() => {
  console.log('Count is:', count());
});
// Logs: "Count is: 0"

count.set(5);
// Logs: "Count is: 5"

// Example 2: Effect with cleanup
const isActive = signal(false);

effect(() => {
  if (isActive()) {
    console.log('Starting timer...');
    const id = setInterval(() => console.log('tick'), 1000);

    // Cleanup runs before next execution or when disposed
    return () => {
      console.log('Stopping timer...');
      clearInterval(id);
    };
  }
});

isActive.set(true);
// Logs: "Starting timer...", then "tick" every second

isActive.set(false);
// Logs: "Stopping timer..." - cleanup runs

// Example 3: Manual disposal
const name = signal('Alice');

const dispose = effect(() => {
  console.log('Hello,', name());
});
// Logs: "Hello, Alice"

name.set('Bob');
// Logs: "Hello, Bob"

dispose(); // Stop the effect
name.set('Charlie');
// No log - effect is disposed

// Example 4: Multiple dependencies
const firstName = signal('John');
const lastName = signal('Doe');

effect(() => {
  console.log('Full name:', firstName(), lastName());
});
// Logs: "Full name: John Doe"

firstName.set('Jane');
// Logs: "Full name: Jane Doe"

lastName.set('Smith');
// Logs: "Full name: Jane Smith"

// Example 5: DOM synchronization
const items = signal(['Apple', 'Banana', 'Cherry']);
const listElement = document.querySelector('#list');

effect(() => {
  const html = items()
    .map(item => `<li>${item}</li>`)
    .join('');
  listElement.innerHTML = html;
});

// Example 6: API calls with cleanup
const userId = signal<number | null>(null);
const userData = signal<User | null>(null);
const isLoading = signal(false);

effect(() => {
  const id = userId();
  if (id === null) return;

  isLoading.set(true);
  let cancelled = false;

  fetch(`/api/users/${id}`)
    .then(r => r.json())
    .then(data => {
      if (!cancelled) {
        userData.set(data);
        isLoading.set(false);
      }
    });

  return () => {
    cancelled = true; // Cancel pending request
  };
});

// Example 7: Conditional dependencies
const showAdvanced = signal(false);
const basicValue = signal(10);
const advancedValue = signal(20);

effect(() => {
  console.log('Basic:', basicValue());

  if (showAdvanced()) {
    console.log('Advanced:', advancedValue());
  }
});
// Logs: "Basic: 10"

advancedValue.set(30); // No log - not tracked yet
showAdvanced.set(true);
// Logs: "Basic: 10", "Advanced: 30"

advancedValue.set(40);
// Logs: "Basic: 10", "Advanced: 40" - now tracked
```

**Edge Cases**:

```typescript
// 1. Effects run immediately
let runCount = 0;
effect(() => {
  runCount++;
  console.log('Run', runCount);
});
// Logs: "Run 1" - immediate execution
console.log(runCount); // 1

// 2. Cleanup from previous run happens before next run
const state = signal(0);
effect(() => {
  console.log('Effect:', state());
  return () => console.log('Cleanup:', state.peek());
});
// Logs: "Effect: 0"

state.set(1);
// Logs: "Cleanup: 1", then "Effect: 1"

// 3. Infinite loops are possible - be careful!
const counter = signal(0);
// DON'T DO THIS:
// effect(() => {
//   counter.set(counter() + 1); // Infinite loop!
// });

// 4. No dependencies means effect runs once
effect(() => {
  console.log('This runs only once');
  // No signals accessed
});

// 5. Disposing during execution is safe
let dispose: EffectCleanup;
dispose = effect(() => {
  if (someCondition) {
    dispose(); // Can dispose itself
  }
});
```

**Advanced Patterns**:

```typescript
// 1. Using onCleanup for multiple cleanup tasks
import { onCleanup } from '@philjs/core';

effect(() => {
  const ws = new WebSocket('ws://localhost:8080');

  onCleanup(() => ws.close());
  onCleanup(() => console.log('Cleanup 1'));
  onCleanup(() => console.log('Cleanup 2'));

  // All cleanup functions will run
});

// 2. Debouncing with effects
const searchTerm = signal('');
const debouncedSearch = signal('');

effect(() => {
  const term = searchTerm();
  const timeoutId = setTimeout(() => {
    debouncedSearch.set(term);
  }, 300);

  return () => clearTimeout(timeoutId);
});

// 3. Syncing to localStorage
const theme = signal<'light' | 'dark'>('light');

effect(() => {
  localStorage.setItem('theme', theme());
});

// 4. Tracking effect dependencies manually
const deps: string[] = [];
const a = signal('a');
const b = signal('b');

effect(() => {
  deps.length = 0;
  deps.push(a(), b());
  console.log('Dependencies:', deps);
});
```

**Performance Tips**:

- Effects are lightweight - don't worry about having many small effects
- Use `untrack()` to read signals without creating dependencies
- Prefer memos over effects for derived state
- Keep effect logic minimal - extract complex computations to memos
- Dispose effects when no longer needed to prevent memory leaks

**When to use effect() vs memo()**:

```typescript
// Use effect for side effects:
effect(() => {
  console.log(count()); // Logging
  document.title = `Count: ${count()}`; // DOM updates
  localStorage.setItem('count', count().toString()); // Storage
  fetch('/api/track', { method: 'POST' }); // API calls
});

// Use memo for derived values:
const doubled = memo(() => count() * 2); // Computation
const isValid = memo(() => input().length > 0); // Validation
const filtered = memo(() => items().filter(i => i.active)); // Filtering
```

**TypeScript Tips**:

```typescript
// Effects don't need type annotations usually
effect(() => {
  console.log(count()); // Types inferred
});

// Cleanup function is typed automatically
effect((): EffectCleanup => {
  const id = setInterval(() => {}, 1000);
  return () => clearInterval(id);
});

// Can return void or cleanup function
effect(() => {
  if (someCondition()) {
    return () => console.log('cleanup');
  }
  // No return is fine
});
```

**Common Pitfalls**:

- Creating infinite loops by updating signals read in the same effect
- Forgetting to return cleanup functions for timers/subscriptions
- Using effects for derived state instead of memos
- Not disposing effects in components that unmount
- Accessing signals conditionally and expecting them to always be tracked

**See also**: [signal()](#signal), [memo()](#memo), [onCleanup()](#oncleanup), [untrack()](#untrack)

---

### batch()

**Signature**:
```typescript
function batch<T>(fn: () => T): T
```

**Description**: Batch multiple signal updates into a single update cycle to prevent unnecessary re-computations. All signal updates within the batch function are collected and subscribers are notified only once after the batch completes. Returns the value returned by the batch function.

**Examples**:

```typescript
import { signal, batch, effect } from '@philjs/core';

// Example 1: Batching multiple updates
const firstName = signal('John');
const lastName = signal('Doe');

let effectRuns = 0;
effect(() => {
  effectRuns++;
  console.log('Name:', firstName(), lastName());
});
// Logs: "Name: John Doe"
console.log('Effect runs:', effectRuns); // 1

// Without batch - triggers effect twice
firstName.set('Jane');
lastName.set('Smith');
console.log('Effect runs:', effectRuns); // 3

// With batch - triggers effect once
batch(() => {
  firstName.set('Alice');
  lastName.set('Jones');
});
console.log('Effect runs:', effectRuns); // 4 (not 5!)

// Example 2: Batching array operations
const items = signal([1, 2, 3]);
const total = signal(0);

effect(() => {
  console.log('Total:', total(), 'Items:', items().length);
});

batch(() => {
  items.set([...items(), 4, 5, 6]);
  total.set(items().reduce((a, b) => a + b, 0));
});
// Effect runs once with final values

// Example 3: Nested batches
const a = signal(0);
const b = signal(0);
const c = signal(0);

effect(() => {
  console.log('Values:', a(), b(), c());
});

batch(() => {
  a.set(1);
  batch(() => {
    b.set(2);
    c.set(3);
  });
});
// Effect runs once after outer batch completes

// Example 4: Returning values from batch
const x = signal(5);
const y = signal(10);

const sum = batch(() => {
  x.set(20);
  y.set(30);
  return x() + y();
});
console.log(sum); // 50

// Example 5: Error handling in batch
const value = signal(0);

try {
  batch(() => {
    value.set(1);
    throw new Error('Something went wrong');
    value.set(2); // Never executes
  });
} catch (e) {
  console.log('Error caught, value is:', value()); // 1
}
// Updates before error are applied

// Example 6: Form submission batching
interface FormData {
  email: string;
  password: string;
  rememberMe: boolean;
}

const email = signal('');
const password = signal('');
const rememberMe = signal(false);
const isValid = signal(false);
const errors = signal<string[]>([]);

function handleSubmit(data: FormData) {
  batch(() => {
    email.set(data.email);
    password.set(data.password);
    rememberMe.set(data.rememberMe);

    // Validation
    const newErrors: string[] = [];
    if (!data.email) newErrors.push('Email required');
    if (!data.password) newErrors.push('Password required');

    errors.set(newErrors);
    isValid.set(newErrors.length === 0);
  });
  // All effects run once with consistent state
}
```

**Edge Cases**:

```typescript
// 1. Batching is automatic in event handlers
const count = signal(0);

effect(() => console.log('Count:', count()));

button.onclick = () => {
  // These are automatically batched!
  count.set(c => c + 1);
  count.set(c => c + 1);
  count.set(c => c + 1);
  // Effect runs once with final value
};

// 2. Reading signals during batch sees latest value
const a = signal(1);
const b = signal(2);

batch(() => {
  a.set(10);
  console.log(a()); // 10 - reads latest value
  b.set(a() + 5); // Uses 10, not 1
});
console.log(b()); // 15

// 3. Empty batch is valid
batch(() => {
  // No signal updates
}); // No-op, no updates triggered

// 4. Batch with no signal reads is fine
let sideEffect = 0;
batch(() => {
  sideEffect = 42; // Regular code
});
```

**Advanced Patterns**:

```typescript
// 1. Coordinated multi-signal updates
const position = signal({ x: 0, y: 0 });
const velocity = signal({ x: 0, y: 0 });
const acceleration = signal({ x: 0, y: 0 });

function updatePhysics(dt: number) {
  batch(() => {
    const v = velocity();
    const a = acceleration();

    velocity.set({
      x: v.x + a.x * dt,
      y: v.y + a.y * dt
    });

    const newV = velocity();
    position.set({
      x: position().x + newV.x * dt,
      y: position().y + newV.y * dt
    });
  });
}

// 2. Transaction-like updates
function updateUserProfile(updates: Partial<User>) {
  const result = batch(() => {
    try {
      if (updates.email) email.set(updates.email);
      if (updates.name) name.set(updates.name);
      if (updates.age) age.set(updates.age);

      validate(); // Throws if invalid
      return { success: true };
    } catch (error) {
      return { success: false, error };
    }
  });

  return result;
}

// 3. Batch with async operations (be careful!)
const status = signal('idle');
const data = signal(null);

// Note: batch only batches synchronous updates
batch(() => {
  status.set('loading');

  // This runs after batch completes!
  fetch('/api/data').then(result => {
    // Not batched with status.set('loading')
    data.set(result);
    status.set('ready');
  });
});
```

**Performance Tips**:

- Use batch when updating multiple related signals together
- Batching is automatic in event handlers - manual batching usually not needed
- Nested batches are flattened - inner batches don't trigger updates
- Don't over-batch - it's fine to let signals update individually in most cases
- Batching only affects when subscribers run, not when signal values update

**When to use batch()**:

```typescript
// Use batch when:
// 1. Updating multiple related signals
batch(() => {
  x.set(1);
  y.set(2);
  z.set(3);
});

// 2. Initializing state
batch(() => {
  loadUserData(data);
});

// 3. Complex state transitions
batch(() => {
  if (condition) {
    a.set(1);
    b.set(2);
  } else {
    a.set(3);
    b.set(4);
  }
});

// Don't use batch for:
// 1. Single signal update
count.set(5); // No batch needed

// 2. Unrelated updates
email.set('test@example.com'); // These don't need
setTimeout(() => status.set('ready'), 1000); // to be batched

// 3. Already batched contexts (event handlers)
button.onclick = () => {
  // Already batched automatically
  count.set(c => c + 1);
};
```

**TypeScript Tips**:

```typescript
// Batch can return typed values
interface Result {
  success: boolean;
  value?: number;
}

const result: Result = batch(() => {
  x.set(1);
  y.set(2);
  return { success: true, value: x() + y() };
});

// Works with generics
function batchUpdate<T>(updater: () => T): T {
  return batch(updater);
}
```

**Common Pitfalls**:

- Expecting async operations inside batch to be batched (they're not)
- Over-using batch when it's not needed
- Forgetting that reads inside batch see the latest value, not the batched value
- Not realizing event handlers are already automatically batched

**See also**: [signal()](#signal), [effect()](#effect), [memo()](#memo)

---

### untrack()

**Signature**:
```typescript
function untrack<T>(fn: () => T): T
```

**Description**: Run a function without tracking reactive dependencies. Any signals read within the untrack function will not be tracked as dependencies of the current reactive context (effect, memo, etc.). Returns the value returned by the function.

**Examples**:

```typescript
import { signal, memo, effect, untrack } from '@philjs/core';

// Example 1: Reading signals without creating dependencies
const a = signal(1);
const b = signal(2);

const sum = memo(() => {
  const aVal = a(); // Tracked
  const bVal = untrack(() => b()); // NOT tracked
  return aVal + bVal;
});

console.log(sum()); // 3
b.set(100);
console.log(sum()); // 3 - no recompute, b not tracked
a.set(5);
console.log(sum()); // 105 - recomputes, uses current b value

// Example 2: Conditional tracking in effects
const shouldTrack = signal(true);
const value = signal(0);

effect(() => {
  if (shouldTrack()) {
    console.log('Tracked:', value());
  } else {
    console.log('Untracked:', untrack(() => value()));
  }
});

value.set(1);
// Logs: "Tracked: 1" - effect re-runs

shouldTrack.set(false);
// Logs: "Untracked: 1" - effect re-runs

value.set(2);
// No log - value not tracked anymore

// Example 3: Reading configuration without dependencies
const isDarkMode = signal(false);
const config = signal({ theme: 'light', accentColor: 'blue' });

const theme = memo(() => {
  // Only track isDarkMode, not config
  const dark = isDarkMode();
  const cfg = untrack(() => config());
  return dark ? 'dark' : cfg.theme;
});

console.log(theme()); // "light"
config.set({ theme: 'custom', accentColor: 'red' });
console.log(theme()); // "light" - no recompute
isDarkMode.set(true);
console.log(theme()); // "dark" - recomputes

// Example 4: Logging without creating dependencies
const debugMode = signal(false);
const data = signal({ count: 0 });

effect(() => {
  const current = data();

  // Log without tracking debugMode
  if (untrack(() => debugMode())) {
    console.log('Debug:', current);
  }

  processData(current);
});

debugMode.set(true); // No effect re-run

// Example 5: Using peek() as alternative to untrack
const count = signal(5);

// These are equivalent:
const valueA = untrack(() => count());
const valueB = count.peek();

console.log(valueA === valueB); // true

// Example 6: Preventing unnecessary dependencies in complex memos
interface User {
  id: number;
  name: string;
  metadata: { lastSeen: Date };
}

const user = signal<User>({
  id: 1,
  name: 'Alice',
  metadata: { lastSeen: new Date() }
});

const userName = memo(() => {
  // Only track changes to the user object, not metadata
  const u = user();
  const meta = untrack(() => u.metadata);

  // If metadata changes, we don't care
  return u.name;
});

user.set({
  ...user(),
  metadata: { lastSeen: new Date() }
});
// userName doesn't recompute - metadata not tracked
```

**Edge Cases**:

```typescript
// 1. Nested untrack is redundant but safe
const x = signal(1);
const y = untrack(() => {
  return untrack(() => x()); // Inner untrack is redundant
});

// 2. Untrack doesn't prevent signal writes from triggering updates
const count = signal(0);
effect(() => console.log('Count:', count()));

untrack(() => {
  count.set(5); // Still triggers the effect!
});

// 3. Untrack in non-reactive context is a no-op
const value = signal(42);
const result = untrack(() => value()); // No reactive context, same as value()

// 4. Untracking doesn't affect inner reactive contexts
const a = signal(1);
const b = signal(2);

const outer = memo(() => {
  const aVal = a(); // Tracked by outer

  const inner = memo(() => {
    return b(); // Tracked by inner, not affected by outer's untrack
  });

  const bVal = untrack(() => b()); // Not tracked by outer
  return aVal + inner() + bVal;
});
```

**Advanced Patterns**:

```typescript
// 1. Selective dependency tracking
const items = signal([1, 2, 3, 4, 5]);
const filter = signal('');
const sortOrder = signal<'asc' | 'desc'>('asc');

const displayItems = memo(() => {
  const list = items();
  const filterText = filter();

  // Don't track sortOrder in this memo
  const order = untrack(() => sortOrder());

  return list
    .filter(item => item.toString().includes(filterText))
    .sort((a, b) => order === 'asc' ? a - b : b - a);
});

// 2. Performance optimization - avoid tracking expensive refs
const expensiveData = signal({ /* large object */ });
const trigger = signal(0);

const result = memo(() => {
  trigger(); // Track only trigger

  // Read expensive data without tracking
  const data = untrack(() => expensiveData());
  return processData(data);
});

// 3. Reading from external stores without tracking
const externalStore = signal({ userId: 1 });

effect(() => {
  const currentUserId = getCurrentUserId();

  // Check external store without tracking it
  if (untrack(() => externalStore().userId) !== currentUserId) {
    syncStore();
  }
});

// 4. Conditional computation with untrack
const enabled = signal(true);
const source = signal('data');

const processed = memo(() => {
  if (!enabled()) {
    // Return early with untracked value
    return untrack(() => source());
  }

  // Full computation when enabled
  return source().toUpperCase();
});
```

**Performance Tips**:

- Use untrack to prevent unnecessary re-computations when you know a signal's changes don't matter
- Prefer `signal.peek()` over `untrack(() => signal())` for readability
- Don't overuse untrack - explicit dependencies are usually better
- Untrack is useful for reading configuration that changes rarely
- Can significantly reduce computation in memos with many potential dependencies

**When to use untrack()**:

```typescript
// Use untrack when:

// 1. Reading config/settings that rarely change
const config = signal({ apiUrl: '/api' });
effect(() => {
  const url = untrack(() => config().apiUrl);
  fetch(url); // Don't re-fetch when config changes
});

// 2. Logging/debugging
effect(() => {
  const value = importantSignal();
  if (untrack(() => debugMode())) {
    console.log(value); // Don't track debugMode
  }
});

// 3. Reading metadata that doesn't affect computation
const data = signal({ value: 5, meta: { timestamp: Date.now() } });
const doubled = memo(() => {
  const d = data();
  untrack(() => console.log('Meta:', d.meta)); // Log without tracking
  return d.value * 2;
});

// 4. Optimizing complex memos
const complexMemo = memo(() => {
  const primary = primarySignal(); // Tracked
  const secondary = untrack(() => secondarySignal()); // Not tracked
  return expensive(primary, secondary);
});
```

**TypeScript Tips**:

```typescript
// Untrack preserves types
const count = signal<number>(5);
const value: number = untrack(() => count()); // Type is number

// Works with complex return types
interface User { name: string; age: number }
const user = signal<User>({ name: 'Alice', age: 30 });
const untrackedUser: User = untrack(() => user());

// Generic functions with untrack
function getUntracked<T>(signal: Signal<T>): T {
  return untrack(() => signal());
}
```

**Common Pitfalls**:

- Thinking untrack prevents writes from triggering updates (it doesn't)
- Overusing untrack and making dependency tracking unclear
- Not realizing `signal.peek()` is simpler for single signal reads
- Using untrack when you actually want the dependency tracking
- Forgetting that untracked reads still get the latest value

**See also**: [signal()](#signal), [effect()](#effect), [memo()](#memo), [batch()](#batch)

---

### onCleanup()

**Signature**: `(fn: () => void) => void`

**Description**: Register a cleanup function to run when the current reactive scope is disposed.

**Example**:
```typescript
import { onCleanup, effect } from '@philjs/core';

effect(() => {
  const id = setInterval(() => console.log('tick'), 1000);

  onCleanup(() => {
    clearInterval(id);
    console.log('Effect cleaned up');
  });
});
```

**See also**: [effect()](#effect), [createRoot()](#createroot)

---

### createRoot()

**Signature**: `<T>(fn: () => T) => T`

**Description**: Create a root reactive scope that won't be automatically disposed. Useful for creating persistent reactive contexts.

**Example**:
```typescript
import { createRoot, signal, effect } from '@philjs/core';

const cleanup = createRoot(() => {
  const count = signal(0);

  effect(() => {
    console.log(count());
  });

  return () => {
    // Manual cleanup logic
  };
});

// Later...
cleanup(); // Dispose of the root
```

**See also**: [effect()](#effect), [onCleanup()](#oncleanup)

---

## Rendering

### jsx()

**Signature**: `(type: string | Component, props: Props, ...children: any[]) => JSXElement`

**Description**: JSX pragma for creating virtual DOM elements. Automatically used by JSX transpiler.

**Example**:
```typescript
import { jsx } from '@philjs/core';

// Automatically used in JSX:
const element = <div className="container">Hello</div>;

// Equivalent to:
const element = jsx('div', { className: 'container' }, 'Hello');
```

**See also**: [Fragment](#fragment), [createElement()](#createelement)

---

### Fragment

**Signature**: `Symbol`

**Description**: Component for rendering multiple children without a wrapper element.

**Example**:
```typescript
import { Fragment } from '@philjs/core';

function List() {
  return (
    <Fragment>
      <li>Item 1</li>
      <li>Item 2</li>
      <li>Item 3</li>
    </Fragment>
  );
}
```

**See also**: [jsx()](#jsx)

---

### renderToString()

**Signature**: `(element: JSXElement) => string`

**Description**: Render a component tree to an HTML string for server-side rendering.

**Example**:
```typescript
import { renderToString } from '@philjs/core';

function App() {
  return <div>Hello World</div>;
}

const html = renderToString(<App />);
// Returns: "<div>Hello World</div>"
```

**See also**: [renderToStream()](#rendertostream), [hydrate()](#hydrate)

---

### renderToStream()

**Signature**: `(element: JSXElement) => ReadableStream<string>`

**Description**: Render a component tree to a streaming HTML response for optimized SSR.

**Example**:
```typescript
import { renderToStream } from '@philjs/core';

function App() {
  return <div>Hello World</div>;
}

const stream = renderToStream(<App />);
// Can be piped to HTTP response
```

**See also**: [renderToString()](#rendertostring), [hydrate()](#hydrate)

---

### hydrate()

**Signature**: `(element: JSXElement, container: HTMLElement) => void`

**Description**: Hydrate server-rendered HTML with client-side interactivity.

**Example**:
```typescript
import { hydrate } from '@philjs/core';

function App() {
  return <div>Hello World</div>;
}

hydrate(<App />, document.getElementById('root'));
```

**See also**: [render()](#render), [renderToString()](#rendertostring)

---

### render()

**Signature**: `(element: JSXElement, container: HTMLElement) => void`

**Description**: Render a component tree to a DOM container for client-side rendering.

**Example**:
```typescript
import { render } from '@philjs/core';

function App() {
  return <div>Hello World</div>;
}

render(<App />, document.getElementById('root'));
```

**See also**: [hydrate()](#hydrate)

---

## Resumability

### initResumability()

**Signature**: `() => void`

**Description**: Initialize the resumability system for zero-hydration startup.

**Example**:
```typescript
import { initResumability } from '@philjs/core';

// Call once at app startup
initResumability();
```

**See also**: [resume()](#resume), [resumable()](#resumable)

---

### getResumableState()

**Signature**: `() => ResumableState`

**Description**: Get the current resumable state for serialization.

**Example**:
```typescript
import { getResumableState } from '@philjs/core';

const state = getResumableState();
console.log(state.handlers, state.signals);
```

**See also**: [serializeResumableState()](#serializeresumablestate)

---

### serializeResumableState()

**Signature**: `(state: ResumableState) => string`

**Description**: Serialize resumable state to a string for embedding in HTML.

**Example**:
```typescript
import { getResumableState, serializeResumableState } from '@philjs/core';

const state = getResumableState();
const serialized = serializeResumableState(state);

// Embed in HTML:
const html = `<script>window.__RESUMABLE__=${serialized}</script>`;
```

**See also**: [getResumableState()](#getresumablestate), [resume()](#resume)

---

### resume()

**Signature**: `(serializedState: string) => void`

**Description**: Resume application from serialized state.

**Example**:
```typescript
import { resume } from '@philjs/core';

// On client:
const state = window.__RESUMABLE__;
resume(state);
```

**See also**: [initResumability()](#initresumability)

---

### resumable()

**Signature**: `<T extends Function>(fn: T) => T`

**Description**: Mark a function as resumable for automatic serialization.

**Example**:
```typescript
import { resumable } from '@philjs/core';

const handleClick = resumable(() => {
  console.log('Clicked!');
});

<button onClick={handleClick}>Click Me</button>
```

**See also**: [registerHandler()](#registerhandler)

---

### registerHandler()

**Signature**: `(name: string, handler: Function) => void`

**Description**: Register a named event handler for resumability.

**Example**:
```typescript
import { registerHandler } from '@philjs/core';

registerHandler('handleSubmit', (e) => {
  e.preventDefault();
  // Handle form submission
});
```

**See also**: [resumable()](#resumable)

---

### registerState()

**Signature**: `(name: string, value: any) => void`

**Description**: Register state for resumability serialization.

**Example**:
```typescript
import { registerState, signal } from '@philjs/core';

const count = signal(0);
registerState('count', count);
```

**See also**: [getResumableState()](#getresumablestate)

---

## Data Layer

### createQuery()

**Signature**: `<T>(queryFn: () => Promise<T>, options?: QueryOptions) => QueryResult<T>`

**Description**: Create a reactive data query with caching, refetching, and state management.

**Example**:
```typescript
import { createQuery } from '@philjs/core';

function UserProfile({ userId }) {
  const query = createQuery(() =>
    fetch(`/api/users/${userId}`).then(r => r.json()),
    {
      cacheKey: `user-${userId}`,
      staleTime: 60000, // 1 minute
    }
  );

  if (query.isLoading) return <Spinner />;
  if (query.isError) return <Error error={query.error} />;

  return <div>{query.data.name}</div>;
}
```

**See also**: [createMutation()](#createmutation), [queryCache](#querycache)

---

### createMutation()

**Signature**: `<T, V>(mutationFn: (variables: V) => Promise<T>, options?: MutationOptions) => MutationResult<T, V>`

**Description**: Create a mutation for data updates with optimistic updates and rollback.

**Example**:
```typescript
import { createMutation } from '@philjs/core';

function UpdateProfile() {
  const mutation = createMutation(
    (data) => fetch('/api/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
    {
      onSuccess: () => {
        console.log('Profile updated!');
      },
    }
  );

  const handleSubmit = () => {
    mutation.mutate({ name: 'Alice' });
  };

  return <button onClick={handleSubmit}>Update</button>;
}
```

**See also**: [createQuery()](#createquery), [invalidateQueries()](#invalidatequeries)

---

### queryCache

**Signature**: `QueryCache`

**Description**: Global query cache instance for managing query data.

**Example**:
```typescript
import { queryCache } from '@philjs/core';

// Access cached data
const data = queryCache.get('user-123');

// Set cache data
queryCache.set('user-123', userData);

// Clear cache
queryCache.clear();
```

**See also**: [createQuery()](#createquery), [invalidateQueries()](#invalidatequeries)

---

### invalidateQueries()

**Signature**: `(cacheKey?: string | string[]) => void`

**Description**: Invalidate cached queries to trigger refetching.

**Example**:
```typescript
import { invalidateQueries } from '@philjs/core';

// Invalidate specific query
invalidateQueries('user-123');

// Invalidate multiple queries
invalidateQueries(['user-123', 'posts-456']);

// Invalidate all queries
invalidateQueries();
```

**See also**: [createQuery()](#createquery), [queryCache](#querycache)

---

### prefetchQuery()

**Signature**: `<T>(cacheKey: string, queryFn: () => Promise<T>) => Promise<void>`

**Description**: Prefetch query data for improved performance.

**Example**:
```typescript
import { prefetchQuery } from '@philjs/core';

// Prefetch user data on hover
<Link
  href="/user/123"
  onMouseEnter={() =>
    prefetchQuery('user-123', () =>
      fetch('/api/users/123').then(r => r.json())
    )
  }
>
  View Profile
</Link>
```

**See also**: [createQuery()](#createquery)

---

## Context API

### createContext()

**Signature**: `<T>(defaultValue?: T) => Context<T>`

**Description**: Create a context for passing data through the component tree.

**Example**:
```typescript
import { createContext } from '@philjs/core';

const ThemeContext = createContext<'light' | 'dark'>('light');

function App() {
  return (
    <ThemeContext.Provider value="dark">
      <Header />
    </ThemeContext.Provider>
  );
}
```

**See also**: [useContext()](#usecontext), [createSignalContext()](#createsignalcontext)

---

### useContext()

**Signature**: `<T>(context: Context<T>) => T`

**Description**: Access the current value of a context.

**Example**:
```typescript
import { useContext } from '@philjs/core';

function Header() {
  const theme = useContext(ThemeContext);
  return <header className={theme}>...</header>;
}
```

**See also**: [createContext()](#createcontext)

---

### createSignalContext()

**Signature**: `<T>(initialValue: T) => SignalContext<T>`

**Description**: Create a reactive context that automatically updates subscribers.

**Example**:
```typescript
import { createSignalContext } from '@philjs/core';

const CountContext = createSignalContext(0);

function App() {
  return (
    <CountContext.Provider value={signal(0)}>
      <Counter />
    </CountContext.Provider>
  );
}

function Counter() {
  const count = useContext(CountContext);
  return <div>{count()}</div>;
}
```

**See also**: [createContext()](#createcontext), [signal()](#signal)

---

### createThemeContext()

**Signature**: `(themes: Record<string, Theme>) => ThemeContext`

**Description**: Create a specialized context for theme management.

**Example**:
```typescript
import { createThemeContext } from '@philjs/core';

const ThemeContext = createThemeContext({
  light: { bg: '#fff', text: '#000' },
  dark: { bg: '#000', text: '#fff' },
});

function App() {
  return (
    <ThemeContext.Provider value="dark">
      <Content />
    </ThemeContext.Provider>
  );
}
```

**See also**: [createContext()](#createcontext)

---

### combineProviders()

**Signature**: `(providers: Provider[]) => Component`

**Description**: Combine multiple context providers into a single component.

**Example**:
```typescript
import { combineProviders } from '@philjs/core';

const AppProviders = combineProviders([
  <ThemeContext.Provider value="dark" />,
  <UserContext.Provider value={user} />,
  <I18nProvider locale="en" />,
]);

function App() {
  return (
    <AppProviders>
      <Content />
    </AppProviders>
  );
}
```

**See also**: [createContext()](#createcontext)

---

## Animation & Motion

### createAnimatedValue()

**Signature**: `(initialValue: number, options?: AnimationOptions) => AnimatedValue`

**Description**: Create an animated value with spring physics or custom easing.

**Example**:
```typescript
import { createAnimatedValue } from '@philjs/core';

const x = createAnimatedValue(0, {
  spring: { tension: 170, friction: 26 },
});

x.set(100); // Animates to 100
```

**See also**: [easings](#easings), [FLIPAnimator](#flipanimator)

---

### easings

**Signature**: `Record<string, EasingFunction>`

**Description**: Collection of easing functions for animations.

**Example**:
```typescript
import { easings, createAnimatedValue } from '@philjs/core';

const opacity = createAnimatedValue(0, {
  duration: 300,
  easing: easings.easeInOut,
});
```

**See also**: [createAnimatedValue()](#createanimatedvalue)

---

### FLIPAnimator

**Signature**: `class FLIPAnimator`

**Description**: FLIP (First, Last, Invert, Play) animation helper for smooth layout transitions.

**Example**:
```typescript
import { FLIPAnimator } from '@philjs/core';

const animator = new FLIPAnimator();

// Before layout change
animator.capture(element);

// Apply layout change
element.style.transform = 'translateX(100px)';

// Animate the change
animator.play(element);
```

**See also**: [createAnimatedValue()](#createanimatedvalue)

---

### attachGestures()

**Signature**: `(element: HTMLElement, handlers: GestureHandlers) => () => void`

**Description**: Attach gesture event handlers (swipe, pinch, pan) to an element.

**Example**:
```typescript
import { attachGestures } from '@philjs/core';

const cleanup = attachGestures(element, {
  onSwipeLeft: () => console.log('Swiped left'),
  onSwipeRight: () => console.log('Swiped right'),
  onPinch: (scale) => console.log('Pinched:', scale),
});

// Later...
cleanup();
```

**See also**: [createAnimatedValue()](#createanimatedvalue)

---

### createParallax()

**Signature**: `(options: ParallaxOptions) => ParallaxController`

**Description**: Create a parallax scrolling effect.

**Example**:
```typescript
import { createParallax } from '@philjs/core';

const parallax = createParallax({
  speed: 0.5,
  direction: 'vertical',
});

<div ref={parallax.ref} style={{ transform: parallax.transform }}>
  Background Layer
</div>
```

**See also**: [createAnimatedValue()](#createanimatedvalue)

---

## Internationalization

### I18nProvider

**Signature**: `Component<I18nProviderProps>`

**Description**: Provider component for internationalization support.

**Example**:
```typescript
import { I18nProvider } from '@philjs/core';

const translations = {
  en: { hello: 'Hello' },
  es: { hello: 'Hola' },
};

function App() {
  return (
    <I18nProvider locale="en" translations={translations}>
      <Content />
    </I18nProvider>
  );
}
```

**See also**: [useI18n()](#usei18n), [useTranslation()](#usetranslation)

---

### useI18n()

**Signature**: `() => I18nContext`

**Description**: Access the i18n context for locale management.

**Example**:
```typescript
import { useI18n } from '@philjs/core';

function LanguageSwitcher() {
  const i18n = useI18n();

  return (
    <select
      value={i18n.locale()}
      onChange={(e) => i18n.setLocale(e.target.value)}
    >
      <option value="en">English</option>
      <option value="es">Español</option>
    </select>
  );
}
```

**See also**: [I18nProvider](#i18nprovider), [useTranslation()](#usetranslation)

---

### useTranslation()

**Signature**: `(namespace?: string) => TranslationFunction`

**Description**: Access translation function for the current locale.

**Example**:
```typescript
import { useTranslation } from '@philjs/core';

function Greeting() {
  const t = useTranslation();

  return <h1>{t('hello')}</h1>;
}
```

**See also**: [I18nProvider](#i18nprovider), [useI18n()](#usei18n)

---

## Error Boundaries

### ErrorBoundary

**Signature**: `Component<ErrorBoundaryProps>`

**Description**: Component for catching and handling errors in the component tree.

**Example**:
```typescript
import { ErrorBoundary } from '@philjs/core';

function App() {
  return (
    <ErrorBoundary fallback={(error) => <ErrorDisplay error={error} />}>
      <Content />
    </ErrorBoundary>
  );
}
```

**See also**: [setupGlobalErrorHandler()](#setupglobalerrorhandler), [errorRecovery()](#errorrecovery)

---

### setupGlobalErrorHandler()

**Signature**: `(handler: (error: Error, errorInfo: ErrorInfo) => void) => void`

**Description**: Set up a global error handler for unhandled errors.

**Example**:
```typescript
import { setupGlobalErrorHandler } from '@philjs/core';

setupGlobalErrorHandler((error, errorInfo) => {
  console.error('Global error:', error);
  // Send to error tracking service
});
```

**See also**: [ErrorBoundary](#errorboundary)

---

### errorRecovery()

**Signature**: `(error: Error) => ErrorSuggestion[]`

**Description**: Get recovery suggestions for common errors.

**Example**:
```typescript
import { errorRecovery } from '@philjs/core';

try {
  // Some code
} catch (error) {
  const suggestions = errorRecovery(error);
  console.log('Try:', suggestions);
}
```

**See also**: [ErrorBoundary](#errorboundary)

---

## Service Worker

### generateServiceWorker()

**Signature**: `(config: ServiceWorkerConfig) => string`

**Description**: Generate a service worker script with caching strategies.

**Example**:
```typescript
import { generateServiceWorker } from '@philjs/core';

const sw = generateServiceWorker({
  cacheStrategy: 'network-first',
  cacheName: 'my-app-v1',
});
```

**See also**: [registerServiceWorker()](#registerserviceworker)

---

### registerServiceWorker()

**Signature**: `(scriptURL: string, options?: RegistrationOptions) => Promise<ServiceWorkerRegistration>`

**Description**: Register a service worker for offline support.

**Example**:
```typescript
import { registerServiceWorker } from '@philjs/core';

if ('serviceWorker' in navigator) {
  registerServiceWorker('/sw.js').then(reg => {
    console.log('Service worker registered:', reg);
  });
}
```

**See also**: [generateServiceWorker()](#generateserviceworker)

---

## Performance & Intelligence

### performanceBudgets

**Signature**: `PerformanceBudgetManager`

**Description**: Monitor and enforce performance budgets for your application.

**Example**:
```typescript
import { performanceBudgets } from '@philjs/core';

performanceBudgets.setBudget('/', {
  fcp: 1500, // First Contentful Paint
  lcp: 2500, // Largest Contentful Paint
  tti: 3500, // Time to Interactive
});

const report = performanceBudgets.check('/');
```

**See also**: [PerformanceBudgetManager](#performancebudgetmanager)

---

### costTracker

**Signature**: `CostTracker`

**Description**: Track and estimate cloud infrastructure costs.

**Example**:
```typescript
import { costTracker } from '@philjs/core';

costTracker.trackRequest('/api/users', {
  computeTime: 100,
  bandwidth: 1024,
});

const estimate = costTracker.estimateCost();
console.log('Monthly cost:', estimate.monthly);
```

**See also**: [CostTracker](#costtracker)

---

### usageAnalytics

**Signature**: `UsageAnalytics`

**Description**: Analyze component usage and identify dead code.

**Example**:
```typescript
import { usageAnalytics } from '@philjs/core';

usageAnalytics.track('MyComponent');

const report = usageAnalytics.generateReport();
console.log('Unused components:', report.deadCode);
```

**See also**: [UsageAnalytics](#usageanalytics)

---

## Error Handling & Result

### Ok()

**Signature**: `<T>(value: T) => Result<T, never>`

**Description**: Create a successful Result value (Rust-style error handling).

**Example**:
```typescript
import { Ok, Err, matchResult } from '@philjs/core';

function divide(a: number, b: number) {
  if (b === 0) return Err('Division by zero');
  return Ok(a / b);
}

const result = divide(10, 2);
matchResult(result, {
  ok: (value) => console.log('Result:', value),
  err: (error) => console.error('Error:', error),
});
```

**See also**: [Err()](#err), [matchResult()](#matchresult)

---

### Err()

**Signature**: `<E>(error: E) => Result<never, E>`

**Description**: Create a failed Result value.

**Example**:
```typescript
import { Err, isErr } from '@philjs/core';

const result = Err('Something went wrong');

if (isErr(result)) {
  console.error('Error:', result.error);
}
```

**See also**: [Ok()](#ok), [isErr()](#iserr)

---

### isOk()

**Signature**: `<T, E>(result: Result<T, E>) => result is Ok<T>`

**Description**: Check if a Result is successful.

**Example**:
```typescript
import { Ok, isOk } from '@philjs/core';

const result = Ok(42);

if (isOk(result)) {
  console.log('Value:', result.value);
}
```

**See also**: [Ok()](#ok), [isErr()](#iserr)

---

### isErr()

**Signature**: `<T, E>(result: Result<T, E>) => result is Err<E>`

**Description**: Check if a Result is an error.

**Example**:
```typescript
import { Err, isErr } from '@philjs/core';

const result = Err('Failed');

if (isErr(result)) {
  console.error('Error:', result.error);
}
```

**See also**: [Err()](#err), [isOk()](#isok)

---

### map()

**Signature**: `<T, U, E>(result: Result<T, E>, fn: (value: T) => U) => Result<U, E>`

**Description**: Transform the value inside a successful Result.

**Example**:
```typescript
import { Ok, map } from '@philjs/core';

const result = Ok(5);
const doubled = map(result, (x) => x * 2);
// doubled = Ok(10)
```

**See also**: [mapErr()](#maperr), [andThen()](#andthen)

---

### mapErr()

**Signature**: `<T, E, F>(result: Result<T, E>, fn: (error: E) => F) => Result<T, F>`

**Description**: Transform the error inside a failed Result.

**Example**:
```typescript
import { Err, mapErr } from '@philjs/core';

const result = Err(404);
const mapped = mapErr(result, (code) => `Error ${code}`);
// mapped = Err('Error 404')
```

**See also**: [map()](#map), [andThen()](#andthen)

---

### andThen()

**Signature**: `<T, U, E>(result: Result<T, E>, fn: (value: T) => Result<U, E>) => Result<U, E>`

**Description**: Chain Result-returning operations.

**Example**:
```typescript
import { Ok, andThen } from '@philjs/core';

const parse = (s: string) => Ok(parseInt(s));
const validate = (n: number) => n > 0 ? Ok(n) : Err('Must be positive');

const result = andThen(parse('42'), validate);
```

**See also**: [map()](#map), [matchResult()](#matchresult)

---

### unwrap()

**Signature**: `<T, E>(result: Result<T, E>) => T`

**Description**: Extract the value from a Result, throwing if it's an error.

**Example**:
```typescript
import { Ok, unwrap } from '@philjs/core';

const result = Ok(42);
const value = unwrap(result); // 42
```

**See also**: [unwrapOr()](#unwrapor), [matchResult()](#matchresult)

---

### unwrapOr()

**Signature**: `<T, E>(result: Result<T, E>, defaultValue: T) => T`

**Description**: Extract the value from a Result, returning a default if it's an error.

**Example**:
```typescript
import { Err, unwrapOr } from '@philjs/core';

const result = Err('Failed');
const value = unwrapOr(result, 0); // 0
```

**See also**: [unwrap()](#unwrap), [matchResult()](#matchresult)

---

### matchResult()

**Signature**: `<T, E, R>(result: Result<T, E>, handlers: { ok: (value: T) => R; err: (error: E) => R }) => R`

**Description**: Pattern match on a Result value.

**Example**:
```typescript
import { Ok, Err, matchResult } from '@philjs/core';

const result = Ok(42);

const message = matchResult(result, {
  ok: (value) => `Success: ${value}`,
  err: (error) => `Error: ${error}`,
});
```

**See also**: [Ok()](#ok), [Err()](#err)

---

## Forms & Validation

### useForm()

**Signature**: `<T extends Record<string, any>>(schema: FormSchema<T>, options?: UseFormOptions) => FormApi<T>`

**Description**: Create a form with validation and state management.

**Example**:
```typescript
import { useForm, validators as v } from '@philjs/core';

function LoginForm() {
  const form = useForm({
    email: {
      initialValue: '',
      validators: [v.required(), v.email()],
    },
    password: {
      initialValue: '',
      validators: [v.required(), v.minLength(8)],
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (form.validate()) {
      console.log('Form data:', form.values());
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input {...form.field('email')} />
      {form.errors().email && <span>{form.errors().email}</span>}

      <input type="password" {...form.field('password')} />
      {form.errors().password && <span>{form.errors().password}</span>}

      <button type="submit">Submit</button>
    </form>
  );
}
```

**See also**: [validators](#validators), [createField()](#createfield)

---

### validators

**Signature**: `Record<string, ValidatorFactory>`

**Description**: Collection of built-in validators for form validation.

**Example**:
```typescript
import { validators as v } from '@philjs/core';

const validators = [
  v.required('This field is required'),
  v.email('Must be a valid email'),
  v.minLength(8, 'Must be at least 8 characters'),
  v.maxLength(100, 'Must be less than 100 characters'),
  v.pattern(/^[A-Z]/, 'Must start with uppercase'),
  v.custom((value) => value !== 'admin' || 'Username taken'),
];
```

**See also**: [useForm()](#useform)

---

### createField()

**Signature**: `<T>(initialValue: T, validators?: ValidationRule[]) => FieldProps<T>`

**Description**: Create a standalone form field with validation.

**Example**:
```typescript
import { createField, validators as v } from '@philjs/core';

const email = createField('', [v.required(), v.email()]);

<input
  value={email.value()}
  onChange={(e) => email.setValue(e.target.value)}
  onBlur={() => email.validate()}
/>
{email.error() && <span>{email.error()}</span>}
```

**See also**: [useForm()](#useform), [validators](#validators)

---

## Accessibility

For detailed accessibility APIs, see [Advanced: Accessibility](/docs/advanced/accessibility.md)

Key exports:
- `configureA11y()` - Configure accessibility settings
- `enhanceWithAria()` - Auto-generate ARIA labels
- `validateHeadingHierarchy()` - Validate heading structure
- `getContrastRatio()` - Calculate color contrast
- `auditAccessibility()` - Run full accessibility audit
- `createFocusManager()` - Manage keyboard focus
- `announceToScreenReader()` - Announce to screen readers

---

## A/B Testing

For detailed A/B testing APIs, see [Advanced: A/B Testing](/docs/advanced/ab-testing.md)

Key exports:
- `initABTesting()` - Initialize A/B testing engine
- `useExperiment()` - Assign users to variants
- `ABTest` - Component for A/B testing
- `useFeatureFlag()` - Feature flag management
- `calculateSignificance()` - Statistical analysis

---

## Partial Pre-rendering (PPR)

For detailed PPR APIs, see [Advanced: Partial Pre-rendering](/docs/advanced/ppr.md)

Key exports:
- `PPRBoundary` - Boundary component for PPR
- `staticShell()` - Mark content as static
- `dynamicContent()` - Mark content as dynamic
- `configurePPR()` - Configure PPR settings
- `renderWithPPR()` - Render with PPR support

---

## Activity Component

For detailed Activity Component APIs, see [Advanced: Activity Component](/docs/advanced/activity.md)

Key exports:
- `Activity` - Priority-based rendering component
- `useActivityState()` - Access activity state
- `createTabs()` - Tab-like activity management
- `configureActivity()` - Configure activity behavior

---

## Next Steps

- [Router API](/docs/api-reference/router.md) - Router APIs
- [Data API](/docs/api-reference/data.md) - Data fetching APIs
- [Advanced Topics](/docs/advanced/overview.md) - Advanced features

---

ℹ️ **Note**: All APIs are fully typed with TypeScript. See the TypeScript definitions for complete type information.
