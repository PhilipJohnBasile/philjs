# Memoization

Cache expensive computations and prevent unnecessary re-renders for better performance.

## What You'll Learn

- Computed values with memo
- Component memoization
- Selector patterns
- Cache strategies
- When to memoize
- Best practices

## Memo Basics

### Simple Memoization

```typescript
import { signal, memo } from '@philjs/core';

function ExpensiveCalculation() {
  const numbers = signal([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);

  // Memoize expensive calculation
  const sum = memo(() => {
    console.log('Calculating sum...');
    return numbers().reduce((acc, n) => acc + n, 0);
  });

  const average = memo(() => {
    console.log('Calculating average...');
    return sum() / numbers().length;
  });

  return (
    <div>
      <p>Sum: {sum()}</p>
      <p>Average: {average()}</p>
    </div>
  );
}
```

### Derived State

```typescript
import { signal, memo } from '@philjs/core';

function UserList() {
  const users = signal([
    { id: 1, name: 'Alice', active: true },
    { id: 2, name: 'Bob', active: false },
    { id: 3, name: 'Charlie', active: true }
  ]);

  const searchTerm = signal('');

  // Memoize filtered list
  const filteredUsers = memo(() => {
    return users().filter(user =>
      user.name.toLowerCase().includes(searchTerm().toLowerCase())
    );
  });

  // Memoize active users
  const activeUsers = memo(() => {
    return filteredUsers().filter(user => user.active);
  });

  return (
    <div>
      <input
        value={searchTerm()}
        onInput={(e) => searchTerm.set(e.target.value)}
        placeholder="Search users..."
      />

      <p>Active users: {activeUsers().length}</p>

      {filteredUsers().map(user => (
        <UserCard key={user.id} user={user} />
      ))}
    </div>
  );
}
```

## Component Memoization

### Memo Component Wrapper

```typescript
import { memo as memoComponent } from '@philjs/core';

interface UserCardProps {
  user: {
    id: number;
    name: string;
    email: string;
  };
}

// Memoize component to prevent re-renders
const UserCard = memoComponent(({ user }: UserCardProps) => {
  console.log(`Rendering UserCard for ${user.name}`);

  return (
    <div className="card">
      <h3>{user.name}</h3>
      <p>{user.email}</p>
    </div>
  );
});

// Parent component
function UserList() {
  const users = signal([
    { id: 1, name: 'Alice', email: 'alice@example.com' },
    { id: 2, name: 'Bob', email: 'bob@example.com' }
  ]);

  const count = signal(0);

  return (
    <div>
      {/* UserCards won't re-render when count changes */}
      <button onClick={() => count.set(count() + 1)}>
        Count: {count()}
      </button>

      {users().map(user => (
        <UserCard key={user.id} user={user} />
      ))}
    </div>
  );
}
```

### Custom Comparison

```typescript
function arePropsEqual<T>(prev: T, next: T): boolean {
  // Custom comparison logic
  if (typeof prev !== typeof next) return false;

  if (typeof prev === 'object' && prev !== null && next !== null) {
    const prevKeys = Object.keys(prev);
    const nextKeys = Object.keys(next);

    if (prevKeys.length !== nextKeys.length) return false;

    return prevKeys.every(key =>
      prev[key as keyof T] === next[key as keyof T]
    );
  }

  return prev === next;
}

const MemoizedComponent = memoComponent(
  MyComponent,
  arePropsEqual
);
```

## Selector Patterns

### Memoized Selectors

