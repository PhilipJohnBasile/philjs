# Derived State with Memos

Memos let you compute values from signals efficiently. They only recalculate when their dependencies change.

## What You'll Learn

- What memos are and when to use them
- Creating memos from signals
- Performance benefits of memos
- Common memo patterns
- Best practices

## What is a Memo?

A memo is a **computed value** that automatically updates when its dependencies change:

```typescript
import { signal, memo } from '@philjs/core';

const count = signal(10);

// Memo: automatically recomputes when count changes
const doubled = memo(() => count() * 2);

console.log(doubled()); // 20

count.set(15);
console.log(doubled()); // 30
```

**Key concept:** Memos cache their result and only recalculate when the signals they read change.

## Why Memos?

### Without Memos

```typescript
const count = signal(10);

// Function - recalculates every time
function getDoubled() {
  console.log('Calculating...');
  return count() * 2;
}

console.log(getDoubled()); // Logs "Calculating..." → 20
console.log(getDoubled()); // Logs "Calculating..." → 20  (unnecessary!)
console.log(getDoubled()); // Logs "Calculating..." → 20  (unnecessary!)
```

### With Memos

```typescript
const count = signal(10);

// Memo - caches result
const doubled = memo(() => {
  console.log('Calculating...');
  return count() * 2;
});

console.log(doubled()); // Logs "Calculating..." → 20
console.log(doubled()); // 20 (cached, no log!)
console.log(doubled()); // 20 (cached, no log!)

count.set(15); // Count changed
console.log(doubled()); // Logs "Calculating..." → 30  (recalculates)
console.log(doubled()); // 30 (cached again)
```

**Benefits:**
- ⚡ **Performance** - Expensive calculations run once
- 🎯 **Automatic** - No manual dependency tracking
- 🔄 **Always fresh** - Updates when dependencies change
- 💡 **Simple** - Just wrap your calculation in `memo()`

## Creating Memos

### Basic Memo

```typescript
const firstName = signal('John');
const lastName = signal('Doe');

const fullName = memo(() => `${firstName()} ${lastName()}`);

console.log(fullName()); // "John Doe"

firstName.set('Jane');
console.log(fullName()); // "Jane Doe"
```

### Memo with Complex Logic

```typescript
const todos = signal([
  { id: 1, text: 'Learn PhilJS', done: true },
  { id: 2, text: 'Build app', done: false },
  { id: 3, text: 'Deploy', done: false }
]);

const completedCount = memo(() => {
  return todos().filter(todo => todo.done).length;
});

const remainingCount = memo(() => {
  return todos().filter(todo => !todo.done).length;
});

const percentComplete = memo(() => {
  const total = todos().length;
  if (total === 0) return 0;
  return (completedCount() / total) * 100;
});

console.log(completedCount()); // 1
console.log(remainingCount()); // 2
console.log(percentComplete()); // 33.33
```

### Chaining Memos

Memos can depend on other memos:

```typescript
const radius = signal(5);

const diameter = memo(() => radius() * 2);
const circumference = memo(() => diameter() * Math.PI);
const area = memo(() => Math.PI * radius() ** 2);

console.log(diameter()); // 10
console.log(circumference()); // 31.41...
console.log(area()); // 78.54...

radius.set(10);
// All memos automatically recalculate!
```

## When to Use Memos

### ✅ Use Memos When:

**1. Computing from multiple signals:**
```typescript
const price = signal(100);
const quantity = signal(3);
const taxRate = signal(0.1);

const subtotal = memo(() => price() * quantity());
const tax = memo(() => subtotal() * taxRate());
const total = memo(() => subtotal() + tax());
```

**2. Expensive calculations:**
```typescript
const numbers = signal([1, 2, 3, 4, 5, .../* thousands */]);

const sorted = memo(() => {
  console.log('Sorting...');
  return [...numbers()].sort((a, b) => b - a);
});

const sum = memo(() => {
  console.log('Summing...');
  return numbers().reduce((a, b) => a + b, 0);
});
```

**3. Filtering/transforming data:**
```typescript
const items = signal([/* lots of items */]);
const searchQuery = signal('');
const filter = signal<'all' | 'active' | 'completed'>('all');

const filteredItems = memo(() => {
  let result = items();

  // Filter by status
  if (filter() !== 'all') {
    result = result.filter(item =>
      filter() === 'active' ? !item.done : item.done
    );
  }

  // Filter by search
  if (searchQuery()) {
    const query = searchQuery().toLowerCase();
    result = result.filter(item =>
      item.text.toLowerCase().includes(query)
    );
  }

  return result;
});
```

