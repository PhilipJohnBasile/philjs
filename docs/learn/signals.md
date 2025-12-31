# Signals - The Heart of PhilJS

Signals are PhilJS's reactive state primitive. They're the foundation of how your UI stays in sync with your data.

## What You'll Learn

- What signals are and why they matter
- Creating and using signals
- Reading and updating signal values
- Signal best practices
- Advanced signal patterns

## What is a Signal?

A signal is a container for a value that **notifies subscribers when it changes**.

```typescript
import { signal } from '@philjs/core';

const count = signal(0);

// Read the value by calling it
console.log(count()); // 0

// Update the value
count.set(1);

console.log(count()); // 1
```

**Think of it like this:** A signal is a box containing a value. When you change the value, everyone watching that box is automatically notified.

## Why Signals?

Compare signals to regular variables:

```typescript
// Regular variable
let count = 0;
count = 1; // Nothing happens - no one knows it changed

// Signal
const count = signal(0);
count.set(1); // All UI using count() automatically updates!
```

**Key benefits:**
- 🎯 **Automatic updates** - UI updates when signals change
- ⚡ **Fine-grained** - Only what uses the signal re-renders
- 🔍 **Trackable** - PhilJS knows what depends on what
- 💪 **Type-safe** - Full TypeScript support

## Creating Signals

Use `signal()` with an initial value:

```typescript
import { signal } from '@philjs/core';

// Primitive values
const count = signal(0);
const name = signal('Alice');
const isActive = signal(true);

// Objects
const user = signal({
  name: 'Alice',
  age: 30,
  email: 'alice@example.com'
});

// Arrays
const todos = signal([
  { id: 1, text: 'Learn PhilJS', done: false },
  { id: 2, text: 'Build an app', done: false }
]);

// null/undefined
const data = signal<Data | null>(null);
```

### TypeScript Inference

PhilJS infers types automatically:

```typescript
const count = signal(0); // Signal<number>
const name = signal('Alice'); // Signal<string>
const user = signal({ name: 'Bob', age: 25 }); // Signal<{ name: string; age: number }>
```

For complex types, specify explicitly:

```typescript
interface User {
  id: number;
  name: string;
  email: string;
}

const user = signal<User | null>(null);
const users = signal<User[]>([]);
```

## Reading Signal Values

Call the signal as a function:

```typescript
const count = signal(42);

// ✅ Correct - calling the signal
console.log(count()); // 42
const value = count();

// ❌ Wrong - not calling it
console.log(count); // [object Object]
```

**In JSX:**

```typescript
const name = signal('Alice');

// ✅ Correct
<h1>Hello, {name()}!</h1>

// ❌ Wrong
<h1>Hello, {name}!</h1> // Shows [object Object]
```

## Updating Signal Values

Use `.set()` to update:

### Direct Value

```typescript
const count = signal(0);

count.set(1);
count.set(2);
count.set(count() + 1); // Read current value, then set new one
```

### Updater Function

The better approach - use an updater function:

```typescript
const count = signal(0);

// ✅ Preferred - updater function
count.set(c => c + 1);
count.set(c => c * 2);

// ❌ Less preferred - reading then setting
count.set(count() + 1);
```

**Why updater functions?**
- Clearer intent
- Safer with async code
- Consistent with React patterns
- Prevents stale values

### Updating Objects

**Always create new objects** - don't mutate:

```typescript
const user = signal({ name: 'Alice', age: 30 });

// ❌ Wrong - mutation doesn't trigger updates!
user().age = 31;

// ✅ Correct - create new object
user.set({ ...user(), age: 31 });

// ✅ Also correct - updater function
user.set(u => ({ ...u, age: 31 }));
```

### Updating Arrays

Same rule - create new arrays:

```typescript
const todos = signal([
  { id: 1, text: 'Learn signals', done: false }
]);

// ❌ Wrong - mutation
todos().push({ id: 2, text: 'Build app', done: false });

// ✅ Correct - create new array
todos.set([...todos(), { id: 2, text: 'Build app', done: false }]);

// ✅ Removing items
todos.set(todos().filter(t => t.id !== 1));

// ✅ Updating an item
todos.set(
  todos().map(t =>
    t.id === 1 ? { ...t, done: true } : t
  )
);
```

## Signals in Components

Signals work great in components:

