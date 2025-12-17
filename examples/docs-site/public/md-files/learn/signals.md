# Signals

Signals are the core primitive of PhilJS's reactivity system. They hold a value that can change over time, and automatically notify any dependent code when they change.

## Creating Signals

```tsx playground
import { signal } from 'philjs-core';

// Create a signal with an initial value
const count = signal(0);
const name = signal('World');
const items = signal(['Apple', 'Banana']);
const user = signal({ name: 'John', age: 30 });

// Signals can hold any type
const isLoading = signal(true);
const selectedId = signal<number | null>(null);
```

## Reading Signals

Call a signal like a function to read its current value:

```tsx playground
import { signal } from 'philjs-core';

const count = signal(42);

// Read by calling
const value = count();  // 42

// Use in expressions
const doubled = count() * 2;  // 84

// Use in template literals
const message = `Count is ${count()}`;  // "Count is 42"

console.log(value, doubled, message);
```

## Writing Signals

Use `.set()` to update a signal's value:

```tsx playground
import { signal } from 'philjs-core';

const count = signal(0);

// Set to an absolute value
count.set(5);
console.log(count());  // 5

// Use an updater function to get previous value
count.set(prev => prev + 1);
console.log(count());  // 6

// Common pattern for toggling
const isOpen = signal(false);
isOpen.set(v => !v);
console.log(isOpen());  // true
```

## Signals in Components

Signals work seamlessly with JSX:

```tsx
function Counter() {
  const count = signal(0);

  return (
    <div>
      {/* Reading signal in JSX */}
      <p>Count: {count()}</p>

      {/* Updating signal in event handler */}
      <button onClick={() => count.set(c => c + 1)}>
        Increment
      </button>
    </div>
  );
}
```

## Object and Array Signals

For objects and arrays, remember that signals track the reference, not deep changes:

```tsx playground
import { signal } from 'philjs-core';

const user = signal({ name: 'John', age: 30 });

// Wrong - mutating doesn't trigger updates
// user().age = 31;

// Correct - create a new object
user.set(prev => ({ ...prev, age: 31 }));
console.log(user());

const items = signal(['a', 'b', 'c']);

// Wrong - push doesn't trigger updates
// items().push('d');

// Correct - create a new array
items.set(prev => [...prev, 'd']);
console.log(items());
```

## Signal Utilities

### LinkedSignal

Create signals that synchronize with another value:

```tsx playground
import { signal, linkedSignal } from 'philjs-core';

const source = signal(1);

// linkedSignal stays in sync with source but can be independently modified
const linked = linkedSignal({
  source: source,
  computation: (value) => value * 10
});

console.log(linked());  // 10

source.set(2);
console.log(linked());  // 20

// Can also be set independently
linked.set(100);
console.log(linked());  // 100
```

### Batch Updates

Group multiple signal updates to prevent unnecessary recalculations:

```tsx playground
import { signal, batch, effect } from 'philjs-core';

const firstName = signal('John');
const lastName = signal('Doe');

effect(() => {
  console.log(`Name: ${firstName()} ${lastName()}`);
});

// Without batch - effect runs twice
firstName.set('Jane');  // Effect runs
lastName.set('Smith');  // Effect runs again

// With batch - effect runs once
batch(() => {
  firstName.set('Bob');
  lastName.set('Johnson');
});  // Effect runs once
```

### Untrack

Read a signal without creating a dependency:

```tsx playground
import { signal, effect, untrack } from 'philjs-core';

const count = signal(0);
const other = signal(0);

effect(() => {
  // This effect only depends on count, not other
  console.log('count:', count(), 'other:', untrack(() => other()));
});

count.set(1);  // Effect runs
other.set(1);  // Effect does NOT run
```

## TypeScript Support

Signals have excellent TypeScript support:

```tsx
import { signal, Signal } from 'philjs-core';

// Type inference
const count = signal(0);  // Signal<number>
const name = signal('John');  // Signal<string>

// Explicit types
const items = signal<string[]>([]);
const user = signal<User | null>(null);

// Type for function parameters
function useCounter(initial: Signal<number>) {
  return {
    value: initial,
    increment: () => initial.set(v => v + 1),
  };
}
```

## Best Practices

### 1. Create Signals at Component Level

```tsx
// Good - signal created once when component mounts
function Counter() {
  const count = signal(0);
  return <p>{count()}</p>;
}

// Bad - creates signal on every render
function Bad() {
  return <p>{signal(0)()}</p>;
}
```

### 2. Use Updater Functions for Complex Updates

```tsx
// When update depends on current value
count.set(c => c + 1);  // ✓

// When setting to a known value
count.set(0);  // ✓
```

### 3. Prefer Immutable Updates

```tsx
// For objects
user.set(prev => ({ ...prev, name: 'Jane' }));

// For arrays - add
items.set(prev => [...prev, newItem]);

// For arrays - remove
items.set(prev => prev.filter(i => i.id !== idToRemove));

// For arrays - update
items.set(prev => prev.map(i =>
  i.id === id ? { ...i, done: true } : i
));
```

### 4. Use Signals for Shared State

```tsx
// shared-state.ts
export const theme = signal<'light' | 'dark'>('light');

// any-component.tsx
import { theme } from './shared-state';

function Header() {
  return (
    <header class={`theme-${theme()}`}>
      <button onClick={() => theme.set(t => t === 'light' ? 'dark' : 'light')}>
        Toggle Theme
      </button>
    </header>
  );
}
```

## Performance Tips

### Avoid Creating Signals in Loops

```tsx
// Bad - creates many signals
{items.map(item => {
  const isSelected = signal(false);  // Don't do this!
  return <Item item={item} selected={isSelected} />;
})}

// Good - manage selection state at parent level
function Parent() {
  const selectedIds = signal<Set<string>>(new Set());

  const isSelected = (id: string) =>
    selectedIds().has(id);

  const toggleSelected = (id: string) =>
    selectedIds.set(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  return items.map(item => (
    <Item
      item={item}
      selected={isSelected(item.id)}
      onToggle={() => toggleSelected(item.id)}
    />
  ));
}
```

### Use Batch for Multiple Updates

```tsx
// Better performance when updating multiple signals
batch(() => {
  firstName.set('New');
  lastName.set('Name');
  age.set(25);
  // All dependents update only once
});
```

## Next Steps

- [Memos](/docs/learn/memos) - Computed values
- [Effects](/docs/learn/effects) - Side effects
- [Context](/docs/learn/context) - Shared state across components
