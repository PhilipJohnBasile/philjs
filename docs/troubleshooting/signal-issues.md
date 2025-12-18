# Signal Not Updating Issues

Comprehensive guide to diagnosing and fixing issues where signals don't update the UI as expected.

## Understanding Signal Reactivity

PhilJS uses fine-grained reactivity with signals. When a signal's value changes, all components and effects that read that signal automatically update. However, there are common patterns that break this reactivity.

## Common Problems

### 1. Forgetting to Call the Signal

**Problem:** Displaying the signal function instead of its value.

```tsx
// Problem: Not calling the signal
function Counter() {
  const count = signal(0);

  return (
    <div>
      <p>Count: {count}</p> {/* Shows [Function] */}
      <button onClick={() => count.set(count() + 1)}>Increment</button>
    </div>
  );
}
```

**Solution:** Always call signals to get their value.

```tsx
// Solution: Call the signal
function Counter() {
  const count = signal(0);

  return (
    <div>
      <p>Count: {count()}</p> {/* Shows value */}
      <button onClick={() => count.set(count() + 1)}>Increment</button>
    </div>
  );
}
```

**When NOT to call:** When passing to another function that will call it.

```tsx
// Correct: Pass signal without calling
function DisplayCount({ count }: { count: Signal<number> }) {
  return <p>Count: {count()}</p>; // Called here
}

function Parent() {
  const count = signal(0);
  return <DisplayCount count={count} />; // Passed without calling
}
```

### 2. Mutating Signal Value

**Problem:** Directly mutating the value without triggering reactivity.

```tsx
// Problem: Direct mutation doesn't trigger updates
function TodoList() {
  const todos = signal([
    { id: 1, text: 'Buy milk', done: false }
  ]);

  const toggleTodo = (id: number) => {
    const todo = todos().find(t => t.id === id);
    if (todo) {
      todo.done = !todo.done; // DOESN'T UPDATE UI!
    }
  };

  return (
    <ul>
      {todos().map(todo => (
        <li
          key={todo.id}
          onClick={() => toggleTodo(todo.id)}
          style={{ textDecoration: todo.done ? 'line-through' : 'none' }}
        >
          {todo.text}
        </li>
      ))}
    </ul>
  );
}
```

**Solution:** Always create new values with .set().

```tsx
// Solution: Immutable updates
function TodoList() {
  const todos = signal([
    { id: 1, text: 'Buy milk', done: false }
  ]);

  const toggleTodo = (id: number) => {
    todos.set(
      todos().map(todo =>
        todo.id === id
          ? { ...todo, done: !todo.done }
          : todo
      )
    );
  };

  return (
    <ul>
      {todos().map(todo => (
        <li
          key={todo.id}
          onClick={() => toggleTodo(todo.id)}
          style={{ textDecoration: todo.done ? 'line-through' : 'none' }}
        >
          {todo.text}
        </li>
      ))}
    </ul>
  );
}
```

**Common mutation patterns to avoid:**

```tsx
// All of these are WRONG - they mutate without triggering updates

// Array mutations
items().push(newItem);           // Wrong
items().pop();                   // Wrong
items().splice(0, 1);            // Wrong
items()[0] = newItem;            // Wrong

// Object mutations
user().name = 'Alice';           // Wrong
user().age++;                    // Wrong
delete user().email;             // Wrong

// Set/Map mutations
tags().add('new');               // Wrong
tags().delete('old');            // Wrong
map().set('key', 'value');       // Wrong

// Correct way - create new values
items.set([...items(), newItem]);
items.set(items().slice(0, -1));
items.set(items().filter((_, i) => i !== 0));
items.set(items().map((item, i) => i === 0 ? newItem : item));

user.set({ ...user(), name: 'Alice' });
user.set({ ...user(), age: user().age + 1 });
const { email, ...rest } = user();
user.set(rest);

tags.set(new Set([...tags(), 'new']));
tags.set(new Set([...tags()].filter(t => t !== 'old')));
map.set(new Map([...map(), ['key', 'value']]));
```

### 3. Not Reading Signal in Reactive Context

**Problem:** Signal not tracked because it's not read in reactive context.

```tsx
// Problem: Signal read outside effect
function Component() {
  const count = signal(0);
  const initialCount = count(); // Read immediately

  effect(() => {
    // This only runs once!
    console.log('Initial count was:', initialCount);
  });

  return <div>{count()}</div>;
}
```