```typescript
import { signal } from '@philjs/core';

function Counter() {
  const count = signal(0);

  return (
    <div>
      <p>Count: {count()}</p>
      <button onClick={() => count.set(c => c + 1)}>Increment</button>
      <button onClick={() => count.set(c => c - 1)}>Decrement</button>
      <button onClick={() => count.set(0)}>Reset</button>
    </div>
  );
}
```

**What happens:**
1. Click "Increment"
2. `count.set()` updates the signal
3. Only the `<p>Count: {count()}</p>` text updates
4. The rest of the component doesn't re-render!

This is **fine-grained reactivity** in action.

## Sharing Signals Between Components

Signals can be passed as props:

```typescript
function Counter() {
  const count = signal(0);

  return (
    <div>
      <Display count={count} />
      <Controls count={count} />
    </div>
  );
}

function Display({ count }: { count: Signal<number> }) {
  return <div>Count: {count()}</div>;
}

function Controls({ count }: { count: Signal<number> }) {
  return (
    <div>
      <button onClick={() => count.set(c => c + 1)}>+</button>
      <button onClick={() => count.set(c => c - 1)}>-</button>
    </div>
  );
}
```

Both components share the same signal - when one updates it, the other sees the change!

### Module-Level Signals

For global state, create signals outside components:

```typescript
// store.ts
import { signal } from '@philjs/core';

export const user = signal<User | null>(null);
export const theme = signal<'light' | 'dark'>('light');
export const isAuthenticated = signal(false);

// Any component can import and use these
import { user, theme } from './store';

function Header() {
  return (
    <div>
      {user() ? `Welcome ${user()!.name}` : 'Please sign in'}
      <button onClick={() => theme.set(theme() === 'light' ? 'dark' : 'light')}>
        Toggle Theme
      </button>
    </div>
  );
}
```

## Signal Patterns

### Toggle Pattern

```typescript
const isOpen = signal(false);

// Toggle function
const toggle = () => isOpen.set(v => !v);

<button onClick={toggle}>
  {isOpen() ? 'Close' : 'Open'}
</button>
```

### Counter Pattern

```typescript
const count = signal(0);

const increment = () => count.set(c => c + 1);
const decrement = () => count.set(c => c - 1);
const reset = () => count.set(0);
```

### Form Input Pattern

```typescript
const email = signal('');
const password = signal('');

<form>
  <input
    type="email"
    value={email()}
    onInput={(e) => email.set(e.target.value)}
  />
  <input
    type="password"
    value={password()}
    onInput={(e) => password.set(e.target.value)}
  />
</form>
```

### Loading State Pattern

```typescript
const isLoading = signal(false);
const data = signal<Data | null>(null);
const error = signal<Error | null>(null);

async function fetchData() {
  isLoading.set(true);
  error.set(null);

  try {
    const result = await fetch('/api/data');
    data.set(await result.json());
  } catch (e) {
    error.set(e as Error);
  } finally {
    isLoading.set(false);
  }
}
```

### List Management Pattern

```typescript
const items = signal<Item[]>([]);

const addItem = (item: Item) => {
  items.set([...items(), item]);
};

const removeItem = (id: number) => {
  items.set(items().filter(item => item.id !== id));
};

const updateItem = (id: number, updates: Partial<Item>) => {
  items.set(
    items().map(item =>
      item.id === id ? { ...item, ...updates } : item
    )
  );
};

const clearItems = () => {
  items.set([]);
};
```

## Advanced Signal Techniques

### Conditional Updates

Only update if the value actually changed:

```typescript
const count = signal(0);

const setIfDifferent = (newValue: number) => {
  if (count() !== newValue) {
    count.set(newValue);
  }
};
```

### Batch Updates

Multiple signal updates happen efficiently:

```typescript
const firstName = signal('');
const lastName = signal('');
const email = signal('');

// All three updates are batched automatically
function updateUser(user: User) {
  firstName.set(user.firstName);
  lastName.set(user.lastName);
  email.set(user.email);
  // UI updates once, not three times!
}
```

### Derived Signals

Use memos for computed values (covered in detail in the Memos guide):

```typescript
import { signal, memo } from '@philjs/core';

const count = signal(0);

// Automatically recalculates when count changes
const doubled = memo(() => count() * 2);
const isEven = memo(() => count() % 2 === 0);

console.log(doubled()); // 0
count.set(5);
console.log(doubled()); // 10
console.log(isEven()); // false
```

