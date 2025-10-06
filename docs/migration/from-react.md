# Migrating from React

Complete guide for migrating React applications to PhilJS.

## Overview

PhilJS and React share similar concepts but PhilJS uses fine-grained reactivity instead of virtual DOM. This guide will help you understand the differences and migrate your React applications.

## Key Differences

| Concept | React | PhilJS |
|---------|-------|--------|
| Reactivity | Virtual DOM | Fine-grained reactivity |
| State | `useState()` | `signal()` |
| Derived State | `useMemo()` | `memo()` |
| Side Effects | `useEffect()` | `effect()` |
| Context | `useContext()` | `useContext()` |
| Component Re-render | Entire component | Only affected parts |

## State Management

### useState → signal()

**React:**
```tsx
import { useState } from 'react';

function Counter() {
  const [count, setCount] = useState(0);

  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={() => setCount(count + 1)}>
        Increment
      </button>
    </div>
  );
}
```

**PhilJS:**
```tsx
import { signal } from 'philjs-core';

function Counter() {
  const count = signal(0);

  return (
    <div>
      <p>Count: {count()}</p>
      <button onClick={() => count.set(count() + 1)}>
        Increment
      </button>
    </div>
  );
}
```

**Key differences:**
- Read with `count()` instead of `count`
- Update with `count.set()` instead of `setCount()`
- No need for dependency arrays

### Functional Updates

**React:**
```tsx
setCount(prev => prev + 1);
```

**PhilJS:**
```tsx
count.set(prev => prev + 1);
```

### Multiple State Variables

**React:**
```tsx
const [name, setName] = useState('');
const [age, setAge] = useState(0);
const [email, setEmail] = useState('');
```

**PhilJS:**
```tsx
const name = signal('');
const age = signal(0);
const email = signal('');
```

## Derived State

### useMemo → memo()

**React:**
```tsx
const doubled = useMemo(() => count * 2, [count]);
const quadrupled = useMemo(() => doubled * 2, [doubled]);
```

**PhilJS:**
```tsx
const doubled = memo(() => count() * 2);
const quadrupled = memo(() => doubled() * 2);
// No dependency arrays needed!
```

## Side Effects

### useEffect → effect()

**React:**
```tsx
useEffect(() => {
  console.log('Count changed:', count);
}, [count]);

useEffect(() => {
  const id = setInterval(() => {
    console.log('Tick');
  }, 1000);

  return () => clearInterval(id);
}, []);
```

**PhilJS:**
```tsx
effect(() => {
  console.log('Count changed:', count());
});

effect(() => {
  const id = setInterval(() => {
    console.log('Tick');
  }, 1000);

  return () => clearInterval(id);
});
// No dependency arrays!
```

**Key differences:**
- No dependency arrays
- Automatic dependency tracking
- Same cleanup pattern

### Effect Dependencies

**React:**
```tsx
useEffect(() => {
  fetchUser(userId);
}, [userId]); // Must list all dependencies
```

**PhilJS:**
```tsx
effect(() => {
  fetchUser(userId());
}); // Auto-tracks dependencies
```

## Context

### React Context → PhilJS Context

**React:**
```tsx
import { createContext, useContext } from 'react';

const ThemeContext = createContext('light');

function App() {
  return (
    <ThemeContext.Provider value="dark">
      <ThemedButton />
    </ThemeContext.Provider>
  );
}

function ThemedButton() {
  const theme = useContext(ThemeContext);
  return <button className={theme}>Button</button>;
}
```

**PhilJS:**
```tsx
import { createContext, useContext } from 'philjs-core';

const ThemeContext = createContext('light');

function App() {
  return (
    <ThemeContext.Provider value="dark">
      <ThemedButton />
    </ThemeContext.Provider>
  );
}

function ThemedButton() {
  const theme = useContext(ThemeContext);
  return <button className={theme}>Button</button>;
}
```

**Almost identical!** The main difference is signals for reactive values:

**React:**
```tsx
const [theme, setTheme] = useState('light');

<ThemeContext.Provider value={{ theme, setTheme }}>
```

**PhilJS:**
```tsx
const theme = signal('light');

<ThemeContext.Provider value={{ theme, setTheme: theme.set }}>
```

## Component Patterns

### Class Components → Functional Components

React class components should be converted to PhilJS functional components.

**React Class:**
```tsx
class Counter extends React.Component {
  state = { count: 0 };

  increment = () => {
    this.setState({ count: this.state.count + 1 });
  };

  componentDidMount() {
    console.log('Mounted');
  }

  componentWillUnmount() {
    console.log('Unmounted');
  }

  render() {
    return (
      <div>
        <p>Count: {this.state.count}</p>
        <button onClick={this.increment}>Increment</button>
      </div>
    );
  }
}
```

**PhilJS:**
```tsx
function Counter() {
  const count = signal(0);

  effect(() => {
    console.log('Mounted');

    return () => {
      console.log('Unmounted');
    };
  });

  return (
    <div>
      <p>Count: {count()}</p>
      <button onClick={() => count.set(count() + 1)}>
        Increment
      </button>
    </div>
  );
}
```

### Higher-Order Components → Composition

**React HOC:**
```tsx
function withLoading(Component) {
  return function WithLoadingComponent(props) {
    const [loading, setLoading] = useState(true);

    useEffect(() => {
      fetchData().then(() => setLoading(false));
    }, []);

    if (loading) return <div>Loading...</div>;

    return <Component {...props} />;
  };
}

const EnhancedComponent = withLoading(MyComponent);
```