**4. Derived boolean values:**
```typescript
const email = signal('');
const password = signal('');
const agreeToTerms = signal(false);

const isFormValid = memo(() =>
  email().includes('@') &&
  password().length >= 8 &&
  agreeToTerms()
);

<button disabled={!isFormValid()}>
  Sign Up
</button>
```

### ❌ Don't Use Memos When:

**1. Simple pass-through:**
```typescript
// ❌ Unnecessary
const count = signal(5);
const countValue = memo(() => count());

// ✅ Just use the signal
const count = signal(5);
```

**2. Used only once:**
```typescript
// ❌ Overkill
const doubled = memo(() => count() * 2);

// If only used here:
<div>Doubled: {count() * 2}</div>

// ✅ Just compute inline
<div>Doubled: {count() * 2}</div>
```

**3. No dependencies:**
```typescript
// ❌ Wrong - doesn't depend on any signal
const pi = memo(() => 3.14159);

// ✅ Just use a constant
const PI = 3.14159;
```

## Memo Patterns

### Filtered List Pattern

```typescript
const users = signal<User[]>([...]);
const searchTerm = signal('');

const filteredUsers = memo(() => {
  const term = searchTerm().toLowerCase();
  if (!term) return users();

  return users().filter(user =>
    user.name.toLowerCase().includes(term) ||
    user.email.toLowerCase().includes(term)
  );
});
```

### Grouped Data Pattern

```typescript
const transactions = signal<Transaction[]>([...]);

const groupedByDate = memo(() => {
  const groups: Record<string, Transaction[]> = {};

  transactions().forEach(t => {
    const date = t.date.toDateString();
    if (!groups[date]) groups[date] = [];
    groups[date].push(t);
  });

  return groups;
});
```

### Statistics Pattern

```typescript
const numbers = signal([10, 20, 30, 40, 50]);

const sum = memo(() =>
  numbers().reduce((a, b) => a + b, 0)
);

const average = memo(() =>
  sum() / numbers().length
);

const min = memo(() =>
  Math.min(...numbers())
);

const max = memo(() =>
  Math.max(...numbers())
);
```

### Validation Pattern

```typescript
const username = signal('');
const email = signal('');
const password = signal('');
const confirmPassword = signal('');

const usernameError = memo(() =>
  username().length < 3 ? 'Username too short' : null
);

const emailError = memo(() =>
  !email().includes('@') ? 'Invalid email' : null
);

const passwordError = memo(() =>
  password().length < 8 ? 'Password too short' : null
);

const passwordMatchError = memo(() =>
  password() !== confirmPassword() ? 'Passwords do not match' : null
);

const formErrors = memo(() => [
  usernameError(),
  emailError(),
  passwordError(),
  passwordMatchError()
].filter(Boolean));

const isFormValid = memo(() =>
  formErrors().length === 0
);
```

## Performance Optimization

### Memos Prevent Unnecessary Work

```typescript
// Without memo - recalculates every render
function ExpensiveComponent() {
  const data = signal(largeDataSet);

  return (
    <div>
      {/* This sorts on every access! */}
      {data().sort((a, b) => b.value - a.value).map(item => (
        <div key={item.id}>{item.name}</div>
      ))}
    </div>
  );
}

// With memo - sorts only when data changes
function OptimizedComponent() {
  const data = signal(largeDataSet);

  const sortedData = memo(() =>
    data().sort((a, b) => b.value - a.value)
  );

  return (
    <div>
      {sortedData().map(item => (
        <div key={item.id}>{item.name}</div>
      ))}
    </div>
  );
}
```

### Conditional Computation

```typescript
const showAdvanced = signal(false);
const largeDataSet = signal([/* thousands of items */]);

// Only computes when showAdvanced is true
const advancedStats = memo(() => {
  if (!showAdvanced()) return null;

  // Expensive calculation only runs when needed
  return {
    median: calculateMedian(largeDataSet()),
    stdDev: calculateStdDev(largeDataSet()),
    correlation: calculateCorrelation(largeDataSet())
  };
});
```

## Memos in Components

### Display Derived Values

```typescript
function ShoppingCart({ items }: { items: Signal<CartItem[]> }) {
  const subtotal = memo(() =>
    items().reduce((sum, item) => sum + item.price * item.quantity, 0)
  );

  const tax = memo(() => subtotal() * 0.1);

  const shipping = memo(() =>
    subtotal() > 50 ? 0 : 10
  );

  const total = memo(() =>
    subtotal() + tax() + shipping()
  );

  return (
    <div>
      <div>Subtotal: ${subtotal().toFixed(2)}</div>
      <div>Tax: ${tax().toFixed(2)}</div>
      <div>Shipping: ${shipping().toFixed(2)}</div>
      <div>Total: ${total().toFixed(2)}</div>
    </div>
  );
}
```

