# Memos (Computed Values)

Memos are derived values that automatically recompute when their dependencies change. They cache their result, so they only recalculate when necessary.

## Creating Memos

```tsx playground
import { signal, memo } from 'philjs-core';

const count = signal(5);

// Memo automatically tracks that it depends on count
const doubled = memo(() => count() * 2);

console.log(doubled());  // 10

count.set(10);
console.log(doubled());  // 20
```

## Automatic Dependency Tracking

Unlike React's `useMemo`, you don't need to specify dependencies - PhilJS tracks them automatically:

```tsx playground
import { signal, memo } from 'philjs-core';

const firstName = signal('John');
const lastName = signal('Doe');

// Dependencies (firstName, lastName) are tracked automatically
const fullName = memo(() => `${firstName()} ${lastName()}`);

console.log(fullName());  // "John Doe"

firstName.set('Jane');
console.log(fullName());  // "Jane Doe"
```

## Caching Behavior

Memos cache their result and only recompute when dependencies change:

```tsx playground
import { signal, memo } from 'philjs-core';

const items = signal([1, 2, 3, 4, 5]);

let computeCount = 0;

const sum = memo(() => {
  computeCount++;
  console.log('Computing sum...');
  return items().reduce((a, b) => a + b, 0);
});

// First access - computes
console.log(sum());  // Computing sum... 15

// Second access - cached, no recompute
console.log(sum());  // 15

// Third access - still cached
console.log(sum());  // 15

console.log('Total computations:', computeCount);  // 1
```

## Chained Memos

Memos can depend on other memos, creating a reactive computation chain:

```tsx playground
import { signal, memo } from 'philjs-core';

const price = signal(100);
const quantity = signal(2);
const taxRate = signal(0.1);

// Chained computations
const subtotal = memo(() => price() * quantity());
const tax = memo(() => subtotal() * taxRate());
const total = memo(() => subtotal() + tax());

console.log({
  subtotal: subtotal(),  // 200
  tax: tax(),            // 20
  total: total()         // 220
});

// When price changes, all dependents update
price.set(150);
console.log({
  subtotal: subtotal(),  // 300
  tax: tax(),            // 30
  total: total()         // 330
});
```

## Conditional Dependencies

PhilJS tracks the actual dependencies used in each computation:

```tsx playground
import { signal, memo } from 'philjs-core';

const mode = signal('simple');
const simpleValue = signal(10);
const complexValue = signal({ data: [1, 2, 3] });

const result = memo(() => {
  // Dependencies change based on mode
  if (mode() === 'simple') {
    return simpleValue();  // Only depends on mode + simpleValue
  } else {
    return complexValue().data.length;  // Depends on mode + complexValue
  }
});

console.log(result());  // 10

// Only simpleValue changes affect result when mode is 'simple'
complexValue.set({ data: [1, 2, 3, 4, 5] });
console.log(result());  // 10 (no recompute needed)

// Change mode - now complexValue matters
mode.set('complex');
console.log(result());  // 5
```

## Memos in Components

Use memos for computed UI state:

```tsx
import { signal, memo } from 'philjs-core';

function TodoList() {
  const todos = signal([
    { id: 1, text: 'Learn PhilJS', done: false },
    { id: 2, text: 'Build app', done: true },
  ]);
  const filter = signal<'all' | 'active' | 'done'>('all');

  // Filtered list based on current filter
  const filteredTodos = memo(() => {
    const f = filter();
    if (f === 'all') return todos();
    return todos().filter(t => t.done === (f === 'done'));
  });

  // Count statistics
  const stats = memo(() => ({
    total: todos().length,
    active: todos().filter(t => !t.done).length,
    done: todos().filter(t => t.done).length,
  }));

  return (
    <div>
      <p>
        {stats().active} active / {stats().done} done / {stats().total} total
      </p>

      <select
        value={filter()}
        onChange={e => filter.set(e.target.value as any)}
      >
        <option value="all">All</option>
        <option value="active">Active</option>
        <option value="done">Done</option>
      </select>

      <ul>
        {filteredTodos().map(todo => (
          <li key={todo.id}>{todo.text}</li>
        ))}
      </ul>
    </div>
  );
}
```

## Expensive Computations

Memos are perfect for expensive operations:

```tsx playground
import { signal, memo } from 'philjs-core';

const data = signal([
  { category: 'A', value: 10 },
  { category: 'B', value: 20 },
  { category: 'A', value: 30 },
  { category: 'B', value: 40 },
]);

// Expensive grouping operation - only runs when data changes
const groupedData = memo(() => {
  console.log('Grouping data...');
  return data().reduce((acc, item) => {
    acc[item.category] = acc[item.category] || [];
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, typeof data extends () => (infer T)[] ? T[] : never>);
});

console.log(groupedData());
// Reading again - cached!
console.log(groupedData());
```

## TypeScript Support

Memos have full type inference:

```tsx
import { signal, memo, Memo } from 'philjs-core';

const items = signal<number[]>([1, 2, 3]);

// Type inferred from computation
const sum = memo(() => items().reduce((a, b) => a + b, 0));  // Memo<number>
const doubled = memo(() => items().map(x => x * 2));  // Memo<number[]>

// Explicit type
const typedMemo: Memo<string> = memo(() => `Sum is ${sum()}`);

// Type for function parameters
function useStats(values: Memo<number[]>) {
  return {
    min: memo(() => Math.min(...values())),
    max: memo(() => Math.max(...values())),
    avg: memo(() => values().reduce((a, b) => a + b, 0) / values().length),
  };
}
```

## Memo vs Signal

When to use which:

| Use `signal` | Use `memo` |
|--------------|------------|
| Source of truth | Derived from other values |
| User can modify | Computed automatically |
| Independent value | Depends on signals/memos |

```tsx
// Signal - editable source
const firstName = signal('John');
const lastName = signal('Doe');

// Memo - derived, not editable
const fullName = memo(() => `${firstName()} ${lastName()}`);

// fullName.set() would not work - memos are read-only
```

## Best Practices

### 1. Use Memos for Any Derived State

```tsx
// If value depends on signals, use memo
const isValid = memo(() => email().includes('@') && password().length >= 8);
const canSubmit = memo(() => isValid() && !isLoading());
```

### 2. Don't Overuse Memos

```tsx
// Don't memo simple accesses
const name = memo(() => user().name);  // Unnecessary

// Just access directly
<span>{user().name}</span>
```

### 3. Avoid Side Effects in Memos

```tsx
// Bad - side effect in memo
const bad = memo(() => {
  console.log('This runs!');  // Side effect!
  return count() * 2;
});

// Good - use effect for side effects
const doubled = memo(() => count() * 2);
effect(() => console.log('Doubled is:', doubled()));
```

### 4. Keep Memos Pure

```tsx
// Bad - uses non-reactive values
let multiplier = 2;
const bad = memo(() => count() * multiplier);  // Won't update when multiplier changes

// Good - use signals for all reactive values
const multiplier = signal(2);
const good = memo(() => count() * multiplier());
```

## Next Steps

- [Effects](/docs/learn/effects) - Side effects
- [Context](/docs/learn/context) - Shared state
- [Performance](/docs/learn/performance) - Optimization tips