**PhilJS:**
```tsx
function withLoading<P>(Component: (props: P) => JSX.Element) {
  return (props: P) => {
    const loading = signal(true);

    effect(async () => {
      await fetchData();
      loading.set(false);
    });

    if (loading()) return <div>Loading...</div>;

    return <Component {...props} />;
  };
}

const EnhancedComponent = withLoading(MyComponent);
```

## Routing

### React Router → PhilJS Router

**React Router:**
```tsx
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
        <Route path="/about" element={<About />} />
        <Route path="/users/:id" element={<User />} />
      </Routes>
    </BrowserRouter>
  );
}

function User() {
  const { id } = useParams();
  return <div>User ID: {id}</div>;
}
```

**PhilJS Router:**
```tsx
import { Router, Route, Link, useParams } from 'philjs-router';

function App() {
  return (
    <Router>
      <nav>
        <Link to="/">Home</Link>
        <Link to="/about">About</Link>
      </nav>

      <Route path="/" component={Home} />
      <Route path="/about" component={About} />
      <Route path="/users/:id" component={User} />
    </Router>
  );
}

function User() {
  const { id } = useParams();
  return <div>User ID: {id}</div>;
}
```

**Key differences:**
- `<Routes>` → `<Router>`
- `element={<Component />}` → `component={Component}`
- Same Link and useParams API

## Data Fetching

### React Query/SWR → PhilJS Patterns

**React with React Query:**
```tsx
import { useQuery } from '@tanstack/react-query';

function Users() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['users'],
    queryFn: fetchUsers
  });

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <ul>
      {data.map(user => (
        <li key={user.id}>{user.name}</li>
      ))}
    </ul>
  );
}
```

**PhilJS:**
```tsx
function Users() {
  const data = signal(null);
  const loading = signal(true);
  const error = signal(null);

  effect(async () => {
    try {
      const users = await fetchUsers();
      data.set(users);
    } catch (err) {
      error.set(err);
    } finally {
      loading.set(false);
    }
  });

  if (loading()) return <div>Loading...</div>;
  if (error()) return <div>Error: {error().message}</div>;

  return (
    <ul>
      {data().map(user => (
        <li key={user.id}>{user.name}</li>
      ))}
    </ul>
  );
}
```

## Forms

### React Hook Form → PhilJS Forms

**React Hook Form:**
```tsx
import { useForm } from 'react-hook-form';

function LoginForm() {
  const { register, handleSubmit, formState: { errors } } = useForm();

  const onSubmit = (data) => {
    console.log(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input {...register('email', { required: true })} />
      {errors.email && <span>Email is required</span>}

      <input type="password" {...register('password', { required: true })} />
      {errors.password && <span>Password is required</span>}

      <button type="submit">Login</button>
    </form>
  );
}
```

**PhilJS:**
```tsx
function LoginForm() {
  const email = signal('');
  const password = signal('');
  const errors = signal({});

  const handleSubmit = (e) => {
    e.preventDefault();

    const newErrors = {};

    if (!email()) newErrors.email = 'Email is required';
    if (!password()) newErrors.password = 'Password is required';

    if (Object.keys(newErrors).length > 0) {
      errors.set(newErrors);
      return;
    }

    console.log({ email: email(), password: password() });
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        value={email()}
        onInput={(e) => email.set(e.target.value)}
      />
      {errors().email && <span>{errors().email}</span>}

      <input
        type="password"
        value={password()}
        onInput={(e) => password.set(e.target.value)}
      />
      {errors().password && <span>{errors().password}</span>}

      <button type="submit">Login</button>
    </form>
  );
}
```

## Performance

### React.memo → Automatic

React requires explicit memoization:

**React:**
```tsx
const ExpensiveComponent = React.memo(({ data }) => {
  return <div>{/* expensive rendering */}</div>;
});
```

**PhilJS:**
```tsx
function ExpensiveComponent({ data }: { data: any }) {
  return <div>{/* expensive rendering */}</div>;
}
// Automatically optimized with fine-grained reactivity!
```

### useCallback → Not Needed

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
};
// No memoization needed!
```

## Migration Strategy

### 1. Incremental Migration

You can migrate React apps incrementally:

1. **Start with new features in PhilJS**
2. **Migrate components one at a time**
3. **Use adapters if needed**

### 2. Side-by-Side Comparison

Create a mapping document:

```typescript
// migration-map.ts
export const componentMap = {
  // React → PhilJS
  'useState': 'signal',
  'useMemo': 'memo',
  'useEffect': 'effect',
  'useContext': 'useContext',
  'useCallback': 'not needed',
  'React.memo': 'automatic',
};
```

### 3. Automated Conversion

Use search and replace for common patterns:

```bash
# useState → signal
s/const \[(\w+), set(\w+)\] = useState/const $1 = signal/g

# count → count()
s/\{count\}/\{count()\}/g

# setCount → count.set
s/setCount/count.set/g
```

## Common Pitfalls

### Don't Forget Function Calls

```tsx
// ❌ React habit
<p>Count: {count}</p>

// ✅ PhilJS - call the signal
<p>Count: {count()}</p>
```

### No Dependency Arrays

```tsx
// ❌ React habit
effect(() => {
  console.log(count());
}, [count]);

// ✅ PhilJS - no dependencies needed
effect(() => {
  console.log(count());
});
```

### Batching Updates

```tsx
// ❌ Multiple updates
count.set(1);
name.set('Alice');
active.set(true);

// ✅ Batch for performance
batch(() => {
  count.set(1);
  name.set('Alice');
  active.set(true);
});
```

## Summary

PhilJS migration from React:

✅ Similar API surface
✅ No virtual DOM
✅ No dependency arrays
✅ Automatic optimization
✅ Fine-grained reactivity
✅ Better performance

Most React code translates directly to PhilJS with minor syntax changes!

---

**Next:** [Migrating from Vue →](./from-vue.md)