```typescript
import { signal, memo } from '@philjs/core';

interface Todo {
  id: number;
  text: string;
  completed: boolean;
}

function createTodoSelectors(todos: () => Todo[]) {
  const completedTodos = memo(() =>
    todos().filter(todo => todo.completed)
  );

  const activeTodos = memo(() =>
    todos().filter(todo => !todo.completed)
  );

  const todoCount = memo(() => ({
    total: todos().length,
    completed: completedTodos().length,
    active: activeTodos().length
  }));

  return { completedTodos, activeTodos, todoCount };
}

// Usage
function TodoApp() {
  const todos = signal<Todo[]>([
    { id: 1, text: 'Learn PhilJS', completed: true },
    { id: 2, text: 'Build app', completed: false }
  ]);

  const selectors = createTodoSelectors(todos);

  return (
    <div>
      <TodoStats stats={selectors.todoCount()} />
      <TodoList todos={selectors.activeTodos()} />
    </div>
  );
}
```

### Parameterized Selectors

```typescript
function createUserSelector(users: () => User[]) {
  // Cache for memoized results
  const cache = new Map<number, () => User | undefined>();

  const getUserById = (id: number) => {
    if (!cache.has(id)) {
      cache.set(id, memo(() =>
        users().find(user => user.id === id)
      ));
    }
    return cache.get(id)!;
  };

  return { getUserById };
}

// Usage
function UserProfile({ userId }: { userId: number }) {
  const users = signal<User[]>([/* ... */]);
  const { getUserById } = createUserSelector(users);

  const user = getUserById(userId);

  return (
    <div>
      {user() ? (
        <h2>{user()!.name}</h2>
      ) : (
        <p>User not found</p>
      )}
    </div>
  );
}
```

## Advanced Memoization

### Deep Memoization

```typescript
import { signal, memo } from '@philjs/core';

function deepMemo<T>(fn: () => T): () => T {
  let prevValue: T | undefined;
  let prevResult: T | undefined;

  return memo(() => {
    const currentValue = fn();

    if (JSON.stringify(currentValue) === JSON.stringify(prevValue)) {
      return prevResult!;
    }

    prevValue = currentValue;
    prevResult = currentValue;
    return currentValue;
  });
}

// Usage
const complexData = signal({
  user: { name: 'Alice', age: 30 },
  settings: { theme: 'dark', notifications: true }
});

const memoizedData = deepMemo(() => ({
  ...complexData(),
  timestamp: Date.now()
}));
```

### LRU Cache Memoization

```typescript
class LRUCache<K, V> {
  private cache = new Map<K, V>();
  private maxSize: number;

  constructor(maxSize: number = 100) {
    this.maxSize = maxSize;
  }

  get(key: K): V | undefined {
    if (!this.cache.has(key)) return undefined;

    // Move to end (most recent)
    const value = this.cache.get(key)!;
    this.cache.delete(key);
    this.cache.set(key, value);

    return value;
  }

  set(key: K, value: V): void {
    if (this.cache.has(key)) {
      this.cache.delete(key);
    } else if (this.cache.size >= this.maxSize) {
      // Remove oldest (first item)
      const oldestKey = this.cache.keys().next().value;
      this.cache.delete(oldestKey);
    }

    this.cache.set(key, value);
  }
}

function createMemoizedFn<Args extends any[], Result>(
  fn: (...args: Args) => Result,
  keyFn: (...args: Args) => string
) {
  const cache = new LRUCache<string, Result>(50);

  return (...args: Args): Result => {
    const key = keyFn(...args);
    const cached = cache.get(key);

    if (cached !== undefined) {
      return cached;
    }

    const result = fn(...args);
    cache.set(key, result);
    return result;
  };
}

// Usage
const expensiveCalculation = createMemoizedFn(
  (a: number, b: number) => {
    console.log('Calculating...');
    return a * b + Math.random();
  },
  (a, b) => `${a}-${b}`
);
```

## Callback Memoization

### Stable Callbacks