**Solution:** Read signals inside effects to track them.

```tsx
// Solution: Read inside effect
function Component() {
  const count = signal(0);

  effect(() => {
    // This runs whenever count changes
    console.log('Count is:', count());
  });

  return <div>{count()}</div>;
}
```

### 4. Derived State Not Using Memo

**Problem:** Derived values don't update because they're not reactive.

```tsx
// Problem: Computed value not reactive
function ShoppingCart() {
  const items = signal([
    { name: 'Apple', price: 1.5, quantity: 2 },
    { name: 'Banana', price: 0.8, quantity: 3 }
  ]);

  // This is computed once and never updates!
  const total = items().reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <div>
      <p>Total: ${total}</p> {/* Never updates! */}
    </div>
  );
}
```

**Solution:** Use memo() for derived values.

```tsx
// Solution: Use memo
function ShoppingCart() {
  const items = signal([
    { name: 'Apple', price: 1.5, quantity: 2 },
    { name: 'Banana', price: 0.8, quantity: 3 }
  ]);

  const total = memo(() =>
    items().reduce((sum, item) => sum + item.price * item.quantity, 0)
  );

  return (
    <div>
      <p>Total: ${total()}</p> {/* Updates automatically! */}
    </div>
  );
}
```

### 5. Async Updates Not Awaited

**Problem:** Setting signal before async operation completes.

```tsx
// Problem: Race condition
function UserProfile({ userId }: { userId: string }) {
  const user = signal(null);
  const loading = signal(true);

  effect(() => {
    loading.set(true);
    fetchUser(userId).then(data => {
      user.set(data);
      loading.set(false);
    });
    // What if userId changes before fetch completes?
  });

  if (loading()) return <div>Loading...</div>;
  return <div>{user()?.name}</div>;
}
```

**Solution:** Handle race conditions properly.

```tsx
// Solution: Abort previous requests
function UserProfile({ userId }: { userId: string }) {
  const user = signal(null);
  const loading = signal(true);

  effect(() => {
    const controller = new AbortController();
    const currentUserId = userId;

    loading.set(true);

    fetchUser(currentUserId, { signal: controller.signal })
      .then(data => {
        // Only update if still relevant
        if (userId === currentUserId) {
          user.set(data);
          loading.set(false);
        }
      })
      .catch(err => {
        if (err.name !== 'AbortError') {
          console.error('Fetch failed:', err);
          loading.set(false);
        }
      });

    return () => {
      controller.abort();
    };
  });

  if (loading()) return <div>Loading...</div>;
  return <div>{user()?.name}</div>;
}
```

### 6. Signals in Closures

**Problem:** Closure captures signal value instead of signal itself.

```tsx
// Problem: Stale closure
function Counter() {
  const count = signal(0);
  const countValue = count(); // Captured value

  const increment = () => {
    // This always uses the initial value!
    count.set(countValue + 1);
  };

  return (
    <div>
      <p>Count: {count()}</p>
      <button onClick={increment}>Increment</button>
    </div>
  );
}
```

**Solution:** Always call signals inside functions.

```tsx
// Solution: Call signal in function
function Counter() {
  const count = signal(0);

  const increment = () => {
    // Always gets current value
    count.set(count() + 1);
  };

  return (
    <div>
      <p>Count: {count()}</p>
      <button onClick={increment}>Increment</button>
    </div>
  );
}
```

### 7. Batching Issues

**Problem:** Multiple updates cause multiple renders.

```tsx
// Problem: Multiple renders
function Form() {
  const firstName = signal('');
  const lastName = signal('');
  const email = signal('');

  const handleSubmit = (data: FormData) => {
    // Each set triggers a render!
    firstName.set(data.firstName);  // Render 1
    lastName.set(data.lastName);    // Render 2
    email.set(data.email);          // Render 3
  };

  return <div>Form content</div>;
}
```

**Solution:** Batch updates together.

```tsx
// Solution: Use batch
import { batch } from 'philjs-core';

function Form() {
  const firstName = signal('');
  const lastName = signal('');
  const email = signal('');

  const handleSubmit = (data: FormData) => {
    batch(() => {
      firstName.set(data.firstName);
      lastName.set(data.lastName);
      email.set(data.email);
    });
    // Only one render after batch completes
  };

  return <div>Form content</div>;
}
```

### 8. Signal Type Mismatch

