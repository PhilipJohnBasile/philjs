# Migrating from React to PhilJS

This comprehensive guide helps you migrate your React application to PhilJS. PhilJS uses fine-grained reactivity (signals) instead of React's Virtual DOM diffing, resulting in better performance and simpler mental models.

## Table of Contents

1. [Quick Start](#quick-start)
2. [Concept Mapping](#concept-mapping)
3. [State Management](#state-management)
4. [Effects and Lifecycle](#effects-and-lifecycle)
5. [Computed Values](#computed-values)
6. [Context](#context)
7. [Refs](#refs)
8. [JSX Differences](#jsx-differences)
9. [Routing](#routing)
10. [State Management Libraries](#state-management-libraries)
11. [Common Patterns](#common-patterns)
12. [Codemod Examples](#codemod-examples)
13. [Step-by-Step Migration](#step-by-step-migration)
14. [Troubleshooting](#troubleshooting)

---

## Quick Start

### Installation

```bash
# Remove React dependencies
npm uninstall react react-dom @types/react @types/react-dom

# Install PhilJS
npm install @philjs/core philjs-router
```

### Update tsconfig.json

```json
{
  "compilerOptions": {
    "jsx": "react-jsx",
    "jsxImportSource": "@philjs/core"
  }
}
```

### Basic Component Conversion

```tsx
// Before (React)
import { useState, useEffect } from 'react';

function Counter() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    document.title = `Count: ${count}`;
  }, [count]);

  return (
    <button onClick={() => setCount(count + 1)}>
      Count: {count}
    </button>
  );
}

// After (PhilJS)
import { signal, effect } from '@philjs/core';

function Counter() {
  const count = signal(0);

  effect(() => {
    document.title = `Count: ${count()}`;
  });

  return (
    <button onClick={() => count.set(c => c + 1)}>
      Count: {count()}
    </button>
  );
}
```

---

## Concept Mapping

| React | PhilJS | Notes |
|-------|--------|-------|
| `useState` | `signal` | Signals are called to read, use `.set()` to write |
| `useEffect` | `effect` | Auto-tracks dependencies, no dependency array needed |
| `useMemo` | `memo` | Auto-tracks dependencies |
| `useCallback` | Not needed | Signal callbacks are stable by default |
| `useRef` | `signal` or variable | Use `signal` for reactive refs, plain variable for DOM refs |
| `useContext` | `useContext` | Same API |
| `createContext` | `createContext` | Same API |
| `React.memo` | Not needed | Fine-grained updates make this unnecessary |
| `useReducer` | `signal` + functions | Signals replace reducers |
| `forwardRef` | Not needed | Refs work directly |
| `useImperativeHandle` | Not needed | Use plain object assignment |
| Virtual DOM | Fine-grained reactivity | Only what changes updates |

---

## State Management

### useState to signal

React's `useState` returns `[value, setValue]`. PhilJS signals combine both into one object that you call as a function to read.

```tsx
// React
const [name, setName] = useState('');
const [age, setAge] = useState(0);
const [user, setUser] = useState({ name: '', email: '' });

// Read
console.log(name);
console.log(age);
console.log(user.name);

// Write
setName('John');
setAge(25);
setUser({ ...user, name: 'John' });
setAge(prev => prev + 1);

// PhilJS
const name = signal('');
const age = signal(0);
const user = signal({ name: '', email: '' });

// Read - call the signal as a function
console.log(name());
console.log(age());
console.log(user().name);

// Write - use .set()
name.set('John');
age.set(25);
user.set({ ...user(), name: 'John' });
age.set(prev => prev + 1);  // Updater function works the same
```

### Lazy Initial State

```tsx
// React
const [data, setData] = useState(() => expensiveComputation());

// PhilJS
const data = signal(expensiveComputation());
// Or for deferred initialization:
const data = signal<DataType | null>(null);
// Initialize later
data.set(expensiveComputation());
```

### Reading Without Tracking

Sometimes you need to read a signal without creating a dependency:

```tsx
// PhilJS
const count = signal(0);

effect(() => {
  // This won't re-run when count changes:
  const currentCount = count.peek();
  console.log('Logged once:', currentCount);
});
```

---

## Effects and Lifecycle

### useEffect to effect

The biggest difference: PhilJS effects **automatically track dependencies**. No more dependency arrays!

```tsx
// React - manual dependency tracking
useEffect(() => {
  console.log(`Name: ${name}, Age: ${age}`);
}, [name, age]); // Easy to forget dependencies!

// PhilJS - automatic dependency tracking
effect(() => {
  console.log(`Name: ${name()}, Age: ${age()}`);
}); // Dependencies are tracked automatically
```

### Effect with Cleanup

```tsx
// React
useEffect(() => {
  const timer = setInterval(() => console.log('tick'), 1000);
  return () => clearInterval(timer);
}, []);

// PhilJS
effect(() => {
  const timer = setInterval(() => console.log('tick'), 1000);
  onCleanup(() => clearInterval(timer));
});
```

### Mount Effect (Empty Dependency Array)

```tsx
// React - runs once on mount
useEffect(() => {
  console.log('Mounted');
}, []);

// PhilJS - use onMount for explicit mount behavior
import { onMount } from '@philjs/core';

onMount(() => {
  console.log('Mounted');
});

// Or use effect with no reactive dependencies
effect(() => {
  // This runs once if no signals are accessed
  console.log('Mounted');
});
```

### Multiple Effects

```tsx
// React - you might combine effects
useEffect(() => {
  // Effect 1 logic
}, [dep1]);

useEffect(() => {
  // Effect 2 logic
}, [dep2]);

// PhilJS - same pattern, but cleaner
effect(() => {
  // Effect 1 - only re-runs when dep1 changes
  console.log(dep1());
});

effect(() => {
  // Effect 2 - only re-runs when dep2 changes
  console.log(dep2());
});
```

---

## Computed Values

### useMemo to memo

```tsx
// React
const expensiveValue = useMemo(() => {
  return items.filter(item => item.active).length;
}, [items]);

// PhilJS
const expensiveValue = memo(() => {
  return items().filter(item => item.active).length;
});

// Reading computed values
console.log(expensiveValue()); // Call like a signal
```

### Derived State

```tsx
// React
const [firstName, setFirstName] = useState('');
const [lastName, setLastName] = useState('');
const fullName = useMemo(() => `${firstName} ${lastName}`, [firstName, lastName]);

// PhilJS - cleaner and automatic
const firstName = signal('');
const lastName = signal('');
const fullName = memo(() => `${firstName()} ${lastName()}`);

// Usage
console.log(fullName()); // "John Doe"
```

### useCallback - Not Needed!

In React, `useCallback` prevents function recreation. In PhilJS, this is unnecessary because:

1. Signal references are stable
2. Fine-grained updates mean parent re-renders don't recreate children

```tsx
// React
const handleClick = useCallback(() => {
  setCount(c => c + 1);
}, []);

// PhilJS - just use a regular function
const handleClick = () => count.set(c => c + 1);
// Or inline it directly - no performance penalty
<button onClick={() => count.set(c => c + 1)}>
```

---

## Context

### Creating and Using Context

```tsx
// React
const ThemeContext = createContext('light');

function App() {
  return (
    <ThemeContext.Provider value="dark">
      <Child />
    </ThemeContext.Provider>
  );
}

function Child() {
  const theme = useContext(ThemeContext);
  return <div>{theme}</div>;
}

// PhilJS - same API!
import { createContext, useContext } from '@philjs/core';

const ThemeContext = createContext('light');

function App() {
  return (
    <ThemeContext.Provider value="dark">
      <Child />
    </ThemeContext.Provider>
  );
}

function Child() {
  const theme = useContext(ThemeContext);
  return <div>{theme}</div>;
}
```

### Reactive Context (Signal Context)

PhilJS has a special helper for reactive context:

```tsx
// PhilJS - reactive context with signals
import { createSignalContext } from '@philjs/core';

const CountContext = createSignalContext(0);

function App() {
  return (
    <CountContext.Provider value={10}>
      <Child />
    </CountContext.Provider>
  );
}

function Child() {
  const count = CountContext.useValue(); // Reactive!
  return <div>Count: {count}</div>;
}
```

---

## Refs

### DOM Refs

```tsx
// React
function Form() {
  const inputRef = useRef<HTMLInputElement>(null);

  const focus = () => {
    inputRef.current?.focus();
  };

  return <input ref={inputRef} />;
}

// PhilJS - use callback ref pattern
function Form() {
  let inputRef: HTMLInputElement | null = null;

  const focus = () => {
    inputRef?.focus();
  };

  return <input ref={(el) => inputRef = el} />;
}
```

### Value Refs (Mutable Values)

```tsx
// React
const renderCount = useRef(0);
renderCount.current += 1;

// PhilJS - use signal if you want reactivity
const renderCount = signal(0);

// Or plain variable if you don't need reactivity
let renderCount = 0;
renderCount += 1;
```

---

## JSX Differences

### Overall Similar

PhilJS JSX is almost identical to React JSX:

```tsx
// Both frameworks
<div className="container">
  <h1>Title</h1>
  <button onClick={handleClick}>Click me</button>
</div>
```

### Key Differences

```tsx
// 1. Signal values must be called
// React
<div>{count}</div>

// PhilJS
<div>{count()}</div>

// 2. Event handlers - use onInput for real-time updates
// React
<input onChange={(e) => setValue(e.target.value)} />

// PhilJS - prefer onInput for immediate updates
<input onInput={(e) => value.set(e.target.value)} />

// 3. Conditional rendering - same patterns work
// Both
{condition && <Component />}
{condition ? <A /> : <B />}

// 4. Lists - same pattern
// Both
{items.map(item => <Item key={item.id} {...item} />)}

// PhilJS with signal
{items().map(item => <Item key={item.id} {...item} />)}
```

---

## Routing

### React Router to philjs-router

```tsx
// React Router
import { BrowserRouter, Routes, Route, Link, useNavigate, useParams } from 'react-router-dom';

function App() {
  return (
    <BrowserRouter>
      <nav>
        <Link to="/">Home</Link>
        <Link to="/about">About</Link>
      </nav>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/users/:id" element={<User />} />
      </Routes>
    </BrowserRouter>
  );
}

function User() {
  const { id } = useParams();
  const navigate = useNavigate();
  return <button onClick={() => navigate('/')}>Go Home</button>;
}

// PhilJS Router
import { createAppRouter, Link, useRouter, useRoute, RouterView } from 'philjs-router';

const router = createAppRouter({
  routes: [
    { path: '/', component: Home },
    { path: '/about', component: About },
    { path: '/users/:id', component: User },
  ],
});

function App() {
  return (
    <router.Provider>
      <nav>
        <Link href="/">Home</Link>
        <Link href="/about">About</Link>
      </nav>
      <RouterView />
    </router.Provider>
  );
}

function User() {
  const route = useRoute();
  const { navigate } = useRouter();
  const id = route.params.id;
  return <button onClick={() => navigate('/')}>Go Home</button>;
}
```

### Data Loading (React Router v6.4+)

```tsx
// React Router loaders
const router = createBrowserRouter([
  {
    path: '/users/:id',
    element: <User />,
    loader: async ({ params }) => {
      return fetch(`/api/users/${params.id}`);
    },
  },
]);

function User() {
  const user = useLoaderData();
  return <div>{user.name}</div>;
}

// PhilJS Router - similar pattern
import { useLoaderData } from 'philjs-router';

const routes = [
  {
    path: '/users/:id',
    component: User,
    loader: async ({ params }) => {
      return fetch(`/api/users/${params.id}`).then(r => r.json());
    },
  },
];

function User() {
  const user = useLoaderData<UserType>();
  return <div>{user.name}</div>;
}
```

---

## State Management Libraries

### Redux to Signals

```tsx
// Redux
// store.ts
const counterSlice = createSlice({
  name: 'counter',
  initialState: { value: 0 },
  reducers: {
    increment: state => { state.value += 1 },
    decrement: state => { state.value -= 1 },
  },
});

// Component
function Counter() {
  const count = useSelector(state => state.counter.value);
  const dispatch = useDispatch();

  return (
    <button onClick={() => dispatch(increment())}>
      Count: {count}
    </button>
  );
}

// PhilJS - just use signals!
// store.ts
export const count = signal(0);
export const increment = () => count.set(c => c + 1);
export const decrement = () => count.set(c => c - 1);

// Component
import { count, increment } from './store';

function Counter() {
  return (
    <button onClick={increment}>
      Count: {count()}
    </button>
  );
}
```

### Zustand to Signals

```tsx
// Zustand
const useStore = create((set) => ({
  count: 0,
  increment: () => set((state) => ({ count: state.count + 1 })),
}));

function Counter() {
  const { count, increment } = useStore();
  return <button onClick={increment}>{count}</button>;
}

// PhilJS - create a store with signals
// store.ts
const count = signal(0);

export const useStore = () => ({
  count: count(),
  increment: () => count.set(c => c + 1),
});

// Or even simpler - just export signals directly
export { count };
export const increment = () => count.set(c => c + 1);
```

### Jotai/Recoil to Signals

Jotai and Recoil are already atom-based like signals:

```tsx
// Jotai
const countAtom = atom(0);
const doubledAtom = atom((get) => get(countAtom) * 2);

function Counter() {
  const [count, setCount] = useAtom(countAtom);
  const doubled = useAtomValue(doubledAtom);
}

// PhilJS - almost identical concept
const count = signal(0);
const doubled = memo(() => count() * 2);

function Counter() {
  return (
    <div>
      Count: {count()}
      Doubled: {doubled()}
      <button onClick={() => count.set(c => c + 1)}>+</button>
    </div>
  );
}
```

---

## Common Patterns

### Form Handling

```tsx
// React
function Form() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [errors, setErrors] = useState({});

  const handleSubmit = (e) => {
    e.preventDefault();
    // validation...
  };

  return (
    <form onSubmit={handleSubmit}>
      <input value={name} onChange={e => setName(e.target.value)} />
      <input value={email} onChange={e => setEmail(e.target.value)} />
    </form>
  );
}

// PhilJS
function Form() {
  const name = signal('');
  const email = signal('');
  const errors = signal({});

  const handleSubmit = (e: Event) => {
    e.preventDefault();
    // validation...
  };

  return (
    <form onSubmit={handleSubmit}>
      <input value={name()} onInput={e => name.set(e.target.value)} />
      <input value={email()} onInput={e => email.set(e.target.value)} />
    </form>
  );
}

// PhilJS with useForm helper
import { useForm, validators as v } from '@philjs/core';

function Form() {
  const form = useForm({
    name: { initial: '', validate: [v.required()] },
    email: { initial: '', validate: [v.required(), v.email()] },
  });

  return (
    <form onSubmit={form.handleSubmit(data => console.log(data))}>
      <input {...form.field('name')} />
      <input {...form.field('email')} />
    </form>
  );
}
```

### Async Data Fetching

```tsx
// React with useEffect
function UserProfile({ userId }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/users/${userId}`)
      .then(r => r.json())
      .then(setUser)
      .catch(setError)
      .finally(() => setLoading(false));
  }, [userId]);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;
  return <div>{user.name}</div>;
}

// PhilJS with resource
import { resource, signal } from '@philjs/core';

function UserProfile(props: { userId: number }) {
  const user = resource(async () => {
    const res = await fetch(`/api/users/${props.userId}`);
    return res.json();
  });

  return (
    <div>
      {user.loading() && <div>Loading...</div>}
      {user.error() && <div>Error: {user.error().message}</div>}
      {!user.loading() && !user.error() && <div>{user().name}</div>}
    </div>
  );
}
```

### Modal/Dialog Pattern

```tsx
// React
function App() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button onClick={() => setIsOpen(true)}>Open</button>
      {isOpen && (
        <Modal onClose={() => setIsOpen(false)}>
          Content
        </Modal>
      )}
    </>
  );
}

// PhilJS - same pattern
function App() {
  const isOpen = signal(false);

  return (
    <>
      <button onClick={() => isOpen.set(true)}>Open</button>
      {isOpen() && (
        <Modal onClose={() => isOpen.set(false)}>
          Content
        </Modal>
      )}
    </>
  );
}
```

---

## Codemod Examples

### Automated Transformations

Use the PhilJS migration CLI:

```bash
# Analyze your project
npx philjs-migrate --from react --source ./src --analyze-only

# Dry run to see changes
npx philjs-migrate --from react --source ./src --dry-run

# Run migration
npx philjs-migrate --from react --source ./src --output ./src-migrated
```

### Manual Codemod Patterns

```typescript
// Transform useState
// Before: const [count, setCount] = useState(0);
// After:  const count = signal(0);

// Transform useEffect with deps
// Before: useEffect(() => { ... }, [dep1, dep2]);
// After:  effect(() => { ... });

// Transform useMemo
// Before: const value = useMemo(() => expensive(), [dep]);
// After:  const value = memo(() => expensive());

// Transform state access in JSX
// Before: <div>{count}</div>
// After:  <div>{count()}</div>

// Transform setState calls
// Before: setCount(count + 1);
// After:  count.set(count() + 1);

// Before: setCount(c => c + 1);
// After:  count.set(c => c + 1);  // Same!
```

---

## Step-by-Step Migration

### 1. Install Dependencies

```bash
npm install @philjs/core philjs-router
npm uninstall react react-dom @types/react @types/react-dom
```

### 2. Update Configuration

```json
// tsconfig.json
{
  "compilerOptions": {
    "jsx": "react-jsx",
    "jsxImportSource": "@philjs/core"
  }
}
```

### 3. Update Entry Point

```tsx
// Before (React)
import { createRoot } from 'react-dom/client';
import App from './App';

createRoot(document.getElementById('root')!).render(<App />);

// After (PhilJS)
import { render } from '@philjs/core';
import App from './App';

render(() => <App />, document.getElementById('root')!);
```

### 4. Migrate Components One at a Time

Start with leaf components (no children) and work up:

1. Change imports from `react` to `@philjs/core`
2. Convert `useState` to `signal`
3. Convert `useEffect` to `effect`
4. Convert `useMemo` to `memo`
5. Remove `useCallback` (not needed)
6. Update JSX to call signals: `{count()}` instead of `{count}`
7. Update event handlers: `.set()` instead of `setX()`

### 5. Run Tests

```bash
npm test
```

### 6. Build and Verify

```bash
npm run build
npm run dev
```

---

## Troubleshooting

### "Cannot read property of undefined"

Usually means you forgot to call a signal:

```tsx
// Wrong
<div>{user.name}</div>  // user is a signal

// Right
<div>{user().name}</div>  // Call the signal first
```

### Effect runs too often

Check if you're accessing signals you don't need:

```tsx
effect(() => {
  // This runs whenever ANY signal read here changes
  console.log(a(), b(), c());
});

// If you only want to react to 'a':
effect(() => {
  const aValue = a();
  // Use untrack for others if needed
  const bValue = untrack(() => b());
  console.log(aValue, bValue);
});
```

### Component not updating

Make sure you're calling signals in JSX:

```tsx
// Won't update:
const value = count();  // Value captured once
return <div>{value}</div>;

// Will update:
return <div>{count()}</div>;  // Called during render
```

### TypeScript Errors

Make sure types are correct:

```tsx
// Signal type
const count = signal<number>(0);
const user = signal<User | null>(null);

// Accessing
const n: number = count();
const u: User | null = user();
```

---

## Need Help?

- [PhilJS Documentation](https://philjs.dev)
- [Discord Community](https://discord.gg/philjs)
- [GitHub Issues](https://github.com/philjs/philjs/issues)
- Run `npx philjs-migrate --help` for CLI options