```typescript
import { signal } from '@philjs/core';

function useCallback<T extends (...args: any[]) => any>(
  callback: T,
  deps: any[]
): T {
  let memoizedCallback = callback;
  let prevDeps = deps;

  return ((...args: any[]) => {
    const depsChanged = deps.some((dep, i) => dep !== prevDeps[i]);

    if (depsChanged) {
      memoizedCallback = callback;
      prevDeps = deps;
    }

    return memoizedCallback(...args);
  }) as T;
}

// Usage
function TodoList() {
  const todos = signal<Todo[]>([]);

  // Stable callback reference
  const handleToggle = useCallback(
    (id: number) => {
      todos.set(
        todos().map(todo =>
          todo.id === id
            ? { ...todo, completed: !todo.completed }
            : todo
        )
      );
    },
    [todos]
  );

  return (
    <div>
      {todos().map(todo => (
        <TodoItem
          key={todo.id}
          todo={todo}
          onToggle={handleToggle}
        />
      ))}
    </div>
  );
}
```

## When to Memoize

### Expensive Computations

```typescript
// ✅ Memoize expensive calculations
const processedData = memo(() => {
  return largeDataset().map(item => {
    // Complex transformation
    return expensiveTransform(item);
  });
});

// ❌ Don't memoize simple operations
const doubled = memo(() => count() * 2); // Overkill
```

### Derived State

```typescript
// ✅ Memoize derived state
const filteredItems = memo(() =>
  items().filter(item => item.category === selectedCategory())
);

const sortedItems = memo(() =>
  [...filteredItems()].sort((a, b) => a.name.localeCompare(b.name))
);

// ❌ Don't compute derived state on every render
function Component() {
  // Recalculated every render!
  const sorted = [...items()].sort(...);
  return <div>{sorted.map(...)}</div>;
}
```

### Component Re-renders

```typescript
// ✅ Memoize components that rarely change
const Header = memoComponent(() => {
  return <header>{/* ... */}</header>;
});

// ❌ Don't memoize components that change frequently
const Counter = memoComponent(() => {
  const count = signal(0);
  return <div>{count()}</div>; // Changes every click
});
```

## Best Practices

### Measure Before Memoizing

```typescript
// ✅ Profile to identify bottlenecks first
console.time('calculation');
const result = expensiveOperation();
console.timeEnd('calculation');

// If slow, then memoize
const memoized = memo(() => expensiveOperation());

// ❌ Don't memoize everything blindly
```

### Avoid Premature Optimization

```typescript
// ✅ Start simple, optimize when needed
function Component() {
  const filtered = items().filter(i => i.active);
  return <List items={filtered} />;
}

// ❌ Don't over-engineer from start
function Component() {
  const filtered = memo(() =>
    memo(() =>
      items().filter(i => i.active)
    )()
  ); // Too much!
}
```

### Use Proper Dependencies

```typescript
// ✅ Include all dependencies
const computed = memo(() => {
  return a() + b() + c();
});

// ❌ Missing dependencies (stale data)
const computed = memo(() => {
  return a() + b(); // Missing c()
});
```

### Clear Memoization When Needed

```typescript
// ✅ Reset memoization cache when data changes
const cache = new Map();

function clearCache() {
  cache.clear();
}

// Call when data is invalidated
onDataUpdate(() => {
  clearCache();
});
```

### Memoize at Right Level

```typescript
// ✅ Memoize at component level
const MemoizedCard = memoComponent(Card);

function List() {
  return items().map(item => (
    <MemoizedCard key={item.id} item={item} />
  ));
}

// ❌ Memoize inside render (recreated every time)
function List() {
  return items().map(item => {
    const MemoizedCard = memoComponent(Card); // Wrong!
    return <MemoizedCard key={item.id} item={item} />;
  });
}
```

## Summary

You've learned:

✅ Computed values with memo
✅ Component memoization
✅ Selector patterns for derived state
✅ Advanced memoization techniques
✅ Callback memoization
✅ When and when not to memoize
✅ Best practices for memoization

Proper memoization prevents unnecessary work and improves performance!

---

**Next:** [Virtual Scrolling →](./virtual-scrolling.md) Efficiently render large lists