**Problem:** TypeScript prevents valid updates due to type issues.

```tsx
// Problem: Type too narrow
interface User {
  id: string;
  name: string;
}

function UserComponent() {
  const user = signal(null); // Type: Signal<null>

  const loadUser = async () => {
    const data = await fetchUser();
    user.set(data); // TypeScript error!
  };

  return <div>{user()?.name}</div>;
}
```

**Solution:** Specify correct type parameter.

```tsx
// Solution: Proper typing
interface User {
  id: string;
  name: string;
}

function UserComponent() {
  const user = signal<User | null>(null); // Type: Signal<User | null>

  const loadUser = async () => {
    const data = await fetchUser();
    user.set(data); // Works!
  };

  return <div>{user()?.name}</div>;
}
```

## Debugging Signal Issues

### 1. Log Signal Values

```tsx
function DebugComponent() {
  const count = signal(0);

  // Log every time count is read
  const debugCount = () => {
    const value = count();
    console.log('Count read:', value);
    return value;
  };

  effect(() => {
    console.log('Effect running, count:', count());
  });

  return (
    <div>
      <p>Count: {debugCount()}</p>
      <button onClick={() => {
        console.log('Before set:', count());
        count.set(count() + 1);
        console.log('After set:', count());
      }}>
        Increment
      </button>
    </div>
  );
}
```

### 2. Signal Inspector Utility

```tsx
function createInspectedSignal<T>(name: string, initialValue: T) {
  const s = signal(initialValue);
  let readCount = 0;
  let writeCount = 0;

  return {
    get: () => {
      readCount++;
      const value = s();
      console.log(`[${name}] Read #${readCount}:`, value);
      return value;
    },
    set: (newValue: T | ((prev: T) => T)) => {
      writeCount++;
      const oldValue = s();
      s.set(newValue);
      const updatedValue = s();
      console.log(`[${name}] Write #${writeCount}:`, {
        old: oldValue,
        new: updatedValue,
        changed: oldValue !== updatedValue
      });
    },
    getStats: () => ({
      reads: readCount,
      writes: writeCount
    })
  };
}

// Usage
const count = createInspectedSignal('count', 0);

count.set(5);
// Console: [count] Write #1: { old: 0, new: 5, changed: true }

console.log(count.get());
// Console: [count] Read #1: 5

console.log(count.getStats());
// { reads: 1, writes: 1 }
```

### 3. Effect Dependency Tracker

```tsx
function trackEffectDependencies(name: string, fn: () => void) {
  const dependencies = new Set<string>();

  return effect(() => {
    console.group(`[Effect: ${name}] Running`);

    // Wrap signal reads
    const originalSignal = (window as any).signal;
    (window as any).signal = (...args: any[]) => {
      const s = originalSignal(...args);
      dependencies.add(s.name || 'unnamed');
      return s;
    };

    try {
      fn();
    } finally {
      (window as any).signal = originalSignal;
    }

    console.log('Dependencies:', Array.from(dependencies));
    console.groupEnd();
  });
}

// Usage
const count = signal(0);
const doubled = memo(() => count() * 2);

trackEffectDependencies('myEffect', () => {
  console.log('Count:', count());
  console.log('Doubled:', doubled());
});
```

### 4. Verify Reactivity

```tsx
function testReactivity() {
  const count = signal(0);
  let effectRuns = 0;

  effect(() => {
    count(); // Track count
    effectRuns++;
  });

  console.log('Initial effect runs:', effectRuns); // Should be 1

  count.set(1);
  console.log('After first set:', effectRuns); // Should be 2

  count.set(2);
  console.log('After second set:', effectRuns); // Should be 3

  if (effectRuns !== 3) {
    console.error('Reactivity not working! Expected 3 runs, got', effectRuns);
  }
}
```

## Advanced Patterns

### Linked Signals

For two-way binding with transformation:

```tsx
import { linkedSignal } from 'philjs-core';

function TemperatureConverter() {
  // Celsius signal with automatic Fahrenheit conversion
  const celsius = linkedSignal(0, {
    linked: (c) => c * 9/5 + 32, // C to F
    reverse: (f) => (f - 32) * 5/9 // F to C
  });

  return (
    <div>
      <input
        type="number"
        value={celsius()}
        onInput={(e) => celsius.set(Number(e.currentTarget.value))}
      />
      <p>Celsius: {celsius()}°C</p>
      <p>Fahrenheit: {celsius.linked()}°F</p>
    </div>
  );
}
```

### Resource Signals

For async data loading:

```tsx
import { resource } from 'philjs-core';

