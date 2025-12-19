# PhilJS React Compatibility Layer

A comprehensive compatibility layer for seamlessly migrating React applications to PhilJS. This package provides React-compatible APIs while leveraging PhilJS's fine-grained reactivity system.

## Features

- **Drop-in Replacement**: Replace `react` imports with `philjs-react-compat`
- **Hook Compatibility**: `useState`, `useEffect`, `useMemo`, `useCallback`, `useRef`, `useContext`, `useReducer`
- **Component Compatibility**: `Fragment`, `Suspense`, `Portal`, `ErrorBoundary`, `forwardRef`, `memo`
- **Automatic Migration Tools**: Codemods to transform React code to PhilJS
- **Gradual Migration**: Use React patterns while gradually adopting PhilJS idioms
- **Zero Breaking Changes**: Existing React code works immediately

## Installation

```bash
npm install philjs-react-compat philjs-core
# or
yarn add philjs-react-compat philjs-core
# or
pnpm add philjs-react-compat philjs-core
```

## Quick Start

### 1. Replace React Imports

**Before (React):**
```tsx
import { useState, useEffect, useMemo } from 'react';
```

**After (PhilJS Compat):**
```tsx
import { useState, useEffect, useMemo } from 'philjs-react-compat';
```

### 2. Your Code Works Immediately

```tsx
import { useState, useEffect } from 'philjs-react-compat';

function Counter() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    document.title = `Count: ${count}`;
  }, [count]); // Dependency array still works (but optional in PhilJS)

  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={() => setCount(count + 1)}>Increment</button>
    </div>
  );
}
```

### 3. Gradually Migrate to PhilJS Patterns (Optional)

```tsx
import { signal, effect } from 'philjs-core';

function Counter() {
  const count = signal(0);

  effect(() => {
    document.title = `Count: ${count()}`;
  }); // No dependency array needed!

  return (
    <div>
      <p>Count: {count()}</p>
      <button onClick={() => count.set(count() + 1)}>Increment</button>
    </div>
  );
}
```

## API Reference

### Hooks

#### `useState(initialValue)`

React-compatible state hook using PhilJS signals.

```tsx
import { useState } from 'philjs-react-compat';

const [count, setCount] = useState(0);
const [user, setUser] = useState({ name: 'Alice', age: 30 });
const [items, setItems] = useState([]);

// Functional updates work the same
setCount(c => c + 1);
setUser(u => ({ ...u, age: u.age + 1 }));
```

**Migration Tip:** Consider using `signal()` directly for better performance:
```tsx
import { signal } from 'philjs-core';

const count = signal(0);
count.set(count() + 1);
```

#### `useEffect(fn, deps?)`

React-compatible effect hook using PhilJS effects.

```tsx
import { useEffect } from 'philjs-react-compat';

// Dependency array is optional (but accepted for compatibility)
useEffect(() => {
  console.log('Count changed:', count);
}, [count]);

// PhilJS automatically tracks dependencies
useEffect(() => {
  console.log('Count changed:', count);
}); // No deps needed!

// Cleanup works the same
useEffect(() => {
  const timer = setInterval(() => console.log('tick'), 1000);
  return () => clearInterval(timer);
});
```

**Migration Tip:** Remove dependency arrays - PhilJS tracks automatically!

#### `useMemo(fn, deps?)`

React-compatible memoization using PhilJS memos.

```tsx
import { useMemo } from 'philjs-react-compat';

const doubled = useMemo(() => count * 2, [count]);
const filtered = useMemo(() => items.filter(x => x.active), [items]);

// PhilJS version (no deps needed)
const doubled = useMemo(() => count * 2);
```

#### `useCallback(fn, deps?)`

React-compatible callback memoization.

```tsx
import { useCallback } from 'philjs-react-compat';

const handleClick = useCallback(() => {
  doSomething(count);
}, [count]);
```

**Migration Tip:** `useCallback` is unnecessary in PhilJS! Just use regular functions:
```tsx
const handleClick = () => doSomething(count);
```

#### `useRef(initialValue)`

React-compatible ref hook.

```tsx
import { useRef } from 'philjs-react-compat';

const inputRef = useRef<HTMLInputElement>(null);
const countRef = useRef(0);

// Access via .current
inputRef.current?.focus();
countRef.current += 1;
```

#### `useContext(Context)`

React-compatible context hook (identical API).

```tsx
import { createContext, useContext } from 'philjs-react-compat';

const ThemeContext = createContext('light');

function ThemedButton() {
  const theme = useContext(ThemeContext);
  return <button className={theme}>Button</button>;
}
```

