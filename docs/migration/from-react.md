# Migrating from React to PhilJS

This guide helps React developers transition to PhilJS, covering conceptual mappings, code transformations, and best practices.

## Quick Comparison

| React | PhilJS | Notes |
|-------|--------|-------|
| `useState` | `signal` | Fine-grained, no re-renders |
| `useEffect` | `effect` | Auto-tracks dependencies |
| `useMemo` | `computed` | Automatic caching |
| `useCallback` | Not needed | No re-render concerns |
| `useRef` | `signal` or plain variable | Context-dependent |
| `useContext` | `createContext` | Similar pattern |
| `memo()` | `memo()` | Similar, but less needed |

## Core Concepts

### State Management

**React useState → PhilJS signal**

```tsx
// React
import { useState } from 'react';

function Counter() {
  const [count, setCount] = useState(0);
  return (
    <button onClick={() => setCount(count + 1)}>
      Count: {count}
    </button>
  );
}
```

```tsx
// PhilJS
import { signal } from '@philjs/core';

function Counter() {
  const count = signal(0);
  return (
    <button onClick={() => count.set(count() + 1)}>
      Count: {count()}
    </button>
  );
}
```

**Key Differences:**
- Call the signal as a function to get its value: `count()`
- Use `.set()` to update: `count.set(newValue)`
- No array destructuring needed
- Updates are fine-grained (no component re-render)

### Effects

**React useEffect → PhilJS effect**

```tsx
// React
import { useState, useEffect } from 'react';

function UserProfile({ userId }) {
  const [user, setUser] = useState(null);

  useEffect(() => {
    fetchUser(userId).then(setUser);
  }, [userId]); // Manual dependency array

  return <div>{user?.name}</div>;
}
```

```tsx
// PhilJS
import { signal, effect } from '@philjs/core';

function UserProfile(props) {
  const user = signal(null);

  effect(() => {
    // Dependencies auto-tracked!
    fetchUser(props.userId()).then(data => user.set(data));
  });

  return <div>{user()?.name}</div>;
}
```

**Key Differences:**
- No dependency array - dependencies auto-tracked
- Return cleanup function from effect (same as React)
- Effects run synchronously by default

### Computed Values

**React useMemo → PhilJS computed**

```tsx
// React
import { useState, useMemo } from 'react';

function FilteredList({ items }) {
  const [filter, setFilter] = useState('');

  const filteredItems = useMemo(() => {
    return items.filter(item => item.includes(filter));
  }, [items, filter]); // Manual dependencies

  return <ul>{filteredItems.map(item => <li>{item}</li>)}</ul>;
}
```

```tsx
// PhilJS
import { signal, computed } from '@philjs/core';

function FilteredList(props) {
  const filter = signal('');

  const filteredItems = computed(() => {
    // Auto-tracked: props.items() and filter()
    return props.items().filter(item => item.includes(filter()));
  });

  return <ul>{filteredItems().map(item => <li>{item}</li>)}</ul>;
}
```

### Refs

**React useRef → PhilJS signal or variable**

```tsx
// React - mutable ref
import { useRef, useEffect } from 'react';

function AutoFocus() {
  const inputRef = useRef(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  return <input ref={inputRef} />;
}
```

```tsx
// PhilJS - just use variable
function AutoFocus() {
  let inputRef = null;

  effect(() => {
    inputRef?.focus();
  });

  return <input ref={(el) => inputRef = el} />;
}
```

## Component Patterns

### Props

```tsx
// React
function Greeting({ name, age = 25 }) {
  return <div>Hello {name}, you are {age}</div>;
}
```

```tsx
// PhilJS - props as object
function Greeting(props) {
  return <div>Hello {props.name}, you are {props.age ?? 25}</div>;
}
```

### Children

```tsx
// React
function Card({ children, title }) {
  return (
    <div className="card">
      <h2>{title}</h2>
      {children}
    </div>
  );
}
```

```tsx
// PhilJS - same pattern
function Card(props) {
  return (
    <div class="card">
      <h2>{props.title}</h2>
      {props.children}
    </div>
  );
}
```

### Conditional Rendering

```tsx
// React
function Message({ isLoggedIn }) {
  return isLoggedIn ? <Dashboard /> : <Login />;
}
```

```tsx
// PhilJS - same, but with signals
function Message(props) {
  return props.isLoggedIn() ? <Dashboard /> : <Login />;
}
```

### Lists

```tsx
// React
function List({ items }) {
  return (
    <ul>
      {items.map(item => (
        <li key={item.id}>{item.name}</li>
      ))}
    </ul>
  );
}
```

```tsx
// PhilJS - use For component for optimal updates
import { For } from '@philjs/core';

function List(props) {
  return (
    <ul>
      <For each={props.items()}>
        {item => <li>{item.name}</li>}
      </For>
    </ul>
  );
}
```

## Hooks Migration

### Custom Hooks → Functions

```tsx
// React custom hook
function useLocalStorage(key, initialValue) {
  const [value, setValue] = useState(() => {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : initialValue;
  });

  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(value));
  }, [key, value]);

  return [value, setValue];
}
```

```tsx
// PhilJS - just a function
import { signal, effect } from '@philjs/core';

function createLocalStorage(key, initialValue) {
  const stored = localStorage.getItem(key);
  const value = signal(stored ? JSON.parse(stored) : initialValue);

  effect(() => {
    localStorage.setItem(key, JSON.stringify(value()));
  });

  return value;
}
```

