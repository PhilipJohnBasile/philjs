# Thinking in PhilJS

This guide explains the mental model behind PhilJS. Understanding these concepts will help you write better, more efficient applications.

## The Reactive Graph

PhilJS is built on a **reactive graph** - a network of signals, memos, and effects that automatically track dependencies and propagate changes.

```
Signal(count)
    ↓
Memo(doubled) = count * 2
    ↓
Effect(render DOM)
```

When `count` changes, only `doubled` is recalculated, and only the specific DOM nodes using `doubled` are updated.

## Key Mental Model Shifts

### From React to PhilJS

| React | PhilJS | Why |
|-------|--------|-----|
| `useState` | `signal` | Fine-grained updates, no re-renders |
| `useMemo` | `memo` | Automatic dependency tracking |
| `useEffect` | `effect` | No dependency arrays needed |
| `useCallback` | Not needed | Functions don't cause re-renders |
| Virtual DOM | Direct DOM | No diffing overhead |

### The Component Never Re-runs

In React, components re-run on every state change. In PhilJS, **components run once**:

```tsx
// React - App() runs every time count changes
function App() {
  const [count, setCount] = useState(0);
  console.log('Component ran'); // Logs every click
  return <button onClick={() => setCount(c => c + 1)}>{count}</button>;
}

// PhilJS - App() runs once, only the text node updates
function App() {
  const count = signal(0);
  console.log('Component ran'); // Logs once
  return <button onClick={() => count.set(c => c + 1)}>{count()}</button>;
}
```

### No Dependency Arrays

PhilJS automatically tracks which signals a memo or effect depends on:

```tsx
// React - Must manually specify dependencies
const doubled = useMemo(() => count * 2, [count]);
useEffect(() => {
  document.title = `Count: ${count}`;
}, [count]);

// PhilJS - Dependencies tracked automatically
const doubled = memo(() => count() * 2);  // Knows it depends on count
effect(() => {
  document.title = `Count: ${count()}`;   // Knows it depends on count
});
```

## Signals Are Functions

Signals are callable - you read them by calling them:

```tsx
const name = signal('World');

// Reading - call the signal
const greeting = `Hello, ${name()}`;

// Writing - use .set()
name.set('PhilJS');

// Why functions? Because calling tracks the dependency!
```

## The Three Primitives

### 1. Signal - State Container

```tsx
const count = signal(0);        // Create
count();                         // Read (tracks dependency)
count.set(1);                    // Write absolute value
count.set(c => c + 1);          // Write with updater
```

### 2. Memo - Derived State

```tsx
const doubled = memo(() => count() * 2);
doubled();  // Read (cached, only recomputes when count changes)
```

### 3. Effect - Side Effects

```tsx
effect(() => {
  console.log(count());  // Runs when count changes
  // Cleanup function (optional)
  return () => console.log('cleanup');
});
```

## Data Flow

Data flows in one direction in PhilJS:

```
User Action → Signal Update → Reactive Update → DOM Change
              (count.set)     (memo/effect)    (automatic)
```

This unidirectional flow makes debugging easier - you always know where changes come from.

## Performance by Design

### Why Fine-Grained is Better

```tsx
// Virtual DOM approach (React)
function App() {
  const [count, setCount] = useState(0);
  return (
    <div>
      <Header />           {/* Diffs even though unchanged */}
      <Sidebar />          {/* Diffs even though unchanged */}
      <Counter count={count} /> {/* Actually changed */}
    </div>
  );
}

// Fine-grained approach (PhilJS)
function App() {
  const count = signal(0);
  return (
    <div>
      <Header />           {/* Never touched */}
      <Sidebar />          {/* Never touched */}
      <Counter count={count} /> {/* Only this updates */}
    </div>
  );
}
```

### No `useCallback` or `React.memo`

Because components don't re-run, you don't need to memoize callbacks:

```tsx
// React - needs useCallback to prevent re-renders
const handleClick = useCallback(() => {
  doSomething(id);
}, [id]);

// PhilJS - just write the function
const handleClick = () => doSomething(id);
```

## Common Patterns

### Derived State

Use `memo` for any value computed from signals:

```tsx
const items = signal([1, 2, 3, 4, 5]);
const filter = signal('all');

const filteredItems = memo(() => {
  const f = filter();
  return f === 'all'
    ? items()
    : items().filter(i => /* ... */);
});
```

### Conditional Logic

Use signals in conditions:

```tsx
const isLoading = signal(true);

return (
  <div>
    {isLoading() ? <Spinner /> : <Content />}
  </div>
);
```

### Communicating Up

Pass signal setters to children:

```tsx
function Parent() {
  const value = signal('');
  return <Child onChange={value.set} />;
}

function Child({ onChange }: { onChange: (v: string) => void }) {
  return <input onInput={e => onChange(e.target.value)} />;
}
```

### Computed Props

Use memos for props that depend on signals:

```tsx
const selectedId = signal(null);
const items = signal([...]);

const selectedItem = memo(() =>
  items().find(i => i.id === selectedId())
);

return <Details item={selectedItem()} />;
```

## Anti-Patterns to Avoid

### Don't Create Signals in Render

```tsx
// Bad - creates new signal every render
function Bad() {
  return <div>{signal(0)()}</div>;
}

// Good - signal created once
function Good() {
  const count = signal(0);
  return <div>{count()}</div>;
}
```

### Don't Read Signals Without Calling

```tsx
// Bad - passes the signal object, not the value
<span>{count}</span>

// Good - passes the current value
<span>{count()}</span>
```

### Don't Forget Cleanup in Effects

```tsx
effect(() => {
  const handler = () => console.log(count());
  window.addEventListener('resize', handler);

  // Always clean up!
  return () => window.removeEventListener('resize', handler);
});
```

## Next Steps

Now that you understand the mental model:

- [Signals](/docs/learn/signals) - Deep dive into signals
- [Effects](/docs/learn/effects) - Managing side effects
- [Tutorial: Todo App](/docs/getting-started/tutorial-todo-app) - Build something real