#### `useReducer(reducer, initialState)`

React-compatible reducer hook.

```tsx
import { useReducer } from 'philjs-react-compat';

const [state, dispatch] = useReducer(reducer, initialState);

dispatch({ type: 'increment' });
```

**Migration Tip:** Consider using signals directly instead of reducers:
```tsx
import { signal } from 'philjs-core';

const count = signal(0);
count.set(count() + 1); // Simpler than dispatch!
```

### Components

#### `Fragment`

React-compatible Fragment component.

```tsx
import { Fragment } from 'philjs-react-compat';

<Fragment>
  <li>Item 1</li>
  <li>Item 2</li>
</Fragment>

// Or use shorthand
<>
  <li>Item 1</li>
  <li>Item 2</li>
</>
```

#### `Suspense`

Async component loading with fallback.

```tsx
import { Suspense, lazy } from 'philjs-react-compat';

const LazyComponent = lazy(() => import('./HeavyComponent'));

<Suspense fallback={<div>Loading...</div>}>
  <LazyComponent />
</Suspense>
```

#### `Portal`

Render children into a different DOM node.

```tsx
import { Portal } from 'philjs-react-compat';

<Portal container={document.body}>
  <Modal>Modal Content</Modal>
</Portal>
```

#### `ErrorBoundary`

Error handling with recovery.

```tsx
import { ErrorBoundary } from 'philjs-react-compat';

<ErrorBoundary
  fallback={(error, retry) => (
    <div>
      <p>Error: {error.message}</p>
      <button onClick={retry}>Retry</button>
    </div>
  )}
>
  <Component />
</ErrorBoundary>
```

#### `forwardRef`

Forward refs to child components.

```tsx
import { forwardRef } from 'philjs-react-compat';

const Input = forwardRef<HTMLInputElement>((props, ref) => {
  return <input ref={ref} {...props} />;
});
```

#### `memo`

Component memoization (unnecessary in PhilJS).

```tsx
import { memo } from 'philjs-react-compat';

const ExpensiveComponent = memo(({ data }) => {
  return <div>{data}</div>;
});
```

**Note:** `memo()` is unnecessary in PhilJS due to fine-grained reactivity. You can safely remove it.

## Migration Guide

### Automatic Migration with Codemod

Transform your React code automatically:

```bash
npx jscodeshift -t node_modules/philjs-react-compat/dist/codemod/transform.js src/**/*.tsx
```

This will:
- Replace `react` imports with `philjs-react-compat`
- Remove unnecessary dependency arrays (with comments)
- Add migration suggestions as comments
- Flag `useCallback` and `React.memo` for removal

### Manual Migration Steps

#### 1. State (`useState` → `signal`)

**React:**
```tsx
const [count, setCount] = useState(0);
setCount(count + 1);
```

**PhilJS:**
```tsx
const count = signal(0);
count.set(count() + 1);
```

#### 2. Effects (`useEffect` → `effect`)

**React:**
```tsx
useEffect(() => {
  console.log(count);
}, [count]);
```

**PhilJS:**
```tsx
effect(() => {
  console.log(count());
}); // Auto-tracks count!
```

#### 3. Memoization (`useMemo` → `memo`)

**React:**
```tsx
const doubled = useMemo(() => count * 2, [count]);
```

**PhilJS:**
```tsx
const doubled = memo(() => count() * 2); // Auto-tracks!
```

#### 4. Remove `useCallback`

**React:**
```tsx
const handleClick = useCallback(() => {
  doSomething(count);
}, [count]);
```

**PhilJS:**
```tsx
const handleClick = () => {
  doSomething(count());
}; // No memoization needed!
```

#### 5. Remove `React.memo`

**React:**
```tsx
const Component = React.memo(({ data }) => {
  return <div>{data}</div>;
});
```

**PhilJS:**
```tsx
const Component = ({ data }) => {
  return <div>{data}</div>;
}; // Auto-optimized!
```

## Migration Strategy

### Phase 1: Compatibility Mode (Day 1)

Replace imports and run your app:

```tsx
// Change this
import { useState, useEffect } from 'react';

// To this
import { useState, useEffect } from 'philjs-react-compat';
```

Everything works immediately!

### Phase 2: Remove Dependency Arrays (Week 1)

Remove dependency arrays from hooks:

```tsx
// Before
useEffect(() => {
  console.log(count);
}, [count]);

// After
useEffect(() => {
  console.log(count);
}); // PhilJS tracks automatically
```

### Phase 3: Migrate to PhilJS Patterns (Week 2-4)