### Conditional Rendering

```typescript
function UserDashboard({ user }: { user: Signal<User> }) {
  const isAdmin = memo(() => user().role === 'admin');
  const hasAccess = memo(() => isAdmin() || user().permissions.includes('dashboard'));

  return (
    <div>
      {hasAccess() ? (
        <AdminPanel />
      ) : (
        <AccessDenied />
      )}
    </div>
  );
}
```

## Advanced Memo Techniques

### Memoizing Object Creation

```typescript
const user = signal({ firstName: 'John', lastName: 'Doe' });

// Creates new object only when user changes
const displayUser = memo(() => ({
  name: `${user().firstName} ${user().lastName}`,
  initials: `${user().firstName[0]}${user().lastName[0]}`
}));
```

### Combining Multiple Signals

```typescript
const searchTerm = signal('');
const sortBy = signal<'name' | 'date' | 'priority'>('name');
const filterBy = signal<'all' | 'active' | 'completed'>('all');
const items = signal<Item[]>([...]);

const processedItems = memo(() => {
  let result = [...items()];

  // Filter
  if (filterBy() !== 'all') {
    result = result.filter(item =>
      filterBy() === 'active' ? !item.completed : item.completed
    );
  }

  // Search
  if (searchTerm()) {
    const term = searchTerm().toLowerCase();
    result = result.filter(item =>
      item.name.toLowerCase().includes(term)
    );
  }

  // Sort
  result.sort((a, b) => {
    switch (sortBy()) {
      case 'name':
        return a.name.localeCompare(b.name);
      case 'date':
        return a.date.getTime() - b.date.getTime();
      case 'priority':
        return b.priority - a.priority;
      default:
        return 0;
    }
  });

  return result;
});
```

### Pagination with Memos

```typescript
const items = signal<Item[]>([/* hundreds of items */]);
const page = signal(1);
const pageSize = signal(20);

const totalPages = memo(() =>
  Math.ceil(items().length / pageSize())
);

const currentPageItems = memo(() => {
  const start = (page() - 1) * pageSize();
  const end = start + pageSize();
  return items().slice(start, end);
});

const hasPrevPage = memo(() => page() > 1);
const hasNextPage = memo(() => page() < totalPages());
```

## Common Mistakes

### Not Calling the Memo

```typescript
const doubled = memo(() => count() * 2);

// ❌ Wrong
console.log(doubled); // [object Object]

// ✅ Correct
console.log(doubled()); // 10
```

### Creating Memos Conditionally

```typescript
// ❌ Wrong - memo should be stable
function Component({ show }) {
  if (show) {
    const value = memo(() => count() * 2); // New memo each time!
  }
}

// ✅ Correct - memo always created
function Component({ show }) {
  const value = memo(() => show ? count() * 2 : 0);
}
```

### Unnecessary Memos

```typescript
// ❌ Overkill
const count = signal(5);
const countPlusOne = memo(() => count() + 1);

// ✅ Simple enough to compute inline
<div>{count() + 1}</div>
```

## Debugging Memos

### Log When Memos Recalculate

```typescript
const filtered = memo(() => {
  console.log('Filtering items...', items().length);
  return items().filter(item => item.active);
});

// Watch the console to see when filtering happens
```

### Check Memo Dependencies

```typescript
// This memo depends on: items, searchTerm, filter
const filtered = memo(() => {
  console.log('Dependencies:', {
    itemCount: items().length,
    search: searchTerm(),
    filter: filter()
  });

  return items()
    .filter(item => /* ... */)
    .filter(item => /* ... */);
});
```

## Comparison to Other Frameworks

### vs React useMemo

```typescript
// React
const doubled = useMemo(() => count * 2, [count]);

// PhilJS
const doubled = memo(() => count() * 2);
```

**Differences:**
- No dependency array needed (automatic tracking)
- Can be used outside components
- No stale closure issues

### vs Vue computed

```typescript
// Vue
const doubled = computed(() => count.value * 2);

// PhilJS
const doubled = memo(() => count() * 2);
```

Very similar! Main difference is calling syntax: `count()` vs `count.value`.

## Summary

You've learned:

✅ Memos compute derived values from signals
✅ They cache results and only recalculate when dependencies change
✅ Create with `memo(() => computation)`
✅ Read with `memoValue()`
✅ Use for expensive calculations, filtering, and derived state
✅ Memos can depend on signals and other memos
✅ They provide automatic performance optimization

Memos are essential for efficient reactive applications. Use them whenever you're computing something from signals!

---

**Next:** [Side Effects with Effects →](./effects.md) Learn how to handle side effects reactively