## Performance Tips

### Signals Are Fast

Signals are extremely efficient:

```typescript
// ✅ This is fine - signals are cheap
const count = signal(0);
const isPositive = signal(false);
const lastUpdate = signal(Date.now());

// No performance concerns with many signals
```

### Avoid Unnecessary Objects

```typescript
// ❌ Less efficient - creates new object every time
count.set({ value: count().value + 1 });

// ✅ More efficient - simple number
count.set(c => c + 1);
```

### Granular Signals vs Large Objects

```typescript
// Option 1: One signal with object
const user = signal({ name: 'Alice', age: 30, email: 'alice@example.com' });

// Changing age requires spreading
user.set(u => ({ ...u, age: 31 }));

// Option 2: Separate signals
const userName = signal('Alice');
const userAge = signal(30);
const userEmail = signal('alice@example.com');

// Direct updates
userAge.set(31);

// Option 1 is better if properties usually change together
// Option 2 is better for independent properties
```

## Common Mistakes

### Forgetting to Call Signals

```typescript
const count = signal(0);

// ❌ Wrong
console.log(count); // [object Object]
<div>{count}</div> // [object Object]

// ✅ Correct
console.log(count()); // 0
<div>{count()}</div> // 0
```

### Mutating Signal Values

```typescript
const user = signal({ name: 'Alice' });

// ❌ Wrong - mutation doesn't trigger updates
user().name = 'Bob';

// ✅ Correct - create new object
user.set({ ...user(), name: 'Bob' });
```

### Not Using Updater Functions

```typescript
// ❌ Less safe
count.set(count() + 1);

// ✅ Safer and clearer
count.set(c => c + 1);
```

### Creating Signals in Loops

```typescript
// ❌ Wrong - creates new signal every render
function TodoList({ todos }) {
  return (
    <div>
      {todos.map(todo => {
        const isHovered = signal(false); // New signal each time!
        return <TodoItem key={todo.id} todo={todo} />;
      })}
    </div>
  );
}

// ✅ Correct - signal in the TodoItem component
function TodoItem({ todo }) {
  const isHovered = signal(false); // Stable signal
  return (
    <div
      onMouseEnter={() => isHovered.set(true)}
      onMouseLeave={() => isHovered.set(false)}
    >
      {todo.text}
    </div>
  );
}
```

## Debugging Signals

### Log Signal Values

```typescript
const count = signal(0);

// See current value
console.log('Current count:', count());

// Watch for changes (using effects, covered later)
effect(() => {
  console.log('Count changed to:', count());
});
```

### PhilJS DevTools

Use PhilJS DevTools to inspect all signals in your app:

```typescript
// Signals appear in DevTools automatically
const count = signal(0);
const user = signal({ name: 'Alice' });
```

DevTools shows:
- All active signals
- Current values
- Dependency graphs
- Update history

## When to Use Signals

✅ **Use signals for:**
- Component local state
- Shared state between components
- Global application state
- Form inputs
- UI state (modals, dropdowns, etc.)
- Derived values (with memos)

❌ **Don't use signals for:**
- Constants that never change
- Props passed to components (use props directly)
- Values that don't affect the UI

## Comparison to Other Frameworks

### vs React useState

```typescript
// React
const [count, setCount] = useState(0);
setCount(count + 1);

// PhilJS
const count = signal(0);
count.set(c => c + 1);
```

**Differences:**
- Signals can be used outside components
- Signals don't cause re-renders
- No hook rules with signals

### vs Vue ref

```typescript
// Vue
const count = ref(0);
count.value = 1;

// PhilJS
const count = signal(0);
count.set(1);
```

**Differences:**
- PhilJS uses functions: `count()` vs `count.value`
- PhilJS uses `.set()` for updates vs direct assignment

## Summary

You've learned:

✅ Signals are reactive containers for values
✅ Create with `signal(initialValue)`
✅ Read with `signal()`
✅ Update with `signal.set(newValue)` or `signal.set(updater)`
✅ Always create new objects/arrays, never mutate
✅ Signals can be local, shared, or global
✅ They're the foundation of PhilJS's reactivity

Signals are the most important concept in PhilJS. Master them and everything else falls into place!

---

**Next:** [Derived State with Memos →](./memos.md) Learn how to compute values from signals