Gradually adopt PhilJS idioms:

```tsx
// Replace useState with signal
import { signal } from 'philjs-core';
const count = signal(0);

// Replace useEffect with effect
import { effect } from 'philjs-core';
effect(() => console.log(count()));

// Replace useMemo with memo
import { memo } from 'philjs-core';
const doubled = memo(() => count() * 2);
```

### Phase 4: Optimization (Month 2+)

- Remove `useCallback` wrappers
- Remove `React.memo` wrappers
- Optimize with `batch()` for multiple updates
- Use `untrack()` to prevent reactive dependencies

## Benefits of Full Migration

Once fully migrated to PhilJS patterns:

- **Smaller Bundle**: No virtual DOM overhead
- **Faster Updates**: Fine-grained reactivity updates only what changed
- **Simpler Code**: No dependency arrays or memoization wrappers
- **Better DX**: No stale closures or Rules of Hooks
- **Smaller Re-renders**: Only affected DOM nodes update

## Compatibility Notes

### What Works Exactly the Same

- Context API (`createContext`, `useContext`)
- Refs (`useRef`, `createRef`, `forwardRef`)
- Fragment (`<Fragment>` or `<>`)
- Error Boundaries
- Portal

### What Works Slightly Different

- **Effects run synchronously** (not after paint like React)
- **No batching needed** (updates are already efficient)
- **Signals must be called** to read values: `count()` not `count`

### What's Unnecessary

- `useCallback` - functions are stable
- `React.memo` - automatic optimization
- Dependency arrays - automatic tracking
- `useMemo` for simple derivations - use `memo()`

## Examples

### Complete Example: Todo App

**React Version:**
```tsx
import { useState, useCallback, useMemo } from 'react';

function TodoApp() {
  const [todos, setTodos] = useState([]);
  const [filter, setFilter] = useState('all');

  const addTodo = useCallback((text) => {
    setTodos([...todos, { id: Date.now(), text, done: false }]);
  }, [todos]);

  const toggleTodo = useCallback((id) => {
    setTodos(todos.map(t => t.id === id ? { ...t, done: !t.done } : t));
  }, [todos]);

  const filteredTodos = useMemo(() => {
    return todos.filter(t => {
      if (filter === 'active') return !t.done;
      if (filter === 'completed') return t.done;
      return true;
    });
  }, [todos, filter]);

  return (
    <div>
      <TodoInput onAdd={addTodo} />
      <FilterButtons filter={filter} setFilter={setFilter} />
      <TodoList todos={filteredTodos} onToggle={toggleTodo} />
    </div>
  );
}
```

**PhilJS Version:**
```tsx
import { signal, memo } from 'philjs-core';

function TodoApp() {
  const todos = signal([]);
  const filter = signal('all');

  const addTodo = (text) => {
    todos.set([...todos(), { id: Date.now(), text, done: false }]);
  };

  const toggleTodo = (id) => {
    todos.set(todos().map(t => t.id === id ? { ...t, done: !t.done } : t));
  };

  const filteredTodos = memo(() => {
    return todos().filter(t => {
      if (filter() === 'active') return !t.done;
      if (filter() === 'completed') return t.done;
      return true;
    });
  });

  return (
    <div>
      <TodoInput onAdd={addTodo} />
      <FilterButtons filter={filter} setFilter={filter.set} />
      <TodoList todos={filteredTodos()} onToggle={toggleTodo} />
    </div>
  );
}
```

**Benefits:**
- No `useCallback` wrappers
- No `useMemo` dependency arrays
- Simpler, more direct code
- Better performance (fine-grained updates)

## Troubleshooting

### Common Issues

**Issue:** Forgot to call signal
```tsx
// ❌ Wrong
<p>Count: {count}</p>

// ✅ Correct
<p>Count: {count()}</p>
```

**Issue:** Mutating signal values
```tsx
// ❌ Wrong
const items = signal([1, 2, 3]);
items().push(4); // Mutation!

// ✅ Correct
items.set([...items(), 4]); // New array
```

**Issue:** Stale dependency arrays
```tsx
// ❌ React habit
useEffect(() => {
  console.log(count);
}, []); // Missing dependency!

// ✅ PhilJS
useEffect(() => {
  console.log(count);
}); // Auto-tracks!
```

## Further Reading

- [PhilJS Documentation](https://philjs.dev/docs)
- [Migration Guide](https://philjs.dev/docs/migration/from-react)
- [API Reference](https://philjs.dev/docs/api-reference/core)
- [Examples](https://github.com/philjs/philjs/tree/main/examples)

## License

MIT