### useReducer → Store

```tsx
// React
import { useReducer } from 'react';

const reducer = (state, action) => {
  switch (action.type) {
    case 'increment': return { count: state.count + 1 };
    case 'decrement': return { count: state.count - 1 };
    default: return state;
  }
};

function Counter() {
  const [state, dispatch] = useReducer(reducer, { count: 0 });
  return (
    <>
      <span>{state.count}</span>
      <button onClick={() => dispatch({ type: 'increment' })}>+</button>
    </>
  );
}
```

```tsx
// PhilJS - createStore
import { createStore } from '@philjs/store';

const counter = createStore({
  count: 0,
  increment() { this.count++ },
  decrement() { this.count-- }
});

function Counter() {
  return (
    <>
      <span>{counter.count}</span>
      <button onClick={counter.increment}>+</button>
    </>
  );
}
```

## Context

```tsx
// React
import { createContext, useContext, useState } from 'react';

const ThemeContext = createContext('light');

function App() {
  const [theme, setTheme] = useState('light');
  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      <Child />
    </ThemeContext.Provider>
  );
}

function Child() {
  const { theme, setTheme } = useContext(ThemeContext);
  return <button onClick={() => setTheme('dark')}>{theme}</button>;
}
```

```tsx
// PhilJS
import { createContext, useContext, signal } from '@philjs/core';

const ThemeContext = createContext();

function App() {
  const theme = signal('light');
  return (
    <ThemeContext.Provider value={{ theme }}>
      <Child />
    </ThemeContext.Provider>
  );
}

function Child() {
  const { theme } = useContext(ThemeContext);
  return <button onClick={() => theme.set('dark')}>{theme()}</button>;
}
```

## Error Boundaries

```tsx
// React
import { Component } from 'react';

class ErrorBoundary extends Component {
  state = { hasError: false };

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return <h1>Something went wrong.</h1>;
    }
    return this.props.children;
  }
}
```

```tsx
// PhilJS
import { ErrorBoundary } from '@philjs/core';

function App() {
  return (
    <ErrorBoundary fallback={<h1>Something went wrong.</h1>}>
      <MyComponent />
    </ErrorBoundary>
  );
}
```

## Routing

```tsx
// React Router
import { BrowserRouter, Routes, Route, Link, useParams } from 'react-router-dom';

function App() {
  return (
    <BrowserRouter>
      <nav>
        <Link to="/">Home</Link>
        <Link to="/about">About</Link>
      </nav>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/users/:id" element={<User />} />
      </Routes>
    </BrowserRouter>
  );
}

function User() {
  const { id } = useParams();
  return <div>User {id}</div>;
}
```

```tsx
// PhilJS Router
import { createAppRouter, Link, RouterView, useRoute } from '@philjs/router';

const router = createAppRouter({
  routes: [
    { path: '/', component: Home },
    { path: '/users/:id', component: User },
  ]
});

function App() {
  return (
    <>
      <nav>
        <Link to="/">Home</Link>
        <Link to="/about">About</Link>
      </nav>
      <RouterView />
    </>
  );
}

function User() {
  const route = useRoute();
  return <div>User {route.params.id}</div>;
}
```

## Common Gotchas

### 1. Forgetting to call signals

```tsx
// Wrong
<div>{count}</div>  // Shows [object Signal]

// Correct
<div>{count()}</div>  // Shows the value
```

### 2. Destructuring props too early

```tsx
// Wrong - loses reactivity
function Component({ name }) {
  return <div>{name}</div>;  // Won't update if name changes
}

// Correct - access from props object
function Component(props) {
  return <div>{props.name}</div>;  // Updates when name changes
}
```

### 3. Mutating signal values

```tsx
// Wrong
const items = signal([1, 2, 3]);
items().push(4);  // Won't trigger updates

// Correct
items.set([...items(), 4]);
```

## Migration Strategy

### Phase 1: Setup
1. Install PhilJS packages alongside React
2. Configure build tools (Vite/Webpack)
3. Set up both renderers

### Phase 2: Incremental Migration
1. Start with leaf components (no children)
2. Migrate utilities and hooks
3. Move up the component tree
4. Use adapter components at boundaries

### Phase 3: Full Migration
1. Replace React entry point
2. Remove React dependencies
3. Clean up adapter components

## Adapter Pattern

For gradual migration, wrap PhilJS components in React:

```tsx
// PhilJS component
function PhilCounter() {
  const count = signal(0);
  return <button onClick={() => count.set(count() + 1)}>{count()}</button>;
}

// React wrapper
import { useEffect, useRef } from 'react';
import { render } from '@philjs/core';

function ReactPhilCounter() {
  const containerRef = useRef(null);

  useEffect(() => {
    const cleanup = render(PhilCounter, containerRef.current);
    return cleanup;
  }, []);

  return <div ref={containerRef} />;
}
```

## Performance Benefits

After migrating, you'll notice:

- **No re-render cascades**: Only affected DOM updates
- **Smaller bundle**: ~3KB core vs React's ~40KB
- **Faster updates**: Fine-grained reactivity
- **Less boilerplate**: No useCallback, less useMemo
- **Simpler mental model**: No hooks rules to remember