function UserProfile({ userId }: { userId: string }) {
  const user = resource(() => fetchUser(userId));

  return (
    <div>
      {user.loading() && <div>Loading...</div>}
      {user.error() && <div>Error: {user.error()?.message}</div>}
      {user() && <div>Name: {user()?.name}</div>}
    </div>
  );
}
```

### Untracked Reads

Read signal without tracking dependency:

```tsx
import { untrack } from 'philjs-core';

function Component() {
  const count = signal(0);
  const trigger = signal(0);

  effect(() => {
    trigger(); // Track trigger

    // Read count without tracking it
    const currentCount = untrack(() => count());

    console.log('Effect runs on trigger change, count is:', currentCount);
    // Effect won't re-run when count changes!
  });

  return (
    <div>
      <p>Count: {count()}</p>
      <button onClick={() => count.set(count() + 1)}>Increment Count</button>
      <button onClick={() => trigger.set(trigger() + 1)}>Trigger Effect</button>
    </div>
  );
}
```

## Signal Update Patterns

### Simple Update

```tsx
const count = signal(0);
count.set(5);
```

### Function Update

```tsx
const count = signal(0);
count.set(prev => prev + 1);
```

### Conditional Update

```tsx
const count = signal(0);
if (count() < 10) {
  count.set(count() + 1);
}
```

### Batched Updates

```tsx
import { batch } from 'philjs-core';

batch(() => {
  count.set(count() + 1);
  name.set('Alice');
  active.set(true);
});
```

### Array Updates

```tsx
const items = signal([1, 2, 3]);

// Add item
items.set([...items(), 4]);

// Remove item
items.set(items().filter(i => i !== 2));

// Update item
items.set(items().map(i => i === 2 ? 20 : i));

// Sort
items.set([...items()].sort());
```

### Object Updates

```tsx
const user = signal({ name: 'Alice', age: 30 });

// Update field
user.set({ ...user(), age: 31 });

// Add field
user.set({ ...user(), email: 'alice@example.com' });

// Remove field
const { age, ...rest } = user();
user.set(rest);
```

## Troubleshooting Checklist

When signals aren't updating:

- [ ] Are you calling the signal? `count()` not `count`
- [ ] Are you using `.set()`? Not direct mutation
- [ ] Are you reading the signal in a reactive context (component render, effect, memo)?
- [ ] Is the signal in a closure capturing an old value?
- [ ] Are you handling async updates properly?
- [ ] Is TypeScript blocking the update due to type issues?
- [ ] Are multiple updates causing race conditions?
- [ ] Should you be using `memo()` for derived values?
- [ ] Should you be using `batch()` for multiple updates?
- [ ] Is an effect cleaning up too early?

## Performance Considerations

### Don't Overuse Signals

```tsx
// Problem: Too many signals
function Component() {
  const firstName = signal('');
  const lastName = signal('');
  const fullName = signal(''); // Redundant!

  effect(() => {
    fullName.set(`${firstName()} ${lastName()}`);
  });
}

// Solution: Use memo
function Component() {
  const firstName = signal('');
  const lastName = signal('');
  const fullName = memo(() => `${firstName()} ${lastName()}`);
}
```

### Avoid Signal Chains

```tsx
// Problem: Cascading effects
const a = signal(0);
const b = signal(0);
const c = signal(0);

effect(() => b.set(a() * 2));
effect(() => c.set(b() * 2));

// Solution: Single derived value
const c = memo(() => a() * 4);
```

## Summary

**Common Mistakes:**
- Forgetting to call signals: `count` vs `count()`
- Mutating values directly instead of using `.set()`
- Not reading signals in reactive contexts
- Not using `memo()` for derived values
- Capturing signal values in closures
- Not handling async races

**Best Practices:**
- Always call signals to read: `count()`
- Always use `.set()` to update: `count.set(5)`
- Use `memo()` for derived/computed values
- Use `batch()` for multiple updates
- Use `untrack()` when you don't want tracking
- Handle async properly with cleanup
- Type signals correctly in TypeScript

**Next:**
- [Common Issues](./common-issues.md) - More common problems
- [Build Errors](./build-errors.md) - Build-time issues
- [Debugging Guide](./debugging.md) - Debugging techniques
